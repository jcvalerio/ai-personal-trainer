/**
 * Offline-Enhanced Session Execution Provider
 * Extends the session execution provider with offline capabilities and auto-sync
 */
'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react'
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
import { useOfflineStatus } from '@/lib/hooks/use-offline-status'
import { offlineStorage, OfflineWorkoutData } from '@/lib/services/offline-storage-service'

// Enhanced context type with offline capabilities
interface OfflineSessionExecutionContextType {
  // Core session state
  session: SessionExecution | null
  currentExercise: ExecutingExercise | null
  progress: SessionProgress
  settings: SessionSettings
  
  // Offline state
  isOffline: boolean
  isSyncing: boolean
  hasPendingData: boolean
  offlineDataCount: number
  lastSyncTime: Date | null
  
  // Core actions
  startSession: (exercises: SessionExercise[], settings?: Partial<SessionSettings>) => void
  pauseSession: () => void
  resumeSession: () => void
  completeSession: () => void
  nextExercise: () => void
  previousExercise: () => void
  completeSet: (setData: LiveSet) => void
  updateTimer: (timerState: TimerState) => void
  updateSettings: (settings: Partial<SessionSettings>) => void
  
  // Offline actions
  syncOfflineData: () => Promise<void>
  clearOfflineData: () => Promise<void>
  forceOfflineMode: () => void
  exitOfflineMode: () => void
}

const OfflineSessionExecutionContext = createContext<OfflineSessionExecutionContextType | undefined>(undefined)

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

// Enhanced reducer with offline persistence actions
function offlineSessionReducer(
  state: SessionExecution, 
  action: SessionExecutionAction & { type: string; payload?: any }
): SessionExecution {
  // Handle all standard session actions
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

    case 'RESTORE_SESSION':
      return {
        ...state,
        ...action.payload.sessionData,
        // Convert ISO strings back to Date objects
        startTime: action.payload.sessionData.startTime 
          ? new Date(action.payload.sessionData.startTime) 
          : null,
        endTime: action.payload.sessionData.endTime 
          ? new Date(action.payload.sessionData.endTime) 
          : null
      }

    default:
      return state
  }
}

