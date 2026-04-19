'use client';

import React from 'react';

interface StartPlanConfirmationDialogProps {
  planName: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function StartPlanConfirmationDialog({
  planName,
  isPending,
  onCancel,
  onConfirm,
}: StartPlanConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-plan-dialog-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <header>
          <h2 id="start-plan-dialog-title" className="text-lg font-semibold text-slate-900">
            Start workout plan?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Starting <span className="font-semibold text-slate-700">{planName}</span> will activate the plan and
            generate the first week of scheduled sessions.
          </p>
        </header>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isPending ? 'Starting…' : 'Confirm start'}
          </button>
        </div>
      </div>
    </div>
  );
}
