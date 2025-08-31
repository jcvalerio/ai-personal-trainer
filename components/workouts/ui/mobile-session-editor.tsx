/**
 * Mobile-Optimized Session Editor Component
 * Touch-friendly interface for creating and editing workout sessions
 */
'use client';

import React, { useState, useCallback, useId } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dumbbell,
  Heart,
  Target,
  Zap,
  Timer,
  Calendar,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TouchInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SelectableCard } from '@/components/workouts/ui/selectable-card';
import {
  MobileSlider,
  type SliderConfig,
} from '@/components/workouts/ui/schedule-sliders';
import { 
  MobileDaySelector, 
  DayPills, 
  WeeklyCalendar 
} from '@/components/workouts/ui/mobile-day-selector';
import { cn } from '@/lib/utils';

export interface SessionItem {
  id: string;
  name: string;
  type: 'workout' | 'cardio' | 'strength' | 'hiit' | 'recovery' | 'rest';
  duration: number;
  scheduledDays: string[];
  templateId?: string;
  notes?: string;
}

const SESSION_TYPES = [
  { value: 'workout', label: 'Workout', icon: Dumbbell, color: 'bg-blue-500' },
  { value: 'cardio', label: 'Cardio', icon: Heart, color: 'bg-red-500' },
  { value: 'strength', label: 'Strength', icon: Target, color: 'bg-green-500' },
  { value: 'hiit', label: 'HIIT', icon: Zap, color: 'bg-orange-500' },
  { value: 'recovery', label: 'Recovery', icon: Timer, color: 'bg-purple-500' },
  { value: 'rest', label: 'Rest Day', icon: Calendar, color: 'bg-gray-500' },
] as const;

interface MobileSessionEditorProps {
  /** Session being edited (null for new session) */
  session: SessionItem | null;
  /** Whether the editor is open */
  isOpen: boolean;
  /** Callback when session is saved */
  onSave: (session: SessionItem) => void;
  /** Callback when editor is closed */
  onClose: () => void;
  /** Show day scheduling interface */
  showDayScheduling?: boolean;
  /** Custom validation function */
  validate?: (session: SessionItem) => string | null;
}

