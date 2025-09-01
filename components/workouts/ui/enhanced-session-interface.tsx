/**
 * Enhanced Session Interface
 * Complete workout session execution experience with improved UX
 */
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Settings,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSessionExecution } from '../session-execution/session-execution-provider';
import { SetPerformanceData } from '@/types/workouts';

// Import our new UI components
import { SessionProgressHeader } from './session-progress-header';
import { ExerciseProgressCard } from './exercise-progress-card';
import { SessionTimer } from './session-timer';
import { SessionNavigation } from './session-navigation';
import { 
  AIRecommendations,
  RestTimeRecommendations,
  FormImprovementRecommendations 
} from './ai-recommendations';
import { 
  SessionLoading,
  NoActiveSessionState,
  SessionCompleteState,
  SessionErrorState,
} from './session-loading-states';

interface EnhancedSessionInterfaceProps {
  className?: string;
  /** Optional back navigation handler */
  onBack?: () => void;
  /** Optional session complete handler */
  onSessionComplete?: () => void;
}

interface SetInputs {
  weight: string;
  reps: string;
  duration: string;
  distance: string;
  notes: string;
}

const EnhancedSessionInterface = React.memo(function EnhancedSessionInterface({ 
  className = '',
  onBack,
  onSessionComplete,
}: EnhancedSessionInterfaceProps) {
  const t = useTranslations('workouts.session');
  const router = useRouter();
  
  const {
    session,
    currentExercise,
    progress,
    settings,
    pauseSession,
    resumeSession,
    completeSession,
    nextExercise,
    previousExercise,
    completeSet,
    updateSettings,
    error: sessionError,
    isLoading: sessionIsLoading,
    pendingSets,
    clearError,
  } = useSessionExecution();

  // Component state - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [setInputs, setSetInputs] = useState<SetInputs>({
    weight: '',
    reps: '',
    duration: '',
    distance: '',
    notes: '',
  });
  const [isRestPeriod, setIsRestPeriod] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);
  const [lastPerceivedExertion, setLastPerceivedExertion] = useState<number>(7);
  const [lastFormRating, setLastFormRating] = useState<number>(4);

  // Handle set input changes - useCallback MUST be called consistently
  const handleInputChange = useCallback((field: keyof SetInputs, value: string) => {
    setSetInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle AI recommendation application - useCallback MUST be called consistently
  const handleApplyRecommendation = useCallback((recommendation: any) => {
    if (!recommendation.action) return;

    const { type, ...actionData } = recommendation.action;
    
    switch (type) {
      case 'set_rest_time':
        setRestTimeRemaining(actionData.seconds || 90);
        setIsRestPeriod(true);
        break;
      case 'reduce_intensity':
        // Apply intensity reduction - could adjust weight suggestions
        if (actionData.adjustment && currentExercise?.plannedWeightKg) {
          const adjustment = 1 + (actionData.adjustment / 100);
          const newWeight = Math.round(currentExercise.plannedWeightKg * adjustment);
          setSetInputs(prev => ({
            ...prev,
            weight: newWeight.toString()
          }));
        }
        break;
      case 'increase_intensity':
        // Apply intensity increase
        if (actionData.adjustment && currentExercise?.plannedWeightKg) {
          const adjustment = 1 + (actionData.adjustment / 100);
          const newWeight = Math.round(currentExercise.plannedWeightKg * adjustment);
          setSetInputs(prev => ({
            ...prev,
            weight: newWeight.toString()
          }));
        }
        break;
      case 'form_reset':
        setRestTimeRemaining(actionData.restSeconds || 120);
        setIsRestPeriod(true);
        break;
      default:
        console.log('Applied recommendation:', recommendation);
    }
  }, [currentExercise]);

  // Handle set completion with enhanced UX - useCallback MUST be called consistently
  const handleCompleteSet = useCallback(async () => {
    if (!currentExercise) return;

    try {
      setIsTransitioning(true);

      const setData: SetPerformanceData = {
        setNumber: (currentExercise.completedSets || 0) + 1,
        reps: setInputs.reps ? parseInt(setInputs.reps) : 0,
        weight: setInputs.weight ? parseFloat(setInputs.weight) : undefined,
        duration: setInputs.duration ? parseInt(setInputs.duration) : undefined,
        distance: setInputs.distance ? parseFloat(setInputs.distance) : undefined,
        restSeconds: settings.restPeriods[0] || 60,
        perceivedExertion: 7, // Could be user input
        formRating: 4, // Could be user input
        timestamp: new Date(),
        setNotes: setInputs.notes || undefined,
      };

      await completeSet(setData);

      // Clear inputs
      setSetInputs({
        weight: '',
        reps: '',
        duration: '',
        distance: '',
        notes: '',
      });

      // Start rest period if not last set
      const isLastSet = (currentExercise?.completedSets || 0) + 1 >= (currentExercise?.sets || 0);
      const firstRestPeriod = settings?.restPeriods?.[0];
      
      if (!isLastSet && firstRestPeriod && firstRestPeriod > 0) {
        setIsRestPeriod(true);
        setRestTimeRemaining(firstRestPeriod);
      }

    } catch (err) {
      setError('Failed to complete set. Please try again.');
      console.error('Error completing set:', err);
    } finally {
      setIsTransitioning(false);
    }
  }, [currentExercise, setInputs, settings, completeSet]);

  // Handle session controls - useMemo equivalent object creation
  const handleSessionControls = useCallback(() => ({
    onPlay: () => resumeSession(),
    onPause: () => pauseSession(),
    onStop: () => {
      if (confirm('Are you sure you want to stop this session? Your progress will be saved.')) {
        completeSession();
      }
    },
    onSettings: () => setShowSettings(!showSettings),
    onBack: onBack || (() => router.back()),
  }), [resumeSession, pauseSession, completeSession, showSettings, onBack, router]);

  // Handle navigation - useMemo equivalent object creation
  const handleNavigation = useCallback(() => ({
    onPrevious: previousExercise,
    onNext: nextExercise,
    onCompleteSession: () => {
      completeSession();
      onSessionComplete?.();
    },
  }), [previousExercise, nextExercise, completeSession, onSessionComplete]);

  // Rest timer countdown - useEffect MUST be called consistently
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRestPeriod && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRestPeriod(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRestPeriod, restTimeRemaining]);

  // Calculate session stats - this should be computed every render
  const sessionStats = session && progress ? {
    setsCompleted: progress.setsCompleted,
    totalSets: progress.totalSets,
    exercisesCompleted: progress.exercisesCompleted,
    totalExercises: progress.totalExercises,
  } : {
    setsCompleted: 0,
    totalSets: 0,
    exercisesCompleted: 0,
    totalExercises: 0,
  };

  // Session controls object
  const sessionControls = handleSessionControls();
  const navigationControls = handleNavigation();

  // NOW we can do conditional rendering - all hooks have been called consistently

  // Handle session loading states
  if (!session || sessionIsLoading) {
    return (
      <div className={className}>
        <SessionLoading 
          message={sessionIsLoading ? 'Syncing session data...' : t('loading', { defaultValue: 'Loading session...' })}
          size="lg" 
        />
      </div>
    );
  }

  if (session.status === 'idle' && (!session.exercises || session.exercises.length === 0)) {
    return (
      <div className={className}>
        <NoActiveSessionState 
          onStartSession={() => {
            // Force session to start if we have exercises but session is idle
            if (session.exercises && session.exercises.length > 0) {
              resumeSession();
            } else {
              // Reload page to reinitialize session from database
              window.location.reload();
            }
          }}
        />
      </div>
    );
  }

  // Show critical errors that prevent session use
  if (error && !sessionError) {
    return (
      <div className={className}>
        <SessionErrorState 
          error={error}
          onRetry={() => setError(null)}
        />
      </div>
    );
  }

  // Session completion state
  if (session.status === 'completed') {
    return (
      <div className={className}>
        <SessionCompleteState 
          sessionId={session.sessionId}
          onViewResults={() => {
            onSessionComplete?.();
          }}
        />
      </div>
    );
  }

  // Current exercise for progress card
  const exerciseForCard = currentExercise ? {
    name: currentExercise.name,
    description: currentExercise.description || '',
    currentSet: (currentExercise.completedSets || 0) + 1,
    totalSets: currentExercise.sets || 3,
    targets: {
      reps: currentExercise.targetReps || currentExercise.plannedReps,
      weight: currentExercise.targetWeight || currentExercise.plannedWeightKg,
      duration: currentExercise.targetDuration || currentExercise.plannedDurationSeconds,
    },
    completedSets: (currentExercise.liveSets || []).map(set => ({
      setNumber: set.setNumber,
      reps: set.reps,
      weight: set.weight,
      duration: set.duration,
      distance: set.distance,
      notes: set.setNotes,
    })),
    currentInputs: setInputs,
    progress: currentExercise.completedSets ? 
      (currentExercise.completedSets / (currentExercise.sets || 3)) : 0,
    isActive: session.status === 'active',
    isResting: isRestPeriod,
    restTimeRemaining,
    videoUrls: (currentExercise as any)?.videoUrls || [],
  } : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Session Progress Header */}
      <SessionProgressHeader
        status={session.status as any}
        title={session.workoutPlan?.name || session.name || 'Workout Session'}
        currentExercise={{
          name: currentExercise?.name || '',
          index: session.currentExerciseIndex,
          total: session.exercises.length,
        }}
        overallProgress={progress.overallProgress}
        timeElapsed={Math.floor((progress.timeElapsed || 0) * 60)}
        estimatedTimeRemaining={progress.estimatedTimeRemaining ? 
          Math.floor(progress.estimatedTimeRemaining * 60) : undefined}
        stats={sessionStats}
        controls={sessionControls}
        variant="full"
        showStats={true}
      />

      {/* Rest Timer (if active) */}
      {isRestPeriod && (
        <SessionTimer
          duration={settings.restPeriods[0] || 60}
          isRunning={restTimeRemaining > 0}
          isPaused={false}
          type="rest"
          label={t('restPeriod')}
          size="lg"
          showProgress={true}
          autoStart={true}
          onComplete={() => setIsRestPeriod(false)}
          onStart={() => {/* Timer started */}}
          className="mx-auto max-w-sm"
        />
      )}

      {/* AI Recommendations */}
      {showAIRecommendations && session.sessionId && currentExercise && !isRestPeriod && (
        <div className="space-y-3">
          {/* Rest Time Recommendations */}
          <RestTimeRecommendations
            sessionId={session.sessionId}
            perceivedExertion={lastPerceivedExertion}
            timeConstraint={progress.estimatedTimeRemaining}
            onApplyRecommendation={handleApplyRecommendation}
            onDismiss={() => setShowAIRecommendations(false)}
            compact
          />
          
          {/* Form Improvement Recommendations (if form rating is low) */}
          {lastFormRating <= 3 && (
            <FormImprovementRecommendations
              sessionId={session.sessionId}
              currentExerciseId={currentExercise.exerciseId}
              formRating={lastFormRating}
              perceivedExertion={lastPerceivedExertion}
              onApplyRecommendation={handleApplyRecommendation}
              onDismiss={() => setShowAIRecommendations(false)}
              compact
            />
          )}
        </div>
      )}

      {/* Current Exercise Progress */}
      {exerciseForCard && (
        <ExerciseProgressCard
          {...exerciseForCard}
          onInputChange={handleInputChange}
          onCompleteSet={handleCompleteSet}
          onSkipSet={() => {
            // Skip current set logic
            nextExercise();
          }}
          onSkipRest={() => setIsRestPeriod(false)}
          weightUnit="lbs"
          distanceUnit="m"
        />
      )}

      {/* Session Navigation */}
      <SessionNavigation
        currentExerciseIndex={session.currentExerciseIndex}
        totalExercises={session.exercises.length}
        currentExercise={{
          name: currentExercise?.name || '',
          phase: currentExercise?.exercisePhase as any,
          progress: currentExercise?.completedSets ? 
            (currentExercise.completedSets / (currentExercise.sets || 3)) : 0,
          isCompleted: (currentExercise?.completedSets || 0) >= (currentExercise?.sets || 3),
        }}
        canGoPrevious={session.currentExerciseIndex > 0}
        canGoNext={session.currentExerciseIndex < session.exercises.length - 1}
        isSessionComplete={session.currentExerciseIndex >= session.exercises.length - 1}
        onPrevious={navigationControls.onPrevious}
        onNext={navigationControls.onNext}
        onCompleteSession={navigationControls.onCompleteSession}
        variant="full"
        exercises={session.exercises.map((ex, index) => ({
          name: ex.name || '',
          phase: ex.exercisePhase as any,
          progress: ex.completedSets ? (ex.completedSets / (ex.sets || ex.plannedSets || 3)) : 0,
          isCompleted: (ex.completedSets || 0) >= (ex.sets || ex.plannedSets || 3),
          isActive: index === session.currentExerciseIndex,
        }))}
      />

      {/* Settings Panel (if shown) */}
      {showSettings && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Session Settings</h3>
            <div className="space-y-4">
              {/* Audio Settings */}
              <div className="flex items-center justify-between">
                <span>Audio Feedback</span>
                <Button
                  variant={settings.audioEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSettings({ audioEnabled: !settings.audioEnabled })}
                >
                  {settings.audioEnabled ? 'On' : 'Off'}
                </Button>
              </div>

              {/* Vibration Settings */}
              <div className="flex items-center justify-between">
                <span>Vibration</span>
                <Button
                  variant={settings.vibrateEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSettings({ vibrateEnabled: !settings.vibrateEnabled })}
                >
                  {settings.vibrateEnabled ? 'On' : 'Off'}
                </Button>
              </div>

              {/* Auto-advance */}
              <div className="flex items-center justify-between">
                <span>Auto-advance Exercises</span>
                <Button
                  variant={settings.autoAdvance ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSettings({ autoAdvance: !settings.autoAdvance })}
                >
                  {settings.autoAdvance ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Error Display */}
      {sessionError && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-orange-700">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <p className="text-sm">{sessionError}</p>
                {pendingSets.length > 0 && (
                  <p className="text-xs mt-1 text-orange-600">
                    {pendingSets.length} set(s) pending sync
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-auto text-orange-600 hover:text-orange-800"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <SessionLoading message="Saving progress..." size="md" />
          </div>
        </div>
      )}
    </div>
  );
});

export { EnhancedSessionInterface };