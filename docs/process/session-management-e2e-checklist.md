# Session Management E2E Run Checklist

Use this checklist before and during Playwright validation for session management.

## Preconditions

- `.env.test` exists and points to a valid test database
- dependencies are installed
- Prisma client is generated
- the app can boot locally with the current env

## Seed setup

```bash
set -a; source .env.test; set +a
pnpm exec tsx prisma/seeds/run.ts session-management
```

Expected result:
- seed completes successfully
- seeded plan id: `session-test-plan-0001`
- seeded sessions:
  - `session-test-0001` (draft)
  - `session-test-0002` (active)
  - `session-test-0003` (completed)

## Recommended verification order

### 1. Fast repo checks
```bash
pnpm test
pnpm lint
pnpm build
```

### 2. Confirm the Playwright spec is discoverable
```bash
pnpm exec playwright test tests/e2e/session-management.spec.ts --list
```

### 3. Run only the session-management slice
```bash
set -a; source .env.test; set +a
pnpm test:e2e --grep "Session Management"
```

## What the current spec expects

### Seeded read-only flows
- the seeded draft session detail page renders correctly
- the seeded plan detail page shows draft/active/completed session badges and completion percentages
- the seeded draft session page is usable on a mobile viewport

### Fresh per-test mutating flows
The spec creates fresh sessions through the API for mutation-heavy tests so they do not interfere with each other when Playwright runs in parallel.

These flows verify:
- start a draft session
- update exercise progress
- complete a session with feedback

## Common failure modes

### Missing seeded plan or sessions
The spec now fails fast with a setup message.

Recovery:
```bash
set -a; source .env.test; set +a
pnpm exec tsx prisma/seeds/run.ts session-management
```

### TypeScript errors mentioning `.next/types`
Next.js may re-add `.next/types/**/*.ts` to `tsconfig.json` during build.

Recovery:
```bash
pnpm build
pnpm exec tsc --noEmit
```

### Selector failures in dialogs/forms
The current UI has label associations for Playwright `getByLabel(...)` selectors. If these fail again, check that:
- the dialog is open
- the session is in the correct lifecycle state
- the expected form is the currently visible one

## Definition of done for session-management E2E

- seed succeeds
- `pnpm test:e2e --grep "Session Management"` passes
- no flaky retries required
- docs remain aligned with the tested UI behavior
