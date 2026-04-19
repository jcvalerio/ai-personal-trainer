'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';

interface SessionStartButtonProps {
  sessionId: string;
  onStart?: () => void;
}

export function SessionStartButton({ sessionId, onStart }: SessionStartButtonProps) {
  const userId = process.env.NEXT_PUBLIC_E2E_USER_ID ?? '11111111-2222-3333-4444-555555555555';

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/workouts/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      return response.json();
    },
    onSuccess: () => {
      onStart?.();
    },
  });

  const handleStart = () => {
    startMutation.mutate();
  };

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={startMutation.isPending}
      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {startMutation.isPending ? 'Starting…' : 'Start workout'}
    </button>
  );
}