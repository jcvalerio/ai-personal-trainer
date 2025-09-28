import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/workouts/plan-list', () => ({
  WorkoutPlanList: () => <div data-testid="plan-list" />,
}));

describe('WorkoutPlansPage', () => {
  it('renders the heading, actions, and plan list', async () => {
    const { default: WorkoutPlansPage } = await import('@/app/(dashboard)/workouts/plans/page');
    const ui = await WorkoutPlansPage();

    render(ui);

    expect(screen.getByRole('heading', { name: 'Workout Plans' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plan templates' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New plan' })).toBeInTheDocument();
    expect(screen.getByTestId('plan-list')).toBeInTheDocument();
  });
});
