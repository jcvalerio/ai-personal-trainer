'use client';

import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DurationSelectorProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  showSlider?: boolean;
  unit?: string;
}

export function DurationSelector({
  value,
  onChange,
  label,
  min = 15,
  max = 180,
  step = 15,
  className = '',
  showSlider = true,
  unit = 'min',
}: DurationSelectorProps) {
  const sliderId = useId();

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    onChange(clampedValue);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label htmlFor={sliderId}>{label}</Label>

      {/* Value display with stepper controls */}
      <div className='flex items-center justify-center space-x-4'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-10 w-10 rounded-full p-0'
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className='h-4 w-4' />
          <span className='sr-only'>
            Decrease by {step} {unit}
          </span>
        </Button>

        <div className='flex flex-col items-center'>
          <div className='text-2xl font-bold text-blue-600'>{value}</div>
          <div className='text-sm text-gray-600'>{unit}</div>
        </div>

        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-10 w-10 rounded-full p-0'
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className='h-4 w-4' />
          <span className='sr-only'>
            Increase by {step} {unit}
          </span>
        </Button>
      </div>

      {/* Slider for quick adjustments */}
      {showSlider && (
        <div className='space-y-2'>
          <input
            id={sliderId}
            type='range'
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            className='h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:ring-2 [&::-moz-range-thumb]:ring-blue-600 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-blue-600 [&::-webkit-slider-thumb]:ring-opacity-30'
          />

          <div className='flex justify-between text-xs text-gray-500'>
            <span>
              {min} {unit}
            </span>
            <span>
              {max} {unit}
            </span>
          </div>
        </div>
      )}

      {/* Alternative: Direct number input for precise control */}
      <div className='flex items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <span className='text-sm text-gray-600'>Precise:</span>
          <Input
            type='number'
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleInputChange}
            className='w-20 text-center'
          />
          <span className='text-sm text-gray-600'>{unit}</span>
        </div>
      </div>
    </div>
  );
}
