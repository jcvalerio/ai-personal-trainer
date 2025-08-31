/**
 * Active Workout Session Page (by ID)
 * Wires SessionExecution UI to the real session from API
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { use } from 'react';
import { AppNavigation } from '@/components/navigation/app-navigation';
import {
  SessionExecutionProvider,
  useSessionExecution,
} from '@/components/workouts/session-execution/session-execution-provider';
import { 
  EnhancedSessionInterface, 
  SessionLoading, 
  SessionErrorState 
} from '@/components/workouts/ui';
import { getWorkoutSession } from '@/lib/api/workout-sessions';
import type { SessionExercise, WorkoutSession } from '@/types/workouts';

interface PageProps {
  params: Promise<{ locale: string; sessionId: string }>;
}

function mapToSessionExercises(session: WorkoutSession): SessionExercise[] {
  const all = [
    ...(session.warmUpExercises || []),
    ...(session.mainExercises || []),
    ...(session.coolDownExercises || []),
  ];
  return all.map((ex: Record<string, any>, idx: number) => ({
    id: ex.id || `${session.id}-${idx}`,
    sessionId: session.id,
    exerciseId: ex.exerciseId || ex.id || `exercise-${idx}`,
    name: ex.name,
    orderIndex: ex.orderIndex ?? idx,
    exercisePhase: ex.exercisePhase || 'main',
    plannedSets: ex.plannedSets ?? ex.sets ?? 3,
    plannedReps: ex.plannedReps ?? ex.repsMin ?? 10,
    plannedWeightKg: ex.plannedWeightKg,
    plannedDurationSeconds: ex.plannedDurationSeconds ?? ex.durationSeconds,
    plannedDistanceMeters: ex.plannedDistanceMeters,
    plannedRestSeconds: ex.plannedRestSeconds ?? ex.restSeconds ?? 60,
    equipmentAlternatives: ex.equipmentAlternatives || [],
    status: 'pending',
    // Preserve completed sets from database
    completedSets: ex.completedSets || 0,
    setData: ex.setData || [],
    sets: ex.sets || ex.plannedSets || 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

function LiveSession({ session, locale }: { session: WorkoutSession; locale: string }) {
  const { startSession, session: execSession, recoverSession } = useSessionExecution();
  const exercises = useMemo(() => mapToSessionExercises(session), [session]);

  useEffect(() => {
    if (exercises.length > 0 && (!execSession || execSession.status === 'idle')) {
      // Initialize session with proper sessionId and recovery logic
      startSession(exercises, { keepScreenOn: true });
      
      // Set the sessionId after starting
      if (session.id && execSession?.sessionId !== session.id) {
        recoverSession(session.id);
      }
    }
  }, [exercises, execSession, startSession, recoverSession, session.id]);

  return (
    <EnhancedSessionInterface 
      onBack={() => window.history.back()}
      onSessionComplete={() => {
        // Could navigate to results page or back to workouts
        window.location.href = `/${locale}/workouts`;
      }}
    />
  );
}

export default function WorkoutSessionPage({ params }: PageProps) {
  const { locale, sessionId } = use(params);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getWorkoutSession(sessionId);
      if (!mounted) return;
      if (res.success && res.data) {
        setSession(res.data);
      } else {
        setError(res.error || 'Failed to load session');
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  return (
    <div className='min-h-screen bg-gray-50'>
      <AppNavigation locale={locale} variant='workouts' />
      <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        {loading && (
          <SessionLoading 
            message="Loading workout session..."
            size="lg" 
          />
        )}
        {error && (
          <SessionErrorState 
            error={error}
            onRetry={() => window.location.reload()}
          />
        )}
        {session && (
          <SessionExecutionProvider>
            <LiveSession session={session} locale={locale} />
          </SessionExecutionProvider>
        )}
      </main>
    </div>
  );
}
