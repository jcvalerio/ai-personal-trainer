# Authentication & Multi-Tenancy Implementation

This document outlines the complete authentication and multi-tenancy system implemented for the AI Personal Trainer PWA.

## Overview

The authentication system is built using Clerk for user management and implements a comprehensive multi-tenant architecture supporting both family groups and gym organizations.

## Key Features

### Authentication

- **Clerk Integration**: Secure authentication with social logins (Google, Apple)
- **Custom UI**: Branded sign-in/sign-up pages with consistent design
- **Middleware Protection**: Route-level authentication enforcement
- **Session Management**: Secure session handling with automatic refreshing
- **Onboarding Flow**: Guided multi-step user setup process

### Multi-Tenancy

- **Organization Types**: Support for 'family' and 'gym' organizations
- **Role-Based Access Control**: Granular permissions system
- **Data Isolation**: Complete tenant separation with Row-Level Security
- **Invitation System**: Secure member invitation with expiring codes
- **Member Management**: Admin tools for user and permission management

### Security

- **Row-Level Security (RLS)**: Database-level tenant isolation
- **Rate Limiting**: API endpoint protection against abuse
- **Input Validation**: Comprehensive request validation with Zod
- **Audit Logging**: Complete security audit trail
- **GDPR Compliance**: User data anonymization and deletion

## Architecture

### Database Schema

- **user_profiles**: User data with fitness information
- **organizations**: Multi-tenant organization structure
- **organization_memberships**: User-organization relationships
- **organization_invitations**: Invitation management system
- **auth_audit_log**: Security audit trail

### API Routes

- `POST /api/user/profile` - Create/update user profiles
- `GET /api/organizations` - List user organizations
- `POST /api/organizations` - Create new organizations
- `GET /api/organizations/[orgId]/members` - List organization members
- `POST /api/organizations/[orgId]/members` - Invite organization members
- `POST /api/webhooks/clerk` - Handle Clerk events

### Authentication Flow

1. User signs up/in via Clerk
2. Webhook creates basic user profile
3. Onboarding completes profile setup
4. User can create/join organizations
5. Role-based access throughout application

## User Roles

### System Roles

- `user`: Basic authenticated user
- `family_admin`: Family organization administrator
- `gym_member`: Gym organization member
- `gym_admin`: Gym organization administrator
- `gym_owner`: Gym organization owner

### Organization Roles

- `member`: Basic organization member
- `admin`: Organization administrator
- `owner`: Organization owner (full control)

## Organization Types

### Family Organizations

- **Purpose**: Private fitness groups for families
- **Max Members**: 5-25 (subscription dependent)
- **Features**: Private workouts, family challenges, progress sharing
- **Security**: Invite-only membership

### Gym Organizations

- **Purpose**: Commercial gym and fitness center management
- **Max Members**: 50-1000+ (subscription dependent)
- **Features**: Equipment tracking, class scheduling, analytics
- **Branding**: Custom logos and colors

## Security Measures

### Authentication Security

- **JWT Tokens**: Secure session tokens from Clerk
- **Middleware Protection**: Server-side route protection
- **Rate Limiting**: Request throttling per user/IP
- **Input Sanitization**: XSS prevention and data cleaning

### Data Security

- **Row-Level Security**: Tenant data isolation at database level
- **Encrypted Storage**: Sensitive data encryption at rest
- **Audit Logging**: Complete activity tracking
- **GDPR Compliance**: Data portability and deletion rights

### Organization Security

- **Invitation Codes**: Cryptographically secure invite codes
- **Member Limits**: Enforced membership boundaries
- **Permission Checks**: Granular access control
- **Admin Oversight**: Administrative control and monitoring

## Performance Targets

- **Authentication Response**: <500ms for all auth operations
- **Database Queries**: Optimized with proper indexing
- **Rate Limits**: 60 RPM standard, 10 RPH for invites
- **Scalability**: Supports 10,000+ organizations

## WCAG 2.1 AA Compliance

### Accessibility Features

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Color Contrast**: Meeting WCAG contrast requirements
- **Focus Management**: Clear focus indicators
- **Alternative Text**: Images and icons with alt text
- **Form Accessibility**: Proper labels and error messages

### Testing

- Automated accessibility testing with axe-core
- Manual testing with screen readers
- Keyboard navigation testing
- Color contrast validation

## Environment Configuration

Required environment variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=32-character-key
```

## Testing Strategy

### Unit Tests

- Authentication utility functions
- Input validation schemas
- Database query functions
- Role permission checks

### Integration Tests

- API route functionality
- Database operations
- Webhook handling
- Multi-tenant isolation

### End-to-End Tests

- Complete authentication flows
- Organization creation and management
- Member invitation process
- Cross-browser compatibility

## Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Webhook endpoints registered
- [ ] SSL certificates installed
- [ ] Rate limiting configured

### Post-Deployment

- [ ] Authentication flows tested
- [ ] Organization creation verified
- [ ] Member invitations working
- [ ] Audit logging functional
- [ ] Performance monitoring enabled

## API Documentation

### Authentication Endpoints

#### POST /api/user/profile

Create or update user profile

```typescript
{
  displayName: string
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  primaryGoals: string[]
  preferences?: UserPreferences
}
```

#### GET /api/organizations

List user organizations

```typescript
Response: Organization[]
```

#### POST /api/organizations

Create new organization

```typescript
{
  name: string
  type: 'family' | 'gym'
  description?: string
  maxMembers?: number
}
```

### Error Codes

- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Monitoring & Maintenance

### Metrics to Monitor

- Authentication success/failure rates
- API response times
- Database query performance
- Webhook processing times
- Security audit events

### Regular Maintenance

- Review audit logs for suspicious activity
- Update dependency versions
- Monitor rate limit effectiveness
- Optimize database queries
- Review and update security policies

## Support & Troubleshooting

### Common Issues

1. **Authentication Failures**: Check Clerk configuration
2. **Webhook Issues**: Verify endpoint accessibility
3. **Permission Errors**: Review role assignments
4. **Database Errors**: Check RLS policies
5. **Rate Limiting**: Adjust limits or implement backoff

### Debug Tools

- Clerk Dashboard for user management
- Database query logs
- API request/response logging
- Webhook event history
- Audit log analysis

This authentication system provides a robust, secure, and scalable foundation for the AI Personal Trainer application, supporting both individual users and multi-tenant organizations with comprehensive security and accessibility features.
