/**
 * Session Loading States Components
 * Reusable loading and skeleton components for workout session UI
 */
'use client';

import React from 'react';
import { Loader2, Clock, Activity, Target, TrendingUp, Flame, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/loading';
import { Progress } from '@/components/ui/progress';

// ================================
// Session Loading Component
// ================================

export interface SessionLoadingProps {
  /** Loading message */
  message?: string;
  /** Show progress indicator */
  showProgress?: boolean;
  /** Progress value (0-100) */
  progress?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SessionLoading({
  message = 'Loading session...',
  showProgress = false,
  progress = 0,
  size = 'md',
  className,
}: SessionLoadingProps) {
  const sizeConfig = {
    sm: { spinner: 'h-6 w-6', text: 'text-sm', spacing: 'space-y-2' },
    md: { spinner: 'h-8 w-8', text: 'text-base', spacing: 'space-y-3' },
    lg: { spinner: 'h-10 w-10', text: 'text-lg', spacing: 'space-y-4' },
  };

  const config = sizeConfig[size];

  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      <div className={cn('text-center', config.spacing)}>
        <Loader2 className={cn('mx-auto animate-spin text-blue-600', config.spinner)} />
        <p className={cn('text-gray-600', config.text)}>{message}</p>
        
        {showProgress && (
          <div className="w-64 max-w-full">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================
// Session Header Skeleton
// ================================

export function SessionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Skeleton className="h-3 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-4 w-8 mx-auto" />
              <Skeleton className="h-6 w-12 mx-auto" />
              <Skeleton className="h-1 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ================================
// Exercise Card Skeleton
// ================================

export function ExerciseCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target values skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-1">
              <Skeleton className="h-4 w-4 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-4 w-12 mx-auto" />
            </div>
          ))}
        </div>
        
        {/* Input form skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ================================
// Timer Skeleton
// ================================

export function TimerSkeleton({ 
  size = 'md',
  className 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeConfig = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          <Skeleton className="h-3 w-16" />
          <div className={cn('rounded-full border-2 border-gray-200 flex items-center justify-center', sizeConfig[size])}>
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

// ================================
// Navigation Skeleton
// ================================

export function NavigationSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 text-center px-4 space-y-2">
            <Skeleton className="h-4 w-32 mx-auto" />
            <div className="flex items-center justify-center space-x-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded" />
        </div>
        <Skeleton className="h-2 w-full mt-3" />
      </CardContent>
    </Card>
  );
}

// ================================
// Session Stats Skeleton
// ================================

export function SessionStatsSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-6 w-16 mx-auto" />
              <Skeleton className="h-1 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ================================
// Complete Session Skeleton
// ================================

export function SessionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <SessionHeaderSkeleton />
      <TimerSkeleton />
      <ExerciseCardSkeleton />
      <NavigationSkeleton />
    </div>
  );
}

// ================================
// Empty States
// ================================

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="mx-auto mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// Pre-configured empty states
export function NoActiveSessionState({ onStartSession }: { onStartSession?: () => void }) {
  return (
    <EmptyState
      icon={<Clock className="h-12 w-12" />}
      title="No Active Session"
      description="Start a workout session to begin tracking your progress."
      action={
        onStartSession && (
          <button
            onClick={onStartSession}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Session
          </button>
        )
      }
    />
  );
}

export function SessionCompleteState({ 
  onViewResults,
  sessionId,
  showAnalytics = true,
}: { 
  onViewResults?: () => void;
  sessionId?: string;
  showAnalytics?: boolean;
}) {
  const [showFullAnalytics, setShowFullAnalytics] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Completion Header */}
      <EmptyState
        icon={<Target className="h-12 w-12 text-green-600" />}
        title="Session Complete!"
        description="Congratulations on completing your workout session."
        action={
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showAnalytics && sessionId && (
              <button
                onClick={() => setShowFullAnalytics(!showFullAnalytics)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {showFullAnalytics ? 'Hide Analytics' : 'View Analytics'}
              </button>
            )}
            {onViewResults && (
              <button
                onClick={onViewResults}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                View Results
              </button>
            )}
          </div>
        }
      />

      {/* Session Analytics */}
      {showAnalytics && sessionId && (
        <div className="mt-8 space-y-4">
          {!showFullAnalytics ? (
            // Compact Analytics View
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Session Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Exercises</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">6/8</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Duration</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">45<span className="text-sm text-gray-500 ml-1">min</span></span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Calories</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">320<span className="text-sm text-gray-500 ml-1">cal</span></span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Effort</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">7.5<span className="text-sm text-gray-500 ml-1">/10</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Full Analytics View
            <div className="space-y-6">
              {/* Session Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Session Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Exercises Completed</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">6</div>
                      <div className="text-xs text-gray-500">out of 8</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Duration</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">45</div>
                      <div className="text-xs text-gray-500">minutes</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Calories Burned</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">320</div>
                      <div className="text-xs text-gray-500">calories</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">12%</div>
                      <div className="text-sm text-gray-600">Strength Gain</div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">8%</div>
                      <div className="text-sm text-gray-600">Endurance</div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">85</div>
                      <div className="text-sm text-gray-600">Consistency</div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">75%</div>
                      <div className="text-sm text-gray-600">Intensity</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SessionErrorState({ 
  error, 
  onRetry 
}: { 
  error: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<Activity className="h-12 w-12 text-red-500" />}
      title="Session Error"
      description={error}
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )
      }
    />
  );
}