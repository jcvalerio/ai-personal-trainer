/**
 * React Query hooks for Exercise Library API (Phase 3)
 * Handles the new exercise library endpoints with search, filtering, and CRUD operations
 */
'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Exercise, CreateExerciseRequest } from '@/types/workouts';

// Exercise Library API functions (Phase 3 endpoints)
async function getExercises(options: ExercisesQueryOptions = {}) {
  const searchParams = new URLSearchParams();
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const response = await fetch(`/api/exercises?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch exercises');
  return response.json();
}

async function createExercise(exerciseData: CreateExerciseRequest) {
  const response = await fetch('/api/exercises', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exerciseData),
  });
  if (!response.ok) throw new Error('Failed to create exercise');
  return response.json();
}

async function searchExercises(searchOptions: ExerciseSearchOptions) {
  const searchParams = new URLSearchParams();
  
  Object.entries(searchOptions).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, JSON.stringify(value));
      } else if (typeof value === 'object') {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const response = await fetch(`/api/exercises/search?${searchParams}`);
  if (!response.ok) throw new Error('Failed to search exercises');
  return response.json();
}

// Query Keys Factory
export const exerciseLibraryKeys = {
  all: ['exercise-library'] as const,
  lists: () => [...exerciseLibraryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...exerciseLibraryKeys.lists(), { filters }] as const,
  search: () => [...exerciseLibraryKeys.all, 'search'] as const,
  searchQuery: (query: string, filters: Record<string, unknown>) => 
    [...exerciseLibraryKeys.search(), { query, filters }] as const,
  categories: () => [...exerciseLibraryKeys.all, 'categories'] as const,
  muscleGroups: () => [...exerciseLibraryKeys.all, 'muscle-groups'] as const,
  equipment: () => [...exerciseLibraryKeys.all, 'equipment'] as const,
};

// Query Options Interfaces
interface ExercisesQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  exerciseType?: 'strength' | 'cardio' | 'flexibility' | 'sports';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  muscleGroup?: string;
  equipmentRequired?: string[];
  search?: string;
  isVerified?: boolean;
  isPublic?: boolean;
}

interface ExerciseSearchOptions {
  q: string; // or 'query'
  type?: 'strength' | 'cardio' | 'flexibility' | 'sports';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  muscleGroups?: string[];
  equipment?: string[];
  duration?: { min?: number; max?: number };
  verified?: boolean;
  public?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Hook to fetch exercises with filtering and pagination
 */
export function useExerciseLibrary(options: ExercisesQueryOptions = {}) {
  return useQuery({
    queryKey: exerciseLibraryKeys.list(options as Record<string, unknown>),
    queryFn: () => getExercises(options),
    staleTime: 10 * 60 * 1000, // 10 minutes (exercises don't change frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    refetchOnWindowFocus: false, // Exercise library is relatively static
    select: (data) => ({
      exercises: data.data || [],
      pagination: data.pagination,
      meta: data.meta,
    }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for advanced exercise search with real-time results
 */
export function useExerciseSearch(
  query: string,
  searchOptions: Omit<ExerciseSearchOptions, 'q'> = {}
) {
  const debouncedQuery = useDebounce(query, 300); // Debounce for 300ms

  return useQuery({
    queryKey: exerciseLibraryKeys.searchQuery(debouncedQuery, searchOptions),
    queryFn: () => searchExercises({ q: debouncedQuery, ...searchOptions }),
    enabled: !!debouncedQuery && debouncedQuery.length >= 2, // Only search if query is at least 2 chars
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    select: (data) => ({
      exercises: data.data || [],
      pagination: data.pagination,
      search: data.search,
      meta: data.meta,
    }),
  });
}

/**
 * Hook to get exercise categories and metadata
 */
export function useExerciseCategories() {
  return useQuery({
    queryKey: exerciseLibraryKeys.categories(),
    queryFn: async () => {
      // This would be an endpoint that returns available categories
      const response = await fetch('/api/exercises/categories');
      if (!response.ok) throw new Error('Failed to fetch exercise categories');
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour (categories rarely change)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
    select: (data) => data.data || [],
  });
}

/**
 * Hook to get available muscle groups
 */
export function useMuscleGroups() {
  return useQuery({
    queryKey: exerciseLibraryKeys.muscleGroups(),
    queryFn: async () => {
      const response = await fetch('/api/exercises/muscle-groups');
      if (!response.ok) throw new Error('Failed to fetch muscle groups');
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
    select: (data) => data.data || [],
  });
}

/**
 * Hook to get available equipment
 */
export function useEquipment() {
  return useQuery({
    queryKey: exerciseLibraryKeys.equipment(),
    queryFn: async () => {
      const response = await fetch('/api/exercises/equipment');
      if (!response.ok) throw new Error('Failed to fetch equipment');
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
    select: (data) => data.data || [],
  });
}

/**
 * Hook to create a custom exercise with optimistic updates
 */
export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExercise,
    // Optimistic update: immediately add the exercise to the UI
    onMutate: async (newExercise) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: exerciseLibraryKeys.lists() });

      // Snapshot previous data
      const previousExercises = queryClient.getQueryData(exerciseLibraryKeys.lists());

      // Create optimistic exercise
      const optimisticExercise: Exercise = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: newExercise.name,
        description: newExercise.description || '',
        instructions: newExercise.instructions || [],
        primaryMuscleGroups: newExercise.primaryMuscleGroups || [],
        secondaryMuscleGroups: newExercise.secondaryMuscleGroups || [],
        equipmentRequired: newExercise.equipmentRequired || [],
        exerciseType: newExercise.exerciseType || 'strength',
        difficultyLevel: newExercise.difficultyLevel || 'intermediate',
        estimatedDuration: newExercise.estimatedDuration || 0,
        caloriesPerMinute: newExercise.caloriesPerMinute || 0,
        isVerified: false, // New exercises start unverified
        isPublic: newExercise.isPublic || false,
        userId: '', // Will be set by server
        organizationId: newExercise.organizationId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Optional fields
        videoUrl: newExercise.videoUrl || null,
        imageUrl: newExercise.imageUrl || null,
        tags: newExercise.tags || [],
        modifications: newExercise.modifications || [],
        contraindications: newExercise.contraindications || [],
        benefits: newExercise.benefits || [],
        tips: newExercise.tips || [],
      };

      // Optimistically update the exercises list
      queryClient.setQueryData(exerciseLibraryKeys.lists(), (old: any) => {
        if (!old) return { success: true, data: [optimisticExercise] };
        return {
          ...old,
          data: [optimisticExercise, ...(old.data || [])],
        };
      });

      // Return context with snapshot for rollback
      return { previousExercises };
    },
    onSuccess: (data, variables) => {
      // Invalidate exercise lists to get real data from server
      queryClient.invalidateQueries({ queryKey: exerciseLibraryKeys.lists() });
      
      // If this was a search context, invalidate search results too
      queryClient.invalidateQueries({ queryKey: exerciseLibraryKeys.search() });
      
      // Invalidate categories if this is a new category
      queryClient.invalidateQueries({ queryKey: exerciseLibraryKeys.categories() });

      // Add the real exercise data to cache if available
      if (data.data) {
        // You could cache the individual exercise here if needed
        // queryClient.setQueryData(['exercise', data.data.id], data);
      }
    },
    onError: (error, newExercise, context) => {
      // Rollback optimistic update on error
      if (context?.previousExercises) {
        queryClient.setQueryData(exerciseLibraryKeys.lists(), context.previousExercises);
      }
      console.error('Failed to create exercise:', error);
    },
    // Always refetch after mutation completes (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: exerciseLibraryKeys.lists() });
    },
  });
}

/**
 * Hook for filtering exercises by multiple criteria
 */
export function useFilteredExercises(filters: {
  muscleGroups?: string[];
  equipmentType?: string[];
  exerciseType?: string[];
  difficultyLevel?: string[];
  duration?: { min?: number; max?: number };
}) {
  return useQuery({
    queryKey: exerciseLibraryKeys.list({ filters }),
    queryFn: () => getExercises({
      muscleGroup: filters.muscleGroups?.[0], // API might only support single muscle group
      equipmentRequired: filters.equipmentType,
      exerciseType: filters.exerciseType?.[0] as any,
      difficultyLevel: filters.difficultyLevel?.[0] as any,
    }),
    enabled: Object.keys(filters).some(key => {
      const value = filters[key as keyof typeof filters];
      return Array.isArray(value) ? value.length > 0 : value !== undefined;
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    select: (data) => ({
      exercises: data.data || [],
      count: data.data?.length || 0,
      pagination: data.pagination,
    }),
  });
}

/**
 * Hook for exercise recommendations based on current workout
 */
export function useExerciseRecommendations(context: {
  currentExercises?: string[];
  targetMuscleGroups?: string[];
  availableEquipment?: string[];
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  exerciseType?: 'strength' | 'cardio' | 'flexibility' | 'sports';
}) {
  return useQuery({
    queryKey: [...exerciseLibraryKeys.all, 'recommendations', context],
    queryFn: async () => {
      const response = await fetch('/api/exercises/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });
      if (!response.ok) throw new Error('Failed to fetch exercise recommendations');
      return response.json();
    },
    enabled: !!(context.targetMuscleGroups?.length || context.exerciseType),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    select: (data) => data.data || [],
  });
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

