/**
 * Reusable Empty State Component
 * Provides consistent empty state UI across the application
 */
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /**
   * Icon component for the empty state
   */
  icon: LucideIcon;
  /**
   * Main title for the empty state
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Action button configuration
   */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /**
   * Layout variant
   */
  variant?: 'centered' | 'card';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const variantClasses = {
  centered: 'flex flex-col items-center justify-center py-8',
  card: 'flex flex-col items-center justify-center py-12 px-6 rounded-lg bg-gray-50',
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'centered',
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(variantClasses[variant], className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 text-center mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          {...(action.href ? { asChild: true } : {})}
        >
          {action.href ? (
            <a href={action.href}>{action.label}</a>
          ) : (
            action.label
          )}
        </Button>
      )}
    </div>
  );
}