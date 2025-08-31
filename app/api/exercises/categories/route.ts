/**
 * Exercise Categories API Routes
 * Returns available categories for filtering
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/exercises/categories
 * Get available categories for exercises
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

    // Return predefined categories based on exercise types
    const categories = [
      {
        id: 'strength',
        name: 'Strength Training',
        description: 'Resistance exercises to build muscle and strength'
      },
      {
        id: 'cardio',
        name: 'Cardiovascular',
        description: 'Aerobic exercises to improve heart health and endurance'
      },
      {
        id: 'flexibility',
        name: 'Flexibility',
        description: 'Stretching exercises to improve range of motion'
      },
      {
        id: 'balance',
        name: 'Balance',
        description: 'Exercises to improve stability and coordination'
      },
      {
        id: 'mobility',
        name: 'Mobility',
        description: 'Dynamic movements to improve joint mobility'
      },
      {
        id: 'plyometric',
        name: 'Plyometric',
        description: 'Explosive exercises to develop power'
      }
    ];

    return NextResponse.json({
      success: true,
      data: categories,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    
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