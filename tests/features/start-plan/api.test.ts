import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

const mockStartPlan = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/workout-plan-service', () => ({
  workoutPlanService: {
    startPlan: mockStartPlan,
  },
}));

import { POST } from '@/app/api/workouts/plans/[planId]/start/route';

const planId = '00000000-1111-2222-3333-444444444444';
const userId = '11111111-2222-3333-4444-555555555555';

function buildRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/workouts/plans/${planId}/start`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

describe('POST /api/workouts/plans/:planId/start', () => {
  beforeEach(() => {
    mockStartPlan.mockReset();
  });

  it('starts the plan and returns the updated payload', async () => {
    mockStartPlan.mockResolvedValue({ id: planId, status: 'active' });

    const response = await POST(
      buildRequest({}, { 'x-user-id': userId }),
      { params: Promise.resolve({ planId }) }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(mockStartPlan).toHaveBeenCalledWith(userId, planId, {});
  });

  it('returns 404 when the plan cannot be found', async () => {
    mockStartPlan.mockResolvedValue(null);

    const response = await POST(
      buildRequest({}, { 'x-user-id': userId }),
      { params: Promise.resolve({ planId }) }
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.code).toBe('NOT_FOUND');
  });

  it('returns 401 when user header missing', async () => {
    const response = await POST(buildRequest({}), { params: Promise.resolve({ planId }) });
    expect(response.status).toBe(401);
    expect(mockStartPlan).not.toHaveBeenCalled();
  });

  it('returns 400 when payload invalid', async () => {
    const response = await POST(
      buildRequest({ startDate: 'invalid' }, { 'x-user-id': userId }),
      { params: Promise.resolve({ planId }) }
    );
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.code).toBe('VALIDATION_ERROR');
  });

  it('handles validation errors thrown by the service', async () => {
    mockStartPlan.mockRejectedValue(
      new ZodError([
        { code: 'custom', message: 'Invalid sessions', path: ['sessions'] } as any,
      ])
    );

    const response = await POST(
      buildRequest({}, { 'x-user-id': userId }),
      { params: Promise.resolve({ planId }) }
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.code).toBe('VALIDATION_ERROR');
  });
});
