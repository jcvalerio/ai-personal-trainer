-- Authentication and Multi-Tenancy Schema
-- This file contains all authentication and organization-related tables with RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types for authentication and organization system
CREATE TYPE user_role AS ENUM ('user', 'family_admin', 'gym_member', 'gym_admin', 'gym_owner');
CREATE TYPE organization_type AS ENUM ('family', 'gym');
CREATE TYPE organization_role AS ENUM ('member', 'admin', 'owner');
CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Organizations table (must come first due to foreign key relationships)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  type organization_type NOT NULL,
  max_members INTEGER DEFAULT 5 CHECK (max_members > 0),
  current_member_count INTEGER DEFAULT 0 CHECK (current_member_count >= 0),
  subscription_tier subscription_tier DEFAULT 'free',
  
  -- Organization settings and configuration
  settings JSONB DEFAULT '{
    "allowMemberInvites": true,
    "requireApprovalForJoining": false,
    "shareEquipmentDatabase": false,
    "enableLeaderboards": true,
    "autoApproveMembers": true,
    "maxWorkoutsPerWeek": 50,
    "dataRetentionDays": 365
  }'::jsonb,
  
  -- Branding configuration for gym organizations
  branding_config JSONB DEFAULT '{
    "logo": null,
    "primaryColor": "#3b82f6",
    "secondaryColor": "#1e40af",
    "theme": "light",
    "customDomain": null
  }'::jsonb,
  
  -- Contact information (mainly for gyms)
  contact_info JSONB DEFAULT '{
    "phone": null,
    "email": null,
    "website": null,
    "address": {
      "street": null,
      "city": null,
      "state": null,
      "zipCode": null,
      "country": null,
      "coordinates": {
        "latitude": null,
        "longitude": null
      }
    }
  }'::jsonb,
  
  -- Operating hours for gym organizations
  operating_hours JSONB DEFAULT '{
    "monday": {"open": "06:00", "close": "22:00", "closed": false},
    "tuesday": {"open": "06:00", "close": "22:00", "closed": false},
    "wednesday": {"open": "06:00", "close": "22:00", "closed": false},
    "thursday": {"open": "06:00", "close": "22:00", "closed": false},
    "friday": {"open": "06:00", "close": "22:00", "closed": false},
    "saturday": {"open": "08:00", "close": "20:00", "closed": false},
    "sunday": {"open": "08:00", "close": "20:00", "closed": false}
  }'::jsonb,
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_member_count CHECK (current_member_count <= max_members),
  CONSTRAINT valid_organization_name CHECK (LENGTH(TRIM(name)) >= 2)
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  
  -- User role and organization relationship
  role user_role DEFAULT 'user',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Fitness profile information
  fitness_level fitness_level DEFAULT 'beginner',
  height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 1000),
  birth_date DATE CHECK (birth_date <= CURRENT_DATE - INTERVAL '13 years'),
  primary_goals TEXT[] DEFAULT '{}',
  
  -- User preferences
  preferences JSONB DEFAULT '{
    "units": "metric",
    "workoutReminders": true,
    "shareProgress": false,
    "theme": "auto",
    "language": "en",
    "timezone": "UTC",
    "weekStartDay": "monday"
  }'::jsonb,
  
  -- Notification settings
  notification_settings JSONB DEFAULT '{
    "workoutReminders": true,
    "progressUpdates": true,
    "socialInteractions": false,
    "systemUpdates": true,
    "email": true,
    "push": true,
    "sms": false
  }'::jsonb,
  
  -- Subscription and limits
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Activity tracking
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_workouts INTEGER DEFAULT 0 CHECK (total_workouts >= 0),
  total_workout_minutes INTEGER DEFAULT 0 CHECK (total_workout_minutes >= 0),
  current_streak_days INTEGER DEFAULT 0 CHECK (current_streak_days >= 0),
  longest_streak_days INTEGER DEFAULT 0 CHECK (longest_streak_days >= 0),
  
  -- Privacy and safety
  is_public_profile BOOLEAN DEFAULT FALSE,
  is_searchable BOOLEAN DEFAULT FALSE,
  data_processing_consent BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  account_status VARCHAR(50) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_display_name CHECK (LENGTH(TRIM(display_name)) >= 2),
  CONSTRAINT valid_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_age CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE - INTERVAL '13 years')
);

