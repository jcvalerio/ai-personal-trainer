/**
 * Workout Session Execution Page
 * Main page for conducting workout sessions with timer integration
 */
'use client'

import React, { use, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ArrowLeft, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppNavigation } from '../../../../components/navigation/app-navigation'
import { SessionExecutionProvider, useSessionExecution } from '@/components/workouts/session-execution/session-execution-provider'
import { SessionInterface } from '@/components/workouts/session-execution/session-interface'
import { createLocalizedPath } from '@/lib/localized-navigation'
import { SessionExercise } from '@/types/workouts'
import { TabataConfig } from '@/types/session-execution'

interface WorkoutSessionPageProps {
  params: Promise<{ locale: string }>
}

// Mock workout session data for testing
const mockWorkoutSession: SessionExercise[] = [
  {
    id: '1',
    sessionId: 'session-1',
    exerciseId: 'plank',
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
    updatedAt: new Date()
  },
  {
    id: '2',
    sessionId: 'session-1',
    exerciseId: 'push-ups',
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
    updatedAt: new Date()
  },
  {
    id: '3',
    sessionId: 'session-1',
    exerciseId: 'mountain-climbers',
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
    updatedAt: new Date()
  },
  {
    id: '4',
    sessionId: 'session-1',
    exerciseId: 'squats',
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
    updatedAt: new Date()
  }
]

function SessionContent({ locale }: { locale: string }) {
  const t = useTranslations('workouts.session')
  const { session, startSession } = useSessionExecution()

  // Auto-start session with mock data for demo
  useEffect(() => {
    if (!session || session.status === 'preparing') {
      startSession(mockWorkoutSession, {
        audioEnabled: true,
        vibrateEnabled: true,
        voiceEnabled: false,
        autoAdvance: true
      })
    }
  }, [session, startSession])

  if (!session || session.status === 'preparing') {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNavigation locale={locale} variant="workouts" />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href={createLocalizedPath('workouts', locale as 'en' | 'es')}>
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToWorkouts')}
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('startSession')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-6">{t('sessionDescription')}</p>
              
              <div className="space-y-4 mb-6">
                <h3 className="font-medium">{t('todaysWorkout')}:</h3>
                <div className="grid gap-3">
                  {mockWorkoutSession.map((exercise, index) => (
                    <div key={exercise.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{exercise.exerciseId}</div>
                        <div className="text-sm text-gray-600">
                          {exercise.plannedSets} sets
                          {exercise.plannedReps && ` × ${exercise.plannedReps} reps`}
                          {exercise.plannedDurationSeconds && ` × ${exercise.plannedDurationSeconds}s`}
                          {exercise.timerProtocol && ' (Timer Exercise)'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => startSession(mockWorkoutSession)}
                size="lg"
                className="w-full"
              >
                <Play className="w-5 h-5 mr-2" />
                {t('beginWorkout')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation locale={locale} variant="workouts" />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={createLocalizedPath('workouts', locale as 'en' | 'es')}>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToWorkouts')}
            </Button>
          </Link>
        </div>

        <SessionInterface />
      </main>
    </div>
  )
}

export default function WorkoutSessionPage({ params }: WorkoutSessionPageProps) {
  const { locale } = use(params)

  return (
    <SessionExecutionProvider>
      <SessionContent locale={locale} />
    </SessionExecutionProvider>
  )
}