/**
 * Session Execution and Timer System Type Definitions
 * Comprehensive TypeScript types for real-time workout session execution
 */

import { SessionExercise, ExercisePhase, SetPerformanceData } from './workouts';

// ================================
// Core Timer System Types
// ================================

/**
 * Timer Protocol Types
 */
export type TimerProtocol =
  | 'tabata' // 40s work, 10s rest, 8 rounds
  | 'emom' // Every Minute On the Minute
  | 'amrap' // As Many Rounds As Possible
  | 'strength' // Set-based with rest periods
  | 'custom'; // User-defined intervals

/**
 * Timer Phase States
 */
export type TimerPhase =
  | 'ready' // Pre-start countdown
  | 'work' // Work period
  | 'rest' // Rest period
  | 'set_break' // Break between sets
  | 'transition' // Between exercises
  | 'completed' // Timer finished
  | 'paused' // User paused
  | 'stopped'; // User stopped

/**
 * Timer State Management
 */
export interface TimerState {
  /** Current timer protocol */
  protocol: TimerProtocol;
  /** Current phase of the timer */
  phase: TimerPhase;
  /** Current round/set number (1-indexed) */
  currentRound: number;
  /** Total rounds/sets planned */
  totalRounds: number;
  /** Current time remaining in milliseconds */
  timeRemaining: number;
  /** Total time for current phase in milliseconds */
  phaseTotal: number;
  /** Overall elapsed time in milliseconds */
  elapsedTime: number;
  /** Is timer currently running */
  isRunning: boolean;
  /** Is timer paused */
  isPaused: boolean;
  /** Timestamp when timer started */
  startedAt?: Date;
  /** Timestamp when timer completed */
  completedAt?: Date;
}

/**
 * Tabata Timer Configuration
 */
export interface TabataConfig {
  /** Work period duration in seconds */
  workSeconds: number;
  /** Rest period duration in seconds */
  restSeconds: number;
  /** Number of rounds */
  rounds: number;
  /** Break between sets in seconds */
  setBreakSeconds: number;
  /** Number of sets (typically 1) */
  sets: number;
  /** Auto-start next phase */
  autoAdvance: boolean;
}

/**
 * EMOM Timer Configuration
 */
export interface EMOMConfig {
  /** Duration of each minute in seconds (typically 60) */
  intervalSeconds: number;
  /** Total number of intervals */
  totalIntervals: number;
  /** Auto-start each interval */
  autoStart: boolean;
}

/**
 * AMRAP Timer Configuration
 */
export interface AMRAPConfig {
  /** Total duration in seconds */
  totalSeconds: number;
  /** Show round counter */
  showRounds: boolean;
}

/**
 * Strength Timer Configuration
 */
export interface StrengthConfig {
  /** Rest period between sets in seconds */
  restSeconds: number;
  /** Total number of sets */
  totalSets: number;
  /** Auto-start rest timer after set completion */
  autoStartRest: boolean;
  /** Transition time between exercises */
  transitionSeconds: number;
}

/**
 * Custom Timer Configuration
 */
export interface CustomConfig {
  /** Array of interval durations in seconds */
  intervals: number[];
  /** Labels for each interval */
  intervalLabels: string[];
  /** Whether to repeat the sequence */
  repeat: boolean;
  /** Number of repetitions (0 = infinite) */
  repetitions: number;
}

/**
 * Unified Timer Configuration
 */
export interface TimerConfig {
  protocol: TimerProtocol;
  tabata?: TabataConfig;
  emom?: EMOMConfig;
  amrap?: AMRAPConfig;
  strength?: StrengthConfig;
  custom?: CustomConfig;
  /** Pre-start countdown in seconds */
  readyCountdown: number;
  /** Audio feedback settings */
  audioConfig: AudioFeedbackConfig;
  /** Haptic feedback settings */
  hapticConfig: HapticFeedbackConfig;
}

// ================================
// Audio and Haptic Feedback Types
// ================================

/**
 * Audio Feedback Events
 */
export type AudioEventType =
  | 'phase_start' // New phase begins
  | 'phase_warning' // 3-second warning
  | 'phase_end' // Phase completed
  | 'set_complete' // Set completed
  | 'workout_complete' // Entire workout completed
  | 'countdown'; // Countdown beeps

/**
 * Audio Feedback Configuration
 */
