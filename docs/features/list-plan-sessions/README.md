# Feature: List Plan Sessions

## Problem / Goal
After activating a plan, coaches need to see the generated workout sessions to monitor scheduling and jump into execution. We want the plan detail page to surface the upcoming sessions, including scheduled date, template name, and status.

## Primary User Story
> As a coach, I want to review the sessions that were generated for my plan so I can confirm the schedule looks correct before sharing it with a client.

## Acceptance Criteria
- [x] When a plan has generated sessions, the detail view shows a sessions section with date, name, and status.
- [x] If no sessions exist, an empty-state message (with hint to start the plan) is displayed.
- [x] Sessions are returned by `GET /api/workouts/plans/:planId/sessions` and sorted by scheduled date.
- [x] API returns 404 when the plan is missing or does not belong to the user.
- [x] Sessions list updates automatically after starting a plan without a full page reload.

## Test Plan
- **E2E**: `tests/e2e/list-plan-sessions.spec.ts`
- **Unit**: `tests/features/list-sessions/api.test.ts`, `tests/features/list-sessions/service.test.ts`, `tests/features/list-sessions/components.test.tsx`
- **Seeds**: Flow uses newly created plans in E2E; no dedicated seed is required for the core happy paths.

## Current Implementation Status
- The sessions section is implemented on the plan detail page
- The dedicated spec now exists at `docs/specs/features/list-plan-sessions.md`
- The Playwright slice for list-plan-sessions is reconciled with the current UI and passes
- Generated sessions are currently expected to appear with initial status `draft` after a plan is started
- `pnpm test:e2e --grep "List Plan Sessions"` passes in the seeded `.env.test` environment

## Metrics / Observability
- Track count of plans with active sessions and detect failed session fetches via structured logs.

## Open Questions / Dependencies
- Should we paginate sessions for multi-week plans? (Out of scope for the first iteration.)
- Do we need filters for completed vs upcoming sessions? (Not yet.)

## Release Checklist
- [ ] Update docs with screenshots of the sessions list.
- [ ] Ensure seeds validate session ordering.
- [ ] Add monitoring for API latency / errors on the sessions endpoint.
