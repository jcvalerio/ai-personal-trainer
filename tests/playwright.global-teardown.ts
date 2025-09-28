import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const STATE_FILE = join(process.cwd(), '.playwright', 'neon-branch.json');

export default async function globalTeardown() {
  if (!process.env.NEON_API_KEY) {
    return;
  }

  if (!existsSync(STATE_FILE)) {
    return;
  }

  const payload = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as {
    branchId: string;
    endpointId?: string;
  };

  const runtime = await import(pathToFileURL(join(process.cwd(), 'scripts', 'neon-runtime.ts')).href);
  await runtime.destroyNeonBranch({ branchId: payload.branchId, endpointId: payload.endpointId });
  unlinkSync(STATE_FILE);
}
