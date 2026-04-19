'use client';

import React, { useState } from 'react';
import type { SessionExercise } from '@/lib/shared/types';

interface SessionExercisesProps {
  title: string;
  exercises: SessionExercise[];
  canEdit: boolean;
  onExerciseUpdate: (exercise: SessionExercise) => void;
}

interface ExerciseCardProps {
  exercise: SessionExercise;
  canEdit: boolean;
  onUpdate: (exercise: SessionExercise) => void;
}

function ExerciseCard({ exercise, canEdit, onUpdate }: ExerciseCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [actualReps, setActualReps] = useState(exercise.actualReps?.toString() ?? '');
  const [actualWeight, setActualWeight] = useState(exercise.actualWeightKg?.toString() ?? '');
  const [notes, setNotes] = useState(exercise.exerciseNotes ?? '');

  const handleMarkComplete = () => {
    const updatedExercise = {
      ...exercise,
      isCompleted: !exercise.isCompleted,
      actualReps: actualReps ? parseInt(actualReps) : exercise.plannedReps,
      actualWeightKg: actualWeight ? parseFloat(actualWeight) : exercise.plannedWeightKg,
      exerciseNotes: notes || undefined,
    };
    onUpdate(updatedExercise);
    setIsEditing(false);
  };

  const handleSave = () => {
    const updatedExercise = {
      ...exercise,
      actualReps: actualReps ? parseInt(actualReps) : undefined,
      actualWeightKg: actualWeight ? parseFloat(actualWeight) : undefined,
      exerciseNotes: notes || undefined,
    };
    onUpdate(updatedExercise);
    setIsEditing(false);
  };

  const exerciseName = exercise.exerciseName || `Exercise ${exercise.exerciseId}`;

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-4 ${
        exercise.isCompleted ? 'opacity-75' : ''
      }`}
      data-exercise-id={exercise.exerciseId}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-slate-900">{exerciseName}</h4>

          {/* Planned vs Actual */}
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            {exercise.plannedSets && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-slate-500 sm:w-20">Planned:</span>
                <span>
                  {exercise.plannedSets} sets × {exercise.plannedReps} reps
                  {exercise.plannedWeightKg && ` @ ${exercise.plannedWeightKg}kg`}
                </span>
              </div>
            )}

            {exercise.plannedDurationSeconds && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-slate-500 sm:w-20">Duration:</span>
                <span>{Math.floor(exercise.plannedDurationSeconds / 60)} minutes</span>
              </div>
            )}

            {(exercise.actualReps || exercise.actualWeightKg) && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-slate-500 sm:w-20">Actual:</span>
                <span>
                  {exercise.actualReps && `${exercise.actualReps} reps`}
                  {exercise.actualWeightKg && ` @ ${exercise.actualWeightKg}kg`}
                </span>
              </div>
            )}
          </div>

          {exercise.exerciseNotes && (
            <div className="mt-2 text-sm text-slate-600">
              <span className="font-medium">Notes:</span> {exercise.exerciseNotes}
            </div>
          )}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {exercise.isCompleted && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              Complete
            </span>
          )}

          {canEdit && !exercise.isCompleted && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Mark complete
            </button>
          )}
        </div>
      </div>

      {/* Editing form */}
      {isEditing && canEdit && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {exercise.plannedReps && (
              <div>
                <label htmlFor={`exercise-${exercise.exerciseId}-actual-reps`} className="block text-xs font-medium text-slate-700">
                  Actual reps
                </label>
                <input
                  id={`exercise-${exercise.exerciseId}-actual-reps`}
                  type="number"
                  value={actualReps}
                  onChange={(e) => setActualReps(e.target.value)}
                  placeholder={exercise.plannedReps?.toString()}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                />
              </div>
            )}

            {exercise.plannedWeightKg && (
              <div>
                <label htmlFor={`exercise-${exercise.exerciseId}-actual-weight`} className="block text-xs font-medium text-slate-700">
                  Actual weight (kg)
                </label>
                <input
                  id={`exercise-${exercise.exerciseId}-actual-weight`}
                  type="number"
                  step="0.5"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  placeholder={exercise.plannedWeightKg?.toString()}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor={`exercise-${exercise.exerciseId}-notes`} className="block text-xs font-medium text-slate-700">
              Exercise notes (optional)
            </label>
            <textarea
              id={`exercise-${exercise.exerciseId}-notes`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Any notes about this exercise..."
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-full rounded px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 sm:w-auto"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleMarkComplete}
              className="w-full rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 sm:w-auto"
            >
              Save & Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SessionExercises({ title, exercises, canEdit, onExerciseUpdate }: SessionExercisesProps) {
  if (exercises.length === 0) return null;

  const regionName = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <section role="region" aria-labelledby={`${regionName}-heading`} className="space-y-4">
      <h2 id={`${regionName}-heading`} className="text-xl font-semibold text-slate-900">
        {title}
      </h2>
      <div className="space-y-3">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.exerciseId}
            exercise={exercise}
            canEdit={canEdit}
            onUpdate={onExerciseUpdate}
          />
        ))}
      </div>
    </section>
  );
}