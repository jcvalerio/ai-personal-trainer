'use client';

import { SelectableCard } from './selectable-card';

export type FitnessLevelOption = {
  id: 'beginner' | 'intermediate' | 'advanced' | string;
  name: string;
  description?: string;
};

type FitnessLevelSelectorProps = {
  value: string;
  onChange: (level: string) => void;
  options: FitnessLevelOption[];
  className?: string;
};

export function FitnessLevelSelector({
  value,
  onChange,
  options,
  className,
}: FitnessLevelSelectorProps) {
  return (
    <div className={className}>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {options.map((opt) => (
          <SelectableCard
            key={opt.id}
            selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            title={<span className='capitalize'>{opt.name}</span>}
            description={opt.description}
            align='left'
            className='p-4 min-h-[60px]'
          />
        ))}
      </div>
    </div>
  );
}
