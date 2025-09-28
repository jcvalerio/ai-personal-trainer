import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { dirname } from 'node:path';

export interface NeonProvision {
  branchId: string;
  endpointId: string;
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
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authorization: `Bearer ${apiKey}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Neon API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

async function createBranchRecord(name: string) {
  const projectId = requireEnv('NEON_PROJECT_ID');
  const parentBranchId = process.env.NEON_PARENT_BRANCH_ID;
  const branchBody: Record<string, unknown> = { branch: { name } };

  if (parentBranchId) {
    branchBody.branch = { ...branchBody.branch, parent_id: parentBranchId };
  }

  const result = await neonRequest<{ branch: { id: string } }>(
    `/projects/${projectId}/branches`,
    {
      method: 'POST',
      body: JSON.stringify(branchBody),
    }
  );

  return { projectId, branchId: result.branch.id };
}

async function createDatabase(projectId: string, branchId: string, database: string) {
  await neonRequest(`/projects/${projectId}/branches/${branchId}/databases`, {
    method: 'POST',
    body: JSON.stringify({ database: { name: database } }),
  });
}

async function createEndpoint(projectId: string, branchId: string) {
  const result = await neonRequest<{ endpoint: { id: string; host: string } }>(
    `/projects/${projectId}/endpoints`,
    {
      method: 'POST',
      body: JSON.stringify({ endpoint: { branch_id: branchId, type: 'read_write' } }),
    }
  );
  return result.endpoint;
}

function runPrismaMigrations(connectionString: string) {
  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  });
}

function seedDatabase(connectionString: string) {
  const seedCommand = process.env.NEON_SEED_COMMAND;
  if (!seedCommand) return;
  execSync(seedCommand, {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  });
}

export async function provisionNeonBranch(options: { name?: string } = {}): Promise<NeonProvision> {
  const name = options.name ?? `e2e_${Date.now()}`;
  const databaseName = process.env.NEON_BRANCH_DATABASE ?? `db_${name}`;
  const dbUser = process.env.NEON_DB_USER ?? 'neondb';
  const dbPassword = requireEnv('NEON_DB_PASSWORD');

  const { projectId, branchId } = await createBranchRecord(name);
  await createDatabase(projectId, branchId, databaseName);
  const endpoint = await createEndpoint(projectId, branchId);

  const connectionString = `postgresql://${dbUser}:${dbPassword}@${endpoint.host}/${databaseName}`;

  runPrismaMigrations(connectionString);
  seedDatabase(connectionString);

  return {
    branchId,
    endpointId: endpoint.id,
    database: databaseName,
    connectionString,
  };
}

export async function destroyNeonBranch(context: { branchId: string; endpointId?: string }) {
  const projectId = requireEnv('NEON_PROJECT_ID');
  const { branchId, endpointId } = context;

  if (endpointId) {
    await neonRequest(`/projects/${projectId}/endpoints/${endpointId}`, {
      method: 'DELETE',
    });
  }

  await neonRequest(`/projects/${projectId}/branches/${branchId}`, {
    method: 'DELETE',
  });
}

export function writeBranchState(filePath: string, payload: NeonProvision) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(payload, null, 2));
}
