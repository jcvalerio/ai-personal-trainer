# Workout Session UI Components

A comprehensive collection of mobile-first, accessible components designed for workout session execution in the AI Personal Trainer app.

## 🚀 Overview

This UI library provides a complete workout session execution experience with:
- **Mobile-First Design**: Touch-friendly 44px minimum touch targets
- **Accessibility**: WCAG 2.1 AA compliance with screen reader support
- **Real-time Updates**: Seamless integration with session execution context
- **Responsive Layout**: Works across phone, tablet, and desktop
- **Component Reusability**: Modular design for maximum flexibility

## 📦 Components

### Core Session Components

#### `EnhancedSessionInterface`
Complete session execution experience that orchestrates all sub-components.

```typescript
<EnhancedSessionInterface
  onBack={() => router.back()}
  onSessionComplete={() => router.push('/workouts')}
/>
```

#### `SessionProgressHeader`
Mobile-first header with session controls, progress tracking, and stats.

```typescript
<SessionProgressHeader
  status="active"
  title="Morning Workout"
  currentExercise={{
    name: "Push-ups",
    index: 0,
    total: 8
  }}
  overallProgress={0.25}
  timeElapsed={180}
  stats={{
    setsCompleted: 3,
    totalSets: 12,
    exercisesCompleted: 1,
    totalExercises: 8
  }}
  controls={{
    onPlay: resumeSession,
    onPause: pauseSession,
    onStop: completeSession,
    onSettings: () => setShowSettings(true)
  }}
/>
```

#### `ExerciseProgressCard`
Interactive card for tracking exercise progress with input controls.

```typescript
<ExerciseProgressCard
  name="Push-ups"
  description="Standard push-up form"
  currentSet={2}
  totalSets={3}
  targets={{ reps: 15, weight: 0 }}
  completedSets={[
    { setNumber: 1, reps: 15, weight: 0 }
  ]}
  currentInputs={setInputs}
  progress={0.33}
  isActive={true}
  onInputChange={(field, value) => setInputs(prev => ({ ...prev, [field]: value }))}
  onCompleteSet={handleCompleteSet}
  weightUnit="lbs"
/>
```

#### `SessionTimer`
Configurable timer with multiple protocols and accessibility features.

```typescript
<SessionTimer
  duration={90}
  isRunning={true}
  isPaused={false}
  type="rest"
  label="Rest Period"
  size="lg"
  showProgress={true}
  onComplete={() => setIsRestPeriod(false)}
  announceTime={true}
/>
```

#### `SessionNavigation`
Exercise navigation with progress visualization and jump-to functionality.

```typescript
<SessionNavigation
  currentExerciseIndex={2}
  totalExercises={8}
  currentExercise={{
    name: "Squats",
    phase: "main",
    progress: 0.67,
    isCompleted: false
  }}
  canGoPrevious={true}
  canGoNext={true}
  onPrevious={previousExercise}
  onNext={nextExercise}
  exercises={allExercises}
/>
```

### Loading States & Skeletons

#### `SessionLoading`
Configurable loading state with progress indication.

```typescript
<SessionLoading
  message="Loading workout session..."
  showProgress={true}
  progress={45}
  size="lg"
/>
```

#### Skeleton Components
- `SessionHeaderSkeleton`
- `ExerciseCardSkeleton`
- `TimerSkeleton`
- `NavigationSkeleton`
- `SessionSkeleton` (complete session layout)

#### Empty States
- `NoActiveSessionState`
- `SessionCompleteState`
- `SessionErrorState`
- `EmptyState` (generic)

## 🎨 Design System Integration

### Color Variants
All components support consistent theming:
- `default` - Blue primary theme
- `success` - Green for completed states
- `warning` - Yellow for transitions/warnings
- `destructive` - Red for errors/intense activities

### Size Variants
Responsive sizing across components:
- `sm` - Compact mobile layouts
- `md` - Standard mobile/tablet
- `lg` - Large mobile/desktop
- `xl` - Large desktop displays

