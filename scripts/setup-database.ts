/**
 * Database setup script for NeonDB
 * Run with: npx tsx scripts/setup-database.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Dynamically import connection after env vars are loaded
async function getDbConnections() {
  const { getDb, checkDbConnection } = await import('../lib/db/connection')
  return { db: getDb(), checkDbConnection }
}

const DATABASE_SCHEMA = `
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  fitness_level VARCHAR(50),
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  birth_date DATE,
  primary_goals JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{}',
  organization_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('family', 'gym')),
  description TEXT,
  settings JSONB DEFAULT '{}',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  max_members INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create organization_memberships table
CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  UNIQUE(organization_id, user_id)
);

-- Create organization_invites table
CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  invite_code VARCHAR(50) UNIQUE NOT NULL,
  invited_by UUID NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Create auth_audit_log table
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  organization_id UUID,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  event_description TEXT,
  additional_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Add foreign key constraint for organization_id in user_profiles
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_clerk_id ON organizations(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_code ON organization_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_org_id ON auth_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON auth_audit_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE OR REPLACE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY user_profiles_select ON user_profiles 
  FOR SELECT USING (
    clerk_user_id = current_setting('app.clerk_user_id', true)
    OR 
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om 
      JOIN user_profiles up ON om.user_id = up.id 
      WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
      AND om.is_active = true
      AND (om.role IN ('family_admin', 'gym_admin', 'gym_owner') OR up.organization_id IS NOT NULL)
    )
  );

CREATE POLICY user_profiles_update ON user_profiles 
  FOR UPDATE USING (
    clerk_user_id = current_setting('app.clerk_user_id', true)
  );

CREATE POLICY user_profiles_insert ON user_profiles 
  FOR INSERT WITH CHECK (
    clerk_user_id = current_setting('app.clerk_user_id', true)
  );

-- RLS Policies for organizations  
CREATE POLICY organizations_select ON organizations 
  FOR SELECT USING (
    id IN (
      SELECT om.organization_id 
      FROM organization_memberships om 
      JOIN user_profiles up ON om.user_id = up.id 
      WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
      AND om.is_active = true
    )
    OR clerk_org_id = current_setting('app.clerk_org_id', true)
  );

CREATE POLICY organizations_update ON organizations 
  FOR UPDATE USING (
    id IN (
      SELECT om.organization_id 
      FROM organization_memberships om 
      JOIN user_profiles up ON om.user_id = up.id 
      WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
      AND om.role IN ('family_admin', 'gym_admin', 'gym_owner')
      AND om.is_active = true
    )
  );

CREATE POLICY organizations_insert ON organizations 
  FOR INSERT WITH CHECK (true); -- Allow creation, membership will be managed separately

-- RLS Policies for organization_memberships
CREATE POLICY org_memberships_select ON organization_memberships 
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om 
      JOIN user_profiles up ON om.user_id = up.id 
      WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
      AND om.is_active = true
    )
  );

CREATE POLICY org_memberships_insert ON organization_memberships 
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om 
      JOIN user_profiles up ON om.user_id = up.id 
      WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
      AND om.role IN ('family_admin', 'gym_admin', 'gym_owner')
      AND om.is_active = true
    )
    OR user_id IN (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
    )
  );

CREATE POLICY org_memberships_update ON organization_memberships 
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om 
      JOIN user_profiles up ON om.user_id = up.id 
      WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
      AND om.role IN ('family_admin', 'gym_admin', 'gym_owner')
      AND om.is_active = true
    )
  );

-- RLS Policies for organization_invites
CREATE POLICY org_invites_select ON organization_invites 
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om 
      JOIN user_profiles up ON om.user_id = up.id 
      WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
      AND om.is_active = true
    )
    OR email = current_setting('app.user_email', true)
  );

CREATE POLICY org_invites_insert ON organization_invites 
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om 
      JOIN user_profiles up ON om.user_id = up.id 
      WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
      AND om.role IN ('family_admin', 'gym_admin', 'gym_owner')
      AND om.is_active = true
    )
  );

CREATE POLICY org_invites_update ON organization_invites 
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om 
      JOIN user_profiles up ON om.user_id = up.id 
      WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
      AND om.role IN ('family_admin', 'gym_admin', 'gym_owner')
      AND om.is_active = true
    )
    OR email = current_setting('app.user_email', true)
  );

-- RLS Policies for auth_audit_log
CREATE POLICY auth_audit_log_select ON auth_audit_log 
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM user_profiles 
      WHERE clerk_user_id = current_setting('app.clerk_user_id', true)
    )
    OR organization_id IN (
      SELECT om.organization_id 
      FROM organization_memberships om 
      JOIN user_profiles up ON om.user_id = up.id 
      WHERE up.clerk_user_id = current_setting('app.clerk_user_id', true)
      AND om.role IN ('family_admin', 'gym_admin', 'gym_owner')
      AND om.is_active = true
    )
  );

CREATE POLICY auth_audit_log_insert ON auth_audit_log 
  FOR INSERT WITH CHECK (true); -- Allow audit logging from system
`;

async function setupDatabase() {
  try {
    console.log('🔗 Checking database connection...')
    
    // Get database connections after env vars are loaded
    const { db, checkDbConnection } = await getDbConnections()
    
    const isConnected = await checkDbConnection()
    if (!isConnected) {
      throw new Error('Failed to connect to database. Please check your DATABASE_URL environment variable.')
    }

    console.log('✅ Database connection established')
    console.log('🏗️  Creating database schema...')

    // Execute the schema creation step by step
    console.log('📝 Executing database schema step by step...')
    
    try {
      // Step 1: Create extensions
      console.log('  🔌 Creating extensions...')
      await db`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
      await db`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`
      
      // Step 2: Create tables
      console.log('  📋 Creating tables...')
      
      // Create user_profiles table
      await db`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE,
          display_name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user',
          fitness_level VARCHAR(50),
          height_cm INTEGER,
          weight_kg DECIMAL(5,2),
          birth_date DATE,
          primary_goals JSONB DEFAULT '[]',
          preferences JSONB DEFAULT '{}',
          organization_id UUID,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      // Create organizations table
      await db`
        CREATE TABLE IF NOT EXISTS organizations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          clerk_org_id VARCHAR(255) UNIQUE,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL CHECK (type IN ('family', 'gym')),
          description TEXT,
          settings JSONB DEFAULT '{}',
          subscription_tier VARCHAR(50) DEFAULT 'free',
          max_members INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      // Create organization_memberships table
      await db`
        CREATE TABLE IF NOT EXISTS organization_memberships (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID NOT NULL,
          user_id UUID NOT NULL,
          role VARCHAR(50) NOT NULL,
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
          UNIQUE(organization_id, user_id)
        )
      `
      
      // Create organization_invites table
      await db`
        CREATE TABLE IF NOT EXISTS organization_invites (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID NOT NULL,
          email VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          invite_code VARCHAR(50) UNIQUE NOT NULL,
          invited_by UUID NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          accepted_at TIMESTAMP,
          is_used BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
          FOREIGN KEY (invited_by) REFERENCES user_profiles(id) ON DELETE CASCADE
        )
      `
      
      // Create auth_audit_log table
      await db`
        CREATE TABLE IF NOT EXISTS auth_audit_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID,
          organization_id UUID,
          event_type VARCHAR(100) NOT NULL,
          event_category VARCHAR(50) NOT NULL,
          event_description TEXT,
          additional_data JSONB DEFAULT '{}',
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
        )
      `
      
      // Step 3: Add foreign key constraint
      console.log('  🔗 Adding foreign key constraints...')
      try {
        await db`
          ALTER TABLE user_profiles 
          ADD CONSTRAINT fk_user_organization 
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
        `
      } catch (error) {
        // Constraint might already exist
        console.log('    ℹ️  Foreign key constraint may already exist')
      }
      
      // Step 4: Create indexes
      console.log('  📇 Creating indexes...')
      await db`CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id)`
      await db`CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email)`
      await db`CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id)`
      await db`CREATE INDEX IF NOT EXISTS idx_organizations_clerk_id ON organizations(clerk_org_id)`
      await db`CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON organization_memberships(organization_id)`
      await db`CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON organization_memberships(user_id)`
      await db`CREATE INDEX IF NOT EXISTS idx_org_invites_code ON organization_invites(invite_code)`
      await db`CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email)`
      await db`CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON auth_audit_log(user_id)`
      await db`CREATE INDEX IF NOT EXISTS idx_auth_audit_log_org_id ON auth_audit_log(organization_id)`
      await db`CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON auth_audit_log(created_at)`
      
      // Step 5: Create trigger function
      console.log('  ⚙️  Creating trigger functions...')
      await db`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql'
      `
      
      // Step 6: Create triggers
      console.log('  🎯 Creating triggers...')
      await db`
        CREATE OR REPLACE TRIGGER update_user_profiles_updated_at 
            BEFORE UPDATE ON user_profiles 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `
      
      await db`
        CREATE OR REPLACE TRIGGER update_organizations_updated_at 
            BEFORE UPDATE ON organizations 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `
      
      console.log('✅ Schema executed successfully')
      
      // Verify tables were created
      const tableCheck = await db`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
      
      console.log(`📊 Successfully created ${tableCheck.length} tables:`)
      tableCheck.forEach(table => {
        console.log(`  ✓ ${table.table_name}`)
      })
      
    } catch (error) {
      console.error('❌ Failed to execute schema:', error)
      throw error
    }

    console.log('🎯 Database setup complete!')

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase()
}

export { setupDatabase }