/**
 * Workout Plans API Routes
 * Handles CRUD operations for workout plans
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import WorkoutService from '@/lib/services/workout-service'
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth'
import { RATE_LIMITS } from '@/lib/auth'
import {
  createWorkoutPlanSchema,
  workoutPlanFiltersSchema,
  paginationSchema
} from '@/lib/validation/workout-schemas'

const workoutService = new WorkoutService()

/**
 * GET /api/workouts/plans
 * Get user's workout plans with filtering and pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`workout_plans:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Workout plans API rate limit exceeded', userId)
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Parse pagination params
    let paginationParams
    try {
      paginationParams = paginationSchema.parse({
        page: queryParams.page ? parseInt(queryParams.page) : undefined,
        limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder
      })
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid pagination parameters', 
          code: 'VALIDATION_ERROR',
          details: error instanceof z.ZodError ? error.issues : undefined
        },
        { status: 400 }
      )
    }

    // Parse filters
    let filters
    try {
      filters = workoutPlanFiltersSchema.parse({
        status: queryParams.status,
        isTemplate: queryParams.isTemplate === 'true',
        targetFitnessLevel: queryParams.targetFitnessLevel,
        search: queryParams.search
      })
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid filter parameters', 
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

    // Get workout plans
    const result = await workoutService.getWorkoutPlans(context, filters, paginationParams)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: result.code === 'UNAUTHORIZED' ? 403 : 500 }
      )
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: result.data!.items,
      pagination: result.data!.pagination,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching workout plans:', error)
    const authResult = await auth()
    await logAuthEvent('workout_plans_access_failed', 'security', 'Workout plans access failed', 
      authResult.userId || undefined, authResult.orgId || undefined, { error: (error as Error).message })

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
 * POST /api/workouts/plans
 * Create a new workout plan
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

    // Rate limiting for creation (more restrictive)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`create_workout_plan:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Workout plan creation rate limit exceeded', userId)
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
      validatedData = createWorkoutPlanSchema.parse(body)
    } catch (error) {
      await logAuthEvent('workout_plan_validation_failed', 'security', 'Invalid workout plan data', userId, 
        orgId || undefined, { errors: error instanceof z.ZodError ? error.issues : undefined })
      
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

    // Create workout plan
    const result = await workoutService.createWorkoutPlan(validatedData, context)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: result.code === 'VALIDATION_ERROR' ? 400 : 500 }
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
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating workout plan:', error)
    const authResult = await auth()
    await logAuthEvent('workout_plan_creation_failed', 'security', 'Workout plan creation failed', 
      authResult.userId || undefined, authResult.orgId || undefined, { error: (error as Error).message })

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