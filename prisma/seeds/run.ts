import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

async function main() {
  const feature = process.argv[2];
  if (!feature) {
    console.error('Usage: pnpm tsx prisma/seeds/run.ts <feature-name>');
    process.exit(1);
  }

  const seedPath = join(process.cwd(), 'prisma', 'seeds', `${feature}.ts`);
  const seedModule = await import(pathToFileURL(seedPath).href).catch((error) => {
    throw new Error(`Failed to import seed file at ${seedPath}: ${error instanceof Error ? error.message : String(error)}`);
  });

  if (typeof seedModule.seed !== 'function') {
    throw new Error(`Seed file ${seedPath} must export a function named 'seed'.`);
  }

  await seedModule.seed();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
