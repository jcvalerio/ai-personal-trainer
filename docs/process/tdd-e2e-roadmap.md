# TDD + E2E Roadmap

This document captures the workflow we will follow for every net-new capability. It keeps product intent, tests, and implementation aligned so we can iterate with confidence.

## 1. Write the PRD slice first
- Create `docs/features/<feature>/README.md` (copy from `_template` once it exists).
- Capture:
  - **Problem / Goal** – why the feature matters.
  - **Primary user story** – written from the user’s perspective.
  - **Acceptance criteria** – bullet list that will map 1:1 with tests.
  - **Open questions / dependencies** – unblockers to resolve before merging.
  - **Success metrics** – optional, but document how we will know it works in prod.

## 2. Derive the Playwright scenario(s)
- For every acceptance criterion, write an end-to-end flow under `tests/e2e/<feature>.spec.ts`.
- Each flow documents:
  - **Seed data** the test expects (and the script that loads it).
  - **User journey** (navigation, actions, expected UI state).
  - **Assertions** mirroring the acceptance criterion language.
- Commit the failing test (red) before writing production code.

## 3. Spin up an isolated Neon branch per test run
- Use `scripts/neon-branch.ts` (see below) from Playwright `globalSetup`/`globalTeardown`.
- Flow:
  1. Create a new branch off the canonical parent (`main` by default).
  2. Run `pnpm prisma migrate deploy` against the branch.
  3. Seed the branch with scenario data (`prisma/seeds/<feature>.ts`) via `NEON_SEED_COMMAND="pnpm tsx prisma/seeds/run.ts <feature>"`.
  4. Expose `process.env.DATABASE_URL` to Playwright via `globalSetup`.
  5. Drop the branch (or truncate tables) in `globalTeardown`.
- If tests mutate heavily, prefer a branch per spec file to keep isolation crisp.

## 4. Implement via Red → Green → Refactor
1. **Red** – Run Playwright + Vitest and see the new spec fail. Document failure in PR.
2. **Green** –
   - Add Zod schema / type changes.
   - Extend Prisma service + API route using unit tests (`tests/features/**`).
   - Build the UI slice (React Query hooks + components) with component tests.
   - Re-run Playwright to ensure it now passes.
3. **Refactor** – Clean up duplication, add inline docs, update PRD README with test coverage and any follow-up tasks.

## 5. CI pipeline expectations (future)
- Matrix job for `pnpm vitest --run`.
- Playwright job that provisions a Neon branch via service account key.
- Cache Prisma client artifacts to avoid `prisma generate` hangs.

## Initial TODOs
- [x] Implement Neon branch helper in `scripts/neon-branch.ts`.
- [x] Wire Playwright `globalSetup`/`globalTeardown` to use the helper.
- [x] Create feature README template at `docs/features/_template/README.md`.
- [x] Add seed runner helper (`pnpm tsx prisma/seeds/run.ts <feature>`).
- [x] First feature candidate: “Create workout plan via UI” – draft PRD + tests.

Keeping this playbook updated as we iterate will let future sessions spin up quickly and guarantees each feature is grounded in a failing test first.
