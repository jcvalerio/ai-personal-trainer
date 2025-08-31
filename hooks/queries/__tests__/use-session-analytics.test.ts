/**
 * Session Analytics Hook Tests
 * TDD Red Phase - Failing tests for React Query hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSessionAnalytics } from '../use-session-analytics';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Test wrapper with React Query
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useSessionAnalytics', () => {
  const mockSessionId = 'test-session-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should fetch session analytics successfully', async () => {
      const mockAnalyticsData = {
        success: true,
        data: {
          sessionStats: {
            totalExercises: 8,
            completedExercises: 6,
            totalSets: 24,
            completedSets: 18,
            caloriesBurned: 320,
            duration: 45,
            effortRating: 7.5,
          },
          performanceMetrics: {
            strengthGain: 12,
            enduranceImprovement: 8,
            consistencyScore: 85,
            intensityLevel: 75,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      } as Response);

      const { result } = renderHook(
        () => useSessionAnalytics(mockSessionId),
        { wrapper: createTestWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBe(null);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockAnalyticsData.data);
      expect(result.current.error).toBe(null);
      expect(mockFetch).toHaveBeenCalledWith(`/api/workouts/sessions/${mockSessionId}/analytics`);
    });

    it('should include query parameters when provided', async () => {
      const mockOptions = {
        includeComparisons: true,
        includePredictions: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      renderHook(
        () => useSessionAnalytics(mockSessionId, mockOptions),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/workouts/sessions/${mockSessionId}/analytics?includeComparisons=true&includePredictions=false`
        );
      });
    });
  });

  describe('Error Cases', () => {
    it('should handle API error responses', async () => {
      const mockError = {
        success: false,
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockError,
      } as Response);

      const { result } = renderHook(
        () => useSessionAnalytics(mockSessionId),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Session not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(
        () => useSessionAnalytics(mockSessionId),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('Caching and Stale Time', () => {
    it('should use appropriate stale time for session analytics', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      const { result } = renderHook(
        () => useSessionAnalytics(mockSessionId),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not refetch immediately (due to stale time)
      const { result: result2 } = renderHook(
        () => useSessionAnalytics(mockSessionId),
        { wrapper: createTestWrapper() }
      );

      expect(mockFetch).toHaveBeenCalledTimes(1); // Should use cache
    });
  });

  describe('Conditional Fetching', () => {
    it('should not fetch when sessionId is not provided', () => {
      const { result } = renderHook(
        () => useSessionAnalytics(''),
        { wrapper: createTestWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not fetch when sessionId is null', () => {
      const { result } = renderHook(
        () => useSessionAnalytics(null as any),
        { wrapper: createTestWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    it('should support manual refetch', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      const { result } = renderHook(
        () => useSessionAnalytics(mockSessionId),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Manual refetch
      result.current.refetch();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Data Transformation', () => {
    it('should transform API response correctly', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          session_stats: { // API uses snake_case
            total_exercises: 8,
            completed_exercises: 6,
            calories_burned: 320,
          },
          performance_metrics: {
            strength_gain: 12,
            endurance_improvement: 8,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const { result } = renderHook(
        () => useSessionAnalytics(mockSessionId),
        { wrapper: createTestWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should transform snake_case to camelCase
      expect(result.current.data).toEqual({
        sessionStats: {
          totalExercises: 8,
          completedExercises: 6,
          caloriesBurned: 320,
        },
        performanceMetrics: {
          strengthGain: 12,
          enduranceImprovement: 8,
        },
      });
    });
  });
});