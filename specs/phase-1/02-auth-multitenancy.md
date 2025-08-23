# Phase 1 - PR #2: Authentication & Multi-Tenancy Setup

## Overview

Implement Clerk authentication with multi-tenant organization support to handle both family groups and gym partnerships. This establishes the user management foundation that supports our B2B gym expansion strategy.

## Requirements

### Functional Requirements

- User registration and authentication via Clerk
- Multi-tenant organization support (families and gyms)
- Role-based access control (user, admin, gym_owner)
- Social login options (Google, Apple)
- User profile management with fitness goals
- Organization invitation system

### Non-Functional Requirements

- Authentication response time <500ms
- 99.9% authentication service uptime
- GDPR and privacy compliance
- Multi-factor authentication support
- Secure session management
- Scalable to 10,000+ organizations

## Technical Design

### Authentication Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │   Clerk     │    │   Database  │
│   (PWA)     │◄───┤   Auth      │◄───┤   Profile   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Family    │    │   Gym       │    │   Role      │
│   Group     │    │   Org       │    │   Management│
└─────────────┘    └─────────────┘    └─────────────┘
```

### User Types and Roles

```typescript
type UserRole =
  | 'user'
  | 'family_admin'
  | 'gym_member'
  | 'gym_admin'
  | 'gym_owner';
type OrganizationType = 'family' | 'gym';

interface UserProfile {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId?: string;
  organizationType?: OrganizationType;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryGoals: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Organization Structure

```typescript
interface Organization {
  id: string;
  clerkOrgId: string;
  name: string;
  type: OrganizationType;
  maxMembers: number;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  brandingConfig?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Implementation Steps

### Step 1: Clerk Setup and Configuration

```bash
pnpm add @clerk/nextjs
```

### Step 2: Environment Configuration

```env
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Step 3: Clerk Provider Setup

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### Step 4: Authentication Pages

- `/sign-in` - Custom sign-in page
- `/sign-up` - Custom sign-up page
- `/onboarding` - Post-signup profile setup
- `/organization/create` - Create family/gym organization

### Step 5: Middleware Setup

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up'],
  ignoredRoutes: ['/api/webhooks/(.*)'],
});
```

## Database Schema Updates

### User Profiles Extension

```sql
-- Extend user profiles with organization relationship
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role user_role DEFAULT 'user',
  organization_id UUID REFERENCES organizations(id),
  fitness_level fitness_level DEFAULT 'beginner',
  primary_goals TEXT[] DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table for multi-tenancy
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type organization_type NOT NULL,
  max_members INTEGER DEFAULT 5,
  subscription_tier subscription_tier DEFAULT 'free',
  branding_config JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organization memberships
CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role organization_role DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id)
);
```

### Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY user_profile_policy ON user_profiles
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Organization members can see organization data
CREATE POLICY organization_policy ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id
      FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );
```

## API Routes

### User Profile Management

```typescript
// app/api/user/profile/route.ts
export async function GET() {
  const { userId } = auth();
  // Get user profile with organization data
}

export async function PUT(request: Request) {
  const { userId } = auth();
  // Update user profile
}
```

### Organization Management

```typescript
// app/api/organizations/route.ts
export async function POST(request: Request) {
  // Create new organization (family or gym)
}

// app/api/organizations/[orgId]/members/route.ts
export async function POST(request: Request) {
  // Invite member to organization
}
```

### Webhook Handler

```typescript
// app/api/webhooks/clerk/route.ts
export async function POST(request: Request) {
  // Handle Clerk webhook events
  // - user.created
  // - user.updated
  // - organization.created
  // - organizationMembership.created
}
```

## UI Components

### Authentication Components

1. **SignInPage** - Custom branded sign-in
2. **SignUpPage** - Registration with fitness goals
3. **OnboardingFlow** - Multi-step profile setup
4. **OrganizationSelector** - Switch between family/gym orgs
5. **ProfileSettings** - User profile management

### Organization Components

1. **CreateOrganization** - Family or gym setup
2. **OrganizationSettings** - Branding and configuration
3. **MemberManagement** - Invite and manage members
4. **RoleManagement** - Assign organization roles

## Testing Strategy

### Unit Tests

```typescript
// __tests__/auth/profile.test.ts
describe('User Profile API', () => {
  it('should create user profile after Clerk registration');
  it('should update fitness goals and preferences');
  it('should handle organization membership correctly');
});
```

