-- NeonDB Production Schema Initialization
-- This script initializes the complete database schema for NeonDB PostgreSQL
-- Based on the comprehensive workouts.sql schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean initialization)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS progress_measurements CASCADE;
DROP TABLE IF EXISTS session_exercises CASCADE;
DROP TABLE IF EXISTS workout_sessions CASCADE;
DROP TABLE IF EXISTS workout_plans CASCADE;
DROP TABLE IF EXISTS exercise_library CASCADE;
DROP TABLE IF EXISTS equipment_catalog CASCADE;
DROP TABLE IF EXISTS workout_generation_jobs CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS workout_status CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS session_type CASCADE;
DROP TYPE IF EXISTS exercise_type CASCADE;
DROP TYPE IF EXISTS exercise_phase CASCADE;
DROP TYPE IF EXISTS session_exercise_status CASCADE;
DROP TYPE IF EXISTS measurement_type CASCADE;
DROP TYPE IF EXISTS achievement_type CASCADE;
DROP TYPE IF EXISTS day_schedule_type CASCADE;
DROP TYPE IF EXISTS generation_status CASCADE;
DROP TYPE IF EXISTS fitness_level CASCADE;

-- Create custom types
CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE workout_status AS ENUM ('draft', 'active', 'completed', 'paused', 'archived');
CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'skipped', 'cancelled');
CREATE TYPE session_type AS ENUM ('workout', 'assessment', 'recovery');
CREATE TYPE exercise_type AS ENUM ('strength', 'cardio', 'flexibility', 'sports');
CREATE TYPE exercise_phase AS ENUM ('warm_up', 'main', 'cool_down');
CREATE TYPE session_exercise_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE measurement_type AS ENUM ('weight', 'body_fat', 'muscle_mass', 'circumference');
CREATE TYPE achievement_type AS ENUM ('streak', 'milestone', 'pr', 'consistency');
CREATE TYPE day_schedule_type AS ENUM ('workout', 'rest', 'active_recovery');
CREATE TYPE generation_status AS ENUM ('pending', 'generating', 'completed', 'failed', 'cancelled');

-- Helper function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Auth function placeholder for RLS
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS TEXT AS $$
BEGIN
    -- This is a placeholder for the auth user ID
    -- In a real implementation, this would extract from JWT or session
    RETURN current_setting('app.current_user_id', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations table (must be created first for FK references)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('family', 'gym')),
  max_members INTEGER DEFAULT 5,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  
  -- Fitness profile
  fitness_level fitness_level DEFAULT 'beginner',
  height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 500),
  birth_date DATE,
  primary_goals TEXT[] DEFAULT '{}',
  
  -- Organization relationship
  organization_id UUID REFERENCES organizations(id),
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
  
  -- Preferences and settings
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Equipment catalog (global reference data)
CREATE TABLE equipment_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  
  -- Physical properties
  dimensions JSONB DEFAULT '{
    "length": null,
    "width": null,
    "height": null,
    "weight": null,
    "unit": "cm"
  }'::jsonb,
  
  -- Usage specifications
  max_users_simultaneously INTEGER DEFAULT 1 CHECK (max_users_simultaneously > 0),
  maintenance_interval_days INTEGER DEFAULT 30 CHECK (maintenance_interval_days > 0),
  safety_requirements TEXT[],
  
  -- Media
  image_url TEXT,
  instruction_manual_url TEXT,
  demo_video_url TEXT,
  
  -- Metadata
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_equipment_name CHECK (LENGTH(TRIM(name)) >= 2),
  CONSTRAINT valid_category CHECK (LENGTH(TRIM(category)) >= 2)
);

