/**
 * React Query hooks for Workout Sessions API
 * Handles session execution, progress tracking, and real-time updates
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkoutSession, CreateWorkoutSessionRequest } from '@/types/workouts';

// API Client functions from existing API clients
import {
  createWorkoutSession,
  startWorkoutSession,
  pauseWorkoutSession,
  resumeWorkoutSession,
  completeWorkoutSession,
  getWorkoutSession,
  recordSetPerformance,
} from '@/lib/api/workout-sessions';

// Helper API functions
async function getWorkoutSessions(options: WorkoutSessionsQueryOptions = {}) {
  const searchParams = new URLSearchParams();
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/workouts/sessions?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch workout sessions');
  return response.json();
}

async function updateSessionExercise(sessionId: string, exerciseId: string, data: any) {
  const response = await fetch(`/api/workouts/sessions/${sessionId}/exercises/${exerciseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update session exercise');
  return response.json();
}

// Query Keys Factory
export const workoutSessionKeys = {
  all: ['workout-sessions'] as const,
  lists: () => [...workoutSessionKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...workoutSessionKeys.lists(), { filters }] as const,
  details: () => [...workoutSessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...workoutSessionKeys.details(), id] as const,
  active: () => [...workoutSessionKeys.all, 'active'] as const,
  analytics: (sessionId: string) => [...workoutSessionKeys.detail(sessionId), 'analytics'] as const,
  recommendations: (sessionId: string) => [...workoutSessionKeys.detail(sessionId), 'recommendations'] as const,
};

// Query Options
interface WorkoutSessionsQueryOptions {
  page?: number;
  limit?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
  workoutPlanId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Hook to fetch workout sessions with filtering
 */
export function useWorkoutSessions(options: WorkoutSessionsQueryOptions = {}) {
  return useQuery({
    queryKey: workoutSessionKeys.list(options),
    queryFn: () => getWorkoutSessions(options),
    staleTime: 2 * 60 * 1000, // 2 minutes for sessions (more dynamic)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: true,
    select: (data) => ({
      sessions: data.data || [],
      pagination: data.pagination,
      meta: data.meta,
    }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single workout session with real-time updates
 */
export function useWorkoutSession(sessionId: string | null) {
  return useQuery({
    queryKey: workoutSessionKeys.detail(sessionId || ''),
    queryFn: () => sessionId ? getWorkoutSession(sessionId) : Promise.resolve(null),
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds for active sessions
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    refetchInterval: (data) => {
      // Auto-refetch every 30 seconds for active sessions
      if (data?.data?.status === 'in_progress') {
        return 30 * 1000; // 30 seconds
      }
      return false; // No auto-refetch for completed/paused sessions
    },
    select: (data) => data?.data || null,
  });
}

/**
 * Hook to fetch today's active sessions
 */
export function useTodaysSessions() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: workoutSessionKeys.list({ dateFrom: today, dateTo: today }),
    queryFn: () => getWorkoutSessions({
      dateFrom: today,
      dateTo: today,
      status: 'in_progress',
    }),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    retry: 3,
    select: (data) => ({
      sessions: data.data || [],
      count: data.data?.length || 0,
    }),
  });
}

/**
 * Hook to fetch session analytics
 */
export function useSessionAnalytics(sessionId: string | null) {
  return useQuery({
    queryKey: workoutSessionKeys.analytics(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await fetch(`/api/workouts/sessions/${sessionId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch session analytics');
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    select: (data) => data?.data || null,
  });
}

/**
 * Hook to get AI recommendations for a session
 */
export function useSessionRecommendations(
  sessionId: string | null,
  context: {
    type: 'exercise_substitute' | 'rest_time' | 'intensity_adjustment' | 
          'form_improvement' | 'progression' | 'recovery';
    currentExerciseId?: string;
    perceivedExertion?: number;
    formRating?: number;
    availableEquipment?: string[];
    timeConstraint?: number;
    energyLevel?: number;
  }
) {
  return useQuery({
    queryKey: workoutSessionKeys.recommendations(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await fetch(`/api/workouts/sessions/${sessionId}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: context.type,
          context: {
            currentExerciseId: context.currentExerciseId,
            perceivedExertion: context.perceivedExertion,
            formRating: context.formRating,
            availableEquipment: context.availableEquipment,
            timeConstraint: context.timeConstraint,
            energyLevel: context.energyLevel,
          }
        }),
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    },
    enabled: !!sessionId && !!context.type,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1, // AI endpoints might be less reliable
    select: (data) => data?.data || null,
  });
}

/**
 * Hook to create a new workout session
 */
