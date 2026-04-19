import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/workouts/plan-detail', () => ({
  PlanDetailScreen: ({ planId }: { planId: string }) => (
    <div data-testid="plan-detail" data-plan-id={planId} />
  ),
}));

describe('WorkoutPlanDetailPage', () => {
  it('renders the plan detail screen for the given id', async () => {
    const { default: PlanDetailPage } = await import(
      '@/app/(dashboard)/workouts/plans/[planId]/page'
    );

    const ui = await PlanDetailPage({ params: Promise.resolve({ planId: 'plan-abc' }) });
    render(ui);

    expect(screen.getByTestId('plan-detail')).toHaveAttribute('data-plan-id', 'plan-abc');
  });
});