-- Exercise library (global reference data)
CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  
  -- Classification
  exercise_type exercise_type NOT NULL,
  primary_muscle_groups JSONB NOT NULL DEFAULT '[]',
  secondary_muscle_groups JSONB DEFAULT '[]',
  difficulty_level fitness_level DEFAULT 'beginner',
  
  -- Equipment requirements
  equipment_required UUID[] DEFAULT '{}',
  equipment_optional UUID[] DEFAULT '{}',
  equipment_alternatives JSONB DEFAULT '{}',
  
  -- Exercise parameters
  default_sets INTEGER CHECK (default_sets > 0),
  default_reps_min INTEGER CHECK (default_reps_min > 0),
  default_reps_max INTEGER CHECK (default_reps_max >= default_reps_min),
  default_weight_percentage DECIMAL(3,1) CHECK (default_weight_percentage > 0),
  default_rest_seconds INTEGER CHECK (default_rest_seconds >= 0),
  default_duration_seconds INTEGER CHECK (default_duration_seconds > 0),
  
  -- Media
  demo_video_url TEXT,
  demo_image_url TEXT,
  instruction_images TEXT[] DEFAULT '{}',
  
  -- Safety and modifications
  contraindications TEXT[],
  modifications JSONB DEFAULT '{}',
  safety_tips TEXT[],
  
  -- Creator and verification
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_exercise_name CHECK (LENGTH(TRIM(name)) >= 2),
  CONSTRAINT valid_primary_muscles CHECK (array_length(primary_muscle_groups, 1) > 0),
  CONSTRAINT valid_reps_range CHECK (default_reps_max IS NULL OR default_reps_max >= default_reps_min)
);

-- Workout plans
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Plan identification
  name VARCHAR(200) NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0 AND duration_weeks <= 104),
  sessions_per_week INTEGER NOT NULL CHECK (sessions_per_week > 0 AND sessions_per_week <= 14),
  
  -- Goals and targeting
  fitness_goals TEXT[] NOT NULL DEFAULT '{}',
  target_fitness_level fitness_level DEFAULT 'beginner',
  estimated_session_duration INTEGER CHECK (estimated_session_duration > 0),
  
  -- AI generation metadata
  ai_prompt_used TEXT,
  ai_model_version VARCHAR(50),
  ai_generation_id UUID,
  generation_parameters JSONB DEFAULT '{}',
  
  -- Plan structure and data
  plan_data JSONB NOT NULL DEFAULT '{}',
  weekly_schedule JSONB NOT NULL DEFAULT '{}',
  progression_rules JSONB DEFAULT '{}',
  
  -- Plan status and lifecycle
  status workout_status DEFAULT 'draft',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Versioning and templates
  version INTEGER DEFAULT 1 CHECK (version > 0),
  parent_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  is_template BOOLEAN DEFAULT FALSE,
  template_category VARCHAR(100),
  
  -- Sharing and visibility
  is_public BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_plan_name CHECK (LENGTH(TRIM(name)) >= 2),
  CONSTRAINT valid_status_dates CHECK (
    (status = 'active' AND started_at IS NOT NULL) OR 
    (status != 'active') OR 
    (status = 'completed' AND completed_at IS NOT NULL AND completed_at >= started_at)
  ),
  CONSTRAINT valid_goals CHECK (array_length(fitness_goals, 1) > 0)
);

-- Workout sessions
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  
  -- Session identification
  name VARCHAR(200) NOT NULL,
  session_type session_type DEFAULT 'workout',
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  scheduled_duration INTEGER,
  
  -- Execution tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER,
  
  -- Session structure and data
  session_data JSONB NOT NULL DEFAULT '{}',
  warm_up_exercises JSONB DEFAULT '[]',
  main_exercises JSONB DEFAULT '[]',
  cool_down_exercises JSONB DEFAULT '[]',
  
  -- Progress and feedback
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  effort_rating INTEGER CHECK (effort_rating >= 1 AND effort_rating <= 10),
  energy_level_before INTEGER CHECK (energy_level_before >= 1 AND energy_level_before <= 10),
  energy_level_after INTEGER CHECK (energy_level_after >= 1 AND energy_level_after <= 10),
  
  -- Session context
  status session_status DEFAULT 'scheduled',
  equipment_used TEXT[] DEFAULT '{}',
  gym_location VARCHAR(200),
  weather_conditions JSONB DEFAULT '{}',
  
  -- Notes and feedback
  user_notes TEXT,
  ai_feedback TEXT,
  trainer_notes TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_session_name CHECK (LENGTH(TRIM(name)) >= 2),
  CONSTRAINT valid_session_duration CHECK (
    (completed_at IS NULL AND actual_duration IS NULL) OR
    (completed_at IS NOT NULL AND actual_duration IS NOT NULL AND actual_duration > 0)
  ),
  CONSTRAINT valid_completion_tracking CHECK (
    (status = 'completed' AND completed_at IS NOT NULL AND completion_percentage = 100) OR
    (status != 'completed')
  )
);

