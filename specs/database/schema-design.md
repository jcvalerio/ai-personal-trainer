# Database Schema Design - AI Personal Trainer PWA

## Overview

Complete PostgreSQL database schema designed for multi-tenant architecture supporting both family groups and gym partnerships. Optimized for NeonDB with row-level security and efficient querying.

## Architecture Principles

### Multi-Tenant Design

- **Row-Level Security (RLS)**: Data isolation at database level
- **Organization-Based Partitioning**: Logical separation of family and gym data
- **Shared Resources**: Exercise library and equipment database accessible across tenants
- **Scalable Structure**: Designed to handle growth from 5 to 10,000+ users

### Performance Optimization

- **Strategic Indexing**: Optimized for common query patterns
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Denormalized data where appropriate for read performance
- **Batch Operations**: Support for bulk data operations

## Core Tables

### 1. Authentication & Users

```sql
-- User profiles (extends Clerk authentication)
CREATE TABLE user_profiles (
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
  organization_id UUID REFERENCES organizations(id),
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),

  -- Preferences and settings
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations (families and gyms)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id VARCHAR(255) UNIQUE NOT NULL,

  -- Basic info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('family', 'gym')),

  -- Capacity and billing
  max_members INTEGER DEFAULT 5,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),

  -- Gym-specific fields
  address JSONB, -- {street, city, state, zip, country}
  contact_info JSONB, -- {phone, email, website}
  operating_hours JSONB, -- {monday: {open, close}, ...}

  -- Branding configuration
  branding_config JSONB DEFAULT '{}', -- {logo, primary_color, secondary_color, theme}

  -- Settings
  settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Organization memberships with roles
CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Role management
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
  permissions JSONB DEFAULT '{}',

  -- Membership details
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  invited_by UUID REFERENCES user_profiles(id),
  invitation_accepted_at TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,

  UNIQUE(organization_id, user_id)
);
```

### 2. Exercise Library & Equipment

```sql
-- Exercise database (shared across all organizations)
CREATE TABLE exercises (
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

-- Equipment catalog
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- cardio, strength, functional, bodyweight
  subcategory VARCHAR(100),

  -- Physical properties
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  dimensions JSONB, -- {length, width, height, weight}

  -- Media
  image_url VARCHAR(500),
  instruction_manual_url VARCHAR(500),

  -- Usage info
  max_users_simultaneously INTEGER DEFAULT 1,
  maintenance_interval_days INTEGER DEFAULT 30,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Gym-specific equipment inventory
CREATE TABLE gym_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id),

  -- Inventory details
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  serial_numbers TEXT[],
  purchase_date DATE,
  warranty_expiration DATE,

  -- Location within gym
  location_description TEXT,
  zone VARCHAR(100), -- cardio, strength, functional, etc.

  -- QR code for identification
  qr_code VARCHAR(200) UNIQUE,

  -- Status and availability
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_order')),
  last_maintenance_date DATE,
  next_maintenance_date DATE,

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  total_usage_hours DECIMAL(10,2) DEFAULT 0,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(gym_id, equipment_id, serial_numbers)
);
```

### 3. Workout Plans & Sessions

