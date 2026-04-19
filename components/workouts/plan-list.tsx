'use client';

import React, { useState } from 'react';
import { useWorkoutPlans, type WorkoutPlansFilters, type WorkoutPlansQueryResult } from '@/lib/hooks/use-workout-plans';
import type { WorkoutPlan, WorkoutStatus } from '@/lib/shared/types';

interface WorkoutPlanListProps {
  initialData?: WorkoutPlansQueryResult;
}

const STATUS_OPTIONS: Array<{ value: WorkoutStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

function formatStatus(status?: string) {
  if (!status) return 'Draft';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function normalizeFilters(filters: { search: string; status: string }): WorkoutPlansFilters {
  return {
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
  };
}

function hasActiveFilters(filters: WorkoutPlansFilters) {
  return Boolean(filters.search || filters.status);
}

function WorkoutPlanCards({ items }: { items: WorkoutPlan[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {items.map((plan) => {
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

export function WorkoutPlanList({ initialData }: WorkoutPlanListProps) {
  const [draftFilters, setDraftFilters] = useState({ search: '', status: '' });
  const [appliedFilters, setAppliedFilters] = useState<WorkoutPlansFilters>({});
  const filtersAreActive = hasActiveFilters(appliedFilters);

  const { data, isLoading, error } = useWorkoutPlans(
    appliedFilters,
    !filtersAreActive && initialData ? { initialData } : undefined
  );

  const applyFilters = (nextFilters = draftFilters) => {
    setAppliedFilters(normalizeFilters(nextFilters));
  };

  const clearFilters = () => {
    const emptyFilters = { search: '', status: '' };
    setDraftFilters(emptyFilters);
    setAppliedFilters({});
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextFilters = {
      ...draftFilters,
      status: event.target.value,
    };

    setDraftFilters(nextFilters);
    applyFilters(nextFilters);
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSearchSubmit}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"
        aria-label="Filter workout plans"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="plan-search" className="block text-sm font-medium text-slate-700">
              Search plans
            </label>
            <input
              id="plan-search"
              type="search"
              value={draftFilters.search}
              onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search by name or description"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="w-full lg:w-56">
            <label htmlFor="plan-status" className="block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="plan-status"
              value={draftFilters.status}
              onChange={handleStatusChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
            >
              Apply filters
            </button>
            {filtersAreActive ? (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">Loading plans...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-soft" role="alert">
          <p className="text-sm font-medium text-rose-600">Error loading plans</p>
          <p className="mt-1 text-xs text-rose-500">Try refreshing the page or contact support if the issue persists.</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        filtersAreActive ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center shadow-soft">
            <h3 className="text-base font-semibold text-slate-700">No plans match the current filters</h3>
            <p className="mt-2 text-sm text-slate-500">Try a different search term or use Clear filters to see all plans again.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center shadow-soft">
            <h3 className="text-base font-semibold text-slate-700">No workout plans yet</h3>
            <p className="mt-2 text-sm text-slate-500">Use the New plan button to create your first workout plan.</p>
          </div>
        )
      ) : (
        <WorkoutPlanCards items={data.items} />
      )}
    </div>
  );
}
