/**
 * Mobile-Friendly Day Selector Component
 * Replaces drag-and-drop with touch-friendly day selection for session scheduling
 */
'use client';

import React, { useState, useCallback } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface DayOfWeek {
  key: string;
  label: string;
  shortLabel: string;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  { key: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { key: 'friday', label: 'Friday', shortLabel: 'Fri' },
  { key: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sunday', label: 'Sunday', shortLabel: 'Sun' },
];

interface MobileDaySelectorProps {
  /** Currently selected days */
  selectedDays: string[];
  /** Callback when days selection changes */
  onDaysChange: (days: string[]) => void;
  /** Allow multiple day selection */
  multiple?: boolean;
  /** Custom trigger component */
  trigger?: React.ReactNode;
  /** Placeholder text for trigger */
  placeholder?: string;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
}

export function MobileDaySelector({
  selectedDays,
  onDaysChange,
  multiple = true,
  trigger,
  placeholder = 'Select days',
  title = 'Select Days',
  description = 'Choose which days to schedule sessions',
}: MobileDaySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDayToggle = useCallback((dayKey: string) => {
    if (multiple) {
      const newSelection = selectedDays.includes(dayKey)
        ? selectedDays.filter(d => d !== dayKey)
        : [...selectedDays, dayKey];
      onDaysChange(newSelection);
    } else {
      onDaysChange([dayKey]);
      setIsOpen(false);
    }
  }, [selectedDays, onDaysChange, multiple]);

  const selectedDayLabels = selectedDays
    .map(key => DAYS_OF_WEEK.find(d => d.key === key)?.shortLabel)
    .filter(Boolean)
    .join(', ');

  const defaultTrigger = (
    <Button
      variant="outline"
      className={cn(
        'h-12 w-full justify-between text-left font-normal touch-manipulation',
        !selectedDays.length && 'text-gray-500'
      )}
      onClick={() => setIsOpen(true)}
    >
      <span className="truncate">
        {selectedDays.length > 0 ? selectedDayLabels : placeholder}
      </span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </Button>
  );

  return (
    <>
      {trigger || defaultTrigger}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent mobileMode="bottomSheet" className="max-w-md">
          <DialogHeader className="text-center md:text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 p-4">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day.key);
              
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => handleDayToggle(day.key)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border p-4',
                    'touch-manipulation transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <span className="text-base font-medium">{day.label}</span>
                  {isSelected && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>

          {multiple && (
            <div className="flex gap-3 border-t px-4 pb-4 pt-4">
              <Button
                variant="outline"
                onClick={() => onDaysChange([])}
                className="h-12 flex-1 touch-manipulation"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="h-12 flex-1 touch-manipulation"
              >
                Done ({selectedDays.length})
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Compact Day Pills Component
 * Shows selected days as removable pills
 */
interface DayPillsProps {
  selectedDays: string[];
  onRemoveDay: (dayKey: string) => void;
  maxVisible?: number;
}

export function DayPills({ 
  selectedDays, 
  onRemoveDay, 
  maxVisible = 5 
}: DayPillsProps) {
  const visibleDays = selectedDays.slice(0, maxVisible);
  const hiddenCount = selectedDays.length - maxVisible;

  if (selectedDays.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleDays.map((dayKey) => {
        const day = DAYS_OF_WEEK.find(d => d.key === dayKey);
        if (!day) return null;

        return (
          <button
            key={dayKey}
            type="button"
            onClick={() => onRemoveDay(dayKey)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1',
              'text-sm font-medium text-blue-800 touch-manipulation',
              'hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'transition-colors duration-200'
            )}
          >
            {day.shortLabel}
            <span className="text-blue-600">×</span>
          </button>
        );
      })}
      
      {hiddenCount > 0 && (
        <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
          +{hiddenCount} more
        </div>
      )}
    </div>
  );
}

/**
 * Weekly Calendar View
 * Visual representation of selected days in a week format
 */
interface WeeklyCalendarProps {
  selectedDays: string[];
  onDayToggle: (dayKey: string) => void;
  showLabels?: boolean;
}

export function WeeklyCalendar({ 
  selectedDays, 
  onDayToggle, 
  showLabels = true 
}: WeeklyCalendarProps) {
  return (
    <div className="space-y-2">
      {showLabels && (
        <div className="text-sm font-medium text-gray-700">
          Weekly Schedule
        </div>
      )}
      
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDays.includes(day.key);
          
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onDayToggle(day.key)}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-lg border p-2',
                'touch-manipulation transition-colors duration-200 text-xs',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                isSelected
                  ? 'border-blue-500 bg-blue-100 text-blue-700 font-semibold'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="font-medium">{day.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}