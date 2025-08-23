/**
 * Session Execution Type Usage Examples
 * Demonstrates how to use the session execution types in React components
 */

import {
  TimerConfig,
  SessionExecution,
  TimerState,
  SessionEventHandlers,
  TimerEventHandlers,
  SessionAction,
  TabataConfig,
  StrengthConfig,
  SessionExecutionSettings,
  QuickActionConfig,
} from './session-execution';

// ================================
// Example Timer Configurations
// ================================

/**
 * Example Tabata Timer Configuration
 */
export const exampleTabataConfig: TimerConfig = {
  protocol: 'tabata',
  tabata: {
    workSeconds: 40,
    restSeconds: 10,
    rounds: 8,
    setBreakSeconds: 60,
    sets: 1,
    autoAdvance: true,
  },
  readyCountdown: 3,
  audioConfig: {
    enabled: true,
    volume: 0.8,
    events: {
      phase_start: {
        enabled: true,
        builtInSound: 'chime',
        ttsText: 'Start',
      },
      phase_warning: {
        enabled: true,
        builtInSound: 'beep',
        ttsText: '3 seconds remaining',
      },
      phase_end: {
        enabled: true,
        builtInSound: 'bell',
        ttsText: 'Rest',
      },
    },
    useTTS: true,
    ttsConfig: {
      voice: 'en-US-Standard-A',
      rate: 1.0,
      pitch: 1.0,
      language: 'en-US',
    },
  },
  hapticConfig: {
    enabled: true,
    events: {
      phase_start: {
        enabled: true,
        pattern: 'heavy',
      },
      phase_warning: {
        enabled: true,
        pattern: 'pulse',
      },
    },
  },
};

/**
 * Example Strength Training Timer Configuration
 */
export const exampleStrengthConfig: TimerConfig = {
  protocol: 'strength',
  strength: {
    restSeconds: 90,
    totalSets: 3,
    autoStartRest: true,
    transitionSeconds: 30,
  },
  readyCountdown: 5,
  audioConfig: {
    enabled: true,
    volume: 0.6,
    events: {
      set_complete: {
        enabled: true,
        builtInSound: 'chime',
        ttsText: 'Set complete. Rest for 90 seconds.',
      },
    },
    useTTS: true,
    ttsConfig: {
      voice: 'en-US-Standard-B',
      rate: 0.9,
      pitch: 1.0,
      language: 'en-US',
    },
  },
  hapticConfig: {
    enabled: false,
    events: {},
  },
};

// ================================
// Example Session State
// ================================

/**
 * Example Initial Session State
 */
export const exampleSessionExecution: SessionExecution = {
  sessionId: 'session-123',
  status: 'ready',
  currentSet: 1,
  timerState: {
    protocol: 'tabata',
    phase: 'ready',
    currentRound: 1,
    totalRounds: 8,
    timeRemaining: 3000,
    phaseTotal: 3000,
    elapsedTime: 0,
    isRunning: false,
    isPaused: false,
    startedAt: new Date(),
  },
  settings: {
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
  },
  exercises: [],
  currentExerciseIndex: 0,
  progress: {
    completionPercentage: 0,
    exercisesCompleted: 0,
    totalExercises: 5,
    setsCompleted: 0,
    totalSets: 15,
    currentPhase: 'warm_up',
    phaseProgress: {
      warm_up: {
        completion: 0,
        totalExercises: 2,
        completedExercises: 0,
      },
      main: {
        completion: 0,
        totalExercises: 3,
        completedExercises: 0,
      },
      cool_down: {
        completion: 0,
        totalExercises: 1,
        completedExercises: 0,
      },
    },
    estimatedTimeRemaining: 45,
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
    totalExercises: 5,
    exercisesCompleted: 0,
    totalSets: 15,
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
    quickActions: [
      {
        id: 'complete_set',
        label: 'Complete Set',
        icon: 'check',
        action: 'complete_set',
        enabled: true,
        position: 1,
        shortcut: 'space',
      },
    ],
    accessibility: {
      highContrast: false,
      largeText: false,
      screenReader: false,
      reduceMotion: false,
      voiceAnnouncements: true,
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
      usedMB: 2.5,
      availableMB: 1000,
      quotaMB: 1024,
      usagePercentage: 0.24,
      needsCleanup: false,
    },
  },
};

// ================================
// Example Event Handlers
// ================================

/**
 * Example Timer Event Handlers
 */
export const exampleTimerHandlers: TimerEventHandlers = {
  onTimerStart: (state: TimerState) => {
    console.log('Timer started:', state.phase);
  },

  onPhaseChange: (newPhase, state) => {
    console.log(`Phase changed from ${state.phase} to ${newPhase}`);

    // Example: Update UI based on phase
    if (newPhase === 'work') {
      // Show work UI, highlight current exercise
    } else if (newPhase === 'rest') {
      // Show rest UI, maybe show progress
    }
  },

  onTimerTick: (state) => {
    // Update display every second
    // This would typically trigger a state update in React
  },

  onWarning: (secondsRemaining, state) => {
    if (secondsRemaining === 3) {
      // Show visual warning, play sound, vibrate
    }
  },

  onTimerComplete: (state) => {
    console.log('Timer completed!');
    // Advance to next exercise or complete session
  },
};

