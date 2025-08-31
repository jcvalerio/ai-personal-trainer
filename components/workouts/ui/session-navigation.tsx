/**
 * Session Navigation Component
 * Mobile-first navigation for moving between exercises with touch-friendly controls
 */
'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  SkipForward,
  SkipBack,
  Check,
  Flag,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface SessionNavigationProps {
  /** Current exercise index (0-based) */
  currentExerciseIndex: number;
  /** Total number of exercises */
  totalExercises: number;
  /** Current exercise info */
  currentExercise: {
    name: string;
    phase?: 'warmup' | 'main' | 'cooldown';
    progress: number; // 0-1
    isCompleted: boolean;
  };
  /** Can navigate backwards */
  canGoPrevious: boolean;
  /** Can navigate forwards */
  canGoNext: boolean;
  /** Is session complete */
  isSessionComplete: boolean;
  /** Navigation handlers */
  onPrevious: () => void;
  onNext: () => void;
  onSkipExercise?: () => void;
  onCompleteSession?: () => void;
  onJumpToExercise?: (index: number) => void;
  /** Show exercise list */
  showExerciseList?: boolean;
  /** All exercises info for list */
  exercises?: Array<{
    name: string;
    phase?: 'warmup' | 'main' | 'cooldown';
    progress: number;
    isCompleted: boolean;
    isActive: boolean;
  }>;
  /** Layout variant */
  variant?: 'compact' | 'full';
  className?: string;
}

export function SessionNavigation({
  currentExerciseIndex,
  totalExercises,
  currentExercise,
  canGoPrevious,
  canGoNext,
  isSessionComplete,
  onPrevious,
  onNext,
  onSkipExercise,
  onCompleteSession,
  onJumpToExercise,
  showExerciseList = false,
  exercises = [],
  variant = 'compact',
  className,
}: SessionNavigationProps) {
  const [showExerciseListExpanded, setShowExerciseListExpanded] = React.useState(showExerciseList);

  // Get phase color and label
  const getPhaseInfo = (phase?: 'warmup' | 'main' | 'cooldown') => {
    switch (phase) {
      case 'warmup':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Warm-up' };
      case 'main':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Main' };
      case 'cooldown':
        return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Cool-down' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Exercise' };
    }
  };

  const phaseInfo = getPhaseInfo(currentExercise.phase);

  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="min-w-[44px] min-h-[44px] p-0"
              aria-label="Previous exercise"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Current Exercise Info */}
            <div className="flex-1 text-center px-4">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {currentExercise.name}
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Badge variant="outline" className={cn('text-xs', phaseInfo.color)}>
                  {phaseInfo.label}
                </Badge>
                <span>
                  {currentExerciseIndex + 1} / {totalExercises}
                </span>
              </div>
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={isSessionComplete ? onCompleteSession : onNext}
              disabled={!isSessionComplete && !canGoNext}
              className="min-w-[44px] min-h-[44px] p-0"
              aria-label={isSessionComplete ? "Complete session" : "Next exercise"}
            >
              {isSessionComplete ? (
                <Flag className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <Progress 
              value={((currentExerciseIndex + currentExercise.progress) / totalExercises) * 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Navigation Card */}
      <Card>
        <CardContent className="p-6">
          {/* Current Exercise Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Badge variant="outline" className={cn('text-sm', phaseInfo.color)}>
                {phaseInfo.label}
              </Badge>
              <span className="text-sm text-gray-500">
                Exercise {currentExerciseIndex + 1} of {totalExercises}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentExercise.name}
            </h3>
            
            {/* Exercise Progress */}
            <div className="max-w-xs mx-auto">
              <Progress 
                value={currentExercise.progress * 100} 
                className="h-2 mb-2"
                variant={currentExercise.isCompleted ? 'success' : 'default'}
              />
              <div className="text-xs text-gray-500">
                {Math.round(currentExercise.progress * 100)}% Complete
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center space-x-4">
            {/* Skip Back */}
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="min-w-[48px] min-h-[48px]"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            {/* Previous */}
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="min-h-[48px] px-6"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {/* Skip Exercise (if available) */}
            {onSkipExercise && !currentExercise.isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkipExercise}
                className="min-h-[48px] text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
              >
                Skip Exercise
              </Button>
            )}

            {/* Next / Complete Session */}
            {isSessionComplete ? (
              <Button
                onClick={onCompleteSession}
                className="min-h-[48px] px-6 bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Complete Session
              </Button>
            ) : (
              <Button
                onClick={onNext}
                disabled={!canGoNext}
                className="min-h-[48px] px-6"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Skip Forward */}
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={!canGoNext && !isSessionComplete}
              className="min-w-[48px] min-h-[48px]"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Exercise List Toggle */}
          {exercises.length > 0 && (
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExerciseListExpanded(!showExerciseListExpanded)}
                className="text-gray-500 hover:text-gray-700"
              >
                <MoreHorizontal className="mr-2 h-4 w-4" />
                {showExerciseListExpanded ? 'Hide' : 'Show'} Exercise List
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise List */}
      {showExerciseListExpanded && exercises.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">All Exercises</h4>
            <div className="space-y-2">
              {exercises.map((exercise, index) => {
                const exercisePhaseInfo = getPhaseInfo(exercise.phase);
                return (
                  <button
                    key={index}
                    onClick={() => onJumpToExercise?.(index)}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition-colors',
                      'min-h-[48px] touch-manipulation',
                      exercise.isActive 
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-offset-2' 
                        : 'bg-white border-gray-200 hover:bg-gray-50',
                      exercise.isCompleted && 'bg-green-50 border-green-200'
                    )}
                    disabled={!onJumpToExercise}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium truncate">
                            {index + 1}. {exercise.name}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs flex-shrink-0', exercisePhaseInfo.color)}
                          >
                            {exercisePhaseInfo.label}
                          </Badge>
                        </div>
                        <Progress 
                          value={exercise.progress * 100} 
                          className="h-1"
                          variant={exercise.isCompleted ? 'success' : 'default'}
                        />
                      </div>
                      <div className="ml-3">
                        {exercise.isCompleted && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}