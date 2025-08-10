/**
 * Simplified Workout Plans API Routes for deployment
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/workouts/plans
 * Get user's workout plans
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'sample-plan-1',
          name: 'Sample Workout Plan',
          description: 'A sample workout plan for deployment testing',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ],
      message: 'Workout plans service (deployment version)',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workouts/plans
 * Create a new workout plan
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: 'new-plan-id',
        name: 'New Workout Plan',
        status: 'active',
        message: 'Workout plan created (deployment version)'
      },
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}