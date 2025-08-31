/**
 * Haptic Feedback Hook
 * Provides vibration feedback for mobile devices with fallback support
 */
'use client';

import { useCallback, useRef, useEffect } from 'react';

interface HapticFeedbackOptions {
  enabled?: boolean;
  duration?: number;
  intensity?: 'light' | 'medium' | 'heavy';
}

interface UseHapticFeedbackReturn {
  vibrate: (pattern?: number | number[]) => void;
  vibrateSuccess: () => void;
  vibrateError: () => void;
  vibrateWarning: () => void;
  vibrateTap: () => void;
  vibrateHold: () => void;
  isSupported: boolean;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

// Predefined vibration patterns
const VIBRATION_PATTERNS = {
  tap: [10],
  success: [100, 50, 100],
  error: [200, 100, 200, 100, 200],
  warning: [150, 75, 150],
  hold: [50],
  setComplete: [100, 50, 50, 50, 100],
  restTimer: [200],
  exerciseComplete: [100, 50, 100, 50, 200],
} as const;

export function useHapticFeedback(options: HapticFeedbackOptions = {}): UseHapticFeedbackReturn {
  const enabledRef = useRef(options.enabled ?? true);
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  // Check if vibration is available and permissions
  useEffect(() => {
    if (!isSupported) return;

    // Test if vibration actually works (some browsers report support but don't vibrate)
    try {
      navigator.vibrate?.(0); // Cancel any existing vibration
    } catch (error) {
      console.warn('Vibration API not fully supported:', error);
    }
  }, [isSupported]);

  const vibrate = useCallback((pattern: number | number[] = [50]) => {
    if (!isSupported || !enabledRef.current) return;

    try {
      // Ensure pattern is within reasonable bounds
      const normalizedPattern = Array.isArray(pattern) 
        ? pattern.map(duration => Math.min(Math.max(duration, 10), 1000))
        : Math.min(Math.max(pattern, 10), 1000);

      navigator.vibrate?.(normalizedPattern);
    } catch (error) {
      console.warn('Failed to trigger vibration:', error);
    }
  }, [isSupported]);

  const vibrateSuccess = useCallback(() => {
    vibrate(VIBRATION_PATTERNS.success);
  }, [vibrate]);

  const vibrateError = useCallback(() => {
    vibrate(VIBRATION_PATTERNS.error);
  }, [vibrate]);

  const vibrateWarning = useCallback(() => {
    vibrate(VIBRATION_PATTERNS.warning);
  }, [vibrate]);

  const vibrateTap = useCallback(() => {
    vibrate(VIBRATION_PATTERNS.tap);
  }, [vibrate]);

  const vibrateHold = useCallback(() => {
    vibrate(VIBRATION_PATTERNS.hold);
  }, [vibrate]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    
    // Cancel any ongoing vibration when disabled
    if (!enabled && isSupported) {
      try {
        navigator.vibrate?.(0);
      } catch (error) {
        console.warn('Failed to cancel vibration:', error);
      }
    }
  }, [isSupported]);

  return {
    vibrate,
    vibrateSuccess,
    vibrateError,
    vibrateWarning,
    vibrateTap,
    vibrateHold,
    isSupported,
    isEnabled: enabledRef.current,
    setEnabled,
  };
}

// Specialized hooks for specific contexts
export function useWorkoutHaptics(enabled = true) {
  const haptic = useHapticFeedback({ enabled });

  return {
    ...haptic,
    vibrateSetComplete: useCallback(() => {
      haptic.vibrate(VIBRATION_PATTERNS.setComplete);
    }, [haptic.vibrate]),
    
    vibrateRestTimer: useCallback(() => {
      haptic.vibrate(VIBRATION_PATTERNS.restTimer);
    }, [haptic.vibrate]),
    
    vibrateExerciseComplete: useCallback(() => {
      haptic.vibrate(VIBRATION_PATTERNS.exerciseComplete);
    }, [haptic.vibrate]),
  };
}