-- Migration: 001_auth_setup.sql
-- Description: Initial authentication and multi-tenancy setup
-- Created: Phase 1 PR #2
-- Dependencies: None

-- This migration sets up the complete authentication and multi-tenancy system
-- including user profiles, organizations, memberships, and security policies

-- Run the complete auth schema
\i '../schema/auth.sql'

-- Insert default data for testing and development

-- Insert a default "AI Personal Trainer" system organization
INSERT INTO organizations (
  clerk_org_id,
  name,
  slug,
  description,
  type,
  max_members,
  subscription_tier,
  settings,
  branding_config,
  is_active,
  is_verified
) VALUES (
  'org_system_ai_trainer',
  'AI Personal Trainer',
  'ai-personal-trainer',
  'Official AI Personal Trainer system organization',
  'gym',
  10000,
  'enterprise',
  '{
    "allowMemberInvites": false,
    "requireApprovalForJoining": false,
    "shareEquipmentDatabase": true,
    "enableLeaderboards": true,
    "autoApproveMembers": false,
    "maxWorkoutsPerWeek": 100,
    "dataRetentionDays": 2555
  }'::jsonb,
  '{
    "logo": "/images/logo.png",
    "primaryColor": "#3b82f6",
    "secondaryColor": "#1e40af",
    "theme": "light"
  }'::jsonb,
  true,
  true
) ON CONFLICT (clerk_org_id) DO NOTHING;

-- Insert default fitness goals for user selection
CREATE TABLE IF NOT EXISTS fitness_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO fitness_goals (name, description, category, sort_order) VALUES
  ('Lose weight', 'Focus on weight loss through cardio and diet', 'weight_management', 1),
  ('Build muscle', 'Increase muscle mass through strength training', 'muscle_building', 2),
  ('Improve endurance', 'Enhance cardiovascular fitness and stamina', 'cardiovascular', 3),
  ('Increase strength', 'Build overall strength and power', 'strength', 4),
  ('Better flexibility', 'Improve flexibility and mobility', 'flexibility', 5),
  ('Overall health', 'General fitness and wellness improvement', 'general', 6),
  ('Sport performance', 'Enhance performance in specific sports', 'sport_specific', 7),
  ('Stress relief', 'Use exercise for mental health and stress reduction', 'mental_health', 8)
ON CONFLICT DO NOTHING;

-- Create indexes for fitness goals
CREATE INDEX IF NOT EXISTS idx_fitness_goals_category ON fitness_goals(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_fitness_goals_sort ON fitness_goals(sort_order) WHERE is_active = true;

-- Create a function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations() RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  UPDATE organization_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
  AND expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO auth_audit_log (
    event_type,
    event_category,
    event_description,
    additional_data
  ) VALUES (
    'invitation_cleanup',
    'security',
    'Cleaned up expired invitations',
    jsonb_build_object('expired_count', cleanup_count)
  );
  
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to validate user profile completeness
CREATE OR REPLACE FUNCTION is_profile_complete(profile_id UUID) RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT 
    display_name,
    fitness_level,
    primary_goals
  INTO profile_record
  FROM user_profiles
  WHERE id = profile_id;
  
  RETURN (
    profile_record.display_name IS NOT NULL AND LENGTH(TRIM(profile_record.display_name)) >= 2
    AND profile_record.fitness_level IS NOT NULL
    AND array_length(profile_record.primary_goals, 1) > 0
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user's organization summary
CREATE OR REPLACE FUNCTION get_user_organization_summary(user_clerk_id TEXT) 
RETURNS TABLE(
  org_id UUID,
  org_name VARCHAR,
  org_type organization_type,
  user_role organization_role,
  member_count INTEGER,
  is_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as org_id,
    o.name as org_name,
    o.type as org_type,
    om.role as user_role,
    o.current_member_count as member_count,
    (om.role IN ('admin', 'owner')) as is_admin
  FROM organizations o
  JOIN organization_memberships om ON o.id = om.organization_id
  JOIN user_profiles up ON om.user_id = up.id
  WHERE up.clerk_user_id = user_clerk_id
  AND om.is_active = true
  AND o.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create a function to safely delete user data (GDPR compliance)
CREATE OR REPLACE FUNCTION anonymize_user_data(user_clerk_id TEXT) RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  anonymized_email TEXT;
  anonymized_name TEXT;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM user_profiles WHERE clerk_user_id = user_clerk_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Generate anonymized data
  anonymized_email := 'deleted_' || encode(gen_random_bytes(8), 'hex') || '@deleted.local';
  anonymized_name := 'Deleted User ' || encode(gen_random_bytes(4), 'hex');
  
  -- Update profile with anonymized data
  UPDATE user_profiles SET
    email = anonymized_email,
    display_name = anonymized_name,
    avatar_url = NULL,
    primary_goals = '{}',
    preferences = '{}',
    notification_settings = '{}',
    is_active = FALSE,
    account_status = 'deactivated',
    updated_at = CURRENT_TIMESTAMP
  WHERE clerk_user_id = user_clerk_id;
  
  -- Log the anonymization
  INSERT INTO auth_audit_log (
    user_id,
    event_type,
    event_category,
    event_description
  ) VALUES (
    user_record.id,
    'user_anonymized',
    'security',
    'User data anonymized for GDPR compliance'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create initial admin functions for organization management
CREATE OR REPLACE FUNCTION create_system_organization(
  org_name TEXT,
  org_type organization_type DEFAULT 'gym',
  max_members INTEGER DEFAULT 1000
) RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  clerk_org_id TEXT;
BEGIN
  -- Generate a system clerk org ID
  clerk_org_id := 'org_system_' || LOWER(REPLACE(org_name, ' ', '_'));
  
  INSERT INTO organizations (
    clerk_org_id,
    name,
    type,
    max_members,
    subscription_tier,
    is_active,
    is_verified
  ) VALUES (
    clerk_org_id,
    org_name,
    org_type,
    max_members,
    'enterprise',
    true,
    true
  ) RETURNING id INTO new_org_id;
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust based on your database user)
-- Note: In production, create specific roles with limited permissions

-- Create a read-only role for analytics
CREATE ROLE ai_trainer_analytics;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_trainer_analytics;

-- Create an API role with limited permissions
CREATE ROLE ai_trainer_api;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO ai_trainer_api;
GRANT SELECT, INSERT, UPDATE ON organizations TO ai_trainer_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_memberships TO ai_trainer_api;
GRANT SELECT, INSERT, UPDATE ON organization_invitations TO ai_trainer_api;
GRANT INSERT ON auth_audit_log TO ai_trainer_api;
GRANT SELECT ON fitness_goals TO ai_trainer_api;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ai_trainer_api;

-- Migration completion log
INSERT INTO auth_audit_log (
  event_type,
  event_category,
  event_description,
  additional_data
) VALUES (
  'migration_completed',
  'security',
  'Auth setup migration completed successfully',
  jsonb_build_object(
    'migration', '001_auth_setup',
    'version', '1.0.0',
    'timestamp', CURRENT_TIMESTAMP
  )
);

-- Migration success indicator
SELECT 'Migration 001_auth_setup completed successfully' as status;