// Provider component with offline capabilities
export function OfflineSessionExecutionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(offlineSessionReducer, initialState)
  const offlineStatus = useOfflineStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [offlineDataCount, setOfflineDataCount] = useState(0)
  const syncTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Initialize offline storage
  useEffect(() => {
    offlineStorage.initialize().catch(error => {
      console.warn('Failed to initialize offline storage:', error)
    })
  }, [])

  // Calculate current exercise and progress
  const currentExercise: ExecutingExercise | null = state.exercises[state.currentExerciseIndex] || null
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
    estimatedTimeRemaining: 0
  }

  // Load offline data count
  const loadOfflineDataCount = useCallback(async () => {
    try {
      const stats = await offlineStorage.getStorageStats()
      setOfflineDataCount(stats.unsyncedWorkouts)
    } catch (error) {
      console.warn('Failed to load offline data count:', error)
    }
  }, [])

  // Load offline data count on mount and when offline status changes
  useEffect(() => {
    loadOfflineDataCount()
  }, [loadOfflineDataCount, offlineStatus.isOffline])

  // Auto-save session state (enhanced with offline storage)
  const saveSessionState = useCallback(async () => {
    if (state.status === 'idle') {return}

    try {
      // Save to localStorage for quick recovery
      const sessionData = {
        ...state,
        startTime: state.startTime?.toISOString(),
        endTime: state.endTime?.toISOString()
      }
      localStorage.setItem('workoutSession', JSON.stringify(sessionData))

      // Also save to IndexedDB for offline persistence
      if (state.status === 'active' || state.status === 'paused' || state.status === 'completed') {
        await offlineStorage.saveWorkoutData(state)
        
        // Update offline data count
        await loadOfflineDataCount()
      }
    } catch (error) {
      console.warn('Failed to save session state:', error)
    }
  }, [state, loadOfflineDataCount])

  // Debounced auto-save
  useEffect(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      saveSessionState()
    }, 1000) // Save after 1 second of inactivity

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [state, saveSessionState])

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // First try localStorage for quick restoration
        const savedSession = localStorage.getItem('workoutSession')
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession)
          if (parsedSession.status === 'active' || parsedSession.status === 'paused') {
            dispatch({
              type: 'RESTORE_SESSION',
              payload: { sessionData: parsedSession }
            })
            console.log('Session restored from localStorage')
          }
        }
      } catch (error) {
        console.warn('Failed to restore session:', error)
      }
    }

    restoreSession()
  }, [])

  // Sync offline data when coming back online
  useEffect(() => {
    if (offlineStatus.isOnline && !isSyncing && offlineDataCount > 0) {
      // Auto-sync after a short delay
      const timeoutId = setTimeout(() => {
        syncOfflineData()
      }, 2000)

      return () => clearTimeout(timeoutId)
    }
  }, [offlineStatus.isOnline, offlineDataCount, isSyncing])

  // Listen for service worker sync events
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SYNC_COMPLETE') {
          setIsSyncing(false)
          setLastSyncTime(new Date())
          loadOfflineDataCount()
        }
      }

      navigator.serviceWorker.addEventListener('message', handleMessage)
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }
  }, [loadOfflineDataCount])

  // Enhanced session actions
  const startSession = useCallback((
    exercises: SessionExercise[], 
    settings?: Partial<SessionSettings>
  ) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
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
        sessionType: 'strength',
        exercises: executingExercises,
        settings: settings || {}
      }
    })

    console.log('Session started:', sessionId, offlineStatus.isOffline ? '(offline)' : '(online)')
  }, [offlineStatus.isOffline])

  const pauseSession = useCallback(() => {
    dispatch({ type: 'PAUSE_SESSION' })
  }, [])

  const resumeSession = useCallback(() => {
    dispatch({ type: 'RESUME_SESSION' })
  }, [])

  const completeSession = useCallback(async () => {
    dispatch({ type: 'COMPLETE_SESSION' })
    
    // Immediately save completed session
    await saveSessionState()
    
    console.log('Session completed:', state.sessionId, offlineStatus.isOffline ? '(saved offline)' : '(will sync)')
  }, [state.sessionId, offlineStatus.isOffline, saveSessionState])

  const nextExercise = useCallback(() => {
    dispatch({ type: 'NEXT_EXERCISE' })
  }, [])

  const previousExercise = useCallback(() => {
    dispatch({ type: 'PREVIOUS_EXERCISE' })
  }, [])

  const completeSet = useCallback(async (setData: LiveSet) => {
    dispatch({
      type: 'COMPLETE_SET',
      payload: { setData }
    })

    // Save exercise data immediately
    try {
      await offlineStorage.saveExerciseData({
        id: `exercise_${state.sessionId}_${state.currentExerciseIndex}_${Date.now()}`,
        exerciseId: currentExercise?.id || '',
        sets: [setData],
        timestamp: Date.now(),
        sessionId: state.sessionId
      })
    } catch (error) {
      console.warn('Failed to save exercise data:', error)
    }
  }, [state.sessionId, state.currentExerciseIndex, currentExercise])

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

  // Offline-specific actions
  const syncOfflineData = useCallback(async () => {
    if (offlineStatus.isOffline || isSyncing) {return}

    try {
      setIsSyncing(true)
      console.log('Starting offline data sync...')

      const unsyncedWorkouts = await offlineStorage.getAllUnsyncedWorkouts()
      
      for (const workoutData of unsyncedWorkouts) {
        try {
          // Attempt to sync with server
          const response = await fetch('/api/workouts/sessions/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(workoutData)
          })

          if (response.ok) {
            await offlineStorage.markWorkoutSynced(workoutData.id)
            console.log('Synced workout:', workoutData.id)
          } else {
            console.warn('Failed to sync workout:', workoutData.id, response.status)
          }
        } catch (error) {
          console.warn('Network error syncing workout:', workoutData.id, error)
          break // Stop syncing on network errors
        }
      }

      setLastSyncTime(new Date())
      await loadOfflineDataCount()
      console.log('Offline data sync completed')

    } catch (error) {
      console.error('Failed to sync offline data:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [offlineStatus.isOffline, isSyncing, loadOfflineDataCount])

  const clearOfflineData = useCallback(async () => {
    try {
      await offlineStorage.clearAllData()
      setOfflineDataCount(0)
      console.log('Offline data cleared')
    } catch (error) {
      console.error('Failed to clear offline data:', error)
    }
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

  const contextValue: OfflineSessionExecutionContextType = {
    // Core session state
    session: state,
    currentExercise,
    progress,
    settings: state.settings,
    
    // Offline state
    isOffline: offlineStatus.isOffline,
    isSyncing,
    hasPendingData: offlineDataCount > 0,
    offlineDataCount,
    lastSyncTime,
    
    // Core actions
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    nextExercise,
    previousExercise,
    completeSet,
    updateTimer,
    updateSettings,
    
    // Offline actions
    syncOfflineData,
    clearOfflineData,
    forceOfflineMode: offlineStatus.forceOfflineMode,
    exitOfflineMode: offlineStatus.exitOfflineMode
  }

  return (
    <OfflineSessionExecutionContext.Provider value={contextValue}>
      {children}
    </OfflineSessionExecutionContext.Provider>
  )
}

// Custom hook to use offline session execution context
export function useOfflineSessionExecution() {
  const context = useContext(OfflineSessionExecutionContext)
  if (!context) {
    throw new Error('useOfflineSessionExecution must be used within an OfflineSessionExecutionProvider')
  }
  return context
}