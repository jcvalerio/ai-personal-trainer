/**
 * Main Workouts Dashboard Page
 * Central hub for all workout-related activities
 */
'use client'

import { Suspense } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Dumbbell, Plus, Calendar, BarChart3, Library, Sparkles, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { WorkoutCard } from '@/components/workouts/workout-card'
import { SessionCard } from '@/components/workouts/session-card'
import { WorkoutStatsGrid, ProgressOverview } from '@/components/workouts/workout-stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'
import { AppNavigation } from '../../../components/navigation/app-navigation'
import { createLocalizedPath } from '../../../lib/localized-navigation'
import { TranslationErrorBoundary } from '../../../components/providers/translation-error-boundary'

interface WorkoutsPageProps {
  params: Promise<{ locale: string }>
}

// Mock data for demonstration - in a real app, this would come from API calls 
const mockStats = {
  totalWorkouts: 47,
  weeklyWorkouts: 4,
  currentStreak: 12,
  totalMinutes: 2340,
  averageIntensity: 7.5,
  completionRate: 85
}

const mockTrends = {
  workouts: { value: 15, direction: 'up' as const },
  streak: { value: 3, direction: 'up' as const },
  intensity: { value: -5, direction: 'down' as const },
  completion: { value: 8, direction: 'up' as const }
}

