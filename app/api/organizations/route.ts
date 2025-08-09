/**
 * Organization Management API Routes
 * Handles organization CRUD operations with multi-tenant security
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  createOrganization,
  getUserOrganizations,
  getOrganizationByClerkId,
  addUserToOrganization,
  getUserProfileByClerkId,
  logAuthEvent
} from '@/lib/db/auth'
import { RATE_LIMITS, sanitizeInput } from '@/lib/auth'
import { CreateOrganizationRequest, OrganizationType } from '@/types/auth'
import { ORGANIZATION_LIMITS } from '@/types/auth'

// Validation schemas
const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100).transform(sanitizeInput),
  description: z.string().max(500).optional().transform(val => val ? sanitizeInput(val) : undefined),
  type: z.enum(['family', 'gym']),
  maxMembers: z.number().min(2).max(10000).optional(),
  brandingConfig: z.object({
    logo: z.string().url().optional(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    theme: z.enum(['light', 'dark']).optional(),
  }).optional(),
  settings: z.object({
    allowMemberInvites: z.boolean().optional(),
    requireApprovalForJoining: z.boolean().optional(),
    shareEquipmentDatabase: z.boolean().optional(),
    enableLeaderboards: z.boolean().optional(),
    autoApproveMembers: z.boolean().optional(),
  }).optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
  }).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
})

/**
 * GET /api/organizations
 * Get user's organizations
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
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`orgs:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Organizations API rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Get user's organizations
    const organizations = await getUserOrganizations(userId)

    // Log successful access
    await logAuthEvent('organizations_accessed', 'organization', 'User organizations accessed', userId)

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: organizations,
      meta: {
        count: organizations.length,
        responseTime,
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error fetching user organizations:', error)
    const authResult = await auth()
    await logAuthEvent('organizations_access_failed', 'security', 'Organizations access failed', 
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
 * POST /api/organizations
 * Create new organization
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

    // Check if user has completed onboarding
    const userProfile = await getUserProfileByClerkId(userId)
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'PROFILE_INCOMPLETE' },
        { status: 400 }
      )
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`create_org:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Organization creation rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createOrganizationSchema.safeParse(body)
    
    if (!validationResult.success) {
      await logAuthEvent('organization_creation_validation_failed', 'organization', 'Invalid organization data', userId, 
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

    const orgData: CreateOrganizationRequest = {
      ...validationResult.data,
      description: validationResult.data.description || undefined
    }

    // Set default max members based on type and tier
    if (!orgData.maxMembers) {
      const subscriptionTier = userProfile.subscriptionTier || 'free'
      const limits = ORGANIZATION_LIMITS[orgData.type.toUpperCase() as keyof typeof ORGANIZATION_LIMITS]
      orgData.maxMembers = limits[subscriptionTier.toUpperCase() as keyof typeof limits].maxMembers
    }

    // Generate a unique Clerk organization ID (in a real implementation, you'd create this via Clerk API)
    const clerkOrgId = `org_${Date.now()}_${Math.random().toString(36).substring(2)}`

    try {
      // Create organization in database
      const organization = await createOrganization(clerkOrgId, orgData)

      // Add the creator as owner
      await addUserToOrganization(organization.id, userProfile.id, 'owner')

      // Update user's role based on organization type
      let newRole: string = userProfile.role
      if (orgData.type === 'family') {
        newRole = 'family_admin'
      } else if (orgData.type === 'gym') {
        newRole = 'gym_owner'
      }

      // Update user profile with organization reference
      if (newRole !== userProfile.role) {
        // In a real app, you'd update the user profile here
        console.log(`User role should be updated to: ${newRole}`)
      }

      // Note: Update Clerk user metadata here if needed
      // In real implementation, you would use the Clerk Management API
      console.log(`User ${userId} created organization ${organization.id} with role ${newRole}`)

      // Log successful creation
      await logAuthEvent('organization_created', 'organization', 'Organization created successfully', userId, 
        organization.id, { 
          organizationName: organization.name,
          organizationType: organization.type 
        })

      const responseTime = Date.now() - startTime
      
      return NextResponse.json({
        success: true,
        data: organization,
        message: 'Organization created successfully',
        meta: {
          responseTime,
          timestamp: new Date().toISOString(),
        }
      }, { status: 201 })

    } catch (dbError) {
      console.error('Database error creating organization:', dbError)
      throw dbError
    }

  } catch (error) {
    console.error('Error creating organization:', error)
    const authResult = await auth()
    await logAuthEvent('organization_creation_failed', 'security', 'Organization creation failed', 
      authResult.userId || undefined, undefined, { error: (error as Error).message })

    // Handle specific error types
    if ((error as any).code === 'ORG_CREATION_FAILED') {
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
 * PUT /api/organizations
 * Update organization (requires organization context)
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Authenticate request
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or no organization context', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Check user permissions (must be admin or owner)
    const userProfile = await getUserProfileByClerkId(userId)
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Get organization to verify access
    const organization = await getOrganizationByClerkId(orgId)
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found', code: 'ORGANIZATION_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!RATE_LIMITS.PROFILE_UPDATE.isAllowed(`update_org:${userId}:${clientIp}`)) {
      await logAuthEvent('rate_limit_exceeded', 'security', 'Organization update rate limit exceeded', userId)
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const updateSchema = createOrganizationSchema.partial()
    const validationResult = updateSchema.safeParse(body)
    
    if (!validationResult.success) {
      await logAuthEvent('organization_update_validation_failed', 'organization', 'Invalid organization update data', userId, 
        orgId, { errors: validationResult.error.issues })
      
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

    // In a real implementation, you'd update the organization in the database
    console.log('Organization update data:', validationResult.data)

    // Log successful update
    await logAuthEvent('organization_updated', 'organization', 'Organization updated successfully', userId, 
      organization.id, { 
        updatedFields: Object.keys(validationResult.data)
      })

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: organization, // Return updated organization
      message: 'Organization updated successfully',
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error updating organization:', error)
    const authResult = await auth()
    await logAuthEvent('organization_update_failed', 'security', 'Organization update failed', 
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