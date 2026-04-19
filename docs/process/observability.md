# Verified Flow Observability

_Last updated: 2026-04-19_

This project now uses minimal structured server-side logging for the currently verified workout flows:

- create and list workout plans
- filter workout plans
- list plan sessions
- session management

## Approach

Observability is intentionally lightweight:

- no new vendor or background worker
- no schema or API contract changes
- structured JSON logs written from the relevant API routes
- consistent event naming and common request metadata

Implementation lives in `lib/utils/observability.ts`.

## Common fields on every log

Each emitted log includes:

- `timestamp`
- `level`
- `event`
- `method`
- `route`
- `durationMs`

When available, logs also include resource identifiers and safe outcome metadata such as:

- `userId`
- `planId`
- `sessionId`
- `status`
- `completionPercentage`
- `sessionCount`
- filter metadata such as `filterType`, `statusFilter`, `searchTermLength`, and `zeroResults`
- counts of updated exercises
- validation issue counts

## Events captured

| Flow | Route | Success event | Warning/error events |
|---|---|---|---|
| List / filter workout plans | `GET /api/workouts/plans` | `workout_plan.list.succeeded` | `workout_plan.list.unauthorized`, `workout_plan.list.validation_failed`, `workout_plan.list.failed` |
| Create workout plan via UI | `POST /api/workouts/plans` | `workout_plan.create.succeeded` | `workout_plan.create.unauthorized`, `workout_plan.create.validation_failed`, `workout_plan.create.failed` |
| Start workout plan | `POST /api/workouts/plans/:planId/start` | `workout_plan.start.succeeded` | `workout_plan.start.unauthorized`, `workout_plan.start.validation_failed`, `workout_plan.start.not_found`, `workout_plan.start.failed` |
| List plan sessions | `GET /api/workouts/plans/:planId/sessions` | `workout_plan.sessions.list.succeeded` | `workout_plan.sessions.list.unauthorized`, `workout_plan.sessions.list.not_found`, `workout_plan.sessions.list.failed` |
| View session detail | `GET /api/workouts/sessions/:sessionId` | `workout_session.detail.succeeded` | `workout_session.detail.unauthorized`, `workout_session.detail.not_found`, `workout_session.detail.failed` |
| Start session | `POST /api/workouts/sessions/:sessionId/start` | `workout_session.start.succeeded` | `workout_session.start.unauthorized`, `workout_session.start.not_found`, `workout_session.start.invalid_state`, `workout_session.start.failed` |
| Update session progress | `PUT /api/workouts/sessions/:sessionId` | `workout_session.progress.updated` | `workout_session.progress.unauthorized`, `workout_session.progress.not_found`, `workout_session.progress.validation_failed`, `workout_session.progress.invalid_state`, `workout_session.progress.failed` |
| Complete session | `POST /api/workouts/sessions/:sessionId/complete` | `workout_session.complete.succeeded` | `workout_session.complete.unauthorized`, `workout_session.complete.not_found`, `workout_session.complete.validation_failed`, `workout_session.complete.invalid_state`, `workout_session.complete.failed` |

## Data intentionally not captured

To keep logging minimal and lower-risk, the logs do **not** include free-text user content such as:

- workout plan descriptions
- search query text from plan filters
- session notes text
- exercise notes text

Instead, logs only record booleans like `hasDescription` or `hasNotes` where useful.

## Current limits

This is request-level observability only. It does not yet provide:

- dashboards or alerts
- distributed tracing
- request correlation IDs
- persisted metrics series
- accurate session duration from session start to completion

Those can be added later if the spec or operational needs require them.
