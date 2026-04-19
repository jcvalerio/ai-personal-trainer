import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });

  expect(hasHorizontalOverflow).toBe(false);
}

const TEST_PLAN_ID = 'session-test-plan-0001';
const SEEDED_SESSION_IDS = {
  draft: 'session-test-0001',
  active: 'session-test-0002',
  completed: 'session-test-0003',
} as const;
const TEST_USER_ID = process.env.E2E_USER_ID ?? '11111111-2222-3333-4444-555555555555';

function buildSessionPayload(name: string) {
  const scheduledDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  return {
    name,
    sessionType: 'workout',
    scheduledDate,
    scheduledDuration: 60,
    sessionData: {
      totalExercises: 3,
      estimatedDuration: 60,
      targetMuscleGroups: ['full_body'],
      equipmentNeeded: ['barbell', 'bench'],
      difficultyLevel: 'intermediate',
    },
    warmUpExercises: [
      {
        exerciseId: '11111111-aaaa-bbbb-cccc-111111111111',
        exerciseName: 'Dynamic Stretching',
        orderIndex: 0,
        exercisePhase: 'warm_up',
        plannedSets: 1,
        plannedDurationSeconds: 300,
      },
    ],
    mainExercises: [
      {
        exerciseId: '22222222-aaaa-bbbb-cccc-222222222222',
        exerciseName: 'Squats',
        orderIndex: 0,
        exercisePhase: 'main',
        plannedSets: 4,
        plannedReps: 10,
        plannedWeightKg: 50,
        plannedRestSeconds: 90,
      },
    ],
    coolDownExercises: [
      {
        exerciseId: '33333333-aaaa-bbbb-cccc-333333333333',
        exerciseName: 'Static Stretching',
        orderIndex: 0,
        exercisePhase: 'cool_down',
        plannedSets: 1,
        plannedDurationSeconds: 600,
      },
    ],
  };
}

async function assertSeededSessionEnvironment(request: APIRequestContext) {
  const planResponse = await request.get(`/api/workouts/plans/${TEST_PLAN_ID}`, {
    headers: {
      'x-user-id': TEST_USER_ID,
    },
  });

  if (!planResponse.ok()) {
    throw new Error([
      'Session-management E2E seed data is missing.',
      'Expected seeded workout plan:',
      `- plan id: ${TEST_PLAN_ID}`,
      '',
      'Run:',
      '  set -a; source .env.test; set +a',
      '  pnpm exec tsx prisma/seeds/run.ts session-management',
    ].join('\n'));
  }

  const sessionsResponse = await request.get(`/api/workouts/plans/${TEST_PLAN_ID}/sessions`, {
    headers: {
      'x-user-id': TEST_USER_ID,
    },
  });

  if (!sessionsResponse.ok()) {
    throw new Error('Session-management seed plan exists, but seeded sessions could not be loaded. Rerun the session-management seed.');
  }

  const payload = await sessionsResponse.json();
  const seededIds = new Set((payload?.data?.sessions ?? []).map((session: { id: string }) => session.id));

  for (const requiredId of Object.values(SEEDED_SESSION_IDS)) {
    if (!seededIds.has(requiredId)) {
      throw new Error([
        'Session-management E2E seeded sessions are incomplete.',
        `Missing session id: ${requiredId}`,
        'Rerun:',
        '  set -a; source .env.test; set +a',
        '  pnpm exec tsx prisma/seeds/run.ts session-management',
      ].join('\n'));
    }
  }
}

async function createSession(request: APIRequestContext, name: string) {
  const response = await request.post(`/api/workouts/plans/${TEST_PLAN_ID}/sessions`, {
    headers: {
      'content-type': 'application/json',
      'x-user-id': TEST_USER_ID,
    },
    data: buildSessionPayload(name),
  });

  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.success).toBe(true);
  return payload.data.workoutSession as { id: string; name: string };
}

async function openSession(page: Page, sessionId: string) {
  await page.goto(`/workouts/sessions/${sessionId}`);
}

