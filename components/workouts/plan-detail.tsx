'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkoutPlan, WorkoutTemplate } from '@/lib/shared/types';
import { useWorkoutPlan } from '@/lib/hooks/use-workout-plan';
import { usePlanSessions } from '@/lib/hooks/use-plan-sessions';

const DAY_LABELS: Array<{ key: keyof WorkoutPlan['schedule']['weeklySchedule']; label: string }> = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function TemplateCard({ template }: { template: WorkoutTemplate }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{template.name}</h3>
          {template.description ? (
            <p className="mt-1 text-sm text-slate-500">{template.description}</p>
          ) : (
            <p className="mt-1 text-sm text-slate-400">No description provided.</p>
          )}
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {template.category}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-500">
        <div>
          <dt className="font-medium text-slate-600">Duration</dt>
          <dd className="mt-0.5 text-slate-500">{template.estimatedDuration} min</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Difficulty</dt>
          <dd className="mt-0.5 text-slate-500">{template.difficulty}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Primary muscles</dt>
          <dd className="mt-0.5 text-slate-500">{template.targetMuscleGroups.join(', ') || '—'}</dd>
        </div>
      </dl>
    </li>
  );
}

function renderPhaseFocus(focus?: string) {
  if (!focus) return null;
  return <span className="text-slate-500">Focus: {focus}</span>;
}

interface PlanDetailViewProps {
  plan: WorkoutPlan;
  headerActions?: React.ReactNode;
  banner?: React.ReactNode;
  sessionsContent?: React.ReactNode;
}

