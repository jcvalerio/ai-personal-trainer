# Feature: Start Workout Plan

## Problem / Goal
Coaches can create and review plans, but there is no way to activate a plan and generate its scheduled sessions from the UI. We need a simple "Start plan" action that calls the backend start endpoint so a plan moves into the active state and sessions are created.

## Primary User Story
> As a coach, I want to start a draft workout plan so that the weekly sessions are scheduled for my client.

## Acceptance Criteria
- [x] Detail page shows a "Start plan" button when the plan is in draft status.
- [x] Starting a plan calls `POST /api/workouts/plans/:planId/start` and surfaces success or error feedback.
- [x] On success the UI updates to show the plan as `Active` and disables the start button.
- [x] API returns 400 for invalid payloads and 404 for missing plans.
- [x] Starting a plan generates workout sessions persisted in the database.

## Test Plan
- **E2E**: `tests/e2e/start-workout-plan.spec.ts`
- **Unit**: `tests/features/start-plan/api.test.ts`, `tests/features/start-plan/service.test.ts`, `tests/features/start-plan/components.test.tsx`
- **Seeds**: Extend `prisma/seeds/create-workout-plan.ts` to reset sessions between runs.

## Metrics / Observability
- Capture plan activation counts per user and session generation failures via structured logs.

## Open Questions / Dependencies
- Should we allow selecting a custom start date in the first iteration? (Defaulting to today for now.)
- Do we need to prevent starting already-active plans on the backend or front end only?

## Release Checklist
- [ ] Update user guide with the new "Start plan" flow.
- [x] Ensure Prisma migration + seed scripts clean up generated sessions for repeatable tests.
- [ ] Add monitoring alert for start-plan failures.
