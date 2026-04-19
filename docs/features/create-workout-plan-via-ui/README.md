# Feature: Create Workout Plan via UI

## Problem / Goal
Currently coaches can only create plans through the REST API. We want a guided UI that matches our new plan schema so power users can draft plans without touching raw JSON payloads.

## Primary User Story
> As a coach, I want to create a structured workout plan through the dashboard so that I can immediately assign it to clients without using the API directly.

## Acceptance Criteria
- [x] User can open the “New plan” dialog from the plans dashboard.
- [x] Form enforces required fields for the current minimal flow (name, duration, sessions per week) with inline validation.
- [x] Submission calls `/api/workouts/plans` and displays a success message; the new draft plan appears in the plans list.
- [x] Errors surface a friendly message and keep form state intact.

## Test Plan
- **E2E**: `tests/e2e/create-workout-plan.spec.ts`
- **Unit**: `tests/features/create-plan/*.test.ts` (extended as needed)
- **Seeds**: `prisma/seeds/create-workout-plan.ts` (run via `pnpm tsx prisma/seeds/run.ts create-workout-plan`)

## Metrics / Observability
- Track plan creation count per user, success vs failure rate, and average time to create.

## Open Questions / Dependencies
- Should AI plan generation merge into the same UI flow or remain separate?
- Do we keep the current minimal form long-term, or later expose advanced template/schedule controls?
- Determine auth guard once Clerk integration lands.

## Current Implementation Status
- The dashboard includes a working “New plan” dialog backed by `POST /api/workouts/plans`
- The current UI intentionally uses a minimal form; the server auto-generates the full plan structure
- The Playwright spec has been reconciled with the actual UI flow and now checks for the created draft plan after a refresh
- `pnpm test:e2e --grep "Create Workout Plan via UI"` passes in the seeded `.env.test` environment

## Release Checklist
- [ ] Docs updated (user guide snippet for plan creation)
- [ ] Decide whether a feature flag is still needed now that the UI flow is active
- [ ] Monitoring dashboard includes plan creation anomalies
