# Data Model

Conceptual domain model for the AI Personal Trainer. This is the source of truth for entities, relationships, and invariants.

For executable implementations, see `lib/shared/schemas/workout.ts` and `lib/shared/schemas/common.ts`.

---

## Enums

### FitnessLevel
`beginner` | `intermediate` | `advanced`

### WorkoutStatus
`draft` | `active` | `completed` | `paused` | `archived`

### SessionType
`workout` | `assessment` | `recovery`

### Locale
`en` | `es`

### UnitSystem
`metric` | `imperial`

---

## Entities

### User

| Field         | Type      | Constraints                  |
|---------------|-----------|------------------------------|
| `id`          | UUID      | primary key, auto-generated  |
| `clerkUserId` | string    | unique                       |
| `email`       | string    | unique                       |
| `displayName` | string    | required                     |
| `locale`      | Locale    | default `en`                 |
| `units`       | UnitSystem| default `metric`             |
| `createdAt`   | datetime  | auto                         |
| `updatedAt`   | datetime  | auto                         |

**Relationships**: Has many WorkoutPlans. Has many WorkoutSessions.

---

### WorkoutPlan

The central entity. Represents a structured training program.

| Field                    | Type              | Constraints                |
|--------------------------|-------------------|----------------------------|
| `id`                     | UUID              | primary key                |
| `userId`                 | UUID              | FK → User                  |
| `name`                   | string            | min 1 char                 |
| `description`            | string?           |                            |
| `durationWeeks`          | number            | positive integer           |
| `sessionsPerWeek`        | number            | positive integer           |
| `primaryGoals`           | string[]          | min 1 item                 |
| `secondaryGoals`         | string[]          | default []                 |
| `targetFitnessLevel`     | FitnessLevel      | required                   |
| `difficulty`             | FitnessLevel      | required                   |
| `estimatedSessionDuration`| number?          | minutes, positive          |
| `macrocycle`             | Macrocycle         | required (see below)       |
| `mesocycles`             | Mesocycle[]        | required                   |
| `microcycles`            | Microcycle[]       | required                   |
| `workoutTemplates`       | WorkoutTemplate[]  | min 1                      |
| `schedule`               | Schedule           | required (see below)       |
| `progressionRules`       | Record?           |                            |
| `aiMetadata`             | Record?           |                            |
| `status`                 | WorkoutStatus      | default `draft`            |
| `startedAt`              | datetime?         |                            |
| `completedAt`            | datetime?         |                            |
| `version`                | number            | default 1                  |
| `parentPlanId`           | UUID?             | self-reference for versions|
| `isTemplate`             | boolean           | default false              |
| `templateCategory`       | string?           |                            |
| `isPublic`               | boolean           | default false              |
| `locale`                 | Locale            | default `en`               |
| `units`                  | UnitSystem        | default `metric`           |
| `createdAt`              | datetime          | auto                       |
| `updatedAt`              | datetime          | auto                       |

**Relationships**: Belongs to User. Has many WorkoutSessions.

---

### WorkoutSession

A scheduled or completed workout instance, generated from a plan's schedule.

| Field                  | Type              | Constraints              |
|------------------------|-------------------|--------------------------|
| `id`                   | UUID              | primary key              |
| `userId`               | UUID              | FK → User                |
| `workoutPlanId`        | UUID?             | FK → WorkoutPlan         |
| `name`                 | string            | min 1 char               |
| `sessionType`          | SessionType       | default `workout`        |
| `scheduledDate`        | datetime          | required                 |
| `scheduledTime`        | datetime?         |                          |
| `scheduledDuration`    | number?           | positive integer         |
| `sessionData`          | SessionData       | metadata (see below)     |
| `warmUpExercises`      | SessionExercise[] | default []               |
| `mainExercises`        | SessionExercise[] | default []               |
| `coolDownExercises`    | SessionExercise[] | default []               |
| `status`               | WorkoutStatus     | default `draft`          |
| `completionPercentage` | number            | 0–100, default 0         |
| `effortRating`         | number?           | 1–10                     |
| `energyLevelBefore`    | number?           | 1–10                     |
| `energyLevelAfter`     | number?           | 1–10                     |
| `notes`                | string?           |                          |
| `createdAt`            | datetime          | auto                     |
| `updatedAt`            | datetime          | auto                     |

**Relationships**: Belongs to User. Optionally belongs to WorkoutPlan.

