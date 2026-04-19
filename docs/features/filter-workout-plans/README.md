# Feature: Filter Workout Plans

## Problem / Goal
Once the dashboard holds more than a few plans, the current list becomes slow to scan. We already support `status` and `search` query parameters in the plans API, but the UI does not expose them yet. This slice turns existing backend capability into a user-facing discovery workflow.

## Primary User Story
> As a coach, I want to filter and search workout plans from the dashboard so that I can quickly find the plan I need to review or continue.

## Acceptance Criteria
- [x] Coach can filter plans by status from the plans dashboard.
- [x] Coach can search plans by name or description.
- [x] Coach can combine status and search filters.
- [x] Filtered results update without a full page reload.
- [x] A filtered empty state appears when no plans match, with a way to clear filters.

## Test Plan
- **E2E**: `tests/e2e/filter-workout-plans.spec.ts`
- **Unit**: `tests/features/filter-workout-plans/*.test.ts`
- **Seeds**: extend `prisma/seeds/create-workout-plan.ts` or add a small dedicated seed if the matrix becomes noisy

## Metrics / Observability
- Track plans-list filter usage by filter type (`status`, `search`, combined).
- Track zero-result searches to inform future IA improvements.
- Log plans-list API validation or fetch failures for filtered requests.

## Open Questions / Dependencies
- Should search apply on each keystroke, or only on explicit submit? Prefer explicit submit for the first slice to keep behavior deterministic and testable.
- Do we need pagination controls in the same slice? No — defer until the list size actually demands it.
- Should filters be reflected in the URL? Useful, but likely a follow-up after the first working slice.

## Current Implementation Status
- The plans dashboard now exposes a search input and status filter backed by the existing `GET /api/workouts/plans` query parameters.
- The UI supports combined filters, a filtered empty state, and a clear-filters action.
- Unit/component coverage is in place at `tests/features/filter-workout-plans/component.test.tsx` and now passes.
- A Playwright slice exists at `tests/e2e/filter-workout-plans.spec.ts` and now passes.
- The plans-list API now emits lightweight structured logs for filter usage, zero-result requests, and validation/failure cases without logging raw search text.

## Release Checklist
- [x] Docs updated with dashboard filtering examples
- [x] E2E coverage added for status/search/empty-state flows
- [x] Observability reviewed for filtered list failures and zero-result usage
