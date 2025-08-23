/**
 * Workout Session Execution Page
 * Main page for conducting workout sessions with timer integration
 */
'use client';

import React, { use, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppNavigation } from '../../../../components/navigation/app-navigation';
import {
  SessionExecutionProvider,
  useSessionExecution,
} from '@/components/workouts/session-execution/session-execution-provider';
import { SessionInterface } from '@/components/workouts/session-execution/session-interface';
import { createLocalizedPath } from '@/lib/localized-navigation';
import { SessionExercise } from '@/types/workouts';

interface WorkoutSessionPageProps {
  params: Promise<{ locale: string }>;
}

// Mock workout session data for testing
const mockWorkoutSession: SessionExercise[] = [
  {
    id: '1',
    sessionId: 'session-1',
    exerciseId: 'plank',
    name: 'Plank Hold',
    orderIndex: 0,
    exercisePhase: 'main',
    plannedSets: 4,
    plannedDurationSeconds: 40, // 40 seconds
    plannedRestSeconds: 10, // 10 seconds rest
    timerProtocol: 'tabata',
    notes: 'Focus on keeping a straight line from head to heels',
    status: 'pending',
    equipmentAlternatives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    sessionId: 'session-1',
    exerciseId: 'push-ups',
    name: 'Push-ups',
    orderIndex: 1,
    exercisePhase: 'main',
    plannedSets: 3,
    plannedReps: 15,
    plannedRestSeconds: 60,
    timerProtocol: 'strength',
    notes: 'Lower chest to floor, push up explosively',
    status: 'pending',
    equipmentAlternatives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    sessionId: 'session-1',
    exerciseId: 'mountain-climbers',
    name: 'Mountain Climbers',
    orderIndex: 2,
    exercisePhase: 'main',
    plannedSets: 3,
    plannedDurationSeconds: 30,
    plannedRestSeconds: 15,
    timerProtocol: 'tabata',
    notes: 'Keep hips level, drive knees to chest',
    status: 'pending',
    equipmentAlternatives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    sessionId: 'session-1',
    exerciseId: 'squats',
    name: 'Bodyweight Squats',
    orderIndex: 3,
    exercisePhase: 'main',
    plannedSets: 3,
    plannedReps: 20,
    plannedRestSeconds: 45,
    timerProtocol: 'strength',
    notes: 'Descend until thighs parallel to floor',
    status: 'pending',
    equipmentAlternatives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function SessionContent({ locale }: { locale: string }) {
  const t = useTranslations('workouts.session');
  const { session, startSession } = useSessionExecution();

  // Auto-start session with mock data for demo
  useEffect(() => {
    if (!session || session.status === 'preparing') {
      startSession(mockWorkoutSession, {
        audioEnabled: true,
        vibrateEnabled: true,
        autoAdvance: true,
        autoStartRest: true,
        showMotivation: true,
        vibrateOnPhaseChange: true,
        keepScreenOn: true,
        useGPS: false,
        savePhotos: false,
        syncWearables: false,
        restPeriods: [30, 60, 90],
      });
    }
  }, [session, startSession]);

  if (!session || session.status === 'preparing') {
    return (
      <div className='min-h-screen bg-gray-50'>
        <AppNavigation locale={locale} variant='workouts' />

        <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
          <div className='mb-6'>
            <Link href={createLocalizedPath('workouts', locale as 'en' | 'es')}>
              <Button variant='outline' className='mb-4'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                {t('backToWorkouts')}
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('startSession')}</CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <p className='mb-6 text-gray-600'>{t('sessionDescription')}</p>

              <div className='mb-6 space-y-4'>
                <h3 className='font-medium'>{t('todaysWorkout')}:</h3>
                <div className='grid gap-3'>
                  {mockWorkoutSession.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className='flex items-center gap-3 rounded-lg bg-gray-50 p-3'
                    >
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white'>
                        {index + 1}
                      </div>
                      <div className='flex-1'>
                        <div className='font-medium'>{exercise.exerciseId}</div>
                        <div className='text-sm text-gray-600'>
                          {exercise.plannedSets} sets
                          {exercise.plannedReps &&
                            ` × ${exercise.plannedReps} reps`}
                          {exercise.plannedDurationSeconds &&
                            ` × ${exercise.plannedDurationSeconds}s`}
                          {exercise.timerProtocol && ' (Timer Exercise)'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => startSession(mockWorkoutSession)}
                size='lg'
                className='w-full'
              >
                <Play className='mr-2 h-5 w-5' />
                {t('beginWorkout')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <AppNavigation locale={locale} variant='workouts' />

      <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mb-6'>
          <Link href={createLocalizedPath('workouts', locale as 'en' | 'es')}>
            <Button variant='outline' className='mb-4'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('backToWorkouts')}
            </Button>
          </Link>
        </div>

        <SessionInterface />
      </main>
    </div>
  );
}

export default function WorkoutSessionPage({
  params,
}: WorkoutSessionPageProps) {
  const { locale } = use(params);

  return (
    <SessionExecutionProvider>
      <SessionContent locale={locale} />
    </SessionExecutionProvider>
  );
}
