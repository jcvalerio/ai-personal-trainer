/**
 * Exercise Library API Routes
 * Handles CRUD operations for exercises
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { exerciseRepository } from '@/lib/repositories/exercise.repository';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';
import {
  createExerciseSchema,
  exerciseFiltersSchema,
  paginationSchema,
} from '@/lib/validation/workout-schemas';

/**
 * GET /api/exercises
 * Get exercises with filtering and pagination
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
        `exercises:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Exercise library API rate limit exceeded',
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
      filters = exerciseFiltersSchema.parse({
        exerciseType: queryParams.exerciseType,
        difficultyLevel: queryParams.difficultyLevel,
        muscleGroup: queryParams.muscleGroup,
        equipmentRequired: queryParams.equipmentRequired 
          ? JSON.parse(queryParams.equipmentRequired) 
          : undefined,
        search: queryParams.search,
        isVerified: queryParams.isVerified === 'true',
        isPublic: queryParams.isPublic === 'true',
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
      orderBy: paginationParams.sortBy || 'name',
      orderDirection: paginationParams.sortOrder || 'ASC',
      limit: paginationParams.limit || 50,
      offset: ((paginationParams.page || 1) - 1) * (paginationParams.limit || 50),
      cacheable: true,
    };

    // Build query based on filters
    let exercises;
    if (filters.search) {
      exercises = await exerciseRepository.search(filters.search, options);
    } else if (filters.muscleGroup) {
      exercises = await exerciseRepository.findByMuscleGroup(filters.muscleGroup, options);
    } else if (filters.exerciseType) {
      exercises = await exerciseRepository.findByType(filters.exerciseType, options);
    } else if (filters.difficultyLevel) {
      exercises = await exerciseRepository.findByDifficultyLevel(filters.difficultyLevel, options);
    } else if (filters.equipmentRequired?.length) {
      exercises = await exerciseRepository.findByEquipment(filters.equipmentRequired, options);
    } else if (filters.isVerified !== undefined && filters.isPublic !== undefined) {
      // Handle both isVerified and isPublic being set
      if (filters.isVerified && filters.isPublic) {
        // Find exercises that are both verified and public
        exercises = await exerciseRepository.findMany({ 
          is_verified: true, 
          is_public: true,
          is_active: true 
        }, options);
      } else if (filters.isVerified) {
        exercises = await exerciseRepository.findVerified(options);
      } else if (filters.isPublic) {
        exercises = await exerciseRepository.findPublic(options);
      } else {
        exercises = await exerciseRepository.findMany({ is_active: true }, options);
      }
    } else if (filters.isVerified !== undefined) {
      exercises = filters.isVerified 
        ? await exerciseRepository.findVerified(options)
        : await exerciseRepository.findMany({ is_active: true }, options);
    } else if (filters.isPublic !== undefined) {
      exercises = filters.isPublic
        ? await exerciseRepository.findPublic(options)
        : await exerciseRepository.findMany({ is_active: true }, options);
    } else {
      exercises = await exerciseRepository.findPublic(options);
    }

    // Get total count for pagination
    const totalCount = await exerciseRepository.count();
    const totalPages = Math.ceil(totalCount / (paginationParams.limit || 50));

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: exercises,
      pagination: {
        page: paginationParams.page || 1,
        limit: paginationParams.limit || 50,
        total: totalCount,
        totalPages,
        hasNext: (paginationParams.page || 1) < totalPages,
        hasPrev: (paginationParams.page || 1) > 1,
      },
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    const authResult = await auth();
    await logAuthEvent(
      'exercises_access_failed',
      'security',
      'Exercise library access failed',
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
 * POST /api/exercises
 * Create a new exercise
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
        `create_exercise:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Exercise creation rate limit exceeded',
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
      validatedData = createExerciseSchema.parse(body);
    } catch (error) {
      await logAuthEvent(
        'exercise_validation_failed',
        'security',
        'Invalid exercise data',
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

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create exercise
    const exerciseData = {
      ...validatedData,
      slug,
      createdBy: userId,
      organizationId: orgId || userProfile.organizationId,
      isVerified: false, // New exercises start unverified
      isActive: true,
    };

    const exercise = await exerciseRepository.create(exerciseData);

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: exercise,
        meta: {
          responseTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating exercise:', error);
    const authResult = await auth();
    await logAuthEvent(
      'exercise_creation_failed',
      'security',
      'Exercise creation failed',
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