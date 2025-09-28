# AI Personal Trainer v2

A greenfield implementation of the workout-planning backend and API built with Next.js App Router, Prisma, and shared Zod schemas. The project focuses on a clean data model (macrocycle/mesocycle/microcycle, workout templates, structured schedules) that is shared across the backend and frontend via a single type definition library.

## Getting Started

```bash
pnpm install
pnpm prisma generate
pnpm dev
```

Set `DATABASE_URL` to a PostgreSQL instance before running `prisma generate` or `next dev`.

### End-to-end testing prerequisites

Playwright specs rely on ephemeral Neon branches. Export the following before running `pnpm test:e2e`:

```
export NEON_API_KEY=...          # service token with branch permissions
export NEON_PROJECT_ID=...       # Neon project identifier
export NEON_DB_PASSWORD=...      # password for the generated branch endpoint
export NEON_SEED_COMMAND="pnpm tsx prisma/seeds/run.ts create-workout-plan"
```

When reusing a local database (e.g., running with `DOTENV_CONFIG_PATH=.env.test`), reseed before each run with `set -a; source .env.test; set +a; pnpm exec tsx prisma/seeds/run.ts create-workout-plan` to reset the draft plan and clear generated sessions.

Optionally set `E2E_USER_ID` to control the seeded coach user id.

## Folder Structure

- `app/` – Next.js App Router pages and API routes.
- `lib/shared/schemas/` – Zod schemas shared by server & client.
- `lib/services/` – Domain services (Prisma-backed).
- `lib/utils/` – Cross-cutting helpers (auth stub, response helpers).
- `prisma/` – Prisma schema.
- `tests/` – Vitest unit tests for schemas.

## API Surface

### Workout Plans
- `POST /api/workouts/plans`
- `GET /api/workouts/plans`
- `GET /api/workouts/plans/:planId`
- `PUT /api/workouts/plans/:planId`
- `POST /api/workouts/plans/:planId/start`

### Sessions
- `GET /api/workouts/plans/:planId/sessions`
- `POST /api/workouts/plans/:planId/sessions`
- `GET /api/workouts/sessions/:sessionId`
- `POST /api/workouts/sessions/:sessionId/start`
- `POST /api/workouts/sessions/:sessionId/complete`

> Auth is stubbed via the `x-user-id` header for now. Replace `lib/utils/auth.ts` with a real Clerk integration when ready.

## Testing

```bash
pnpm test
```

## Next Steps

- Wire the dashboard pages to the API using React Query.
- Flesh out AI plan creation route (currently stubbed to manual schema).
- Add localization with `next-intl` and translated copy.
- Implement real authentication (Clerk) and extend error handling.
- Follow the [TDD + E2E roadmap](docs/process/tdd-e2e-roadmap.md) to stage features with Playwright + Neon branches.
