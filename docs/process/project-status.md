# Project Status

_Last updated: 2026-04-19_

This document is a working status board for the current implementation state of the AI Personal Trainer project.

It is intended to help future work stay aligned with the spec-driven workflow in `CLAUDE.md`:
- read the spec first
- do not read `tests/scenarios/` during implementation
- keep specs, schemas, APIs, and UI behavior in sync

## Repository Health

### Current checks
- `pnpm test` ✅ passes (`18` files, `51` tests)
- `pnpm build` ✅ passes
- `pnpm exec tsc --noEmit` ✅ passes
- `pnpm lint` ✅ passes
- `pnpm test:e2e --grep "Session Management"` ✅ passes
- `pnpm test:e2e --grep "Create Workout Plan via UI|List Plan Sessions"` ✅ passes
- `set -a; source .env.test; set +a; pnpm exec tsx prisma/seeds/run.ts session-management` ✅ reseeds local session-management E2E data
- `set -a; source .env.test; set +a; pnpm test:e2e --grep "Create Workout Plan via UI|View Workout Plan|Session Management"` ✅ passes

### Practical meaning
The repo is now in a **stable, buildable baseline state**. The next work should focus on closing feature gaps rather than repairing tooling and type drift.

## Observability Status

Minimal structured server-side logging is now in place for the verified flows:
- create workout plan via UI
- list plan sessions
- session management

Coverage is implemented in the relevant workout API routes with a shared helper at `lib/utils/observability.ts`.
Documentation for emitted events and captured fields lives in `docs/process/observability.md`.

## Feature Status

| Feature | Spec Source | Status | Notes |
|---|---|---:|---|
| Create workout plan (API + service) | `docs/specs/api-contracts.md` + `docs/features/create-workout-plan/README.md` | Implemented | Unit tests pass. API route exists and the repo is green again. |
| List workout plans | `docs/specs/features/list-workout-plans.md` | Implemented and mobile-validated | Dashboard page and list UI exist. Header/actions, card stacking, and the create-plan dialog were revalidated on a 375px viewport. |
| View workout plan detail | `docs/specs/features/view-workout-plan.md` | Implemented and mobile-validated | Detail page exists and now builds cleanly. Header, schedule, sessions block, and template cards were revalidated on a 375px viewport. |
| Start workout plan | `docs/specs/features/start-workout-plan.md` | Implemented | Start action and session generation exist and build cleanly. |
| List plan sessions | `docs/specs/features/list-plan-sessions.md` | Implemented and verified | Sessions render on the plan detail page, the dedicated spec now exists, and the Playwright slice passes. |
| Create workout plan via UI | `docs/specs/features/create-workout-plan-via-ui.md` | Implemented and verified | Dialog flow works with the current minimal form, and the Playwright slice now matches the real UI behavior. |
| Session management | `docs/specs/features/session-management.md` | Implemented, verified, and mobile-validated | Shared contracts, progress endpoint, lifecycle checks, status/completion UI, dedicated unit tests, and Playwright coverage are all in place. Session detail, in-session editing controls, and the completion dialog were revalidated on a 375px viewport with no horizontal overflow. |

## Active Blockers

### 1. No critical blockers in the currently scoped core flows
The core workout-plan and session flows are now green in unit tests, build/typecheck, and the targeted Playwright slices.

Remaining gaps are follow-up work rather than core implementation blockers:
- the scoped mobile responsiveness review for `/workouts/plans`, `/workouts/plans/[planId]`, and `/workouts/sessions/[sessionId]` is now done; broader responsive review outside those flows is still optional follow-up work
- release checklist items like screenshots, dashboards/alerts, and user-guide docs are still pending
- feature naming/spec organization is improved, but there is still some historical overlap between feature READMEs and spec files that may be worth simplifying later

### Session-management E2E hardening already done
- mutating Playwright tests create fresh sessions instead of sharing a seeded mutable session
- the spec now fails fast with actionable instructions if the session-management seed is missing or incomplete
- form controls used by Playwright are now properly label-associated for stable `getByLabel(...)` selectors
- the reconciled spec now passes against the seeded environment

### Tooling note for future sessions
- Next.js may automatically re-add `.next/types/**/*.ts` to `tsconfig.json` during `pnpm build`
- That is expected in this repo
- If `pnpm exec tsc --noEmit` ever complains about missing `.next/types/*` after a clean checkout or cleanup, run `pnpm build` first to regenerate them

### 2. Tooling follow-up
- ESLint is now configured and green, but `next lint` is deprecated and should be migrated to ESLint CLI later

## Recommended Continuation Order

### Phase 1 — Polish and close follow-up items

1. Add screenshots/user-guide snippets for the now-verified flows
2. Decide whether the new structured logs should be shipped into dashboards/alerts for staging/production
3. Consider a broader responsive review outside the currently scoped workout pages if more mobile polish is needed
4. Consider migrating from `next lint` to ESLint CLI before Next.js 16

## Pending Follow-ups After Verified Core Flows

These are valid next items now that the currently scoped core flows are verified:
- update docs with screenshots/user guide snippets
- decide on dashboarding/alerting or log shipping beyond the new structured logs
- Clerk auth migration
- AI plan generation flow expansion
- filters/search for plans and sessions
- loading skeletons and polish

## Suggested Definition of Done for the next milestone

Use this as the next checkpoint before taking on additional scope:

- `pnpm test` passes
- `pnpm build` passes
- `pnpm exec tsc --noEmit` passes
- `pnpm lint` passes
- session-management API matches `docs/specs/api-contracts.md`
- session-management UI matches `docs/specs/features/session-management.md`
- create-plan-via-ui and list-plan-sessions E2E slices pass
- no spec/schema drift for touched session types

## Immediate Recommendation

**Do not expand scope yet.**

The highest-leverage next step is to close the remaining polish/documentation follow-ups from this stable baseline: screenshots/docs and deciding whether the new structured logs need dashboarding/alerting before taking on additional product scope. The scoped mobile validation for the workout list/detail/session pages is now complete.