---

## Value Objects (embedded in entities as JSON)

### Macrocycle

Long-term training plan (4–52 weeks).

| Field                 | Type     | Constraints                                    |
|-----------------------|----------|------------------------------------------------|
| `name`                | string   | min 1 char                                     |
| `goal`                | string   | min 1 char                                     |
| `durationWeeks`       | number   | 4–52                                           |
| `phases`              | Phase[]  | required                                       |
| `progressionStrategy` | string?  | `linear` \| `undulating` \| `block` \| `conjugate` |

**Phase**:

| Field          | Type    | Constraints                                          |
|----------------|---------|------------------------------------------------------|
| `name`         | string  | min 1 char                                           |
| `durationWeeks`| number  | 1–52                                                 |
| `focus`        | string  | `base` \| `build` \| `peak` \| `recovery` \| `transition` |
| `intensityRange`| object?| `{ min: 0–100, max: 0–100 }`                        |

### Mesocycle

Weekly focus block.

| Field        | Type    | Constraints                                                     |
|--------------|---------|-----------------------------------------------------------------|
| `name`       | string  | min 1 char                                                      |
| `weekNumber` | number  | positive integer                                                |
| `focus`      | string? | `strength` \| `hypertrophy` \| `power` \| `endurance` \| `recovery` \| `technique` |
| `volume`     | string? | `low` \| `moderate` \| `high` \| `very_high`                    |
| `intensity`  | string? | `low` \| `moderate` \| `high` \| `very_high`                    |
| `deloadWeek` | boolean?|                                                                 |
| `keyMetrics` | string[]?|                                                                |

### Microcycle

Weekly structure.

| Field             | Type     | Constraints                                                     |
|-------------------|----------|-----------------------------------------------------------------|
| `weekNumber`      | number   | positive integer                                                |
| `workoutDays`     | Day[]    | day enum values                                                 |
| `restDays`        | Day[]    | day enum values                                                 |
| `totalVolume`     | number?  |                                                                 |
| `averageIntensity`| number?  |                                                                 |
| `pattern`         | string?  | `accumulation` \| `intensification` \| `realization` \| `recovery` |

**Day enum**: `monday` | `tuesday` | `wednesday` | `thursday` | `friday` | `saturday` | `sunday`

### WorkoutTemplate

Reusable workout blueprint.

| Field               | Type               | Constraints                                                 |
|---------------------|--------------------|-------------------------------------------------------------|
| `id`                | UUID               | required                                                    |
| `name`              | string             | min 1 char                                                  |
| `description`       | string?            |                                                             |
| `category`          | string             | `strength` \| `hypertrophy` \| `power` \| `endurance` \| `mixed` \| `recovery` |
| `difficulty`        | FitnessLevel       | required                                                    |
| `estimatedDuration` | number             | positive integer (minutes)                                  |
| `targetMuscleGroups`| string[]           | required                                                    |
| `workoutType`       | string             | same as category                                            |
| `trainingStyle`     | string?            | `bodybuilding` \| `powerlifting` \| `crossfit` \| `functional` \| `sport_specific` |
| `warmUpExercises`   | WorkoutExercise[]  | default []                                                  |
| `mainExercises`     | WorkoutExercise[]  | min 1                                                       |
| `coolDownExercises` | WorkoutExercise[]  | default []                                                  |
| `equipmentRequired` | string[]           | default []                                                  |
| `spaceRequired`     | string             | `minimal` \| `moderate` \| `large`, default `moderate`      |
| `tags`              | string[]           | default []                                                  |
| `isActive`          | boolean            | default true                                                |
| `isPublic`          | boolean            | default false                                               |
| `createdAt`         | datetime           | required                                                    |
| `updatedAt`         | datetime           | required                                                    |

### WorkoutExercise

Exercise within a template.

| Field            | Type             | Constraints  |
|------------------|------------------|--------------|
| `id`             | UUID             | required     |
| `exerciseId`     | UUID             | required     |
| `orderIndex`     | number           | required     |
| `phase`          | string           | `warm_up` \| `main` \| `cool_down` |
| `sets`           | ExerciseSet[]    | required     |
| `substitutions`  | UUID[]           | default []   |
| `modifications`  | Modification[]   | default []   |

### ExerciseSet

