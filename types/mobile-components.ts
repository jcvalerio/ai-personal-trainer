/**
 * TypeScript interfaces for mobile-optimized components
 * Ensures type safety across mobile UI components
 */

// Mobile Dialog Component Types
export interface MobileDialogProps {
  /** Enable mobile-first responsive layout */
  mobileMode?: 'fullscreen' | 'bottomSheet' | 'responsive';
  /** Additional CSS classes */
  className?: string;
  /** Dialog content */
  children?: React.ReactNode;
}

// Mobile Input Component Types
export interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Enable mobile-friendly font size (16px) to prevent zoom on iOS */
  mobileOptimized?: boolean;
  /** Input variant for different use cases */
  variant?: 'default' | 'search' | 'numeric' | 'touch';
}

// Touch Target Standards (WCAG AA compliance)
export interface TouchTargetSpecs {
  /** Minimum touch target size in pixels (44x44 per WCAG AA) */
  minSize: 44;
  /** Recommended touch target size for better UX */
  recommendedSize: 48;
  /** Minimum spacing between touch targets */
  minSpacing: 8;
  /** Recommended spacing between touch targets */
  recommendedSpacing: 16;
}

// Mobile Viewport Breakpoints
export interface MobileBreakpoints {
  /** Small mobile devices (iPhone SE) */
  sm: 375;
  /** Standard mobile devices (iPhone 12/13) */
  md: 390;
  /** Large mobile devices (iPhone 14 Pro Max) */
  lg: 430;
  /** Tablet portrait */
  tablet: 768;
  /** Desktop */
  desktop: 1024;
}

// PWA Input Optimization
export interface PWAInputOptimization {
  /** Font size to prevent iOS zoom (16px minimum) */
  fontSize: '16px';
  /** Input mode for better mobile keyboards */
  inputMode: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
  /** Auto-capitalize behavior */
  autoCapitalize: 'none' | 'sentences' | 'words' | 'characters';
  /** Auto-correct behavior */
  autoCorrect: 'on' | 'off';
  /** Spell check behavior */
  spellCheck: boolean;
}

// Mobile Session Editor Types
export interface MobileSessionData {
  id: string;
  name: string;
  type: SessionType;
  duration: number;
  scheduledDays: string[];
  templateId?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SessionType = 'workout' | 'cardio' | 'strength' | 'hiit' | 'recovery' | 'rest';

export interface SessionTypeConfig {
  value: SessionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultDuration: number;
  description?: string;
}

// Day Selector Types
export interface DayOfWeek {
  key: string;
  label: string;
  shortLabel: string;
  index: number; // 0-6 for Monday-Sunday
}

export interface DaySelectionProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
  multiple?: boolean;
  maxSelections?: number;
  disabled?: boolean;
  className?: string;
}

// Mobile Schedule Types
export interface MobileScheduleConfig {
  /** Maximum sessions allowed per day */
  maxSessionsPerDay: number;
  /** Minimum rest days per week */
  minRestDays: number;
  /** Maximum total duration per day (minutes) */
  maxDurationPerDay: number;
  /** Default session duration (minutes) */
  defaultSessionDuration: number;
  /** Enable schedule validation */
  enableValidation: boolean;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions?: string[];
}

export interface ValidationError {
  type: 'max_sessions' | 'min_rest' | 'max_duration' | 'scheduling_conflict';
  message: string;
  day?: string;
  sessionId?: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: 'long_day' | 'consecutive_days' | 'unbalanced_schedule';
  message: string;
  suggestion?: string;
  day?: string;
}

// Mobile UI Component States
export interface MobileComponentState {
  isLoading: boolean;
  error: string | null;
  isValidating: boolean;
  hasUnsavedChanges: boolean;
  isOnline: boolean; // For PWA offline detection
}

// Touch Gesture Types
export interface TouchGestureConfig {
  /** Enable swipe gestures */
  enableSwipe: boolean;
  /** Enable long press gestures */
  enableLongPress: boolean;
  /** Long press duration (ms) */
  longPressDuration: number;
  /** Swipe threshold (pixels) */
  swipeThreshold: number;
  /** Enable haptic feedback */
  enableHaptics: boolean;
}

// Mobile Form Validation
export interface MobileFormValidation {
  /** Field name */
  field: string;
  /** Validation rules */
  rules: ValidationRule[];
  /** Custom error messages */
  messages?: Record<string, string>;
  /** Real-time validation */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: any) => boolean | string;
}

// Accessibility Support
export interface AccessibilityProps {
  /** ARIA label */
  'aria-label'?: string;
  /** ARIA described by */
  'aria-describedby'?: string;
  /** ARIA live region */
  'aria-live'?: 'polite' | 'assertive' | 'off';
  /** Screen reader only text */
  srText?: string;
  /** Focus trap for modals */
  trapFocus?: boolean;
  /** Auto focus element */
  autoFocus?: boolean;
}

// Performance Optimization Types
export interface PerformanceConfig {
  /** Enable lazy loading */
  enableLazyLoading: boolean;
  /** Virtualization threshold */
  virtualizationThreshold: number;
  /** Image optimization */
  optimizeImages: boolean;
  /** Code splitting */
  enableCodeSplitting: boolean;
  /** Service worker caching */
  enableCaching: boolean;
}

// Error Boundary Types
export interface MobileErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorId?: string;
}

// Theme Support for Mobile
export interface MobileTheme {
  /** Primary colors */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  /** Typography scale optimized for mobile */
  typography: {
    baseSize: '16px'; // Prevents iOS zoom
    scale: number[];
    fontFamily: string[];
    lineHeight: number[];
  };
  /** Spacing scale */
  spacing: number[];
  /** Border radius scale */
  borderRadius: number[];
  /** Shadow elevation */
  shadows: string[];
  /** Z-index scale */
  zIndex: Record<string, number>;
}

// Export commonly used utility types
export type MobileSize = 'sm' | 'md' | 'lg' | 'xl';
export type MobileVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
export type MobileOrientation = 'portrait' | 'landscape';
export type MobileDeviceType = 'phone' | 'tablet' | 'desktop';

// Hook return types for consistency
export interface UseMobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: MobileOrientation;
  deviceType: MobileDeviceType;
  screenSize: MobileSize;
  hasTouch: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
}

export interface UseMobileForm<T> {
  values: T;
  errors: Record<keyof T, string | null>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string | null) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  handleSubmit: (onSubmit: (values: T) => void) => (e: React.FormEvent) => void;
  reset: () => void;
}