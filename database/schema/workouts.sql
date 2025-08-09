-- Workout System Database Schema
-- This file contains all workout-related tables with proper RLS policies

-- Custom types for workout system
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
  primary_muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  secondary_muscle_groups TEXT[] DEFAULT '{}',
  difficulty_level fitness_level DEFAULT 'beginner',
  
  -- Equipment requirements
  equipment_required UUID[] DEFAULT '{}', -- References equipment_catalog.id
  equipment_optional UUID[] DEFAULT '{}', -- References equipment_catalog.id
  equipment_alternatives JSONB DEFAULT '{}', -- Alternative equipment mappings
  
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
  modifications JSONB DEFAULT '{}', -- Exercise modifications for different levels/conditions
  safety_tips TEXT[],
  
  -- Creator and verification
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- Custom exercises per org
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
  estimated_session_duration INTEGER CHECK (estimated_session_duration > 0), -- minutes
  
  -- AI generation metadata
  ai_prompt_used TEXT,
  ai_model_version VARCHAR(50),
  ai_generation_id UUID, -- Reference to generation job
  generation_parameters JSONB DEFAULT '{}',
  
  -- Plan structure and data
  plan_data JSONB NOT NULL DEFAULT '{}', -- WorkoutPlanData structure
  weekly_schedule JSONB NOT NULL DEFAULT '{}', -- WeeklySchedule structure
  progression_rules JSONB DEFAULT '{}', -- How to progress weights, reps, etc.
  
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
  scheduled_duration INTEGER, -- minutes
  
  -- Execution tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER, -- minutes
  
  -- Session structure and data
  session_data JSONB NOT NULL DEFAULT '{}', -- SessionData structure
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
  set_data JSONB DEFAULT '[]', -- Array of set performance data
  
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

-- Progress measurements
CREATE TABLE progress_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Measurement details
  measurement_type measurement_type NOT NULL,
  measurement_location VARCHAR(100), -- for circumference measurements (waist, chest, etc.)
  value DECIMAL(8,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  
  -- Context
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  measurement_method VARCHAR(100),
  measurement_device VARCHAR(100),
  
  -- Additional data
  body_composition JSONB DEFAULT '{}', -- For comprehensive body composition data
  notes TEXT,
  photo_url TEXT,
  
  -- Verification and quality
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 5),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_value CHECK (value > 0),
  CONSTRAINT valid_unit CHECK (LENGTH(TRIM(unit)) > 0),
  CONSTRAINT valid_circumference_location CHECK (
    measurement_type != 'circumference' OR 
    (measurement_type = 'circumference' AND measurement_location IS NOT NULL)
  )
);

-- User achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Achievement details
  achievement_type achievement_type NOT NULL,
  achievement_name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Achievement data
  value DECIMAL(10,3),
  unit VARCHAR(20),
  category VARCHAR(100),
  
  -- Context and comparison
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL,
  previous_best DECIMAL(10,3),
  improvement_percentage DECIMAL(5,2),
  related_session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  related_exercise_id UUID REFERENCES exercise_library(id) ON DELETE SET NULL,
  
  -- Display and gamification
  badge_icon VARCHAR(100),
  badge_color VARCHAR(7), -- Hex color code
  is_milestone BOOLEAN DEFAULT FALSE,
  milestone_level INTEGER CHECK (milestone_level > 0),
  points_awarded INTEGER DEFAULT 0 CHECK (points_awarded >= 0),
  
  -- Sharing and visibility
  is_public BOOLEAN DEFAULT FALSE,
  shared_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_achievement_name CHECK (LENGTH(TRIM(achievement_name)) >= 2),
  CONSTRAINT valid_improvement CHECK (
    previous_best IS NULL OR 
    improvement_percentage IS NULL OR 
    improvement_percentage >= 0
  )
);

-- Workout generation jobs (for tracking AI generation status)
CREATE TABLE workout_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Job details
  job_type VARCHAR(50) NOT NULL, -- 'workout_plan', 'single_session', 'exercise_recommendation'
  status generation_status DEFAULT 'pending',
  
  -- Input parameters
  generation_prompt TEXT NOT NULL,
  user_preferences JSONB NOT NULL DEFAULT '{}',
  fitness_profile JSONB NOT NULL DEFAULT '{}',
  equipment_available TEXT[] DEFAULT '{}',
  time_constraints JSONB DEFAULT '{}',
  
  -- AI model information
  ai_provider VARCHAR(50) NOT NULL,
  ai_model VARCHAR(100) NOT NULL,
  model_version VARCHAR(50),
  generation_parameters JSONB DEFAULT '{}',
  
  -- Results
  result_data JSONB DEFAULT '{}',
  generated_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  generated_session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  
  -- Processing tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  processing_duration_ms INTEGER,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
  max_retries INTEGER DEFAULT 3 CHECK (max_retries >= 0),
  
  -- Cost and usage tracking
  tokens_used INTEGER DEFAULT 0,
  cost_cents DECIMAL(8,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_job_type CHECK (job_type IN ('workout_plan', 'single_session', 'exercise_recommendation')),
  CONSTRAINT valid_processing_duration CHECK (
    (completed_at IS NULL AND processing_duration_ms IS NULL) OR
    (completed_at IS NOT NULL AND processing_duration_ms IS NOT NULL AND processing_duration_ms > 0)
  )
);

