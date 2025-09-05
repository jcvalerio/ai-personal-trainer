/**
 * React Query hooks for Workout Plans API
 * Replaces manual data fetching with React Query patterns
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkoutPlan, AiGeneratedWorkoutSession } from '@/types/workouts';

// API Client functions (reusing existing ones)
import { 
  getWorkoutPlans,
  createWorkoutPlan,
  createWorkoutPlanFromAi,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getWorkoutPlan
} from '@/lib/api/workout-plans';

// Query Keys Factory
export const workoutPlanKeys = {
  all: ['workout-plans'] as const,
  lists: () => [...workoutPlanKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...workoutPlanKeys.lists(), { filters }] as const,
  details: () => [...workoutPlanKeys.all, 'detail'] as const,
  detail: (id: string) => [...workoutPlanKeys.details(), id] as const,
  templates: () => [...workoutPlanKeys.all, 'templates'] as const,
};

// Query Options
interface WorkoutPlansQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'draft' | 'completed' | 'paused';
  isTemplate?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Hook to fetch workout plans with filtering and pagination
 */
export function useWorkoutPlans(options: WorkoutPlansQueryOptions = {}) {
  return useQuery({
    queryKey: workoutPlanKeys.list(options),
    queryFn: () => getWorkoutPlans(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    refetchOnWindowFocus: true,
    select: (data) => ({
      plans: data.data || [],
      pagination: data.pagination,
      meta: data.meta,
    }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single workout plan
 */
export function useWorkoutPlan(planId: string | null) {
  return useQuery({
    queryKey: workoutPlanKeys.detail(planId || ''),
    queryFn: () => planId ? getWorkoutPlan(planId) : Promise.resolve(null),
    enabled: !!planId, // Only run query if planId exists
    staleTime: 10 * 60 * 1000, // 10 minutes for individual plans
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    select: (data) => data?.data || null,
  });
}

/**
 * Hook to fetch workout plan templates
 */
export function useWorkoutPlanTemplates(options: WorkoutPlansQueryOptions = {}) {
  return useQuery({
    queryKey: workoutPlanKeys.templates(),
    queryFn: () => getWorkoutPlans({ ...options, isTemplate: true }),
    staleTime: 15 * 60 * 1000, // Templates change less frequently
    gcTime: 30 * 60 * 1000, // Keep templates cached longer
    retry: 3,
    select: (data) => ({
      templates: data.data || [],
      pagination: data.pagination,
    }),
  });
}

/**
 * Hook to create a new AI-generated workout plan with optimistic updates
 */
export function useCreateAiWorkoutPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      aiWorkout, 
      preferences 
    }: { 
      aiWorkout: AiGeneratedWorkoutSession; 
      preferences?: {
        daysPerWeek?: number;
        fitnessGoals?: string[];
        durationWeeks?: number;
      };
    }) => createWorkoutPlanFromAi(aiWorkout, preferences),
    
    // Optimistic update: immediately add the plan to the UI
    onMutate: async ({ aiWorkout }) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: workoutPlanKeys.lists() });

      // Snapshot previous data
      const previousPlans = queryClient.getQueryData(workoutPlanKeys.lists());

      // Optimistically update the plans list
      const optimisticPlan: WorkoutPlan = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: aiWorkout.name,
        description: aiWorkout.description,
        targetFitnessLevel: aiWorkout.sessionData.difficultyLevel,
        durationWeeks: 4,
        sessionsPerWeek: 3,
        status: 'draft',
        isTemplate: false,
        fitnessGoals: aiWorkout.sessionData.targetMuscleGroups,
        estimatedDuration: aiWorkout.sessionData.estimatedDuration,
        difficulty: aiWorkout.sessionData.difficultyLevel,
        userId: '', // Will be set by server
        organizationId: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add default values for required fields
        weeklySchedule: [],
        sessionTemplates: {},
        tags: [],
        equipment: aiWorkout.sessionData.equipmentNeeded,
        muscleGroups: aiWorkout.sessionData.targetMuscleGroups,
        isPublic: false,
        isActive: true,
      };

      queryClient.setQueryData(workoutPlanKeys.lists(), (old: any) => {
        if (!old) return { success: true, data: [optimisticPlan] };
        return {
          ...old,
          data: [optimisticPlan, ...(old.data || [])],
        };
      });

      // Return context with snapshot for rollback
      return { previousPlans };
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch to get real data from server
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.lists() });
      
      // Add the real plan data to the cache
      if (data.data) {
        queryClient.setQueryData(
          workoutPlanKeys.detail(data.data.id),
          { success: true, data: data.data }
        );
      }
    },
    onError: (error, aiWorkout, context) => {
      // Rollback optimistic update on error
      if (context?.previousPlans) {
        queryClient.setQueryData(workoutPlanKeys.lists(), context.previousPlans);
      }
      console.error('Failed to create AI workout plan:', error);
    },
    // Always refetch after mutation completes (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.lists() });
    },
  });
}

/**
 * Hook to create a new workout plan with optimistic updates
 */
