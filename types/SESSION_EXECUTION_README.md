# Session Execution & Timer System Types

Comprehensive TypeScript type definitions for real-time workout session execution with integrated timer functionality.

## 📋 Overview

This type system provides complete type safety for:

- **Timer System**: Tabata, EMOM, AMRAP, Strength, and Custom timers
- **Session Execution**: Real-time workout tracking and progression
- **User Interface**: Touch interactions, accessibility, and responsive design
- **State Management**: Context API and useReducer integration
- **Offline Capability**: Local storage and synchronization

## 🏗️ Architecture

### Core Type Categories

```typescript
// Timer System Types
(TimerProtocol, TimerPhase, TimerState, TimerConfig);
(AudioFeedbackConfig, HapticFeedbackConfig);

// Session Execution Types
(SessionExecutionStatus, SessionExecution, ExecutingExercise);
(LiveSet, SessionProgress, SessionPerformance);

// User Interface Types
(InteractionMode, TouchInteractionState, QuickActionConfig);
(AccessibilityState, ResponsiveConfig);

// State Management Types
(SessionAction, SessionContextState, SessionEventHandlers);
(OfflineState, SyncEvent);
```

## 🎯 Key Features

### Timer Protocol Support

```typescript
type TimerProtocol = 'tabata' | 'emom' | 'amrap' | 'strength' | 'custom';

// Tabata: 40s work, 10s rest, 8 rounds
interface TabataConfig {
  workSeconds: 40;
  restSeconds: 10;
  rounds: 8;
  setBreakSeconds: 60;
  sets: 1;
  autoAdvance: true;
}
```

### Real-Time Session Tracking

```typescript
interface SessionExecution {
  sessionId: string;
  status: SessionExecutionStatus;
  currentExercise?: ExecutingExercise;
  currentSet: number;
  timerState: TimerState;
  progress: SessionProgress;
  performance: SessionPerformance;
  // ... additional properties
}
```

### Audio & Haptic Feedback

```typescript
interface AudioFeedbackConfig {
  enabled: boolean;
  volume: number;
  events: Record<AudioEventType, AudioEventConfig>;
  useTTS: boolean;
  ttsConfig?: TTSConfig;
}

interface HapticFeedbackConfig {
  enabled: boolean;
  events: Record<AudioEventType, HapticEventConfig>;
}
```

## 🚀 Usage Examples

### Basic Timer Configuration

```typescript
import { TimerConfig, TabataConfig } from './session-execution';

const tabataTimer: TimerConfig = {
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
    },
    useTTS: true,
  },
  hapticConfig: {
    enabled: true,
    events: {
      phase_start: {
        enabled: true,
        pattern: 'heavy',
      },
    },
  },
};
```

### React Component Integration

```typescript
interface TimerDisplayProps {
  timerState: TimerState;
  config: TimerConfig;
  size: 'small' | 'medium' | 'large';
  colorScheme: 'light' | 'dark' | 'auto';
  showProgress: boolean;
  onClick?: () => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timerState,
  config,
  size,
  colorScheme,
  showProgress,
  onClick,
}) => {
  // Component implementation
};
```

### State Management with useReducer

```typescript
import { SessionAction, SessionExecution } from './session-execution';

const sessionReducer = (
  state: SessionExecution,
  action: SessionAction
): SessionExecution => {
  switch (action.type) {
    case 'START_SESSION':
      return { ...state, status: 'active' };

    case 'UPDATE_TIMER':
      return {
        ...state,
        timerState: { ...state.timerState, ...action.payload },
      };

    case 'COMPLETE_SET':
      // Handle set completion logic
      return state;

    default:
      return state;
  }
};
```

### Event Handlers

```typescript
import { TimerEventHandlers, SessionEventHandlers } from './session-execution';

const timerHandlers: TimerEventHandlers = {
  onPhaseChange: (newPhase, state) => {
    console.log(`Phase changed to ${newPhase}`);
    // Update UI, play sounds, vibrate
  },

  onTimerTick: (state) => {
    // Update display every second
  },

  onWarning: (secondsRemaining) => {
    if (secondsRemaining === 3) {
      // Show 3-second warning
    }
  },
};

const sessionHandlers: SessionEventHandlers = {
  onSetComplete: (set, exercise) => {
    // Save performance data
    // Update progress
    // Provide feedback
  },

  onPersonalRecord: (record) => {
    // Celebrate achievement
    // Save to database
  },
};
```

## 🎨 UI Component Props

### Timer Display Component

```typescript
interface TimerDisplayProps {
  timerState: TimerState;
  config: TimerConfig;
  size: 'small' | 'medium' | 'large';
  colorScheme: 'light' | 'dark' | 'auto';
  showProgress: boolean;
  showLabels: boolean;
  animated: boolean;
  onClick?: () => void;
  className?: string;
}
```

### Exercise Progress Component

```typescript
interface ExerciseProgressProps {
  exercise: ExecutingExercise;
  progress: SessionProgress;
  showMetrics: boolean;
  compact: boolean;
  editable: boolean;
  onSetComplete?: (setIndex: number, data: SetPerformanceData) => void;
  onWeightChange?: (weight: number) => void;
  onRepsChange?: (reps: number) => void;
}
```

### Session Controls Component

