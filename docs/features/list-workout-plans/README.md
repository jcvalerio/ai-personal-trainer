# Feature: List Workout Plans

## Goal
Provide a dashboard view where coaches can browse AI-generated or manual workout plans, seeing key metadata at a glance.

## Acceptance Criteria
- Page headline and helper text describe the plan workspace context.
- Actions expose entry points for future template library and plan creation flows.
- Plans render in cards showing name, description fallback, status, duration, and sessions/week.
- Empty, loading, and error states are visible and styled for usability.

## Test Scope
1. **Page** – Server component renders headings, actions, and the plan list slot (`tests/features/create-plan/plans-page.test.tsx`).
2. **Component** – `WorkoutPlanList` covers loading/error/empty states with React Query mocked fetches.

## Pending Enhancements
- Introduce skeleton placeholders instead of plain loading text.
- Revisit styling as design system evolves; verified against `react@19.1.1`.
- Search/status filters are now covered by the dedicated slice in `docs/specs/features/filter-workout-plans.md` and `docs/features/filter-workout-plans/README.md`.
