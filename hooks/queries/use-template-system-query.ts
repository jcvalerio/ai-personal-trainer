/**
 * React Query hooks for Template System API (Phase 3)
 * Handles workout templates and plan generation from templates
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkoutPlan } from '@/types/workouts';

// Template System API functions (Phase 3 endpoints)
async function getWorkoutTemplates(options: TemplateQueryOptions = {}) {
  const searchParams = new URLSearchParams();
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/workouts/templates?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch workout templates');
  return response.json();
}

async function createWorkoutTemplate(templateData: any) {
  const response = await fetch('/api/workouts/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(templateData),
  });
  if (!response.ok) throw new Error('Failed to create workout template');
  return response.json();
}

async function createPlanFromTemplate(request: CreatePlanFromTemplateRequest) {
  const response = await fetch('/api/workouts/plans/from-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to create plan from template');
  return response.json();
}

// Query Keys Factory
export const templateSystemKeys = {
  all: ['template-system'] as const,
  templates: () => [...templateSystemKeys.all, 'templates'] as const,
  templatesList: (filters: Record<string, unknown>) => 
    [...templateSystemKeys.templates(), { filters }] as const,
  categories: () => [...templateSystemKeys.all, 'categories'] as const,
  featured: () => [...templateSystemKeys.all, 'featured'] as const,
  planGeneration: () => [...templateSystemKeys.all, 'plan-generation'] as const,
};

// Query Options Interfaces
interface TemplateQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  templateCategory?: string;
  targetFitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  featured?: boolean;
  search?: string;
  public?: boolean;
}

interface CreatePlanFromTemplateRequest {
  templateId: string;
  name: string;
  description?: string;
  personalizations?: {
    targetFitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    durationWeeks?: number;
    sessionsPerWeek?: number;
    estimatedSessionDuration?: number;
    fitnessGoals?: string[];
    modifications?: {
      equipmentSubstitutions?: Record<string, string>;
      exerciseModifications?: Record<string, any>;
      intensityAdjustments?: Record<string, number>;
    };
    preferences?: {
      focusAreas?: string[];
      avoidedExercises?: string[];
      preferredEquipment?: string[];
      timeConstraints?: {
        maxSessionDuration?: number;
        preferredDays?: string[];
        unavailableDays?: string[];
      };
    };
  };
  startDate?: string;
}

/**
 * Hook to fetch workout templates with filtering
 */
export function useWorkoutTemplates(options: TemplateQueryOptions = {}) {
  return useQuery({
    queryKey: templateSystemKeys.templatesList(options),
    queryFn: () => getWorkoutTemplates(options),
    staleTime: 15 * 60 * 1000, // 15 minutes (templates are relatively static)
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    refetchOnWindowFocus: false, // Templates don't change often
    select: (data) => ({
      templates: data.data || [],
      pagination: data.pagination,
      meta: data.meta,
    }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch featured workout templates
 */
export function useFeaturedTemplates() {
  return useQuery({
    queryKey: templateSystemKeys.featured(),
    queryFn: () => getWorkoutTemplates({ featured: true, limit: 12 }),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 3,
    select: (data) => data.data || [],
  });
}

/**
 * Hook to fetch template categories
 */
export function useTemplateCategories() {
  return useQuery({
    queryKey: templateSystemKeys.categories(),
    queryFn: async () => {
      const response = await fetch('/api/workouts/templates/categories');
      if (!response.ok) throw new Error('Failed to fetch template categories');
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
    select: (data) => data.data || [],
  });
}

/**
 * Hook to create a new workout template
 */
export function useCreateWorkoutTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkoutTemplate,
    onSuccess: (data, variables) => {
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: templateSystemKeys.templates() });
      
      // If it's featured, invalidate featured templates
      if (variables.featured) {
        queryClient.invalidateQueries({ queryKey: templateSystemKeys.featured() });
      }

      // Invalidate categories if this introduces a new category
      queryClient.invalidateQueries({ queryKey: templateSystemKeys.categories() });
    },
    onError: (error) => {
      console.error('Failed to create workout template:', error);
    },
  });
}

