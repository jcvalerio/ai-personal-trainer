# Feature: Create Workout Plan

## Goal
Enable a signed-in user to create a workout plan with structured periodization (macrocycle → templates → schedule) and persist it in the database via a well-defined API contract.

## Acceptance Criteria
- Payload *must* include at least one workout template, macrocycle description, and a weekly schedule.
- Validation errors return `400` with `code: VALIDATION_ERROR`.
- Successful creation returns `201` and echoes the stored plan payload (with ID, timestamps, defaults applied).
- Auth is required via the `x-user-id` header (temporary stub until Clerk integration).

## Test Scope
1. **Schemas** – Zod schema guards required structure (`CreateWorkoutPlanSchema`).
2. **Service** – `WorkoutPlanService.createPlan` persists sanitized data using Prisma.
3. **API Route** – `/api/workouts/plans` POST returns correct status/shape and delegates to the service.
4. **UI List** – `WorkoutPlanList` renders via React Query context; component tests mock fetch responses for success and failure states.

## Pending Enhancements
- Add integration tests once a real DB/test harness is wired up.
- Extend documentation to cover AI plan generation reuse.
- When Clerk is integrated, update auth guard + tests.
- Add loading/error skeletons for `WorkoutPlanList` once design assets exist.
