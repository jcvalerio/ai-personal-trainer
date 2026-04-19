import React from 'react';
import { PlanDetailScreen } from '@/components/workouts/plan-detail';

interface PlanDetailPageProps {
  params: Promise<{ planId: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { planId } = await params;
  return <PlanDetailScreen planId={planId} />;
}
