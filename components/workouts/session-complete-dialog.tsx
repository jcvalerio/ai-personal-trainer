'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { WorkoutSession } from '@/lib/shared/types';

interface SessionCompleteDialogProps {
  session: WorkoutSession;
  onClose: () => void;
  onComplete: (session: WorkoutSession) => void;
}

export function SessionCompleteDialog({ session, onClose, onComplete }: SessionCompleteDialogProps) {
  const [effortRating, setEffortRating] = useState('');
  const [energyBefore, setEnergyBefore] = useState('');
  const [energyAfter, setEnergyAfter] = useState('');
  const [notes, setNotes] = useState('');
  const userId = process.env.NEXT_PUBLIC_E2E_USER_ID ?? '11111111-2222-3333-4444-555555555555';

  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/workouts/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          completionPercentage: 100,
          effortRating: effortRating ? parseInt(effortRating) : undefined,
          energyLevelBefore: energyBefore ? parseInt(energyBefore) : undefined,
          energyLevelAfter: energyAfter ? parseInt(energyAfter) : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete session');
      }

      return response.json();
    },
    onSuccess: (data) => {
      onComplete(data.data.workoutSession);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    completeMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:max-h-none">
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Complete Session</h2>
            <p className="mt-1 text-sm text-slate-500">
              How did the session go? Your feedback helps track progress.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Close
          </button>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="session-effort-rating" className="block text-sm font-medium text-slate-700">
                Effort rating
              </label>
              <select
                id="session-effort-rating"
                value={effortRating}
                onChange={(e) => setEffortRating(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}/10
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="session-energy-before" className="block text-sm font-medium text-slate-700">
                Energy level before
              </label>
              <select
                id="session-energy-before"
                value={energyBefore}
                onChange={(e) => setEnergyBefore(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}/10
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="session-energy-after" className="block text-sm font-medium text-slate-700">
                Energy level after
              </label>
              <select
                id="session-energy-after"
                value={energyAfter}
                onChange={(e) => setEnergyAfter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}/10
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="session-notes" className="block text-sm font-medium text-slate-700">
              Session notes
            </label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="How did the session go? Any observations or notes..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={completeMutation.isPending}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {completeMutation.isPending ? 'Completing...' : 'Confirm completion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}