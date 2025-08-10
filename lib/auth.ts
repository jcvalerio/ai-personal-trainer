/**
 * Authentication utilities and helpers
 * Provides common auth functions, role checks, and permission management
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import type { User } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { 
  OrganizationType, 
  AuthSession, 
  SessionUser, 
  SessionOrganization,
  Permission,
  DEFAULT_PERMISSIONS,
  AuthError,
  AuthErrorCode,
  ORGANIZATION_LIMITS
} from '@/types/auth'
import { UserRole } from '@/types'

/**
 * Get current authenticated user session with organization context
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId) {
      return null
    }

    const user = await currentUser()
    if (!user) {
      return null
    }

    // Extract metadata from user
    const metadata = user.publicMetadata as any
    const hasCompletedOnboarding = metadata?.hasCompletedOnboarding ?? false
    const role = metadata?.role as UserRole ?? 'user'
    const organizationType = metadata?.organizationType as OrganizationType

    const sessionUser: SessionUser = {
      id: metadata?.profileId || userId,
      clerkUserId: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || '',
      avatarUrl: user.imageUrl,
      role,
      fitnessLevel: metadata?.fitnessLevel,
      createdAt: new Date(user.createdAt),
    }

    let sessionOrganization: SessionOrganization | undefined
    if (orgId && organizationType) {
      // In a real app, you'd fetch organization details from your database
      sessionOrganization = {
        id: metadata?.organizationId || orgId,
        clerkOrgId: orgId,
        name: metadata?.organizationName || 'Organization',
        type: organizationType,
        role: metadata?.organizationRole || 'member',
        brandingConfig: metadata?.brandingConfig,
      }
    }

    const permissions = getPermissionsForRole(role)

    return {
      user: sessionUser,
      organization: sessionOrganization,
      permissions,
      isAuthenticated: true,
      hasCompletedOnboarding,
    }
  } catch (error) {
    console.error('Error getting auth session:', error)
    return null
  }
}

/**
 * Require authentication for a page/API route
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession()
  
  if (!session) {
    redirect('/sign-in')
  }

  return session
}

/**
 * Require completed onboarding
 */
export async function requireOnboarding(): Promise<AuthSession> {
  const session = await requireAuth()
  
  if (!session.hasCompletedOnboarding) {
    redirect('/onboarding')
  }

  return session
}

/**
 * Check if user has specific role
 */
export function hasRole(session: AuthSession | null, role: UserRole | UserRole[]): boolean {
  if (!session) return false
  
  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(session.user.role)
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  session: AuthSession | null,
  resource: string,
  action: string,
  conditions?: Record<string, any>
): boolean {
  if (!session) return false

  return session.permissions.some(permission => {
    if (permission.resource !== resource || permission.action !== action) {
      return false
    }

    // Check conditions if specified
    if (conditions && permission.conditions) {
      return Object.entries(conditions).every(([key, value]) => {
        return permission.conditions?.[key] === value
      })
    }

    return true
  })
}

/**
 * Check if user can access organization
 */
export function canAccessOrganization(
  session: AuthSession | null,
  organizationId: string
): boolean {
  if (!session) return false
  
  // Users can always access their own organization
  if (session.organization?.id === organizationId) {
    return true
  }

  // System admins can access any organization (future feature)
  return hasRole(session, ['gym_owner']) // Extend this for system admin role
}

/**
 * Check organization member limits
 */
export function canInviteMoreMembers(
  organizationType: OrganizationType,
  subscriptionTier: 'free' | 'premium' | 'enterprise',
  currentMemberCount: number
): boolean {
  const limits = ORGANIZATION_LIMITS[organizationType.toUpperCase() as keyof typeof ORGANIZATION_LIMITS][subscriptionTier.toUpperCase() as keyof typeof ORGANIZATION_LIMITS[keyof typeof ORGANIZATION_LIMITS]]
  return currentMemberCount < limits.maxMembers
}

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  const rolePermissions = DEFAULT_PERMISSIONS[role.toUpperCase() as keyof typeof DEFAULT_PERMISSIONS]
  
  // Always include base user permissions
  const basePermissions = DEFAULT_PERMISSIONS.USER
  
  if (role === 'user') {
    return [...basePermissions] // Convert readonly array to mutable
  }

  return [...basePermissions, ...rolePermissions]
}

/**
 * Create auth error with consistent structure
 */
export function createAuthError(code: AuthErrorCode, message: string, details?: Record<string, any>): AuthError {
  return {
    code,
    message,
    details
  }
}

/**
 * Validate organization membership
 */
export async function validateOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // In a real app, this would query your database
  // For now, we'll use Clerk's organization membership
  try {
    const { orgId } = await auth()
    return orgId === organizationId
  } catch {
    return false
  }
}

/**
 * Get user's allowed organization types based on role
 */
export function getAllowedOrganizationTypes(role: UserRole): OrganizationType[] {
  switch (role) {
    case 'user':
    case 'family_admin':
      return ['family']
    case 'gym_member':
    case 'gym_admin':
    case 'gym_owner':
      return ['gym']
    default:
      return []
  }
}

/**
 * Check if user can perform action on organization
 */
export function canManageOrganization(session: AuthSession | null, action: 'read' | 'update' | 'delete' | 'invite'): boolean {
  if (!session || !session.organization) return false

  const { role } = session.organization

  switch (action) {
    case 'read':
      return ['member', 'admin', 'owner'].includes(role)
    case 'update':
    case 'invite':
      return ['admin', 'owner'].includes(role)
    case 'delete':
      return role === 'owner'
    default:
      return false
  }
}

/**
 * Generate secure invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Validate invite code format
 */
export function isValidInviteCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code)
}

/**
 * Rate limiting helper
 */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>()

  return {
    isAllowed: (identifier: string): boolean => {
      const now = Date.now()
      const userRequests = requests.get(identifier) || []
      
      // Remove requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs)
      
      if (validRequests.length >= maxRequests) {
        requests.set(identifier, validRequests)
        return false
      }
      
      validRequests.push(now)
      requests.set(identifier, validRequests)
      return true
    },
    
    getRemainingRequests: (identifier: string): number => {
      const now = Date.now()
      const userRequests = requests.get(identifier) || []
      const validRequests = userRequests.filter(time => now - time < windowMs)
      return Math.max(0, maxRequests - validRequests.length)
    }
  }
}

/**
 * Constants for rate limiting
 */
export const RATE_LIMITS = {
  AUTH: createRateLimiter(5, 60 * 1000), // 5 auth attempts per minute
  INVITE: createRateLimiter(10, 60 * 60 * 1000), // 10 invites per hour
  PROFILE_UPDATE: createRateLimiter(20, 60 * 60 * 1000), // 20 profile updates per hour
} as const

/**
 * Sanitize user input for security
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .slice(0, 500) // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Validate display name
 */
export function isValidDisplayName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 50
}

/**
 * Generate avatar URL fallback
 */
export function getAvatarFallback(displayName: string): string {
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=ffffff&size=128`
}