/**
 * Reusable Loading State Component
 * Provides consistent loading UI across the application
 */
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  /**
   * Loading message to display
   */
  message?: string;
  /**
   * Size variant for the loader
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Layout variant
   */
  variant?: 'inline' | 'centered' | 'card' | 'page' | 'grid';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Custom icon component
   */
  icon?: React.ComponentType<{ className?: string }>;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
};

const variantClasses = {
  inline: 'inline-flex items-center gap-2',
  centered: 'flex flex-col items-center justify-center py-8',
  card: 'flex flex-col items-center justify-center py-12 px-6',
  page: 'flex flex-col items-center justify-center min-h-[50vh] py-12',
  grid: 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
};

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md', 
  variant = 'inline',
  className,
  icon: Icon = Loader2
}: LoadingStateProps) {
  return (
    <div className={cn(variantClasses[variant], className)}>
      <Icon className={cn(sizeClasses[size], 'animate-spin text-gray-400')} />
      {message && (
        <span className={cn(
          'text-gray-500',
          variant === 'inline' ? 'text-sm' : 'text-base mt-2'
        )}>
          {message}
        </span>
      )}
    </div>
  );
}