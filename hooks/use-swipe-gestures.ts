/**
 * Swipe Gestures Hook
 * Provides touch gesture support for mobile interactions in workout sessions
 */
'use client';

import { useCallback, useRef, useEffect } from 'react';

interface SwipeGestureOptions {
  threshold?: number;
  velocity?: number;
  preventScroll?: boolean;
  element?: HTMLElement | null;
}

interface SwipeGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  duration: number;
  velocity: number;
}

interface UseSwipeGesturesReturn {
  touchData: TouchData | null;
  isSwipingX: boolean;
  isSwipingY: boolean;
  resetTouch: () => void;
}

const DEFAULT_OPTIONS: Required<SwipeGestureOptions> = {
  threshold: 50,
  velocity: 0.3,
  preventScroll: false,
  element: null,
};

export function useSwipeGestures(
  handlers: SwipeGestureHandlers = {},
  options: SwipeGestureOptions = {}
): UseSwipeGesturesReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const touchDataRef = useRef<TouchData | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLElement | null>(opts.element);

  const resetTouch = useCallback(() => {
    touchDataRef.current = null;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;

    const startTime = Date.now();
    touchDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      distance: 0,
      duration: 0,
      velocity: 0,
    };

    // Start long press detection
    if (handlers.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        handlers.onLongPress?.();
        resetTouch();
      }, 500); // 500ms for long press
    }

    if (opts.preventScroll) {
      event.preventDefault();
    }
  }, [handlers, opts.preventScroll, resetTouch]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch || !touchDataRef.current) return;

    const currentTime = Date.now();
    const deltaX = touch.clientX - touchDataRef.current.startX;
    const deltaY = touch.clientY - touchDataRef.current.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = currentTime - touchDataRef.current.startTime;
    const velocity = distance / duration;

    touchDataRef.current = {
      ...touchDataRef.current,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      distance,
      duration,
      velocity,
    };

    // Cancel long press if touch moves too much
    if (distance > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Prevent scrolling for horizontal swipes if needed
    if (opts.preventScroll && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
    }
  }, [opts.preventScroll]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!touchDataRef.current) return;

    const { deltaX, deltaY, distance, velocity } = touchDataRef.current;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Determine if this is a swipe or tap
    const isSwipe = distance > opts.threshold && velocity > opts.velocity;
    const isTap = distance < 10 && touchDataRef.current.duration < 200;

    if (isSwipe) {
      // Determine swipe direction
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    } else if (isTap) {
      handlers.onTap?.();
    }

    resetTouch();
  }, [handlers, opts.threshold, opts.velocity, resetTouch]);

  const handleTouchCancel = useCallback(() => {
    resetTouch();
  }, [resetTouch]);

  // Set up event listeners
  useEffect(() => {
    const element = elementRef.current || document.body;
    if (!element) return;

    // Add event listeners with passive: false for preventDefault to work
    const touchStartOptions = { passive: !opts.preventScroll };
    const touchMoveOptions = { passive: !opts.preventScroll };

    element.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    element.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, opts.preventScroll]);

  // Update element ref when options change
  useEffect(() => {
    elementRef.current = opts.element;
  }, [opts.element]);

  return {
    touchData: touchDataRef.current,
    isSwipingX: touchDataRef.current ? Math.abs(touchDataRef.current.deltaX) > Math.abs(touchDataRef.current.deltaY) : false,
    isSwipingY: touchDataRef.current ? Math.abs(touchDataRef.current.deltaY) > Math.abs(touchDataRef.current.deltaX) : false,
    resetTouch,
  };
}

// Specialized hook for workout navigation
export function useWorkoutSwipeNavigation(
  onPrevious?: () => void,
  onNext?: () => void,
  onSwipeDown?: () => void,
  element?: HTMLElement | null
) {
  return useSwipeGestures(
    {
      onSwipeLeft: onNext,
      onSwipeRight: onPrevious,
      onSwipeDown,
    },
    {
      threshold: 75, // Larger threshold for workout navigation
      velocity: 0.4, // Higher velocity requirement
      preventScroll: true, // Prevent accidental scrolling
      element,
    }
  );
}

// Hook for set completion gestures
export function useSetCompletionGestures(
  onCompleteSet?: () => void,
  onSkipSet?: () => void,
  element?: HTMLElement | null
) {
  return useSwipeGestures(
    {
      onSwipeUp: onCompleteSet,
      onSwipeDown: onSkipSet,
      onLongPress: onCompleteSet,
    },
    {
      threshold: 60,
      velocity: 0.3,
      preventScroll: true,
      element,
    }
  );
}