### Touch Targets
All interactive elements meet WCAG AA requirements:
- Minimum 44px × 44px touch targets
- Proper spacing between interactive elements
- Touch-friendly gesture support

## ♿ Accessibility Features

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and roles
- Live regions for dynamic content
- Descriptive alternative text

### Keyboard Navigation
- Full keyboard accessibility
- Logical tab order
- Keyboard shortcuts for common actions
- Focus management

### Audio Feedback
- Text-to-speech countdown announcements
- Configurable audio cues
- Volume controls
- Silent mode support

### Visual Accessibility
- High contrast mode support
- Large text options
- Motion reduction preferences
- Color-blind friendly palettes

## 📱 Mobile-First Features

### Touch Interactions
- Swipe gestures for navigation
- Long press for context menus
- Pinch-to-zoom for detailed views
- Haptic feedback integration

### Performance
- Lazy loading for heavy components
- Efficient re-rendering
- Optimized animations
- Battery-conscious timers

### Offline Support
- Local state persistence
- Offline-first data handling
- Sync status indicators
- Connection awareness

## 🔧 Technical Implementation

### State Management
Components integrate seamlessly with the existing session execution context:

```typescript
const {
  session,
  currentExercise,
  progress,
  settings,
  pauseSession,
  resumeSession,
  completeSet,
} = useSessionExecution();
```

### TypeScript Support
Full type safety with comprehensive interfaces:

```typescript
interface SessionProgressHeaderProps {
  status: SessionExecutionStatus;
  title: string;
  currentExercise: {
    name: string;
    index: number;
    total: number;
  };
  // ... more props
}
```

### Performance Optimizations
- React.memo for expensive renders
- useCallback for stable references  
- Virtualization for long lists
- Debounced inputs for real-time updates

## 🚦 Usage Examples

### Basic Session Setup
```typescript
import { EnhancedSessionInterface } from '@/components/workouts/ui';

export default function SessionPage() {
  return (
    <SessionExecutionProvider>
      <EnhancedSessionInterface
        onBack={() => router.back()}
        onSessionComplete={() => router.push('/results')}
      />
    </SessionExecutionProvider>
  );
}
```

### Custom Timer Implementation
```typescript
import { SessionTimer } from '@/components/workouts/ui';

function CustomRestTimer() {
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [isActive, setIsActive] = useState(false);

  return (
    <SessionTimer
      duration={90}
      isRunning={isActive}
      isPaused={false}
      type="rest"
      label="Rest Between Sets"
      size="md"
      variant="success"
      onStart={() => setIsActive(true)}
      onComplete={() => {
        setIsActive(false);
        // Move to next set
      }}
    />
  );
}
```

### Loading States
```typescript
import { SessionSkeleton, SessionLoading } from '@/components/workouts/ui';

function SessionWrapper() {
  const { session, isLoading, error } = useSession();

  if (isLoading) {
    return <SessionLoading message="Preparing workout..." />;
  }

  if (error) {
    return <SessionErrorState error={error} onRetry={refetch} />;
  }

  if (!session) {
    return <NoActiveSessionState onStartSession={startSession} />;
  }

  return <EnhancedSessionInterface />;
}
```

## 🧪 Testing Considerations

### Accessibility Testing
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation testing
- Color contrast validation
- Focus management verification

### Mobile Testing
- Touch target size validation
- Gesture interaction testing
- Performance on low-end devices
- Battery usage monitoring

### Integration Testing
- Session state transitions
- Timer accuracy and reliability
- Data persistence during interruptions
- Offline/online synchronization

## 🔄 Future Enhancements

### Planned Features
- Advanced workout analytics visualization
- Social sharing integration
- Video exercise demonstrations
- Wearable device synchronization
- AI coaching suggestions
- Advanced accessibility features

### Performance Improvements
- Virtual scrolling for exercise lists
- Progressive image loading
- Service worker caching
- Bundle size optimization

This component library provides a solid foundation for workout session execution while maintaining flexibility for future enhancements and customizations.