-- Organization memberships table (many-to-many relationship)
CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role organization_role DEFAULT 'member',
  
  -- Membership metadata
  invited_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP WITH TIME ZONE,
  
  -- Permissions and settings
  permissions JSONB DEFAULT '{
    "canInviteMembers": false,
    "canManageWorkouts": false,
    "canViewAnalytics": false,
    "canManageEquipment": false,
    "canManageSettings": false
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(organization_id, user_id),
  CONSTRAINT no_self_invite CHECK (invited_by != user_id),
  CONSTRAINT valid_membership_dates CHECK (left_at IS NULL OR left_at >= joined_at)
);

-- Organization invitations table
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Invitation details
  invitee_email VARCHAR(255) NOT NULL,
  invitee_name VARCHAR(100),
  role organization_role DEFAULT 'member',
  invite_code VARCHAR(8) NOT NULL UNIQUE,
  custom_message TEXT,
  
  -- Status and timing
  status invitation_status DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Accepter information (when accepted)
  accepted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_invite_code CHECK (invite_code ~ '^[A-Z0-9]{8}$'),
  CONSTRAINT valid_email_format CHECK (invitee_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_expiry CHECK (expires_at > invited_at),
  CONSTRAINT valid_acceptance CHECK (accepted_at IS NULL OR accepted_at >= invited_at),
  CONSTRAINT valid_rejection CHECK (rejected_at IS NULL OR rejected_at >= invited_at),
  CONSTRAINT no_self_invite CHECK (inviter_id != accepted_by)
);

-- Audit log table for security and compliance
CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(50) NOT NULL, -- 'auth', 'profile', 'organization', 'invitation'
  event_description TEXT NOT NULL,
  
  -- Context and metadata
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  additional_data JSONB DEFAULT '{}',
  
  -- Risk assessment
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  is_suspicious BOOLEAN DEFAULT FALSE,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (LENGTH(TRIM(event_type)) > 0),
  CONSTRAINT valid_event_category CHECK (event_category IN ('auth', 'profile', 'organization', 'invitation', 'security'))
);

-- Indexes for performance optimization
CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_organization_id ON user_profiles(organization_id);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active, created_at);
CREATE INDEX idx_user_profiles_role ON user_profiles(role) WHERE is_active = true;

CREATE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_active ON organizations(is_active, created_at);
CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE is_active = true;

CREATE INDEX idx_org_memberships_org_id ON organization_memberships(organization_id);
CREATE INDEX idx_org_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX idx_org_memberships_active ON organization_memberships(is_active, joined_at);
CREATE INDEX idx_org_memberships_role ON organization_memberships(role) WHERE is_active = true;

CREATE INDEX idx_org_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(invitee_email);
CREATE INDEX idx_org_invitations_code ON organization_invitations(invite_code);
CREATE INDEX idx_org_invitations_status ON organization_invitations(status, expires_at);
CREATE INDEX idx_org_invitations_pending ON organization_invitations(organization_id, status) WHERE status = 'pending';

CREATE INDEX idx_audit_log_user_id ON auth_audit_log(user_id, created_at);
CREATE INDEX idx_audit_log_org_id ON auth_audit_log(organization_id, created_at);
CREATE INDEX idx_audit_log_event_type ON auth_audit_log(event_type, created_at);
CREATE INDEX idx_audit_log_suspicious ON auth_audit_log(is_suspicious, created_at) WHERE is_suspicious = true;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from JWT
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    NULLIF(current_setting('request.jwt.sub', true), '')
  )::UUID;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE clerk_user_id = auth.user_id()::text;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check organization membership
CREATE OR REPLACE FUNCTION auth.is_org_member(org_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM organization_memberships om
    JOIN user_profiles up ON om.user_id = up.id
    WHERE om.organization_id = org_id 
    AND up.clerk_user_id = auth.user_id()::text
    AND om.is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check organization admin/owner role
CREATE OR REPLACE FUNCTION auth.is_org_admin(org_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM organization_memberships om
    JOIN user_profiles up ON om.user_id = up.id
    WHERE om.organization_id = org_id 
    AND up.clerk_user_id = auth.user_id()::text
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- User Profiles RLS Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (clerk_user_id = auth.user_id()::text);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (clerk_user_id = auth.user_id()::text);

CREATE POLICY "System can insert user profiles" ON user_profiles
  FOR INSERT WITH CHECK (true); -- Controlled by application logic

CREATE POLICY "Users can view org member profiles" ON user_profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = auth.user_id()::text
      AND om.is_active = true
    )
  );

-- Organizations RLS Policies
CREATE POLICY "Org members can view organization" ON organizations
  FOR SELECT USING (auth.is_org_member(id));

CREATE POLICY "Org admins can update organization" ON organizations
  FOR UPDATE USING (auth.is_org_admin(id));

