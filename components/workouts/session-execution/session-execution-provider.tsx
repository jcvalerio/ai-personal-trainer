/**
 * Session Execution Context Provider
 * Manages workout session state, progress tracking, and real-time updates
 */
'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { 
  SessionExecution,
  SessionExecutionAction,
  ExecutingExercise,
  LiveSet,
  TimerState,
  SessionProgress,
  SessionSettings
} from '@/types/session-execution'
import { SessionExercise } from '@/types/workouts'

interface SessionExecutionContextType {
  session: SessionExecution | null
  currentExercise: ExecutingExercise | null
  progress: SessionProgress
  settings: SessionSettings
  
  // Actions
  startSession: (exercises: SessionExercise[], settings?: Partial<SessionSettings>) => void
  pauseSession: () => void
  resumeSession: () => void
  completeSession: () => void
  nextExercise: () => void
  previousExercise: () => void
  completeSet: (setData: LiveSet) => void
  updateTimer: (timerState: TimerState) => void
  updateSettings: (settings: Partial<SessionSettings>) => void
}

const SessionExecutionContext = createContext<SessionExecutionContextType | undefined>(undefined)

// Default settings
const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  audioEnabled: true,
  vibrateEnabled: true,
  voiceEnabled: true,
  autoAdvance: true,
  restPeriods: {
    betweenSets: 60,
    betweenExercises: 120,
    betweenCircuits: 180
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false
  },
  quickActions: {
    skipRest: true,
    addWeight: true,
    adjustReps: true,
    markComplete: true
  }
}

// Initial state
const initialState: SessionExecution = {
  sessionId: '',
  sessionType: 'strength',
  status: 'idle',
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  exercises: [],
  elapsedTime: 0,
  startTime: null,
  endTime: null,
  pausedTime: 0,
  activeTimer: null,
  performance: {
    setsCompleted: 0,
    totalSets: 0,
    exercisesCompleted: 0,
    totalExercises: 0,
    totalVolume: 0,
    averageIntensity: 0,
    personalRecords: []
  },
  settings: DEFAULT_SESSION_SETTINGS
}

// Reducer for session state management
function sessionExecutionReducer(
  state: SessionExecution, 
  action: SessionExecutionAction
): SessionExecution {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        sessionType: action.payload.sessionType,
        exercises: action.payload.exercises,
        status: 'active',
        startTime: new Date(),
        settings: { ...state.settings, ...action.payload.settings },
        performance: {
          ...state.performance,
          totalExercises: action.payload.exercises.length,
          totalSets: action.payload.exercises.reduce((sum, ex) => sum + ex.sets, 0)
        }
      }

    case 'PAUSE_SESSION':
      return {
        ...state,
        status: 'paused',
        activeTimer: state.activeTimer ? { ...state.activeTimer, isRunning: false, isPaused: true } : null
      }

    case 'RESUME_SESSION':
      return {
        ...state,
        status: 'active',
        activeTimer: state.activeTimer ? { ...state.activeTimer, isRunning: true, isPaused: false } : null
      }

    case 'COMPLETE_SESSION':
      return {
        ...state,
        status: 'completed',
        endTime: new Date(),
        activeTimer: null
      }

    case 'NEXT_EXERCISE':
      const nextIndex = Math.min(state.currentExerciseIndex + 1, state.exercises.length - 1)
      return {
        ...state,
        currentExerciseIndex: nextIndex,
        currentSetIndex: 0,
        activeTimer: null,
        performance: nextIndex > state.currentExerciseIndex ? {
          ...state.performance,
          exercisesCompleted: state.performance.exercisesCompleted + 1
        } : state.performance
      }

    case 'PREVIOUS_EXERCISE':
      const prevIndex = Math.max(state.currentExerciseIndex - 1, 0)
      return {
        ...state,
        currentExerciseIndex: prevIndex,
        currentSetIndex: 0,
        activeTimer: null
      }

    case 'COMPLETE_SET':
      const currentExercise = state.exercises[state.currentExerciseIndex]
      if (!currentExercise) {return state}

      const updatedExercise = {
        ...currentExercise,
        completedSets: [...(currentExercise.completedSets || []), action.payload.setData]
      }

      const updatedExercises = [...state.exercises]
      updatedExercises[state.currentExerciseIndex] = updatedExercise

      const isExerciseComplete = updatedExercise.completedSets.length >= currentExercise.sets
      const newSetIndex = isExerciseComplete ? 0 : state.currentSetIndex + 1

      return {
        ...state,
        exercises: updatedExercises,
        currentSetIndex: newSetIndex,
        performance: {
          ...state.performance,
          setsCompleted: state.performance.setsCompleted + 1,
          totalVolume: state.performance.totalVolume + (action.payload.setData.weight || 0) * (action.payload.setData.reps || 0)
        }
      }

    case 'UPDATE_TIMER':
      return {
        ...state,
        activeTimer: action.payload.timerState,
        elapsedTime: state.elapsedTime + (action.payload.timerState.elapsedTime || 0)
      }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload.settings }
      }

    case 'UPDATE_ELAPSED_TIME':
      return {
        ...state,
        elapsedTime: action.payload.elapsedTime
      }

    default:
      return state
  }
}