export interface AudioFeedbackConfig {
  /** Enable audio feedback */
  enabled: boolean;
  /** Volume level (0-1) */
  volume: number;
  /** Audio events to play */
  events: Partial<Record<AudioEventType, AudioEventConfig>>;
  /** Use text-to-speech */
  useTTS: boolean;
  /** TTS voice settings */
  ttsConfig?: TTSConfig;
}

/**
 * Individual Audio Event Configuration
 */
export interface AudioEventConfig {
  /** Enable this specific event */
  enabled: boolean;
  /** Audio file URL or built-in sound */
  soundUrl?: string;
  /** Built-in sound type */
  builtInSound?: 'beep' | 'chime' | 'bell' | 'whistle';
  /** Text to speak (if TTS enabled) */
  ttsText?: string;
  /** Volume override for this event */
  volume?: number;
}

/**
 * Text-to-Speech Configuration
 */
export interface TTSConfig {
  /** TTS voice identifier */
  voice: string;
  /** Speech rate (0.5 - 2.0) */
  rate: number;
  /** Speech pitch (0.5 - 2.0) */
  pitch: number;
  /** Language code */
  language: string;
}

/**
 * Haptic Feedback Types
 */
export type HapticPattern =
  | 'light' // Light tap
  | 'medium' // Medium tap
  | 'heavy' // Heavy tap
  | 'pulse' // Pulsing pattern
  | 'double' // Double tap
  | 'triple' // Triple tap
  | 'long'; // Long vibration

/**
 * Haptic Feedback Configuration
 */
export interface HapticFeedbackConfig {
  /** Enable haptic feedback */
  enabled: boolean;
  /** Haptic patterns for events */
  events: Partial<Record<AudioEventType, HapticEventConfig>>;
}

/**
 * Individual Haptic Event Configuration
 */
export interface HapticEventConfig {
  /** Enable this haptic event */
  enabled: boolean;
  /** Haptic pattern to use */
  pattern: HapticPattern;
  /** Intensity (0-1, iOS only) */
  intensity?: number;
  /** Duration in milliseconds (Android only) */
  duration?: number;
}

// ================================
// Session Execution Types
// ================================

/**
 * Live Session State
 */
export type SessionExecutionStatus =
  | 'idle' // Initial state, no session active
  | 'preparing' // Setting up session
  | 'ready' // Ready to start
  | 'active' // Session in progress
  | 'resting' // Rest period
  | 'transitioning' // Between exercises
  | 'paused' // User paused
  | 'completed' // Session finished
  | 'stopped'; // User stopped early

/**
 * Real-time Session Context
 */
export interface SessionExecution {
  /** Session ID */
  sessionId: string;
  /** Current execution status */
  status: SessionExecutionStatus;
  /** Current exercise being performed */
  currentExercise?: ExecutingExercise;
  /** Current set number (1-indexed) */
  currentSet: number;
  /** Timer state */
  timerState: TimerState;
  /** Overall session progress */
  progress: SessionProgress;
  /** Performance tracking */
  performance: SessionPerformance;
  /** User interaction state */
  interaction: SessionInteraction;
  /** Timestamps */
  timestamps: SessionTimestamps;
  /** Offline capability state */
  offline: OfflineState;
  /** Session settings */
  settings: SessionSettings;
  /** All exercises in session */
  exercises: SessionExercise[];
  /** Current exercise index (0-based) */
  currentExerciseIndex: number;
  /** Active timer configuration */
  activeTimer?: TimerState;
  /** Session start time */
  startTime?: Date;
  /** Session end time */
  endTime?: Date;
  /** Paused time duration */
  pausedTime?: number;
  /** Session type */
  sessionType?: string;
  /** Elapsed time in milliseconds */
  elapsedTime?: number;
}

/**
 * Currently Executing Exercise
 */
export interface ExecutingExercise extends SessionExercise {
  /** Real-time set tracking */
  liveSets: LiveSet[];
  /** Current set being performed (0-indexed) */
  currentSetIndex: number;
  /** Exercise-specific timer config */
  timerConfig?: TimerConfig;
  /** Exercise start time */
  startedAt: Date;
  /** Exercise completion time */
  completedAt?: Date;
  /** Live performance metrics */
  liveMetrics: LiveMetrics;
  /** Exercise name */
  name: string;
  /** Exercise description */
  description?: string;
  /** Exercise sets configuration */
  sets: number;
  /** Target reps per set */
  targetReps: number;
  /** Target weight */
  targetWeight: number;
  /** Target duration in seconds */
  targetDuration?: number;
  /** Completed sets count */
  completedSets: number;
}

