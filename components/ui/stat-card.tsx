/**
 * Reusable Stat Card Component
 * Provides consistent stat display UI across the application
 */
import { LucideIcon } from 'lucide-react';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';
import { cn } from '@/lib/utils';

interface StatCardProps {
  /**
   * Title/label for the statistic
   */
  title?: string;
  label?: string;
  /**
   * Main value to display
   */
  value: string | number;
  /**
   * Icon component for the stat
   */
  icon: LucideIcon;
  /**
   * Background color class for icon
   */
  iconBg?: string;
  /**
   * Icon color - can be a string (blue, green, etc.) or full class
   */
  iconColor?: string;
  /**
   * Optional subtitle/description
   */
  subtitle?: string;
  /**
   * Optional trend indicator
   */
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Error state
   */
  error?: string;
  /**
   * Retry function for errors
   */
  onRetry?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Card size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'p-4',
  md: 'p-6', 
  lg: 'p-8',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const colorMap = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
};

export function StatCard({
  title,
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor = 'blue',
  subtitle,
  trend,
  isLoading = false,
  error,
  onRetry,
  className,
  size = 'md',
}: StatCardProps) {
  const displayTitle = title || label;
  
  // Handle color mapping
  const colorClasses = colorMap[iconColor as keyof typeof colorMap] || colorMap.blue;
  const finalIconBg = iconBg || colorClasses.bg;
  const finalIconColor = iconColor.includes('text-') ? iconColor : colorClasses.text;
  if (error) {
    return (
      <div className={cn(
        'rounded-xl border border-gray-200 bg-white',
        sizeClasses[size],
        className
      )}>
        <ErrorState
          message="Failed to load"
          description={error}
          onRetry={onRetry}
          variant="centered"
        />
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border border-gray-200 bg-white',
      sizeClasses[size],
      className
    )}>
      <div className="flex items-center gap-4">
        <div className={cn('rounded-lg p-3', finalIconBg)}>
          <Icon className={cn(iconSizeClasses[size], finalIconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600 truncate">
            {displayTitle}
          </p>
          
          {isLoading ? (
            <LoadingState 
              message="" 
              size="sm" 
              variant="inline"
              className="mt-1"
            />
          ) : (
            <>
              <p className={cn(
                'font-bold text-gray-900',
                size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'
              )}>
                {value}
              </p>
              
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">
                  {subtitle}
                </p>
              )}
              
              {trend && (
                <div className={cn(
                  'flex items-center gap-1 mt-1 text-xs',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}>
                  <span className={cn(
                    'inline-block w-2 h-2 rounded-full',
                    trend.isPositive ? 'bg-green-600' : 'bg-red-600'
                  )} />
                  <span>
                    {trend.value > 0 ? '+' : ''}{trend.value}%
                    {trend.label && ` ${trend.label}`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}