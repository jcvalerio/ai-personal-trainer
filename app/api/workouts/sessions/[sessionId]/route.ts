/**
 * Workout Session by ID API Route
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import WorkoutService from '@/lib/services/workout-service';
import { getUserProfileByClerkId } from '@/lib/db/auth';

const workoutService = new WorkoutService();

// Mock session mapping for development - in production this would be database-driven
const MOCK_SESSIONS_MAP = {
  '1': 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Upper Body Power UUID
  '2': 'f47ac10b-58cc-4372-a567-0e02b2c3d480', // Lower Body Strength UUID  
  '3': 'f47ac10b-58cc-4372-a567-0e02b2c3d481', // Push Day Complete UUID
  'c8495f2b-4199-46c3-a06c-fa84f55be075': 'c8495f2b-4199-46c3-a06c-fa84f55be075', // Direct UUID for testing
};

// Helper function to resolve session ID (handle both UUID and integer mapping)
function resolveSessionId(sessionId: string): string {
  // If it's already a UUID format, return as-is
  if (sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return sessionId;
  }
  
  // If it's a numeric ID, map it to UUID
  const mappedId = MOCK_SESSIONS_MAP[sessionId as keyof typeof MOCK_SESSIONS_MAP];
  if (mappedId) {
    return mappedId;
  }
  
  // Return original if no mapping found (will likely fail in service)
  return sessionId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId: rawSessionId } = await params;
    if (!rawSessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing sessionId',
          code: 'INVALID_PARAMETER',
        },
        { status: 400 }
      );
    }

    // Resolve the session ID (handle integer to UUID mapping)
    const sessionId = resolveSessionId(rawSessionId);

    // Development Mode: Check if this is a valid mock session and return mock data immediately
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isValidUUID = sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    if (isDevelopment && isValidUUID) {
      // For development, return mock session data without authentication
      const mockSession = createMockSession(rawSessionId, sessionId);
      return NextResponse.json({ 
        success: true, 
        data: mockSession,
        meta: { source: 'mock_data', original_id: rawSessionId, mode: 'development' }
      });
    }

    // Production Mode: Full authentication required
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userProfile = await getUserProfileByClerkId(userId);
    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User profile not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role,
    };

    // For production: if we can't resolve to UUID, return error
    if (!isValidUUID) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid session ID format: "${rawSessionId}"`,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const result = await workoutService.getWorkoutSession(sessionId, context);
    if (!result.success) {
      const status = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(
        {
          success: false,
          error: result.error.message,
          code: result.error.code,
        },
        { status }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error fetching workout session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// Mock session generator for development
function createMockSession(originalId: string, uuid: string) {
  const sessionConfigs = {
    '1': {
      name: 'Upper Body Power',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: 8, restSeconds: 90, weight: 70 },
        { name: 'Pull-ups', sets: 3, reps: 10, restSeconds: 60, weight: 0 },
        { name: 'Shoulder Press', sets: 3, reps: 12, restSeconds: 60, weight: 40 },
        { name: 'Bicep Curls', sets: 3, reps: 12, restSeconds: 45, weight: 20 }
      ],
      targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
      estimatedDuration: 75
    },
    '2': {
      name: 'Lower Body Strength',
      exercises: [
        { name: 'Squats', sets: 4, reps: 10, restSeconds: 120, weight: 80 },
        { name: 'Deadlifts', sets: 3, reps: 8, restSeconds: 120, weight: 100 },
        { name: 'Lunges', sets: 3, reps: 12, restSeconds: 60, weight: 25 },
        { name: 'Calf Raises', sets: 3, reps: 15, restSeconds: 45, weight: 30 }
      ],
      targetMuscleGroups: ['quadriceps', 'hamstrings', 'glutes'],
      estimatedDuration: 80
    },
    '3': {
      name: 'Push Day Complete',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 15, restSeconds: 60, weight: 0 },
        { name: 'Dips', sets: 3, reps: 12, restSeconds: 60, weight: 0 },
        { name: 'Pike Push-ups', sets: 3, reps: 10, restSeconds: 60, weight: 0 }
      ],
      targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
      estimatedDuration: 45
    },
    'c8495f2b-4199-46c3-a06c-fa84f55be075': {
      name: 'Full Body Functional Training',
      exercises: [
        { name: 'Burpees', sets: 3, reps: 12, restSeconds: 90, weight: 0 },
        { name: 'Mountain Climbers', sets: 3, reps: 20, restSeconds: 60, weight: 0 },
        { name: 'Kettlebell Swings', sets: 4, reps: 15, restSeconds: 60, weight: 20 },
        { name: 'Jump Squats', sets: 3, reps: 10, restSeconds: 45, weight: 0 },
        { name: 'Plank Hold', sets: 3, reps: 1, restSeconds: 60, weight: 0, duration: 60 }
      ],
      targetMuscleGroups: ['full-body', 'cardio', 'strength'],
      estimatedDuration: 45
    }
  };

  // Use direct UUID mapping or fall back to numerical mapping
  let config = sessionConfigs[originalId as keyof typeof sessionConfigs];
  if (!config && uuid === 'c8495f2b-4199-46c3-a06c-fa84f55be075') {
    config = sessionConfigs['c8495f2b-4199-46c3-a06c-fa84f55be075'];
  }
  if (!config) {
    config = sessionConfigs['1']; // Default fallback
  }
  
  return {
    id: uuid,
    userId: 'dev-user-id',
    organizationId: null,
    workoutPlanId: null,
    name: config.name,
    status: 'scheduled',
    sessionType: 'workout',
    scheduledDate: new Date(),
    scheduledTime: null,
    scheduledDuration: null,
    estimatedDuration: config.estimatedDuration,
    startedAt: null,
    completedAt: null,
    actualDuration: null,
    completionPercentage: 0,
    effortRating: null,
    energyLevelBefore: null,
    energyLevelAfter: null,
    equipmentUsed: [],
    gymLocation: null,
    userNotes: null,
    aiFeedback: null,
    trainerNotes: null,
    sessionData: {
      totalExercises: config.exercises.length,
      estimatedDuration: config.estimatedDuration,
      targetMuscleGroups: config.targetMuscleGroups,
      equipmentNeeded: config.exercises
        .filter(ex => ex.weight && ex.weight > 0)
        .map(ex => ex.name.includes('Kettlebell') ? 'kettlebell' : 'weights'),
      difficultyLevel: 'intermediate'
    },
    warmUpExercises: [],
    mainExercises: config.exercises.map((ex, idx) => ({
      id: `${uuid}-ex-${idx}`,
      exerciseId: `f47ac10b-58cc-4372-a567-${String(idx).padStart(12, '0e02b2c3d47')}`,
      name: ex.name,
      orderIndex: idx,
      exercisePhase: 'main',
      plannedSets: ex.sets,
      plannedReps: ex.reps,
      plannedRestSeconds: ex.restSeconds,
      plannedWeight: ex.weight || null,
      actualSets: [],
      status: 'pending',
      notes: null,
      skipped: false,
      skipReason: null
    })),
    coolDownExercises: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
