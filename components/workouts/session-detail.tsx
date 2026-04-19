'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkoutSession, SessionExercise, UpdateSessionProgress } from '@/lib/shared/types';
import { SessionStartButton } from './session-start-button';
import { SessionCompleteDialog } from './session-complete-dialog';
import { SessionExercises } from './session-exercises';

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function calculateProgress(session: WorkoutSession): number {
  const allExercises = [
    ...session.warmUpExercises,
    ...session.mainExercises,
    ...session.coolDownExercises,
  ];

  if (allExercises.length === 0) return 0;

  const completedCount = allExercises.filter(ex => ex.isCompleted).length;
  return Math.round((completedCount / allExercises.length) * 100);
}

interface SessionDetailViewProps {
  session: WorkoutSession;
}

export function SessionDetailView({ session: initialSession }: SessionDetailViewProps) {
  const [session, setSession] = useState(initialSession);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const userId = process.env.NEXT_PUBLIC_E2E_USER_ID ?? '11111111-2222-3333-4444-555555555555';

  // Update session progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (progressData: UpdateSessionProgress) => {
      const response = await fetch(`/api/workouts/sessions/${session.id}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        throw new Error('Failed to update session progress');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSession(data.data.workoutSession);
      queryClient.invalidateQueries({ queryKey: ['workout-session', session.id] });
    },
  });

  const handleExerciseUpdate = (updatedExercise: SessionExercise) => {
    const updateField = (exercises: SessionExercise[]) =>
      exercises.map(ex =>
        ex.exerciseId === updatedExercise.exerciseId ? updatedExercise : ex
      );

    const updatedSession = {
      ...session,
      warmUpExercises: updateField(session.warmUpExercises),
      mainExercises: updateField(session.mainExercises),
      coolDownExercises: updateField(session.coolDownExercises),
    };

    const newProgress = calculateProgress(updatedSession);

    setSession({
      ...updatedSession,
      completionPercentage: newProgress,
    });

    // Update backend
    updateProgressMutation.mutate({
      warmUpExercises: updatedSession.warmUpExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        actualSets: ex.actualSets,
        actualReps: ex.actualReps,
        actualWeightKg: ex.actualWeightKg,
        actualDurationSeconds: ex.actualDurationSeconds,
        isCompleted: ex.isCompleted,
        exerciseNotes: ex.exerciseNotes,
      })),
      mainExercises: updatedSession.mainExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        actualSets: ex.actualSets,
        actualReps: ex.actualReps,
        actualWeightKg: ex.actualWeightKg,
        actualDurationSeconds: ex.actualDurationSeconds,
        isCompleted: ex.isCompleted,
        exerciseNotes: ex.exerciseNotes,
      })),
      coolDownExercises: updatedSession.coolDownExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        actualSets: ex.actualSets,
        actualReps: ex.actualReps,
        actualWeightKg: ex.actualWeightKg,
        actualDurationSeconds: ex.actualDurationSeconds,
        isCompleted: ex.isCompleted,
        exerciseNotes: ex.exerciseNotes,
      })),
      completionPercentage: newProgress,
    });
  };

  const canComplete = session.status === 'active';
  const progress = calculateProgress(session);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-0">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{session.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">
              {new Date(session.scheduledDate).toLocaleDateString()}
            </span>
            {session.scheduledDuration && (
              <>
                <span aria-hidden="true" className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">
                  {session.scheduledDuration} min
                </span>
              </>
            )}
            <span aria-hidden="true" className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">
              Progress: {progress}%
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            {formatStatus(session.status)}
          </span>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {session.status === 'draft' && (
              <SessionStartButton
                sessionId={session.id}
                onStart={() => setSession(prev => ({ ...prev, status: 'active' }))}
              />
            )}
            {canComplete && !showCompleteDialog && (
              <button
                type="button"
                onClick={() => setShowCompleteDialog(true)}
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 sm:w-auto"
              >
                Complete workout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Overall Progress</span>
          <span>{progress}% complete</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Exercise sections */}
      <div className="space-y-8">
        {session.warmUpExercises.length > 0 && (
          <SessionExercises
            title="Warm-up"
            exercises={session.warmUpExercises}
            canEdit={session.status === 'active'}
            onExerciseUpdate={handleExerciseUpdate}
          />
        )}

        <SessionExercises
          title="Main Workout"
          exercises={session.mainExercises}
          canEdit={session.status === 'active'}
          onExerciseUpdate={handleExerciseUpdate}
        />

        {session.coolDownExercises.length > 0 && (
          <SessionExercises
            title="Cool-down"
            exercises={session.coolDownExercises}
            canEdit={session.status === 'active'}
            onExerciseUpdate={handleExerciseUpdate}
          />
        )}
      </div>

      {/* Session notes */}
      {session.notes && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Session Notes</h3>
          <p className="mt-2 text-slate-600">{session.notes}</p>
        </div>
      )}

      {/* Completion feedback */}
      {session.status === 'completed' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Session Feedback</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 md:grid-cols-3">
            {session.effortRating && (
              <div>
                <dt className="font-medium text-slate-600">Effort Rating</dt>
                <dd className="mt-1 text-slate-900">Effort: {session.effortRating}/10</dd>
              </div>
            )}
            {session.energyLevelBefore && (
              <div>
                <dt className="font-medium text-slate-600">Energy Before</dt>
                <dd className="mt-1 text-slate-900">{session.energyLevelBefore}/10</dd>
              </div>
            )}
            {session.energyLevelAfter && (
              <div>
                <dt className="font-medium text-slate-600">Energy After</dt>
                <dd className="mt-1 text-slate-900">{session.energyLevelAfter}/10</dd>
              </div>
            )}
          </div>
        </div>
      )}

      {showCompleteDialog && (
        <SessionCompleteDialog
          session={session}
          onClose={() => setShowCompleteDialog(false)}
          onComplete={(completedSession) => {
            setSession(completedSession);
            setShowCompleteDialog(false);
          }}
        />
      )}
    </section>
  );
}