CREATE POLICY "System can insert organizations" ON organizations
  FOR INSERT WITH CHECK (true); -- Controlled by application logic

-- Organization Memberships RLS Policies
CREATE POLICY "Users can view memberships in their orgs" ON organization_memberships
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = auth.user_id()::text
      AND om.is_active = true
    )
  );

CREATE POLICY "Org admins can manage memberships" ON organization_memberships
  FOR ALL USING (auth.is_org_admin(organization_id));

CREATE POLICY "System can insert memberships" ON organization_memberships
  FOR INSERT WITH CHECK (true); -- Controlled by application logic

-- Organization Invitations RLS Policies
CREATE POLICY "Org admins can view invitations" ON organization_invitations
  FOR SELECT USING (auth.is_org_admin(organization_id));

CREATE POLICY "Org admins can create invitations" ON organization_invitations
  FOR INSERT WITH CHECK (auth.is_org_admin(organization_id));

CREATE POLICY "Invitees can view their invitations" ON organization_invitations
  FOR SELECT USING (
    invitee_email = (
      SELECT email FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

CREATE POLICY "Invitees can update their invitations" ON organization_invitations
  FOR UPDATE USING (
    invitee_email = (
      SELECT email FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

-- Audit Log RLS Policies
CREATE POLICY "Users can view their audit logs" ON auth_audit_log
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

CREATE POLICY "System can insert audit logs" ON auth_audit_log
  FOR INSERT WITH CHECK (true); -- Controlled by application logic

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_memberships_updated_at BEFORE UPDATE ON organization_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_invitations_updated_at BEFORE UPDATE ON organization_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update organization member count
CREATE OR REPLACE FUNCTION update_organization_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
        UPDATE organizations 
        SET current_member_count = current_member_count + 1
        WHERE id = NEW.organization_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active THEN
        IF NEW.is_active = true THEN
            UPDATE organizations 
            SET current_member_count = current_member_count + 1
            WHERE id = NEW.organization_id;
        ELSE
            UPDATE organizations 
            SET current_member_count = current_member_count - 1
            WHERE id = NEW.organization_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
        UPDATE organizations 
        SET current_member_count = current_member_count - 1
        WHERE id = OLD.organization_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_organization_member_count 
    AFTER INSERT OR UPDATE OR DELETE ON organization_memberships
    FOR EACH ROW EXECUTE FUNCTION update_organization_member_count();

-- Function to generate unique organization slug
CREATE OR REPLACE FUNCTION generate_org_slug(org_name TEXT) RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    base_slug := LOWER(TRIM(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9\s]', '', 'g')));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := TRIM(both '-' FROM base_slug);
    
    -- Limit slug length
    base_slug := SUBSTRING(base_slug FROM 1 FOR 50);
    
    final_slug := base_slug;
    
    WHILE EXISTS(SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate slug on organization creation
CREATE OR REPLACE FUNCTION set_organization_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_org_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_org_slug_trigger BEFORE INSERT ON organizations
    FOR EACH ROW EXECUTE FUNCTION set_organization_slug();

-- Function to validate organization member limits
CREATE OR REPLACE FUNCTION validate_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    org_record RECORD;
BEGIN
    SELECT max_members, current_member_count 
    INTO org_record 
    FROM organizations 
    WHERE id = NEW.organization_id;
    
    IF org_record.current_member_count >= org_record.max_members THEN
        RAISE EXCEPTION 'Organization has reached maximum member limit of %', org_record.max_members;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_member_limit BEFORE INSERT ON organization_memberships
    FOR EACH ROW EXECUTE FUNCTION validate_member_limit();

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'User profile information with fitness data and preferences';
COMMENT ON TABLE organizations IS 'Organizations (families/gyms) with multi-tenant configuration';
COMMENT ON TABLE organization_memberships IS 'Many-to-many relationship between users and organizations';
COMMENT ON TABLE organization_invitations IS 'Invitation system for organization membership';
COMMENT ON TABLE auth_audit_log IS 'Security audit trail for authentication and authorization events';

COMMENT ON COLUMN user_profiles.clerk_user_id IS 'Unique identifier from Clerk authentication service';
COMMENT ON COLUMN organizations.clerk_org_id IS 'Organization ID from Clerk (if using Clerk organizations)';
COMMENT ON COLUMN organization_invitations.invite_code IS 'Unique 8-character invitation code';
COMMENT ON COLUMN auth_audit_log.risk_score IS 'Security risk score from 0 (safe) to 100 (high risk)';