-- Indexes for performance optimization
CREATE INDEX idx_equipment_catalog_category ON equipment_catalog(category, subcategory);
CREATE INDEX idx_equipment_catalog_active ON equipment_catalog(is_active, created_at) WHERE is_active = true;
CREATE INDEX idx_equipment_catalog_slug ON equipment_catalog(slug) WHERE is_active = true;

CREATE INDEX idx_exercise_library_type ON exercise_library(exercise_type);
CREATE INDEX idx_exercise_library_muscles ON exercise_library USING GIN (primary_muscle_groups);
CREATE INDEX idx_exercise_library_difficulty ON exercise_library(difficulty_level);
CREATE INDEX idx_exercise_library_equipment ON exercise_library USING GIN (equipment_required);
CREATE INDEX idx_exercise_library_active ON exercise_library(is_active, is_public, created_at);
CREATE INDEX idx_exercise_library_org ON exercise_library(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_exercise_library_creator ON exercise_library(created_by) WHERE created_by IS NOT NULL;

CREATE INDEX idx_workout_plans_user ON workout_plans(user_id, status, created_at);
CREATE INDEX idx_workout_plans_org ON workout_plans(organization_id, status, created_at);
CREATE INDEX idx_workout_plans_status ON workout_plans(status, started_at) WHERE is_active = true;
CREATE INDEX idx_workout_plans_template ON workout_plans(is_template, template_category) WHERE is_template = true;
CREATE INDEX idx_workout_plans_public ON workout_plans(is_public, is_featured) WHERE is_public = true;

CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id, scheduled_date DESC);
CREATE INDEX idx_workout_sessions_plan ON workout_sessions(workout_plan_id, scheduled_date);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status, scheduled_date);
CREATE INDEX idx_workout_sessions_org ON workout_sessions(organization_id, scheduled_date DESC);
CREATE INDEX idx_workout_sessions_date_range ON workout_sessions(scheduled_date, status) WHERE is_active = true;

CREATE INDEX idx_session_exercises_session ON session_exercises(session_id, order_index, exercise_phase);
CREATE INDEX idx_session_exercises_exercise ON session_exercises(exercise_id, status, completed_at);
CREATE INDEX idx_session_exercises_phase ON session_exercises(exercise_phase, status);

CREATE INDEX idx_progress_measurements_user ON progress_measurements(user_id, measured_at DESC);
CREATE INDEX idx_progress_measurements_type ON progress_measurements(user_id, measurement_type, measured_at DESC);
CREATE INDEX idx_progress_measurements_location ON progress_measurements(user_id, measurement_location, measured_at DESC) WHERE measurement_location IS NOT NULL;

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id, achieved_at DESC);
CREATE INDEX idx_user_achievements_type ON user_achievements(achievement_type, achieved_at DESC);
CREATE INDEX idx_user_achievements_milestone ON user_achievements(is_milestone, achieved_at DESC) WHERE is_milestone = true;
CREATE INDEX idx_user_achievements_public ON user_achievements(is_public, achieved_at DESC) WHERE is_public = true;

CREATE INDEX idx_generation_jobs_user ON workout_generation_jobs(user_id, created_at DESC);
CREATE INDEX idx_generation_jobs_status ON workout_generation_jobs(status, created_at);
CREATE INDEX idx_generation_jobs_type ON workout_generation_jobs(job_type, status, created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE equipment_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Equipment catalog policies (read-only for most users)
CREATE POLICY "Equipment catalog is publicly readable" ON equipment_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY "Org admins can manage equipment catalog" ON equipment_catalog
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = auth.user_id()::text
      AND om.role IN ('admin', 'owner')
      AND om.is_active = true
    )
  );

-- Exercise library policies
CREATE POLICY "Users can view public exercises" ON exercise_library
  FOR SELECT USING (is_active = true AND is_public = true);

CREATE POLICY "Users can view their org's custom exercises" ON exercise_library
  FOR SELECT USING (
    is_active = true AND 
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = auth.user_id()::text
      AND om.is_active = true
    )
  );

CREATE POLICY "Users can create exercises in their org" ON exercise_library
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = auth.user_id()::text
      AND om.is_active = true
    )
  );

