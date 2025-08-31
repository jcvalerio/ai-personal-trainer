/**
 * Reusable Error State Component
 * Provides consistent error UI across the application
 */
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  /**
   * Error message to display
   */
  message: string;
  /**
   * Optional detailed error description
   */
  description?: string;
  /**
   * Retry function to call when retry button is clicked
   */
  onRetry?: () => void;
  /**
   * Layout variant
   */
  variant?: 'inline' | 'centered' | 'card';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Custom icon component
   */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Whether to show retry button
   */
  showRetry?: boolean;
}

const variantClasses = {
  inline: 'flex items-start gap-3 p-4 rounded-lg bg-red-50',
  centered: 'flex flex-col items-center justify-center py-8',
  card: 'flex flex-col items-center justify-center py-12 px-6 rounded-lg bg-red-50',
};

export function ErrorState({
  message,
  description,
  onRetry,
  variant = 'inline',
  className,
  icon: Icon = AlertTriangle,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <div className={cn(variantClasses[variant], className)}>
      <div className={cn(
        'flex flex-col items-center gap-2',
        variant === 'inline' && 'flex-row items-start gap-3'
      )}>
        <div className={cn(
          'rounded-full p-2',
          variant === 'inline' ? 'bg-red-100 flex-shrink-0' : 'bg-red-100 mb-2'
        )}>
          <Icon className="h-5 w-5 text-red-600" />
        </div>
        
        <div className={cn(
          'text-center',
          variant === 'inline' && 'text-left flex-1'
        )}>
          <p className="font-medium text-red-600 mb-1">
            {message}
          </p>
          {description && (
            <p className="text-sm text-red-500">
              {description}
            </p>
          )}
          
          {showRetry && onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className={cn(
                'text-red-600 border-red-200 hover:bg-red-50',
                variant === 'inline' ? 'mt-2' : 'mt-4'
              )}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}