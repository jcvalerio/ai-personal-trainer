import type { FullConfig } from '@playwright/test';
import { join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const STATE_DIR = join(process.cwd(), '.playwright');
const STATE_FILE = join(STATE_DIR, 'neon-branch.json');

export default async function globalSetup(_: FullConfig) {
  if (process.env.DATABASE_URL) {
    return;
  }
  if (!process.env.NEON_API_KEY) {
    console.warn('[playwright] NEON_API_KEY not set – skipping Neon branch provisioning');
    return;
  }

  const runtime = await import(pathToFileURL(join(process.cwd(), 'scripts', 'neon-runtime.ts')).href);
  const branch = await runtime.provisionNeonBranch();
  process.env.DATABASE_URL = branch.connectionString;

  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }

  writeFileSync(STATE_FILE, JSON.stringify(branch, null, 2));
}
