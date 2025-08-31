/**
 * Session Progress Header Component
 * Mobile-first header showing session progress and controls
 */
'use client';

import React from 'react';
import {
  Play,
  Pause,
  Square,
  Settings,
  Clock,
  Activity,
  Target,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export interface SessionProgressHeaderProps {
  /** Session status */
  status: 'idle' | 'active' | 'paused' | 'completed';
  /** Session title/name */
  title: string;
  /** Current exercise info */
  currentExercise: {
    name: string;
    index: number; // 0-based
    total: number;
  };
  /** Overall session progress (0-1) */
  overallProgress: number;
  /** Time elapsed in seconds */
  timeElapsed: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  /** Performance stats */
  stats: {
    setsCompleted: number;
    totalSets: number;
    exercisesCompleted: number;
    totalExercises: number;
  };
  /** Session controls */
  controls: {
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSettings: () => void;
    onBack?: () => void;
  };
  /** Layout variant */
  variant?: 'full' | 'compact';
  /** Show detailed stats */
  showStats?: boolean;
  className?: string;
}

export function SessionProgressHeader({
  status,
  title,
  currentExercise,
  overallProgress,
  timeElapsed,
  estimatedTimeRemaining,
  stats,
  controls,
  variant = 'full',
  showStats = true,
  className,
}: SessionProgressHeaderProps) {
  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status badge variant and text
  const getStatusInfo = () => {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, text: 'Active', color: 'text-green-600' };
      case 'paused':
        return { variant: 'secondary' as const, text: 'Paused', color: 'text-yellow-600' };
      case 'completed':
        return { variant: 'success' as const, text: 'Completed', color: 'text-blue-600' };
      default:
        return { variant: 'outline' as const, text: 'Ready', color: 'text-gray-600' };
    }
  };

  const statusInfo = getStatusInfo();

  // Determine if session is active
  const isSessionActive = status === 'active' || status === 'paused';

  if (variant === 'compact') {
    return (
      <Card className={cn('mb-4', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {/* Back Button (if provided) */}
            {controls.onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={controls.onBack}
                className="mr-2 min-w-[44px] min-h-[44px] p-0"
                aria-label="Go back"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Title and Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base truncate">{title}</CardTitle>
                <Badge variant={statusInfo.variant} className="flex-shrink-0">
                  {statusInfo.text}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Exercise {currentExercise.index + 1} of {currentExercise.total}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={status === 'active' ? controls.onPause : controls.onPlay}
                className="min-w-[44px] min-h-[44px] p-0"
                aria-label={status === 'active' ? 'Pause session' : 'Start/Resume session'}
              >
                {status === 'active' ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress 
            value={overallProgress * 100} 
            className="h-2 mt-3" 
          />
          <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
            <span>{Math.round(overallProgress * 100)}% Complete</span>
            <span>{formatTime(timeElapsed)}</span>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Full variant
  return (
    <Card className={cn('mb-6', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          {/* Session Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {controls.onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={controls.onBack}
                  className="mr-1 min-w-[44px] min-h-[44px] p-0"
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="text-xl">{title}</CardTitle>
              <Badge variant={statusInfo.variant}>
                {statusInfo.text}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600">
              Exercise {currentExercise.index + 1} of {currentExercise.total}: {currentExercise.name}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={status === 'active' ? controls.onPause : controls.onPlay}
              className="min-w-[44px] min-h-[44px]"
              disabled={status === 'completed'}
            >
              {status === 'active' ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {status === 'paused' ? 'Resume' : 'Start'}
                </>
              )}
            </Button>

            {isSessionActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={controls.onStop}
                className="min-w-[44px] min-h-[44px]"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={controls.onSettings}
              className="min-w-[44px] min-h-[44px] p-0"
              aria-label="Session settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3 mt-4">
          {/* Main Progress Bar */}
          <div>
            <Progress 
              value={overallProgress * 100} 
              className="h-3" 
              variant={status === 'completed' ? 'success' : 'default'}
            />
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className={statusInfo.color}>
                {Math.round(overallProgress * 100)}% Complete
              </span>
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatTime(timeElapsed)}</span>
                {estimatedTimeRemaining && status !== 'completed' && (
                  <span className="text-xs">
                    (≈ {formatTime(estimatedTimeRemaining)} remaining)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Stats Section */}
      {showStats && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {/* Current Exercise Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-1 text-gray-600">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Exercise</span>
              </div>
              <div className="text-lg font-bold">
                {currentExercise.index + 1}/{currentExercise.total}
              </div>
              <Progress 
                value={currentExercise.total > 0 ? ((currentExercise.index + 1) / currentExercise.total) * 100 : 0}
                className="h-1"
                variant="success"
              />
            </div>

            {/* Completed Exercises */}
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-1 text-gray-600">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">Completed</span>
              </div>
              <div className="text-lg font-bold">
                {stats.exercisesCompleted}/{stats.totalExercises}
              </div>
              <Progress 
                value={stats.totalExercises > 0 ? (stats.exercisesCompleted / stats.totalExercises) * 100 : 0}
                className="h-1"
                variant="success"
              />
            </div>

            {/* Session Duration */}
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-1 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Duration</span>
              </div>
              <div className="text-lg font-bold">
                {formatTime(timeElapsed)}
              </div>
              <div className="text-xs text-gray-500">
                {status === 'active' ? 'Active' : 'Total'}
              </div>
            </div>

            {/* Completion Rate */}
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-1 text-gray-600">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Progress</span>
              </div>
              <div className="text-lg font-bold">
                {Math.round(overallProgress * 100)}%
              </div>
              <div className="text-xs text-gray-500">
                Overall
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}