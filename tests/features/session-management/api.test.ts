import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockUpdateSessionProgress = vi.hoisted(() => vi.fn());
const mockMarkSessionStarted = vi.hoisted(() => vi.fn());
const mockMarkSessionComplete = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/workout-plan-service', () => ({
  workoutPlanService: {
    updateSessionProgress: mockUpdateSessionProgress,
    markSessionStarted: mockMarkSessionStarted,
    markSessionComplete: mockMarkSessionComplete,
  },
}));

import { PUT } from '@/app/api/workouts/sessions/[sessionId]/route';
import { POST as startSession } from '@/app/api/workouts/sessions/[sessionId]/start/route';
import { POST as completeSession } from '@/app/api/workouts/sessions/[sessionId]/complete/route';

const userId = '11111111-2222-3333-4444-555555555555';
const sessionId = '22222222-3333-4444-5555-666666666666';
const exerciseId = '33333333-4444-5555-6666-777777777777';

function buildRequest(url: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) {
  return new NextRequest(url, init);
}

describe('Session management API routes', () => {
  beforeEach(() => {
    mockUpdateSessionProgress.mockReset();
    mockMarkSessionStarted.mockReset();
    mockMarkSessionComplete.mockReset();
  });

  it('updates session progress via PUT /api/workouts/sessions/:sessionId', async () => {
    mockUpdateSessionProgress.mockResolvedValue({ id: sessionId, status: 'active', completionPercentage: 50 });

    const request = buildRequest(`http://localhost/api/workouts/sessions/${sessionId}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        mainExercises: [
          {
            exerciseId,
            actualReps: 10,
            isCompleted: true,
          },
        ],
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({ sessionId }) });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.data.workoutSession.completionPercentage).toBe(50);
  });

  it('returns 400 for invalid session progress payload', async () => {
    const request = buildRequest(`http://localhost/api/workouts/sessions/${sessionId}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        mainExercises: [
          {
            exerciseId,
            isCompleted: 'yes',
          },
        ],
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({ sessionId }) });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when starting a session in an invalid lifecycle state', async () => {
    mockMarkSessionStarted.mockRejectedValue(
      new Error('INVALID_SESSION_STATE: Only draft sessions can be started')
    );

    const request = buildRequest(`http://localhost/api/workouts/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: {
        'x-user-id': userId,
      },
    });

    const response = await startSession(request, { params: Promise.resolve({ sessionId }) });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.code).toBe('VALIDATION_ERROR');
    expect(payload.error).toContain('Only draft sessions can be started');
  });

  it('completes a session and returns stored metadata', async () => {
    mockMarkSessionComplete.mockResolvedValue({
      id: sessionId,
      status: 'completed',
      completionPercentage: 100,
      effortRating: 8,
      energyLevelBefore: 7,
      energyLevelAfter: 5,
    });

    const request = buildRequest(`http://localhost/api/workouts/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        completionPercentage: 100,
        effortRating: 8,
        energyLevelBefore: 7,
        energyLevelAfter: 5,
      }),
    });

    const response = await completeSession(request, { params: Promise.resolve({ sessionId }) });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.workoutSession).toMatchObject({
      status: 'completed',
      effortRating: 8,
      energyLevelBefore: 7,
      energyLevelAfter: 5,
    });
  });
});