/**
 * Live Set Tracking
 */
export interface LiveSet extends SetPerformanceData {
  /** Set start time */
  startedAt: Date;
  /** Set completion time */
  completedAt?: Date;
  /** Live rep counting */
  liveReps: number;
  /** Is set currently active */
  isActive: boolean;
  /** Is set completed */
  isCompleted: boolean;
  /** Real-time notes */
  liveNotes: string;
  /** Set quality assessment */
  quality: SetQuality;
}

/**
 * Set Quality Assessment
 */
export interface SetQuality {
  /** Form rating (1-5) */
  form: number;
  /** Completion percentage */
  completion: number;
  /** Tempo consistency */
  tempo: number;
  /** Range of motion quality */
  rangeOfMotion: number;
  /** Overall quality score */
  overall: number;
}

/**
 * Live Performance Metrics
 */
export interface LiveMetrics {
  /** Total reps completed */
  totalReps: number;
  /** Total weight moved */
  totalVolume: number;
  /** Average rest time between sets */
  avgRestTime: number;
  /** Exercise duration */
  exerciseDuration: number;
  /** Perceived exertion trend */
  exertionTrend: number[];
  /** Form consistency */
  formConsistency: number;
}

/**
 * Session Progress Tracking
 */
export interface SessionProgress {
  /** Overall completion percentage (0-100) */
  completionPercentage: number;
  /** Exercises completed */
  exercisesCompleted: number;
  /** Total exercises planned */
  totalExercises: number;
  /** Sets completed */
  setsCompleted: number;
  /** Total sets planned */
  totalSets: number;
  /** Current phase */
  currentPhase: ExercisePhase;
  /** Phase progress */
  phaseProgress: Record<ExercisePhase, PhaseProgress>;
  /** Estimated time remaining in minutes */
  estimatedTimeRemaining: number;
  /** Overall progress percentage */
  overallProgress: number;
  /** Time elapsed in minutes */
  timeElapsed: number;
  /** Exercise-specific progress tracking */
  exerciseProgress?: Record<string, number>;
}

/**
 * Phase-specific Progress
 */
export interface PhaseProgress {
  /** Phase completion percentage */
  completion: number;
  /** Exercises in this phase */
  totalExercises: number;
  /** Completed exercises in this phase */
  completedExercises: number;
  /** Phase start time */
  startedAt?: Date;
  /** Phase completion time */
  completedAt?: Date;
}

/**
 * Session Performance Summary
 */
export interface SessionPerformance {
  /** Total volume (weight × reps) */
  totalVolume: number;
  /** Total reps completed */
  totalReps: number;
  /** Average perceived exertion */
  avgPerceivedExertion: number;
  /** Average form rating */
  avgFormRating: number;
  /** Session duration in minutes */
  sessionDuration: number;
  /** Active work time (excluding rest) */
  activeWorkTime: number;
  /** Total rest time */
  totalRestTime: number;
  /** Personal records achieved */
  personalRecords: PersonalRecord[];
  /** Performance compared to planned */
  vsPlanned: PerformanceComparison;
  /** Sets completed */
  setsCompleted: number;
  /** Total exercises completed */
  totalExercises: number;
  /** Exercises completed count */
  exercisesCompleted: number;
  /** Total sets in session */
  totalSets: number;
  /** Average intensity across session */
  averageIntensity?: number;
}

/**
 * Personal Record Achievement
 */
export interface PersonalRecord {
  /** Type of record */
  type: 'weight' | 'reps' | 'volume' | 'duration';
  /** Exercise ID */
  exerciseId: string;
  /** Exercise name */
  exerciseName: string;
  /** New record value */
  newValue: number;
  /** Previous record value */
  previousValue: number;
  /** Unit of measurement */
  unit: string;
  /** Date achieved */
  achievedAt: Date;
}

/**
 * Performance vs Planned Comparison
 */
