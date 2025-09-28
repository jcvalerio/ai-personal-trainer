#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import process from 'node:process';

interface NeonBranchResult {
  branchId: string;
  database: string;
  connectionString: string;
}

const API_BASE = 'https://console.neon.tech/api/v2';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function neonRequest<T>(path: string, init: RequestInit): Promise<T> {
  const apiKey = requireEnv('NEON_API_KEY');
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authorization: `Bearer ${apiKey}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Neon API error ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

async function createBranch(name: string): Promise<NeonBranchResult> {
  const projectId = requireEnv('NEON_PROJECT_ID');
  const parentBranchId = process.env.NEON_PARENT_BRANCH_ID;
  const databaseName = process.env.NEON_BRANCH_DATABASE ?? `db_${name}`;
  const branchBody: Record<string, unknown> = {
    branch: {
      name,
    },
  };

  if (parentBranchId) {
    branchBody.branch = { ...branchBody.branch, parent_id: parentBranchId };
  }

  const branchResponse = await neonRequest<{ branch: { id: string } }>(
    `/projects/${projectId}/branches`,
    {
      method: 'POST',
      body: JSON.stringify(branchBody),
    }
  );

  const branchId = branchResponse.branch.id;

  await neonRequest(`/projects/${projectId}/branches/${branchId}/databases`, {
    method: 'POST',
    body: JSON.stringify({ database: { name: databaseName } }),
  });

  const endpointResponse = await neonRequest<{ endpoint: { host: string } }>(
    `/projects/${projectId}/endpoints`,
    {
      method: 'POST',
      body: JSON.stringify({ endpoint: { branch_id: branchId, type: 'read_write' } }),
    }
  );

  const host = endpointResponse.endpoint.host;
  const dbUser = process.env.NEON_DB_USER ?? 'neondb';
  const dbPassword = requireEnv('NEON_DB_PASSWORD');
  const connectionString = `postgresql://${dbUser}:${dbPassword}@${host}/${databaseName}`;

  return { branchId, database: databaseName, connectionString };
}

async function deleteBranch(branchId: string) {
  const projectId = requireEnv('NEON_PROJECT_ID');
  await neonRequest(`/projects/${projectId}/branches/${branchId}`, {
    method: 'DELETE',
  });
}

async function runPrismaMigrations(connectionString: string) {
  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  });
}

async function seedDatabase(connectionString: string) {
  const seedScript = process.env.NEON_SEED_COMMAND;
  if (!seedScript) return;

  execSync(seedScript, {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  });
}

async function handleCreate() {
  const name = process.argv[3] ?? `e2e_${Date.now()}`;
  const result = await createBranch(name);
  await runPrismaMigrations(result.connectionString);
  await seedDatabase(result.connectionString);
  process.stdout.write(
    JSON.stringify({ ...result, DATABASE_URL: result.connectionString }, null, 2) + '\n'
  );
}

async function handleDestroy() {
  const branchId = process.argv[3];
  if (!branchId) {
    throw new Error('Usage: pnpm tsx scripts/neon-branch.ts destroy <branchId>');
  }
  await deleteBranch(branchId);
}

async function main() {
  const command = process.argv[2];
  switch (command) {
    case 'create':
      await handleCreate();
      break;
    case 'destroy':
      await handleDestroy();
      break;
    default:
      console.error('Usage: pnpm tsx scripts/neon-branch.ts <create|destroy> [name]');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
