import React from 'react';
import { PlanDetailScreen } from '@/components/workouts/plan-detail';

interface PlanDetailPageProps {
  params: Promise<{ planId: string }> | { planId: string };
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const resolvedParams = 'then' in params ? await params : params;
  return <PlanDetailScreen planId={resolvedParams.planId} />;
}
