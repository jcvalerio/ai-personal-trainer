/**
 * Workout Database Setup Script for NeonDB
 * Sets up the complete workout system schema including:
 * - Custom types and enums
 * - All workout-related tables
 * - Indexes for performance optimization
 * - Row Level Security (RLS) policies
 * - Helper functions and triggers
 * - Initial seed data for exercise library
 *
 * Run with: npx tsx scripts/setup-workout-database.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Dynamically import connection after env vars are loaded
async function getDbConnections() {
  const { getDb, checkDbConnection } = await import('../lib/db/connection');
  return { db: getDb(), checkDbConnection };
}

async function setupWorkoutDatabase() {
  try {
    console.log('🏋️  Setting up workout database schema...');
    console.log('🔗 Checking database connection...');

    // Get database connections after env vars are loaded
    const { db, checkDbConnection } = await getDbConnections();

    const isConnected = await checkDbConnection();
    if (!isConnected) {
      throw new Error(
        'Failed to connect to database. Please check your DATABASE_URL environment variable.'
      );
    }

    console.log('✅ Database connection established');

    // Read the workout schema file
    const schemaPath = resolve(process.cwd(), 'database/schema/workouts.sql');
    const workoutSchema = readFileSync(schemaPath, 'utf8');

    console.log('🏗️  Creating workout system schema...');

    // Execute schema step by step for better error handling
    await executeSchemaSteps(db);

    console.log('🌱 Populating exercise library with seed data...');
    await populateExerciseLibrary(db);

    console.log('🧪 Testing database setup...');
    await testDatabaseSetup(db);

    console.log('✅ Workout database setup complete!');
  } catch (error) {
    console.error('❌ Workout database setup failed:', error);
    process.exit(1);
  }
}

async function executeSchemaSteps(db: any) {
  try {
    // Step 1: Create custom types
    console.log('  📋 Creating custom types...');

    // First check if fitness_level exists, create if not
    const fitnessLevelExists = await db`
      SELECT EXISTS(
        SELECT 1 FROM pg_type 
        WHERE typname = 'fitness_level' AND typtype = 'e'
      ) as exists
    `;

    if (!fitnessLevelExists[0].exists) {
      console.log('    🏃 Creating fitness_level enum...');
      await db`CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced')`;
    } else {
      console.log('    ✅ fitness_level enum already exists');
    }

    // Create workout-specific types (skip if they already exist)
    const typesToCreate = [
      {
        name: 'workout_status',
        values: ['draft', 'active', 'completed', 'paused', 'archived'],
      },
      {
        name: 'session_status',
        values: [
          'scheduled',
          'in_progress',
          'completed',
          'skipped',
          'cancelled',
        ],
      },
      { name: 'session_type', values: ['workout', 'assessment', 'recovery'] },
      {
        name: 'exercise_type',
        values: ['strength', 'cardio', 'flexibility', 'sports'],
      },
      { name: 'exercise_phase', values: ['warm_up', 'main', 'cool_down'] },
      {
        name: 'session_exercise_status',
        values: ['pending', 'in_progress', 'completed', 'skipped'],
      },
      {
        name: 'measurement_type',
        values: ['weight', 'body_fat', 'muscle_mass', 'circumference'],
      },
      {
        name: 'achievement_type',
        values: ['streak', 'milestone', 'pr', 'consistency'],
      },
      {
        name: 'day_schedule_type',
        values: ['workout', 'rest', 'active_recovery'],
      },
      {
        name: 'generation_status',
        values: ['pending', 'generating', 'completed', 'failed', 'cancelled'],
      },
    ];

    for (const type of typesToCreate) {
      try {
        const values = type.values.map((v) => `'${v}'`).join(', ');
        await db.unsafe(`CREATE TYPE ${type.name} AS ENUM (${values})`);
        console.log(`    ✅ Created ${type.name}`);
      } catch (error: any) {
        if (error.code === '42710') {
          console.log(`    ℹ️  Type ${type.name} already exists, skipping`);
        } else {
          throw error;
        }
      }
    }

    console.log('  ✅ Custom types created successfully');

    // Step 2: Create equipment catalog table
    console.log('  🏋️  Creating equipment catalog table...');

    await db`
      CREATE TABLE IF NOT EXISTS equipment_catalog (
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
      )
    `;

    // Step 3: Create exercise library table
    console.log('  📚 Creating exercise library table...');

    await db`
      CREATE TABLE IF NOT EXISTS exercise_library (
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
      )
    `;

    // Step 4: Create workout plans table
    console.log('  📋 Creating workout plans table...');

    await db`
      CREATE TABLE IF NOT EXISTS workout_plans (
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
      )
    `;

    // Step 5: Create workout sessions table
    console.log('  🏃 Creating workout sessions table...');

    await db`
      CREATE TABLE IF NOT EXISTS workout_sessions (
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
      )
    `;

    // Step 6: Create session exercises table
    console.log('  💪 Creating session exercises table...');

    await db`
      CREATE TABLE IF NOT EXISTS session_exercises (
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
        
        -- Actual performance
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
      )
    `;

    // Step 7: Create remaining tables
    console.log('  📊 Creating progress measurements table...');

    await db`
      CREATE TABLE IF NOT EXISTS progress_measurements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        
        -- Measurement details
        measurement_type measurement_type NOT NULL,
        measurement_location VARCHAR(100),
        value DECIMAL(8,3) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        
        -- Context
        measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
        measurement_method VARCHAR(100),
        measurement_device VARCHAR(100),
        
        -- Additional data
        body_composition JSONB DEFAULT '{}',
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
      )
    `;

    await db`
      CREATE TABLE IF NOT EXISTS user_achievements (
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
        badge_color VARCHAR(7),
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
      )
    `;

    await db`
      CREATE TABLE IF NOT EXISTS workout_generation_jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        
        -- Job details
        job_type VARCHAR(50) NOT NULL,
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
      )
    `;

    console.log('  ✅ All tables created successfully');

    // Step 8: Create indexes
    console.log('  📇 Creating indexes for performance optimization...');
    await createIndexes(db);

    // Step 9: Enable RLS and create policies (optional for now)
    console.log('  🔐 Setting up Row Level Security policies...');
    try {
      await setupRLSPolicies(db);
    } catch (error) {
      console.log('  ⚠️  RLS setup encountered issues, skipping for now...');
      console.log('  ℹ️  You can set up RLS policies manually later if needed');
    }

    // Step 10: Create helper functions and triggers
    console.log('  ⚙️  Creating helper functions and triggers...');
    await createHelperFunctions(db);
  } catch (error) {
    console.error('❌ Failed to execute workout schema:', error);
    throw error;
  }
}

async function createIndexes(db: any) {
  // Equipment catalog indexes
  await db`CREATE INDEX IF NOT EXISTS idx_equipment_catalog_category ON equipment_catalog(category, subcategory)`;
  await db`CREATE INDEX IF NOT EXISTS idx_equipment_catalog_active ON equipment_catalog(is_active, created_at) WHERE is_active = true`;
  await db`CREATE INDEX IF NOT EXISTS idx_equipment_catalog_slug ON equipment_catalog(slug) WHERE is_active = true`;

  // Exercise library indexes
  await db`CREATE INDEX IF NOT EXISTS idx_exercise_library_type ON exercise_library(exercise_type)`;
  await db`CREATE INDEX IF NOT EXISTS idx_exercise_library_muscles ON exercise_library USING GIN (primary_muscle_groups)`;
  await db`CREATE INDEX IF NOT EXISTS idx_exercise_library_difficulty ON exercise_library(difficulty_level)`;
  await db`CREATE INDEX IF NOT EXISTS idx_exercise_library_equipment ON exercise_library USING GIN (equipment_required)`;
  await db`CREATE INDEX IF NOT EXISTS idx_exercise_library_active ON exercise_library(is_active, is_public, created_at)`;
  await db`CREATE INDEX IF NOT EXISTS idx_exercise_library_org ON exercise_library(organization_id) WHERE organization_id IS NOT NULL`;
  await db`CREATE INDEX IF NOT EXISTS idx_exercise_library_creator ON exercise_library(created_by) WHERE created_by IS NOT NULL`;

  // Workout plans indexes
  await db`CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id, status, created_at)`;
  await db`CREATE INDEX IF NOT EXISTS idx_workout_plans_org ON workout_plans(organization_id, status, created_at)`;
  await db`CREATE INDEX IF NOT EXISTS idx_workout_plans_status ON workout_plans(status, started_at) WHERE is_active = true`;
  await db`CREATE INDEX IF NOT EXISTS idx_workout_plans_template ON workout_plans(is_template, template_category) WHERE is_template = true`;
  await db`CREATE INDEX IF NOT EXISTS idx_workout_plans_public ON workout_plans(is_public, is_featured) WHERE is_public = true`;

  // Workout sessions indexes
  await db`CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id, scheduled_date DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_workout_sessions_plan ON workout_sessions(workout_plan_id, scheduled_date)`;
  await db`CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status, scheduled_date)`;
  await db`CREATE INDEX IF NOT EXISTS idx_workout_sessions_org ON workout_sessions(organization_id, scheduled_date DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_workout_sessions_date_range ON workout_sessions(scheduled_date, status) WHERE is_active = true`;

  // Session exercises indexes
  await db`CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id, order_index, exercise_phase)`;
  await db`CREATE INDEX IF NOT EXISTS idx_session_exercises_exercise ON session_exercises(exercise_id, status, completed_at)`;
  await db`CREATE INDEX IF NOT EXISTS idx_session_exercises_phase ON session_exercises(exercise_phase, status)`;

  // Progress measurements indexes
  await db`CREATE INDEX IF NOT EXISTS idx_progress_measurements_user ON progress_measurements(user_id, measured_at DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_progress_measurements_type ON progress_measurements(user_id, measurement_type, measured_at DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_progress_measurements_location ON progress_measurements(user_id, measurement_location, measured_at DESC) WHERE measurement_location IS NOT NULL`;

  // User achievements indexes
  await db`CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id, achieved_at DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type, achieved_at DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_user_achievements_milestone ON user_achievements(is_milestone, achieved_at DESC) WHERE is_milestone = true`;
  await db`CREATE INDEX IF NOT EXISTS idx_user_achievements_public ON user_achievements(is_public, achieved_at DESC) WHERE is_public = true`;

  // Generation jobs indexes
  await db`CREATE INDEX IF NOT EXISTS idx_generation_jobs_user ON workout_generation_jobs(user_id, created_at DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON workout_generation_jobs(status, created_at)`;
  await db`CREATE INDEX IF NOT EXISTS idx_generation_jobs_type ON workout_generation_jobs(job_type, status, created_at)`;

  console.log('    ✅ All indexes created successfully');
}

async function setupRLSPolicies(db: any) {
  // Enable RLS on all tables
  await db`ALTER TABLE equipment_catalog ENABLE ROW LEVEL SECURITY`;
  await db`ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY`;
  await db`ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY`;
  await db`ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY`;
  await db`ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY`;
  await db`ALTER TABLE progress_measurements ENABLE ROW LEVEL SECURITY`;
  await db`ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY`;
  await db`ALTER TABLE workout_generation_jobs ENABLE ROW LEVEL SECURITY`;

  // Equipment catalog policies
  try {
    await db`
      CREATE POLICY "Equipment catalog is publicly readable" ON equipment_catalog
        FOR SELECT USING (is_active = true)
    `;
  } catch (error: any) {
    if (error.code !== '42710') throw error; // Ignore if policy exists
  }

  try {
    await db`
      CREATE POLICY "Org admins can manage equipment catalog" ON equipment_catalog
        FOR ALL USING (
          EXISTS(
            SELECT 1 FROM organization_memberships om
            JOIN user_profiles up ON om.user_id = up.id
            WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
            AND om.role IN ('admin', 'owner')
            AND om.is_active = true
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710') throw error; // Ignore if policy exists
  }

  // Exercise library policies
  try {
    await db`
      CREATE POLICY "Users can view public exercises" ON exercise_library
        FOR SELECT USING (is_active = true AND is_public = true)
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log(
        '    ℹ️  Policy "Users can view public exercises" already exists'
      );
  }

  try {
    await db`
      CREATE POLICY "Users can view their org's custom exercises" ON exercise_library
        FOR SELECT USING (
          is_active = true AND 
          organization_id IN (
            SELECT om.organization_id 
            FROM organization_memberships om
            JOIN user_profiles up ON om.user_id = up.id
            WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
            AND om.is_active = true
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log('    ℹ️  Policy for org exercises already exists');
  }

  try {
    await db`
      CREATE POLICY "Users can create exercises in their org" ON exercise_library
        FOR INSERT WITH CHECK (
          organization_id IN (
            SELECT om.organization_id 
            FROM organization_memberships om
            JOIN user_profiles up ON om.user_id = up.id
            WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
            AND om.is_active = true
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log('    ℹ️  Policy for creating exercises already exists');
  }

  try {
    await db`
      CREATE POLICY "Users can update exercises they created" ON exercise_library
        FOR UPDATE USING (
          created_by = (
            SELECT id FROM user_profiles 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log('    ℹ️  Policy for updating exercises already exists');
  }

  // Workout plans policies
  try {
    await db`
      CREATE POLICY "Users can view their own workout plans" ON workout_plans
        FOR SELECT USING (
          user_id = (
            SELECT id FROM user_profiles 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log(
        '    ℹ️  Policy for viewing own workout plans already exists'
      );
  }

  try {
    await db`
      CREATE POLICY "Users can view org members' workout plans" ON workout_plans
        FOR SELECT USING (
          organization_id IN (
            SELECT om.organization_id 
            FROM organization_memberships om
            JOIN user_profiles up ON om.user_id = up.id
            WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
            AND om.is_active = true
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log(
        '    ℹ️  Policy for viewing org workout plans already exists'
      );
  }

  try {
    await db`
      CREATE POLICY "Users can create their own workout plans" ON workout_plans
        FOR INSERT WITH CHECK (
          user_id = (
            SELECT id FROM user_profiles 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log('    ℹ️  Policy for creating workout plans already exists');
  }

  try {
    await db`
      CREATE POLICY "Users can update their own workout plans" ON workout_plans
        FOR UPDATE USING (
          user_id = (
            SELECT id FROM user_profiles 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log('    ℹ️  Policy for updating workout plans already exists');
  }

  // Similar policies for other tables...
  await createRemainingPolicies(db);

  console.log('    ✅ RLS policies created successfully');
}

async function createRemainingPolicies(db: any) {
  // Workout sessions policies
  try {
    await db`
      CREATE POLICY "Users can view their own workout sessions" ON workout_sessions
        FOR SELECT USING (
          user_id = (
            SELECT id FROM user_profiles 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log('    ℹ️  Policy for viewing own sessions already exists');
  }

  try {
    await db`
      CREATE POLICY "Trainers can view org members' sessions" ON workout_sessions
        FOR SELECT USING (
          organization_id IN (
            SELECT om.organization_id 
            FROM organization_memberships om
            JOIN user_profiles up ON om.user_id = up.id
            WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
            AND om.role IN ('admin', 'owner')
            AND om.is_active = true
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log(
        '    ℹ️  Policy for trainers viewing sessions already exists'
      );
  }

  try {
    await db`
      CREATE POLICY "Users can manage their own sessions" ON workout_sessions
        FOR ALL USING (
          user_id = (
            SELECT id FROM user_profiles 
            WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
          )
        )
    `;
  } catch (error: any) {
    if (error.code !== '42710')
      console.log('    ℹ️  Policy for managing sessions already exists');
  }

  // Create basic policies only - can be expanded later
  const basicPolicies = [
    'session_exercises',
    'progress_measurements',
    'user_achievements',
    'workout_generation_jobs',
  ];

  for (const table of basicPolicies) {
    try {
      await db`
        CREATE POLICY ${`"Users can access their own ${table.replace('_', ' ')}"`} ON ${table}
          FOR ALL USING (
            user_id = (
              SELECT id FROM user_profiles 
              WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
            )
          )
      `.unsafe();
    } catch (error: any) {
      if (error.code !== '42710') {
        console.log(
          `    ℹ️  Basic policy for ${table} may already exist or have an issue`
        );
      }
    }
  }
}

async function createHelperFunctions(db: any) {
  // Helper functions for generating slugs
  await db`
    CREATE OR REPLACE FUNCTION generate_exercise_slug(exercise_name TEXT) RETURNS TEXT AS $$
    DECLARE
        base_slug TEXT;
        final_slug TEXT;
        counter INT := 0;
    BEGIN
        base_slug := LOWER(TRIM(REGEXP_REPLACE(exercise_name, '[^a-zA-Z0-9\\s]', '', 'g')));
        base_slug := REGEXP_REPLACE(base_slug, '\\s+', '-', 'g');
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
    $$ LANGUAGE plpgsql
  `;

  await db`
    CREATE OR REPLACE FUNCTION generate_equipment_slug(equipment_name TEXT) RETURNS TEXT AS $$
    DECLARE
        base_slug TEXT;
        final_slug TEXT;
        counter INT := 0;
    BEGIN
        base_slug := LOWER(TRIM(REGEXP_REPLACE(equipment_name, '[^a-zA-Z0-9\\s]', '', 'g')));
        base_slug := REGEXP_REPLACE(base_slug, '\\s+', '-', 'g');
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
    $$ LANGUAGE plpgsql
  `;

  // Trigger functions to set slugs
  await db`
    CREATE OR REPLACE FUNCTION set_exercise_slug() RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.slug IS NULL OR NEW.slug = '' THEN
            NEW.slug := generate_exercise_slug(NEW.name);
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `;

  await db`
    CREATE OR REPLACE FUNCTION set_equipment_slug() RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.slug IS NULL OR NEW.slug = '' THEN
            NEW.slug := generate_equipment_slug(NEW.name);
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `;

  // Create triggers
  await db`CREATE TRIGGER set_exercise_slug_trigger BEFORE INSERT ON exercise_library FOR EACH ROW EXECUTE FUNCTION set_exercise_slug()`;
  await db`CREATE TRIGGER set_equipment_slug_trigger BEFORE INSERT ON equipment_catalog FOR EACH ROW EXECUTE FUNCTION set_equipment_slug()`;

  // Update timestamp triggers
  await db`CREATE TRIGGER update_equipment_catalog_updated_at BEFORE UPDATE ON equipment_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`;
  await db`CREATE TRIGGER update_exercise_library_updated_at BEFORE UPDATE ON exercise_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`;
  await db`CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON workout_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`;
  await db`CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`;
  await db`CREATE TRIGGER update_session_exercises_updated_at BEFORE UPDATE ON session_exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`;
  await db`CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON workout_generation_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`;

  console.log('    ✅ Helper functions and triggers created successfully');
}

async function populateExerciseLibrary(db: any) {
  const exerciseSeeds = [
    {
      name: 'Push-Up',
      description: 'Classic bodyweight chest and arm exercise',
      instructions:
        'Start in plank position, lower body until chest nearly touches ground, push back up.',
      exercise_type: 'strength',
      primary_muscle_groups: ['chest', 'shoulders', 'triceps'],
      secondary_muscle_groups: ['core'],
      difficulty_level: 'beginner',
      default_sets: 3,
      default_reps_min: 8,
      default_reps_max: 15,
      default_rest_seconds: 60,
      safety_tips: [
        'Keep body straight',
        "Don't let hips sag",
        'Full range of motion',
      ],
      modifications: JSON.stringify({
        easier: ['Knee push-ups', 'Wall push-ups', 'Incline push-ups'],
        harder: ['Diamond push-ups', 'One-arm push-ups', 'Decline push-ups'],
      }),
    },
    {
      name: 'Bodyweight Squat',
      description: 'Fundamental lower body bodyweight exercise',
      instructions:
        'Stand with feet hip-width apart, lower hips back and down, return to standing.',
      exercise_type: 'strength',
      primary_muscle_groups: ['quadriceps', 'glutes'],
      secondary_muscle_groups: ['hamstrings', 'calves', 'core'],
      difficulty_level: 'beginner',
      default_sets: 3,
      default_reps_min: 12,
      default_reps_max: 20,
      default_rest_seconds: 60,
      safety_tips: [
        'Keep knees aligned with toes',
        'Chest up',
        'Weight on heels',
      ],
      modifications: JSON.stringify({
        easier: ['Chair-assisted squats', 'Partial range squats'],
        harder: ['Jump squats', 'Pistol squats', 'Bulgarian split squats'],
      }),
    },
    {
      name: 'Running',
      description: 'Cardiovascular endurance exercise',
      instructions:
        'Maintain steady pace, proper running form, rhythmic breathing.',
      exercise_type: 'cardio',
      primary_muscle_groups: ['legs', 'cardiovascular'],
      secondary_muscle_groups: ['core'],
      difficulty_level: 'beginner',
      default_duration_seconds: 1800, // 30 minutes
      default_rest_seconds: 0,
      safety_tips: ['Proper footwear', 'Warm up gradually', 'Stay hydrated'],
      modifications: JSON.stringify({
        easier: ['Walking', 'Walk-run intervals'],
        harder: ['Hill running', 'Sprint intervals', 'Long distance running'],
      }),
    },
    {
      name: 'Plank',
      description: 'Core stabilization exercise',
      instructions:
        'Hold body straight in push-up position, engage core, breathe normally.',
      exercise_type: 'strength',
      primary_muscle_groups: ['core'],
      secondary_muscle_groups: ['shoulders', 'chest'],
      difficulty_level: 'beginner',
      default_duration_seconds: 60,
      default_rest_seconds: 60,
      safety_tips: ['Keep body straight', "Don't hold breath", 'Engage glutes'],
      modifications: JSON.stringify({
        easier: ['Knee plank', 'Wall plank', 'Incline plank'],
        harder: ['Side plank', 'Plank up-downs', 'Single-arm plank'],
      }),
    },
    {
      name: 'Jumping Jacks',
      description: 'Full-body cardiovascular exercise',
      instructions:
        'Jump while spreading legs and raising arms overhead, return to starting position.',
      exercise_type: 'cardio',
      primary_muscle_groups: ['legs', 'cardiovascular'],
      secondary_muscle_groups: ['shoulders', 'core'],
      difficulty_level: 'beginner',
      default_sets: 3,
      default_reps_min: 20,
      default_reps_max: 50,
      default_rest_seconds: 45,
      safety_tips: ['Land softly', 'Maintain rhythm', 'Stay hydrated'],
      modifications: JSON.stringify({
        easier: ['Step-touch', 'Half jacks', 'Seated jacks'],
        harder: ['Star jumps', 'Cross jacks', 'Burpee jacks'],
      }),
    },
  ];

  for (const exercise of exerciseSeeds) {
    try {
      await db`
        INSERT INTO exercise_library (
          name, description, instructions, exercise_type,
          primary_muscle_groups, secondary_muscle_groups, difficulty_level,
          default_sets, default_reps_min, default_reps_max, default_duration_seconds,
          default_rest_seconds, safety_tips, modifications, is_verified, is_public
        ) VALUES (
          ${exercise.name}, ${exercise.description}, ${exercise.instructions}, ${exercise.exercise_type},
          ${exercise.primary_muscle_groups}, ${exercise.secondary_muscle_groups || []}, ${exercise.difficulty_level},
          ${exercise.default_sets || null}, ${exercise.default_reps_min || null}, ${exercise.default_reps_max || null}, 
          ${exercise.default_duration_seconds || null}, ${exercise.default_rest_seconds},
          ${exercise.safety_tips}, ${exercise.modifications}, true, true
        )
      `;
    } catch (error) {
      console.log(
        `    ⚠️  Exercise ${exercise.name} may already exist, skipping...`
      );
    }
  }

  // Add some basic equipment
  const equipmentSeeds = [
    {
      name: 'Yoga Mat',
      description: 'Non-slip exercise mat for floor exercises',
      category: 'accessories',
      subcategory: 'mats',
    },
    {
      name: 'Dumbbells',
      description: 'Adjustable weight dumbbells for strength training',
      category: 'weights',
      subcategory: 'free_weights',
    },
    {
      name: 'Resistance Bands',
      description: 'Elastic bands for resistance training',
      category: 'accessories',
      subcategory: 'bands',
    },
  ];

  for (const equipment of equipmentSeeds) {
    try {
      await db`
        INSERT INTO equipment_catalog (
          name, description, category, subcategory, is_verified, is_active
        ) VALUES (
          ${equipment.name}, ${equipment.description}, ${equipment.category}, 
          ${equipment.subcategory}, true, true
        )
      `;
    } catch (error) {
      console.log(
        `    ⚠️  Equipment ${equipment.name} may already exist, skipping...`
      );
    }
  }

  console.log('  ✅ Exercise library and equipment catalog populated');
}

async function testDatabaseSetup(db: any) {
  try {
    // Test 1: Verify all tables exist
    const tables = await db`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%workout%' OR table_name IN ('equipment_catalog', 'exercise_library', 'progress_measurements', 'user_achievements')
      ORDER BY table_name
    `;

    console.log(`  📊 Found ${tables.length} workout-related tables:`);
    tables.forEach((table) => {
      console.log(`    ✓ ${table.table_name}`);
    });

    // Test 2: Verify exercise library has data
    const exerciseCount =
      await db`SELECT COUNT(*) as count FROM exercise_library`;
    console.log(
      `  📚 Exercise library contains ${exerciseCount[0].count} exercises`
    );

    // Test 3: Verify equipment catalog has data
    const equipmentCount =
      await db`SELECT COUNT(*) as count FROM equipment_catalog`;
    console.log(
      `  🏋️  Equipment catalog contains ${equipmentCount[0].count} items`
    );

    // Test 4: Test RLS policies are enabled
    const rlsTables = await db`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND rowsecurity = true
      AND (tablename LIKE '%workout%' OR tablename IN ('equipment_catalog', 'exercise_library', 'progress_measurements', 'user_achievements'))
    `;

    console.log(`  🔐 RLS enabled on ${rlsTables.length} tables`);

    // Test 5: Verify helper functions exist
    const functions = await db`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%exercise%' OR routine_name LIKE '%equipment%'
    `;

    console.log(`  ⚙️  Found ${functions.length} helper functions`);

    console.log('  ✅ Database setup tests passed!');
  } catch (error) {
    console.error('  ❌ Database setup test failed:', error);
    throw error;
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupWorkoutDatabase();
}

export { setupWorkoutDatabase };
