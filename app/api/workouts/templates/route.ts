/**
 * Workout Template API Routes
 * Handles CRUD operations for workout templates
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { workoutPlanRepository } from '@/lib/repositories/workout-plan.repository';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';
import {
  createWorkoutPlanSchema,
  workoutPlanFiltersSchema,
  paginationSchema,
} from '@/lib/validation/workout-schemas';

// Template-specific filters schema
const templateFiltersSchema = workoutPlanFiltersSchema.extend({
  templateCategory: z.string().optional(),
  isFeatured: z.boolean().optional(),
  targetFitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

/**
 * GET /api/workouts/templates
 * Get workout templates with filtering and pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authentication
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (
      !RATE_LIMITS.PROFILE_UPDATE.isAllowed(
        `workout_templates:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Workout templates API rate limit exceeded',
        userId
      );
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // Get user profile for context
    const userProfile = await getUserProfileByClerkId(userId);
    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User profile not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Parse pagination params
    let paginationParams;
    try {
      paginationParams = paginationSchema.parse({
        page: queryParams.page ? parseInt(queryParams.page) : undefined,
        limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pagination parameters',
          code: 'VALIDATION_ERROR',
          details: error instanceof z.ZodError ? error.issues : undefined,
        },
        { status: 400 }
      );
    }

    // Parse filters
    let filters;
    try {
      filters = templateFiltersSchema.parse({
        isTemplate: true, // Force templates only
        templateCategory: queryParams.templateCategory,
        targetFitnessLevel: queryParams.targetFitnessLevel,
        isFeatured: queryParams.featured === 'true',
        search: queryParams.search,
        status: 'active', // Only active templates
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid filter parameters',
          code: 'VALIDATION_ERROR',
          details: error instanceof z.ZodError ? error.issues : undefined,
        },
        { status: 400 }
      );
    }

    // Query options
    const options = {
      orderBy: paginationParams.sortBy || 'created_at',
      orderDirection: paginationParams.sortOrder || 'DESC',
      limit: paginationParams.limit || 20,
      offset: ((paginationParams.page || 1) - 1) * (paginationParams.limit || 20),
      cacheable: true,
      cacheKey: `templates:${JSON.stringify(filters)}:${paginationParams.page || 1}`,
    };

    // Get templates based on filters
    let templates;
    if (filters.isFeatured) {
      templates = await workoutPlanRepository.findFeaturedTemplates(options);
    } else if (queryParams.public !== 'false') {
      templates = await workoutPlanRepository.findPublicTemplates(options);
    } else {
      templates = await workoutPlanRepository.findTemplates(options);
    }

    // Apply search filter if provided
    if (filters.search) {
      const searchResults = await workoutPlanRepository.search(filters.search, options);
      templates = searchResults.filter(plan => plan.isTemplate);
    }

    // Apply additional filters
    if (filters.templateCategory) {
      templates = templates.filter(t => t.templateCategory === filters.templateCategory);
    }

    if (filters.targetFitnessLevel) {
      templates = templates.filter(t => t.targetFitnessLevel === filters.targetFitnessLevel);
    }

    // Get total count for pagination
    const totalCount = await workoutPlanRepository.count({ is_template: true, status: 'active' });
    const totalPages = Math.ceil(totalCount / (paginationParams.limit || 20));

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: templates,
      pagination: {
        page: paginationParams.page || 1,
        limit: paginationParams.limit || 20,
        total: totalCount,
        totalPages,
        hasNext: (paginationParams.page || 1) < totalPages,
        hasPrev: (paginationParams.page || 1) > 1,
      },
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
        categories: await getTemplateCategories(), // Helper to get available categories
      },
    });
  } catch (error) {
    console.error('Error fetching workout templates:', error);
    const authResult = await auth();
    await logAuthEvent(
      'workout_templates_access_failed',
      'security',
      'Workout templates access failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { error: (error as Error).message }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workouts/templates
 * Create a new workout template
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authentication
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate limiting for creation (more restrictive)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (
      !RATE_LIMITS.PROFILE_UPDATE.isAllowed(
        `create_workout_template:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Workout template creation rate limit exceeded',
        userId
      );
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // Get user profile for context
    const userProfile = await getUserProfileByClerkId(userId);
    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User profile not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    let validatedData;
    try {
      // Ensure it's marked as a template
      const templateData = {
        ...body,
        isTemplate: true,
        status: 'active',
        isPublic: body.isPublic ?? true, // Templates are public by default
      };

      validatedData = createWorkoutPlanSchema.parse(templateData);
    } catch (error) {
      await logAuthEvent(
        'workout_template_validation_failed',
        'security',
        'Invalid workout template data',
        userId,
        orgId || undefined,
        { errors: error instanceof z.ZodError ? error.issues : undefined }
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error instanceof z.ZodError ? error.issues : undefined,
        },
        { status: 400 }
      );
    }

    // Create template data
    const templateCreateData = {
      ...validatedData,
      userId,
      organizationId: orgId || userProfile.organizationId,
      version: 1,
      isActive: true,
    };

    // Create workout template using the repository
    const template = await workoutPlanRepository.create(templateCreateData);

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: template,
        meta: {
          responseTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workout template:', error);
    const authResult = await auth();
    await logAuthEvent(
      'workout_template_creation_failed',
      'security',
      'Workout template creation failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { error: (error as Error).message }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get available template categories
 */
async function getTemplateCategories(): Promise<string[]> {
  try {
    // Get distinct template categories from the database
    const categories = await workoutPlanRepository.findMany(
      { is_template: true, status: 'active' },
      { cacheable: true, cacheKey: 'template_categories' }
    );

    const uniqueCategories = [...new Set(
      categories
        .map(t => t.templateCategory)
        .filter(Boolean)
    )];

    return uniqueCategories as string[];
  } catch (error) {
    console.warn('Error fetching template categories:', error);
    return [
      'strength',
      'cardio',
      'flexibility',
      'powerlifting',
      'bodybuilding',
      'functional',
      'sports',
      'rehabilitation',
    ];
  }
}