export function PlanDetailView({ plan, headerActions, banner, sessionsContent }: PlanDetailViewProps) {
  const description = plan.description?.trim() || 'No description provided.';
  const lastUpdatedLabel = plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString() : '—';

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 lg:px-0">
      {banner}
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{plan.name}</h1>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{plan.durationWeeks} weeks</span>
            <span aria-hidden="true" className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">{plan.sessionsPerWeek} sessions / week</span>
            {plan.estimatedSessionDuration ? (
              <>
                <span aria-hidden="true" className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">~{plan.estimatedSessionDuration} min per session</span>
              </>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {plan.primaryGoals.length > 0 ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
                {plan.primaryGoals[0]}
              </span>
            ) : null}
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
              {plan.difficulty}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            {formatStatus(plan.status)}
          </span>
          {headerActions ?? null}
          <div className="text-xs text-slate-400">Updated {lastUpdatedLabel}</div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="macrocycle-heading"
          role="region"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft lg:col-span-2"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 id="macrocycle-heading" className="text-lg font-semibold text-slate-900">
                Macrocycle overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">Goal: {plan.macrocycle.goal}</p>
            </div>
            {plan.macrocycle.progressionStrategy ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {plan.macrocycle.progressionStrategy} progression
              </span>
            ) : null}
          </div>

          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Duration: <span className="font-semibold text-slate-800">{plan.macrocycle.durationWeeks} weeks</span>
            </p>
          </div>

          <ul className="mt-4 space-y-3">
            {plan.macrocycle.phases.map((phase) => (
              <li key={phase.name} className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{phase.name}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Weeks: {phase.weeks}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {phase.description ? <p>{phase.description}</p> : null}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {renderPhaseFocus(phase.focus)}
                    {phase.intensityRange ? (
                      <span>
                        Intensity: {phase.intensityRange.min}% – {phase.intensityRange.max}%
                      </span>
                    ) : null}
                    {phase.volumeProgression ? <span>Progression: {phase.volumeProgression}</span> : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="schedule-heading"
          role="region"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft"
        >
          <h2 id="schedule-heading" className="text-lg font-semibold text-slate-900">
            Weekly schedule
          </h2>
          <ul className="mt-4 space-y-3">
            {DAY_LABELS.map(({ key, label }) => {
              const config = plan.schedule.weeklySchedule[key];
              const isRestDay = !config || config.isRestDay;
              const workoutName = config?.workoutName;
              const duration = config?.estimatedDuration ?? plan.estimatedSessionDuration;
              return (
                <li key={key} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    {isRestDay ? (
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Rest day</span>
                    ) : (
                      <span className="text-xs text-slate-500">{duration ? `${duration} min` : ''}</span>
                    )}
                  </div>
                  {!isRestDay ? (
                    <p className="mt-1 text-sm text-slate-600">{workoutName || 'Workout session'}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section
        aria-labelledby="sessions-heading"
        role="region"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="sessions-heading" className="text-lg font-semibold text-slate-900">
              Sessions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Automatically generated workouts scheduled for this plan.
            </p>
          </div>
        </div>
        <div className="mt-4">{sessionsContent ?? null}</div>
      </section>

      <section
        aria-labelledby="templates-heading"
        role="region"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="templates-heading" className="text-lg font-semibold text-slate-900">
              Workout templates
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The building blocks assigned across the weekly schedule.
            </p>
          </div>
          <span className="text-xs text-slate-400">{plan.workoutTemplates.length} templates</span>
        </div>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {plan.workoutTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </ul>
      </section>
    </section>
  );
}

export function PlanDetailScreen({ planId }: { planId: string }) {
  const { data, isLoading, error } = useWorkoutPlan(planId);
  const queryClient = useQueryClient();
  const [flash, setFlash] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
  const userId = process.env.NEXT_PUBLIC_E2E_USER_ID ?? '11111111-2222-3333-4444-555555555555';

  const {
    data: sessionData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = usePlanSessions(planId, {
    enabled: Boolean(data),
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/workouts/plans/${planId}/start`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({}),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Failed to start plan');
      }

      return payload.data.workoutPlan as WorkoutPlan;
    },
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(['workout-plan', planId], updatedPlan);
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      queryClient.invalidateQueries({ queryKey: ['workout-plan-sessions', planId] });
      setFlash({ variant: 'success', message: `Plan ${updatedPlan.name} is now active.` });
    },
    onError: (err: unknown) => {
      setFlash({
        variant: 'error',
        message: err instanceof Error ? err.message : 'Failed to start plan',
      });
    },
  });

  const handleStartPlan = () => {
    setFlash(null);
    startMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-0">
        <div
          role="status"
          className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500"
        >
          Loading workout plan...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-0">
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600"
        >
          Failed to load workout plan: {error.message}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-0">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">Plan not found</h2>
          <p className="mt-2 text-sm text-slate-500">
            The plan you are looking for may have been removed or you do not have access to it.
          </p>
        </div>
      </div>
    );
  }

  const banner = flash ? (
    <div
      role={flash.variant === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm ${
        flash.variant === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-600'
          : 'border-emerald-200 bg-emerald-50 text-emerald-600'
      }`}
    >
      {flash.message}
    </div>
  ) : undefined;

  const headerActions = data.status === 'draft'
    ? (
        <button
          type="button"
          onClick={handleStartPlan}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={startMutation.isPending}
        >
          {startMutation.isPending ? 'Starting…' : 'Start plan'}
        </button>
      )
    : null;

  let sessionsContent: React.ReactNode;
  if (sessionsLoading) {
    sessionsContent = (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500" role="status">
        Loading sessions...
      </div>
    );
  } else if (sessionsError) {
    sessionsContent = (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600" role="alert">
        Failed to load sessions: {sessionsError.message}
      </div>
    );
  } else {
    const sessions = sessionData ?? [];
    if (sessions.length === 0) {
      sessionsContent = (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          No sessions yet. Start the plan to generate the weekly schedule.
        </div>
      );
    } else {
      const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
      sessionsContent = (
        <ol className="flex flex-col gap-3">
          {sessions.map((session) => {
            const scheduledDate = session.scheduledDate
              ? dateFormatter.format(new Date(session.scheduledDate))
              : 'Unscheduled';
            return (
              <li
                key={session.id}
                data-session-id={session.id}
                data-session-status={session.status}
                className="rounded-lg border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-medium"
              >
                <Link
                  href={`/workouts/sessions/${session.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">{session.name}</span>
                    <span className="text-xs text-slate-500">{scheduledDate}</span>
                    {session.status !== 'draft' ? (
                      <span className="mt-1 text-xs text-slate-500">{session.completionPercentage}% complete</span>
                    ) : null}
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {formatStatus(session.status)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      );
    }
  }

  return (
    <PlanDetailView
      plan={data}
      headerActions={headerActions}
      banner={banner}
      sessionsContent={sessionsContent}
    />
  );
}
