/**
 * User Profile API Routes
 * Handles user profile CRUD operations with authentication and validation
 */

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  getUserProfileByClerkId,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  logAuthEvent
} from '@/lib/db/auth'
import { RATE_LIMITS, sanitizeInput, isValidDisplayName } from '@/lib/auth'
import { CreateUserProfileRequest } from '@/types/auth'

// Validation schemas
const createProfileSchema = z.object({
  displayName: z.string().min(2).max(50).transform(sanitizeInput),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  heightCm: z.number().min(50).max(300).optional(),
  weightKg: z.number().min(20).max(500).optional(),
  birthDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  primaryGoals: z.array(z.string()).min(1).max(8),
  preferences: z.object({
    units: z.enum(['metric', 'imperial']).optional(),
    workoutReminders: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
  }).optional(),
})

const updateProfileSchema = createProfileSchema.partial()

/**
 * GET /api/user/profile
 * Retrieve current user's profile
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Profile API rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Fetch user profile
    const profile = await getUserProfileByClerkId(userId)
    
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Log successful access
    await logAuthEvent('profile_accessed', 'profile', 'User profile accessed', userId)

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: profile,
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    
    const authResult = await auth()
    await logAuthEvent('profile_access_failed', 'security', 'Profile access failed', 
      authResult.userId || undefined, undefined, { error: (error as Error).message })

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
 * POST /api/user/profile
 * Create new user profile (typically called during onboarding)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get current user from Clerk
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found in Clerk', code: 'CLERK_USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Profile creation rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Check if profile already exists
    const existingProfile = await getUserProfileByClerkId(userId)
    if (existingProfile) {
      await logAuthEvent('profile_already_exists', 'profile', 'User attempted to create existing profile', userId)
      
      return NextResponse.json(
        { 
          success: true, 
          profile: existingProfile,
          message: 'Profile already exists - returning existing profile'
        },
        { status: 200 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createProfileSchema.safeParse(body)
    
    if (!validationResult.success) {
      await logAuthEvent('profile_creation_validation_failed', 'profile', 'Invalid profile data', userId, 
        undefined, { errors: validationResult.error.issues })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const profileData: CreateUserProfileRequest = validationResult.data

    // Additional validation
    if (!isValidDisplayName(profileData.displayName)) {
      return NextResponse.json(
        { success: false, error: 'Invalid display name', code: 'INVALID_DISPLAY_NAME' },
        { status: 400 }
      )
    }

    // Create user profile
    const profile = await createUserProfile(userId, profileData)

    // Update Clerk user metadata to mark onboarding as complete
    try {
      const client = await clerkClient()
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          hasCompletedOnboarding: true,
          role: 'user',
          fitnessLevel: profileData.fitnessLevel,
          primaryGoals: profileData.primaryGoals,
          profileId: profile.id,
        }
      })
    } catch (clerkError) {
      console.warn('Failed to update Clerk metadata:', clerkError)
      // Don't fail the request, just log the warning
    }

    // Log successful creation
    await logAuthEvent('profile_created', 'profile', 'User profile created successfully', userId, 
      undefined, { profileId: profile.id })

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Profile created successfully',
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user profile:', error)
    
    const authResult = await auth()
    await logAuthEvent('profile_creation_failed', 'security', 'Profile creation failed', 
      authResult.userId || undefined, undefined, { error: (error as Error).message })

    // Handle specific error types
    if ((error as any).code === 'USER_CREATION_FAILED') {
      return NextResponse.json(
        { success: false, error: (error as any).message, code: (error as any).code },
        { status: 400 }
      )
    }

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
 * PUT /api/user/profile
 * Update existing user profile
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Profile update rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Check if profile exists
    const existingProfile = await getUserProfileByClerkId(userId)
    if (!existingProfile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateProfileSchema.safeParse(body)
    
    if (!validationResult.success) {
      await logAuthEvent('profile_update_validation_failed', 'profile', 'Invalid profile update data', userId, 
        undefined, { errors: validationResult.error.issues })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Additional validation for display name if provided
    if (updateData.displayName && !isValidDisplayName(updateData.displayName)) {
      return NextResponse.json(
        { success: false, error: 'Invalid display name', code: 'INVALID_DISPLAY_NAME' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedProfile = await updateUserProfile(userId, updateData)

    // Update Clerk user metadata if necessary
    const user = await currentUser()
    if (user && (updateData.fitnessLevel || updateData.primaryGoals)) {
      try {
        const client = await clerkClient()
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            ...user.publicMetadata,
            ...(updateData.fitnessLevel && { fitnessLevel: updateData.fitnessLevel }),
            ...(updateData.primaryGoals && { primaryGoals: updateData.primaryGoals }),
          }
        })
      } catch (clerkError) {
        console.warn('Failed to update Clerk metadata:', clerkError)
        // Don't fail the request, just log the warning
      }
    }

    // Log successful update
    await logAuthEvent('profile_updated', 'profile', 'User profile updated successfully', userId, 
      undefined, { 
        profileId: updatedProfile.id,
        updatedFields: Object.keys(updateData)
      })

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error updating user profile:', error)
    
    const authResult = await auth()
    await logAuthEvent('profile_update_failed', 'security', 'Profile update failed', 
      authResult.userId || undefined, undefined, { error: (error as Error).message })

    // Handle specific error types
    if ((error as any).code === 'USER_UPDATE_FAILED') {
      return NextResponse.json(
        { success: false, error: (error as any).message, code: (error as any).code },
        { status: 400 }
      )
    }

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
 * DELETE /api/user/profile
 * Delete user profile (GDPR compliance)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Additional security check - require specific header for deletion
    const confirmationHeader = request.headers.get('X-Confirm-Delete')
    if (confirmationHeader !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Deletion confirmation required', code: 'CONFIRMATION_REQUIRED' },
        { status: 400 }
      )
    }

    // Rate limiting (more restrictive for deletion)
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!RATE_LIMITS.AUTH.isAllowed(`delete:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Profile deletion rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Check if profile exists
    const existingProfile = await getUserProfileByClerkId(userId)
    if (!existingProfile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Delete/anonymize user profile
    const deleted = await deleteUserProfile(userId)
    
    if (!deleted) {
      throw new Error('Failed to delete user profile')
    }

    // Log successful deletion
    await logAuthEvent('profile_deleted', 'security', 'User profile deleted', userId, 
      undefined, { profileId: existingProfile.id })

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully',
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error deleting user profile:', error)
    
    const authResult = await auth()
    await logAuthEvent('profile_deletion_failed', 'security', 'Profile deletion failed', 
      authResult.userId || undefined, undefined, { error: (error as Error).message })

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