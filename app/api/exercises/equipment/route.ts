/**
 * Exercise Equipment API Routes
 * Returns available equipment for filtering
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/exercises/equipment
 * Get available equipment for exercises
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

    // Return predefined equipment based on exercise data
    const equipment = [
      'none', // Bodyweight exercises
      'pull_up_bar',
      'barbell',
      'dumbbells',
      'bench',
      'squat_rack',
      'cable_machine',
      'resistance_bands',
      'kettlebell',
      'medicine_ball',
      'foam_roller',
      'yoga_mat',
      'suspension_trainer',
      'smith_machine',
      'leg_press_machine',
      'lat_pulldown_machine',
      'rowing_machine',
      'treadmill',
      'stationary_bike',
      'elliptical'
    ];

    return NextResponse.json({
      success: true,
      data: equipment,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    
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