export function useCreateWorkoutPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkoutPlan,
    // Optimistic update: immediately add the plan to the UI
    onMutate: async (newPlan) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: workoutPlanKeys.lists() });

      // Snapshot previous data
      const previousPlans = queryClient.getQueryData(workoutPlanKeys.lists());

      // Optimistically update the plans list
      const optimisticPlan: WorkoutPlan = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: newPlan.name,
        description: newPlan.description,
        targetFitnessLevel: newPlan.targetFitnessLevel,
        durationWeeks: newPlan.durationWeeks,
        sessionsPerWeek: newPlan.sessionsPerWeek,
        status: 'draft',
        isTemplate: newPlan.isTemplate || false,
        fitnessGoals: newPlan.fitnessGoals || [],
        estimatedDuration: newPlan.estimatedDuration || 60,
        difficulty: 'intermediate',
        userId: '', // Will be set by server
        organizationId: newPlan.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add default values for required fields
        weeklySchedule: [],
        sessionTemplates: {},
        tags: [],
        equipment: [],
        muscleGroups: [],
        isPublic: false,
        isActive: true,
      };

      queryClient.setQueryData(workoutPlanKeys.lists(), (old: any) => {
        if (!old) return { success: true, data: [optimisticPlan] };
        return {
          ...old,
          data: [optimisticPlan, ...(old.data || [])],
        };
      });

      // Return context with snapshot for rollback
      return { previousPlans };
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch to get real data from server
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.lists() });
      
      // Add the real plan data to the cache
      if (data.data) {
        queryClient.setQueryData(
          workoutPlanKeys.detail(data.data.id),
          { success: true, data: data.data }
        );
      }

      // If it's a template, invalidate templates as well
      if (variables.isTemplate) {
        queryClient.invalidateQueries({ queryKey: workoutPlanKeys.templates() });
      }
    },
    onError: (error, newPlan, context) => {
      // Rollback optimistic update on error
      if (context?.previousPlans) {
        queryClient.setQueryData(workoutPlanKeys.lists(), context.previousPlans);
      }
      console.error('Failed to create workout plan:', error);
    },
    // Always refetch after mutation completes (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.lists() });
    },
  });
}

/**
 * Hook to update a workout plan with optimistic updates
 */
export function useUpdateWorkoutPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: any }) =>
      updateWorkoutPlan(planId, data),
    // Optimistic update: immediately update the UI
    onMutate: async ({ planId, data: updateData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: workoutPlanKeys.detail(planId) });
      await queryClient.cancelQueries({ queryKey: workoutPlanKeys.lists() });

      // Snapshot previous data
      const previousPlan = queryClient.getQueryData(workoutPlanKeys.detail(planId));
      const previousPlans = queryClient.getQueryData(workoutPlanKeys.lists());

      // Optimistically update the individual plan
      queryClient.setQueryData(workoutPlanKeys.detail(planId), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...updateData,
            updatedAt: new Date().toISOString(),
          },
        };
      });

      // Optimistically update the plans list
      queryClient.setQueryData(workoutPlanKeys.lists(), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((plan: WorkoutPlan) => 
            plan.id === planId 
              ? { ...plan, ...updateData, updatedAt: new Date().toISOString() }
              : plan
          ),
        };
      });

      // Return context with snapshots for rollback
      return { previousPlan, previousPlans };
    },
    onSuccess: (data, variables) => {
      // Update with real data from server
      if (data.data) {
        queryClient.setQueryData(
          workoutPlanKeys.detail(variables.planId),
          { success: true, data: data.data }
        );
      }

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: workoutPlanKeys.detail(variables.planId) 
      });

      // If it affects templates, invalidate those too
      if (variables.data.isTemplate) {
        queryClient.invalidateQueries({ queryKey: workoutPlanKeys.templates() });
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousPlan) {
        queryClient.setQueryData(
          workoutPlanKeys.detail(variables.planId), 
          context.previousPlan
        );
      }
      if (context?.previousPlans) {
        queryClient.setQueryData(workoutPlanKeys.lists(), context.previousPlans);
      }
      console.error('Failed to update workout plan:', error);
    },
    // Always refetch after mutation completes
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.lists() });
    },
  });
}

/**
 * Hook to delete a workout plan with optimistic updates
 */
export function useDeleteWorkoutPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkoutPlan,
    // Optimistic update: immediately remove from UI
    onMutate: async (planId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: workoutPlanKeys.lists() });
      await queryClient.cancelQueries({ queryKey: workoutPlanKeys.templates() });
      await queryClient.cancelQueries({ queryKey: workoutPlanKeys.detail(planId) });

      // Snapshot previous data
      const previousPlans = queryClient.getQueryData(workoutPlanKeys.lists());
      const previousTemplates = queryClient.getQueryData(workoutPlanKeys.templates());
      const previousPlan = queryClient.getQueryData(workoutPlanKeys.detail(planId));

      // Optimistically remove from plans list
      queryClient.setQueryData(workoutPlanKeys.lists(), (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.filter((plan: WorkoutPlan) => plan.id !== planId),
        };
      });

      // Optimistically remove from templates if applicable
      queryClient.setQueryData(workoutPlanKeys.templates(), (old: any) => {
        if (!old || !old.templates) return old;
        return {
          ...old,
          templates: old.templates.filter((plan: WorkoutPlan) => plan.id !== planId),
        };
      });

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: workoutPlanKeys.detail(planId) });

      // Return context for rollback
      return { previousPlans, previousTemplates, previousPlan, planId };
    },
    onSuccess: (data, planId) => {
      // Ensure removal from all relevant queries
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.templates() });
      queryClient.removeQueries({ queryKey: workoutPlanKeys.detail(planId) });
    },
    onError: (error, planId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousPlans) {
        queryClient.setQueryData(workoutPlanKeys.lists(), context.previousPlans);
      }
      if (context?.previousTemplates) {
        queryClient.setQueryData(workoutPlanKeys.templates(), context.previousTemplates);
      }
      if (context?.previousPlan && context?.planId) {
        queryClient.setQueryData(
          workoutPlanKeys.detail(context.planId), 
          context.previousPlan
        );
      }
      console.error('Failed to delete workout plan:', error);
    },
    // Always refetch after mutation completes
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workoutPlanKeys.templates() });
    },
  });
}