| Field           | Type    | Constraints                                                  |
|-----------------|---------|--------------------------------------------------------------|
| `setNumber`     | number  | positive integer                                             |
| `setType`       | string  | `working` \| `warm_up` \| `back_off` \| `drop` \| `rest_pause` \| `cluster` |
| `targetReps`    | number? | positive integer                                             |
| `targetWeight`  | number? | positive number                                              |
| `targetDuration`| number? | positive number (seconds)                                    |
| `restPeriod`    | number? | positive integer (seconds)                                   |
| `notes`         | string? |                                                              |
| `cues`          | string[]?|                                                             |

### SessionData

Metadata for a session.

| Field               | Type          | Constraints         |
|---------------------|---------------|---------------------|
| `totalExercises`    | number        | non-negative        |
| `estimatedDuration` | number        | positive (seconds)  |
| `targetMuscleGroups`| string[]      | required            |
| `equipmentNeeded`   | string[]      | required            |
| `difficultyLevel`   | FitnessLevel  | required            |
| `notes`             | string?       |                     |

### SessionExercise

Exercise instance within a session (includes planned and actual values).

| Field                    | Type    | Constraints         |
|--------------------------|---------|---------------------|
| `exerciseId`             | UUID    | required            |
| `exerciseName`           | string? |                     |
| `orderIndex`             | number  | non-negative        |
| `exercisePhase`          | string  | `warm_up` \| `main` \| `cool_down`, default `main` |
| `plannedSets`            | number? | positive            |
| `plannedReps`            | number? | positive            |
| `plannedWeightKg`        | number? | positive            |
| `plannedDurationSeconds` | number? | positive            |
| `plannedRestSeconds`     | number? | positive            |
| `actualSets`             | number? | non-negative        |
| `actualReps`             | number? | non-negative        |
| `actualWeightKg`         | number? | positive            |
| `actualDurationSeconds`  | number? | positive            |
| `isCompleted`            | boolean | default false       |
| `exerciseNotes`          | string? |                     |
| `equipmentAlternatives`  | string[]?|                    |

### Schedule

| Field            | Type                        | Constraints              |
|------------------|-----------------------------|--------------------------|
| `startDate`      | datetime                    | required                 |
| `endDate`        | datetime?                   |                          |
| `timeZone`       | string                      | default `UTC`            |
| `weeklySchedule` | Record<Day, ScheduleDay>    | min 1 entry              |
| `exceptions`     | ScheduleException[]         | default []               |

### ScheduleDay

| Field               | Type    | Constraints    |
|---------------------|---------|----------------|
| `workoutTemplateId` | UUID?   |                |
| `workoutName`       | string? |                |
| `isRestDay`         | boolean | default false  |
| `scheduledTime`     | string? |                |
| `estimatedDuration` | number? | positive       |
| `notes`             | string? |                |

---

## Invariants

These rules MUST be enforced by the system:

1. **Ownership**: A user can only access their own plans and sessions. Attempting to access another user's resource returns 404.

2. **Session lifecycle**: A session follows the state machine: `draft → active → completed`. No other transitions are valid. A session can only be started if it is in `draft` status. A session can only be completed if it is in `active` status.

3. **Plan lifecycle**: A plan follows: `draft → active → completed | paused → archived`. Starting a plan generates sessions from the schedule.

4. **Schedule validity**: A plan's weekly schedule must reference at least one workout template or workout name. Every non-rest day must have either a `workoutTemplateId` or a `workoutName`.

5. **Template minimum**: A plan must have at least one workout template with at least one main exercise.

6. **Completion percentage**: Must be 0–100. Updated when exercises are logged.

7. **Effort and energy ratings**: Must be 1–10 when provided.

8. **Macrocycle duration**: Must be 4–52 weeks.

---

## Entity Relationship Diagram

```
User (1) ──── (*) WorkoutPlan
User (1) ──── (*) WorkoutSession
WorkoutPlan (1) ──── (*) WorkoutSession

WorkoutPlan contains (JSON):
  ├── Macrocycle
  │   └── Phase[]
  ├── Mesocycle[]
  ├── Microcycle[]
  ├── WorkoutTemplate[]
  │   └── WorkoutExercise[]
  │       └── ExerciseSet[]
  └── Schedule
      ├── ScheduleDay (per weekday)
      └── ScheduleException[]

WorkoutSession contains (JSON):
  ├── SessionData
  ├── SessionExercise[] (warmUp)
  ├── SessionExercise[] (main)
  └── SessionExercise[] (coolDown)
```
