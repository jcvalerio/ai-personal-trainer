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
import {
  pauseWorkoutSession,
  resumeWorkoutSession,
  completeWorkoutSession,
  recordSetPerformance,
  updateSessionProgress,
  getWorkoutSession,
} from '@/lib/api/workout-sessions';

interface SessionExecutionContextType {
  session: SessionExecution | null;
  currentExercise: ExecutingExercise | null;
  progress: SessionProgress;
  settings: SessionExecutionSettings;

  // Error and loading states
  error: string | null;
  isLoading: boolean;
  pendingSets: SetPerformanceData[];

  // Actions
  startSession: (
    exercises: SessionExercise[],
    settings?: Partial<SessionExecutionSettings>
  ) => void;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  completeSession: (sessionData?: {
    effortRating?: number;
    energyLevelAfter?: number;
    userNotes?: string;
  }) => Promise<void>;
  nextExercise: () => void;
  previousExercise: () => void;
  completeSet: (setData: SetPerformanceData) => Promise<void>;
  updateTimer: (timerState: Partial<TimerState>) => void;
  updateSettings: (settings: Partial<SessionExecutionSettings>) => void;
  clearError: () => void;
  syncPendingSets: () => Promise<void>;
  recoverSession: (sessionId: string) => Promise<void>;
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

// Extended initial state to include error handling
interface ExtendedSessionExecution extends SessionExecution {
  error: string | null;
  isLoading: boolean;
  pendingSets: SetPerformanceData[];
}

// Initial state
const initialState: ExtendedSessionExecution = {
  sessionId: '',
  status: 'idle',
  currentSet: 0,
  error: null,
  isLoading: false,
  pendingSets: [],
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
  state: ExtendedSessionExecution,
  action: SessionExecutionAction
): ExtendedSessionExecution {
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

      // Handle recovery mode for session restoration
      if (action.payload.recoveryMode && action.payload.actualProgress) {
        return {
          ...state,
          progress: {
            ...state.progress,
            setsCompleted: action.payload.actualProgress.setsCompleted,
            exercisesCompleted: action.payload.actualProgress.exercisesCompleted,
            completionPercentage: Math.round(
              (action.payload.actualProgress.setsCompleted / state.progress.totalSets) * 100
            ),
            overallProgress: Math.round(
              (action.payload.actualProgress.exercisesCompleted / state.progress.totalExercises) * 100
            ),
          },
          performance: {
            ...state.performance,
            setsCompleted: action.payload.actualProgress.setsCompleted,
            exercisesCompleted: action.payload.actualProgress.exercisesCompleted,
          },
          timestamps: {
            ...state.timestamps,
            lastUpdated: new Date(),
          },
        };
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

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'ADD_PENDING_SET':
      return {
        ...state,
        pendingSets: [...state.pendingSets, action.payload],
      };

    case 'REMOVE_PENDING_SET':
      return {
        ...state,
        pendingSets: state.pendingSets.filter((set, index) => index !== action.payload),
      };

    case 'CLEAR_PENDING_SETS':
      return {
        ...state,
        pendingSets: [],
      };

    case 'ROLLBACK_SET':
      const rollbackExercise = state.exercises[state.currentExerciseIndex];
      if (!rollbackExercise || !action.payload) {
        return state;
      }

      const rollbackSetData = action.payload.data || action.payload.setData;
      const updatedRollbackSetData = (rollbackExercise.setData || []).filter(
        (set) => set !== rollbackSetData
      );

      const rollbackUpdatedExercises = [...state.exercises];
      rollbackUpdatedExercises[state.currentExerciseIndex] = {
        ...rollbackExercise,
        setData: updatedRollbackSetData,
        completedSets: updatedRollbackSetData.length,
      };

      return {
        ...state,
        exercises: rollbackUpdatedExercises,
        currentSet: state.currentSet - 1,
        progress: {
          ...state.progress,
          setsCompleted: Math.max(0, state.progress.setsCompleted - 1),
        },
        performance: {
          ...state.performance,
          setsCompleted: Math.max(0, state.performance.setsCompleted - 1),
        },
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };

    case 'UPDATE_SESSION_ID':
      return {
        ...state,
        sessionId: action.payload,
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };
    
    case 'ADD_PENDING_SET':
      return {
        ...state,
        pendingSets: [...state.pendingSets, action.payload],
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };
    
    case 'REMOVE_PENDING_SET':
      return {
        ...state,
        pendingSets: state.pendingSets.filter((_, index) => index !== action.payload),
        timestamps: {
          ...state.timestamps,
          lastUpdated: new Date(),
        },
      };
    
    case 'CLEAR_PENDING_SETS':
      return {
        ...state,
        pendingSets: [],
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

  const pauseSession = useCallback(async () => {
    if (!state.sessionId) return;

    // Optimistic update
    dispatch({ type: 'PAUSE_SESSION' });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await pauseWorkoutSession(state.sessionId);
      if (!result.success) {
        // Rollback on failure
        dispatch({ type: 'RESUME_SESSION' });
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to pause session' });
      }
    } catch (error) {
      // Rollback on error
      dispatch({ type: 'RESUME_SESSION' });
      dispatch({ type: 'SET_ERROR', payload: 'Network error while pausing session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.sessionId]);

  const resumeSession = useCallback(async () => {
    if (!state.sessionId) return;

    // Optimistic update
    dispatch({ type: 'RESUME_SESSION' });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await resumeWorkoutSession(state.sessionId);
      if (!result.success) {
        // Rollback on failure
        dispatch({ type: 'PAUSE_SESSION' });
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to resume session' });
      }
    } catch (error) {
      // Rollback on error
      dispatch({ type: 'PAUSE_SESSION' });
      dispatch({ type: 'SET_ERROR', payload: 'Network error while resuming session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.sessionId]);

  const completeSession = useCallback(async (sessionData?: {
    effortRating?: number;
    energyLevelAfter?: number;
    userNotes?: string;
  }) => {
    if (!state.sessionId) return;

    // Optimistic update
    dispatch({ type: 'COMPLETE_SESSION' });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const completionData = {
        finalNotes: sessionData?.userNotes,
        overallRating: sessionData?.effortRating,
      };

      const result = await completeWorkoutSession(state.sessionId, completionData);
      if (!result.success) {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to complete session' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Network error while completing session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.sessionId, state.performance]);

  const nextExercise = useCallback(() => {
    dispatch({ type: 'NEXT_EXERCISE' });
    
    // Update session progress
    if (state.sessionId) {
      const progressData = {
        currentExerciseIndex: Math.min(
          state.currentExerciseIndex + 1,
          state.exercises.length - 1
        ),
        currentSet: 1,
        elapsedTime: state.elapsedTime,
        exercisesCompleted: state.progress.exercisesCompleted,
        setsCompleted: state.progress.setsCompleted,
        totalVolume: state.performance.totalVolume,
        completionPercentage: Math.round(
          ((state.progress.exercisesCompleted + 1) / state.progress.totalExercises) * 100
        ),
      };

      updateSessionProgress(state.sessionId, progressData).catch((error) => {
        console.warn('Failed to sync progress:', error);
      });
    }
  }, [state]);

  const previousExercise = useCallback(() => {
    dispatch({ type: 'PREVIOUS_EXERCISE' });
  }, []);

  const completeSet = useCallback(async (setData: SetPerformanceData) => {
    const currentExercise = state.exercises[state.currentExerciseIndex];
    if (!currentExercise) return;

    // Optimistic update
    dispatch({
      type: 'COMPLETE_SET',
      payload: {
        setIndex: state.currentSet - 1,
        data: setData,
      },
    });

    // Add to pending sets if no session ID
    if (!state.sessionId) {
      dispatch({ type: 'ADD_PENDING_SET', payload: setData });
      return;
    }

    try {
      // Use the setData directly since it's already a SetPerformanceData object
      const setPerformanceData = setData;

      const result = await recordSetPerformance(
        state.sessionId,
        currentExercise.exerciseId || currentExercise.id || '',
        setPerformanceData
      );

      if (!result.success) {
        // Add to pending sets for retry
        dispatch({ type: 'ADD_PENDING_SET', payload: setData });
        console.warn('Failed to record set, added to pending:', result.error);
      }

      // Update session progress
      const progressData = {
        currentExerciseIndex: state.currentExerciseIndex,
        currentSet: state.currentSet,
        elapsedTime: state.elapsedTime,
        exercisesCompleted: state.progress.exercisesCompleted,
        setsCompleted: state.progress.setsCompleted + 1,
        totalVolume: state.performance.totalVolume + (setData.weight || 0) * setData.reps,
        completionPercentage: Math.round(
          ((state.progress.setsCompleted + 1) / state.progress.totalSets) * 100
        ),
      };

      updateSessionProgress(state.sessionId, progressData).catch((error) => {
        console.warn('Failed to sync progress:', error);
      });
    } catch (error) {
      // Rollback the optimistic update on error
      dispatch({
        type: 'ROLLBACK_SET',
        payload: {
          setIndex: state.currentSet - 1,
          data: setData,
        },
      });
      dispatch({ type: 'ADD_PENDING_SET', payload: setData });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save set data. Will retry automatically.' });
      console.warn('Error recording set:', error);
    }
  }, [state]);

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

  // Utility functions
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const syncPendingSets = useCallback(async () => {
    if (!state.sessionId || state.pendingSets.length === 0) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    for (let i = 0; i < state.pendingSets.length; i++) {
      const setData = state.pendingSets[i];
      const currentExercise = state.exercises[state.currentExerciseIndex];

      if (!currentExercise) continue;

      try {
        // Use the setData directly for consistency
        const setPerformanceData = setData;

        const result = await recordSetPerformance(
          state.sessionId,
          currentExercise.exerciseId || currentExercise.id || '',
          setPerformanceData
        );

        if (result.success) {
          dispatch({ type: 'REMOVE_PENDING_SET', payload: i });
        }
      } catch (error) {
        console.warn('Failed to sync pending set:', error);
        break;
      }
    }

    dispatch({ type: 'SET_LOADING', payload: false });
  }, [state.sessionId, state.pendingSets, state.exercises, state.currentExerciseIndex]);

  const recoverSession = useCallback(async (sessionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const result = await getWorkoutSession(sessionId);
      
      if (result.success && result.data) {
        const session = result.data;
        
        // Map session exercises with completed sets data
        const allExercises = [
          ...(session.warmUpExercises || []),
          ...(session.mainExercises || []),
          ...(session.coolDownExercises || []),
        ];
        
        const mappedExercises = allExercises.map((ex: any, idx: number) => ({
          id: ex.id || `${session.id}-${idx}`,
          sessionId: session.id,
          exerciseId: ex.exerciseId || ex.id || `exercise-${idx}`,
          name: ex.name,
          orderIndex: ex.orderIndex ?? idx,
          exercisePhase: ex.exercisePhase || 'main',
          plannedSets: ex.plannedSets ?? ex.sets ?? 3,
          plannedReps: ex.plannedReps ?? ex.repsMin ?? 10,
          plannedWeightKg: ex.plannedWeightKg,
          plannedDurationSeconds: ex.plannedDurationSeconds ?? ex.durationSeconds,
          plannedDistanceMeters: ex.plannedDistanceMeters,
          plannedRestSeconds: ex.plannedRestSeconds ?? ex.restSeconds ?? 60,
          equipmentAlternatives: ex.equipmentAlternatives || [],
          status: 'pending',
          completedSets: ex.completedSets || 0,
          setData: ex.setData || [],
          sets: ex.sets || ex.plannedSets || 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        // Update session ID first
        dispatch({
          type: 'UPDATE_SESSION_ID',
          payload: sessionId,
        });

        // Only start session if not already started with these exercises
        if (state.exercises.length === 0 || state.sessionId !== sessionId) {
          dispatch({
            type: 'START_SESSION',
            payload: {
              exercises: mappedExercises,
              settings: state.settings,
            },
          });
        }

        // Recover session progress
        const completedSets = mappedExercises.reduce((sum, ex) => sum + (ex.completedSets || 0), 0);
        const completedExercises = mappedExercises.filter(ex => (ex.completedSets || 0) >= (ex.sets || 3)).length;
        
        // Update progress to match database state
        dispatch({
          type: 'COMPLETE_SET',
          payload: {
            setIndex: 0,
            data: {
              setNumber: 1,
              reps: 0,
              weight: 0,
              timestamp: new Date(),
            } as SetPerformanceData,
            skipProgressUpdate: true,
            recoveryMode: true,
            actualProgress: {
              setsCompleted: completedSets,
              exercisesCompleted: completedExercises,
            }
          },
        });

        // Set proper session status based on backend session state
        const sessionStatus = session.status as string;
        console.log('Database session status:', sessionStatus);
        
        if (sessionStatus === 'in_progress' || sessionStatus === 'active') {
          dispatch({ type: 'RESUME_SESSION' });
        } else if (sessionStatus === 'paused') {
          dispatch({ type: 'PAUSE_SESSION' });
        } else if (sessionStatus === 'completed') {
          dispatch({ type: 'COMPLETE_SESSION' });
        } else {
          // For any other status (including 'pending', 'scheduled', etc.), start as active
          console.log('Unknown session status, starting as active:', sessionStatus);
          dispatch({ type: 'RESUME_SESSION' });
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to recover session' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Network error during session recovery' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.settings, state.exercises.length, state.sessionId]);

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

  // Load session state from localStorage on mount (only once)
  useEffect(() => {
    let hasRecovered = false;
    
    try {
      const savedSession = localStorage.getItem('workoutSession');
      if (savedSession && !hasRecovered) {
        const parsedSession = JSON.parse(savedSession);
        if (
          parsedSession.status === 'active' ||
          parsedSession.status === 'paused'
        ) {
          hasRecovered = true;
          
          // Restore session state from localStorage
          const restoredState = {
            ...parsedSession,
            startTime: parsedSession.startTime ? new Date(parsedSession.startTime) : undefined,
            endTime: parsedSession.endTime ? new Date(parsedSession.endTime) : undefined,
            timestamps: {
              ...parsedSession.timestamps,
              createdAt: new Date(parsedSession.timestamps?.createdAt || Date.now()),
              lastUpdated: new Date(parsedSession.timestamps?.lastUpdated || Date.now()),
              startedAt: parsedSession.timestamps?.startedAt ? new Date(parsedSession.timestamps.startedAt) : undefined,
              pausedAt: parsedSession.timestamps?.pausedAt ? new Date(parsedSession.timestamps.pausedAt) : undefined,
              resumedAt: parsedSession.timestamps?.resumedAt ? new Date(parsedSession.timestamps.resumedAt) : undefined,
              completedAt: parsedSession.timestamps?.completedAt ? new Date(parsedSession.timestamps.completedAt) : undefined,
            },
          };

          // Dispatch restored state
          Object.keys(restoredState).forEach(key => {
            if (key === 'sessionId' && restoredState.sessionId) {
              dispatch({ type: 'UPDATE_SESSION_ID', payload: restoredState.sessionId });
            }
          });

          // Try to sync with backend if we have a sessionId (only once per mount)
          if (restoredState.sessionId) {
            recoverSession(restoredState.sessionId).catch(error => {
              console.warn('Failed to recover session on mount:', error);
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore session state:', error);
      // Clear invalid session data
      localStorage.removeItem('workoutSession');
    }
  }, []); // Empty dependency array - run only once on mount

  // Auto-sync pending sets when connection is restored with exponential backoff
  useEffect(() => {
    if (state.pendingSets.length > 0 && state.sessionId) {
      let retryCount = 0;
      const maxRetries = 3; // Reduced max retries from 5 to 3
      
      const retrySync = () => {
        const delay = Math.min(2000 * Math.pow(2, retryCount), 60000); // Increased base delay from 1s to 2s, max 60s
        
        const timeoutId = setTimeout(async () => {
          try {
            await syncPendingSets();
            // Success - clear any retry error
            if (state.error?.includes('retry')) {
              dispatch({ type: 'CLEAR_ERROR' });
            }
          } catch (error) {
            retryCount++;
            if (retryCount < maxRetries) {
              retrySync(); // Retry with longer delay
            } else {
              dispatch({ type: 'SET_ERROR', payload: `Failed to sync after ${maxRetries} attempts. Please check your connection.` });
            }
          }
        }, delay);
        
        return timeoutId;
      };
      
      const timeoutId = retrySync();
      return () => clearTimeout(timeoutId);
    }
  }, [state.pendingSets.length, state.sessionId]); // Removed syncPendingSets and state.error to prevent unnecessary re-runs

  // Progress sync effect - only sync when significant changes occur
  useEffect(() => {
    if (state.sessionId && state.status === 'active') {
      const progressSyncTimeout = setTimeout(() => {
        const progressData = {
          currentExerciseIndex: state.currentExerciseIndex,
          currentSet: state.currentSet,
          elapsedTime: state.elapsedTime,
          exercisesCompleted: state.progress.exercisesCompleted,
          setsCompleted: state.progress.setsCompleted,
          totalVolume: state.performance.totalVolume,
          completionPercentage: state.progress.completionPercentage,
        };

        updateSessionProgress(state.sessionId, progressData).catch((error) => {
          console.warn('Background progress sync failed:', error);
        });
      }, 30000); // Reduced frequency: sync every 30 seconds instead of 10

      return () => clearTimeout(progressSyncTimeout);
    }
  }, [
    state.sessionId, 
    state.status, 
    state.currentExerciseIndex, 
    state.progress.setsCompleted, // Only trigger when sets are actually completed
    state.progress.exercisesCompleted // Only trigger when exercises are completed
  ]); // Removed currentSet to prevent frequent updates

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_OFFLINE', payload: false });
      // Trigger pending sets sync when back online
      if (state.pendingSets.length > 0) {
        syncPendingSets();
      }
    };
    
    const handleOffline = () => {
      dispatch({ type: 'SET_OFFLINE', payload: true });
      dispatch({ type: 'SET_ERROR', payload: 'You are currently offline. Changes will be saved when connection is restored.' });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.pendingSets.length, syncPendingSets]);

  // Clear error after 10 seconds (unless it's offline or retry related)
  useEffect(() => {
    if (state.error && !state.error.includes('offline') && !state.error.includes('retry')) {
      const errorTimeout = setTimeout(() => {
        dispatch({ type: 'CLEAR_ERROR' });
      }, 10000);

      return () => clearTimeout(errorTimeout);
    }
  }, [state.error]);

  const contextValue: SessionExecutionContextType = {
    session: state,
    currentExercise,
    progress,
    settings: state.settings,
    error: state.error,
    isLoading: state.isLoading,
    pendingSets: state.pendingSets,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    nextExercise,
    previousExercise,
    completeSet,
    updateTimer,
    updateSettings,
    clearError,
    syncPendingSets,
    recoverSession,
  };

  return (
    <SessionExecutionContext.Provider value={contextValue}>
      {children}
    </SessionExecutionContext.Provider>
  );
}
