/**
 * Workout Session Sync API
 * Handles syncing of offline workout data when connection is restored
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

// Validation schema for sync request
const SyncWorkoutSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  workoutData: z.object({
    sessionId: z.string(),
    sessionType: z.enum(['strength', 'cardio', 'flexibility', 'mixed']),
    status: z.enum(['active', 'paused', 'completed', 'cancelled']),
    currentExerciseIndex: z.number(),
    currentSetIndex: z.number(),
    exercises: z.array(z.any()), // Simplified for now
    elapsedTime: z.number(),
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    pausedTime: z.number(),
    performance: z.object({
      setsCompleted: z.number(),
      totalSets: z.number(),
      exercisesCompleted: z.number(),
      totalExercises: z.number(),
      totalVolume: z.number(),
      averageIntensity: z.number(),
      personalRecords: z.array(z.any()),
    }),
  }),
  timestamp: z.number(),
  synced: z.boolean(),
  version: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const syncData = SyncWorkoutSchema.parse(body);

    console.log(
      'Syncing workout data for user:',
      userId,
      'session:',
      syncData.sessionId
    );

    // Process the workout data
    const { workoutData } = syncData;

    // Convert ISO date strings back to Date objects
    const processedWorkoutData = {
      ...workoutData,
      startTime: workoutData.startTime ? new Date(workoutData.startTime) : null,
      endTime: workoutData.endTime ? new Date(workoutData.endTime) : null,
      userId, // Add user ID for database storage
      syncedAt: new Date(),
      originalTimestamp: syncData.timestamp,
    };

    // Here you would typically save to your database
    // For now, we'll simulate the database operation

    // Simulate database save delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Log the successful sync
    console.log('Workout synced successfully:', {
      sessionId: workoutData.sessionId,
      status: workoutData.status,
      exercisesCompleted: workoutData.performance.exercisesCompleted,
      totalExercises: workoutData.performance.totalExercises,
      setsCompleted: workoutData.performance.setsCompleted,
      elapsedTime: Math.round(workoutData.elapsedTime / 1000 / 60), // minutes
      completedAt: workoutData.endTime,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      sessionId: workoutData.sessionId,
      syncedAt: new Date().toISOString(),
      message: 'Workout data synced successfully',
    });
  } catch (error) {
    console.error('Workout sync error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid workout data format',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: 'Failed to sync workout data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve sync status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const since = searchParams.get('since'); // ISO date string

    // Here you would typically query your database for sync status
    // For now, return mock data

    const syncStatus = {
      userId,
      totalSessions: 0, // Would come from database
      syncedSessions: 0, // Would come from database
      pendingSessions: 0, // Would come from database
      lastSyncTime: null, // Would come from database
      ...(sessionId && {
        sessionId,
        synced: false, // Would check database
        lastSyncAttempt: null,
      }),
    };

    return NextResponse.json({
      success: true,
      data: syncStatus,
    });
  } catch (error) {
    console.error('Sync status error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear sync queue (for testing/maintenance)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const confirmClear = searchParams.get('confirm') === 'true';

    if (!confirmClear) {
      return NextResponse.json(
        { error: 'Confirmation required' },
        { status: 400 }
      );
    }

    // Here you would typically delete from database
    // For now, just log the action

    console.log(
      'Clearing sync data for user:',
      userId,
      sessionId ? `session: ${sessionId}` : 'all sessions'
    );

    return NextResponse.json({
      success: true,
      message: sessionId
        ? `Sync data cleared for session: ${sessionId}`
        : 'All sync data cleared',
      clearedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync clear error:', error);

    return NextResponse.json(
      {
        error: 'Failed to clear sync data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
