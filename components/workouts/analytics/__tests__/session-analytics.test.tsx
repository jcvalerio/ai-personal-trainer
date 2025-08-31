/**
 * Session Analytics Component Tests
 * TDD Red Phase - Failing tests to drive implementation
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionAnalytics } from '../session-analytics';
import { useSessionAnalytics } from '@/hooks/queries/use-session-analytics';

// Mock the custom hook
jest.mock('@/hooks/queries/use-session-analytics');

const mockUseSessionAnalytics = useSessionAnalytics as jest.MockedFunction<typeof useSessionAnalytics>;

// Test wrapper with React Query
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('SessionAnalytics', () => {
  const mockSessionId = 'test-session-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading state when analytics data is loading', () => {
      mockUseSessionAnalytics.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <TestWrapper>
          <SessionAnalytics sessionId={mockSessionId} />
        </TestWrapper>
      );

      expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error state when analytics fetch fails', () => {
      const mockError = new Error('Failed to fetch session analytics');
      
      mockUseSessionAnalytics.mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
        refetch: jest.fn(),
      });

      render(
        <TestWrapper>
          <SessionAnalytics sessionId={mockSessionId} />
        </TestWrapper>
      );

      expect(screen.getByText(/failed to load analytics/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const mockRefetch = jest.fn();
      const mockError = new Error('Failed to fetch session analytics');
      
      mockUseSessionAnalytics.mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <SessionAnalytics sessionId={mockSessionId} />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.click();

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Analytics Display', () => {
    const mockAnalyticsData = {
      sessionStats: {
        totalExercises: 8,
        completedExercises: 6,
        totalSets: 24,
        completedSets: 18,
        totalReps: 180,
        completedReps: 135,
        averageHeartRate: 145,
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
      comparisonData: {
        previousSession: {
          caloriesBurned: 285,
          duration: 42,
          effortRating: 7.0,
        },
        personalBests: [
          { exercise: 'Bench Press', weight: 185, reps: 8 },
          { exercise: 'Squat', weight: 225, reps: 10 },
        ],
      },
    };

    it('should display session statistics when data is loaded', () => {
      mockUseSessionAnalytics.mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <TestWrapper>
          <SessionAnalytics sessionId={mockSessionId} />
        </TestWrapper>
      );

      // Check session stats
      expect(screen.getByText('8')).toBeInTheDocument(); // Total exercises
      expect(screen.getByText('6')).toBeInTheDocument(); // Completed exercises
      expect(screen.getByText('320')).toBeInTheDocument(); // Calories burned
      expect(screen.getByText('45')).toBeInTheDocument(); // Duration
      expect(screen.getByText('7.5')).toBeInTheDocument(); // Effort rating
    });

    it('should display performance metrics', () => {
      mockUseSessionAnalytics.mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <TestWrapper>
          <SessionAnalytics sessionId={mockSessionId} />
        </TestWrapper>
      );

      expect(screen.getByText(/strength gain/i)).toBeInTheDocument();
      expect(screen.getByText(/12%/)).toBeInTheDocument();
      expect(screen.getByText(/endurance improvement/i)).toBeInTheDocument();
      expect(screen.getByText(/8%/)).toBeInTheDocument();
    });

    it('should display comparison with previous session', () => {
      mockUseSessionAnalytics.mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <TestWrapper>
          <SessionAnalytics sessionId={mockSessionId} />
        </TestWrapper>
      );

      expect(screen.getByText(/vs previous session/i)).toBeInTheDocument();
      expect(screen.getByText(/\+35 cal/i)).toBeInTheDocument(); // 320 - 285 = +35
      expect(screen.getByText(/\+3 min/i)).toBeInTheDocument(); // 45 - 42 = +3
    });

    it('should display personal bests', () => {
      mockUseSessionAnalytics.mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <TestWrapper>
          <SessionAnalytics sessionId={mockSessionId} />
        </TestWrapper>
      );

      expect(screen.getByText(/personal bests/i)).toBeInTheDocument();
      expect(screen.getByText(/bench press/i)).toBeInTheDocument();
      expect(screen.getByText(/185 lbs/i)).toBeInTheDocument();
      expect(screen.getByText(/squat/i)).toBeInTheDocument();
      expect(screen.getByText(/225 lbs/i)).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should display compact version when compact prop is true', () => {
      mockUseSessionAnalytics.mockReturnValue({
        data: {
          sessionStats: {
            totalExercises: 8,
            completedExercises: 6,
            caloriesBurned: 320,
            duration: 45,
            effortRating: 7.5,
          },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(
        <TestWrapper>
          <SessionAnalytics sessionId={mockSessionId} compact />
        </TestWrapper>
      );

      // In compact mode, should show fewer details
      expect(screen.queryByText(/performance metrics/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/personal bests/i)).not.toBeInTheDocument();
      
      // But still show key stats
      expect(screen.getByText('320')).toBeInTheDocument(); // Calories
      expect(screen.getByText('45')).toBeInTheDocument(); // Duration
    });
  });

  describe('Real-time Updates', () => {
    it('should update analytics when session data changes', async () => {
      const mockRefetch = jest.fn();
      
      mockUseSessionAnalytics.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { rerender } = render(
        <TestWrapper>
          <SessionAnalytics sessionId={mockSessionId} />
        </TestWrapper>
      );

      // Simulate session update
      rerender(
        <TestWrapper>
          <SessionAnalytics sessionId={mockSessionId} triggerRefresh />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });
});