/**
 * Database utilities for authentication and organization operations
 * Handles all database interactions for user profiles, organizations, and memberships
 */

import {
  CreateUserProfileRequest,
  CreateOrganizationRequest,
  OrganizationMembership,
  OrganizationInvite,
  InviteMemberForm,
  AuthError,
  AuthErrorCode,
  ClerkUserWebhookData,
  ClerkOrganizationWebhookData,
} from '@/types/auth';
import { UserProfile, Organization } from '@/types';
import { db } from './connection';

/**
 * User Profile Operations
 */
export async function createUserProfile(
  clerkUserId: string,
  data: CreateUserProfileRequest
): Promise<UserProfile> {
  try {
    const result = await db`
      INSERT INTO user_profiles (
        clerk_user_id,
        email,
        display_name,
        fitness_level,
        height_cm,
        weight_kg,
        birth_date,
        primary_goals,
        preferences
      ) VALUES (
        ${clerkUserId},
        ${''}, -- Email will be updated from webhook
        ${data.displayName},
        ${data.fitnessLevel},
        ${data.heightCm || null},
        ${data.weightKg || null},
        ${data.birthDate || null},
        ${JSON.stringify(data.primaryGoals)},
        ${JSON.stringify(data.preferences || {})}
      )
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Failed to create user profile');
    }

    return mapUserProfileFromDb(result[0]);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw createAuthError(
      'USER_CREATION_FAILED',
      'Failed to create user profile',
      { clerkUserId, error: (error as Error).message }
    );
  }
}

export async function getUserProfileByClerkId(
  clerkUserId: string
): Promise<UserProfile | null> {
  try {
    const result = await db`
      SELECT up.*, o.name as organization_name, o.type as organization_type
      FROM user_profiles up
      LEFT JOIN organizations o ON up.organization_id = o.id
      WHERE up.clerk_user_id = ${clerkUserId} AND up.is_active = true
    `;

    if (result.length === 0) {
      return null;
    }

    return mapUserProfileFromDb(result[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw createAuthError('USER_NOT_FOUND', 'Failed to fetch user profile', {
      clerkUserId,
      error: (error as Error).message,
    });
  }
}

export async function updateUserProfile(
  clerkUserId: string,
  data: Partial<CreateUserProfileRequest>
): Promise<UserProfile> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.displayName !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(data.displayName);
    }

    if (data.fitnessLevel !== undefined) {
      updates.push(`fitness_level = $${paramIndex++}`);
      values.push(data.fitnessLevel);
    }

    if (data.heightCm !== undefined) {
      updates.push(`height_cm = $${paramIndex++}`);
      values.push(data.heightCm);
    }

    if (data.weightKg !== undefined) {
      updates.push(`weight_kg = $${paramIndex++}`);
      values.push(data.weightKg);
    }

    if (data.birthDate !== undefined) {
      updates.push(`birth_date = $${paramIndex++}`);
      values.push(data.birthDate);
    }

    if (data.primaryGoals !== undefined) {
      updates.push(`primary_goals = $${paramIndex++}`);
      values.push(JSON.stringify(data.primaryGoals));
    }

    if (data.preferences !== undefined) {
      updates.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(data.preferences));
    }

    if (updates.length === 0) {
      const existing = await getUserProfileByClerkId(clerkUserId);
      if (!existing) {
        throw new Error('User profile not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(clerkUserId);

    const query = `
      UPDATE user_profiles 
      SET ${updates.join(', ')}
      WHERE clerk_user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.queryRaw(query, values);

    if (result.length === 0) {
      throw new Error('User profile not found or update failed');
    }

    return mapUserProfileFromDb(result[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw createAuthError(
      'USER_UPDATE_FAILED',
      'Failed to update user profile',
      { clerkUserId, error: (error as Error).message }
    );
  }
}

export async function deleteUserProfile(clerkUserId: string): Promise<boolean> {
  try {
    // Remove from organizations first
    await db.queryRaw(
      `
      UPDATE organization_memberships 
      SET is_active = false, left_at = CURRENT_TIMESTAMP
      WHERE user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = $1)
    `,
      [clerkUserId]
    );

    // Soft delete the user profile
    await db.queryRaw(
      `
      UPDATE user_profiles 
      SET is_active = false, account_status = 'deactivated', updated_at = CURRENT_TIMESTAMP
      WHERE clerk_user_id = $1
    `,
      [clerkUserId]
    );

    // Log the deletion
    await logAuthEvent(
      'user_deleted',
      'auth',
      'User account deleted',
      clerkUserId
    );

    return true;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw createAuthError(
      'USER_DELETION_FAILED',
      'Failed to delete user profile',
      { clerkUserId, error: (error as Error).message }
    );
  }
}

/**
 * Organization Operations
 */
export async function createOrganization(
  clerkOrgId: string,
  data: CreateOrganizationRequest
): Promise<Organization> {
  try {
    const maxMembers = data.maxMembers || (data.type === 'family' ? 10 : 100);

    const query = `
      INSERT INTO organizations (
        clerk_org_id,
        name,
        description,
        type,
        max_members,
        branding_config,
        settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      clerkOrgId,
      data.name,
      data.description || null,
      data.type,
      maxMembers,
      JSON.stringify(data.brandingConfig || {}),
      JSON.stringify(data.settings || {}),
    ];

    const result = await db.queryRaw(query, values);

    if (result.length === 0) {
      throw new Error('Failed to create organization');
    }

    return mapOrganizationFromDb(result[0]);
  } catch (error) {
    console.error('Error creating organization:', error);
    throw createAuthError(
      'ORG_CREATION_FAILED',
      'Failed to create organization',
      { clerkOrgId, error: (error as Error).message }
    );
  }
}

export async function getOrganizationByClerkId(
  clerkOrgId: string
): Promise<Organization | null> {
  try {
    const query = `
      SELECT * FROM organizations 
      WHERE clerk_org_id = $1 AND is_active = true
    `;

    const result = await db.queryRaw(query, [clerkOrgId]);

    if (result.length === 0) {
      return null;
    }

    return mapOrganizationFromDb(result[0]);
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw createAuthError(
      'ORGANIZATION_NOT_FOUND',
      'Failed to fetch organization',
      { clerkOrgId, error: (error as Error).message }
    );
  }
}

export async function getUserOrganizations(
  clerkUserId: string
): Promise<Organization[]> {
  try {
    const query = `
      SELECT o.*, om.role as user_role
      FROM organizations o
      JOIN organization_memberships om ON o.id = om.organization_id
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = $1 
      AND om.is_active = true 
      AND o.is_active = true
      ORDER BY om.joined_at DESC
    `;

    const result = await db.queryRaw(query, [clerkUserId]);

    return result.map((row) => mapOrganizationFromDb(row));
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    throw createAuthError(
      'ORG_FETCH_FAILED',
      'Failed to fetch user organizations',
      { clerkUserId, error: (error as Error).message }
    );
  }
}

/**
 * Organization Membership Operations
 */
export async function addUserToOrganization(
  organizationId: string,
  userId: string,
  role: 'member' | 'admin' | 'owner' = 'member',
  invitedBy?: string
): Promise<OrganizationMembership> {
  try {
    const query = `
      INSERT INTO organization_memberships (
        organization_id,
        user_id,
        role,
        invited_by,
        invited_at,
        joined_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      organizationId,
      userId,
      role,
      invitedBy || null,
      invitedBy ? new Date() : null,
    ];

    const result = await db.queryRaw(query, values);

    if (result.length === 0) {
      throw new Error('Failed to add user to organization');
    }

    return mapMembershipFromDb(result[0]);
  } catch (error) {
    console.error('Error adding user to organization:', error);
    if ((error as Error).message.includes('maximum member limit')) {
      throw createAuthError('MAX_MEMBERS_REACHED', (error as Error).message, {
        organizationId,
        userId,
      });
    }
    throw createAuthError(
      'MEMBERSHIP_FAILED',
      'Failed to add user to organization',
      { organizationId, userId, error: (error as Error).message }
    );
  }
}

export async function removeUserFromOrganization(
  organizationId: string,
  userId: string
): Promise<boolean> {
  try {
    const query = `
      UPDATE organization_memberships 
      SET is_active = false, left_at = CURRENT_TIMESTAMP
      WHERE organization_id = $1 AND user_id = $2 AND is_active = true
    `;

    const result = await db.queryRaw(query, [organizationId, userId]);

    return result.length > 0;
  } catch (error) {
    console.error('Error removing user from organization:', error);
    throw createAuthError(
      'MEMBERSHIP_REMOVAL_FAILED',
      'Failed to remove user from organization',
      { organizationId, userId, error: (error as Error).message }
    );
  }
}

export async function getOrganizationMembers(
  organizationId: string
): Promise<Array<UserProfile & { role: string; joinedAt: Date }>> {
  try {
    const query = `
      SELECT up.*, om.role as organization_role, om.joined_at
      FROM user_profiles up
      JOIN organization_memberships om ON up.id = om.user_id
      WHERE om.organization_id = $1 AND om.is_active = true AND up.is_active = true
      ORDER BY om.joined_at ASC
    `;

    const result = await db.queryRaw(query, [organizationId]);

    return result.map((row) => {
      const profile = mapUserProfileFromDb(row);
      return {
        ...profile,
        role: row.organization_role as string,
        joinedAt: new Date(row.joined_at as string),
      } as UserProfile & { role: string; joinedAt: Date };
    });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    throw createAuthError(
      'MEMBERS_FETCH_FAILED',
      'Failed to fetch organization members',
      { organizationId, error: (error as Error).message }
    );
  }
}

/**
 * Invitation Operations
 */
export async function createOrganizationInvite(
  organizationId: string,
  inviterId: string,
  inviteData: InviteMemberForm
): Promise<OrganizationInvite> {
  try {
    const inviteCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

    const query = `
      INSERT INTO organization_invitations (
        organization_id,
        inviter_id,
        invitee_email,
        role,
        invite_code,
        custom_message,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      organizationId,
      inviterId,
      inviteData.email.toLowerCase(),
      inviteData.role,
      inviteCode,
      inviteData.customMessage || null,
      expiresAt,
    ];

    const result = await db.queryRaw(query, values);

    if (result.length === 0) {
      throw new Error('Failed to create invitation');
    }

    return mapInvitationFromDb(result[0]);
  } catch (error) {
    console.error('Error creating organization invite:', error);
    throw createAuthError(
      'INVITE_CREATION_FAILED',
      'Failed to create invitation',
      { organizationId, inviterId, error: (error as Error).message }
    );
  }
}

export async function getInvitationByCode(
  inviteCode: string
): Promise<OrganizationInvite | null> {
  try {
    const query = `
      SELECT oi.*, o.name as organization_name, o.type as organization_type,
             up.display_name as inviter_name, up.email as inviter_email
      FROM organization_invitations oi
      JOIN organizations o ON oi.organization_id = o.id
      JOIN user_profiles up ON oi.inviter_id = up.id
      WHERE oi.invite_code = $1
    `;

    const result = await db.queryRaw(query, [inviteCode.toUpperCase()]);

    if (result.length === 0) {
      return null;
    }

    return mapInvitationFromDb(result[0]);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    throw createAuthError('INVITE_FETCH_FAILED', 'Failed to fetch invitation', {
      inviteCode,
      error: (error as Error).message,
    });
  }
}

export async function acceptInvitation(
  inviteCode: string,
  userId: string
): Promise<boolean> {
  try {
    // First, update the invitation and get the organization details
    const inviteResult = await db.queryRaw<{
      organization_id: string;
      role: string;
    }>(
      `
      UPDATE organization_invitations 
      SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP, accepted_by = $1
      WHERE invite_code = $2 AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP
      RETURNING organization_id, role
    `,
      [userId, inviteCode.toUpperCase()]
    );

    if (inviteResult.length === 0) {
      throw new Error('Invalid or expired invitation');
    }

    const { organization_id, role } = inviteResult[0]!;

    // Add user to organization
    await db.queryRaw(
      `
      INSERT INTO organization_memberships (organization_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (organization_id, user_id) 
      DO UPDATE SET is_active = true, role = $3, joined_at = CURRENT_TIMESTAMP
    `,
      [organization_id, userId, role]
    );

    return true;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    if ((error as Error).message.includes('Invalid or expired')) {
      throw createAuthError('INVITE_EXPIRED', (error as Error).message, {
        inviteCode,
      });
    }
    throw createAuthError(
      'INVITE_ACCEPTANCE_FAILED',
      'Failed to accept invitation',
      { inviteCode, userId, error: (error as Error).message }
    );
  }
}

/**
 * Webhook Handlers
 */
export async function handleClerkUserWebhook(
  eventType: string,
  data: ClerkUserWebhookData
): Promise<void> {
  try {
    switch (eventType) {
      case 'user.created':
        // Create basic user profile
        await db`
          INSERT INTO user_profiles (clerk_user_id, email, display_name)
          VALUES (${data.id}, ${data.email_addresses[0]?.email_address || ''}, ${`${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email_addresses[0]?.email_address || 'User'})
          ON CONFLICT (clerk_user_id) DO NOTHING
        `;
        break;

      case 'user.updated':
        // Update user profile
        await db`
          UPDATE user_profiles 
          SET email = ${data.email_addresses[0]?.email_address || ''}, display_name = ${`${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email_addresses[0]?.email_address || 'User'}, updated_at = CURRENT_TIMESTAMP
          WHERE clerk_user_id = ${data.id}
        `;
        break;

      case 'user.deleted':
        // Soft delete user
        await deleteUserProfile(data.id);
        break;
    }

    await logAuthEvent(
      `clerk_${eventType}`,
      'auth',
      `Clerk webhook: ${eventType}`,
      data.id
    );
  } catch (error) {
    console.error('Error handling Clerk user webhook:', error);
    throw error;
  }
}

export async function handleClerkOrganizationWebhook(
  eventType: string,
  data: ClerkOrganizationWebhookData
): Promise<void> {
  try {
    switch (eventType) {
      case 'organization.created':
        // This would be handled by the application when user creates organization
        break;

      case 'organization.updated':
        // Update organization data
        await db`
          UPDATE organizations 
          SET name = ${data.name}, updated_at = CURRENT_TIMESTAMP
          WHERE clerk_org_id = ${data.id}
        `;
        break;

      case 'organization.deleted':
        // Soft delete organization
        await db`
          UPDATE organizations 
          SET is_active = false, updated_at = CURRENT_TIMESTAMP
          WHERE clerk_org_id = ${data.id}
        `;
        break;
    }

    await logAuthEvent(
      `clerk_${eventType}`,
      'organization',
      `Clerk webhook: ${eventType}`,
      undefined,
      data.id
    );
  } catch (error) {
    console.error('Error handling Clerk organization webhook:', error);
    throw error;
  }
}

/**
 * Utility Functions
 */
export async function logAuthEvent(
  eventType: string,
  category: 'auth' | 'profile' | 'organization' | 'invitation' | 'security',
  description: string,
  clerkUserId?: string,
  organizationId?: string,
  additionalData?: Record<string, any>
): Promise<void> {
  try {
    let userId: string | null = null;

    if (clerkUserId) {
      const userResult = await db<{ id: string }>`
        SELECT id FROM user_profiles WHERE clerk_user_id = ${clerkUserId}
      `;

      if (userResult.length > 0) {
        userId = userResult[0]!.id as string;
      }
    }

    await db`
      INSERT INTO auth_audit_log (
        user_id,
        organization_id,
        event_type,
        event_category,
        event_description,
        additional_data
      ) VALUES (
        ${userId},
        ${organizationId || null},
        ${eventType},
        ${category},
        ${description},
        ${JSON.stringify(additionalData || {})}
      )
    `;
  } catch (error) {
    // Don't throw on audit log failures, just log the error
    console.error('Error logging auth event:', error);
  }
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createAuthError(
  code: AuthErrorCode,
  message: string,
  details?: Record<string, any> | undefined
): AuthError {
  return {
    code,
    message,
    details: details || undefined,
  };
}

// Database mapping functions
function mapUserProfileFromDb(row: any): UserProfile {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    fitnessLevel: row.fitness_level,
    heightCm: row.height_cm,
    weightKg: parseFloat(row.weight_kg),
    birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
    primaryGoals: row.primary_goals || [],
    organizationId: row.organization_id,
    role: row.role,
    subscriptionTier: row.subscription_tier,
    preferences: row.preferences || {},
    notificationSettings: row.notification_settings || {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastActiveAt: new Date(row.last_active_at),
  };
}

function mapOrganizationFromDb(row: any): Organization {
  return {
    id: row.id,
    clerkOrgId: row.clerk_org_id,
    name: row.name,
    description: row.description,
    type: row.type,
    maxMembers: row.max_members,
    subscriptionTier: row.subscription_tier,
    address: (row.contact_info || {}).address,
    contactInfo: {
      phone: (row.contact_info || {}).phone,
      email: (row.contact_info || {}).email,
      website: (row.contact_info || {}).website,
    },
    operatingHours: row.operating_hours || {},
    brandingConfig: row.branding_config || {},
    settings: row.settings || {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    isActive: row.is_active,
  };
}

function mapMembershipFromDb(row: any): OrganizationMembership {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    invitedBy: row.invited_by,
    invitedAt: row.invited_at ? new Date(row.invited_at) : undefined,
    joinedAt: new Date(row.joined_at),
    isActive: row.is_active,
    permissions: row.permissions || [],
  };
}

function mapInvitationFromDb(row: any): OrganizationInvite {
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    organizationType: row.organization_type,
    inviterName: row.inviter_name,
    inviterEmail: row.inviter_email,
    inviteeEmail: row.invitee_email,
    role: row.role,
    inviteCode: row.invite_code,
    expiresAt: new Date(row.expires_at),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,
    rejectedAt: row.rejected_at ? new Date(row.rejected_at) : undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}
