/**
 * Exercise Muscle Groups API Routes
 * Returns available muscle groups for filtering
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/exercises/muscle-groups
 * Get available muscle groups for exercises
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Return predefined muscle groups based on exercise data
    const muscleGroups = [
      'chest',
      'shoulders', 
      'triceps',
      'quadriceps',
      'glutes',
      'hamstrings',
      'lats',
      'biceps',
      'core',
      'full_body',
      'erector_spinae',
      'calves',
      'forearms',
      'traps',
      'rhomboids'
    ];

    return NextResponse.json({
      success: true,
      data: muscleGroups,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching muscle groups:', error);
    
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