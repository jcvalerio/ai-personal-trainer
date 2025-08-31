/**
 * Test Utilities
 * Reusable testing helpers and wrappers
 */

import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';

// Mock messages for internationalization
const mockMessages = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
  },
  workouts: {
    title: 'Workouts',
    noWorkouts: 'No workouts found',
    createWorkout: 'Create Workout',
  },
  dashboard: {
    title: 'Dashboard',
    stats: 'Statistics',
    recentActivity: 'Recent Activity',
  }
};

// Create a test wrapper component
interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  locale?: string;
}

function TestProviders({ 
  children, 
  queryClient,
  locale = 'en'
}: TestProvidersProps) {
  // Create a new QueryClient for each test to avoid conflicts
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Disable cache between tests
        staleTime: 0, // Always refetch in tests
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={client}>
      <NextIntlClientProvider 
        locale={locale}
        messages={mockMessages}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  locale?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient, locale, ...renderOptions } = options;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders queryClient={queryClient} locale={locale}>
      {children}
    </TestProviders>
  );

  return {
    ...render(ui, { wrapper, ...renderOptions }),
  };
}

// Helper to create a fresh QueryClient for tests
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Mock user data for tests
export const mockUser = {
  id: 'test-user-id',
  clerkId: 'test-user-clerk-id',
  email: 'test@example.com',
  name: 'Test User',
};

// Mock workout session data
export const mockWorkoutSession = {
  id: 'test-session-123',
  userId: mockUser.id,
  name: 'Test Workout Session',
  status: 'completed' as const,
  sessionType: 'workout' as const,
  scheduledDuration: 60,
  actualDuration: 58,
  completionPercentage: 95,
  effortRating: 8,
  energyLevelBefore: 7,
  energyLevelAfter: 6,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T11:00:00Z',
};

// Mock analytics data
export const mockSessionAnalytics = {
  sessionId: mockWorkoutSession.id,
  completionStats: {
    exercisesCompleted: 6,
    totalExercises: 8,
    completionPercentage: 75,
  },
  performanceMetrics: {
    strengthGain: 12,
    enduranceImprovement: 8,
    consistency: 85,
    intensityScore: 75,
  },
  effortAnalysis: {
    averagePerceivedExertion: 7.2,
    averageFormRating: 4.1,
    effortDistribution: {
      low: 10,
      medium: 60,
      high: 30,
    },
  },
  timeAnalysis: {
    totalDuration: 2700,
    actualRestTime: 900,
    exerciseTime: 1800,
    efficiencyScore: 88,
  },
  calorieEstimation: {
    estimated: 320,
    method: 'METs calculation',
    factors: ['body_weight', 'exercise_intensity', 'duration'],
  },
};

// Mock dashboard stats
export const mockDashboardStats = {
  workoutsThisWeek: 3,
  totalCompletedWorkouts: 45,
  activeWorkoutPlans: 2,
  totalWorkoutHours: 67.5,
  currentStreak: 5,
  longestStreak: 12,
  goalProgress: {
    weeklyGoal: 4,
    monthlyGoal: 16,
    weeklyProgress: 75,
    monthlyProgress: 68,
  },
};

// Test helpers
export const waitForApiCall = () => new Promise(resolve => setTimeout(resolve, 100));

export const mockSuccessResponse = <T>(data: T) => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
  },
});

export const mockErrorResponse = (error: string, code: string) => ({
  success: false,
  error,
  code,
  meta: {
    timestamp: new Date().toISOString(),
  },
});

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Re-export render as customRender to maintain compatibility
export { renderWithProviders as render };