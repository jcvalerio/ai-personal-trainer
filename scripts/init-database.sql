-- Database Initialization Script for AI Personal Trainer
-- Execute this script against your NeonDB PostgreSQL instance

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends Clerk authentication)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),

  -- Fitness profile
  fitness_level VARCHAR(20) DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 500),
  birth_date DATE,
  primary_goals TEXT[] DEFAULT '{}',

  -- Organization relationship
  organization_id UUID,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),

  -- Preferences and settings
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Organizations (families and gyms)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id VARCHAR(255) UNIQUE,

  -- Basic info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('family', 'gym')),

  -- Capacity and billing
  max_members INTEGER DEFAULT 5,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),

  -- Settings
  settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Add foreign key constraint for user_profiles -> organizations
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Exercise database (shared across all organizations)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  instructions TEXT,

  -- Exercise classification
  primary_muscle_groups TEXT[] NOT NULL,
  secondary_muscle_groups TEXT[] DEFAULT '{}',
  exercise_type VARCHAR(50) NOT NULL, -- strength, cardio, flexibility, sports
  difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),

  -- Equipment requirements
  equipment_required TEXT[] DEFAULT '{}',
  equipment_optional TEXT[] DEFAULT '{}',

  -- Media and resources
  demo_video_url VARCHAR(500),
  demo_image_url VARCHAR(500),
  instruction_images TEXT[],

  -- Metadata
  created_by VARCHAR(50) DEFAULT 'system',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI-generated workout plans
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  -- Plan details
  name VARCHAR(200) NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
  sessions_per_week INTEGER NOT NULL CHECK (sessions_per_week > 0 AND sessions_per_week <= 7),

  -- Target and goals
  fitness_goals TEXT[] NOT NULL,
  target_fitness_level VARCHAR(20) NOT NULL,
  estimated_session_duration INTEGER, -- minutes

  -- AI generation metadata
  ai_prompt_used TEXT,
  ai_model_version VARCHAR(50),
  ai_generation_id VARCHAR(100),
  generation_parameters JSONB DEFAULT '{}',

  -- Plan structure (denormalized for performance)
  plan_data JSONB NOT NULL DEFAULT '{}',
  weekly_schedule JSONB NOT NULL DEFAULT '{}',
  progression_rules JSONB DEFAULT '{}',

  -- Status and lifecycle
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused', 'archived')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_plan_id UUID REFERENCES workout_plans(id),

  -- Template system
  is_template BOOLEAN DEFAULT false,
  template_category VARCHAR(100),
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Individual workout sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  workout_plan_id UUID REFERENCES workout_plans(id),

  -- Session details
  name VARCHAR(200) NOT NULL,
  session_type VARCHAR(50) DEFAULT 'workout', -- workout, assessment, recovery
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  scheduled_duration INTEGER, -- minutes

  -- Execution details
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  actual_duration INTEGER, -- minutes

  -- Session structure
  session_data JSONB NOT NULL DEFAULT '{}',
  warm_up_exercises JSONB DEFAULT '[]',
  main_exercises JSONB NOT NULL DEFAULT '[]',
  cool_down_exercises JSONB DEFAULT '[]',

  -- Progress and performance
  completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  effort_rating INTEGER CHECK (effort_rating >= 1 AND effort_rating <= 10),
  energy_level_before INTEGER CHECK (energy_level_before >= 1 AND energy_level_before <= 10),
  energy_level_after INTEGER CHECK (energy_level_after >= 1 AND energy_level_after <= 10),

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'paused', 'completed', 'skipped', 'cancelled')),

  -- Equipment used (for gym analytics)
  equipment_used UUID[] DEFAULT '{}',
  gym_location VARCHAR(100),

  -- Notes and feedback
  user_notes TEXT,
  ai_feedback TEXT,
  trainer_notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Exercise tracking within sessions
CREATE TABLE IF NOT EXISTS session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),

  -- Exercise order and grouping
  order_index INTEGER NOT NULL DEFAULT 0,
  superset_group INTEGER,
  exercise_phase VARCHAR(20) DEFAULT 'main' CHECK (exercise_phase IN ('warm_up', 'main', 'cool_down')),

  -- Set performance data (array of set objects)
  set_data JSONB DEFAULT '[]',

  -- Status and notes
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMP,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id, order_index);
CREATE INDEX IF NOT EXISTS idx_session_exercises_user ON session_exercises(user_id, session_id);

-- Seed basic exercises for testing
INSERT INTO exercises (name, slug, primary_muscle_groups, exercise_type, difficulty_level, equipment_required) VALUES
  ('Push-ups', 'push-ups', ARRAY['chest', 'shoulders', 'triceps'], 'strength', 'beginner', ARRAY[]::TEXT[]),
  ('Squats', 'squats', ARRAY['quadriceps', 'glutes'], 'strength', 'beginner', ARRAY[]::TEXT[]),
  ('Pull-ups', 'pull-ups', ARRAY['lats', 'biceps'], 'strength', 'intermediate', ARRAY['pull_up_bar']),
  ('Plank', 'plank', ARRAY['core', 'shoulders'], 'strength', 'beginner', ARRAY[]::TEXT[]),
  ('Burpees', 'burpees', ARRAY['full_body'], 'cardio', 'intermediate', ARRAY[]::TEXT[])
ON CONFLICT (slug) DO NOTHING;

-- Create a function to automatically create user profiles
CREATE OR REPLACE FUNCTION create_user_profile_if_not_exists(
  p_clerk_user_id VARCHAR(255),
  p_email VARCHAR(255),
  p_display_name VARCHAR(100)
)
RETURNS UUID AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Try to find existing user profile
  SELECT id INTO user_profile_id
  FROM user_profiles
  WHERE clerk_user_id = p_clerk_user_id;
  
  -- If not found, create new user profile
  IF user_profile_id IS NULL THEN
    INSERT INTO user_profiles (clerk_user_id, email, display_name)
    VALUES (p_clerk_user_id, p_email, p_display_name)
    RETURNING id INTO user_profile_id;
  END IF;
  
  RETURN user_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Log completion
INSERT INTO schema_migrations (version, description) VALUES 
('001', 'Initial database schema creation')
ON CONFLICT (version) DO NOTHING;