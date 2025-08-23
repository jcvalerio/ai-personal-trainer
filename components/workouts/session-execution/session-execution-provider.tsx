/**
 * Session Execution Context Provider
 * Manages workout session state, progress tracking, and real-time updates
 */
'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from 'react';
import {
  SessionExecution,
  SessionExecutionAction,
  ExecutingExercise,
  TimerState,
  SessionProgress,
  SessionExecutionSettings,
} from '@/types/session-execution';
import { SessionExercise, SetPerformanceData } from '@/types/workouts';

interface SessionExecutionContextType {
  session: SessionExecution | null;
  currentExercise: ExecutingExercise | null;
  progress: SessionProgress;
  settings: SessionExecutionSettings;

  // Actions
  startSession: (
    exercises: SessionExercise[],
    settings?: Partial<SessionExecutionSettings>
  ) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: () => void;
  nextExercise: () => void;
  previousExercise: () => void;
  completeSet: (setData: SetPerformanceData) => void;
  updateTimer: (timerState: Partial<TimerState>) => void;
  updateSettings: (settings: Partial<SessionExecutionSettings>) => void;
}

const SessionExecutionContext = createContext<
  SessionExecutionContextType | undefined
>(undefined);

// Default settings
const DEFAULT_SESSION_SETTINGS: SessionExecutionSettings = {
  autoAdvance: true,
  autoStartRest: true,
  showMotivation: true,
  vibrateOnPhaseChange: true,
  keepScreenOn: true,
  useGPS: false,
  savePhotos: false,
  syncWearables: true,
  audioEnabled: true,
  vibrateEnabled: true,
  restPeriods: [60, 90, 120],
};

// Initial state
const initialState: SessionExecution = {
  sessionId: '',
  status: 'idle',
  currentSet: 0,
  timerState: {
    protocol: 'strength',
    phase: 'ready',
    currentRound: 1,
    totalRounds: 1,
    timeRemaining: 0,
    phaseTotal: 0,
    elapsedTime: 0,
    isRunning: false,
    isPaused: false,
  },
  progress: {
    completionPercentage: 0,
    exercisesCompleted: 0,
    totalExercises: 0,
    setsCompleted: 0,
    totalSets: 0,
    currentPhase: 'main',
    phaseProgress: {
      warm_up: { completion: 0, totalExercises: 0, completedExercises: 0 },
      main: { completion: 0, totalExercises: 0, completedExercises: 0 },
      cool_down: { completion: 0, totalExercises: 0, completedExercises: 0 },
    },
    estimatedTimeRemaining: 0,
    overallProgress: 0,
    timeElapsed: 0,
  },
  performance: {
    totalVolume: 0,
    totalReps: 0,
    avgPerceivedExertion: 0,
    avgFormRating: 0,
    sessionDuration: 0,
    activeWorkTime: 0,
    totalRestTime: 0,
    personalRecords: [],
    vsPlanned: {
      volumePercentage: 0,
      repsPercentage: 0,
      weightPercentage: 0,
      durationPercentage: 0,
      overallRating: 'met',
    },
    setsCompleted: 0,
    totalExercises: 0,
    exercisesCompleted: 0,
    totalSets: 0,
  },
  interaction: {
    inputMode: 'touch',
    touchState: {
      swipeEnabled: true,
      swipeSensitivity: 0.7,
      touchFeedback: true,
      largeTouchTargets: false,
      preventAccidental: true,
    },
    quickActions: [],
    accessibility: {
      highContrast: false,
      largeText: false,
      screenReader: false,
      reduceMotion: false,
      voiceAnnouncements: false,
      simplifiedUI: false,
      colorBlindSupport: false,
    },
    oneHandedMode: false,
  },
  timestamps: {
    createdAt: new Date(),
    lastUpdated: new Date(),
  },
  offline: {
    isOffline: false,
    isDirty: false,
    pendingSync: [],
    hasConflicts: false,
    storageInfo: {
      usedMB: 0,
      availableMB: 1000,
      quotaMB: 1024,
      usagePercentage: 0,
      needsCleanup: false,
    },
  },
  settings: DEFAULT_SESSION_SETTINGS,
  exercises: [],
  currentExerciseIndex: 0,
};