export function MobileSessionEditor({
  session,
  isOpen,
  onSave,
  onClose,
  showDayScheduling = true,
  validate,
}: MobileSessionEditorProps) {
  const t = useTranslations('workouts.createPlan.schedule');
  const [editSession, setEditSession] = useState<SessionItem | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [scheduleView, setScheduleView] = useState<'selector' | 'calendar'>('selector');
  
  const durationListId = useId();

  React.useEffect(() => {
    if (isOpen && session) {
      setEditSession({ ...session });
      setValidationError(null);
    } else if (isOpen && !session) {
      // New session
      const newSession: SessionItem = {
        id: `session-${Date.now()}`,
        name: '',
        type: 'workout',
        duration: 60,
        scheduledDays: [],
      };
      setEditSession(newSession);
      setValidationError(null);
    }
  }, [isOpen, session]);

  const handleSave = useCallback(() => {
    if (!editSession) return;

    // Basic validation
    if (!editSession.name.trim()) {
      setValidationError('Please enter a session name');
      return;
    }

    if (showDayScheduling && editSession.scheduledDays.length === 0) {
      setValidationError('Please select at least one day');
      return;
    }

    // Custom validation
    if (validate) {
      const error = validate(editSession);
      if (error) {
        setValidationError(error);
        return;
      }
    }

    onSave(editSession);
    onClose();
  }, [editSession, onSave, onClose, showDayScheduling, validate]);

  const updateSession = useCallback((updates: Partial<SessionItem>) => {
    setEditSession((prev) => (prev ? { ...prev, ...updates } : null));
    setValidationError(null); // Clear validation errors on change
  }, []);

  const handleSessionTypeChange = useCallback((type: SessionItem['type']) => {
    updateSession({ type });
  }, [updateSession]);

  const handleDurationChange = useCallback((duration: number) => {
    updateSession({ duration });
  }, [updateSession]);

  const handleDaysChange = useCallback((days: string[]) => {
    updateSession({ scheduledDays: days });
  }, [updateSession]);

  const handleRemoveDay = useCallback((dayKey: string) => {
    if (!editSession) return;
    const updatedDays = editSession.scheduledDays.filter(d => d !== dayKey);
    updateSession({ scheduledDays: updatedDays });
  }, [editSession, updateSession]);

  const handleDayToggle = useCallback((dayKey: string) => {
    if (!editSession) return;
    
    const isSelected = editSession.scheduledDays.includes(dayKey);
    const updatedDays = isSelected
      ? editSession.scheduledDays.filter(d => d !== dayKey)
      : [...editSession.scheduledDays, dayKey];
    
    updateSession({ scheduledDays: updatedDays });
  }, [editSession, updateSession]);

  if (!isOpen || !editSession) {
    return null;
  }

  // Duration slider configuration
  const durationConfig: SliderConfig = {
    value: editSession.duration,
    onChange: handleDurationChange,
    label: 'Duration',
    min: 15,
    max: 180,
    step: 15,
    minLabel: '15 min',
    maxLabel: '3h',
    marks: [30, 45, 60, 90, 120],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent mobileMode="fullscreen" className="max-w-2xl">
        <DialogHeader className="text-center md:text-left">
          <DialogTitle>
            {session ? 'Edit Session' : 'Create New Session'}
          </DialogTitle>
          <DialogDescription>
            Configure your workout session details
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-8 overflow-y-auto p-4 md:p-6">
          {/* Validation Error */}
          {validationError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{validationError}</p>
            </div>
          )}

          {/* Basic Information */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h3>

            {/* Session Name */}
            <div className="space-y-2">
              <Label htmlFor="sessionName" className="text-base font-medium">
                Session Name
              </Label>
              <TouchInput
                id="sessionName"
                value={editSession.name}
                onChange={(e) => updateSession({ name: e.target.value })}
                placeholder="Enter session name"
                autoFocus
                className={cn(
                  validationError?.includes('name') && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
            </div>

            {/* Session Type */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Session Type</Label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {SESSION_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectableCard
                      key={type.value}
                      selected={editSession.type === type.value}
                      onClick={() => handleSessionTypeChange(type.value)}
                      className="h-24 min-h-[60px] touch-manipulation"
                      icon={
                        <div className={cn('mb-2 rounded-lg p-2', type.color)}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      }
                      title={
                        <span className="text-sm font-medium">{type.label}</span>
                      }
                      align="center"
                    />
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-4">
              <MobileSlider
                config={durationConfig}
                unit="min"
                listId={durationListId}
              />

              {/* Quick preset buttons */}
              <div className="flex justify-center gap-2 flex-wrap">
                {[30, 45, 60, 90].map((preset) => (
                  <Button
                    key={preset}
                    variant={
                      editSession.duration === preset ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => handleDurationChange(preset)}
                    className="h-10 min-w-[60px] touch-manipulation"
                  >
                    {preset}m
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* Day Scheduling */}
          {showDayScheduling && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Schedule Days
                </h3>
                <div className="flex rounded-lg border border-gray-200 p-1">
                  <button
                    type="button"
                    onClick={() => setScheduleView('selector')}
                    className={cn(
                      'rounded px-3 py-1 text-sm font-medium transition-colors',
                      scheduleView === 'selector'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleView('calendar')}
                    className={cn(
                      'rounded px-3 py-1 text-sm font-medium transition-colors',
                      scheduleView === 'calendar'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    Calendar
                  </button>
                </div>
              </div>

              {scheduleView === 'selector' ? (
                <div className="space-y-4">
                  <MobileDaySelector
                    selectedDays={editSession.scheduledDays}
                    onDaysChange={handleDaysChange}
                    placeholder="Select training days"
                    title="Training Days"
                    description="Choose which days you want to schedule this session"
                  />
                  
                  {editSession.scheduledDays.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">
                        Selected Days:
                      </div>
                      <DayPills
                        selectedDays={editSession.scheduledDays}
                        onRemoveDay={handleRemoveDay}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <WeeklyCalendar
                  selectedDays={editSession.scheduledDays}
                  onDayToggle={handleDayToggle}
                  showLabels={false}
                />
              )}

              {validationError?.includes('day') && (
                <p className="text-sm text-red-600">
                  Please select at least one day for scheduling
                </p>
              )}
            </section>
          )}

          {/* Optional Notes */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Additional Notes
            </h3>
            <div className="space-y-2">
              <Label htmlFor="sessionNotes" className="text-base font-medium">
                Notes (Optional)
              </Label>
              <textarea
                id="sessionNotes"
                value={editSession.notes || ''}
                onChange={(e) => updateSession({ notes: e.target.value })}
                placeholder="Add any additional notes or instructions..."
                rows={3}
                className={cn(
                  'w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base',
                  'placeholder:text-gray-400 focus:border-blue-500 focus:outline-none',
                  'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 resize-none',
                  'touch-manipulation'
                )}
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              />
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 border-t px-4 pb-4 pt-4 md:px-6">
          <Button
            onClick={handleSave}
            className="h-12 flex-1 touch-manipulation text-base font-medium"
            size="lg"
          >
            {session ? 'Update Session' : 'Create Session'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="h-12 touch-manipulation px-8 text-base font-medium"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Quick Session Creator
 * Simplified version for rapid session creation
 */
interface QuickSessionCreatorProps {
  onCreateSession: (session: Omit<SessionItem, 'id'>) => void;
  trigger?: React.ReactNode;
}

export function QuickSessionCreator({
  onCreateSession,
  trigger,
}: QuickSessionCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleQuickCreate = useCallback((type: SessionItem['type']) => {
    const session: Omit<SessionItem, 'id'> = {
      name: `${SESSION_TYPES.find(t => t.value === type)?.label} Session`,
      type,
      duration: type === 'recovery' ? 30 : 60,
      scheduledDays: [],
    };

    onCreateSession(session);
    setIsOpen(false);
  }, [onCreateSession]);

  const defaultTrigger = (
    <Button 
      variant="outline" 
      onClick={() => setIsOpen(true)}
      className="h-12 touch-manipulation"
    >
      <Plus className="mr-2 h-4 w-4" />
      Quick Add
    </Button>
  );

  return (
    <>
      {trigger || defaultTrigger}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent mobileMode="bottomSheet" className="max-w-md">
          <DialogHeader className="text-center md:text-left">
            <DialogTitle>Quick Session</DialogTitle>
            <DialogDescription>
              Choose a session type to get started quickly
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 p-4">
            {SESSION_TYPES.slice(0, 4).map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleQuickCreate(type.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border p-4',
                    'touch-manipulation transition-colors hover:bg-gray-50',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  )}
                >
                  <div className={cn('rounded-lg p-2', type.color)}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}