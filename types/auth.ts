/**
 * Authentication and authorization type definitions
 * Specific to Clerk integration and multi-tenant architecture
 */

import { UserRole } from './index';

// Define OrganizationType directly here to avoid import issues
export type OrganizationType = 'family' | 'gym';

// Clerk-specific types
export interface ClerkUserMetadata {
  role: UserRole;
  organizationId?: string;
  organizationType?: OrganizationType;
  hasCompletedOnboarding: boolean;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  primaryGoals?: string[];
}

export interface ClerkOrganizationMetadata {
  type: OrganizationType;
  maxMembers: number;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  brandingConfig?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// Organization membership types
export type OrganizationRole = 'member' | 'admin' | 'owner';

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  invitedBy?: string;
  invitedAt?: Date | undefined;
  joinedAt: Date;
  isActive: boolean;
  permissions?: string[];
}

// Authentication session types
export interface AuthSession {
  user: SessionUser;
  organization?: SessionOrganization;
  permissions: Permission[];
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
}

export interface SessionUser {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
}

export interface SessionOrganization {
  id: string;
  clerkOrgId: string;
  name: string;
  type: OrganizationType;
  role: OrganizationRole;
  brandingConfig?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// Permission system
export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// Onboarding flow types
export interface OnboardingData {
  step: 'profile' | 'fitness' | 'goals' | 'organization' | 'complete';
  profileData?: {
    displayName: string;
    avatarUrl?: string;
  };
  fitnessData?: {
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    heightCm?: number;
    weightKg?: number;
    birthDate?: Date;
  };
  goalsData?: {
    primaryGoals: string[];
    workoutPreference: 'home' | 'gym' | 'outdoor' | 'mixed';
    availableHours: number;
  };
  organizationData?: {
    action: 'create' | 'join' | 'skip';
    organizationType?: OrganizationType;
    organizationName?: string;
    joinCode?: string;
  };
}

export interface OnboardingStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  isLoading?: boolean;
  error?: string;
}

// Invitation system types
export interface OrganizationInvite {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType;
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  role: OrganizationRole;
  inviteCode: string;
  expiresAt: Date;
  acceptedAt?: Date | undefined;
  rejectedAt?: Date | undefined;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

export interface InviteMemberForm {
  email: string;
  role: OrganizationRole;
  customMessage?: string | undefined;
}

// API request/response types
export interface CreateUserProfileRequest {
  displayName: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  heightCm?: number;
  weightKg?: number;
  birthDate?: string;
  primaryGoals: string[];
  preferences?: {
    units?: 'metric' | 'imperial';
    workoutReminders?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  };
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string | undefined;
  type: OrganizationType;
  maxMembers?: number;
  brandingConfig?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  settings?: {
    allowMemberInvites?: boolean;
    requireApprovalForJoining?: boolean;
    shareEquipmentDatabase?: boolean;
    enableLeaderboards?: boolean;
  };
}

export interface UpdateUserProfileRequest
  extends Partial<CreateUserProfileRequest> {
  organizationId?: string;
  role?: UserRole;
}

export interface JoinOrganizationRequest {
  inviteCode?: string;
  organizationId?: string;
  message?: string;
}

// Clerk webhook event types
export interface ClerkWebhookEvent {
  type:
    | 'user.created'
    | 'user.updated'
    | 'user.deleted'
    | 'organization.created'
    | 'organization.updated'
    | 'organization.deleted'
    | 'organizationMembership.created'
    | 'organizationMembership.updated'
    | 'organizationMembership.deleted';
  data: any;
  object: string;
  timestamp: number;
}

export interface ClerkUserWebhookData {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  public_metadata?: Record<string, any>;
  private_metadata?: Record<string, any>;
  unsafe_metadata?: Record<string, any>;
  created_at: number;
  updated_at: number;
}

export interface ClerkOrganizationWebhookData {
  id: string;
  name: string;
  slug: string;
  public_metadata?: Record<string, any>;
  private_metadata?: Record<string, any>;
  created_at: number;
  updated_at: number;
  members_count?: number;
}

// Error types
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, any> | undefined;
}

