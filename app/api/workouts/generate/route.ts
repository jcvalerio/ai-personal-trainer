/**
 * AI Workout Generation API Routes
 * Handles AI-powered workout generation requests
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import AIWorkoutService from '@/lib/services/ai-workout-service'
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth'
import { RATE_LIMITS } from '@/lib/auth'
import {
  workoutGenerationRequestSchema,
  workoutGenerationJobFiltersSchema,
  paginationSchema
} from '@/lib/validation/workout-schemas'

const aiWorkoutService = new AIWorkoutService()

/**
 * GET /api/workouts/generate
 * Get user's workout generation jobs
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
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`generation_jobs:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Generation jobs API rate limit exceeded', userId)
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

    // Parse filters
    let filters
    try {
      filters = workoutGenerationJobFiltersSchema.parse({
        jobType: queryParams.jobType,
        status: queryParams.status,
        dateFrom: queryParams.dateFrom,
        dateTo: queryParams.dateTo
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

    // Get generation jobs
    const result = await aiWorkoutService.getWorkoutGenerationJobs(context, {
      jobType: filters.jobType,
      status: filters.status,
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: result.code === 'UNAUTHORIZED' ? 403 : 500 }
      )
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        count: result.data!.length,
        responseTime,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching generation jobs:', error)
    const authResult = await auth()
    await logAuthEvent('generation_jobs_access_failed', 'security', 'Generation jobs access failed', 
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
 * POST /api/workouts/generate
 * Create a new AI workout generation request
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

    // Rate limiting for AI generation (more restrictive)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`ai_generation:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'AI generation rate limit exceeded', userId)
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

    // Check subscription limits for AI features
    const canUseAI = this.checkAIFeatureAccess(userProfile.subscriptionTier)
    if (!canUseAI.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: canUseAI.reason, 
          code: 'FEATURE_RESTRICTED',
          upgradeRequired: true
        },
        { status: 403 }
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
      validatedData = workoutGenerationRequestSchema.parse(body)
    } catch (error) {
      await logAuthEvent('workout_generation_validation_failed', 'security', 'Invalid workout generation data', userId, 
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

    // Create generation job
    const result = await aiWorkoutService.createWorkoutGenerationJob(validatedData, context)

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
        timestamp: new Date().toISOString(),
        estimatedCompletionTime: this.estimateCompletionTime(validatedData.jobType)
      }
    }, { status: 202 }) // 202 Accepted for async processing

  } catch (error) {
    console.error('Error creating generation job:', error)
    const authResult = await auth()
    await logAuthEvent('workout_generation_failed', 'security', 'Workout generation failed', 
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

/**
 * Check if user can access AI features based on subscription tier
 */
function checkAIFeatureAccess(subscriptionTier: string): { allowed: boolean; reason?: string } {
    switch (subscriptionTier) {
      case 'free':
        return {
          allowed: false,
          reason: 'AI workout generation requires a premium subscription'
        }
      case 'premium':
      case 'enterprise':
        return { allowed: true }
      default:
        return {
          allowed: false,
          reason: 'Unknown subscription tier'
        }
    }
  }

/**
 * Estimate completion time based on job type
 */
function estimateCompletionTime(jobType: string): string {
    const estimates = {
      'workout_plan': '2-5 minutes',
      'single_session': '1-2 minutes',
      'exercise_recommendation': '30-60 seconds'
    }
    return estimates[jobType as keyof typeof estimates] || '1-5 minutes'
  }
}