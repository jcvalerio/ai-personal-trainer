/**
 * Session Analytics Component
 * Displays analytics, performance metrics, and comparisons for a workout session
 */
'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  Target, 
  Award,
  Activity,
  Heart,
  Flame,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';
import { 
  useSessionAnalytics,
  type SessionAnalyticsData,
  type SessionAnalyticsOptions 
} from '@/hooks/queries/use-session-analytics';

interface SessionAnalyticsProps {
  sessionId: string;
  options?: SessionAnalyticsOptions;
  compact?: boolean;
  className?: string;
  triggerRefresh?: boolean;
}

interface StatItemProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'same';
  };
  icon?: React.ComponentType<{ className?: string }>;
}

function StatItem({ label, value, unit, trend, icon: Icon = Activity }: StatItemProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <ChevronUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <ChevronDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold text-gray-900">
          {value}{unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </span>
        {trend && (
          <div className={cn("flex items-center gap-1 ml-2", getTrendColor())}>
            {getTrendIcon()}
            <span className="text-xs font-medium">
              {trend.value > 0 ? `+${trend.value}` : trend.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CompactAnalytics({ data }: { data: SessionAnalyticsData }) {
  const { sessionStats, comparisonData } = data;

  const getCalorieTrend = () => {
    if (!comparisonData?.previousSession) return undefined;
    
    const diff = sessionStats.caloriesBurned - comparisonData.previousSession.caloriesBurned;
    return {
      value: diff,
      direction: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'same' as const,
    };
  };

  const getDurationTrend = () => {
    if (!comparisonData?.previousSession) return undefined;
    
    const diff = sessionStats.duration - comparisonData.previousSession.duration;
    return {
      value: diff,
      direction: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'same' as const,
    };
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatItem
        label="Exercises"
        value={sessionStats.completedExercises}
        unit={`/${sessionStats.totalExercises}`}
        icon={Target}
      />
      <StatItem
        label="Duration"
        value={sessionStats.duration}
        unit="min"
        trend={getDurationTrend()}
        icon={Clock}
      />
      <StatItem
        label="Calories"
        value={sessionStats.caloriesBurned}
        unit="cal"
        trend={getCalorieTrend()}
        icon={Flame}
      />
      <StatItem
        label="Effort"
        value={sessionStats.effortRating ? sessionStats.effortRating.toFixed(1) : 'N/A'}
        unit="/10"
        icon={Heart}
      />
    </div>
  );
}

function FullAnalytics({ data }: { data: SessionAnalyticsData }) {
  const { sessionStats, performanceMetrics, comparisonData } = data;

  return (
    <div className="space-y-6">
      {/* Session Statistics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Session Statistics
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Exercises Completed"
            value={sessionStats.completedExercises}
            subtitle={`out of ${sessionStats.totalExercises}`}
            icon={Target}
          />
          <StatCard
            title="Sets Completed"
            value={sessionStats.completedSets}
            subtitle={`out of ${sessionStats.totalSets}`}
            icon={Activity}
          />
          <StatCard
            title="Calories Burned"
            value={sessionStats.caloriesBurned}
            subtitle="calories"
            icon={Flame}
          />
          {sessionStats.totalReps && (
            <StatCard
              title="Reps Completed"
              value={sessionStats.completedReps || 0}
              subtitle={`out of ${sessionStats.totalReps}`}
              icon={Zap}
            />
          )}
          <StatCard
            title="Session Duration"
            value={sessionStats.duration}
            subtitle="minutes"
            icon={Clock}
          />
          {sessionStats.effortRating && (
            <StatCard
              title="Effort Rating"
              value={sessionStats.effortRating.toFixed(1)}
              subtitle="out of 10"
              icon={Heart}
            />
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Strength Gain</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {performanceMetrics.strengthGain}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">Endurance Improvement</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {performanceMetrics.enduranceImprovement}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Consistency Score</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {performanceMetrics.consistencyScore}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Intensity Level</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {performanceMetrics.intensityLevel}%
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Comparisons */}
      {comparisonData && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparisons</h3>
          
          {comparisonData.previousSession && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">vs Previous Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">Calories</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">
                        {sessionStats.caloriesBurned - comparisonData.previousSession.caloriesBurned > 0 
                          ? '+' : ''}
                        {sessionStats.caloriesBurned - comparisonData.previousSession.caloriesBurned} cal
                      </span>
                      {sessionStats.caloriesBurned > comparisonData.previousSession.caloriesBurned ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : sessionStats.caloriesBurned < comparisonData.previousSession.caloriesBurned ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">Duration</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">
                        {sessionStats.duration - comparisonData.previousSession.duration > 0 
                          ? '+' : ''}
                        {sessionStats.duration - comparisonData.previousSession.duration} min
                      </span>
                      {sessionStats.duration > comparisonData.previousSession.duration ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : sessionStats.duration < comparisonData.previousSession.duration ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>

                  {comparisonData.previousSession.effortRating && sessionStats.effortRating && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">Effort</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">
                          {(sessionStats.effortRating - comparisonData.previousSession.effortRating).toFixed(1)}
                        </span>
                        {sessionStats.effortRating > comparisonData.previousSession.effortRating ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : sessionStats.effortRating < comparisonData.previousSession.effortRating ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {comparisonData.personalBests && comparisonData.personalBests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Bests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {comparisonData.personalBests.map((best, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {best.exercise.toLowerCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {best.weight && `${best.weight} lbs`}
                          {best.reps && ` × ${best.reps} reps`}
                          {best.duration && `${best.duration}s`}
                        </Badge>
                        <Award className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export function SessionAnalytics({ 
  sessionId, 
  options = {}, 
  compact = false, 
  className = "",
  triggerRefresh = false 
}: SessionAnalyticsProps) {
  const { data, isLoading, error, refetch } = useSessionAnalytics(sessionId, options);

  // Handle refresh trigger
  React.useEffect(() => {
    if (triggerRefresh) {
      refetch();
    }
  }, [triggerRefresh, refetch]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <LoadingState 
          message="Loading analytics..." 
          variant="card"
          size="md"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <ErrorState
          message="Failed to load analytics"
          description={error instanceof Error ? error.message : 'Unable to load session analytics'}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No analytics available
            </h3>
            <p className="text-gray-600">
              Analytics will be available after completing the session.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {compact ? (
        <CompactAnalytics data={data} />
      ) : (
        <FullAnalytics data={data} />
      )}
    </div>
  );
}