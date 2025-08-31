/**
 * Custom hooks for fetching workout-related data
 */

import { useState, useEffect } from 'react';

export interface WorkoutStats {
  totalWorkouts: number;
  weeklyWorkouts: number;
  currentStreak: number;
  totalMinutes: number;
  totalHours: number;
  averageIntensity: number;
  completionRate: number;
}

export interface WorkoutTrends {
  workouts: { value: number; direction: 'up' | 'down' | 'neutral' };
  streak: { value: number; direction: 'up' | 'down' | 'neutral' };
  intensity: { value: number; direction: 'up' | 'down' | 'neutral' };
  completion: { value: number; direction: 'up' | 'down' | 'neutral' };
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  durationWeeks: number;
  sessionsPerWeek: number;
  fitnessGoals: string[];
  targetFitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedSessionDuration: number;
  status: 'active' | 'draft' | 'completed' | 'paused';
  planData: any;
  weeklySchedule: any;
  version: number;
  isTemplate: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutPlanId?: string;
  name: string;
  sessionType: 'workout' | 'assessment' | 'recovery';
  scheduledDate: Date;
  scheduledTime?: string;
  scheduledDuration: number;
  actualDuration?: number;
  completedAt?: Date;
  sessionData: {
    totalExercises: number;
    estimatedDuration: number;
    targetMuscleGroups: string[];
    equipmentNeeded: string[];
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  warmUpExercises: any[];
  mainExercises: any[];
  coolDownExercises: any[];
  completionPercentage: number;
  effortRating?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  equipmentUsed: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hook to fetch workout statistics
 */
export function useWorkoutStats() {
  const [stats, setStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    weeklyWorkouts: 0,
    currentStreak: 0,
    totalMinutes: 0,
    totalHours: 0,
    averageIntensity: 0,
    completionRate: 0,
  });
  const [trends, setTrends] = useState<WorkoutTrends>({
    workouts: { value: 0, direction: 'neutral' },
    streak: { value: 0, direction: 'neutral' },
    intensity: { value: 0, direction: 'neutral' },
    completion: { value: 0, direction: 'neutral' },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/workouts/stats');
        if (!response.ok) {
          throw new Error(`Failed to fetch workout stats: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data.stats);
          if (result.data.trends) {
            setTrends(result.data.trends);
          }
        } else {
          throw new Error(result.error || 'Failed to load workout statistics');
        }
      } catch (err) {
        console.error('Error fetching workout stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, trends, isLoading, error };
}

/**
 * Hook to fetch workout plans
 */
export function useWorkoutPlans() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/workouts/plans');
        if (!response.ok) {
          throw new Error(`Failed to fetch workout plans: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          setPlans(result.data);
        } else {
          throw new Error(result.error || 'Failed to load workout plans');
        }
      } catch (err) {
        console.error('Error fetching workout plans:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Set empty array on error so UI doesn't break
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, []);

  return { plans, isLoading, error };
}

/**
 * Hook to fetch workout sessions
 */
export function useWorkoutSessions() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/workouts/sessions');
        if (!response.ok) {
          throw new Error(`Failed to fetch workout sessions: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          // Convert date strings to Date objects
          const sessionsWithDates = result.data.map((session: any) => ({
            ...session,
            scheduledDate: new Date(session.scheduledDate),
            completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
          }));
          setSessions(sessionsWithDates);
        } else {
          throw new Error(result.error || 'Failed to load workout sessions');
        }
      } catch (err) {
        console.error('Error fetching workout sessions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Set empty array on error so UI doesn't break
        setSessions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSessions();
  }, []);

  return { sessions, isLoading, error };
}

/**
 * Hook to get today's sessions
 */
export function useTodaysSessions() {
  const { sessions, isLoading, error } = useWorkoutSessions();

  const todaysSessions = sessions.filter((session) => {
    const today = new Date().toDateString();
    const sessionDate = new Date(session.scheduledDate).toDateString();
    return sessionDate === today;
  });

  return { sessions: todaysSessions, isLoading, error };
}