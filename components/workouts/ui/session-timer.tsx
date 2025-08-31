/**
 * Session Timer Component
 * Mobile-first, accessible timer display for workout sessions
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock, Timer, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface SessionTimerProps {
  /** Timer duration in seconds */
  duration: number;
  /** Is timer running */
  isRunning: boolean;
  /** Is timer paused */
  isPaused: boolean;
  /** Timer type */
  type: 'rest' | 'work' | 'transition' | 'ready';
  /** Timer label */
  label?: string;
  /** Auto start timer */
  autoStart?: boolean;
  /** Show progress ring */
  showProgress?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color scheme based on timer type */
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  /** Timer event handlers */
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onComplete?: () => void;
  onReset?: () => void;
  /** Accessibility features */
  announceTime?: boolean;
  className?: string;
}

export function SessionTimer({
  duration,
  isRunning,
  isPaused,
  type,
  label,
  autoStart = false,
  showProgress = true,
  size = 'md',
  variant,
  onStart,
  onPause,
  onResume,
  onComplete,
  onReset,
  announceTime = true,
  className,
}: SessionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [hasStarted, setHasStarted] = useState(false);

  // Auto-determine variant based on timer type
  const getVariant = () => {
    if (variant) return variant;
    switch (type) {
      case 'rest':
        return 'success' as const;
      case 'work':
        return 'destructive' as const;
      case 'transition':
        return 'warning' as const;
      case 'ready':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  const currentVariant = getVariant();

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-24 h-24',
      text: 'text-sm',
      button: 'h-6 w-6',
      icon: 'h-3 w-3',
    },
    md: {
      container: 'w-32 h-32',
      text: 'text-lg',
      button: 'h-8 w-8',
      icon: 'h-4 w-4',
    },
    lg: {
      container: 'w-40 h-40',
      text: 'text-2xl',
      button: 'h-10 w-10',
      icon: 'h-5 w-5',
    },
    xl: {
      container: 'w-48 h-48',
      text: 'text-3xl',
      button: 'h-12 w-12',
      icon: 'h-6 w-6',
    },
  };

  const config = sizeConfig[size];

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          
          // Announce time for accessibility (every 10 seconds or last 5 seconds)
          if (announceTime && (newTime % 10 === 0 || newTime <= 5) && newTime > 0) {
            // Screen reader announcement
            const announcement = `${newTime} seconds remaining`;
            const utterance = new SpeechSynthesisUtterance(announcement);
            utterance.volume = 0.1; // Low volume for screen readers
            speechSynthesis.speak(utterance);
          }

          if (newTime <= 0) {
            onComplete?.();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeRemaining, announceTime, onComplete]);

  // Auto-start logic
  useEffect(() => {
    if (autoStart && !hasStarted && timeRemaining === duration) {
      setHasStarted(true);
      onStart?.();
    }
  }, [autoStart, hasStarted, timeRemaining, duration, onStart]);

  // Reset timer when duration changes
  useEffect(() => {
    setTimeRemaining(duration);
    setHasStarted(false);
  }, [duration]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? ((duration - timeRemaining) / duration) * 100 : 0;

  // Handle play/pause
  const handlePlayPause = () => {
    if (!hasStarted || (!isRunning && !isPaused)) {
      setHasStarted(true);
      onStart?.();
    } else if (isRunning) {
      onPause?.();
    } else if (isPaused) {
      onResume?.();
    }
  };

  // Handle reset
  const handleReset = () => {
    setTimeRemaining(duration);
    setHasStarted(false);
    onReset?.();
  };

  // Color schemes
  const colorConfig = {
    default: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      accent: 'text-blue-600',
      progress: 'default' as const,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      accent: 'text-green-600',
      progress: 'success' as const,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      accent: 'text-yellow-600',
      progress: 'warning' as const,
    },
    destructive: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      accent: 'text-red-600',
      progress: 'destructive' as const,
    },
  };

  const colors = colorConfig[currentVariant];

  return (
    <Card 
      className={cn(
        'touch-manipulation transition-all duration-200',
        colors.bg,
        colors.border,
        className
      )}
      role="timer"
      aria-label={`${label || type} timer: ${formatTime(timeRemaining)} remaining`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          {/* Timer Label */}
          {label && (
            <div className={cn('text-xs font-medium uppercase tracking-wide', colors.accent)}>
              {label}
            </div>
          )}

          {/* Timer Display */}
          <div className={cn(
            'relative flex items-center justify-center rounded-full border-2',
            config.container,
            colors.border
          )}>
            {/* Progress Ring */}
            {showProgress && (
              <div className="absolute inset-2">
                <Progress 
                  value={progressPercentage}
                  variant={colors.progress}
                  className="h-full w-full rounded-full [&>div]:rounded-full"
                />
              </div>
            )}
            
            {/* Time Display */}
            <div className={cn(
              'relative z-10 font-mono font-bold tabular-nums',
              config.text,
              colors.text
            )}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Play/Pause Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              className={cn(
                'touch-manipulation transition-colors',
                config.button,
                'min-w-[44px] min-h-[44px] p-0' // WCAG touch target
              )}
              aria-label={
                !hasStarted ? `Start ${type} timer` :
                isRunning ? `Pause ${type} timer` : 
                `Resume ${type} timer`
              }
            >
              {!hasStarted || (!isRunning && !isPaused) ? (
                <Play className={config.icon} />
              ) : isRunning ? (
                <Pause className={config.icon} />
              ) : (
                <Play className={config.icon} />
              )}
            </Button>

            {/* Reset Button */}
            {hasStarted && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className={cn(
                  'touch-manipulation transition-colors',
                  config.button,
                  'min-w-[44px] min-h-[44px] p-0' // WCAG touch target
                )}
                aria-label={`Reset ${type} timer`}
              >
                <RotateCcw className={config.icon} />
              </Button>
            )}
          </div>

          {/* Timer Type Icon */}
          <div className={cn('flex items-center space-x-1 text-xs', colors.accent)}>
            {type === 'rest' && <Clock className="h-3 w-3" />}
            {type === 'work' && <Timer className="h-3 w-3" />}
            {type === 'transition' && <RotateCcw className="h-3 w-3" />}
            <span className="capitalize">{type}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}