export interface PerformanceComparison {
  /** Volume percentage vs planned */
  volumePercentage: number;
  /** Reps percentage vs planned */
  repsPercentage: number;
  /** Weight percentage vs planned */
  weightPercentage: number;
  /** Duration percentage vs planned */
  durationPercentage: number;
  /** Overall performance rating */
  overallRating: 'exceeded' | 'met' | 'below' | 'failed';
}

// ================================
// User Interface Types
// ================================

/**
 * Session Interaction State
 */
export interface SessionInteraction {
  /** Current input mode */
  inputMode: InteractionMode;
  /** Touch interaction state */
  touchState: TouchInteractionState;
  /** Quick action buttons */
  quickActions: QuickActionConfig[];
  /** Accessibility state */
  accessibility: AccessibilityState;
  /** One-handed operation mode */
  oneHandedMode: boolean;
}

/**
 * User Interaction Modes
 */
export type InteractionMode =
  | 'touch' // Touch-based input
  | 'voice' // Voice commands
  | 'gesture' // Gesture recognition
  | 'auto' // Automatic progression
  | 'external'; // External device input

/**
 * Touch Interaction State
 */
export interface TouchInteractionState {
  /** Enable swipe gestures */
  swipeEnabled: boolean;
  /** Swipe sensitivity */
  swipeSensitivity: number;
  /** Touch feedback enabled */
  touchFeedback: boolean;
  /** Large touch targets for accessibility */
  largeTouchTargets: boolean;
  /** Prevent accidental touches */
  preventAccidental: boolean;
}

/**
 * Quick Action Configuration
 */
export interface QuickActionConfig {
  /** Action identifier */
  id: string;
  /** Action label */
  label: string;
  /** Action icon */
  icon: string;
  /** Action handler */
  action: QuickActionType;
  /** Is action enabled */
  enabled: boolean;
  /** Action position/priority */
  position: number;
  /** Keyboard shortcut */
  shortcut?: string;
}

/**
 * Quick Action Types
 */
export type QuickActionType =
  | 'complete_set' // Mark current set complete
  | 'skip_set' // Skip current set
  | 'add_weight' // Increase weight
  | 'reduce_weight' // Decrease weight
  | 'start_rest' // Start rest timer
  | 'pause_timer' // Pause/resume timer
  | 'next_exercise' // Move to next exercise
  | 'previous_exercise' // Go back to previous
  | 'add_note' // Add quick note
  | 'rate_form'; // Quick form rating

/**
 * Accessibility Configuration
 */
export interface AccessibilityState {
  /** High contrast mode */
  highContrast: boolean;
  /** Large text size */
  largeText: boolean;
  /** Screen reader support */
  screenReader: boolean;
  /** Reduce motion */
  reduceMotion: boolean;
  /** Voice announcements */
  voiceAnnouncements: boolean;
  /** Simplified interface */
  simplifiedUI: boolean;
  /** Color blind support */
  colorBlindSupport: boolean;
}

/**
 * Mobile-First Responsive Breakpoints
 */
export interface ResponsiveConfig {
  /** Current breakpoint */
  currentBreakpoint: ResponsiveBreakpoint;
  /** Available screen real estate */
  screenSize: ScreenSize;
  /** Orientation */
  orientation: 'portrait' | 'landscape';
  /** Device type detection */
  deviceType: DeviceType;
}

/**
 * Responsive Breakpoints
 */
export type ResponsiveBreakpoint =
  | 'xs' // < 480px
  | 'sm' // 480px - 768px
  | 'md' // 768px - 1024px
  | 'lg' // 1024px - 1440px
  | 'xl'; // > 1440px

/**
 * Screen Size Dimensions
 */
export interface ScreenSize {
  /** Screen width in pixels */
  width: number;
  /** Screen height in pixels */
  height: number;
  /** Available width (excluding system UI) */
  availableWidth: number;
  /** Available height (excluding system UI) */
  availableHeight: number;
  /** Device pixel ratio */
  pixelRatio: number;
}

/**
 * Device Type Detection
 */
export type DeviceType =
  | 'phone' // Mobile phone
  | 'tablet' // Tablet device
  | 'desktop' // Desktop computer
  | 'tv' // Smart TV
  | 'watch' // Smartwatch
  | 'unknown'; // Unknown device

// ================================
// Component Props Types
// ================================

/**
 * Timer Display Component Props
 */
