# Feature: View Workout Plan Detail

## Problem / Goal
Coaches can create plans but cannot inspect the structured data inside each plan without poking the API manually. We need a detail view that surfaces the macrocycle structure, schedule, and workout templates so a coach can validate a plan before sharing it with clients.

## Primary User Story
> As a coach, I need to open a workout plan and review its macrocycle, weekly schedule, and templates so I can confirm it matches my programming intent.

## Acceptance Criteria
- [x] Plan cards link to a dedicated detail route (`/workouts/plans/:planId`).
- [x] Detail page renders name, status badge, description fallback, duration, and sessions/week.
- [x] Macrocycle summary shows goal, duration, and the list of phases.
- [x] Weekly schedule section maps each day to rest/workout with template labels.
- [x] Workout templates render with name, category, duration, and primary muscles.
- [x] Invalid or missing plan id returns a not-found message instead of crashing.

## Test Plan
- **E2E**: `tests/e2e/view-workout-plan.spec.ts`
- **Unit**: `tests/features/view-plan/api.test.ts`, `tests/features/view-plan/components.test.tsx`, `tests/features/view-plan/page.test.tsx`
- **Seeds**: Extend `prisma/seeds/create-workout-plan.ts` to create a canonical demo plan consumed by the tests.

## Metrics / Observability
- Track plan detail page views and time-on-page to understand review engagement.
- Emit structured logs when plans fail to load or parse.

## Open Questions / Dependencies
- Future: should we add editing controls inline, or keep the page read-only?
- Should we localize phase labels now or defer until the full i18n pass?

## Release Checklist
- [ ] Update dashboard docs with screenshots of the detail view.
- [ ] Gate any future editing buttons behind a feature flag.
- [ ] Verify telemetry dashboards capture 4xx/5xx rates for the detail API.