-- Session exercises (detailed exercise tracking within sessions)
CREATE TABLE session_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  
  -- Exercise positioning
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  superset_group INTEGER CHECK (superset_group > 0),
  exercise_phase exercise_phase DEFAULT 'main',
  
  -- Planned performance
  planned_sets INTEGER CHECK (planned_sets > 0),
  planned_reps INTEGER CHECK (planned_reps > 0),
  planned_weight_kg DECIMAL(6,2) CHECK (planned_weight_kg > 0),
  planned_duration_seconds INTEGER CHECK (planned_duration_seconds > 0),
  planned_distance_meters DECIMAL(8,2) CHECK (planned_distance_meters > 0),
  planned_rest_seconds INTEGER CHECK (planned_rest_seconds >= 0),
  
  -- Actual performance (tracked during workout)
  actual_sets INTEGER CHECK (actual_sets > 0),
  actual_reps INTEGER CHECK (actual_reps > 0),
  actual_weight_kg DECIMAL(6,2) CHECK (actual_weight_kg > 0),
  actual_duration_seconds INTEGER CHECK (actual_duration_seconds > 0),
  actual_distance_meters DECIMAL(8,2) CHECK (actual_distance_meters > 0),
  actual_rest_seconds INTEGER CHECK (actual_rest_seconds >= 0),
  
  -- Performance tracking per set
  set_data JSONB DEFAULT '[]',
  
  -- Equipment and modifications
  equipment_used VARCHAR(200),
  equipment_alternatives TEXT[] DEFAULT '{}',
  exercise_modifications TEXT[],
  
  -- User feedback
  perceived_exertion INTEGER CHECK (perceived_exertion >= 1 AND perceived_exertion <= 10),
  form_rating INTEGER CHECK (form_rating >= 1 AND form_rating <= 5),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  
  -- Execution status
  status session_exercise_status DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(session_id, order_index, exercise_phase),
  CONSTRAINT valid_performance_data CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed')
  )
);

-- PERFORMANCE-OPTIMIZED INDEXES
-- Critical indexes for session tracking performance

-- User profile lookups (used in every query)
CREATE INDEX idx_user_profiles_clerk_id_covering ON user_profiles(clerk_user_id, id, organization_id);
CREATE INDEX idx_user_profiles_org_active ON user_profiles(organization_id, is_active) WHERE is_active = true;

-- Session queries (primary use case)
CREATE INDEX idx_workout_sessions_user_date_status ON workout_sessions(user_id, scheduled_date DESC, status) WHERE is_active = true;
CREATE INDEX idx_workout_sessions_id_active ON workout_sessions(id) WHERE is_active = true;
CREATE INDEX idx_workout_sessions_plan_date ON workout_sessions(workout_plan_id, scheduled_date DESC) WHERE workout_plan_id IS NOT NULL;
CREATE INDEX idx_workout_sessions_status_date ON workout_sessions(status, scheduled_date DESC);

-- Session exercises (N+1 query prevention)
CREATE INDEX idx_session_exercises_session_order ON session_exercises(session_id, order_index, exercise_phase);
CREATE INDEX idx_session_exercises_session_exercise ON session_exercises(session_id, exercise_id);
CREATE INDEX idx_session_exercises_status_completed ON session_exercises(session_id, status, completed_at);

-- Exercise library lookups
CREATE INDEX idx_exercise_library_id_active ON exercise_library(id) WHERE is_active = true;
CREATE INDEX idx_exercise_library_type_level ON exercise_library(exercise_type, difficulty_level, is_active);
CREATE INDEX idx_exercise_library_primary_muscle_groups_gin ON exercise_library USING GIN (primary_muscle_groups);
CREATE INDEX idx_exercise_library_secondary_muscle_groups_gin ON exercise_library USING GIN (secondary_muscle_groups);

