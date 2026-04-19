# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Spec-Driven Development Workflow

This project uses **spec-driven development**. Specifications are the single source of truth.

### The Contract

1. **Specs define behavior**: `docs/specs/` contains API contracts, data model, and feature specs
2. **Schemas enforce types**: `lib/shared/schemas/` contains Zod schemas shared by frontend and backend
3. **Scenarios validate outcomes**: `tests/scenarios/` contains behavioral tests (the "holdout set")

### Rules for Agents

- **Read the spec FIRST**: Before implementing any feature, read `docs/specs/features/<feature>.md`
- **Follow API contracts**: All endpoints must match `docs/specs/api-contracts.md` exactly
- **Respect the data model**: All entities must match `docs/specs/data-model.md` invariants
- **Do NOT read scenario tests**: `tests/scenarios/` is the holdout validation set. Agents must not read these files during implementation. They exist to validate that the spec was implemented correctly.
- **Do NOT modify shared schemas without updating the spec first**: If a schema change is needed, update `docs/specs/data-model.md` and `docs/specs/api-contracts.md` before changing `lib/shared/schemas/`

### Spec Locations

| Document | Path | Purpose |
|----------|------|---------|
| API Contracts | `docs/specs/api-contracts.md` | HTTP endpoint definitions |
| Data Model | `docs/specs/data-model.md` | Entities, relationships, invariants |
| Feature Specs | `docs/specs/features/*.md` | BDD scenarios per feature |
| Zod Schemas | `lib/shared/schemas/` | Executable type contracts |

### Validation

```bash
pnpm test:scenarios            # Run behavioral scenario tests (holdout set)
```

## Behavioral Guardrails

These guardrails complement the spec-driven workflow above. They do not replace the spec; they help agents execute against it correctly.

### 1. Think Before Coding
- Read the relevant spec, API contract, and data model sections before implementing.
- State assumptions explicitly instead of choosing silently.
- If requirements are ambiguous or inconsistent, stop and ask for clarification.
- Prefer clarifying questions over speculative implementation.

### 2. Simplicity First
- Implement the minimum change that satisfies the current spec.
- Do not add abstractions, flexibility, configurability, or features that the spec does not require.
- Match existing patterns unless the spec requires a different approach.
- If a solution feels overbuilt for the current requirement, simplify it.

### 3. Surgical Changes
- Touch only files and lines directly related to the request.
- Do not refactor unrelated code, rewrite comments, or reformat adjacent code without need.
- Remove imports, variables, and helpers made unused by your own changes.
- If you notice unrelated issues, mention them separately instead of fixing them opportunistically.

### 4. Goal-Driven Execution
- Define success in terms of the spec and verifiable checks.
- Prefer tests or focused validation steps that prove the requested behavior.
- Use implementation-aware unit tests and E2E tests when appropriate.
- Never read `tests/scenarios/` during implementation; they remain the holdout validation set.

---

## Development Commands

### Core Development
```bash
pnpm install                    # Install dependencies
pnpm prisma generate           # Generate Prisma client
pnpm dev                       # Start development server
pnpm build                     # Build for production
pnpm start                     # Start production server
pnpm lint                      # Run ESLint
```

### Database Setup
Set `DATABASE_URL` environment variable to a PostgreSQL instance before running any Prisma commands.

### Testing

#### Unit Tests
```bash
pnpm test                      # Run all Vitest unit tests
pnpm test --watch             # Run tests in watch mode
```

#### E2E Tests with Neon Branches
E2E tests use ephemeral Neon database branches for isolation. Export these environment variables:
```bash
export NEON_API_KEY=...          # Service token with branch permissions
export NEON_PROJECT_ID=...       # Neon project identifier
export NEON_DB_PASSWORD=...      # Password for generated branch endpoint
export NEON_SEED_COMMAND="pnpm tsx prisma/seeds/run.ts create-workout-plan"
```

```bash
pnpm test:e2e                  # Run Playwright E2E tests
pnpm test:scenarios            # Run behavioral scenario tests (holdout validation)
```

For local database reuse (with .env.test):
```bash
set -a; source .env.test; set +a; pnpm exec tsx prisma/seeds/run.ts create-workout-plan
```

Optional: Set `E2E_USER_ID` to control seeded coach user ID.

