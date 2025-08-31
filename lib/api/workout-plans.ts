/**
 * Workout Plans API Client
 * Handles API calls for workout plan CRUD operations
 */

import type {
  WorkoutPlan,
  WorkoutSession,
  CustomPlanFormData,
  CreateWorkoutPlanRequest,
} from '@/types/workouts';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  timestamp?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateWorkoutPlanResponse {
  id: string;
  name: string;
  status: string;
  message?: string;
}

/**
 * Transform form data to API request format
 */
export function transformFormDataToApi(
  formData: CustomPlanFormData
): CreateWorkoutPlanRequest {
  // Transform weeklySchedule to handle sessionId format mismatch
  const transformedWeeklySchedule: Record<string, any> = {};
  
  Object.entries(formData.weeklySchedule).forEach(([day, sessions]) => {
    if (sessions && Array.isArray(sessions)) {
      transformedWeeklySchedule[day] = sessions.map((session) => ({
        day: session.day,
        // Remove sessionId if it's not a valid UUID format to avoid validation errors
        sessionId: session.sessionId && session.sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
          ? session.sessionId 
          : undefined,
        sessionName: session.sessionName,
        type: session.type,
        duration: session.duration,
      }));
    } else {
      transformedWeeklySchedule[day] = [];
    }
  });

  return {
    name: formData.name,
    description: formData.description,
    durationWeeks: formData.durationWeeks,
    sessionsPerWeek: formData.sessionsPerWeek,
    fitnessGoals: formData.fitnessGoals,
    targetFitnessLevel: formData.targetFitnessLevel,
    estimatedSessionDuration: formData.estimatedSessionDuration,
    planData: {
      summary: `Custom workout plan: ${formData.name}`,
      phases: [
        {
          name: 'Main Phase',
          description: 'Primary training phase',
          durationWeeks: formData.durationWeeks,
          sessions: formData.sessionTemplates.map((t) => t.id),
        },
      ],
      progressionStrategy: 'linear',
      templates: formData.sessionTemplates,
      schedule: transformedWeeklySchedule,
    },
    weeklySchedule: transformedWeeklySchedule,
    progressionRules: {},
    isTemplate: formData.isTemplate || false,
    isPublic: formData.isPublic || false,
  };
}

/**
 * Create a new workout plan
 */
export async function createWorkoutPlan(
  formData: CustomPlanFormData
): Promise<ApiResponse<CreateWorkoutPlanResponse>> {
  try {
    const requestData = transformFormDataToApi(formData);

    const response = await fetch('/api/workouts/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to create workout plan',
        code: result.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message || 'Workout plan created successfully',
    };
  } catch (error) {
    console.error('Error creating workout plan:', error);
    return {
      success: false,
      error: 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get workout plans with filters and pagination
 */
export async function getWorkoutPlans(params?: {
  page?: number;
  limit?: number;
  status?: string;
  isTemplate?: boolean;
  search?: string;
}): Promise<ApiResponse<WorkoutPlan[]>> {
  try {
    const searchParams = new URLSearchParams();

    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    if (params?.isTemplate !== undefined) {
      searchParams.append('isTemplate', params.isTemplate.toString());
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }

    const response = await fetch(
      `/api/workouts/plans?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to fetch workout plans',
        code: result.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      data: result.data || [],
      message: result.message,
    };
  } catch (error) {
    console.error('Error fetching workout plans:', error);
    return {
      success: false,
      error: 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Update an existing workout plan
 */
export async function updateWorkoutPlan(
  planId: string,
  formData: Partial<CustomPlanFormData>
): Promise<ApiResponse<WorkoutPlan>> {
  try {
    const requestData = transformFormDataToApi(formData as CustomPlanFormData);

    const response = await fetch(`/api/workouts/plans/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to update workout plan',
        code: result.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message || 'Workout plan updated successfully',
    };
  } catch (error) {
    console.error('Error updating workout plan:', error);
    return {
      success: false,
      error: 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Delete a workout plan
 */
export async function deleteWorkoutPlan(
  planId: string
): Promise<ApiResponse<boolean>> {
  try {
    const response = await fetch(`/api/workouts/plans/${planId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to delete workout plan',
        code: result.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      data: true,
      message: result.message || 'Workout plan deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    return {
      success: false,
      error: 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get a specific workout plan by ID
 */
export async function getWorkoutPlan(
  planId: string
): Promise<ApiResponse<WorkoutPlan & { progress?: any }>> {
  try {
    const response = await fetch(`/api/workouts/plans/${planId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to fetch workout plan',
        code: result.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error) {
    console.error('Error fetching workout plan:', error);
    return {
      success: false,
      error: 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get sessions for a specific workout plan
 */
export async function getWorkoutPlanSessions(
  planId: string,
  options?: {
    status?: string;
    sessionType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<ApiResponse<WorkoutSession[]>> {
  try {
    const searchParams = new URLSearchParams();

    if (options?.status) searchParams.append('status', options.status);
    if (options?.sessionType)
      searchParams.append('sessionType', options.sessionType);
    if (options?.dateFrom) searchParams.append('dateFrom', options.dateFrom);
    if (options?.dateTo) searchParams.append('dateTo', options.dateTo);
    if (options?.page) searchParams.append('page', options.page.toString());
    if (options?.limit) searchParams.append('limit', options.limit.toString());
    if (options?.sortBy) searchParams.append('sortBy', options.sortBy);
    if (options?.sortOrder)
      searchParams.append('sortOrder', options.sortOrder);

    const url = `/api/workouts/plans/${planId}/sessions${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to fetch workout plan sessions',
        code: result.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      data: result.data || [],
      pagination: result.pagination,
      message: result.message,
    };
  } catch (error) {
    console.error('Error fetching workout plan sessions:', error);
    return {
      success: false,
      error: 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Start a workout plan (transition from draft to active)
 */
export async function startWorkoutPlan(
  planId: string,
  options?: {
    scheduleStartDate?: string;
    generateInitialSessions?: boolean;
  }
): Promise<ApiResponse<WorkoutPlan & { progress?: any }>> {
  try {
    const response = await fetch(`/api/workouts/plans/${planId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options || {}),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to start workout plan',
        code: result.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message || 'Workout plan started successfully',
    };
  } catch (error) {
    console.error('Error starting workout plan:', error);
    return {
      success: false,
      error: 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Start a workout session
 */
export async function startWorkoutSession(
  sessionId: string
): Promise<ApiResponse<WorkoutSession>> {
  try {
    const response = await fetch(`/api/workouts/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to start workout session',
        code: result.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message || 'Workout session started successfully',
    };
  } catch (error) {
    console.error('Error starting workout session:', error);
    return {
      success: false,
      error: 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}