export interface TimerDisplayProps {
  /** Current timer state */
  timerState: TimerState;
  /** Timer configuration */
  config: TimerConfig;
  /** Display size variant */
  size: 'small' | 'medium' | 'large';
  /** Color scheme */
  colorScheme: 'light' | 'dark' | 'auto';
  /** Show progress ring */
  showProgress: boolean;
  /** Show phase labels */
  showLabels: boolean;
  /** Animation enabled */
  animated: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Custom styling */
  className?: string;
}

/**
 * Exercise Progress Component Props
 */
export interface ExerciseProgressProps {
  /** Current executing exercise */
  exercise: ExecutingExercise;
  /** Session progress */
  progress: SessionProgress;
  /** Show detailed metrics */
  showMetrics: boolean;
  /** Compact layout */
  compact: boolean;
  /** Edit mode enabled */
  editable: boolean;
  /** Change handlers */
  onSetComplete?: (setIndex: number, data: SetPerformanceData) => void;
  onWeightChange?: (weight: number) => void;
  onRepsChange?: (reps: number) => void;
  onNotesChange?: (notes: string) => void;
}

/**
 * Session Controls Component Props
 */
export interface SessionControlsProps {
  /** Current session state */
  session: SessionExecution;
  /** Control layout variant */
  layout: 'minimal' | 'standard' | 'full';
  /** One-handed mode */
  oneHanded: boolean;
  /** Control handlers */
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onCompleteSet?: () => void;
  onSkipSet?: () => void;
  /** Custom actions */
  customActions?: QuickActionConfig[];
}

/**
 * Session Stats Component Props
 */
export interface SessionStatsProps {
  /** Session performance data */
  performance: SessionPerformance;
  /** Display mode */
  mode: 'live' | 'summary' | 'comparison';
  /** Show trends */
  showTrends: boolean;
  /** Compact layout */
  compact: boolean;
  /** Time period for trends */
  trendPeriod: 'session' | 'week' | 'month';
}

// ================================
// State Management Types
// ================================

/**
 * Session Context Provider State
 */
export interface SessionContextState {
  /** Current session execution */
  session: SessionExecution | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Initialization status */
  initialized: boolean;
}

/**
 * Session Reducer Actions
 */
export type SessionAction =
  | { type: 'INITIALIZE_SESSION'; payload: SessionExecution }
  | { type: 'START_SESSION'; payload?: any }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'STOP_SESSION' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'UPDATE_TIMER'; payload: Partial<TimerState> }
  | {
      type: 'COMPLETE_SET';
      payload: { 
        setIndex: number; 
        data: SetPerformanceData; 
        setData?: any;
        skipProgressUpdate?: boolean;
        recoveryMode?: boolean;
        actualProgress?: {
          setsCompleted: number;
          exercisesCompleted: number;
        };
      };
    }
  | { type: 'SKIP_SET'; payload: { setIndex: number } }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'PREVIOUS_EXERCISE' }
  | { type: 'UPDATE_EXERCISE'; payload: Partial<ExecutingExercise> }
  | { type: 'UPDATE_PROGRESS'; payload: Partial<SessionProgress> }
  | { type: 'UPDATE_PERFORMANCE'; payload: Partial<SessionPerformance> }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<SessionExecutionSettings> }
  | { type: 'UPDATE_ELAPSED_TIME'; payload: number }
  | { type: 'UPDATE_TIMER_STATE'; payload: { timerState: TimerState } }
  | { type: 'UPDATE_SESSION_ID'; payload: string }
  | { type: 'ADD_PENDING_SET'; payload: SetPerformanceData }
  | { type: 'REMOVE_PENDING_SET'; payload: number }
  | { type: 'CLEAR_PENDING_SETS' }
  | { type: 'ROLLBACK_SET'; payload: { setIndex: number; data: SetPerformanceData; setData?: any } };

/**
 * Alias for SessionAction for backward compatibility
 */
export type SessionExecutionAction = SessionAction;

/**
 * Session Timestamps
 */
export interface SessionTimestamps {
  /** Session created */
  createdAt: Date;
  /** Session started */
  startedAt?: Date;
  /** Session paused */
  pausedAt?: Date;
  /** Session resumed */
  resumedAt?: Date;
  /** Session completed */
  completedAt?: Date;
  /** Last updated */
  lastUpdated: Date;
  /** Auto-save timestamp */
  lastSaved?: Date;
}

