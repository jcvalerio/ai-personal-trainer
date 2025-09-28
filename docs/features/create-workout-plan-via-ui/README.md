# Feature: Create Workout Plan via UI

## Problem / Goal
Currently coaches can only create plans through the REST API. We want a guided UI that matches our new plan schema so power users can draft plans without touching raw JSON payloads.

## Primary User Story
> As a coach, I want to create a structured workout plan through the dashboard so that I can immediately assign it to clients without using the API directly.

## Acceptance Criteria
- [ ] User can open the “New plan” dialog from the plans dashboard.
- [ ] Form enforces required fields (name, duration, at least one template reference) with inline validation.
- [ ] Submission calls `/api/workouts/plans` and displays success toast + new plan card.
- [ ] Errors surface a friendly message and keep form state intact.

## Test Plan
- **E2E**: `tests/e2e/create-workout-plan.spec.ts`
- **Unit**: `tests/features/create-plan/*.test.ts` (extended as needed)
- **Seeds**: `prisma/seeds/create-workout-plan.ts` (run via `pnpm tsx prisma/seeds/run.ts create-workout-plan`)

## Metrics / Observability
- Track plan creation count per user, success vs failure rate, and average time to create.

## Open Questions / Dependencies
- Should AI plan generation merge into the same UI flow or remain separate?
- Do we need template selection or freeform entry for workout templates in v1?
- Determine auth guard once Clerk integration lands.

## Release Checklist
- [ ] Docs updated (user guide snippet for plan creation)
- [ ] Feature flag (server-side) to gate UI while backend stabilizes
- [ ] Monitoring dashboard includes plan creation anomalies