export function useCreateWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkoutSession,
    onSuccess: (data, variables) => {
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.lists() });
      
      // Add the new session to the cache
      if (data.data) {
        queryClient.setQueryData(
          workoutSessionKeys.detail(data.data.id),
          { success: true, data: data.data }
        );
      }

      // Invalidate today's sessions if this is for today
      const today = new Date().toISOString().split('T')[0];
      if (variables.scheduledDate && variables.scheduledDate.startsWith(today)) {
        queryClient.invalidateQueries({ 
          queryKey: workoutSessionKeys.list({ dateFrom: today, dateTo: today })
        });
      }
    },
    onError: (error) => {
      console.error('Failed to create workout session:', error);
    },
  });
}

/**
 * Hook to start a workout session with optimistic updates
 */
export function useStartWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startWorkoutSession,
    // Optimistic update: immediately change status to 'active'
    onMutate: async (sessionId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: workoutSessionKeys.detail(sessionId) });
      await queryClient.cancelQueries({ queryKey: workoutSessionKeys.lists() });

      // Snapshot previous data
      const previousSession = queryClient.getQueryData(workoutSessionKeys.detail(sessionId));
      const previousSessions = queryClient.getQueryData(workoutSessionKeys.lists());

      // Optimistically update session status
      queryClient.setQueryData(workoutSessionKeys.detail(sessionId), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'active',
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      });

      // Update sessions list
      queryClient.setQueryData(workoutSessionKeys.lists(), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((session: WorkoutSession) =>
            session.id === sessionId
              ? { ...session, status: 'active', startedAt: new Date().toISOString() }
              : session
          ),
        };
      });

      return { previousSession, previousSessions };
    },
    onSuccess: (data, sessionId) => {
      // Update the session with real data from server
      if (data) {
        queryClient.setQueryData(workoutSessionKeys.detail(sessionId), data);
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.active() });
    },
    onError: (error, sessionId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          workoutSessionKeys.detail(sessionId), 
          context.previousSession
        );
      }
      if (context?.previousSessions) {
        queryClient.setQueryData(workoutSessionKeys.lists(), context.previousSessions);
      }
      console.error('Failed to start workout session:', error);
    },
    onSettled: (data, error, sessionId) => {
      // Always refresh data after mutation
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.lists() });
    },
  });
}

/**
 * Hook to pause a workout session
 */
export function usePauseWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseWorkoutSession,
    // Optimistic update: immediately change status to 'paused'
    onMutate: async (sessionId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: workoutSessionKeys.detail(sessionId) });
      await queryClient.cancelQueries({ queryKey: workoutSessionKeys.lists() });

      // Snapshot previous data
      const previousSession = queryClient.getQueryData(workoutSessionKeys.detail(sessionId));
      const previousSessions = queryClient.getQueryData(workoutSessionKeys.lists());

      // Optimistically update session status
      queryClient.setQueryData(workoutSessionKeys.detail(sessionId), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'paused',
            pausedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      });

      // Update sessions list
      queryClient.setQueryData(workoutSessionKeys.lists(), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((session: WorkoutSession) =>
            session.id === sessionId
              ? { ...session, status: 'paused', pausedAt: new Date().toISOString() }
              : session
          ),
        };
      });

      return { previousSession, previousSessions };
    },
    onSuccess: (data, sessionId) => {
      // Update the session with real data from server
      if (data) {
        queryClient.setQueryData(workoutSessionKeys.detail(sessionId), data);
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.active() });
    },
    onError: (error, sessionId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          workoutSessionKeys.detail(sessionId), 
          context.previousSession
        );
      }
      if (context?.previousSessions) {
        queryClient.setQueryData(workoutSessionKeys.lists(), context.previousSessions);
      }
      console.error('Failed to pause workout session:', error);
    },
    onSettled: (data, error, sessionId) => {
      // Always refresh data after mutation
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.lists() });
    },
  });
}

/**
 * Hook to resume a workout session
 */
