'use client';

import React from 'react';
import { useWorkoutPlans } from '@/lib/hooks/use-workout-plans';
import type { WorkoutPlan } from '@/lib/shared/types';

interface WorkoutPlanListProps {
  initialData?: {
    items: WorkoutPlan[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

function formatStatus(status?: string) {
  if (!status) return 'Draft';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function WorkoutPlanList({ initialData }: WorkoutPlanListProps) {
  const { data, isLoading, error } = useWorkoutPlans({}, {
    initialData,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm text-slate-500">Loading plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-soft" role="alert">
        <p className="text-sm font-medium text-rose-600">Error loading plans</p>
        <p className="mt-1 text-xs text-rose-500">Try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center shadow-soft">
        <h3 className="text-base font-semibold text-slate-700">No workout plans yet</h3>
        <p className="mt-2 text-sm text-slate-500">Use the API or the upcoming builder to create a plan.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {data.items.map((plan) => {
        const planPath = `/workouts/plans/${plan.id}`;
        return (
          <li
            key={plan.id}
            className="rounded-xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-medium"
          >
            <a
              href={planPath}
              className="block h-full rounded-xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              data-plan-id={plan.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                  {plan.description ? (
                    <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">No description provided.</p>
                  )}
                </div>
                <span className="self-start rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {formatStatus(plan.status)}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-xs text-slate-500 sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-600">Duration</dt>
                  <dd className="mt-0.5 text-slate-500">{plan.durationWeeks ?? 0} weeks</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Sessions / week</dt>
                  <dd className="mt-0.5 text-slate-500">{plan.sessionsPerWeek ?? '—'}</dd>
                </div>
              </dl>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