// Custom hook to use session execution context
export function useSessionExecution() {
  const context = useContext(SessionExecutionContext)
  if (!context) {
    throw new Error('useSessionExecution must be used within a SessionExecutionProvider')
  }
  return context
}

// Provider component
export function SessionExecutionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sessionExecutionReducer, initialState)
  
  // Calculate current exercise
  const currentExercise: ExecutingExercise | null = state.exercises[state.currentExerciseIndex] || null

  // Calculate progress
  const progress: SessionProgress = {
    exerciseProgress: state.exercises.length > 0 
      ? state.currentExerciseIndex / state.exercises.length 
      : 0,
    setProgress: currentExercise 
      ? (currentExercise.completedSets?.length || 0) / currentExercise.sets
      : 0,
    overallProgress: state.performance.totalSets > 0 
      ? state.performance.setsCompleted / state.performance.totalSets 
      : 0,
    timeElapsed: state.elapsedTime,
    estimatedTimeRemaining: 0 // Calculate based on remaining exercises and average time per set
  }

  // Actions
  const startSession = useCallback((
    exercises: SessionExercise[], 
    settings?: Partial<SessionSettings>
  ) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Convert SessionExercise to ExecutingExercise
    const executingExercises: ExecutingExercise[] = exercises.map(exercise => ({
      ...exercise,
      completedSets: [],
      startTime: null,
      endTime: null,
      notes: []
    }))

    dispatch({
      type: 'START_SESSION',
      payload: {
        sessionId,
        sessionType: 'strength', // TODO: Determine from exercises
        exercises: executingExercises,
        settings: settings || {}
      }
    })
  }, [])

  const pauseSession = useCallback(() => {
    dispatch({ type: 'PAUSE_SESSION' })
  }, [])

  const resumeSession = useCallback(() => {
    dispatch({ type: 'RESUME_SESSION' })
  }, [])

  const completeSession = useCallback(() => {
    dispatch({ type: 'COMPLETE_SESSION' })
  }, [])

  const nextExercise = useCallback(() => {
    dispatch({ type: 'NEXT_EXERCISE' })
  }, [])

  const previousExercise = useCallback(() => {
    dispatch({ type: 'PREVIOUS_EXERCISE' })
  }, [])

  const completeSet = useCallback((setData: LiveSet) => {
    dispatch({
      type: 'COMPLETE_SET',
      payload: { setData }
    })
  }, [])

  const updateTimer = useCallback((timerState: TimerState) => {
    dispatch({
      type: 'UPDATE_TIMER',
      payload: { timerState }
    })
  }, [])

  const updateSettings = useCallback((settings: Partial<SessionSettings>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { settings }
    })
  }, [])

  // Timer for elapsed time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (state.status === 'active' && state.startTime) {
      interval = setInterval(() => {
        const now = Date.now()
        const elapsed = now - state.startTime!.getTime() - state.pausedTime
        
        dispatch({
          type: 'UPDATE_ELAPSED_TIME',
          payload: { elapsedTime: elapsed }
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [state.status, state.startTime, state.pausedTime])

  // Persist session state to localStorage
  useEffect(() => {
    if (state.status !== 'idle') {
      try {
        localStorage.setItem('workoutSession', JSON.stringify({
          ...state,
          startTime: state.startTime?.toISOString(),
          endTime: state.endTime?.toISOString()
        }))
      } catch (error) {
        console.warn('Failed to persist session state:', error)
      }
    }
  }, [state])

  // Load session state from localStorage on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('workoutSession')
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession)
        if (parsedSession.status === 'active' || parsedSession.status === 'paused') {
          // Restore session with date conversion
          // TODO: Implement session restoration logic
        }
      }
    } catch (error) {
      console.warn('Failed to restore session state:', error)
    }
  }, [])

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
    updateSettings
  }

  return (
    <SessionExecutionContext.Provider value={contextValue}>
      {children}
    </SessionExecutionContext.Provider>
  )
}