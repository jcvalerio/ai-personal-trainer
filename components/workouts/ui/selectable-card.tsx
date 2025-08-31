'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type SelectableCardProps = {
  selected?: boolean;
  onClick?: () => void;
  onSelect?: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  metadata?: (string | undefined)[];
  align?: 'left' | 'center';
  className?: string;
};

export function SelectableCard({
  selected,
  onClick,
  onSelect,
  title,
  description,
  icon,
  badge,
  metadata,
  align = 'left',
  className,
}: SelectableCardProps) {
  const handleClick = () => {
    onClick?.();
    onSelect?.();
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      className={cn(
        'rounded-lg border p-4 sm:p-4 transition-colors min-h-[60px] touch-manipulation',
        align === 'left' ? 'text-left' : 'text-center',
        selected
          ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-200'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
        className
      )}
    >
      <div className={cn('flex gap-3', align === 'center' ? 'flex-col items-center justify-center' : 'items-start justify-between')}>
        <div className={cn('flex gap-3 flex-1', align === 'center' ? 'flex-col items-center' : 'items-start')}>
          {icon && (
            <div className={cn('flex-shrink-0', align === 'center' ? 'text-2xl order-first' : '')}>
              {icon}
            </div>
          )}
          <div className={cn('flex-1', align === 'center' ? 'text-center' : 'min-w-0')}>
            <div className='flex items-center gap-2 mb-1'>
              <div className={cn('font-medium leading-tight text-base sm:text-sm', align === 'center' ? 'text-center' : '')}>
                {title}
              </div>
              {badge && (
                <Badge variant={badge.variant || 'outline'} className='text-xs'>
                  {badge.text}
                </Badge>
              )}
            </div>
            {description && (
              <div className={cn('text-sm text-gray-600 mb-2 sm:text-xs', align === 'center' ? 'text-center' : '')}>
                {description}
              </div>
            )}
            {metadata && metadata.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {metadata.map((item, index) => (
                  item && (
                    <span key={index} className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                      {item}
                    </span>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
