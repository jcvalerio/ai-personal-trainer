/**
 * Session Results Page
 * Mobile-first view for completed workout session analytics and results
 */
'use client';

import { useEffect, useState, use } from 'react';
import { ArrowLeft, Award, Calendar, Clock, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow, format } from 'date-fns';

import { AppNavigation } from '@/components/navigation/app-navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionAnalytics } from '@/components/workouts/analytics/session-analytics';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { getWorkoutSession } from '@/lib/api/workout-sessions';
import { useHydrationSafeTime } from '@/lib/hooks/use-hydration-safe-time';
import type { WorkoutSession } from '@/types/workouts';

interface PageProps {
  params: Promise<{ locale: string; sessionId: string }>;
}

interface SessionResultsSummaryProps {
  session: WorkoutSession;
}

function SessionResultsSummary({ session }: SessionResultsSummaryProps) {
  const t = useTranslations('workouts');
  const { isHydrated, currentTime } = useHydrationSafeTime();

  if (!session || session.status !== 'completed') {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {session.name}
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Award className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Completion Time */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Completed</p>
              <p className="text-xs text-gray-500">
                {session.completedAt && isHydrated
                  ? formatDistanceToNow(session.completedAt, { addSuffix: true })
                  : session.completedAt
                  ? format(session.completedAt, 'MMM d, h:mm a')
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Duration</p>
              <p className="text-lg font-bold text-gray-900">
                {session.actualDuration ? `${session.actualDuration} min` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Exercise Count */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Target className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Exercises</p>
              <p className="text-lg font-bold text-gray-900">
                {session.sessionData?.totalExercises || 0}
              </p>
            </div>
          </div>

          {/* Effort Rating */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Award className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Effort Rating</p>
              <p className="text-lg font-bold text-gray-900">
                {session.effortRating ? `${session.effortRating}/10` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Target Muscle Groups */}
        {session.sessionData?.targetMuscleGroups && 
         session.sessionData.targetMuscleGroups.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Target Muscle Groups:
            </p>
            <div className="flex flex-wrap gap-2">
              {session.sessionData.targetMuscleGroups.map((muscle, index) => (
                <Badge key={index} variant="outline" className="text-xs capitalize">
                  {muscle}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SessionResultsPage({ params }: PageProps) {
  const { locale, sessionId } = use(params);
  const t = useTranslations('workouts');
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        const res = await getWorkoutSession(sessionId);
        if (!mounted) return;
        
        if (res.success && res.data) {
          // For demo purposes, allow viewing results for any session status
          // In production, you might want to restrict to completed sessions only
          setSession(res.data);
          
          // Optional: Show a warning for non-completed sessions
          if (res.data.status !== 'completed') {
            console.warn('Showing results for non-completed session:', res.data.status);
          }
        } else {
          setError(res.error || 'Failed to load session');
        }
      } catch (err) {
        if (!mounted) return;
        setError('Failed to load session data');
        console.error('Session loading error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const handleGoBack = () => {
    // Navigate back to workouts page with sessions tab selected
    window.location.href = `/${locale}/workouts`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation locale={locale} variant="workouts" />
      
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="mb-4 -ml-2 touch-manipulation min-h-[44px] px-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workouts
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Session Results
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            View your workout performance and analytics
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingState
            message="Loading session results..."
            size="lg"
            variant="centered"
          />
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorState
            message="Unable to load results"
            description={error}
            onRetry={() => window.location.reload()}
            variant="card"
          />
        )}

        {/* Results Content */}
        {session && !loading && !error && (
          <div className="space-y-6">
            {/* Session Summary */}
            <SessionResultsSummary session={session} />

            {/* Detailed Analytics */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Detailed Analytics
              </h2>
              <SessionAnalytics
                sessionId={sessionId}
                compact={false}
                options={{
                  includePerformanceMetrics: true,
                  includeProgressComparison: true,
                  includeMuscleGroupAnalysis: true,
                  includeCalorieEstimation: true,
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}