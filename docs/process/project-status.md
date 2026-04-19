# Project Status

_Last updated: 2026-04-19_

This document is a working status board for the current implementation state of the AI Personal Trainer project.

It is intended to help future work stay aligned with the spec-driven workflow in `CLAUDE.md`:
- read the spec first
- do not read `tests/scenarios/` during implementation
- keep specs, schemas, APIs, and UI behavior in sync

## Repository Health

### Current checks
- `pnpm test` ✅ passes (`19` files, `57` tests)
- `pnpm build` ✅ passes
- `pnpm exec tsc --noEmit` ✅ passes
- `pnpm lint` ✅ passes
- `pnpm test:e2e --grep "Session Management"` ✅ passes
- `pnpm test:e2e --grep "Create Workout Plan via UI|List Plan Sessions"` ✅ passes
- `pnpm exec vitest --run tests/features/filter-workout-plans/component.test.tsx tests/features/create-plan/plan-list.component.test.tsx tests/features/create-plan/plans-page.test.tsx` ✅ passes
- `set -a; source .env.test; set +a; pnpm exec tsx prisma/seeds/run.ts session-management` ✅ reseeds local session-management E2E data
- `set -a; source .env.test; set +a; pnpm exec tsx prisma/seeds/run.ts create-workout-plan` ✅ reseeds local create-workout-plan/filter-workout-plans E2E data
- `set -a; source .env.test; set +a; pnpm test:e2e --grep "Create Workout Plan via UI|View Workout Plan|Session Management"` ✅ passes
- `set -a; source .env.test; set +a; pnpm test:e2e --grep "Filter Workout Plans"` ✅ passes

### Practical meaning
The repo is now in a **stable, buildable baseline state**. The next work should focus on closing feature gaps rather than repairing tooling and type drift.

## Observability Status

Minimal structured server-side logging is now in place for the verified flows:
- create and list workout plans
- filter workout plans
- list plan sessions
- session management

Coverage is implemented in the relevant workout API routes with a shared helper at `lib/utils/observability.ts`.
The plans list route now logs filter usage metadata (`filterType`, `statusFilter`, `searchTermLength`, `zeroResults`) without recording raw search text.
Documentation for emitted events and captured fields lives in `docs/process/observability.md`.

## Feature Status

| Feature | Spec Source | Status | Notes |
|---|---|---:|---|
| Create workout plan (API + service) | `docs/specs/api-contracts.md` + `docs/features/create-workout-plan/README.md` | Implemented | Unit tests pass. API route exists and the repo is green again. |
| List workout plans | `docs/specs/features/list-workout-plans.md` | Implemented and mobile-validated | Dashboard page and list UI exist. Header/actions, card stacking, and the create-plan dialog were revalidated on a 375px viewport. Base list behavior is separated from follow-up discovery controls. |
| Filter workout plans | `docs/specs/features/filter-workout-plans.md` | Implemented and verified | The dashboard now exposes `status` and `search` controls using the existing API/service/hook support. Targeted component tests and the Playwright slice both pass, and the plans list API now logs filter usage plus zero-result requests. |
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

### Phase 1 — Next small feature slice

1. Add screenshots/user-guide snippets for the now-verified flows, including the new plan-filtering controls
2. Decide whether the new structured logs should be shipped into dashboards/alerts for staging/production
3. Consider migrating from `next lint` to ESLint CLI before Next.js 16
4. If product discovery needs grow, decide whether plans-list observability should graduate from logs to dashboards/alerts

### Why this is next

This is the best leverage-to-risk tradeoff after the currently verified flows:
- **High leverage**: directly improves plan discovery on the main dashboard
- **Low implementation risk**: backend support already exists in the API route, service, and React Query hook
- **Spec-first ready**: the slice is now documented in `docs/specs/features/filter-workout-plans.md`
- **Contained scope**: no schema migration, no new entity type, no lifecycle/state-machine expansion

### Tradeoffs considered

- **Start-plan confirmation** would be smaller, but it is a narrow compliance/polish fix rather than a discovery improvement across the main dashboard flow.
- **Pagination UI** is adjacent, but it is less urgent until the list actually becomes longer in seeded and real user data.
- **Auth migration** and **AI generation expansion** are higher-impact projects, but they are materially larger than the next safe slice.

## Pending Follow-ups After Verified Core Flows

These are valid next items now that the currently scoped core flows are verified:
- update docs with screenshots/user guide snippets
- decide on dashboarding/alerting or log shipping beyond the new structured logs
- Clerk auth migration
- AI plan generation flow expansion
- filters/search for sessions
- loading skeletons and polish

## Suggested Definition of Done for the next milestone

Use this as the next checkpoint before taking on additional scope:

- `pnpm test` passes
- `pnpm build` passes
- `pnpm exec tsc --noEmit` passes
- `pnpm lint` passes
- plans dashboard UI exposes `search` and `status` controls matching `docs/specs/features/filter-workout-plans.md`
- filtered empty state is distinct from the baseline no-plans empty state
- existing `GET /api/workouts/plans` contract remains unchanged and green
- new unit/component coverage exists for status filtering, search, combined filters, and clear/reset behavior
- new E2E slice for filter-workout-plans passes alongside the currently verified flows
- repository dependencies are installed locally so the above checks can actually be executed
- `filter-workout-plans` targeted component tests and Playwright coverage pass

## Immediate Recommendation

**The workout-plan filtering/search slice is verified and now has lightweight request-level observability.**

The immediate next step is to close adjacent polish and operational follow-ups: screenshots/user-guide snippets, deciding whether the new logs should be promoted into dashboards/alerts, and then choosing the next small dashboard slice without broadening scope too quickly.
