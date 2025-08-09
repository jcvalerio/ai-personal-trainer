/**
 * Complete Workout Session API Route
 * Handles completing a workout session
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import WorkoutService from '@/lib/services/workout-service'
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth'
import { RATE_LIMITS } from '@/lib/auth'
import { completeSessionSchema } from '@/lib/validation/workout-schemas'

const workoutService = new WorkoutService()

interface RouteParams {
  params: {
    sessionId: string
  }
}

/**
 * POST /api/workouts/sessions/[sessionId]/complete
 * Complete a workout session
 */
export async function POST(
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

    // Validate sessionId parameter
    if (!params.sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.sessionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID', code: 'INVALID_PARAMETER' },
        { status: 400 }
      )
    }

    // Rate limiting for session actions
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`session_complete:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Session complete rate limit exceeded', userId)
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

    // Parse and validate request body (optional feedback data)
    let body = {}
    let validatedData = {}
    
    try {
      const contentType = request.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        body = await request.json()
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    if (Object.keys(body).length > 0) {
      try {
        validatedData = completeSessionSchema.parse(body)
      } catch (error) {
        await logAuthEvent('session_complete_validation_failed', 'security', 'Invalid session completion data', userId, 
          orgId || undefined, { 
            sessionId: params.sessionId,
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
    }

    // Service context
    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role
    }

    // Complete workout session
    const result = await workoutService.completeWorkoutSession(params.sessionId, validatedData, context)

    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 
                        result.code === 'UNAUTHORIZED' ? 403 :
                        result.code === 'INVALID_STATE' ? 409 : 500
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
    console.error('Error completing workout session:', error)
    const authResult = await auth()
    await logAuthEvent('session_complete_failed', 'security', 'Session complete failed', 
      authResult.userId || undefined, authResult.orgId || undefined, { 
        sessionId: params.sessionId, 
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