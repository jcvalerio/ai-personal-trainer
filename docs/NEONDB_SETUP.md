# NeonDB Setup Guide

This guide will help you set up a NeonDB database for the AI Personal Trainer application.

## 🚀 Quick Setup (5 minutes)

### 1. Create NeonDB Account

1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up with GitHub (recommended) or email
3. Create your first project:
   - **Project name**: `ai-personal-trainer`
   - **Database name**: `ai_trainer_db`
   - **Region**: Choose closest to your location
   - **Plan**: Select **Free** (sufficient for development)

### 2. Get Connection Strings

After creating your project, you'll see the connection details:

1. **Copy the Connection String**:
   ```
   postgresql://[username]:[password]@[hostname]/[database]?sslmode=require
   ```

2. **Get Both Connection Types**:
   - **Pooled connection** (for serverless functions)
   - **Direct connection** (for migrations and admin tasks)

### 3. Update Environment Variables

Update your `.env.local` file with the real connection strings:

```env
# Database Configuration (NeonDB)
DATABASE_URL=postgresql://username:password@ep-cool-math-123456.us-east-2.aws.neon.tech/ai_trainer_db?sslmode=require
DIRECT_URL=postgresql://username:password@ep-cool-math-123456.us-east-2.aws.neon.tech/ai_trainer_db?sslmode=require&connect_timeout=10
```

**Note**: Replace `username`, `password`, and the hostname with your actual NeonDB credentials.

### 4. Set Up Database Schema

Run the database setup script to create all tables and indexes:

```bash
pnpm db:setup
```

You should see output like:
```
🔗 Checking database connection...
✅ Database connection established
🏗️  Creating database schema...
✅ Database schema created successfully
🎯 Database setup complete!
📊 Created 6 tables
```

### 5. Verify Connection

Test your database connection:

```bash
pnpm db:check
```

Expected output:
```
Connected: true { 
  hasMainConnection: true, 
  hasDirectConnection: true, 
  environment: 'development' 
}
```

## 📋 Database Schema Overview

The setup script creates these tables:

- **`user_profiles`** - User data and fitness information
- **`organizations`** - Family groups and gym partnerships  
- **`organization_memberships`** - User-organization relationships
- **`organization_invites`** - Pending invitations
- **`auth_audit_log`** - Security audit trail

## 🔒 Security Features

- **Row-Level Security (RLS)** enabled on all tables
- **Multi-tenant data isolation** 
- **Audit logging** for all authentication events
- **UUID primary keys** for security
- **Indexed queries** for performance

## 🛠️ Development Commands

```bash
# Check database connection
pnpm db:check

# Set up database schema (first time)
pnpm db:setup

# Start development server
pnpm dev
```

## 🔧 Troubleshooting

### Connection Failed
1. **Check credentials**: Ensure DATABASE_URL is correct
2. **Network issues**: Try from different network
3. **Firewall**: NeonDB requires SSL connections

### Permission Errors
1. **User permissions**: Ensure user has CREATE privileges
2. **Database exists**: Verify database name in connection string

### Schema Issues
1. **Clean setup**: Drop all tables and re-run `pnpm db:setup`
2. **Manual SQL**: Execute SQL directly in NeonDB console

## 📊 Free Tier Limits

NeonDB Free tier includes:
- **512 MB storage**
- **1 database**
- **Compute time**: 100 hours/month
- **Connections**: Up to 100 concurrent

Perfect for development and initial testing!

## 🔄 Next Steps

After database setup is complete:

1. **Test Authentication**: Visit `/sign-up` and create an account
2. **Test Profile Creation**: Complete the onboarding flow
3. **Test Organizations**: Create a family or gym organization
4. **Verify Data**: Check NeonDB console to see data being created

## 📞 Need Help?

- **NeonDB Documentation**: [neon.tech/docs](https://neon.tech/docs)
- **Connection Issues**: Check the [connection troubleshooting guide](https://neon.tech/docs/connect/connection-errors)
- **Project Issues**: Create an issue in the GitHub repository