## Architecture Overview

### Project Structure
- **Next.js 15 App Router**: Modern React framework with app directory structure
- **Prisma + PostgreSQL**: Type-safe database access with schema-driven development
- **Shared Zod Schemas**: Single source of truth for data validation across client/server
- **React Query**: Server state management for API interactions
- **TailwindCSS**: Utility-first styling

### Key Architecture Patterns

#### Shared Type System
The application uses a unified type system via Zod schemas in `lib/shared/schemas/`:
- **workout.ts**: Complex nested schemas for workout plans, sessions, exercises
- **common.ts**: Base schemas for UUIDs, enums, validation primitives
- Types are generated from schemas and shared between client/server code

#### Domain Services Layer
Business logic is encapsulated in service classes (`lib/services/`):
- **WorkoutPlanService**: Core CRUD operations for workout plans and sessions
- **Prisma integration**: Direct database access with proper error handling
- **Type safety**: All inputs/outputs validated with Zod schemas

#### API Architecture
RESTful API routes follow consistent patterns:
- **Route handlers**: Located in `app/api/` following App Router conventions
- **Authentication**: Stubbed via `x-user-id` header (to be replaced with Clerk)
- **Validation**: All requests validated with shared Zod schemas
- **Error handling**: Standardized response helpers in `lib/utils/api-response.ts`

### Data Model Structure

#### Workout Planning Hierarchy
The app implements a sophisticated workout planning model:

1. **Macrocycle**: Long-term training plan (4-52 weeks)
   - Contains phases: base, build, peak, recovery, transition
   - Progression strategies: linear, undulating, block, conjugate

2. **Mesocycles**: Medium-term blocks (weekly focus)
   - Focus areas: strength, hypertrophy, power, endurance, recovery
   - Volume/intensity management

3. **Microcycles**: Weekly structure
   - Workout/rest day patterns
   - Volume and intensity distribution

4. **Workout Templates**: Reusable workout structures
   - Exercise organization: warm-up, main, cool-down phases
   - Set/rep schemes with progression rules
   - Equipment and space requirements

5. **Workout Sessions**: Scheduled instances
   - Generated from templates based on plan schedule
   - Progress tracking and completion status

#### Key Database Relationships
```
User → WorkoutPlan → WorkoutSession
WorkoutPlan contains:
- JSON fields: macrocycle, mesocycles, microcycles, workoutTemplates, schedule
- Enum fields: status, difficulty, targetFitnessLevel
```

### Path Aliases
TypeScript path mapping is configured for clean imports:
- `@/lib/*` → `lib/*`
- `@/components/*` → `components/*`
- `@/app/*` → `app/*`
- `@/schemas/*` → `lib/shared/schemas/*`
- `@/types` → `lib/shared/types`
- `@/services/*` → `lib/services/*`

### Testing Strategy

#### Spec-Driven Testing

The project uses a three-layer testing approach:

1. **Spec-First**: Each feature starts with `docs/specs/features/<feature>.md` (BDD format)
2. **Scenario Tests**: `tests/scenarios/` — behavioral validation from user perspective (holdout set, agents don't read these)
3. **E2E Tests**: `tests/e2e/` — implementation-aware tests that agents can reference
4. **Isolated Testing**: Neon branches provide clean database state per test
5. **Red-Green-Refactor**: Failing scenarios drive spec refinement, not code tweaking

#### Test Organization
- **Scenario Tests**: `tests/scenarios/` — holdout behavioral validation (run with `pnpm test:scenarios`)
- **E2E Tests**: `tests/e2e/` — implementation-aware tests
- **Unit Tests**: `tests/features/` organized by feature
- **Component Tests**: React component testing with React Testing Library

### Authentication Notes
Current authentication is stubbed via `x-user-id` header in `lib/utils/auth.ts`. This should be replaced with Clerk integration when implementing real authentication.

### Internationalization
The project is set up for i18n with `next-intl` but localization is not yet implemented. The data model supports locale-specific content via locale fields.

### Code Quality Tools
- **Codacy Integration**: Automatic code analysis after file edits (see `.github/instructions/codacy.instructions.md`)
- **ESLint**: Next.js and TypeScript linting rules
- **TypeScript**: Strict mode enabled with comprehensive type checking