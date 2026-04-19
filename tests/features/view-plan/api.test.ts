import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetPlan = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/workout-plan-service', () => ({
  workoutPlanService: {
    getPlan: mockGetPlan,
  },
}));

import { GET } from '@/app/api/workouts/plans/[planId]/route';

const userId = '11111111-2222-3333-4444-555555555555';
const planId = '22222222-3333-4444-5555-666666666666';

function buildRequest(headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/workouts/plans/${planId}`, {
    headers,
  });
}

describe('GET /api/workouts/plans/:planId', () => {
  beforeEach(() => {
    mockGetPlan.mockReset();
  });

  it('returns the workout plan when found', async () => {
    mockGetPlan.mockResolvedValue({ id: planId, name: 'Demo Plan' });

    const request = buildRequest({ 'x-user-id': userId });
    const response = await GET(request, { params: Promise.resolve({ planId }) });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.data.workoutPlan.id).toBe(planId);
    expect(mockGetPlan).toHaveBeenCalledWith(userId, planId);
  });

  it('returns 404 when plan is missing', async () => {
    mockGetPlan.mockResolvedValue(null);

    const request = buildRequest({ 'x-user-id': userId });
    const response = await GET(request, { params: Promise.resolve({ planId }) });

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.code).toBe('NOT_FOUND');
  });

  it('returns 401 when user header missing', async () => {
    const request = buildRequest();
    const response = await GET(request, { params: Promise.resolve({ planId }) });

    expect(response.status).toBe(401);
  });
});
