# API Contracts

Source of truth for all HTTP API endpoints. Frontend and backend agents MUST implement exactly these contracts.

## Conventions

- **Base URL**: `/api/workouts`
- **Auth**: `x-user-id` header (required on all endpoints). Returns 401 if missing.
- **Content-Type**: `application/json`
- **Response envelope**: All responses use `{ success: boolean, data?: T, error?: string, code?: string, details?: unknown }`
- **Error codes**: `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`
- **Ownership**: All resources are scoped to the authenticated user. Accessing another user's resource returns 404.

---

## Plans

### `GET /api/workouts/plans`

List workout plans for the authenticated user.

**Query Parameters**:

| Param    | Type           | Default | Constraints        |
|----------|----------------|---------|--------------------|
| `page`   | number         | 1       | min 1              |
| `limit`  | number         | 10      | min 1, max 100     |
| `status` | WorkoutStatus? | —       | optional filter     |
| `search` | string?        | —       | searches name, description |

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [WorkoutPlan],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### `POST /api/workouts/plans`

Create a new workout plan from a simplified form.

**Request Body** (`PlanFormSchema`):

| Field            | Type    | Required | Constraints           |
|------------------|---------|----------|-----------------------|
| `name`           | string  | yes      | min 1 char            |
| `durationWeeks`  | number  | yes      | 4–52, coerced         |
| `sessionsPerWeek`| number  | yes      | 1–7, coerced          |
| `description`    | string  | no       |                       |

**Behavior**: The server uses `buildPlanFromForm()` to expand form values into a full `CreateWorkoutPlan` with auto-generated macrocycle, mesocycles, microcycles, templates, and schedule.

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "workoutPlan": WorkoutPlan
  }
}
```

**Error Response** (400):

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [ZodIssue]
}
```

---

### `GET /api/workouts/plans/:planId`

Get a single workout plan by ID.

**Path Parameters**: `planId` — UUID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "workoutPlan": WorkoutPlan
  }
}
```

**Error Response** (404):

```json
{
  "success": false,
  "error": "Plan not found",
  "code": "NOT_FOUND"
}
```

---

### `POST /api/workouts/plans/:planId/start`

Activate a plan and generate workout sessions from its schedule.

**Path Parameters**: `planId` — UUID

**Request Body**:

| Field       | Type    | Required | Constraints           |
|-------------|---------|----------|-----------------------|
| `startDate` | string  | no       | ISO 8601 datetime     |

**Behavior**:
1. Sets plan status to `active`
2. Sets `startedAt` to provided date or now
3. Generates `WorkoutSession` records from `plan.schedule.weeklySchedule` for the first week
4. Each non-rest day in the schedule produces one session with `scheduledDate` set to the corresponding day of the start week

**Preconditions**: Plan must exist and belong to the user.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "workoutPlan": WorkoutPlan
  }
}
```

---

### `GET /api/workouts/plans/:planId/sessions`

List all sessions for a plan.

**Path Parameters**: `planId` — UUID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "sessions": [WorkoutSession]
  }
}
```

**Error Response** (404): Plan not found.

---

### `POST /api/workouts/plans/:planId/sessions`

Create a new session within a plan.

**Path Parameters**: `planId` — UUID

**Request Body**: `CreateWorkoutSessionSchema` (see Data Model).

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "workoutSession": WorkoutSession
  }
}
```

---

## Sessions

### `GET /api/workouts/sessions/:sessionId`

Get a single workout session.

**Path Parameters**: `sessionId` — UUID

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "workoutSession": WorkoutSession
  }
}
```

**Error Response** (404): Session not found.

---

### `PUT /api/workouts/sessions/:sessionId`

Update session progress (log exercise data during workout).

**Path Parameters**: `sessionId` — UUID

**Request Body** (`UpdateSessionProgressSchema`):

| Field                  | Type                      | Required |
|------------------------|---------------------------|----------|
| `warmUpExercises`      | UpdateSessionExercise[]   | no       |
| `mainExercises`        | UpdateSessionExercise[]   | no       |
| `coolDownExercises`    | UpdateSessionExercise[]   | no       |
| `completionPercentage` | number (0–100)            | no       |
| `notes`                | string                    | no       |

**`UpdateSessionExercise`**:

| Field                   | Type    | Required |
|-------------------------|---------|----------|
| `exerciseId`            | UUID    | yes      |
| `actualSets`            | number  | no       |
| `actualReps`            | number  | no       |
| `actualWeightKg`        | number  | no       |
| `actualDurationSeconds` | number  | no       |
| `isCompleted`           | boolean | yes      |
| `exerciseNotes`         | string  | no       |

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "workoutSession": WorkoutSession
  }
}
```

---

### `POST /api/workouts/sessions/:sessionId/start`

Start a workout session (transition from draft to active).

**Path Parameters**: `sessionId` — UUID

**Request Body**: None required.

**Behavior**: Sets session status to `active`.

**Preconditions**: Session must exist and belong to the user.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "workoutSession": WorkoutSession
  }
}
```

---

### `POST /api/workouts/sessions/:sessionId/complete`

Complete a workout session.

**Path Parameters**: `sessionId` — UUID

**Request Body**:

| Field                  | Type    | Required | Constraints     |
|------------------------|---------|----------|-----------------|
| `completionPercentage` | number  | no       | 0–100           |
| `notes`                | string  | no       | max 2000 chars  |
| `effortRating`         | number  | no       | 1–10            |
| `energyLevelBefore`    | number  | no       | 1–10            |
| `energyLevelAfter`     | number  | no       | 1–10            |

**Behavior**: Sets session status to `completed`. Records completion metadata.

**Preconditions**: Session must exist and belong to the user.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "workoutSession": WorkoutSession
  }
}
```

---

## Shared Types Reference

See `docs/specs/data-model.md` for full type definitions of `WorkoutPlan`, `WorkoutSession`, `WorkoutStatus`, `FitnessLevel`, etc.

See `lib/shared/schemas/workout.ts` and `lib/shared/schemas/common.ts` for the executable Zod implementations.

---

## Status Codes Summary

| Code | When                                           |
|------|------------------------------------------------|
| 200  | Successful read or update                      |
| 201  | Successful creation                            |
| 400  | Validation error (body or query params)        |
| 401  | Missing or invalid `x-user-id` header          |
| 404  | Resource not found or not owned by user         |
| 500  | Unexpected server error                        |
