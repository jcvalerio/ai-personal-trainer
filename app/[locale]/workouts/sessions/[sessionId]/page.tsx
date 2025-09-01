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
    // Video URLs from AI generation or manual entry
    videoUrls: ex.videoUrls || (ex.videoUrl ? [{ url: ex.videoUrl, platform: 'youtube' as const, title: 'Tutorial' }] : []),
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
    if (exercises.length > 0 && session.id) {
      // Always attempt session recovery/initialization on load
      const initSession = async () => {
        try {
          console.log('Initializing session with ID:', session.id);
          
          // First try to recover session from database to get current state
          await recoverSession(session.id).catch(error => {
            console.warn('Session recovery failed, starting fresh:', error);
            // If recovery fails, start a new session
            startSession(exercises, { 
              keepScreenOn: true,
              vibrateOnPhaseChange: true,
              autoAdvance: false // Let user control on mobile
            });
          });
          
        } catch (error) {
          console.error('Session initialization failed:', error);
          // Fallback: start session even if recovery fails
          startSession(exercises, { 
            keepScreenOn: true,
            vibrateOnPhaseChange: true,
            autoAdvance: false
          });
        }
      };
      
      initSession();
    }
  }, [session.id, exercises.length]); // Simplified dependencies

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