// ================================
// Persistence and Offline Types
// ================================

/**
 * Offline State Management
 */
export interface OfflineState {
  /** Is currently offline */
  isOffline: boolean;
  /** Local data is dirty (needs sync) */
  isDirty: boolean;
  /** Last sync timestamp */
  lastSync?: Date;
  /** Pending sync operations */
  pendingSync: PendingSyncOperation[];
  /** Conflict resolution needed */
  hasConflicts: boolean;
  /** Storage usage info */
  storageInfo: StorageInfo;
}

/**
 * Pending Sync Operations
 */
export interface PendingSyncOperation {
  /** Operation ID */
  id: string;
  /** Operation type */
  type: 'create' | 'update' | 'delete';
  /** Entity type */
  entity: 'session' | 'exercise' | 'set' | 'performance';
  /** Operation data */
  data: any;
  /** Timestamp */
  timestamp: Date;
  /** Retry count */
  retryCount: number;
  /** Priority (higher = more important) */
  priority: number;
}

/**
 * Storage Information
 */
export interface StorageInfo {
  /** Used storage in MB */
  usedMB: number;
  /** Available storage in MB */
  availableMB: number;
  /** Storage quota in MB */
  quotaMB: number;
  /** Usage percentage */
  usagePercentage: number;
  /** Needs cleanup */
  needsCleanup: boolean;
}

/**
 * Real-time Synchronization Events
 */
export type SyncEventType =
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_completed'
  | 'set_completed'
  | 'exercise_completed'
  | 'performance_updated'
  | 'timer_updated';

/**
 * Sync Event Data
 */
export interface SyncEvent {
  /** Event type */
  type: SyncEventType;
  /** Session ID */
  sessionId: string;
  /** Event data */
  data: any;
  /** Timestamp */
  timestamp: Date;
  /** Device/client ID */
  clientId: string;
  /** Sequence number for ordering */
  sequence: number;
}

// ================================
// Event Handler Types
// ================================

/**
 * Timer Event Handlers
 */
export interface TimerEventHandlers {
  /** Timer started */
  onTimerStart?: (state: TimerState) => void;
  /** Timer paused */
  onTimerPause?: (state: TimerState) => void;
  /** Timer resumed */
  onTimerResume?: (state: TimerState) => void;
  /** Timer stopped */
  onTimerStop?: (state: TimerState) => void;
  /** Phase changed */
  onPhaseChange?: (newPhase: TimerPhase, state: TimerState) => void;
  /** Timer tick (every second) */
  onTimerTick?: (state: TimerState) => void;
  /** Timer completed */
  onTimerComplete?: (state: TimerState) => void;
  /** Warning (e.g., 3 seconds remaining) */
  onWarning?: (secondsRemaining: number, state: TimerState) => void;
}

/**
 * Session Event Handlers
 */
export interface SessionEventHandlers {
  /** Session initialized */
  onSessionInit?: (session: SessionExecution) => void;
  /** Session started */
  onSessionStart?: (session: SessionExecution) => void;
  /** Session paused */
  onSessionPause?: (session: SessionExecution) => void;
  /** Session resumed */
  onSessionResume?: (session: SessionExecution) => void;
  /** Session completed */
  onSessionComplete?: (session: SessionExecution) => void;
  /** Exercise started */
  onExerciseStart?: (exercise: ExecutingExercise) => void;
  /** Exercise completed */
  onExerciseComplete?: (exercise: ExecutingExercise) => void;
  /** Set completed */
  onSetComplete?: (set: LiveSet, exercise: ExecutingExercise) => void;
  /** Progress updated */
  onProgressUpdate?: (progress: SessionProgress) => void;
  /** Performance record achieved */
  onPersonalRecord?: (record: PersonalRecord) => void;
  /** Error occurred */
  onError?: (error: string) => void;
}

// ================================
// Configuration and Settings
// ================================

/**
 * Default Timer Configurations
 */
export interface DefaultTimerConfigs {
  tabata: TabataConfig;
  emom: EMOMConfig;
  amrap: AMRAPConfig;
  strength: StrengthConfig;
}

/**
 * Session Execution Settings
 */
