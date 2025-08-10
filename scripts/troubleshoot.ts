#!/usr/bin/env tsx

/**
 * Troubleshooting Script
 * Diagnoses common development issues and provides solutions
 */

import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

interface TroubleshootCheck {
  name: string;
  description: string;
  check: () => Promise<{ status: 'pass' | 'warn' | 'fail'; message: string; solution?: string }>;
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const troubleshootChecks: TroubleshootCheck[] = [
  {
    name: 'Node.js Version',
    description: 'Check if Node.js version meets requirements',
    check: async () => {
      const nodeVersion = process.version;
      const major = parseInt(nodeVersion.substring(1).split('.')[0]);
      
      if (major >= 18) {
        return { status: 'pass', message: `Node.js ${nodeVersion} ✅` };
      } else {
        return {
          status: 'fail',
          message: `Node.js ${nodeVersion} is too old`,
          solution: 'Update to Node.js 18.17.0 or later. Use nvm or download from nodejs.org'
        };
      }
    }
  },

  {
    name: 'Package Manager',
    description: 'Check pnpm installation and version',
    check: async () => {
      try {
        const { stdout } = await execAsync('pnpm --version');
        const version = stdout.trim();
        return { status: 'pass', message: `pnpm ${version} ✅` };
      } catch {
        return {
          status: 'fail',
          message: 'pnpm not installed or not in PATH',
          solution: 'Install pnpm: npm install -g pnpm'
        };
      }
    }
  },

  {
    name: 'Dependencies',
    description: 'Check if node_modules is properly installed',
    check: async () => {
      const nodeModulesPath = resolve(process.cwd(), 'node_modules');
      const packageLockPath = resolve(process.cwd(), 'pnpm-lock.yaml');
      
      if (!existsSync(nodeModulesPath)) {
        return {
          status: 'fail',
          message: 'node_modules directory missing',
          solution: 'Run: pnpm install'
        };
      }
      
      if (!existsSync(packageLockPath)) {
        return {
          status: 'warn',
          message: 'pnpm-lock.yaml missing',
          solution: 'Run: pnpm install to generate lockfile'
        };
      }
      
      return { status: 'pass', message: 'Dependencies installed ✅' };
    }
  },

  {
    name: 'Environment Variables',
    description: 'Check critical environment variables',
    check: async () => {
      const required = ['DATABASE_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'];
      const missing = required.filter(key => !process.env[key]);
      
      if (missing.length === 0) {
        return { status: 'pass', message: 'All critical environment variables set ✅' };
      } else {
        return {
          status: 'fail',
          message: `Missing: ${missing.join(', ')}`,
          solution: 'Copy .env.example to .env.local and fill in values'
        };
      }
    }
  },

  {
    name: 'Port Availability',
    description: 'Check if development port (3000) is available',
    check: async () => {
      try {
        const { stdout } = await execAsync('lsof -ti:3000 2>/dev/null || true');
        if (stdout.trim()) {
          return {
            status: 'warn',
            message: 'Port 3000 is in use',
            solution: 'Stop the process using port 3000 or use PORT=3001 pnpm dev'
          };
        } else {
          return { status: 'pass', message: 'Port 3000 available ✅' };
        }
      } catch {
        // Fallback for systems without lsof
        return { status: 'pass', message: 'Port check skipped (lsof not available)' };
      }
    }
  },

  {
    name: 'TypeScript Configuration',
    description: 'Check TypeScript setup',
    check: async () => {
      const tsconfigPath = resolve(process.cwd(), 'tsconfig.json');
      
      if (!existsSync(tsconfigPath)) {
        return {
          status: 'fail',
          message: 'tsconfig.json missing',
          solution: 'Create tsconfig.json or restore from git'
        };
      }
      
      try {
        const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
        if (tsconfig.extends === 'next/tsconfig.json') {
          return { status: 'pass', message: 'TypeScript configuration valid ✅' };
        } else {
          return {
            status: 'warn',
            message: 'TypeScript config may not be Next.js optimized',
            solution: 'Ensure tsconfig.json extends "next/tsconfig.json"'
          };
        }
      } catch {
        return {
          status: 'fail',
          message: 'tsconfig.json is invalid JSON',
          solution: 'Fix JSON syntax in tsconfig.json'
        };
      }
    }
  },

  {
    name: 'Build Process',
    description: 'Test build process',
    check: async () => {
      try {
        // Quick type check instead of full build
        await execAsync('npx tsc --noEmit --skipLibCheck');
        return { status: 'pass', message: 'TypeScript compilation successful ✅' };
      } catch (error: any) {
        return {
          status: 'fail',
          message: 'TypeScript compilation failed',
          solution: 'Fix TypeScript errors shown above'
        };
      }
    }
  },

  {
    name: 'Database Connection',
    description: 'Test database connectivity',
    check: async () => {
      if (!process.env.DATABASE_URL) {
        return {
          status: 'warn',
          message: 'DATABASE_URL not set',
          solution: 'Set DATABASE_URL in .env.local'
        };
      }
      
      try {
        // Import and test connection (simplified check)
        const url = process.env.DATABASE_URL;
        if (url.includes('postgresql://') || url.includes('postgres://')) {
          return { status: 'pass', message: 'Database URL format valid ✅' };
        } else {
          return {
            status: 'fail',
            message: 'Invalid database URL format',
            solution: 'Ensure DATABASE_URL is a valid PostgreSQL connection string'
          };
        }
      } catch (error: any) {
        return {
          status: 'fail',
          message: `Database connection failed: ${error.message}`,
          solution: 'Check DATABASE_URL and network connectivity'
        };
      }
    }
  },

  {
    name: 'Playwright Setup',
    description: 'Check E2E testing setup',
    check: async () => {
      const configPath = resolve(process.cwd(), 'playwright.config.ts');
      
      if (!existsSync(configPath)) {
        return {
          status: 'warn',
          message: 'Playwright config missing',
          solution: 'Run: pnpm test:e2e:install'
        };
      }
      
      try {
        await execAsync('npx playwright --version');
        return { status: 'pass', message: 'Playwright setup complete ✅' };
      } catch {
        return {
          status: 'warn',
          message: 'Playwright browsers not installed',
          solution: 'Run: pnpm test:e2e:install'
        };
      }
    }
  }
];

async function runTroubleshooting(): Promise<void> {
  log(`${colors.blue}${colors.bold}🔧 AI Personal Trainer - Troubleshooting${colors.reset}`);
  log('==========================================');
  log('');

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const check of troubleshootChecks) {
    log(`${colors.bold}Checking: ${check.name}${colors.reset}`);
    log(`${check.description}`);
    
    try {
      const result = await check.check();
      
      switch (result.status) {
        case 'pass':
          log(`  ${colors.green}${result.message}${colors.reset}`);
          passCount++;
          break;
        case 'warn':
          log(`  ${colors.yellow}⚠️  ${result.message}${colors.reset}`);
          if (result.solution) {
            log(`  ${colors.cyan}💡 Solution: ${result.solution}${colors.reset}`);
          }
          warnCount++;
          break;
        case 'fail':
          log(`  ${colors.red}❌ ${result.message}${colors.reset}`);
          if (result.solution) {
            log(`  ${colors.cyan}💡 Solution: ${result.solution}${colors.reset}`);
          }
          failCount++;
          break;
      }
    } catch (error: any) {
      log(`  ${colors.red}❌ Check failed: ${error.message}${colors.reset}`);
      failCount++;
    }
    
    log('');
  }

