/**
 * Input component with consistent styling
 * Used for form inputs throughout the application
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Enable mobile-friendly font size (16px) to prevent zoom on iOS */
  mobileOptimized?: boolean;
  /** Input variant for different use cases */
  variant?: 'default' | 'search' | 'numeric' | 'touch';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, mobileOptimized = true, variant = 'default', ...props }, ref) => {
    // Mobile-optimized attributes to prevent zoom and improve UX
    const mobileAttributes = mobileOptimized ? {
      // Prevent iOS zoom by using 16px font size
      style: { fontSize: '16px', ...props.style },
      // Optimize for touch input
      autoCapitalize: type === 'email' ? 'none' : props.autoCapitalize,
      autoCorrect: type === 'email' || type === 'password' ? 'off' : props.autoCorrect,
      spellCheck: type === 'email' || type === 'password' ? false : props.spellCheck,
    } : {};
    
    // Input mode optimization for better mobile keyboards
    const getInputMode = () => {
      if (props.inputMode) return props.inputMode;
      
      switch (type) {
        case 'email': return 'email';
        case 'tel': return 'tel';
        case 'url': return 'url';
        case 'number': return 'numeric';
        case 'search': return 'search';
        default: return 'text';
      }
    };
    
    return (
      <input
        type={type}
        inputMode={getInputMode()}
        className={cn(
          // Base styles
          'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 ring-offset-white',
          'file:border-0 file:bg-transparent file:font-medium placeholder:text-gray-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          
          // Variant-specific styles
          variant === 'default' && 'h-10 text-sm file:text-sm',
          variant === 'touch' && 'h-12 text-base file:text-base', // Larger for better touch targets
          variant === 'search' && 'h-10 text-sm file:text-sm pl-10', // Space for search icon
          variant === 'numeric' && 'h-10 text-sm file:text-sm text-right font-mono', // Right-aligned for numbers
          
          // Mobile optimizations
          mobileOptimized && [
            'touch-manipulation', // Improve touch responsiveness
            'max-sm:h-12 max-sm:text-base', // Larger on small screens
          ],
          
          className
        )}
        ref={ref}
        {...mobileAttributes}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// Touch-optimized input for mobile use
const TouchInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => (
    <Input {...props} variant="touch" mobileOptimized={true} ref={ref} />
  )
);
TouchInput.displayName = 'TouchInput';

// Search input with proper mobile keyboard
const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => (
    <Input {...props} type="search" variant="search" mobileOptimized={true} ref={ref} />
  )
);
SearchInput.displayName = 'SearchInput';

// Numeric input with proper mobile keyboard
const NumericInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => (
    <Input {...props} type="number" variant="numeric" mobileOptimized={true} ref={ref} />
  )
);
NumericInput.displayName = 'NumericInput';

export { Input, TouchInput, SearchInput, NumericInput };
