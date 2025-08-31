/**
 * Exercise Search API Routes
 * Advanced search functionality for exercises
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { exerciseRepository } from '@/lib/repositories/exercise.repository';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';
import {
  exerciseFiltersSchema,
  paginationSchema,
} from '@/lib/validation/workout-schemas';

// Advanced search schema
const exerciseSearchSchema = z.object({
  query: z.string().min(2).max(100).trim(),
  exerciseType: z.enum(['strength', 'cardio', 'flexibility', 'sports']).optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  muscleGroups: z.array(z.string()).max(10).optional(),
  equipmentRequired: z.array(z.string().uuid()).max(20).optional(),
  durationRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  isVerified: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

/**
 * GET /api/exercises/search?q=query&type=strength&difficulty=beginner
 * Advanced exercise search with multiple filters
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
        `exercise_search:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Exercise search API rate limit exceeded',
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

    // Parse search params
    let searchData;
    try {
      searchData = exerciseSearchSchema.parse({
        query: queryParams.q || queryParams.query,
        exerciseType: queryParams.type || queryParams.exerciseType,
        difficultyLevel: queryParams.difficulty || queryParams.difficultyLevel,
        muscleGroups: queryParams.muscleGroups 
          ? JSON.parse(queryParams.muscleGroups) 
          : undefined,
        equipmentRequired: queryParams.equipment 
          ? JSON.parse(queryParams.equipment) 
          : undefined,
        durationRange: queryParams.duration 
          ? JSON.parse(queryParams.duration) 
          : undefined,
        isVerified: queryParams.verified === 'true',
        isPublic: queryParams.public !== 'false', // Default to public
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search parameters',
          code: 'VALIDATION_ERROR',
          details: error instanceof z.ZodError ? error.issues : undefined,
        },
        { status: 400 }
      );
    }

    // Parse pagination params
    let paginationParams;
    try {
      paginationParams = paginationSchema.parse({
        page: queryParams.page ? parseInt(queryParams.page) : undefined,
        limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
        sortBy: queryParams.sortBy || 'name',
        sortOrder: queryParams.sortOrder || 'ASC',
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

    // Build query options
    const options = {
      orderBy: paginationParams.sortBy,
      orderDirection: paginationParams.sortOrder,
      limit: paginationParams.limit || 25,
      offset: ((paginationParams.page || 1) - 1) * (paginationParams.limit || 25),
      cacheable: true,
      cacheKey: `exercise_search:${JSON.stringify(searchData)}:${paginationParams.page || 1}`,
    };

    // Perform search
    let exercises = await exerciseRepository.search(searchData.query, options);

    // Apply additional filters after search
    if (searchData.exerciseType) {
      exercises = exercises.filter(e => e.exerciseType === searchData.exerciseType);
    }
    
    if (searchData.difficultyLevel) {
      exercises = exercises.filter(e => e.difficultyLevel === searchData.difficultyLevel);
    }

    if (searchData.muscleGroups?.length) {
      exercises = exercises.filter(e => 
        searchData.muscleGroups!.some(mg => 
          e.primaryMuscleGroups.includes(mg) || 
          e.secondaryMuscleGroups.includes(mg)
        )
      );
    }

    if (searchData.equipmentRequired?.length) {
      exercises = exercises.filter(e => 
        searchData.equipmentRequired!.some(eq => 
          e.equipmentRequired.includes(eq) || 
          e.equipmentOptional.includes(eq)
        )
      );
    }

    if (searchData.durationRange) {
      if (searchData.durationRange.min !== undefined) {
        exercises = exercises.filter(e => 
          e.defaultDurationSeconds === undefined || 
          e.defaultDurationSeconds >= searchData.durationRange!.min!
        );
      }
      if (searchData.durationRange.max !== undefined) {
        exercises = exercises.filter(e => 
          e.defaultDurationSeconds === undefined || 
          e.defaultDurationSeconds <= searchData.durationRange!.max!
        );
      }
    }

    if (searchData.isVerified !== undefined) {
      exercises = exercises.filter(e => e.isVerified === searchData.isVerified);
    }

    if (searchData.isPublic !== undefined) {
      exercises = exercises.filter(e => e.isPublic === searchData.isPublic);
    }

    // Get total count for pagination (approximated from filtered results)
    const totalCount = exercises.length;
    const totalPages = Math.ceil(totalCount / (paginationParams.limit || 25));

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: exercises,
      pagination: {
        page: paginationParams.page || 1,
        limit: paginationParams.limit || 25,
        total: totalCount,
        totalPages,
        hasNext: (paginationParams.page || 1) < totalPages,
        hasPrev: (paginationParams.page || 1) > 1,
      },
      search: {
        query: searchData.query,
        filters: {
          exerciseType: searchData.exerciseType,
          difficultyLevel: searchData.difficultyLevel,
          muscleGroups: searchData.muscleGroups,
          equipmentRequired: searchData.equipmentRequired,
          durationRange: searchData.durationRange,
          isVerified: searchData.isVerified,
          isPublic: searchData.isPublic,
        },
      },
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
        suggestions: totalCount === 0 ? [
          'Try different keywords',
          'Remove some filters',
          'Check spelling',
          'Use broader muscle group terms',
        ] : undefined,
      },
    });
  } catch (error) {
    console.error('Error searching exercises:', error);
    const authResult = await auth();
    await logAuthEvent(
      'exercise_search_failed',
      'security',
      'Exercise search failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { 
        error: (error as Error).message,
        query: new URL(request.url).searchParams.get('q') || 'unknown'
      }
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