```typescript
interface SessionControlsProps {
  session: SessionExecution;
  layout: 'minimal' | 'standard' | 'full';
  oneHanded: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onNext?: () => void;
  onCompleteSet?: () => void;
  customActions?: QuickActionConfig[];
}
```

## 📱 Mobile & Accessibility Features

### One-Handed Operation

```typescript
interface SessionInteraction {
  inputMode: InteractionMode;
  oneHandedMode: boolean;
  touchState: TouchInteractionState;
  quickActions: QuickActionConfig[];
  accessibility: AccessibilityState;
}
```

### Touch Interactions

```typescript
interface TouchInteractionState {
  swipeEnabled: boolean;
  swipeSensitivity: number;
  touchFeedback: boolean;
  largeTouchTargets: boolean;
  preventAccidental: boolean;
}
```

### Accessibility Support

```typescript
interface AccessibilityState {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  reduceMotion: boolean;
  voiceAnnouncements: boolean;
  simplifiedUI: boolean;
  colorBlindSupport: boolean;
}
```

## 🔄 Offline & Synchronization

### Offline State Management

```typescript
interface OfflineState {
  isOffline: boolean;
  isDirty: boolean;
  lastSync?: Date;
  pendingSync: PendingSyncOperation[];
  hasConflicts: boolean;
  storageInfo: StorageInfo;
}
```

### Sync Operations

```typescript
interface PendingSyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'session' | 'exercise' | 'set' | 'performance';
  data: any;
  timestamp: Date;
  retryCount: number;
  priority: number;
}
```

## 🎯 Performance Tracking

### Live Metrics

```typescript
interface LiveMetrics {
  totalReps: number;
  totalVolume: number;
  avgRestTime: number;
  exerciseDuration: number;
  exertionTrend: number[];
  formConsistency: number;
}
```

### Personal Records

```typescript
interface PersonalRecord {
  type: 'weight' | 'reps' | 'volume' | 'duration';
  exerciseId: string;
  exerciseName: string;
  newValue: number;
  previousValue: number;
  unit: string;
  achievedAt: Date;
}
```

## 📊 Responsive Design

### Breakpoint System

```typescript
type ResponsiveBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ResponsiveConfig {
  currentBreakpoint: ResponsiveBreakpoint;
  screenSize: ScreenSize;
  orientation: 'portrait' | 'landscape';
  deviceType: DeviceType;
}
```

### Device Detection

```typescript
type DeviceType = 'phone' | 'tablet' | 'desktop' | 'tv' | 'watch' | 'unknown';
```

## 🛡️ Type Safety Features

### Type Guards

```typescript
export const isTimerProtocol = (value: string): value is TimerProtocol => {
  return ['tabata', 'emom', 'amrap', 'strength', 'custom'].includes(value);
};

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
```

### Strict Null Checking

All interfaces are designed with strict null checking in mind:

- Optional properties use `?` operator
- Required properties are explicitly typed
- Union types for state management

## 🔧 Integration with Existing Types

### Extends Existing Workout Types

```typescript
// Extends existing SessionExercise from workouts.ts
export interface ExecutingExercise extends SessionExercise {
  liveSets: LiveSet[];
  currentSetIndex: number;
  timerConfig?: TimerConfig;
  startedAt: Date;
  completedAt?: Date;
  liveMetrics: LiveMetrics;
}
```

### Compatible with Form State

```typescript
// Works with existing form management
import { SetPerformanceData } from './workouts';

interface LiveSet extends SetPerformanceData {
  startedAt: Date;
  completedAt?: Date;
  liveReps: number;
  isActive: boolean;
  isCompleted: boolean;
}
```

## 📁 File Structure

```
types/
├── session-execution.ts          # Main type definitions
├── session-execution-examples.ts # Usage examples
├── workouts.ts                   # Extended with timer support
└── SESSION_EXECUTION_README.md   # This documentation
```

## 🚀 Next Steps

### React Components to Build

1. **TimerDisplay** - Main timer interface
2. **ExerciseProgress** - Exercise tracking
3. **SessionControls** - Play/pause/stop controls
4. **QuickActions** - One-handed operation buttons
5. **SessionStats** - Live performance metrics

### Hooks to Implement

1. **useSessionExecution** - Main session state management
2. **useTimer** - Timer-specific functionality
3. **usePerformanceTracking** - Metrics and records
4. **useOfflineSync** - Offline capability
5. **useAccessibility** - Accessibility features

### Context Providers

1. **SessionExecutionProvider** - Global session state
2. **TimerProvider** - Timer configuration and state
3. **PerformanceProvider** - Performance tracking
4. **OfflineProvider** - Offline/sync management

## 💡 Best Practices

### Performance Considerations

- Use `React.memo()` for timer display components
- Debounce timer tick updates
- Implement virtual scrolling for long exercise lists
- Use `useCallback()` for event handlers

### Accessibility Guidelines

- Implement proper ARIA labels
- Support keyboard navigation
- Provide audio cues for timer phases
- Support high contrast mode
- Enable voice announcements

### Offline-First Design

- Cache all session data locally
- Implement optimistic updates
- Handle conflict resolution gracefully
- Provide clear sync status indicators

## 📖 References

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for audio feedback
- [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) for haptic feedback
- [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) for keeping screen on
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for text-to-speech
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) for scroll detection