const mockWorkoutPlans = [
  {
    id: '1',
    userId: 'user1',
    name: 'Summer Strength Challenge',
    description: 'Build lean muscle and increase strength over 12 weeks',
    durationWeeks: 12,
    sessionsPerWeek: 4,
    fitnessGoals: ['strength', 'muscle_gain', 'fat_loss'],
    targetFitnessLevel: 'intermediate' as const,
    estimatedSessionDuration: 75,
    status: 'active' as const,
    planData: { summary: '', phases: [], progressionStrategy: '' },
    weeklySchedule: {},
    version: 1,
    isTemplate: false,
    isPublic: false,
    isFeatured: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Morning Cardio Blast',
    description: 'High-intensity cardio workouts to start your day',
    durationWeeks: 8,
    sessionsPerWeek: 5,
    fitnessGoals: ['cardio', 'fat_loss', 'endurance'],
    targetFitnessLevel: 'beginner' as const,
    estimatedSessionDuration: 30,
    status: 'draft' as const,
    planData: { summary: '', phases: [], progressionStrategy: '' },
    weeklySchedule: {},
    version: 1,
    isTemplate: false,
    isPublic: false,
    isFeatured: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockSessions = [
  {
    id: '1',
    userId: 'user1',
    workoutPlanId: '1',
    name: 'Upper Body Power',
    sessionType: 'workout' as const,
    scheduledDate: new Date(),
    scheduledTime: '07:00',
    scheduledDuration: 75,
    sessionData: {
      totalExercises: 8,
      estimatedDuration: 75,
      targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
      equipmentNeeded: ['barbell', 'dumbbells', 'bench'],
      difficultyLevel: 'intermediate' as const
    },
    warmUpExercises: [],
    mainExercises: [],
    coolDownExercises: [],
    completionPercentage: 0,
    status: 'scheduled' as const,
    equipmentUsed: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: 'user1',
    workoutPlanId: '1',
    name: 'Lower Body Strength',
    sessionType: 'workout' as const,
    scheduledDate: new Date(Date.now() + 86400000), // Tomorrow
    scheduledTime: '18:30',
    scheduledDuration: 80,
    sessionData: {
      totalExercises: 6,
      estimatedDuration: 80,
      targetMuscleGroups: ['quadriceps', 'hamstrings', 'glutes'],
      equipmentNeeded: ['squat_rack', 'barbells', 'leg_press'],
      difficultyLevel: 'intermediate' as const
    },
    warmUpExercises: [],
    mainExercises: [],
    coolDownExercises: [],
    completionPercentage: 0,
    status: 'scheduled' as const,
    equipmentUsed: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    userId: 'user1',
    workoutPlanId: '1',
    name: 'Push Day Complete',
    sessionType: 'workout' as const,
    scheduledDate: new Date(Date.now() - 86400000), // Yesterday
    completedAt: new Date(Date.now() - 82800000),
    actualDuration: 72,
    sessionData: {
      totalExercises: 7,
      estimatedDuration: 75,
      targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
      equipmentNeeded: ['dumbbells', 'cables'],
      difficultyLevel: 'intermediate' as const
    },
    warmUpExercises: [],
    mainExercises: [],
    coolDownExercises: [],
    completionPercentage: 100,
    effortRating: 8,
    status: 'completed' as const,
    equipmentUsed: ['dumbbells', 'cables'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function WorkoutsPage({ params }: WorkoutsPageProps) {
  const t = useTranslations('workouts')
  const { locale } = use(params)
  const handleStartWorkout = (workoutId: string) => {
    // Navigate to workout session or create new session
    console.log('Starting workout:', workoutId)
  }

  const handleStartSession = (sessionId: string) => {
    // Navigate to active session
    console.log('Starting session:', sessionId)
  }

  const handleContinueSession = (sessionId: string) => {
    // Navigate to active session
    console.log('Continuing session:', sessionId)
  }

  return (
    <TranslationErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Modern Navigation Header */}
        <AppNavigation locale={locale} variant="workouts" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h2>
            <p className="text-gray-600">{t('subtitle')}</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
{t('buttons.filter')}
            </Button>
            <Button asChild>
              <Link href={createLocalizedPath('workouts/create', locale as 'en' | 'es')}>
                <Plus className="w-4 h-4 mr-2" />
{t('buttons.newWorkout')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="mb-8">
          <Suspense fallback={<LoadingSpinner />}>
            <WorkoutStatsGrid stats={mockStats} trends={mockTrends} />
          </Suspense>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
{t('tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="plans">
              <Dumbbell className="w-4 h-4 mr-2" />
{t('tabs.plans')}
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Calendar className="w-4 h-4 mr-2" />
{t('tabs.sessions')}
            </TabsTrigger>
            <TabsTrigger value="library">
              <Library className="w-4 h-4 mr-2" />
{t('tabs.library')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progress Overview */}
              <div className="lg:col-span-2">
                <ProgressOverview 
                  weeklyGoal={4}
                  currentProgress={mockStats.weeklyWorkouts}
                  monthlyStats={{ planned: 16, completed: 13 }}
                />
              </div>
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('quickActions.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start">
                    <Link href={createLocalizedPath('workouts/generate', locale as 'en' | 'es')}>
                      <Sparkles className="w-4 h-4 mr-2" />
{t('buttons.generateAI')}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href={createLocalizedPath('workouts/plans/new', locale as 'en' | 'es')}>
                      <Plus className="w-4 h-4 mr-2" />
{t('buttons.createCustom')}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href={createLocalizedPath('exercises', locale as 'en' | 'es')}>
                      <Library className="w-4 h-4 mr-2" />
                      {t('buttons.browseExercises')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Today's Sessions */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('todaySessions.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockSessions
                  .filter(session => 
                    new Date(session.scheduledDate).toDateString() === new Date().toDateString()
                  )
                  .map(session => (
                    <SessionCard 
                      key={session.id}
                      session={session}
                      onStart={handleStartSession}
                      onContinue={handleContinueSession}
                    />
                  ))}
                {mockSessions.filter(session => 
                  new Date(session.scheduledDate).toDateString() === new Date().toDateString()
                ).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t('todaySessions.noSessions')}</p>
                    <Button asChild className="mt-3">
                      <Link href={createLocalizedPath('workouts/sessions/schedule', locale as 'en' | 'es')}>
{t('buttons.scheduleSession')}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Workout Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('myPlans.title')}</h3>
              <Badge variant="outline">{mockWorkoutPlans.length} {t('myPlans.plans')}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockWorkoutPlans.map(plan => (
                <WorkoutCard 
                  key={plan.id}
                  workout={plan}
                  onStart={handleStartWorkout}
                  showProgress={plan.status === 'active'}
                />
              ))}
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('allSessions.title')}</h3>
              <div className="flex gap-2">
                <Badge variant="success">
                  {mockSessions.filter(s => s.status === 'completed').length} {t('allSessions.completed')}
                </Badge>
                <Badge variant="warning">
                  {mockSessions.filter(s => s.status === 'scheduled').length} {t('allSessions.scheduled')}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockSessions.map(session => (
                <SessionCard 
                  key={session.id}
                  session={session}
                  onStart={handleStartSession}
                  onContinue={handleContinueSession}
                />
              ))}
            </div>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <div className="text-center py-12">
              <Library className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('exerciseLibrary.title')}</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {t('exerciseLibrary.description')}
              </p>
              <Button asChild>
                <Link href={createLocalizedPath('exercises', locale as 'en' | 'es')}>
                  <Library className="w-4 h-4 mr-2" />
                  {t('buttons.browseExercises')}
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </TranslationErrorBoundary>
  )
}