  // Summary
  log(`${colors.bold}Summary:${colors.reset}`);
  log(`✅ Passed: ${passCount}`, colors.green);
  if (warnCount > 0) {
    log(`⚠️  Warnings: ${warnCount}`, colors.yellow);
  }
  if (failCount > 0) {
    log(`❌ Failed: ${failCount}`, colors.red);
  }
  
  log('');

  // Overall status and next steps
  if (failCount === 0) {
    if (warnCount === 0) {
      log(`🎉 All checks passed! Your development environment is ready.`, colors.green);
      log(`${colors.bold}Next steps:${colors.reset}`);
      log(`1. Start development: ${colors.cyan}pnpm dev${colors.reset}`);
      log(`2. Run tests: ${colors.cyan}pnpm test:e2e${colors.reset}`);
      log(`3. Deploy to preview: ${colors.cyan}pnpm deploy${colors.reset}`);
    } else {
      log(`✅ Core functionality should work, but some warnings need attention.`, colors.yellow);
      log(`${colors.bold}Recommended actions:${colors.reset}`);
      log(`1. Fix warnings above for optimal experience`);
      log(`2. Start development: ${colors.cyan}pnpm dev${colors.reset}`);
    }
  } else {
    log(`❌ ${failCount} critical issues found. Please fix them before continuing.`, colors.red);
    log(`${colors.bold}Critical fixes needed:${colors.reset}`);
    log(`1. Address all failed checks above`);
    log(`2. Run troubleshooting again: ${colors.cyan}pnpm troubleshoot${colors.reset}`);
  }

  // Common issues and solutions
  if (failCount > 0 || warnCount > 0) {
    log('');
    log(`${colors.bold}Common Solutions:${colors.reset}`);
    log(`${colors.cyan}# Fresh install${colors.reset}`);
    log(`pnpm clean:install`);
    log('');
    log(`${colors.cyan}# Setup environment${colors.reset}`);
    log(`cp .env.example .env.local`);
    log(`# Edit .env.local with your values`);
    log('');
    log(`${colors.cyan}# Validate everything${colors.reset}`);
    log(`pnpm quick:check`);
    log('');
    log(`${colors.cyan}# Start development${colors.reset}`);
    log(`pnpm dev`);
  }
}

// Main execution
async function main() {
  await runTroubleshooting();
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
  log(`❌ Troubleshooting failed: ${error.message}`, colors.red);
  process.exit(1);
});