/**
 * Organization Members API Routes
 * Handles member management with proper authorization and validation
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  getOrganizationMembers,
  createOrganizationInvite,
  removeUserFromOrganization,
  getUserProfileByClerkId,
  logAuthEvent
} from '@/lib/db/auth'
import { RATE_LIMITS, sanitizeInput, isValidEmail } from '@/lib/auth'
import { InviteMemberForm } from '@/types/auth'

// Validation schemas
const inviteMemberSchema = z.object({
  email: z.string().email().toLowerCase(),
  role: z.enum(['member', 'admin']),
  customMessage: z.string().max(500).optional().transform(val => val ? sanitizeInput(val) : undefined),
})

const removeMemberSchema = z.object({
  userId: z.string().uuid(),
})

interface RouteParams {
  params: {
    orgId: string
  }
}

/**
 * GET /api/organizations/[orgId]/members
 * Get organization members
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const { orgId } = params
    
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const userProfile = await getUserProfileByClerkId(userId)
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`members:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Members API rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Get organization members
    const members = await getOrganizationMembers(orgId)

    // Check if user has access to this organization
    const userIsMember = members.some(member => member.clerkUserId === userId)
    if (!userIsMember) {
      await logAuthEvent('unauthorized_access', 'security', 'Attempted access to organization members', userId, orgId)
      return NextResponse.json(
        { success: false, error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Filter sensitive information based on user's role
    const userRole = members.find(member => member.clerkUserId === userId)?.role || 'user'
    const isAdmin = ['gym_admin', 'gym_owner', 'family_admin'].includes(userRole)
    
    const sanitizedMembers = members.map(member => ({
      id: member.id,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      role: member.role,
      joinedAt: member.joinedAt,
      fitnessLevel: member.fitnessLevel,
      // Only include email for admins
      ...(isAdmin && { email: member.email }),
      // Only include sensitive data for admins
      ...(isAdmin && { 
        lastActiveAt: member.lastActiveAt || null,
        totalWorkouts: (member as any).totalWorkouts || 0, // TODO: Implement proper workout counting
      }),
    }))

    // Log successful access
    await logAuthEvent('members_accessed', 'organization', 'Organization members accessed', userId, orgId)

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: sanitizedMembers,
      meta: {
        count: sanitizedMembers.length,
        userRole,
        isAdmin,
        responseTime,
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error fetching organization members:', error)
    
    const authResult = await auth()
    await logAuthEvent('members_access_failed', 'security', 'Members access failed', 
      authResult.userId || undefined, params.orgId, { error: (error as Error).message })

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
 * POST /api/organizations/[orgId]/members
 * Invite new member to organization
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const { orgId } = params
    
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const userProfile = await getUserProfileByClerkId(userId)
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check organization membership and admin permissions
    const members = await getOrganizationMembers(orgId)
    const userMember = members.find(member => member.clerkUserId === userId)
    
    if (!userMember) {
      await logAuthEvent('unauthorized_invite', 'security', 'Unauthorized invite attempt', userId, orgId)
      return NextResponse.json(
        { success: false, error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const isAdmin = ['admin', 'owner'].includes(userMember.role)
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!RATE_LIMITS.INVITE.isAllowed(`${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Invite rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many invitations sent', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = inviteMemberSchema.safeParse(body)
    
    if (!validationResult.success) {
      await logAuthEvent('invite_validation_failed', 'organization', 'Invalid invite data', userId, orgId, 
        { errors: validationResult.error.issues })
      
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

    const inviteData: InviteMemberForm = {
      ...validationResult.data,
      customMessage: validationResult.data.customMessage || undefined
    }

    // Additional validation
    if (!isValidEmail(inviteData.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMember = members.find(member => member.email.toLowerCase() === inviteData.email)
    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'User is already a member', code: 'ALREADY_MEMBER' },
        { status: 409 }
      )
    }

    // TODO: Check organization member limits here
    // const organization = await getOrganizationByClerkId(orgId)
    // if (members.length >= organization.maxMembers) { ... }

    // Create invitation
    const invitation = await createOrganizationInvite(orgId, userProfile.id, inviteData)

    // TODO: Send invitation email here
    // await sendInvitationEmail(invitation)

    // Log successful invitation
    await logAuthEvent('member_invited', 'organization', 'Member invitation created', userId, orgId, {
      inviteeEmail: inviteData.email,
      role: inviteData.role,
      inviteCode: invitation.inviteCode
    })

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.inviteeEmail,
        role: invitation.role,
        inviteCode: invitation.inviteCode,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
      },
      message: 'Invitation sent successfully',
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating member invitation:', error)
    
    const authResult = await auth()
    await logAuthEvent('invite_creation_failed', 'security', 'Member invitation failed', 
      authResult.userId || undefined, params.orgId, { error: (error as Error).message })

    // Handle specific error types
    if ((error as any).code === 'INVITE_CREATION_FAILED') {
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
 * DELETE /api/organizations/[orgId]/members
 * Remove member from organization
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const { orgId } = params
    
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const userProfile = await getUserProfileByClerkId(userId)
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validationResult = removeMemberSchema.safeParse(body)
    
    if (!validationResult.success) {
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

    const { userId: memberToRemove } = validationResult.data

    // Check organization membership and permissions
    const members = await getOrganizationMembers(orgId)
    const currentUserMember = members.find(member => member.clerkUserId === userId)
    const targetMember = members.find(member => member.id === memberToRemove)
    
    if (!currentUserMember || !targetMember) {
      return NextResponse.json(
        { success: false, error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Check permissions  
    const isCurrentUserAdmin = ['gym_admin', 'gym_owner', 'family_admin'].includes(currentUserMember.role)
    const isSelfRemoval = currentUserMember.id === memberToRemove
    const isTargetOwner = targetMember.role === 'gym_owner'

    // Rules:
    // - Admins can remove members (but not owners)
    // - Owners can remove anyone except themselves if they're the only owner
    // - Users can remove themselves
    if (!isSelfRemoval && !isCurrentUserAdmin) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }

    if (!isSelfRemoval && isTargetOwner && currentUserMember.role !== 'gym_owner') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove organization owner', code: 'CANNOT_REMOVE_OWNER' },
        { status: 403 }
      )
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`remove:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Member removal rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Remove member from organization
    const removed = await removeUserFromOrganization(orgId, memberToRemove)
    
    if (!removed) {
      throw new Error('Failed to remove member from organization')
    }

    // Log successful removal
    await logAuthEvent('member_removed', 'organization', 'Member removed from organization', userId, orgId, {
      removedMemberId: memberToRemove,
      removedMemberEmail: targetMember.email,
      isSelfRemoval,
      removedByRole: currentUserMember.role
    })

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: isSelfRemoval ? 'You have left the organization' : 'Member removed successfully',
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error removing organization member:', error)
    
    const authResult = await auth()
    await logAuthEvent('member_removal_failed', 'security', 'Member removal failed', 
      authResult.userId || undefined, params.orgId, { error: (error as Error).message })

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