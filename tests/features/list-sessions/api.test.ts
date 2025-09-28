import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockListSessions = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/workout-plan-service', () => ({
  workoutPlanService: {
    listSessions: mockListSessions,
  },
}));

import { GET } from '@/app/api/workouts/plans/[planId]/sessions/route';

const planId = '00000000-1111-2222-3333-444444444444';
const userId = '11111111-2222-3333-4444-555555555555';

function buildRequest(headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/workouts/plans/${planId}/sessions`, {
    headers,
  });
}

describe('GET /api/workouts/plans/:planId/sessions', () => {
  beforeEach(() => {
    mockListSessions.mockReset();
  });

  it('returns sessions for the plan', async () => {
    mockListSessions.mockResolvedValue([{ id: 'session-1' }]);

    const response = await GET(
      buildRequest({ 'x-user-id': userId }),
      { params: Promise.resolve({ planId }) }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.data.sessions[0].id).toBe('session-1');
    expect(mockListSessions).toHaveBeenCalledWith(userId, planId);
  });

  it('returns 401 when user header missing', async () => {
    const response = await GET(buildRequest(), { params: Promise.resolve({ planId }) });
    expect(response.status).toBe(401);
    expect(mockListSessions).not.toHaveBeenCalled();
  });

  it('returns 404 when service reports plan missing', async () => {
    mockListSessions.mockResolvedValue(null);

    const response = await GET(
      buildRequest({ 'x-user-id': userId }),
      { params: Promise.resolve({ planId }) }
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.code).toBe('NOT_FOUND');
  });
});
