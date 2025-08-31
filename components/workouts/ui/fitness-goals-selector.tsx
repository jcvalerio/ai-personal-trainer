'use client';

import { SelectableCard } from './selectable-card';

export type FitnessGoalOption = {
  id: string;
  label: string;
  description?: string;
  icon?: string | React.ReactNode;
};

type FitnessGoalsSelectorProps = {
  selected: string[];
  onToggle: (id: string) => void;
  options: FitnessGoalOption[];
  className?: string;
};

export function FitnessGoalsSelector({
  selected,
  onToggle,
  options,
  className,
}: FitnessGoalsSelectorProps) {
  return (
    <div className={className}>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-4'>
        {options.map((opt) => (
          <SelectableCard
            key={opt.id}
            selected={selected.includes(opt.id)}
            onClick={() => onToggle(opt.id)}
            icon={
              typeof opt.icon === 'string' ? <span>{opt.icon}</span> : opt.icon
            }
            title={<span className='text-base font-medium sm:text-sm'>{opt.label}</span>}
            description={
              opt.description ? (
                <span className='text-sm sm:text-xs'>{opt.description}</span>
              ) : undefined
            }
            align='center'
          />
        ))}
      </div>
    </div>
  );
}
