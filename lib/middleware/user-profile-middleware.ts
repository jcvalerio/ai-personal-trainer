/**
 * User Profile Middleware
 * Automatically creates user profiles for authenticated Clerk users
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/connection';

interface UserProfileData {
  id: string;
  clerk_user_id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Ensures a user profile exists for the authenticated user
 * Creates one automatically if it doesn't exist
 */
export async function ensureUserProfile(
  clerkUserId: string,
  userEmail?: string,
  displayName?: string,
  avatarUrl?: string
): Promise<UserProfileData> {
  try {
    // Try to find existing user profile
    const existingProfile = await db<UserProfileData>`
      SELECT id, clerk_user_id, email, display_name, avatar_url, created_at, updated_at
      FROM user_profiles
      WHERE clerk_user_id = ${clerkUserId}
      LIMIT 1
    `;

    if (existingProfile.length > 0) {
      // Update last active timestamp
      await db`
        UPDATE user_profiles 
        SET last_active_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE clerk_user_id = ${clerkUserId}
      `;
      
      return existingProfile[0];
    }

    // Create new user profile using the database function
    const profileId = await db`
      SELECT create_user_profile_if_not_exists(
        ${clerkUserId}::varchar,
        ${userEmail || `user-${clerkUserId}@example.com`}::varchar,
        ${displayName || 'User'}::varchar
      ) as user_id
    `;

    // Get the created/existing profile
    const newProfile = await db<UserProfileData>`
      SELECT * FROM user_profiles 
      WHERE id = ${profileId[0].user_id}
    `;

    if (newProfile.length === 0) {
      throw new Error('Failed to create user profile');
    }

    // Update avatar URL if provided
    if (avatarUrl) {
      await db`
        UPDATE user_profiles 
        SET avatar_url = ${avatarUrl}, updated_at = CURRENT_TIMESTAMP
        WHERE clerk_user_id = ${clerkUserId}
      `;
    }

    console.log(`✅ Created new user profile for Clerk user: ${clerkUserId}`);
    return newProfile[0];

  } catch (error) {
    console.error('❌ User profile creation failed:', error);
    
    // Provide detailed error information
    if (error instanceof Error) {
      if (error.message.includes('user_profiles')) {
        throw new Error(
          'Database table "user_profiles" does not exist. Please run database initialization script.'
        );
      } else if (error.message.includes('create_user_profile_if_not_exists')) {
        throw new Error(
          'Database function "create_user_profile_if_not_exists" does not exist. Please run database initialization script.'
        );
      }
    }
    
    throw error;
  }
}

/**
 * Middleware function to ensure user profile exists
 * Can be used in API routes or server components
 */
export async function withUserProfile() {
  const { userId, user } = await auth();
  
  if (!userId) {
    return {
      error: 'Authentication required',
      status: 401
    };
  }

  try {
    const userProfile = await ensureUserProfile(
      userId,
      user?.emailAddresses?.[0]?.emailAddress,
      user?.fullName || user?.firstName || 'User',
      user?.imageUrl
    );

    return {
      userId,
      userProfile,
      organizationId: userProfile.id // Can be enhanced for multi-tenant support
    };
  } catch (error) {
    console.error('User profile middleware error:', error);
    return {
      error: error instanceof Error ? error.message : 'User profile creation failed',
      status: 500
    };
  }
}

/**
 * API route wrapper that ensures user profile exists
 */
export function withUserProfileAPI<T = any>(
  handler: (
    request: NextRequest,
    context: { 
      params: T;
      userId: string;
      userProfile: UserProfileData;
      organizationId?: string;
    }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, { params }: { params: T }) => {
    const profileResult = await withUserProfile();
    
    if ('error' in profileResult) {
      return NextResponse.json(
        {
          success: false,
          error: profileResult.error,
          code: profileResult.status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR'
        },
        { status: profileResult.status }
      );
    }

    return handler(request, {
      params,
      userId: profileResult.userId,
      userProfile: profileResult.userProfile,
      organizationId: profileResult.organizationId
    });
  };
}