// Reducer for session state management
function sessionExecutionReducer(
  state: SessionExecution,
  action: SessionExecutionAction
): SessionExecution {
  switch (action.type) {
    case 'START_SESSION':
      const exercises = action.payload?.exercises || [];
      return {
        ...state,
        status: 'active',
        exercises,
        currentExerciseIndex: 0,
        currentSet: 1,
        startTime: new Date(),
        timestamps: {
          ...state.timestamps,
          startedAt: new Date(),
          lastUpdated: new Date(),
        },
        progress: {
          ...state.progress,
          totalExercises: exercises.length,
          totalSets: exercises.reduce(
            (sum: number, ex: SessionExercise) =>
              sum + (ex.sets || ex.plannedSets || 0),
            0
          ),
        },
        performance: {
          ...state.performance,
          totalExercises: exercises.length,
          totalSets: exercises.reduce(
            (sum: number, ex: SessionExercise) =>
              sum + (ex.sets || ex.plannedSets || 0),
            0
          ),
        },
      };

    case 'PAUSE_SESSION':
      return {
        ...state,
        status: 'paused',
        timerState: {
          ...state.timerState,
          isRunning: false,
          isPaused: true,
        },
        timestamps: {
          ...state.timestamps,
          pausedAt: new Date(),
          lastUpdated: new Date(),
        },
      };

    case 'RESUME_SESSION':
      return {
        ...state,
        status: 'active',
        timerState: {
          ...state.timerState,
          isRunning: true,
          isPaused: false,
        },
        timestamps: {
          ...state.timestamps,
          resumedAt: new Date(),
          lastUpdated: new Date(),
        },
      };

    case 'COMPLETE_SESSION':
      return {
        ...state,
        status: 'completed',
        endTime: new Date(),
        timerState: {
          ...state.timerState,
          isRunning: false,
          phase: 'completed',
        },
        timestamps: {
          ...state.timestamps,
          completedAt: new Date(),
          lastUpdated: new Date(),
        },
      };

    case 'NEXT_EXERCISE':
      const nextIndex = Math.min(
        state.currentExerciseIndex + 1,
        state.exercises.length - 1
      );
      return {
        ...state,
        currentExerciseIndex: nextIndex,
        currentSet: 1,
        progress: {
          ...state.progress,
          exercisesCompleted:
            nextIndex > state.currentExerciseIndex
              ? state.progress.exercisesCompleted + 1
              : state.progress.exercisesCompleted,
        },
        performance: {
          ...state.performance,
          exercisesCompleted:
            nextIndex > state.currentExerciseIndex
              ? state.performance.exercisesCompleted + 1
              : state.performance.exercisesCompleted,
        },
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };

    case 'PREVIOUS_EXERCISE':
      const prevIndex = Math.max(state.currentExerciseIndex - 1, 0);
      return {
        ...state,
        currentExerciseIndex: prevIndex,
        currentSet: 1,
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };

    case 'COMPLETE_SET':
      const currentExercise = state.exercises[state.currentExerciseIndex];
      if (!currentExercise || !action.payload) {
        return state;
      }

      const setData = action.payload.data || action.payload.setData;
      const updatedSetData = [...(currentExercise.setData || []), setData];

      const updatedExercises = [...state.exercises];
      updatedExercises[state.currentExerciseIndex] = {
        ...currentExercise,
        setData: updatedSetData,
        completedSets: updatedSetData.length,
      };

      const totalVolume =
        setData.weight && setData.reps ? setData.weight * setData.reps : 0;

      return {
        ...state,
        exercises: updatedExercises,
        currentSet: state.currentSet + 1,
        progress: {
          ...state.progress,
          setsCompleted: state.progress.setsCompleted + 1,
        },
        performance: {
          ...state.performance,
          setsCompleted: state.performance.setsCompleted + 1,
          totalVolume: state.performance.totalVolume + totalVolume,
          totalReps: state.performance.totalReps + (setData.reps || 0),
        },
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };

    case 'UPDATE_TIMER':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          ...action.payload,
        },
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };

    case 'UPDATE_ELAPSED_TIME':
      return {
        ...state,
        elapsedTime: action.payload,
        progress: {
          ...state.progress,
          timeElapsed: action.payload / 1000 / 60, // Convert to minutes
        },
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };

    default:
      return state;
  }
}

// Custom hook to use session execution context
export function useSessionExecution() {
  const context = useContext(SessionExecutionContext);
  if (!context) {
    throw new Error(
      'useSessionExecution must be used within a SessionExecutionProvider'
    );
  }
  return context;
}

