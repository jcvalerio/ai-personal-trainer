/**
 * Touch Button Component
 * Mobile-optimized button with proper touch targets and haptic feedback
 */
'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/components/ui/button';

interface TouchButtonProps extends ButtonProps {
  /** Enable haptic feedback on press */
  hapticFeedback?: boolean;
  /** Haptic feedback type */
  hapticType?: 'tap' | 'success' | 'error' | 'warning' | 'hold';
  /** Minimum touch target size (default: 44px) */
  minTouchSize?: number;
  /** Additional touch area around the button */
  touchPadding?: number;
}

const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(({
  children,
  className,
  hapticFeedback = true,
  hapticType = 'tap',
  minTouchSize = 44,
  touchPadding = 8,
  onClick,
  disabled,
  ...props
}, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { vibrateTap, vibrateSuccess, vibrateError, vibrateWarning, vibrateHold } = useHapticFeedback();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Trigger haptic feedback
    if (hapticFeedback) {
      switch (hapticType) {
        case 'success':
          vibrateSuccess();
          break;
        case 'error':
          vibrateError();
          break;
        case 'warning':
          vibrateWarning();
          break;
        case 'hold':
          vibrateHold();
          break;
        default:
          vibrateTap();
      }
    }

    // Call original onClick handler
    onClick?.(event);
  };

  return (
    <Button
      ref={ref || buttonRef}
      className={cn(
        // Ensure minimum touch target size
        `min-h-[${minTouchSize}px] min-w-[${minTouchSize}px]`,
        // Add touch padding
        touchPadding > 0 && `p-${touchPadding}`,
        // Touch-friendly styling
        'touch-manipulation',
        'select-none',
        // Active state for better mobile feedback
        'active:scale-95',
        'transition-transform duration-75',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
});

TouchButton.displayName = 'TouchButton';

export { TouchButton };
export type { TouchButtonProps };