CREATE POLICY "Users can update exercises they created" ON exercise_library
  FOR UPDATE USING (
    created_by = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

-- Workout plans policies
CREATE POLICY "Users can view their own workout plans" ON workout_plans
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

CREATE POLICY "Users can view org members' workout plans" ON workout_plans
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = auth.user_id()::text
      AND om.is_active = true
    )
  );

CREATE POLICY "Users can create their own workout plans" ON workout_plans
  FOR INSERT WITH CHECK (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

CREATE POLICY "Users can update their own workout plans" ON workout_plans
  FOR UPDATE USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

-- Workout sessions policies
CREATE POLICY "Users can view their own workout sessions" ON workout_sessions
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

CREATE POLICY "Trainers can view org members' sessions" ON workout_sessions
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = auth.user_id()::text
      AND om.role IN ('admin', 'owner')
      AND om.is_active = true
    )
  );

CREATE POLICY "Users can manage their own sessions" ON workout_sessions
  FOR ALL USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

-- Session exercises policies
CREATE POLICY "Users can view session exercises for their sessions" ON session_exercises
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM workout_sessions ws
      WHERE ws.user_id = (
        SELECT id FROM user_profiles 
        WHERE clerk_user_id = auth.user_id()::text
      )
    )
  );

CREATE POLICY "Users can manage exercises in their sessions" ON session_exercises
  FOR ALL USING (
    session_id IN (
      SELECT id FROM workout_sessions ws
      WHERE ws.user_id = (
        SELECT id FROM user_profiles 
        WHERE clerk_user_id = auth.user_id()::text
      )
    )
  );

-- Progress measurements policies
CREATE POLICY "Users can view their own measurements" ON progress_measurements
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

CREATE POLICY "Users can manage their own measurements" ON progress_measurements
  FOR ALL USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

CREATE POLICY "System can create achievements" ON user_achievements
  FOR INSERT WITH CHECK (true); -- Controlled by application logic

-- Workout generation jobs policies
CREATE POLICY "Users can view their own generation jobs" ON workout_generation_jobs
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

CREATE POLICY "Users can create generation jobs" ON workout_generation_jobs
  FOR INSERT WITH CHECK (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = auth.user_id()::text
    )
  );

CREATE POLICY "System can update generation jobs" ON workout_generation_jobs
  FOR UPDATE WITH CHECK (true); -- Controlled by application logic

-- Triggers for updating timestamps
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

CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON workout_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper functions for workout system

-- Function to generate exercise slug
CREATE OR REPLACE FUNCTION generate_exercise_slug(exercise_name TEXT) RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    base_slug := LOWER(TRIM(REGEXP_REPLACE(exercise_name, '[^a-zA-Z0-9\s]', '', 'g')));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := TRIM(both '-' FROM base_slug);
    
    -- Limit slug length
    base_slug := SUBSTRING(base_slug FROM 1 FOR 60);
    
    final_slug := base_slug;
    
    WHILE EXISTS(SELECT 1 FROM exercise_library WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to generate equipment slug
CREATE OR REPLACE FUNCTION generate_equipment_slug(equipment_name TEXT) RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    base_slug := LOWER(TRIM(REGEXP_REPLACE(equipment_name, '[^a-zA-Z0-9\s]', '', 'g')));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := TRIM(both '-' FROM base_slug);
    
    -- Limit slug length
    base_slug := SUBSTRING(base_slug FROM 1 FOR 60);
    
    final_slug := base_slug;
    
    WHILE EXISTS(SELECT 1 FROM equipment_catalog WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Triggers to generate slugs
CREATE OR REPLACE FUNCTION set_exercise_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_exercise_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_equipment_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_equipment_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_exercise_slug_trigger BEFORE INSERT ON exercise_library
  FOR EACH ROW EXECUTE FUNCTION set_exercise_slug();

CREATE TRIGGER set_equipment_slug_trigger BEFORE INSERT ON equipment_catalog
  FOR EACH ROW EXECUTE FUNCTION set_equipment_slug();

-- Comments for documentation
COMMENT ON TABLE equipment_catalog IS 'Global catalog of gym equipment and accessories';
COMMENT ON TABLE exercise_library IS 'Comprehensive library of exercises with detailed instructions and requirements';
COMMENT ON TABLE workout_plans IS 'User-created or AI-generated workout plans with progression tracking';
COMMENT ON TABLE workout_sessions IS 'Individual workout sessions scheduled and executed by users';
COMMENT ON TABLE session_exercises IS 'Detailed exercise tracking within workout sessions';
COMMENT ON TABLE progress_measurements IS 'User progress measurements including weight, body composition, etc.';
COMMENT ON TABLE user_achievements IS 'User achievements, milestones, and badges';
COMMENT ON TABLE workout_generation_jobs IS 'AI workout generation job tracking and status management';