export function useResumeWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeWorkoutSession,
    // Optimistic update: immediately change status to 'active'
    onMutate: async (sessionId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: workoutSessionKeys.detail(sessionId) });
      await queryClient.cancelQueries({ queryKey: workoutSessionKeys.lists() });

      // Snapshot previous data
      const previousSession = queryClient.getQueryData(workoutSessionKeys.detail(sessionId));
      const previousSessions = queryClient.getQueryData(workoutSessionKeys.lists());

      // Optimistically update session status
      queryClient.setQueryData(workoutSessionKeys.detail(sessionId), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'active',
            resumedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      });

      // Update sessions list
      queryClient.setQueryData(workoutSessionKeys.lists(), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((session: WorkoutSession) =>
            session.id === sessionId
              ? { ...session, status: 'active', resumedAt: new Date().toISOString() }
              : session
          ),
        };
      });

      return { previousSession, previousSessions };
    },
    onSuccess: (data, sessionId) => {
      // Update the session with real data from server
      if (data) {
        queryClient.setQueryData(workoutSessionKeys.detail(sessionId), data);
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.active() });
    },
    onError: (error, sessionId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          workoutSessionKeys.detail(sessionId), 
          context.previousSession
        );
      }
      if (context?.previousSessions) {
        queryClient.setQueryData(workoutSessionKeys.lists(), context.previousSessions);
      }
      console.error('Failed to resume workout session:', error);
    },
    onSettled: (data, error, sessionId) => {
      // Always refresh data after mutation
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.lists() });
    },
  });
}

/**
 * Hook to complete a workout session
 */
export function useCompleteWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: any }) =>
      completeWorkoutSession(sessionId, data),
    // Optimistic update: immediately change status to 'completed'
    onMutate: async ({ sessionId, data: completionData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: workoutSessionKeys.detail(sessionId) });
      await queryClient.cancelQueries({ queryKey: workoutSessionKeys.lists() });

      // Snapshot previous data
      const previousSession = queryClient.getQueryData(workoutSessionKeys.detail(sessionId));
      const previousSessions = queryClient.getQueryData(workoutSessionKeys.lists());

      // Optimistically update session status and completion data
      queryClient.setQueryData(workoutSessionKeys.detail(sessionId), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'completed',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Merge in completion data (duration, notes, etc.)
            ...completionData,
          },
        };
      });

      // Update sessions list
      queryClient.setQueryData(workoutSessionKeys.lists(), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((session: WorkoutSession) =>
            session.id === sessionId
              ? { 
                  ...session, 
                  status: 'completed', 
                  completedAt: new Date().toISOString(),
                  ...completionData,
                }
              : session
          ),
        };
      });

      return { previousSession, previousSessions };
    },
    onSuccess: (data, variables) => {
      // Update session status and stop auto-refetching with real server data
      if (data) {
        queryClient.setQueryData(
          workoutSessionKeys.detail(variables.sessionId),
          data
        );
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.active() });
      
      // Invalidate analytics to refresh completion data
      queryClient.invalidateQueries({ 
        queryKey: workoutSessionKeys.analytics(variables.sessionId) 
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          workoutSessionKeys.detail(variables.sessionId), 
          context.previousSession
        );
      }
      if (context?.previousSessions) {
        queryClient.setQueryData(workoutSessionKeys.lists(), context.previousSessions);
      }
      console.error('Failed to complete workout session:', error);
    },
    onSettled: (data, error, variables) => {
      // Always refresh data after mutation
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.detail(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: workoutSessionKeys.lists() });
    },
  });
}

/**
 * Hook to update exercise progress within a session
 */
export function useUpdateSessionExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, exerciseId, data }: { 
      sessionId: string; 
      exerciseId: string; 
      data: any 
    }) => updateSessionExercise(sessionId, exerciseId, data),
    onMutate: async ({ sessionId, exerciseId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: workoutSessionKeys.detail(sessionId) 
      });

      // Snapshot the previous value
      const previousSession = queryClient.getQueryData(
        workoutSessionKeys.detail(sessionId)
      );

      // Optimistically update the session
      queryClient.setQueryData(
        workoutSessionKeys.detail(sessionId),
        (old: any) => {
          if (!old?.data) return old;
          
          // Update the specific exercise in the session
          const updatedSession = { ...old.data };
          
          // Update exercise progress (this would depend on your session structure)
          if (updatedSession.exercises) {
            const exerciseIndex = updatedSession.exercises.findIndex(
              (ex: any) => ex.id === exerciseId
            );
            if (exerciseIndex >= 0) {
              updatedSession.exercises[exerciseIndex] = {
                ...updatedSession.exercises[exerciseIndex],
                ...data,
                updatedAt: new Date(),
              };
            }
          }

          return { ...old, data: updatedSession };
        }
      );

      return { previousSession };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          workoutSessionKeys.detail(variables.sessionId),
          context.previousSession
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ 
        queryKey: workoutSessionKeys.detail(variables.sessionId) 
      });
      
      // Invalidate analytics to reflect changes
      queryClient.invalidateQueries({ 
        queryKey: workoutSessionKeys.analytics(variables.sessionId) 
      });
    },
  });
}