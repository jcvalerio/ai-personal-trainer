'use client';

import { cn } from '@/lib/utils';

type LimitationOption = {
  id: string;
  label: string;
  icon?: string | React.ReactNode;
};

type LimitationsSelectorProps = {
  selected: string[];
  onToggle: (id: string) => void;
  options: LimitationOption[];
  className?: string;
};

export function LimitationsSelector({
  selected,
  onToggle,
  options,
  className,
}: LimitationsSelectorProps) {
  return (
    <div className={className}>
      <div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
        {options.map((opt) => (
          <button
            key={opt.id}
            type='button'
            onClick={() => onToggle(opt.id)}
            className={cn(
              'rounded-lg border p-2 text-center text-sm transition-colors',
              selected.includes(opt.id)
                ? 'border-orange-500 bg-orange-50 text-orange-900'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <span className='inline-flex items-center gap-1'>
              {opt.icon ? (
                typeof opt.icon === 'string' ? (
                  <span>{opt.icon}</span>
                ) : (
                  opt.icon
                )
              ) : null}
              <span>{opt.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
