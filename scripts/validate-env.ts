#!/usr/bin/env tsx

/**
 * Environment Validation Script
 * Validates environment variables and provides developer-friendly feedback
 */

import { resolve } from 'path';
import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const verbose = process.argv.includes('--verbose');

interface EnvCheck {
  key: string;
  required: boolean;
  description: string;
  example?: string;
  validator?: (value: string) => boolean | string;
}

const envChecks: EnvCheck[] = [
  // Database
  {
    key: 'DATABASE_URL',
    required: true,
    description: 'NeonDB connection string',
    example: 'postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb',
    validator: (val) =>
      val.includes('postgresql://') ||
      'Must be a valid PostgreSQL connection string',
  },

  // Authentication (Clerk)
  {
    key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    required: true,
    description: 'Clerk publishable key (public)',
    example: 'pk_test_...',
    validator: (val) => val.startsWith('pk_') || 'Must start with pk_',
  },
  {
    key: 'CLERK_SECRET_KEY',
    required: true,
    description: 'Clerk secret key (private)',
    example: 'sk_test_...',
    validator: (val) => val.startsWith('sk_') || 'Must start with sk_',
  },
  {
    key: 'CLERK_WEBHOOK_SECRET',
    required: false,
    description: 'Clerk webhook secret for user sync',
    example: 'whsec_...',
  },

  // OpenAI/AI Service
  {
    key: 'OPENAI_API_KEY',
    required: true,
    description: 'OpenAI API key for AI workout generation',
    example: 'sk-...',
    validator: (val) => val.startsWith('sk-') || 'Must start with sk-',
  },

  // Monitoring (Optional)
  {
    key: 'SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error tracking',
    example: 'https://...@sentry.io/...',
  },
  {
    key: 'POSTHOG_KEY',
    required: false,
    description: 'PostHog key for analytics',
    example: 'phc_...',
  },

  // App Configuration
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: false,
    description: 'Public app URL (used for webhooks and redirects)',
    example: 'http://localhost:3000',
    validator: (val) => val.startsWith('http') || 'Must be a valid URL',
  },
  {
    key: 'NODE_ENV',
    required: false,
    description: 'Node environment',
    example: 'development',
    validator: (val) =>
      ['development', 'production', 'test'].includes(val) ||
      'Must be development, production, or test',
  },
];

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logVerbose(message: string, color: string = colors.reset) {
  if (verbose) {
    console.log(`${color}${message}${colors.reset}`);
  }
}

function validateEnvironment(): boolean {
  log(`${colors.blue}${colors.bold}🔍 Environment Validation${colors.reset}`);
  log('================================');

  // Load environment files
  const envFiles = ['.env.local', '.env'];
  let envFileLoaded = false;

  for (const file of envFiles) {
    const filePath = resolve(process.cwd(), file);
    if (existsSync(filePath)) {
      config({ path: filePath, override: false });
      logVerbose(`✓ Loaded ${file}`, colors.green);
      envFileLoaded = true;
    }
  }

  if (!envFileLoaded) {
    log(
      '⚠️  No .env files found. Using system environment variables only.',
      colors.yellow
    );
  }

  let allValid = true;
  let criticalMissing = 0;
  let optionalMissing = 0;

  for (const check of envChecks) {
    const value = process.env[check.key];
    const hasValue = value && value.trim() !== '';

    if (!hasValue) {
      if (check.required) {
        log(`❌ ${check.key} (REQUIRED)`, colors.red);
        log(`   ${check.description}`, colors.red);
        if (check.example) {
          log(`   Example: ${check.example}`, colors.cyan);
        }
        criticalMissing++;
        allValid = false;
      } else {
        log(`⚠️  ${check.key} (optional)`, colors.yellow);
        log(`   ${check.description}`, colors.yellow);
        if (check.example) {
          log(`   Example: ${check.example}`, colors.cyan);
        }
        optionalMissing++;
      }
    } else {
      // Validate value if validator exists
      if (check.validator) {
        const validation = check.validator(value);
        if (validation === true) {
          logVerbose(`✅ ${check.key}`, colors.green);
          if (verbose) {
            const maskedValue =
              check.key.includes('SECRET') || check.key.includes('KEY')
                ? value.substring(0, 8) + '...'
                : value;
            logVerbose(`   Value: ${maskedValue}`, colors.cyan);
          }
        } else {
          log(`❌ ${check.key} (INVALID)`, colors.red);
          log(
            `   ${typeof validation === 'string' ? validation : 'Invalid value'}`,
            colors.red
          );
          if (check.required) {
            allValid = false;
          }
        }
      } else {
        logVerbose(`✅ ${check.key}`, colors.green);
        if (verbose) {
          const maskedValue =
            check.key.includes('SECRET') || check.key.includes('KEY')
              ? value.substring(0, 8) + '...'
              : value;
          logVerbose(`   Value: ${maskedValue}`, colors.cyan);
        }
      }
    }
  }

  log('');
  log(`${colors.bold}Summary:${colors.reset}`);

  if (allValid) {
    log(`✅ All required environment variables are valid!`, colors.green);
    if (optionalMissing > 0) {
      log(
        `⚠️  ${optionalMissing} optional variables missing (features may be limited)`,
        colors.yellow
      );
    }
  } else {
    log(
      `❌ ${criticalMissing} required environment variables missing or invalid`,
      colors.red
    );
    if (optionalMissing > 0) {
      log(`⚠️  ${optionalMissing} optional variables missing`, colors.yellow);
    }
  }

  // Provide helpful setup instructions
  if (!allValid) {
    log('');
    log(`${colors.bold}Quick Fix:${colors.reset}`);
    log('1. Copy .env.example to .env.local:', colors.blue);
    log('   cp .env.example .env.local', colors.cyan);
    log('2. Fill in your actual values in .env.local', colors.blue);
    log('3. Run this validation again:', colors.blue);
    log('   pnpm env:validate', colors.cyan);
  }

  return allValid;
}

// Additional development environment checks
function checkDevelopmentEnvironment(): void {
  log(
    `${colors.blue}${colors.bold}🛠️  Development Environment Check${colors.reset}`
  );
  log('=====================================');

  // Check Node.js version
  const nodeVersion = process.version;
  const requiredNode = '18.17.0';
  log(`Node.js: ${nodeVersion}`, colors.green);

  // Check pnpm
  try {
    const { execSync } = require('child_process');
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    log(`pnpm: ${pnpmVersion}`, colors.green);
  } catch {
    log('❌ pnpm not found or not working', colors.red);
  }

  // Check database connection (if DATABASE_URL exists)
  if (process.env.DATABASE_URL) {
    log('Database connection will be tested during startup', colors.blue);
  }

  // Check port availability
  const port = process.env.PORT || '3000';
  log(`Default port: ${port}`, colors.green);

  log('');
}

// Main execution
async function main() {
  const isValid = validateEnvironment();

  if (verbose) {
    log('');
    checkDevelopmentEnvironment();
  }

  process.exit(isValid ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});

process.on('unhandledRejection', (error: any) => {
  log(`❌ Unhandled promise rejection: ${error.message}`, colors.red);
  process.exit(1);
});

main().catch((error) => {
  log(`❌ Validation failed: ${error.message}`, colors.red);
  process.exit(1);
});
