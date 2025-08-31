/**
 * Individual Workout Plan Detail Page
 * View and manage a specific workout plan
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  Dumbbell,
  Calendar,
  Clock,
  Target,
  Play,
  Edit,
  MoreVertical,
  Users,
  ArrowLeft,
  Share2,
  Copy,
  Pause,
  Archive,
  BarChart3,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SessionCard } from '@/components/workouts/session-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WeeklySchedule } from '@/components/workouts/ui/weekly-schedule';
import { SessionCreationDialog } from '@/components/workouts/ui/session-creation-dialog';
import { QuickSessionStarter } from '@/components/workouts/ui/quick-session-starter';
import { createLocalizedPath } from '@/lib/localized-navigation';
import { 
  getWorkoutPlan, 
  getWorkoutPlanSessions,
  startWorkoutPlan
} from '@/lib/api/workout-plans';
import { createWorkoutSession } from '@/lib/api/workout-sessions';
import type { WorkoutPlan, WorkoutSession } from '@/types/workouts';

interface PageProps {
  params: Promise<{ locale: string; planId: string }>;
}

// Loading and error states
interface PlanProgress {
  completionPercentage: number;
  currentWeek: number;
  completedSessions: number;
  totalSessions: number;
}

interface PageState {
  plan: (WorkoutPlan & { progress?: PlanProgress }) | null;
  sessions: WorkoutSession[];
  isLoading: boolean;
  error: string | null;
  sessionsLoading: boolean;
  sessionsError: string | null;
  startingPlan: boolean;
  startPlanError: string | null;
  isSessionCreationOpen: boolean;
  selectedDateForSession: Date | null;
}

export default function WorkoutPlanDetailPage({ params }: PageProps) {
  const { locale, planId } = use(params);
  const router = useRouter();
  
  // State management - ALL HOOKS AT TOP LEVEL
  const [state, setState] = useState<PageState>({
    plan: null,
    sessions: [],
    isLoading: true,
    error: null,
    sessionsLoading: false,
    sessionsError: null,
    startingPlan: false,
    startPlanError: null,
    isSessionCreationOpen: false,
    selectedDateForSession: null,
  });

  // All callbacks defined before any conditional logic
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

  const handleStartPlan = useCallback(async () => {
    if (!state.plan || state.startingPlan) return;

    setState(prev => ({
      ...prev,
      startingPlan: true,
      startPlanError: null,
    }));

    try {
      const response = await startWorkoutPlan(planId, {
        generateInitialSessions: true,
      });

      if (response.success && response.data) {
        // Update plan data with the activated plan
        setState(prev => ({
          ...prev,
          plan: response.data!,
          startingPlan: false,
          startPlanError: null,
        }));

        // Refresh sessions data after starting the plan
        setTimeout(async () => {
          try {
            const sessionsResponse = await getWorkoutPlanSessions(planId, {
              limit: 20,
              sortBy: 'scheduledDate',
              sortOrder: 'desc',
            });
            
            if (sessionsResponse.success && sessionsResponse.data) {
              setState(prev => ({
                ...prev,
                sessions: sessionsResponse.data!,
              }));
            }
          } catch (error) {
            console.warn('Failed to refresh sessions after starting plan:', error);
          }
        }, 1000);
      } else {
        setState(prev => ({
          ...prev,
          startingPlan: false,
          startPlanError: typeof response.error === 'string' ? response.error : 'Failed to start workout plan',
        }));
      }
    } catch (error) {
      console.error('Error starting plan:', error);
      setState(prev => ({
        ...prev,
        startingPlan: false,
        startPlanError: 'An unexpected error occurred',
      }));
    }
  }, [planId, state.plan, state.startingPlan]);

  // Session creation handlers
  const handleCreateSession = useCallback((date?: Date) => {
    setState(prev => ({
      ...prev,
      selectedDateForSession: date || new Date(),
      isSessionCreationOpen: true,
    }));
  }, []);

  const handleSessionCreated = useCallback((sessionId: string) => {
    // Refresh sessions after creation
    const refetchSessions = async () => {
      try {
        const response = await getWorkoutPlanSessions(planId, {
          limit: 20,
          sortBy: 'scheduledDate',
          sortOrder: 'desc',
        });
        
        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            sessions: response.data!,
          }));
        }
      } catch (error) {
        console.error('Failed to refresh sessions:', error);
      }
    };

    refetchSessions();

    // Start the newly created session
    handleStartSession(sessionId);
  }, [planId, handleStartSession]);

  const handleCloseSessionCreation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSessionCreationOpen: false,
      selectedDateForSession: null,
    }));
  }, []);

  const handleRefreshSessions = useCallback(async () => {
    setState(prev => ({ ...prev, sessionsLoading: true, sessionsError: null }));
    
    try {
      const response = await getWorkoutPlanSessions(planId, {
        limit: 20,
        sortBy: 'scheduledDate',
        sortOrder: 'desc',
      });
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          sessions: response.data!,
          sessionsLoading: false,
          sessionsError: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          sessionsLoading: false,
          sessionsError: response.error || 'Failed to load sessions',
        }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        sessionsLoading: false,
        sessionsError: 'An unexpected error occurred loading sessions',
      }));
    }
  }, [planId]);

  // Fetch workout plan data
  useEffect(() => {
    async function fetchPlan() {
      try {
        const response = await getWorkoutPlan(planId);
        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            plan: response.data!,
            isLoading: false,
            error: null,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: response.error || 'Failed to load workout plan',
          }));
        }
      } catch {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'An unexpected error occurred',
        }));
      }
    }

    fetchPlan();
  }, [planId]);

  // Fetch sessions for the plan
  useEffect(() => {
    async function fetchSessions() {
      if (!state.plan) return;
      
      setState(prev => ({ ...prev, sessionsLoading: true, sessionsError: null }));
      
      try {
        const response = await getWorkoutPlanSessions(planId, {
          limit: 20, // Get first 20 sessions
          sortBy: 'scheduledDate',
          sortOrder: 'desc',
        });
        
        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            sessions: response.data!,
            sessionsLoading: false,
            sessionsError: null,
          }));
        } else {
          setState(prev => ({
            ...prev,
            sessionsLoading: false,
            sessionsError: response.error || 'Failed to load sessions',
          }));
        }
      } catch {
        setState(prev => ({
          ...prev,
          sessionsLoading: false,
          sessionsError: 'An unexpected error occurred loading sessions',
        }));
      }
    }

    fetchSessions();
  }, [planId, state.plan]);

  // Loading state - CONDITIONAL LOGIC AFTER ALL HOOKS
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingState 
          message="Loading workout plan..." 
          size="lg" 
          variant="centered"
        />
      </div>
    );
  }

  // Error state
  if (state.error || !state.plan) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <ErrorState
            message="Failed to load workout plan"
            description={state.error || 'Workout plan not found'}
            variant="card"
            onRetry={() => window.location.reload()}
            showRetry={!!state.error}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  const { plan } = state;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'secondary';
      case 'paused':
        return 'warning';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getFitnessLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='sticky top-0 z-40 border-b border-gray-200 bg-white'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          {/* Mobile Header */}
          <div className='flex h-16 items-center justify-between lg:hidden'>
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              <Link
                href='/workouts/plans'
                className='rounded-lg p-2 transition-colors hover:bg-gray-100 flex-shrink-0'
              >
                <ArrowLeft className='h-5 w-5 text-gray-600' />
              </Link>
              <div className='flex items-center gap-3 min-w-0 flex-1'>
                <div className='rounded-xl bg-blue-100 p-2 flex-shrink-0'>
                  <Dumbbell className='h-6 w-6 text-blue-600' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h1 className='text-lg font-bold text-gray-900 truncate'>
                    {plan.name}
                  </h1>
                  <p className='text-xs text-gray-500'>Workout Plan</p>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-2 flex-shrink-0'>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant='outline' size='sm' className='min-h-[44px] min-w-[44px] p-2'>
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Plan Actions</DialogTitle>
                    <DialogDescription>
                      Manage your workout plan
                    </DialogDescription>
                  </DialogHeader>
                  <div className='grid gap-3'>
                    <Button variant='outline' className='justify-start min-h-[44px]'>
                      <Share2 className='mr-2 h-4 w-4' />
                      Share Plan
                    </Button>
                    <Button variant='outline' className='justify-start min-h-[44px]'>
                      <Edit className='mr-2 h-4 w-4' />
                      Edit Plan
                    </Button>
                    <Button variant='outline' className='justify-start min-h-[44px]'>
                      <Copy className='mr-2 h-4 w-4' />
                      Duplicate Plan
                    </Button>
                    <Button variant='outline' className='justify-start min-h-[44px]'>
                      <Pause className='mr-2 h-4 w-4' />
                      Pause Plan
                    </Button>
                    <Button variant='destructive' className='justify-start min-h-[44px]'>
                      <Archive className='mr-2 h-4 w-4' />
                      Archive Plan
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  },
                }}
                showName={false}
              />
            </div>
          </div>

          {/* Desktop Header */}
          <div className='hidden lg:flex h-16 items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Link
                href='/workouts/plans'
                className='rounded-lg p-2 transition-colors hover:bg-gray-100'
              >
                <ArrowLeft className='h-5 w-5 text-gray-600' />
              </Link>
              <div className='flex items-center gap-3'>
                <div className='rounded-xl bg-blue-100 p-2'>
                  <Dumbbell className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <h1 className='text-xl font-bold text-gray-900'>
                    {plan.name}
                  </h1>
                  <p className='text-xs text-gray-500'>Workout Plan Details</p>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <Button variant='outline' size='sm'>
                <Share2 className='mr-2 h-4 w-4' />
                Share
              </Button>
              <Button variant='outline' size='sm'>
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Plan Actions</DialogTitle>
                    <DialogDescription>
                      Manage your workout plan
                    </DialogDescription>
                  </DialogHeader>
                  <div className='grid gap-2'>
                    <Button variant='outline' className='justify-start'>
                      <Copy className='mr-2 h-4 w-4' />
                      Duplicate Plan
                    </Button>
                    <Button variant='outline' className='justify-start'>
                      <Pause className='mr-2 h-4 w-4' />
                      Pause Plan
                    </Button>
                    <Button variant='destructive' className='justify-start'>
                      <Archive className='mr-2 h-4 w-4' />
                      Archive Plan
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  },
                }}
                showName={false}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Plan Overview */}
        <div className='mb-8 grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-3'>
          {/* Main Info */}
          <div className='lg:col-span-2'>
            <Card>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='mb-2 flex items-center gap-2'>
                      <Badge variant={getStatusColor(plan.status)}>
                        {plan.status}
                      </Badge>
                      <Badge
                        variant={getFitnessLevelColor(plan.targetFitnessLevel)}
                      >
                        {plan.targetFitnessLevel}
                      </Badge>
                    </div>
                    <CardTitle className='mb-2 text-2xl'>{plan.name}</CardTitle>
                    <CardDescription className='text-base'>
                      {plan.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className='mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Calendar className='h-4 w-4' />
                    <span>{plan.durationWeeks} weeks</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Target className='h-4 w-4' />
                    <span>{plan.sessionsPerWeek}/week</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Clock className='h-4 w-4' />
                    <span>{plan.estimatedSessionDuration} min</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Users className='h-4 w-4' />
                    <span>Individual</span>
                  </div>
                </div>

                {plan.fitnessGoals && plan.fitnessGoals.length > 0 && (
                  <div>
                    <p className='mb-2 text-sm font-medium text-gray-700'>
                      Fitness Goals:
                    </p>
                    <div className='mb-6 flex flex-wrap gap-2'>
                      {plan.fitnessGoals.map((goal, index) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='capitalize'
                        >
                          {goal.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {plan.status === 'active' && (
                  <QuickSessionStarter
                    workoutPlan={plan}
                    todaysSessions={state.sessions.filter(session => {
                      const today = new Date();
                      const sessionDate = new Date(session.scheduledDate);
                      return today.toDateString() === sessionDate.toDateString();
                    })}
                    availableTemplates={plan.planData.templates || []}
                    onSessionCreated={handleSessionCreated}
                    onStartSession={handleStartSession}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {plan.status === 'active' && plan.progress && (
                  <div className='space-y-4'>
                    <div>
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-sm font-medium text-gray-700'>
                          Overall Progress
                        </span>
                        <span className='text-sm text-gray-500'>
                          {plan.progress.completionPercentage}%
                        </span>
                      </div>
                      <Progress
                        value={plan.progress.completionPercentage}
                        variant='success'
                        className='mb-2'
                      />
                      <p className='text-xs text-gray-500'>
                        Week {plan.progress.currentWeek} of {plan.durationWeeks}
                      </p>
                    </div>

                    <Separator />

                    <div className='grid grid-cols-2 gap-4 text-center'>
                      <div>
                        <div className='text-2xl font-bold text-blue-600'>
                          {plan.progress.completedSessions}
                        </div>
                        <div className='text-xs text-gray-500'>Completed</div>
                      </div>
                      <div>
                        <div className='text-2xl font-bold text-gray-900'>
                          {plan.progress.totalSessions}
                        </div>
                        <div className='text-xs text-gray-500'>
                          Total Sessions
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className='text-center'>
                      <p className='mb-1 text-sm font-medium text-gray-700'>
                        Current Phase
                      </p>
                      <Badge variant='default'>
                        {
                          plan.planData.phases[
                            Math.min(
                              Math.floor(plan.progress.currentWeek / 4),
                              plan.planData.phases.length - 1
                            )
                          ]?.name
                        }
                      </Badge>
                    </div>
                  </div>
                )}

                {plan.status !== 'active' && (
                  <div className='py-4 text-center'>
                    <p className='text-gray-600'>Plan is {plan.status}</p>
                    {plan.status === 'draft' && (
                      <>
                        <Button 
                          className='mt-3 w-full min-h-[44px]'
                          onClick={handleStartPlan}
                          disabled={state.startingPlan}
                        >
                          {state.startingPlan ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 mr-2 border-b-2 border-white"></div>
                              Starting Plan...
                            </>
                          ) : (
                            <>
                              <Play className='mr-2 h-4 w-4' />
                              Start Plan
                            </>
                          )}
                        </Button>
                        {state.startPlanError && (
                          <p className="mt-2 text-sm text-red-600">
                            {state.startPlanError}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue='sessions' className='w-full'>
          <TabsList className='grid w-full grid-cols-2 sm:grid-cols-4 mb-2'>
            <TabsTrigger value='sessions' className='text-sm'>Sessions</TabsTrigger>
            <TabsTrigger value='schedule' className='text-sm'>Schedule</TabsTrigger>
            <TabsTrigger value='phases' className='text-sm'>Phases</TabsTrigger>
            <TabsTrigger value='analytics' className='text-sm'>Analytics</TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value='sessions' className='mt-6'>
            {state.sessionsLoading ? (
              <LoadingState 
                message="Loading sessions..." 
                variant="centered"
                className="py-12"
              />
            ) : state.sessionsError ? (
              <ErrorState
                message="Failed to load sessions"
                description={state.sessionsError}
                variant="card"
                onRetry={() => {
                  // Retry sessions fetch
                  setState(prev => ({ ...prev, sessionsLoading: true, sessionsError: null }));
                  // Re-trigger sessions fetch
                  const refetch = async () => {
                    try {
                      const response = await getWorkoutPlanSessions(planId, {
                        limit: 20,
                        sortBy: 'scheduledDate',
                        sortOrder: 'desc',
                      });
                      
                      if (response.success && response.data) {
                        setState(prev => ({
                          ...prev,
                          sessions: response.data!,
                          sessionsLoading: false,
                          sessionsError: null,
                        }));
                      } else {
                        setState(prev => ({
                          ...prev,
                          sessionsLoading: false,
                          sessionsError: response.error || 'Failed to load sessions',
                        }));
                      }
                    } catch {
                      setState(prev => ({
                        ...prev,
                        sessionsLoading: false,
                        sessionsError: 'An unexpected error occurred loading sessions',
                      }));
                    }
                  };
                  refetch();
                }}
                className="mx-auto max-w-md"
              />
            ) : state.sessions.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {state.sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onStart={handleStartSession}
                    onContinue={handleContinueSession}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Create your first workout session to get started with this plan.
                </p>
                <Button 
                  variant="outline" 
                  className="min-h-[44px]"
                  onClick={() => handleCreateSession()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value='schedule' className='mt-6'>
            <WeeklySchedule
              workoutPlan={plan}
              sessions={state.sessions}
              availableTemplates={plan.planData.templates || []}
              isLoading={state.sessionsLoading}
              error={state.sessionsError}
              onCreateSession={handleCreateSession}
              onStartSession={handleStartSession}
              onRefresh={handleRefreshSessions}
            />
          </TabsContent>

          {/* Phases Tab */}
          <TabsContent value='phases' className='mt-6'>
            <div className='space-y-4'>
              {plan.planData.phases.map((phase, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <div>
                        <CardTitle className='text-lg'>{phase.name}</CardTitle>
                        <CardDescription>{phase.description}</CardDescription>
                      </div>
                      <Badge variant='outline'>
                        {phase.durationWeeks} weeks
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-gray-600'>
                      Phase {index + 1} of {plan.planData.phases.length}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value='analytics' className='mt-6'>
            <div className='py-12 text-center'>
              <BarChart3 className='mx-auto mb-4 h-16 w-16 text-gray-400' />
              <h3 className='mb-2 text-lg font-medium text-gray-900'>
                Analytics Coming Soon
              </h3>
              <p className='mx-auto max-w-md text-gray-600'>
                Detailed analytics and progress tracking will be available once
                you complete more sessions.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Session Creation Dialog */}
      <SessionCreationDialog
        isOpen={state.isSessionCreationOpen}
        onClose={handleCloseSessionCreation}
        onSessionCreated={handleSessionCreated}
        workoutPlan={plan}
        selectedDate={state.selectedDateForSession || new Date()}
        availableTemplates={plan.planData.templates || []}
      />
    </div>
  );
}