/**
 * Example Session Event Handlers
 */
export const exampleSessionHandlers: SessionEventHandlers = {
  onSessionStart: (session) => {
    console.log('Session started:', session.sessionId);
    // Analytics tracking, notification, etc.
  },

  onExerciseStart: (exercise) => {
    console.log('Exercise started:', exercise.id);
    // Update current exercise display, start relevant timer
  },

  onSetComplete: (set, exercise) => {
    console.log('Set completed:', set.setNumber, 'of exercise:', exercise.id);
    // Update progress, save data, provide feedback
  },

  onPersonalRecord: (record) => {
    console.log('Personal record achieved!', record);
    // Show celebration animation, save achievement
  },

  onError: (error) => {
    console.error('Session error:', error);
    // Show error message, attempt recovery
  },
};

// ================================
// Example Reducer Actions
// ================================

/**
 * Example Session Actions for useReducer
 */
export const exampleSessionActions: SessionAction[] = [
  {
    type: 'START_SESSION',
  },
  {
    type: 'UPDATE_TIMER',
    payload: {
      timeRemaining: 35000,
      phase: 'work',
      isRunning: true,
    },
  },
  {
    type: 'COMPLETE_SET',
    payload: {
      setIndex: 0,
      data: {
        setNumber: 1,
        reps: 12,
        weight: 50,
        perceivedExertion: 7,
        formRating: 4,
        timestamp: new Date(),
      },
    },
  },
  {
    type: 'NEXT_EXERCISE',
  },
];

// ================================
// Example Settings Configuration
// ================================

/**
 * Example Session Execution Settings
 */
export const exampleSettings: SessionExecutionSettings = {
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

/**
 * Example Quick Actions Configuration
 */
export const exampleQuickActions: QuickActionConfig[] = [
  {
    id: 'complete_set',
    label: 'Complete Set',
    icon: 'check-circle',
    action: 'complete_set',
    enabled: true,
    position: 1,
    shortcut: 'Enter',
  },
  {
    id: 'skip_set',
    label: 'Skip Set',
    icon: 'skip-forward',
    action: 'skip_set',
    enabled: true,
    position: 2,
    shortcut: 's',
  },
  {
    id: 'pause_timer',
    label: 'Pause',
    icon: 'pause',
    action: 'pause_timer',
    enabled: true,
    position: 3,
    shortcut: 'Space',
  },
  {
    id: 'add_weight',
    label: 'Add Weight',
    icon: 'plus',
    action: 'add_weight',
    enabled: true,
    position: 4,
    shortcut: '+',
  },
];

// ================================
// Component Integration Examples
// ================================

/**
 * Example prop types for React components
 */
export interface ExampleTimerProps {
  timerState: TimerState;
  config: TimerConfig;
  onTimerEvent: (handlers: TimerEventHandlers) => void;
  size?: 'small' | 'medium' | 'large';
  showControls?: boolean;
}

export interface ExampleSessionProps {
  session: SessionExecution;
  onSessionUpdate: (action: SessionAction) => void;
  settings: SessionExecutionSettings;
  onSettingsChange: (settings: Partial<SessionExecutionSettings>) => void;
}

/**
 * Example custom hooks interface
 */
export interface UseSessionExecutionReturn {
  session: SessionExecution | null;
  dispatch: (action: SessionAction) => void;
  isLoading: boolean;
  error: string | null;

  // Convenience methods
  startSession: () => void;
  pauseSession: () => void;
  completeSet: (setData: any) => void;
  nextExercise: () => void;

  // Timer methods
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
}

export interface UseTimerReturn {
  timerState: TimerState;
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  setConfig: (config: TimerConfig) => void;
}

// ================================
// Type Validation Examples
// ================================

/**
 * Example type validation functions
 */
export const validateTimerConfig = (config: any): config is TimerConfig => {
  return (
    typeof config === 'object' &&
    'protocol' in config &&
    ['tabata', 'emom', 'amrap', 'strength', 'custom'].includes(
      config.protocol
    ) &&
    'readyCountdown' in config &&
    typeof config.readyCountdown === 'number'
  );
};

export const validateSessionExecution = (
  session: any
): session is SessionExecution => {
  return (
    typeof session === 'object' &&
    'sessionId' in session &&
    'status' in session &&
    'timerState' in session &&
    'progress' in session &&
    'performance' in session
  );
};

/**
 * Example default values
 */
export const defaultTimerState: TimerState = {
  protocol: 'tabata',
  phase: 'ready',
  currentRound: 1,
  totalRounds: 1,
  timeRemaining: 0,
  phaseTotal: 0,
  elapsedTime: 0,
  isRunning: false,
  isPaused: false,
};

export const defaultTabataConfig: TabataConfig = {
  workSeconds: 40,
  restSeconds: 10,
  rounds: 8,
  setBreakSeconds: 60,
  sets: 1,
  autoAdvance: true,
};

export const defaultStrengthConfig: StrengthConfig = {
  restSeconds: 90,
  totalSets: 3,
  autoStartRest: true,
  transitionSeconds: 30,
};
