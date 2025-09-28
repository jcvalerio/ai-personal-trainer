import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

const mockCreatePlan = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/workout-plan-service', () => ({
  workoutPlanService: {
    createPlan: mockCreatePlan,
  },
}));

import { POST } from '@/app/api/workouts/plans/route';

const formPayload = {
  name: 'Rapid Strength Builder',
  durationWeeks: 6,
  sessionsPerWeek: 3,
  description: 'High-impact introduction to structured strength.',
};

function buildRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/workouts/plans', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

describe('POST /api/workouts/plans', () => {
  const userId = '11111111-2222-3333-4444-555555555555';

  beforeEach(() => {
    mockCreatePlan.mockReset();
  });

  it('creates a plan from minimal form data', async () => {
    mockCreatePlan.mockResolvedValue({ id: 'plan-123', name: formPayload.name });

    const request = buildRequest(formPayload, { 'x-user-id': userId });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(mockCreatePlan).toHaveBeenCalledTimes(1);
    const [, planInput] = mockCreatePlan.mock.calls[0];
    expect(planInput).toMatchObject({
      name: formPayload.name,
      durationWeeks: formPayload.durationWeeks,
      sessionsPerWeek: formPayload.sessionsPerWeek,
    });
  });

  it('returns 400 when payload is invalid', async () => {
    const request = buildRequest({ ...formPayload, name: '' }, { 'x-user-id': userId });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.code).toBe('VALIDATION_ERROR');
    expect(mockCreatePlan).not.toHaveBeenCalled();
  });

  it('returns 401 when user is missing', async () => {
    const request = buildRequest(formPayload);
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('propagates validation errors from the service', async () => {
    mockCreatePlan.mockRejectedValue(
      new ZodError([
        { code: 'custom', message: 'Invalid plan structure', path: ['schedule'] } as any,
      ])
    );

    const request = buildRequest(formPayload, { 'x-user-id': userId });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.code).toBe('VALIDATION_ERROR');
  });
});