// Provider component
export function SessionExecutionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(sessionExecutionReducer, initialState);

  // Calculate current exercise
  const exercise = state.exercises[state.currentExerciseIndex];
  const currentExercise: ExecutingExercise | null = exercise
    ? {
        ...exercise,
        liveSets: (exercise.setData || []).map((set) => ({
          ...set,
          startedAt: new Date(),
          completedAt: new Date(),
          liveReps: set.reps,
          isActive: false,
          isCompleted: true,
          liveNotes: set.setNotes || '',
          quality: {
            form: set.formRating || 3,
            completion: 100,
            tempo: 3,
            rangeOfMotion: 3,
            overall: 3,
          },
        })),
        currentSetIndex: state.currentSet - 1,
        timerConfig: {
          protocol: 'strength',
          readyCountdown: 3,
          audioConfig: {
            enabled: true,
            volume: 0.8,
            events: {},
            useTTS: false,
          },
          hapticConfig: {
            enabled: false,
            events: {},
          },
          strength: {
            restSeconds: 90,
            totalSets: 3,
            autoStartRest: true,
            transitionSeconds: 30,
          },
        },
        startedAt: new Date(),
        liveMetrics: {
          totalReps: (exercise.setData || []).reduce(
            (sum, set) => sum + set.reps,
            0
          ),
          totalVolume: (exercise.setData || []).reduce(
            (sum, set) => sum + (set.weight || 0) * set.reps,
            0
          ),
          avgRestTime: 90,
          exerciseDuration: 0,
          exertionTrend: [5],
          formConsistency: 3,
        },
        name: exercise.name || '',
        description: '',
        sets: exercise.sets || exercise.plannedSets || 3,
        targetReps: exercise.plannedReps || 10,
        targetWeight: exercise.plannedWeightKg || 0,
        completedSets: exercise.completedSets || 0,
      }
    : null;

  // Use existing progress from state
  const progress: SessionProgress = state.progress;

  // Actions
  const startSession = useCallback(
    (
      exercises: SessionExercise[],
      settings?: Partial<SessionExecutionSettings>
    ) => {
      dispatch({
        type: 'START_SESSION',
        payload: {
          exercises,
          settings: settings || {},
        },
      });
    },
    []
  );

  const pauseSession = useCallback(() => {
    dispatch({ type: 'PAUSE_SESSION' });
  }, []);

  const resumeSession = useCallback(() => {
    dispatch({ type: 'RESUME_SESSION' });
  }, []);

  const completeSession = useCallback(() => {
    dispatch({ type: 'COMPLETE_SESSION' });
  }, []);

  const nextExercise = useCallback(() => {
    dispatch({ type: 'NEXT_EXERCISE' });
  }, []);

  const previousExercise = useCallback(() => {
    dispatch({ type: 'PREVIOUS_EXERCISE' });
  }, []);

  const completeSet = useCallback(
    (setData: SetPerformanceData) => {
      dispatch({
        type: 'COMPLETE_SET',
        payload: {
          setIndex: state.currentSet - 1,
          data: setData,
        },
      });
    },
    [state.currentSet]
  );

  const updateTimer = useCallback((timerState: Partial<TimerState>) => {
    dispatch({
      type: 'UPDATE_TIMER',
      payload: timerState,
    });
  }, []);

  const updateSettings = useCallback(
    (settings: Partial<SessionExecutionSettings>) => {
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: settings,
      });
    },
    []
  );

  // Timer for elapsed time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state.status === 'active' && state.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed =
          now - state.startTime!.getTime() - (state.pausedTime || 0);

        dispatch({
          type: 'UPDATE_ELAPSED_TIME',
          payload: elapsed,
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.status, state.startTime, state.pausedTime]);

  // Persist session state to localStorage
  useEffect(() => {
    if (state.status !== 'idle') {
      try {
        localStorage.setItem(
          'workoutSession',
          JSON.stringify({
            ...state,
            startTime: state.startTime?.toISOString(),
            endTime: state.endTime?.toISOString(),
          })
        );
      } catch (error) {
        console.warn('Failed to persist session state:', error);
      }
    }
  }, [state]);

  // Load session state from localStorage on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('workoutSession');
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        if (
          parsedSession.status === 'active' ||
          parsedSession.status === 'paused'
        ) {
          // Restore session with date conversion
          // TODO: Implement session restoration logic
        }
      }
    } catch (error) {
      console.warn('Failed to restore session state:', error);
    }
  }, []);

  const contextValue: SessionExecutionContextType = {
    session: state,
    currentExercise,
    progress,
    settings: state.settings,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    nextExercise,
    previousExercise,
    completeSet,
    updateTimer,
    updateSettings,
  };

  return (
    <SessionExecutionContext.Provider value={contextValue}>
      {children}
    </SessionExecutionContext.Provider>
  );
}
