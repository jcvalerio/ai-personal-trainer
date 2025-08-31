'use client';

import { cn } from '@/lib/utils';

type EquipmentOption = {
  id: string;
  label: string;
  icon?: string | React.ReactNode;
};

type EquipmentSelectorProps = {
  selected: string[];
  onToggle: (id: string) => void;
  options: EquipmentOption[];
  className?: string;
};

export function EquipmentSelector({
  selected,
  onToggle,
  options,
  className,
}: EquipmentSelectorProps) {
  return (
    <div className={className}>
      <div className='space-y-2'>
        {options.map((equipment) => (
          <button
            key={equipment.id}
            type='button'
            onClick={() => onToggle(equipment.id)}
            className={cn(
              'w-full rounded-lg border p-3 text-left transition-colors',
              selected.includes(equipment.id)
                ? 'border-purple-500 bg-purple-50 text-purple-900'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <span className='flex items-center gap-2 text-sm font-medium'>
              {equipment.icon ? (
                typeof equipment.icon === 'string' ? (
                  <span>{equipment.icon}</span>
                ) : (
                  equipment.icon
                )
              ) : null}
              <span>{equipment.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
