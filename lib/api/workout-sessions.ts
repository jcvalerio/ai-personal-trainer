/**
 * Workout Sessions API Client
 * Enhanced with comprehensive session execution functionality
 */

import type {
  CreateWorkoutSessionRequest,
  WorkoutSession,
  SetPerformanceData,
} from '@/types/workouts';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export async function createWorkoutSession(
  payload: CreateWorkoutSessionRequest
): Promise<ApiResponse<WorkoutSession>> {
  try {
    const res = await fetch('/api/workouts/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || 'Failed to create session',
        code: body.code,
      };
    }
    return { success: true, data: body.data, message: body.message };
  } catch (_error) {
    return { success: false, error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

export async function startWorkoutSession(
  sessionId: string
): Promise<ApiResponse<WorkoutSession>> {
  try {
    const res = await fetch(`/api/workouts/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || 'Failed to start session',
        code: body.code,
      };
    }
    return { success: true, data: body.data, message: body.message };
  } catch (_error) {
    return { success: false, error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

export async function getWorkoutSession(
  sessionId: string
): Promise<ApiResponse<WorkoutSession>> {
  try {
    const res = await fetch(`/api/workouts/sessions/${sessionId}`);
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || 'Failed to load session',
        code: body.code,
      };
    }
    return { success: true, data: body.data };
  } catch (_error) {
    return { success: false, error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

/**
 * Pause an active workout session
 */
export async function pauseWorkoutSession(
  sessionId: string
): Promise<ApiResponse<WorkoutSession>> {
  try {
    const res = await fetch(`/api/workouts/sessions/${sessionId}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || 'Failed to pause session',
        code: body.code,
      };
    }
    return { success: true, data: body.data, message: body.message };
  } catch (_error) {
    return { success: false, error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

/**
 * Resume a paused workout session
 */
export async function resumeWorkoutSession(
  sessionId: string
): Promise<ApiResponse<WorkoutSession>> {
  try {
    const res = await fetch(`/api/workouts/sessions/${sessionId}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || 'Failed to resume session',
        code: body.code,
      };
    }
    return { success: true, data: body.data, message: body.message };
  } catch (_error) {
    return { success: false, error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

/**
 * Complete a workout session
 */
export async function completeWorkoutSession(
  sessionId: string,
  sessionData?: {
    finalNotes?: string;
    overallRating?: number;
    completedAt?: string;
  }
): Promise<ApiResponse<WorkoutSession>> {
  try {
    const res = await fetch(`/api/workouts/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData || {}),
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || 'Failed to complete session',
        code: body.code,
      };
    }
    return { success: true, data: body.data, message: body.message };
  } catch (_error) {
    return { success: false, error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

/**
 * Record a set performance during workout session
 */
export async function recordSetPerformance(
  sessionId: string,
  exerciseId: string,
  setData: SetPerformanceData
): Promise<ApiResponse<{ setId: string }>> {
  try {
    // Map frontend SetPerformanceData to backend API format
    const apiPayload = {
      exerciseId,
      setIndex: (setData.setNumber || 1) - 1, // Convert to 0-based index
      reps: setData.reps,
      weight: setData.weight,
      distance: setData.distance,
      duration: setData.duration,
      perceivedExertion: setData.perceivedExertion,
      formRating: setData.formRating,
      notes: setData.setNotes,
      completedAt: setData.timestamp?.toISOString(),
    };

    const res = await fetch(`/api/workouts/sessions/${sessionId}/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload),
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || 'Failed to record set',
        code: body.code,
      };
    }
    return { success: true, data: body.data, message: body.message };
  } catch (_error) {
    return { success: false, error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

/**
 * Update session progress and statistics
 */
export async function updateSessionProgress(
  sessionId: string,
  progressData: {
    currentExerciseIndex?: number;
    currentSet?: number;
    elapsedTime?: number;
    exercisesCompleted?: number;
    setsCompleted?: number;
    totalVolume?: number;
    notes?: string;
  }
): Promise<ApiResponse<WorkoutSession>> {
  try {
    const res = await fetch(`/api/workouts/sessions/${sessionId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData),
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || 'Failed to update progress',
        code: body.code,
      };
    }
    return { success: true, data: body.data, message: body.message };
  } catch (_error) {
    return { success: false, error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

/**
 * Get session statistics and analytics
 */
export async function getSessionStats(
  sessionId: string
): Promise<ApiResponse<{
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  duration: number;
  exercisesCompleted: number;
  personalRecords?: Array<{
    exerciseId: string;
    type: 'weight' | 'reps' | 'volume';
    value: number;
    previousValue?: number;
  }>;
}>> {
  try {
    const res = await fetch(`/api/workouts/sessions/${sessionId}/stats`);
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || 'Failed to load session stats',
        code: body.code,
      };
    }
    return { success: true, data: body.data };
  } catch (_error) {
    return { success: false, error: 'Network error', code: 'NETWORK_ERROR' };
  }
}