```sql
-- AI-generated workout plans
CREATE TABLE workout_plans (
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
  generation_parameters JSONB,

  -- Plan structure (denormalized for performance)
  plan_data JSONB NOT NULL, -- Complete workout plan structure
  weekly_schedule JSONB NOT NULL, -- {week1: [...], week2: [...]}

  -- Status and lifecycle
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused', 'archived')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_plan_id UUID REFERENCES workout_plans(id),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Individual workout sessions
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  workout_plan_id UUID REFERENCES workout_plans(id),

  -- Session details
  name VARCHAR(200) NOT NULL,
  session_type VARCHAR(50) DEFAULT 'workout', -- workout, assessment, recovery
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,

  -- Execution details
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_minutes INTEGER,

  -- Session structure
  session_data JSONB NOT NULL, -- Complete session structure with exercises
  warm_up_exercises JSONB DEFAULT '[]',
  main_exercises JSONB NOT NULL,
  cool_down_exercises JSONB DEFAULT '[]',

  -- Progress and performance
  completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  effort_rating INTEGER CHECK (effort_rating >= 1 AND effort_rating <= 10),
  energy_level_before INTEGER CHECK (energy_level_before >= 1 AND energy_level_before <= 10),
  energy_level_after INTEGER CHECK (energy_level_after >= 1 AND energy_level_after <= 10),

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped', 'cancelled')),

  -- Equipment used (for gym analytics)
  equipment_used UUID[] DEFAULT '{}',
  gym_location VARCHAR(100),

  -- Notes and feedback
  user_notes TEXT,
  ai_feedback TEXT,
  trainer_notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercise tracking within sessions
CREATE TABLE session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),

  -- Exercise order and grouping
  order_index INTEGER NOT NULL,
  superset_group INTEGER,
  exercise_phase VARCHAR(20) DEFAULT 'main' CHECK (exercise_phase IN ('warm_up', 'main', 'cool_down')),

  -- Planned vs actual performance
  planned_sets INTEGER,
  planned_reps INTEGER,
  planned_weight_kg DECIMAL(6,2),
  planned_duration_seconds INTEGER,
  planned_distance_meters DECIMAL(8,2),
  planned_rest_seconds INTEGER,

  actual_sets INTEGER,
  actual_reps INTEGER,
  actual_weight_kg DECIMAL(6,2),
  actual_duration_seconds INTEGER,
  actual_distance_meters DECIMAL(8,2),
  actual_rest_seconds INTEGER,

  -- Equipment used
  equipment_used UUID REFERENCES gym_equipment(id),
  equipment_alternatives UUID[],

  -- Performance tracking
  perceived_exertion INTEGER CHECK (perceived_exertion >= 1 AND perceived_exertion <= 10),
  form_rating INTEGER CHECK (form_rating >= 1 AND form_rating <= 5),

  -- Status and notes
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMP,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Progress Tracking & Analytics

```sql
-- User progress measurements
CREATE TABLE progress_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  -- Measurement details
  measurement_type VARCHAR(50) NOT NULL, -- weight, body_fat, muscle_mass, circumference
  measurement_location VARCHAR(50), -- for circumference: chest, waist, arms, etc.
  value DECIMAL(8,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,

  -- Context
  measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  measurement_method VARCHAR(50), -- scale, calipers, tape, dexa, etc.
  notes TEXT,

  -- Photo evidence
  photo_url VARCHAR(500),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievement system
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  -- Achievement details
  achievement_type VARCHAR(50) NOT NULL, -- streak, milestone, pr, consistency
  achievement_name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Achievement data
  value DECIMAL(10,2),
  unit VARCHAR(20),
  category VARCHAR(50),

  -- Timing
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  previous_best DECIMAL(10,2),
  improvement_percentage DECIMAL(5,2),

  -- Metadata
  badge_icon VARCHAR(100),
  is_milestone BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and reporting data
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES user_profiles(id),

  -- Session analytics
  session_id UUID REFERENCES workout_sessions(id),
  date DATE NOT NULL,
  session_duration_minutes INTEGER,
  exercises_completed INTEGER,
  equipment_used UUID[],

  -- Engagement metrics
  app_session_duration_minutes INTEGER,
  features_used TEXT[],
  ai_interactions_count INTEGER,

  -- Performance metrics
  calories_burned DECIMAL(8,2),
  total_weight_lifted_kg DECIMAL(10,2),
  total_reps INTEGER,
  average_heart_rate INTEGER,
  peak_heart_rate INTEGER,

  -- Gym-specific metrics (for B2B analytics)
  gym_zone_used VARCHAR(100),
  peak_hour_usage BOOLEAN DEFAULT false,
  equipment_wait_time_minutes INTEGER,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business intelligence for gyms
CREATE TABLE gym_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Report period
  report_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, quarterly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Membership metrics
  total_members INTEGER,
  active_members INTEGER,
  new_members INTEGER,
  churned_members INTEGER,
  member_retention_rate DECIMAL(5,2),

  -- Usage metrics
  total_sessions INTEGER,
  average_sessions_per_member DECIMAL(6,2),
  peak_usage_hours JSONB,
  equipment_utilization_rate DECIMAL(5,2),
  most_used_equipment JSONB,

  -- Engagement metrics
  ai_plan_generation_count INTEGER,
  user_satisfaction_score DECIMAL(3,2),
  feature_adoption_rates JSONB,

  -- Financial impact
  estimated_member_value DECIMAL(10,2),
  cost_per_acquisition DECIMAL(8,2),
  lifetime_value DECIMAL(10,2),

  -- Report data (detailed breakdown)
  report_data JSONB NOT NULL,

  -- Metadata
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by UUID REFERENCES user_profiles(id)
);
```

## Indexes for Performance

```sql
-- User and authentication indexes
CREATE INDEX idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);
CREATE INDEX idx_user_profiles_org_id ON user_profiles(organization_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX idx_organization_memberships_composite ON organization_memberships(organization_id, user_id);

-- Exercise and equipment indexes
CREATE INDEX idx_exercises_muscle_groups ON exercises USING GIN(primary_muscle_groups);
CREATE INDEX idx_exercises_equipment ON exercises USING GIN(equipment_required);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX idx_equipment_category ON equipment(category, subcategory);
CREATE INDEX idx_gym_equipment_gym_id ON gym_equipment(gym_id);
CREATE INDEX idx_gym_equipment_qr ON gym_equipment(qr_code);

-- Workout and session indexes
CREATE INDEX idx_workout_plans_user_org ON workout_plans(user_id, organization_id);
CREATE INDEX idx_workout_plans_status ON workout_plans(status, created_at DESC);
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, scheduled_date DESC);
CREATE INDEX idx_workout_sessions_org_date ON workout_sessions(organization_id, scheduled_date DESC);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status, scheduled_date);
CREATE INDEX idx_session_exercises_session ON session_exercises(session_id, order_index);