test.describe('Session Management', () => {
  test.beforeEach(async ({ request }) => {
    await assertSeededSessionEnvironment(request);
  });

  test('coach can view seeded session detail with all exercise groups', async ({ page }) => {
    await openSession(page, SEEDED_SESSION_IDS.draft);

    await expect(page).toHaveURL(new RegExp(`/workouts/sessions/${SEEDED_SESSION_IDS.draft}`));
    await expect(page.getByRole('heading', { name: 'Session 1: Full Body Strength' })).toBeVisible();

    const warmUpSection = page.getByRole('region', { name: /warm-up/i });
    await expect(warmUpSection).toContainText('Dynamic Stretching');

    const mainSection = page.getByRole('region', { name: /main workout/i });
    await expect(mainSection).toContainText('Squats');
    await expect(mainSection).toContainText('4 sets × 10 reps @ 50kg');

    const coolDownSection = page.getByRole('region', { name: /cool-down/i });
    await expect(coolDownSection).toContainText('Static Stretching');
  });

  test('coach can start a draft session and track exercise progress', async ({ page, request }) => {
    const session = await createSession(request, `E2E Track Progress ${Date.now()}`);

    await openSession(page, session.id);
    await expect(page.getByRole('heading', { name: session.name })).toBeVisible();
    await expect(page.getByText('Draft').first()).toBeVisible();

    const startButton = page.getByRole('button', { name: /start workout/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    await expect(page.getByText('Active').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /complete workout/i })).toBeVisible();

    const squatCard = page.locator('[data-exercise-id="22222222-aaaa-bbbb-cccc-222222222222"]');
    await expect(squatCard).toBeVisible();
    await squatCard.getByRole('button', { name: /mark complete/i }).click();

    await page.getByLabel('Actual reps').fill('12');
    await page.getByLabel('Actual weight (kg)').fill('60');
    await page.getByLabel('Exercise notes (optional)').fill('Strong set');
    await page.getByRole('button', { name: /save & complete/i }).click();

    await expect(squatCard).toContainText('Complete');
    await expect(page.getByText('33% complete')).toBeVisible();
    await expect(page.getByText(/Progress:\s*33%/i)).toBeVisible();
  });

  test('coach can complete a session with feedback', async ({ page, request }) => {
    const session = await createSession(request, `E2E Complete Session ${Date.now()}`);

    await openSession(page, session.id);
    await page.getByRole('button', { name: /start workout/i }).click();
    await expect(page.getByText('Active').first()).toBeVisible();

    const completeButton = page.getByRole('button', { name: /complete workout/i });
    await expect(completeButton).toBeVisible();
    await completeButton.click();

    const completionDialog = page.getByRole('dialog');
    await expect(completionDialog).toBeVisible();

    await page.getByLabel('Effort rating').selectOption('8');
    await page.getByLabel('Energy level before').selectOption('7');
    await page.getByLabel('Energy level after').selectOption('6');
    await page.getByLabel('Session notes').fill('Great session, client showed good form on squats.');

    await page.getByRole('button', { name: /confirm completion/i }).click();

    await expect(page.getByText('Completed').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /session feedback/i })).toBeVisible();
    await expect(page.getByText('Effort: 8/10')).toBeVisible();
    await expect(page.getByText('7/10')).toBeVisible();
    await expect(page.getByText('6/10')).toBeVisible();
    await expect(page.getByRole('button', { name: /complete workout/i })).toHaveCount(0);
  });

  test('plan detail sessions list shows seeded status badges and completion percentage', async ({ page }) => {
    await page.goto(`/workouts/plans/${TEST_PLAN_ID}`);

    const sessionsSection = page.getByRole('region', { name: /sessions/i });
    await expect(sessionsSection).toBeVisible();

    const draftSession = sessionsSection.locator(`[data-session-id="${SEEDED_SESSION_IDS.draft}"]`);
    await expect(draftSession).toHaveAttribute('data-session-status', 'draft');
    await expect(draftSession).toContainText('Draft');

    const activeSession = sessionsSection.locator(`[data-session-id="${SEEDED_SESSION_IDS.active}"]`);
    await expect(activeSession).toHaveAttribute('data-session-status', 'active');
    await expect(activeSession).toContainText('Active');
    await expect(activeSession).toContainText('40% complete');

    const completedSession = sessionsSection.locator(`[data-session-id="${SEEDED_SESSION_IDS.completed}"]`);
    await expect(completedSession).toHaveAttribute('data-session-status', 'completed');
    await expect(completedSession).toContainText('Completed');
    await expect(completedSession).toContainText('100% complete');
  });

  test('session page remains usable on a mobile viewport', async ({ page, request }) => {
    const session = await createSession(request, `E2E Mobile Session ${Date.now()}`);

    await page.setViewportSize({ width: 375, height: 667 });
    await openSession(page, session.id);

    await expect(page.getByRole('heading', { name: session.name })).toBeVisible();
    await expect(page.getByRole('button', { name: /start workout/i })).toBeVisible();
    await expect(page.locator('[data-exercise-id]')).toHaveCount(3);
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: /start workout/i }).click();
    await expect(page.getByText('Active').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /complete workout/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const squatCard = page.locator('[data-exercise-id="22222222-aaaa-bbbb-cccc-222222222222"]');
    await squatCard.getByRole('button', { name: /mark complete/i }).click();
    await expect(page.getByLabel('Actual reps')).toBeVisible();
    await expect(page.getByRole('button', { name: /save & complete/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: /complete workout/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: /confirm completion/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
