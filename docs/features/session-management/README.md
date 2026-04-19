# Feature: Session Management

## Problem / Goal
Coaches can view sessions that were generated from plans, but cannot interact with individual sessions to track progress, log exercises, or mark completion. We need a comprehensive session management UI that allows coaches to start, track, and complete workout sessions with their clients, capturing actual performance data versus planned targets.

## Primary User Story
> As a coach, I want to manage individual workout sessions so that I can track client progress, log actual performance, and maintain a complete workout history.

## Acceptance Criteria
- [x] Coach can view session detail page with all exercises organized by phase (warm-up, main, cool-down)
- [x] Session detail shows planned sets, reps, weight, and rest periods for each exercise
- [x] Coach can start a session which changes status from 'draft' to 'active'
- [x] Coach can mark individual exercises as completed with actual performance data
- [x] Coach can complete a session with completion percentage, effort rating, and notes
- [x] Session progress is automatically calculated based on completed exercises
- [x] Sessions list in plan detail shows status badges and completion percentage
- [ ] Session page is mobile-responsive for use during training

## Test Plan
- **E2E**: `tests/e2e/session-management.spec.ts`
- **Unit**: `tests/features/session-management/api.test.ts`, `tests/features/session-management/service.test.ts`, `tests/features/session-management/components.test.tsx`
- **Seeds**: `prisma/seeds/session-management.ts`

## Current Implementation Status
- Shared session progress contracts now exist in `lib/shared/schemas/workout.ts`
- `PUT /api/workouts/sessions/:sessionId` is implemented
- Session lifecycle is hardened so only valid transitions are accepted
- Plan detail now shows session status badges plus completion percentages
- Unit tests are in place and the repo is currently green for `test`, `build`, `tsc`, and `lint`
- `tests/e2e/session-management.spec.ts` has been reconciled with the current UI and hardened to avoid shared-state interference by creating per-test sessions through the API where needed
- The Playwright spec now fails fast with an explicit seed/setup message if the session-management seed data is missing
- The Playwright spec lists cleanly via `pnpm exec playwright test tests/e2e/session-management.spec.ts --list`
- `pnpm test:e2e --grep "Session Management"` now passes against the seeded `.env.test` environment
- Mobile-specific validation still needs deeper follow-up beyond the current viewport assertion

## E2E Notes For Future Sessions
- Seed dependency: `prisma/seeds/session-management.ts`
- The E2E spec assumes the seeded plan id `session-test-plan-0001` exists
- The spec uses seeded sessions for read-only assertions and creates fresh sessions through `POST /api/workouts/plans/:planId/sessions` for mutating flows
- This design is intentional so Playwright tests can run in parallel without mutating the same session records
- The spec now guards against the most common failure mode: missing seeded plan/sessions for `session-test-plan-0001`
- Recommended command once env is ready:

```bash
set -a; source .env.test; set +a
pnpm exec tsx prisma/seeds/run.ts session-management
pnpm test:e2e --grep "Session Management"
```

## Metrics / Observability
- Track session start/complete rates per coach
- Monitor average session completion percentage
- Log session duration (time between start and complete)
- Track API latency for session operations
- Monitor error rates on session updates

## Open Questions / Dependencies
- Should we implement auto-save for exercise updates to prevent data loss?
- Do we need offline capability for gym environments with poor connectivity?
- Should exercise history be visible during the session (previous performance)?
- How should we handle session modifications after completion?
- Should we add timer functionality for rest periods?

## Release Checklist
- [ ] Documentation updated with session management workflow
- [ ] Performance testing completed for mobile devices
- [ ] Monitoring dashboard configured for session metrics
- [ ] User guide created for session tracking features
- [ ] Data retention policy defined for completed sessions