export type AuthErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'USER_NOT_FOUND'
  | 'ORGANIZATION_NOT_FOUND'
  | 'INVITE_EXPIRED'
  | 'INVITE_ALREADY_USED'
  | 'MAX_MEMBERS_REACHED'
  | 'INVALID_ROLE'
  | 'PROFILE_INCOMPLETE'
  | 'ONBOARDING_INCOMPLETE'
  | 'WEBHOOK_VERIFICATION_FAILED'
  | 'USER_CREATION_FAILED'
  | 'USER_UPDATE_FAILED'
  | 'USER_DELETION_FAILED'
  | 'ORG_CREATION_FAILED'
  | 'ORG_FETCH_FAILED'
  | 'MEMBERSHIP_FAILED'
  | 'MEMBERSHIP_REMOVAL_FAILED'
  | 'MEMBERS_FETCH_FAILED'
  | 'INVITE_CREATION_FAILED'
  | 'INVITE_FETCH_FAILED'
  | 'INVITE_ACCEPTANCE_FAILED'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'PROFILE_EXISTS'
  | 'CLERK_USER_NOT_FOUND'
  | 'INVALID_DISPLAY_NAME'
  | 'INVALID_EMAIL'
  | 'ALREADY_MEMBER'
  | 'CONFIRMATION_REQUIRED'
  | 'CANNOT_REMOVE_OWNER';

// Utility types for authentication
export type AuthenticatedRoute = {
  requireAuth: true;
  requireOnboarding?: boolean;
  allowedRoles?: UserRole[];
  allowedOrganizationTypes?: OrganizationType[];
  requiredPermissions?: Permission[];
};

export type PublicRoute = {
  requireAuth: false;
};

export type RouteConfig = AuthenticatedRoute | PublicRoute;

// Type guards
export function isAuthenticatedRoute(
  route: RouteConfig
): route is AuthenticatedRoute {
  return route.requireAuth === true;
}

export function isPublicRoute(route: RouteConfig): route is PublicRoute {
  return route.requireAuth === false;
}

// Constants
export const DEFAULT_PERMISSIONS = {
  USER: [
    { resource: 'user', action: 'read' },
    { resource: 'user', action: 'update', conditions: { self: true } },
    { resource: 'workout', action: 'create' },
    { resource: 'workout', action: 'read', conditions: { self: true } },
    { resource: 'workout', action: 'update', conditions: { self: true } },
  ],
  FAMILY_ADMIN: [
    { resource: 'organization', action: 'read' },
    { resource: 'organization', action: 'update' },
    { resource: 'organization_members', action: 'read' },
    { resource: 'organization_members', action: 'invite' },
    { resource: 'organization_members', action: 'remove' },
  ],
  GYM_MEMBER: [
    { resource: 'gym_equipment', action: 'read' },
    { resource: 'gym_classes', action: 'read' },
    { resource: 'gym_classes', action: 'book' },
  ],
  GYM_ADMIN: [
    { resource: 'gym', action: 'read' },
    { resource: 'gym', action: 'update' },
    { resource: 'gym_members', action: 'read' },
    { resource: 'gym_members', action: 'manage' },
    { resource: 'gym_equipment', action: 'manage' },
    { resource: 'gym_classes', action: 'manage' },
  ],
  GYM_OWNER: [
    { resource: 'gym', action: 'create' },
    { resource: 'gym', action: 'read' },
    { resource: 'gym', action: 'update' },
    { resource: 'gym', action: 'delete' },
    { resource: 'gym_analytics', action: 'read' },
    { resource: 'gym_billing', action: 'manage' },
  ],
} as const;

export const ORGANIZATION_LIMITS = {
  FAMILY: {
    FREE: { maxMembers: 5 },
    PREMIUM: { maxMembers: 10 },
    ENTERPRISE: { maxMembers: 25 },
  },
  GYM: {
    FREE: { maxMembers: 50 },
    PREMIUM: { maxMembers: 200 },
    ENTERPRISE: { maxMembers: 1000 },
  },
} as const;
