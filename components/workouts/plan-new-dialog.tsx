'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlanFormValues } from '@/lib/workouts/plan-form-adapter';

const INITIAL_FORM: PlanFormValues = {
  name: '',
  durationWeeks: 4,
  sessionsPerWeek: 3,
  description: '',
};

export function NewPlanDialogTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusVariant, setStatusVariant] = useState<'success' | 'error'>('success');

  return (
    <>
      {statusMessage ? (
        <div
          role="status"
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            statusVariant === 'success'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-rose-50 text-rose-600'
          }`}
        >
          {statusMessage}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
      >
        New plan
      </button>
      {isOpen ? (
        <NewPlanDialog
          onClose={() => setIsOpen(false)}
          onSuccess={(message) => {
            setStatusVariant('success');
            setStatusMessage(message);
          }}
          onError={(message) => {
            setStatusVariant('error');
            setStatusMessage(message);
          }}
        />
      ) : null}
    </>
  );
}

interface NewPlanDialogProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function NewPlanDialog({ onClose, onSuccess, onError }: NewPlanDialogProps) {
  const [form, setForm] = useState<PlanFormValues>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof PlanFormValues, string>>>({});
  const queryClient = useQueryClient();
  const userId = process.env.NEXT_PUBLIC_E2E_USER_ID ?? '11111111-2222-3333-4444-555555555555';

  const mutation = useMutation({
    mutationFn: async (input: PlanFormValues) => {
      const response = await fetch('/api/workouts/plans', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(input),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to create plan');
      }

      return payload.data as { workoutPlan: { id: string; name: string } };
    },
    onSuccess: ({ workoutPlan }) => {
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      setForm(INITIAL_FORM);
      onClose();
      onSuccess(`Plan ${workoutPlan.name} created successfully.`);
    },
    onError: (error: unknown) => {
      onError(error instanceof Error ? error.message : 'Failed to create plan');
    },
  });

  const updateField = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors: Partial<Record<keyof PlanFormValues, string>> = {};

    if (!form.name.trim()) {
      validationErrors.name = 'Name is required';
    }
    if (!form.durationWeeks || Number.isNaN(form.durationWeeks)) {
      validationErrors.durationWeeks = 'Duration is required';
    }
    if (!form.sessionsPerWeek || Number.isNaN(form.sessionsPerWeek)) {
      validationErrors.sessionsPerWeek = 'Sessions per week is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    mutation.mutate({
      name: form.name.trim(),
      durationWeeks: Number(form.durationWeeks),
      sessionsPerWeek: Number(form.sessionsPerWeek),
      description: form.description?.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">New workout plan</h2>
            <p className="mt-1 text-sm text-slate-500">Fill the basic details — advanced structure can be refined later.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
            Close
          </button>
        </header>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field label="Plan name" error={errors.name}>
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Sedentary Strength Builder"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Duration (weeks)" error={errors.durationWeeks}>
              <input
                type="number"
                min={4}
                value={form.durationWeeks}
                onChange={(event) => updateField('durationWeeks', Number(event.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Sessions per week" error={errors.sessionsPerWeek}>
              <input
                type="number"
                min={1}
                max={7}
                value={form.sessionsPerWeek}
                onChange={(event) => updateField('sessionsPerWeek', Number(event.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Description (optional)" error={errors.description}>
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={3}
            />
          </Field>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creating…' : 'Create plan'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
      {error ? <span className="text-xs font-normal text-rose-600">{error}</span> : null}
    </label>
  );
}