export interface SessionExecutionSettings {
  /** Auto-advance between exercises */
  autoAdvance: boolean;
  /** Auto-start rest timers */
  autoStartRest: boolean;
  /** Show motivational messages */
  showMotivation: boolean;
  /** Vibrate on phase changes */
  vibrateOnPhaseChange: boolean;
  /** Keep screen on during session */
  keepScreenOn: boolean;
  /** Use GPS for distance tracking */
  useGPS: boolean;
  /** Save workout photos */
  savePhotos: boolean;
  /** Auto-sync with wearables */
  syncWearables: boolean;
  /** Audio feedback enabled */
  audioEnabled: boolean;
  /** Vibration feedback enabled */
  vibrateEnabled: boolean;
  /** Rest period configurations */
  restPeriods: number[];
}

/**
 * Alias for SessionExecutionSettings for backward compatibility
 */
export type SessionSettings = SessionExecutionSettings;

/**
 * Performance Tracking Settings
 */
export interface PerformanceTrackingSettings {
  /** Track form quality */
  trackFormQuality: boolean;
  /** Track perceived exertion */
  trackPerceivedExertion: boolean;
  /** Track rest times automatically */
  autoTrackRest: boolean;
  /** Enable personal record detection */
  detectPersonalRecords: boolean;
  /** Calculate 1RM estimates */
  calculate1RM: boolean;
  /** Track workout density */
  trackDensity: boolean;
}

// ================================
// Integration Types
// ================================

/**
 * Wearable Device Integration
 */
export interface WearableIntegration {
  /** Device type */
  deviceType: 'watch' | 'band' | 'chest_strap' | 'other';
  /** Device name/model */
  deviceName: string;
  /** Connection status */
  connected: boolean;
  /** Battery level */
  batteryLevel?: number;
  /** Supported metrics */
  supportedMetrics: WearableMetric[];
  /** Current readings */
  currentReadings: WearableReading[];
}

/**
 * Wearable Metrics
 */
export type WearableMetric =
  | 'heart_rate'
  | 'steps'
  | 'calories'
  | 'distance'
  | 'pace'
  | 'power'
  | 'cadence';

/**
 * Wearable Reading
 */
export interface WearableReading {
  /** Metric type */
  metric: WearableMetric;
  /** Current value */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Reading timestamp */
  timestamp: Date;
  /** Data quality/confidence */
  quality: number;
}

// ================================
// Export Session Data Types
// ================================

/**
 * Session Export Format
 */
export interface SessionExportData {
  /** Session metadata */
  session: SessionExecution;
  /** Exercise performance data */
  exercises: ExecutingExercise[];
  /** Timer history */
  timerHistory: TimerHistoryEntry[];
  /** Performance metrics */
  metrics: SessionPerformance;
  /** Export settings */
  exportSettings: ExportSettings;
  /** Export timestamp */
  exportedAt: Date;
}

/**
 * Timer History Entry
 */
export interface TimerHistoryEntry {
  /** Timestamp */
  timestamp: Date;
  /** Timer phase */
  phase: TimerPhase;
  /** Phase duration */
  duration: number;
  /** Round/set number */
  round: number;
  /** Exercise context */
  exerciseId?: string;
}

/**
 * Export Settings
 */
export interface ExportSettings {
  /** Include timer data */
  includeTimer: boolean;
  /** Include performance metrics */
  includeMetrics: boolean;
  /** Include notes */
  includeNotes: boolean;
  /** Include photos */
  includePhotos: boolean;
  /** Export format */
  format: 'json' | 'csv' | 'pdf';
  /** Compression enabled */
  compress: boolean;
}

// ================================
// Type Guards and Utilities
// ================================

/**
 * Type guard for timer protocols
 */
export const isTimerProtocol = (value: string): value is TimerProtocol => {
  return ['tabata', 'emom', 'amrap', 'strength', 'custom'].includes(value);
};

/**
 * Type guard for timer phases
 */
export const isTimerPhase = (value: string): value is TimerPhase => {
  return [
    'ready',
    'work',
    'rest',
    'set_break',
    'transition',
    'completed',
    'paused',
    'stopped',
  ].includes(value);
};

/**
 * Type guard for session execution status
 */
export const isSessionExecutionStatus = (
  value: string
): value is SessionExecutionStatus => {
  return [
    'preparing',
    'ready',
    'active',
    'resting',
    'transitioning',
    'paused',
    'completed',
    'stopped',
  ].includes(value);
};
