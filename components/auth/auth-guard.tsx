/**
 * Authentication Guard Component
 * Protects components and pages with authentication requirements
 */

'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingPage } from '@/components/ui/loading';
import { AuthError } from '@/components/ui/error';
import { UserRole, OrganizationType } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  allowedRoles?: UserRole[];
  allowedOrganizationTypes?: OrganizationType[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireOnboarding = true,
  allowedRoles,
  allowedOrganizationTypes,
  fallback,
  redirectTo,
}: AuthGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { userId } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<{ message: string; code: string } | null>(
    null
  );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    // Check authentication requirement
    if (requireAuth && !isSignedIn) {
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }
      setError({
        message: 'You need to sign in to access this page.',
        code: 'SIGN_IN_REQUIRED',
      });
      setIsChecking(false);
      return;
    }

    // If no auth required and user is not signed in, show content
    if (!requireAuth && !isSignedIn) {
      setIsChecking(false);
      return;
    }

    // If user is signed in, perform additional checks
    if (isSignedIn && user) {
      const metadata = user.publicMetadata as any;

      // Check onboarding requirement
      if (requireOnboarding && !metadata?.hasCompletedOnboarding) {
        router.push('/onboarding');
        return;
      }

      // Check role requirements
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = metadata?.role as UserRole;
        if (!userRole || !allowedRoles.includes(userRole)) {
          setError({
            message:
              "You don't have the required permissions to access this page.",
            code: 'INSUFFICIENT_PERMISSIONS',
          });
          setIsChecking(false);
          return;
        }
      }

      // Check organization type requirements
      if (allowedOrganizationTypes && allowedOrganizationTypes.length > 0) {
        const orgType = metadata?.organizationType as OrganizationType;
        if (!orgType || !allowedOrganizationTypes.includes(orgType)) {
          setError({
            message:
              'This feature is not available for your organization type.',
            code: 'ORGANIZATION_TYPE_RESTRICTED',
          });
          setIsChecking(false);
          return;
        }
      }
    }

    setIsChecking(false);
  }, [
    isLoaded,
    isSignedIn,
    user,
    requireAuth,
    requireOnboarding,
    allowedRoles,
    allowedOrganizationTypes,
    router,
    redirectTo,
  ]);

  // Show loading while checking authentication
  if (!isLoaded || isChecking) {
    return <LoadingPage message='Checking authentication...' />;
  }

  // Show error if authentication failed
  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AuthError error={error.message} code={error.code} />;
  }

  // Show content if all checks pass
  return <>{children}</>;
}

// Convenience wrapper for pages that require authentication
export function RequireAuth({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={true}>
      {children}
    </AuthGuard>
  );
}

// Convenience wrapper for admin-only content
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard
      requireAuth={true}
      requireOnboarding={true}
      allowedRoles={['family_admin', 'gym_admin', 'gym_owner']}
    >
      {children}
    </AuthGuard>
  );
}

// Convenience wrapper for gym-only features
export function RequireGym({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard
      requireAuth={true}
      requireOnboarding={true}
      allowedOrganizationTypes={['gym']}
    >
      {children}
    </AuthGuard>
  );
}

// Convenience wrapper for family-only features
export function RequireFamily({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard
      requireAuth={true}
      requireOnboarding={true}
      allowedOrganizationTypes={['family']}
    >
      {children}
    </AuthGuard>
  );
}

// Hook for checking authentication status in components
export function useAuthGuard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { userId } = useAuth();

  const isAuthenticated = isSignedIn && !!userId;
  const hasCompletedOnboarding = user?.publicMetadata
    ?.hasCompletedOnboarding as boolean;
  const userRole = user?.publicMetadata?.role as UserRole;
  const organizationType = user?.publicMetadata
    ?.organizationType as OrganizationType;

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!userRole) {
      return false;
    }
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(userRole);
  };

  const hasOrganizationType = (
    types: OrganizationType | OrganizationType[]
  ) => {
    if (!organizationType) {
      return false;
    }
    const typeArray = Array.isArray(types) ? types : [types];
    return typeArray.includes(organizationType);
  };

  const isAdmin = hasRole(['family_admin', 'gym_admin', 'gym_owner']);
  const isOwner = hasRole(['gym_owner']);
  const isGymMember = hasOrganizationType('gym');
  const isFamilyMember = hasOrganizationType('family');

  return {
    isLoaded,
    isAuthenticated,
    hasCompletedOnboarding,
    userRole,
    organizationType,
    hasRole,
    hasOrganizationType,
    isAdmin,
    isOwner,
    isGymMember,
    isFamilyMember,
    user,
    userId,
  };
}
