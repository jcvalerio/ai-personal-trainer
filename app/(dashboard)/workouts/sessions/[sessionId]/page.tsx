import React from 'react';
import { notFound } from 'next/navigation';
import { SessionDetailView } from '@/components/workouts/session-detail';
import { workoutPlanService } from '@/lib/services/workout-plan-service';

// Mock user ID for now - replace with actual auth
const MOCK_USER_ID = process.env.NEXT_PUBLIC_E2E_USER_ID ?? '11111111-2222-3333-4444-555555555555';

interface SessionDetailPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { sessionId } = await params;
  const session = await workoutPlanService.getSession(MOCK_USER_ID, sessionId);

  if (!session) {
    notFound();
  }

  return <SessionDetailView session={session} />;
}

export async function generateMetadata({ params }: SessionDetailPageProps) {
  const { sessionId } = await params;
  const session = await workoutPlanService.getSession(MOCK_USER_ID, sessionId);

  return {
    title: session ? `${session.name} | AI Personal Trainer` : 'Session Not Found | AI Personal Trainer',
    description: session ? `Workout session: ${session.name}` : 'The requested workout session could not be found.',
  };
}