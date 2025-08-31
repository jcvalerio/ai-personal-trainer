'use client';

import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export type SliderConfig = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  marks?: number[]; // optional tick marks to show recommended values
};

type ScheduleSlidersProps = {
  minutes?: SliderConfig; // minutes per session
  daysPerWeek?: SliderConfig; // training days per week
  weeks?: SliderConfig; // program duration in weeks
  className?: string;
};

// Mobile-optimized slider component that combines visual feedback with precision controls
export function MobileSlider({
  config,
  unit = '',
  listId,
}: {
  config: SliderConfig;
  unit?: string;
  listId?: string;
}) {
  const handleDecrement = () => {
    const step = config.step || 1;
    const min = config.min || 1;
    const newValue = Math.max(min, config.value - step);
    config.onChange(newValue);
  };

  const handleIncrement = () => {
    const step = config.step || 1;
    const max = config.max || 100;
    const newValue = Math.min(max, config.value + step);
    config.onChange(newValue);
  };

  return (
    <div className='space-y-3'>
      <Label>{config.label}</Label>

      {/* Value display with stepper controls - Mobile optimized */}
      <div className='flex items-center justify-center space-x-4'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-11 w-11 touch-manipulation rounded-full p-0'
          onClick={handleDecrement}
          disabled={config.value <= (config.min || 1)}
          aria-label={`Decrease ${config.label.toLowerCase()}`}
        >
          <Minus className='h-4 w-4' />
        </Button>

        <div className='flex min-w-[80px] flex-col items-center'>
          <div className='text-3xl font-bold text-blue-600'>{config.value}</div>
          <div className='text-sm text-gray-600'>{unit}</div>
        </div>

        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-11 w-11 touch-manipulation rounded-full p-0'
          onClick={handleIncrement}
          disabled={config.value >= (config.max || 100)}
          aria-label={`Increase ${config.label.toLowerCase()}`}
        >
          <Plus className='h-4 w-4' />
        </Button>
      </div>

      {/* Enhanced slider with larger touch targets */}
      <div className='space-y-2'>
        <input
          type='range'
          min={config.min || 1}
          max={config.max || 100}
          step={config.step || 1}
          value={config.value}
          onChange={(e) => config.onChange(parseInt(e.target.value))}
          list={config.marks && config.marks.length ? listId : undefined}
          className='h-3 w-full cursor-pointer touch-manipulation appearance-none rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:ring-2 [&::-moz-range-thumb]:ring-blue-600 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-blue-600 [&::-webkit-slider-thumb]:ring-opacity-30 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150'
          aria-label={config.label}
        />

        {config.marks && config.marks.length > 0 && (
          <datalist id={listId}>
            {config.marks
              .filter((m) => (config.min || 1) <= m && m <= (config.max || 100))
              .map((m) => (
                <option value={m} key={m} />
              ))}
          </datalist>
        )}

        <div className='flex justify-between px-1 text-xs text-gray-500'>
          <span>{config.minLabel || `${config.min || 1}${unit}`}</span>
          <span>{config.maxLabel || `${config.max || 100}${unit}`}</span>
        </div>
      </div>
    </div>
  );
}

export function ScheduleSliders({
  minutes,
  daysPerWeek,
  weeks,
  className,
}: ScheduleSlidersProps) {
  const weeksListId = useId();
  const daysListId = useId();
  const minutesListId = useId();

  return (
    <div className={className}>
      {weeks && (
        <MobileSlider
          config={weeks}
          unit={weeks.value === 1 ? 'week' : 'weeks'}
          listId={weeksListId}
        />
      )}

      {daysPerWeek && (
        <div className='mt-8'>
          <MobileSlider
            config={daysPerWeek}
            unit={daysPerWeek.value === 1 ? 'day' : 'days'}
            listId={daysListId}
          />
        </div>
      )}

      {minutes && (
        <div className='mt-8'>
          <MobileSlider config={minutes} unit='min' listId={minutesListId} />
        </div>
      )}
    </div>
  );
}
