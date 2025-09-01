/**
 * Template Categories API Routes
 * Handles retrieval of workout template categories
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { workoutPlanRepository } from '@/lib/repositories/workout-plan.repository';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';

/**
 * GET /api/workouts/templates/categories
 * Get available workout template categories
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
        `template_categories:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Template categories API rate limit exceeded',
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

    // Get template categories from the database
    const categories = await getTemplateCategories();

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: categories,
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
        total: categories.length,
      },
    });
  } catch (error) {
    console.error('Error fetching template categories:', error);
    const authResult = await auth();
    await logAuthEvent(
      'template_categories_access_failed',
      'security',
      'Template categories access failed',
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
async function getTemplateCategories(): Promise<
  Array<{
    id: string;
    name: string;
    description?: string;
    count: number;
  }>
> {
  try {
    // Get distinct template categories from the database
    const templates = await workoutPlanRepository.findMany(
      { is_template: true, status: 'active' },
      { cacheable: true, cacheKey: 'template_categories_detailed' }
    );

    // Group by category and count templates
    const categoryMap = new Map<string, number>();
    
    templates.forEach((template) => {
      if (template.templateCategory) {
        const currentCount = categoryMap.get(template.templateCategory) || 0;
        categoryMap.set(template.templateCategory, currentCount + 1);
      }
    });

    // Create category objects with metadata
    const categoryInfo: Record<string, { name: string; description: string }> = {
      strength: {
        name: 'Strength Training',
        description: 'Build muscle and increase overall strength',
      },
      cardio: {
        name: 'Cardiovascular',
        description: 'Improve heart health and endurance',
      },
      flexibility: {
        name: 'Flexibility & Mobility',
        description: 'Enhance range of motion and reduce injury risk',
      },
      powerlifting: {
        name: 'Powerlifting',
        description: 'Focus on squat, bench press, and deadlift',
      },
      bodybuilding: {
        name: 'Bodybuilding',
        description: 'Muscle building and physique development',
      },
      functional: {
        name: 'Functional Fitness',
        description: 'Real-world movement patterns and everyday strength',
      },
      sports: {
        name: 'Sports Training',
        description: 'Sport-specific conditioning and skill development',
      },
      rehabilitation: {
        name: 'Rehabilitation',
        description: 'Recovery and injury prevention focused workouts',
      },
      hiit: {
        name: 'HIIT',
        description: 'High-intensity interval training for quick results',
      },
      yoga: {
        name: 'Yoga & Mindfulness',
        description: 'Mind-body connection and stress relief',
      },
    };

    // Convert map to array with additional metadata
    const categoriesArray = Array.from(categoryMap.entries()).map(([id, count]) => ({
      id,
      name: categoryInfo[id]?.name || id.charAt(0).toUpperCase() + id.slice(1),
      description: categoryInfo[id]?.description,
      count,
    }));

    // Sort by count (most templates first) then by name
    categoriesArray.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name);
    });

    return categoriesArray;
  } catch (error) {
    console.warn('Error fetching template categories from database:', error);
    
    // Return fallback categories if database query fails
    const fallbackCategories = [
      'strength',
      'cardio',
      'flexibility',
      'powerlifting',
      'bodybuilding',
      'functional',
      'sports',
      'rehabilitation',
    ];

    return fallbackCategories.map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      description: undefined,
      count: 0,
    }));
  }
}

/**
 * OPTIONS /api/workouts/templates/categories
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}