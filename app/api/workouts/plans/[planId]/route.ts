/**
 * Individual Workout Plan API Routes
 * Handles operations on specific workout plans
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import WorkoutService from '@/lib/services/workout-service'
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth'
import { RATE_LIMITS } from '@/lib/auth'
import { updateWorkoutPlanSchema } from '@/lib/validation/workout-schemas'

const workoutService = new WorkoutService()

interface RouteParams {
  params: {
    planId: string
  }
}

/**
 * GET /api/workouts/plans/[planId]
 * Get a specific workout plan
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Authentication
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Validate planId parameter
    if (!params.planId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.planId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID', code: 'INVALID_PARAMETER' },
        { status: 400 }
      )
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`workout_plan_get:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Workout plan get API rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Get user profile for context
    const userProfile = await getUserProfileByClerkId(userId)
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Service context
    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role
    }

    // Get workout plan
    const result = await workoutService.getWorkoutPlan(params.planId, context)

    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 
                        result.code === 'UNAUTHORIZED' ? 403 : 500
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: statusCode }
      )
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching workout plan:', error)
    const authResult = await auth()
    await logAuthEvent('workout_plan_access_failed', 'security', 'Workout plan access failed', 
      authResult.userId || undefined, authResult.orgId || undefined, { 
        planId: params.planId, 
        error: (error as Error).message 
      })

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/workouts/plans/[planId]
 * Update a specific workout plan
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Authentication
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Validate planId parameter
    if (!params.planId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.planId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID', code: 'INVALID_PARAMETER' },
        { status: 400 }
      )
    }

    // Rate limiting for updates
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`workout_plan_update:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Workout plan update rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Get user profile for context
    const userProfile = await getUserProfileByClerkId(userId)
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    let validatedData
    try {
      validatedData = updateWorkoutPlanSchema.parse(body)
    } catch (error) {
      await logAuthEvent('workout_plan_update_validation_failed', 'security', 'Invalid workout plan update data', userId, 
        orgId || undefined, { 
          planId: params.planId,
          errors: error instanceof z.ZodError ? error.issues : undefined 
        })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          code: 'VALIDATION_ERROR',
          details: error instanceof z.ZodError ? error.issues : undefined
        },
        { status: 400 }
      )
    }

    // Service context
    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role
    }

    // Update workout plan
    const result = await workoutService.updateWorkoutPlan(params.planId, validatedData, context)

    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 
                        result.code === 'UNAUTHORIZED' ? 403 : 
                        result.code === 'VALIDATION_ERROR' ? 400 : 500
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: statusCode }
      )
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating workout plan:', error)
    const authResult = await auth()
    await logAuthEvent('workout_plan_update_failed', 'security', 'Workout plan update failed', 
      authResult.userId || undefined, authResult.orgId || undefined, { 
        planId: params.planId, 
        error: (error as Error).message 
      })

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workouts/plans/[planId]
 * Delete a specific workout plan
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Authentication
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Validate planId parameter
    if (!params.planId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.planId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID', code: 'INVALID_PARAMETER' },
        { status: 400 }
      )
    }

    // Rate limiting for deletions (most restrictive)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`workout_plan_delete:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Workout plan delete rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Get user profile for context
    const userProfile = await getUserProfileByClerkId(userId)
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Service context
    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role
    }

    // Delete workout plan
    const result = await workoutService.deleteWorkoutPlan(params.planId, context)

    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 
                        result.code === 'UNAUTHORIZED' ? 403 : 500
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: statusCode }
      )
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error deleting workout plan:', error)
    const authResult = await auth()
    await logAuthEvent('workout_plan_delete_failed', 'security', 'Workout plan delete failed', 
      authResult.userId || undefined, authResult.orgId || undefined, { 
        planId: params.planId, 
        error: (error as Error).message 
      })

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}