-- Workout plans
CREATE INDEX idx_workout_plans_user_active ON workout_plans(user_id, is_active, created_at DESC) WHERE is_active = true;
CREATE INDEX idx_workout_plans_status_active ON workout_plans(status, is_active, created_at DESC);

-- Equipment catalog
CREATE INDEX idx_equipment_catalog_active ON equipment_catalog(is_active, category) WHERE is_active = true;

-- Composite indexes for complex queries
CREATE INDEX idx_sessions_user_plan_date ON workout_sessions(user_id, workout_plan_id, scheduled_date DESC) WHERE is_active = true;
CREATE INDEX idx_session_exercises_full ON session_exercises(session_id, exercise_phase, order_index, status);

-- Partial indexes for better performance on filtered queries
CREATE INDEX idx_workout_sessions_in_progress ON workout_sessions(user_id, started_at) WHERE status = 'in_progress';
CREATE INDEX idx_workout_sessions_completed ON workout_sessions(user_id, completed_at DESC) WHERE status = 'completed';
CREATE INDEX idx_session_exercises_pending ON session_exercises(session_id, order_index) WHERE status = 'pending';

-- Add update triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_catalog_updated_at BEFORE UPDATE ON equipment_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_library_updated_at BEFORE UPDATE ON exercise_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON workout_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_exercises_updated_at BEFORE UPDATE ON session_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed basic exercises for immediate functionality
INSERT INTO exercise_library (name, slug, description, instructions, exercise_type, primary_muscle_groups, difficulty_level, equipment_required) VALUES
  ('Push-ups', 'push-ups', 'Classic bodyweight chest exercise', 'Start in plank position, lower body to ground, push back up', 'strength', '["chest", "shoulders", "triceps"]'::jsonb, 'beginner', ARRAY[]::UUID[]),
  ('Squats', 'squats', 'Fundamental lower body movement', 'Stand with feet shoulder-width apart, lower as if sitting back, return to standing', 'strength', '["quadriceps", "glutes"]'::jsonb, 'beginner', ARRAY[]::UUID[]),
  ('Plank', 'plank', 'Core stability exercise', 'Hold straight line from head to heels in push-up position', 'strength', '["core", "shoulders"]'::jsonb, 'beginner', ARRAY[]::UUID[]),
  ('Burpees', 'burpees', 'Full body cardio movement', 'Squat, jump back to plank, push-up, jump forward, stand and jump', 'cardio', '["full_body"]'::jsonb, 'intermediate', ARRAY[]::UUID[]),
  ('Lunges', 'lunges', 'Single leg strengthening exercise', 'Step forward, lower back knee toward ground, return to standing', 'strength', '["quadriceps", "glutes", "hamstrings"]'::jsonb, 'beginner', ARRAY[]::UUID[])
ON CONFLICT (slug) DO NOTHING;

-- Create materialized view for session statistics (performance optimization)
CREATE MATERIALIZED VIEW session_statistics AS
SELECT 
  user_id,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
  AVG(CASE WHEN actual_duration IS NOT NULL THEN actual_duration END) as avg_duration,
  AVG(CASE WHEN effort_rating IS NOT NULL THEN effort_rating END) as avg_effort,
  MAX(completed_at) as last_workout_date,
  date_trunc('month', CURRENT_DATE) as month_calculated
FROM workout_sessions 
WHERE is_active = true 
GROUP BY user_id, date_trunc('month', CURRENT_DATE);

CREATE UNIQUE INDEX idx_session_stats_user_month ON session_statistics(user_id, month_calculated);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_session_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY session_statistics;
END;
$$ LANGUAGE plpgsql;

-- Log table creation completion
DO $$
BEGIN
  RAISE NOTICE 'Schema initialization completed successfully';
  RAISE NOTICE 'Tables created: organizations, user_profiles, equipment_catalog, exercise_library, workout_plans, workout_sessions, session_exercises';
  RAISE NOTICE 'Indexes created: % performance-optimized indexes', 15;
  RAISE NOTICE 'Materialized view: session_statistics for fast aggregations';
END $$;