/**
 * Hook to create a personalized plan from a template
 */
export function useCreatePlanFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlanFromTemplate,
    onMutate: async (variables) => {
      // Show optimistic UI for plan creation
      return { templateId: variables.templateId, planName: variables.name };
    },
    onSuccess: (data, variables, context) => {
      // Invalidate workout plans (from the workout plans query)
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      
      // Cache the new plan if we have it
      if (data.data?.id) {
        queryClient.setQueryData(
          ['workout-plans', 'detail', data.data.id],
          { success: true, data: data.data }
        );
      }
    },
    onError: (error, variables, context) => {
      console.error('Failed to create plan from template:', error);
      // Could show user-friendly error message
    },
  });
}

/**
 * Hook to get template recommendations based on user preferences
 */
export function useTemplateRecommendations(preferences: {
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  fitnessGoals?: string[];
  availableEquipment?: string[];
  timeAvailable?: number; // minutes per session
  sessionsPerWeek?: number;
  focusAreas?: string[];
}) {
  return useQuery({
    queryKey: [...templateSystemKeys.all, 'recommendations', preferences],
    queryFn: async () => {
      const response = await fetch('/api/workouts/templates/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      if (!response.ok) throw new Error('Failed to fetch template recommendations');
      return response.json();
    },
    enabled: !!(preferences.fitnessLevel || preferences.fitnessGoals?.length),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    select: (data) => data.data || [],
  });
}

/**
 * Hook to get template preview/details for customization
 */
export function useTemplatePreview(templateId: string | null) {
  return useQuery({
    queryKey: [...templateSystemKeys.templates(), 'preview', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const response = await fetch(`/api/workouts/templates/${templateId}/preview`);
      if (!response.ok) throw new Error('Failed to fetch template preview');
      return response.json();
    },
    enabled: !!templateId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    select: (data) => data?.data || null,
  });
}

/**
 * Hook for template-based plan generation with personalization
 */
export function usePersonalizedPlanGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlanFromTemplate,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for workout plans
      await queryClient.cancelQueries({ queryKey: ['workout-plans'] });

      // Return context for rollback
      return { 
        templateId: variables.templateId, 
        personalizations: variables.personalizations 
      };
    },
    onSuccess: (data, variables) => {
      // Optimistically add the new plan to the workout plans cache
      queryClient.setQueriesData(
        { queryKey: ['workout-plans', 'list'] },
        (old: any) => {
          if (!old?.data) return old;
          
          const newPlan = {
            ...data.data,
            createdAt: new Date(),
            status: 'active',
          };

          return {
            ...old,
            data: [newPlan, ...old.data],
          };
        }
      );

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
    },
    onError: (error, variables, context) => {
      console.error('Failed to generate personalized plan:', error);
      // The optimistic update will be automatically rolled back
    },
    onSettled: () => {
      // Always invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
    },
  });
}

/**
 * Hook to search templates by multiple criteria
 */
export function useTemplateSearch(filters: {
  category?: string;
  fitnessLevel?: string[];
  duration?: { min?: number; max?: number };
  equipment?: string[];
  goals?: string[];
}) {
  return useQuery({
    queryKey: [...templateSystemKeys.templates(), 'search', filters],
    queryFn: () => getWorkoutTemplates({
      templateCategory: filters.category,
      targetFitnessLevel: filters.fitnessLevel?.[0] as any,
      // Additional filtering would be handled server-side
    }),
    enabled: Object.values(filters).some(value => 
      Array.isArray(value) ? value.length > 0 : value !== undefined
    ),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    select: (data) => ({
      templates: data.data || [],
      count: data.data?.length || 0,
      filters: filters,
    }),
  });
}