### Integration Tests

```typescript
// __tests__/auth/organizations.test.ts
describe('Organization Management', () => {
  it('should create family organization');
  it('should create gym organization with branding');
  it('should invite members with correct roles');
  it('should enforce max member limits');
});
```

### E2E Tests

```typescript
// e2e/auth.spec.ts
test('complete user onboarding flow', async ({ page }) => {
  // Sign up → Profile setup → Organization creation → Dashboard
});
```

## Files to Create/Modify

### Configuration

1. `middleware.ts` - Clerk authentication middleware
2. `.env.example` - Add Clerk environment variables
3. `lib/auth.ts` - Authentication utilities

### Database

1. `database/schema/auth.sql` - User and organization tables
2. `database/migrations/001_auth_setup.sql` - Initial migration
3. `lib/db/auth.ts` - Database queries for auth

### API Routes

1. `app/api/user/profile/route.ts` - User profile management
2. `app/api/organizations/route.ts` - Organization CRUD
3. `app/api/webhooks/clerk/route.ts` - Webhook handler

### UI Components

1. `app/sign-in/[[...sign-in]]/page.tsx` - Sign in page
2. `app/sign-up/[[...sign-up]]/page.tsx` - Sign up page
3. `app/onboarding/page.tsx` - User onboarding flow
4. `components/auth/` - Authentication components
5. `components/organizations/` - Organization management

### Types

1. `types/auth.ts` - Authentication type definitions
2. `types/organization.ts` - Organization type definitions

## Success Criteria

### Functional Success

- [x] User can register and sign in via Clerk
- [x] User profile created and managed correctly
- [x] Organizations (family/gym) can be created
- [x] Role-based access control works
- [x] Multi-tenant data isolation enforced

### Technical Success

- [x] All authentication flows work end-to-end
- [x] Database queries respect RLS policies
- [x] Webhook handling is reliable
- [x] Session management is secure
- [x] Organization switching works smoothly

### Performance Success

- Authentication response time <500ms
- Database queries optimized with proper indexes
- Webhook processing completes within 10 seconds
- No memory leaks in authentication state

## Security Considerations

### Data Protection

- All user data encrypted at rest and in transit
- PII handling complies with GDPR requirements
- Secure session token management
- API endpoints protected with proper authorization

### Multi-Tenant Security

- Row-level security prevents cross-tenant data access
- Organization boundaries strictly enforced
- Role-based permissions properly implemented
- Audit logging for sensitive operations

## Dependencies

### Before This PR

- ✅ Project setup completed (PR #1)
- Git repository and basic structure ready

### After This PR

- Ready for database setup (PR #3)
- Ready for security middleware (PR #4)
- User management foundation established

## PR Implementation Guidelines

### Single Responsibility

This PR should focus ONLY on:

- Clerk authentication setup
- Multi-tenant organization structure
- Basic user profile management
- Role-based access foundation

### What NOT to Include

- Complex UI components (separate PR)
- Workout plan features (Phase 2)
- Payment processing (future PR)
- Advanced organization features (Phase 3)

### Testing Checklist

- [ ] Sign up/sign in flows work correctly
- [ ] User profiles created via webhook
- [ ] Organizations can be created and managed
- [ ] Role-based access control functions
- [ ] Multi-tenant data isolation verified
- [ ] All API endpoints properly secured

### Commit Message Format

```
feat: implement Clerk authentication with multi-tenant support

- Set up Clerk with organization support for families and gyms
- Add user profile management with fitness goals
- Implement role-based access control (user, admin, owner)
- Create organization structure for multi-tenancy
- Add database schema with row-level security
- Configure authentication middleware and webhooks

Closes #2
```

## Risk Mitigation

### Potential Issues

1. **Clerk Webhook Delays**: Implement retry logic and job queues
2. **Database Constraint Violations**: Add proper validation
3. **Session Management Issues**: Test thoroughly across devices
4. **Organization Limit Violations**: Enforce limits at API level

### Rollback Strategy

If authentication issues occur:

1. Check Clerk configuration and API keys
2. Verify webhook endpoints are accessible
3. Review database migrations and RLS policies
4. Test authentication flows in staging environment

## Next Steps

After this PR is merged:

1. Set up database schema with migrations (PR #3)
2. Implement security middleware and validation (PR #4)
3. Begin core workout features (Phase 2)
4. Add comprehensive error handling throughout app
