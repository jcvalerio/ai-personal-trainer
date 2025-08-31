/**
 * Main Workouts Dashboard Page
 * Central hub for all workout-related activities
 */
'use client';

import { Suspense, useCallback } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Dumbbell,
  Plus,
  Calendar,
  BarChart3,
  Library,
  Sparkles,
  Filter,
  Play,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { WorkoutCard } from '@/components/workouts/workout-card';
import { SessionCard } from '@/components/workouts/session-card';
import {
  WorkoutStatsGrid,
  ProgressOverview,
} from '@/components/workouts/workout-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { AppNavigation } from '../../../components/navigation/app-navigation';
import { createLocalizedPath } from '../../../lib/localized-navigation';
import { TranslationErrorBoundary } from '../../../components/providers/translation-error-boundary';
import { useWorkoutStats, useWorkoutPlans, useWorkoutSessions, useTodaysSessions } from '../../../hooks/use-workout-data';
import { createWorkoutSession } from '../../../lib/api/workout-sessions';

interface WorkoutsPageProps {
  params: Promise<{ locale: string }>;
}

export default function WorkoutsPage({ params }: WorkoutsPageProps) {
  const t = useTranslations('workouts');
  const { locale } = use(params);
  const router = useRouter();
  
  // Fetch real data using hooks
  const { stats, trends, isLoading: statsLoading, error: statsError } = useWorkoutStats();
  const { plans, isLoading: plansLoading, error: plansError } = useWorkoutPlans();
  const { sessions, isLoading: sessionsLoading, error: sessionsError } = useWorkoutSessions();
  const { sessions: todaysSessions, isLoading: todaysLoading, error: todaysError } = useTodaysSessions();
  const handleStartWorkout = useCallback(async (workoutId: string) => {
    try {
      // Find the workout plan
      const plan = plans.find(p => p.id === workoutId);
      if (!plan) {
        console.error('Workout plan not found:', workoutId);
        return;
      }

      // Check if plan has templates
      const templates = plan.planData?.templates || [];
      if (templates.length === 0) {
        // Navigate to plan details for template creation
        const planPath = createLocalizedPath(`workouts/plans/${workoutId}`, locale as 'en' | 'es');
        router.push(planPath);
        return;
      }

      // Create session with first available template
      const template = templates[0];
      const today = new Date();
      
      const createRequest = {
        name: `${template.name} - ${today.toLocaleDateString()}`,
        workoutPlanId: workoutId,
        scheduledDate: today.toISOString(),
        sessionData: template,
        scheduledDuration: template.estimatedDuration || 60,
      };

      const response = await createWorkoutSession(createRequest);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create session');
      }

      // Navigate to session execution
      const sessionPath = createLocalizedPath(`workouts/sessions/${response.data!.id}`, locale as 'en' | 'es');
      router.push(sessionPath);
      
    } catch (error) {
      console.error('Failed to start workout:', error);
      // TODO: Show user-friendly error toast
    }
  }, [plans, router, locale]);

  const handleStartSession = useCallback((sessionId: string) => {
    // Navigate to session execution page
    const sessionPath = createLocalizedPath(`workouts/sessions/${sessionId}`, locale as 'en' | 'es');
    router.push(sessionPath);
  }, [router, locale]);

  const handleContinueSession = useCallback((sessionId: string) => {
    // Navigate to session execution page
    const sessionPath = createLocalizedPath(`workouts/sessions/${sessionId}`, locale as 'en' | 'es');
    router.push(sessionPath);
  }, [router, locale]);

  return (
    <TranslationErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Modern Navigation Header */}
        <AppNavigation locale={locale} variant='workouts' />

        {/* Main Content */}
        <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
          {/* Page Header */}
          <div className='mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h2 className='mb-2 text-3xl font-bold text-gray-900'>
                {t('title')}
              </h2>
              <p className='text-gray-600'>{t('subtitle')}</p>
            </div>
            <div className='mt-4 flex gap-3 sm:mt-0'>
              <Button variant='outline' size='sm'>
                <Filter className='mr-2 h-4 w-4' />
                {t('buttons.filter')}
              </Button>
              <Button asChild>
                <Link
                  href={createLocalizedPath(
                    'workouts/create',
                    locale as 'en' | 'es'
                  )}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  {t('buttons.newWorkout')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className='mb-8'>
            {statsLoading ? (
              <LoadingState variant="centered" message="Loading workout statistics..." />
            ) : statsError ? (
              <ErrorState 
                variant="card"
                message="Error loading workout statistics"
                description={statsError || undefined}
                onRetry={() => window.location.reload()}
              />
            ) : (
              <WorkoutStatsGrid stats={stats} trends={trends} />
            )}
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue='overview' className='w-full'>
            <TabsList className='mb-6 grid w-full grid-cols-4'>
              <TabsTrigger value='overview'>
                <BarChart3 className='mr-2 h-4 w-4' />
                {t('tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value='plans'>
                <Dumbbell className='mr-2 h-4 w-4' />
                {t('tabs.plans')}
              </TabsTrigger>
              <TabsTrigger value='sessions'>
                <Calendar className='mr-2 h-4 w-4' />
                {t('tabs.sessions')}
              </TabsTrigger>
              <TabsTrigger value='library'>
                <Library className='mr-2 h-4 w-4' />
                {t('tabs.library')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value='overview' className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                {/* Progress Overview */}
                <div className='lg:col-span-2'>
                  <ProgressOverview
                    weeklyGoal={4}
                    currentProgress={stats.weeklyWorkouts}
                    monthlyStats={{ planned: 16, completed: Math.min(stats.totalWorkouts, 16) }}
                  />
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>
                      {t('quickActions.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <Button asChild className='w-full justify-start'>
                      <Link
                        href={createLocalizedPath(
                          'workouts/generate',
                          locale as 'en' | 'es'
                        )}
                      >
                        <Sparkles className='mr-2 h-4 w-4' />
                        {t('buttons.generateAI')}
                      </Link>
                    </Button>
                    <Button
                      variant='outline'
                      asChild
                      className='w-full justify-start'
                    >
                      <Link
                        href={createLocalizedPath(
                          'workouts/create-manual',
                          locale as 'en' | 'es'
                        )}
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        {t('buttons.createCustom')}
                      </Link>
                    </Button>
                    <Button
                      variant='outline'
                      asChild
                      className='w-full justify-start'
                    >
                      <Link
                        href={createLocalizedPath(
                          'exercises',
                          locale as 'en' | 'es'
                        )}
                      >
                        <Library className='mr-2 h-4 w-4' />
                        {t('buttons.browseExercises')}
                      </Link>
                    </Button>
                    <Button
                      variant='outline'
                      asChild
                      className='w-full justify-start'
                    >
                      <Link
                        href={createLocalizedPath(
                          'workouts/session',
                          locale as 'en' | 'es'
                        )}
                      >
                        <Play className='mr-2 h-4 w-4' />
                        Demo Session
                      </Link>
                    </Button>
                    <Button
                      variant='outline'
                      asChild
                      className='w-full justify-start'
                    >
                      <Link
                        href={createLocalizedPath(
                          'workouts/dashboard',
                          locale as 'en' | 'es'
                        )}
                      >
                        <LayoutDashboard className='mr-2 h-4 w-4' />
                        Advanced Dashboard
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Sessions */}
              <div>
                <h3 className='mb-4 text-xl font-semibold text-gray-900'>
                  {t('todaySessions.title')}
                </h3>
                {todaysLoading ? (
                  <LoadingState variant="centered" message="Loading today's sessions..." />
                ) : todaysError ? (
                  <ErrorState 
                    variant="card"
                    message="Error loading today's sessions"
                    description={todaysError || undefined}
                    onRetry={() => window.location.reload()}
                  />
                ) : (
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    {todaysSessions.length > 0 ? (
                      todaysSessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          onStart={handleStartSession}
                          onContinue={handleContinueSession}
                        />
                      ))
                    ) : (
                      <div className='col-span-2 py-8 text-center text-gray-500'>
                        <Calendar className='mx-auto mb-3 h-12 w-12 opacity-50' />
                        <p>{t('todaySessions.noSessions')}</p>
                        <Button asChild className='mt-3'>
                          <Link
                            href={createLocalizedPath(
                              'workouts/sessions/schedule',
                              locale as 'en' | 'es'
                            )}
                          >
                            {t('buttons.scheduleSession')}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Workout Plans Tab */}
            <TabsContent value='plans' className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  {t('myPlans.title')}
                </h3>
                <Badge variant='outline'>
                  {plans.length} {t('myPlans.plans')}
                </Badge>
              </div>

              {plansLoading ? (
                <LoadingState variant="centered" message="Loading workout plans..." />
              ) : plansError ? (
                <ErrorState 
                  variant="card"
                  message="Error loading workout plans"
                  description={plansError || undefined}
                  onRetry={() => window.location.reload()}
                />
              ) : (
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {plans.map((plan) => (
                    <WorkoutCard
                      key={plan.id}
                      workout={plan}
                      onStart={handleStartWorkout}
                      showProgress={plan.status === 'active'}
                    />
                  ))}
                  {plans.length === 0 && (
                    <div className='col-span-3 py-8 text-center text-gray-500'>
                      <Dumbbell className='mx-auto mb-3 h-12 w-12 opacity-50' />
                      <p>No workout plans found</p>
                      <Button asChild className='mt-3'>
                        <Link
                          href={createLocalizedPath(
                            'workouts/create',
                            locale as 'en' | 'es'
                          )}
                        >
                          {t('buttons.newWorkout')}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value='sessions' className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  {t('allSessions.title')}
                </h3>
                <div className='flex gap-2'>
                  <Badge variant='success'>
                    {sessions.filter((s) => s.status === 'completed').length}{' '}
                    {t('allSessions.completed')}
                  </Badge>
                  <Badge variant='warning'>
                    {sessions.filter((s) => s.status === 'scheduled').length}{' '}
                    {t('allSessions.scheduled')}
                  </Badge>
                </div>
              </div>

              {sessionsLoading ? (
                <LoadingState variant="centered" message="Loading sessions..." />
              ) : sessionsError ? (
                <ErrorState 
                  variant="card"
                  message="Error loading sessions"
                  description={sessionsError || undefined}
                  onRetry={() => window.location.reload()}
                />
              ) : (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onStart={handleStartSession}
                      onContinue={handleContinueSession}
                    />
                  ))}
                  {sessions.length === 0 && (
                    <div className='col-span-2 py-8 text-center text-gray-500'>
                      <Calendar className='mx-auto mb-3 h-12 w-12 opacity-50' />
                      <p>No sessions found</p>
                      <Button asChild className='mt-3'>
                        <Link
                          href={createLocalizedPath(
                            'workouts/sessions/schedule',
                            locale as 'en' | 'es'
                          )}
                        >
                          {t('buttons.scheduleSession')}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Library Tab */}
            <TabsContent value='library' className='space-y-6'>
              <div className='py-12 text-center'>
                <Library className='mx-auto mb-4 h-16 w-16 text-gray-400' />
                <h3 className='mb-2 text-xl font-semibold text-gray-900'>
                  {t('exerciseLibrary.title')}
                </h3>
                <p className='mx-auto mb-6 max-w-md text-gray-600'>
                  {t('exerciseLibrary.description')}
                </p>
                <Button asChild>
                  <Link
                    href={createLocalizedPath(
                      'exercises',
                      locale as 'en' | 'es'
                    )}
                  >
                    <Library className='mr-2 h-4 w-4' />
                    {t('buttons.browseExercises')}
                  </Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TranslationErrorBoundary>
  );
}
