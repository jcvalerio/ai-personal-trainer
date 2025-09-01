#!/usr/bin/env node

/**
 * Build Environment Script
 * Sets build-time environment variables for version tracking
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getBuildInfo() {
  try {
    // Get current commit hash
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const shortCommit = commit.substring(0, 7);
    
    // Get current branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    
    // Get build timestamp
    const buildTime = new Date().toISOString();
    
    return {
      NEXT_PUBLIC_GIT_COMMIT_SHA: commit,
      NEXT_PUBLIC_GIT_COMMIT_SHORT: shortCommit,
      NEXT_PUBLIC_GIT_BRANCH: branch,
      NEXT_PUBLIC_BUILD_TIME: buildTime,
      NEXT_PUBLIC_BUILD_VERSION: `${shortCommit}-${Date.now()}`
    };
  } catch (error) {
    console.warn('Could not get git info:', error.message);
    return {
      NEXT_PUBLIC_GIT_COMMIT_SHA: 'unknown',
      NEXT_PUBLIC_GIT_COMMIT_SHORT: 'unknown',
      NEXT_PUBLIC_GIT_BRANCH: 'unknown',
      NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
      NEXT_PUBLIC_BUILD_VERSION: `unknown-${Date.now()}`
    };
  }
}

// Generate build info
const buildInfo = getBuildInfo();

console.log('Build Environment Variables:');
console.log(JSON.stringify(buildInfo, null, 2));

// Write to .env.local for local development
const envPath = path.join(process.cwd(), '.env.build');
const envContent = Object.entries(buildInfo)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(envPath, envContent);
console.log(`Build environment variables written to ${envPath}`);

module.exports = buildInfo;