import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

const mockCreatePlan = vi.hoisted(() => vi.fn());
const mockListPlans = vi.hoisted(() => vi.fn());
const mockLogApiInfo = vi.hoisted(() => vi.fn());
const mockLogApiWarn = vi.hoisted(() => vi.fn());
const mockLogApiError = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/workout-plan-service', () => ({
  workoutPlanService: {
    createPlan: mockCreatePlan,
    listPlans: mockListPlans,
  },
}));

vi.mock('@/lib/utils/observability', () => ({
  logApiInfo: mockLogApiInfo,
  logApiWarn: mockLogApiWarn,
  logApiError: mockLogApiError,
}));

import { GET, POST } from '@/app/api/workouts/plans/route';

const formPayload = {
  name: 'Rapid Strength Builder',
  durationWeeks: 6,
  sessionsPerWeek: 3,
  description: 'High-impact introduction to structured strength.',
};

function buildPostRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/workouts/plans', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

function buildGetRequest(search = '', headers: Record<string, string> = {}) {
  const url = search ? `http://localhost/api/workouts/plans?${search}` : 'http://localhost/api/workouts/plans';
  return new NextRequest(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

describe('/api/workouts/plans route', () => {
  const userId = '11111111-2222-3333-4444-555555555555';

  beforeEach(() => {
    mockCreatePlan.mockReset();
    mockListPlans.mockReset();
    mockLogApiInfo.mockReset();
    mockLogApiWarn.mockReset();
    mockLogApiError.mockReset();
  });

  describe('GET /api/workouts/plans', () => {
    it('lists plans and logs combined filter usage', async () => {
      mockListPlans.mockResolvedValue({
        items: [{ id: 'plan-123', name: 'Mobility Builder', status: 'active' }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });

      const request = buildGetRequest('status=active&search=mobility&page=1&limit=10', { 'x-user-id': userId });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.success).toBe(true);
      expect(mockListPlans).toHaveBeenCalledWith(userId, {
        status: 'active',
        search: 'mobility',
        page: 1,
        limit: 10,
      });
      expect(mockLogApiInfo).toHaveBeenCalledWith(
        'workout_plan.list.succeeded',
        expect.any(NextRequest),
        expect.any(Number),
        expect.objectContaining({
          userId,
          page: 1,
          limit: 10,
          itemCount: 1,
          totalPlans: 1,
          hasStatusFilter: true,
          hasSearchFilter: true,
          filterType: 'combined',
          statusFilter: 'active',
          searchTermLength: 'mobility'.length,
          zeroResults: false,
        })
      );
    });

    it('logs zero-result filtered searches without logging raw search text', async () => {
      mockListPlans.mockResolvedValue({
        items: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });

      const request = buildGetRequest('search=no-match-value', { 'x-user-id': userId });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockLogApiInfo).toHaveBeenCalledWith(
        'workout_plan.list.succeeded',
        expect.any(NextRequest),
        expect.any(Number),
        expect.objectContaining({
          hasStatusFilter: false,
          hasSearchFilter: true,
          filterType: 'search',
          searchTermLength: 'no-match-value'.length,
          zeroResults: true,
        })
      );
      expect(mockLogApiInfo.mock.calls[0]?.[3]).not.toHaveProperty('search');
    });

    it('returns 400 and logs validation failures for invalid query params', async () => {
      const request = buildGetRequest('limit=999&search=mobility', { 'x-user-id': userId });
      const response = await GET(request);

      expect(response.status).toBe(400);
      const payload = await response.json();
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(mockListPlans).not.toHaveBeenCalled();
      expect(mockLogApiWarn).toHaveBeenCalledWith(
        'workout_plan.list.validation_failed',
        expect.any(NextRequest),
        expect.any(Number),
        expect.objectContaining({
          userId,
          issuesCount: 1,
          hasStatusFilter: false,
          hasSearchFilter: true,
          filterType: 'search',
          searchTermLength: 'mobility'.length,
        })
      );
    });
  });

  describe('POST /api/workouts/plans', () => {
    it('creates a plan from minimal form data', async () => {
      mockCreatePlan.mockResolvedValue({ id: 'plan-123', name: formPayload.name });

      const request = buildPostRequest(formPayload, { 'x-user-id': userId });
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
      const request = buildPostRequest({ ...formPayload, name: '' }, { 'x-user-id': userId });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const payload = await response.json();
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(mockCreatePlan).not.toHaveBeenCalled();
    });

    it('returns 401 when user is missing', async () => {
      const request = buildPostRequest(formPayload);
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('propagates validation errors from the service', async () => {
      mockCreatePlan.mockRejectedValue(
        new ZodError([
          { code: 'custom', message: 'Invalid plan structure', path: ['schedule'] } as any,
        ])
      );

      const request = buildPostRequest(formPayload, { 'x-user-id': userId });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const payload = await response.json();
      expect(payload.code).toBe('VALIDATION_ERROR');
    });
  });
});