-- Progress and analytics indexes
CREATE INDEX idx_progress_measurements_user_type ON progress_measurements(user_id, measurement_type, measured_at DESC);
CREATE INDEX idx_usage_analytics_org_date ON usage_analytics(organization_id, date DESC);
CREATE INDEX idx_usage_analytics_user_date ON usage_analytics(user_id, date DESC);
CREATE INDEX idx_gym_reports_gym_period ON gym_reports(gym_id, period_start, period_end);
```

## Row-Level Security (RLS)

```sql
-- Enable RLS on all user-specific tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_reports ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY user_profile_read ON user_profiles
  FOR SELECT USING (
    clerk_user_id = current_setting('app.current_user_id', true) OR
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY user_profile_write ON user_profiles
  FOR ALL USING (clerk_user_id = current_setting('app.current_user_id', true));

-- Organization policies
CREATE POLICY organization_members_read ON organizations
  FOR SELECT USING (
    id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

-- Workout data policies
CREATE POLICY workout_plans_user_org ON workout_plans
  FOR ALL USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE clerk_user_id = current_setting('app.current_user_id', true)
    ) OR
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN user_profiles up ON om.user_id = up.id
      WHERE up.clerk_user_id = current_setting('app.current_user_id', true)
        AND om.role IN ('admin', 'owner')
    )
  );

-- Similar policies for other tables...
```

## Data Migration Strategy

```sql
-- Migration version tracking
CREATE TABLE schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Seed data for exercises and equipment
INSERT INTO exercises (name, slug, primary_muscle_groups, exercise_type, difficulty_level, equipment_required)
VALUES
  ('Push-ups', 'push-ups', ARRAY['chest', 'shoulders', 'triceps'], 'strength', 'beginner', ARRAY[]'),
  ('Squats', 'squats', ARRAY['quadriceps', 'glutes'], 'strength', 'beginner', ARRAY[]),
  ('Pull-ups', 'pull-ups', ARRAY['lats', 'biceps'], 'strength', 'intermediate', ARRAY['pull_up_bar']);

-- Seed data for basic equipment
INSERT INTO equipment (name, slug, category, description)
VALUES
  ('Treadmill', 'treadmill', 'cardio', 'Motorized running machine'),
  ('Dumbbell Set', 'dumbbell-set', 'strength', 'Adjustable weight dumbbells'),
  ('Pull-up Bar', 'pull-up-bar', 'strength', 'Overhead pull-up bar');
```

## Cost Optimization for NeonDB

### Free Tier Management (0.5GB limit)

- **Data Archiving**: Move old sessions to archive tables after 6 months
- **Compression**: Use JSONB compression for large data fields
- **Cleanup Jobs**: Regular cleanup of temporary and expired data
- **Efficient Queries**: Optimized indexes to reduce storage overhead

### Scaling Strategy

```sql
-- Archive old data (run monthly)
INSERT INTO workout_sessions_archive
SELECT * FROM workout_sessions
WHERE completed_at < CURRENT_DATE - INTERVAL '6 months';

DELETE FROM workout_sessions
WHERE completed_at < CURRENT_DATE - INTERVAL '6 months';

-- Compress JSONB data
UPDATE workout_plans
SET plan_data = jsonb_strip_nulls(plan_data)
WHERE updated_at < CURRENT_DATE - INTERVAL '1 week';
```

## Monitoring and Observability

### Database Monitoring

- Connection pool utilization
- Query performance metrics
- Storage usage tracking
- Index efficiency analysis
- Row-level security policy performance

### Business Metrics

- User engagement rates
- Workout completion rates
- Equipment utilization (gym analytics)
- AI generation success rates
- Cost per user calculations

This schema provides a robust, scalable foundation that can grow from 5 family users to thousands of gym members while maintaining performance and data integrity.
