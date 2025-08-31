/**
 * Weekly Schedule Builder Component
 * Drag-and-drop weekly schedule configuration for custom workout plans
 */
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  MobileSlider,
  type SliderConfig,
} from '@/components/workouts/ui/schedule-sliders';
import { SelectableCard } from '@/components/workouts/ui/selectable-card';
import { cn } from '@/lib/utils';
import type { DayScheduleType } from '@/types/workouts';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  Clock,
  Dumbbell,
  GripVertical,
  Heart,
  Plus,
  Target,
  Timer,
  Trash2,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useId, useMemo, useState } from 'react';
import { useFormState } from './form-state-provider';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const SESSION_TYPES = [
  { value: 'workout', label: 'Workout', icon: Dumbbell, color: 'bg-blue-500' },
  { value: 'cardio', label: 'Cardio', icon: Heart, color: 'bg-red-500' },
  { value: 'strength', label: 'Strength', icon: Target, color: 'bg-green-500' },
  { value: 'hiit', label: 'HIIT', icon: Zap, color: 'bg-orange-500' },
  { value: 'recovery', label: 'Recovery', icon: Timer, color: 'bg-purple-500' },
  { value: 'rest', label: 'Rest Day', icon: Calendar, color: 'bg-gray-500' },
] as const;

interface SessionItem {
  id: string;
  name: string;
  type: 'workout' | 'cardio' | 'strength' | 'hiit' | 'recovery' | 'rest';
  duration: number;
  templateId?: string;
}

interface DraggableSessionProps {
  session: SessionItem;
  onEdit: (session: SessionItem) => void;
  onDelete: (sessionId: string) => void;
}

function DraggableSession({
  session,
  onEdit,
  onDelete,
}: DraggableSessionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sessionType = SESSION_TYPES.find((type) => type.value === session.type);
  const SessionIcon = sessionType?.icon || Dumbbell;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'scale-105 opacity-50 shadow-lg'
      )}
    >
      <div
        className='flex-shrink-0 cursor-grab active:cursor-grabbing'
        {...attributes}
        {...listeners}
      >
        <GripVertical className='h-4 w-4 text-gray-400' />
      </div>

      <div className={cn('flex-shrink-0 rounded-lg p-2', sessionType?.color)}>
        <SessionIcon className='h-4 w-4 text-white' />
      </div>

      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium text-gray-900'>
          {session.name}
        </p>
        <p className='text-xs text-gray-500'>
          {session.duration} min • {sessionType?.label}
        </p>
      </div>

      <div className='flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
        <Button
          size='sm'
          variant='ghost'
          onClick={() => onEdit(session)}
          className='h-6 w-6 p-0'
        >
          <Clock className='h-3 w-3' />
        </Button>
        <Button
          size='sm'
          variant='ghost'
          onClick={() => onDelete(session.id)}
          className='h-6 w-6 p-0 text-red-500 hover:text-red-700'
        >
          <Trash2 className='h-3 w-3' />
        </Button>
      </div>
    </div>
  );
}

interface DroppableDayProps {
  day: (typeof DAYS_OF_WEEK)[number];
  sessions: SessionItem[];
  onSessionsChange: (day: string, sessions: SessionItem[]) => void;
  onEditSession: (session: SessionItem) => void;
  onDeleteSession: (sessionId: string) => void;
}

function DroppableDay({
  day,
  sessions,
  onSessionsChange,
  onEditSession,
  onDeleteSession,
}: DroppableDayProps) {
  const t = useTranslations('createPlan.schedule');

  const totalDuration = useMemo(
    () => sessions.reduce((sum, session) => sum + session.duration, 0),
    [sessions]
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      const updatedSessions = sessions.filter((s) => s.id !== sessionId);
      onSessionsChange(day.key, updatedSessions);
      onDeleteSession(sessionId);
    },
    [sessions, day.key, onSessionsChange, onDeleteSession]
  );

  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold'>
            {t(`days.${day.key}`)}
          </CardTitle>
          {sessions.length > 0 && (
            <Badge variant='secondary' className='text-xs'>
              {totalDuration} min
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-2'>
        <SortableContext
          items={sessions.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sessions.map((session) => (
            <DraggableSession
              key={session.id}
              session={session}
              onEdit={onEditSession}
              onDelete={handleDeleteSession}
            />
          ))}
        </SortableContext>

        {sessions.length === 0 && (
          <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-8 text-center'>
            <Calendar className='mb-2 h-8 w-8 text-gray-400' />
            <p className='text-sm text-gray-500'>{t('dropZone.empty')}</p>
            <p className='text-xs text-gray-400'>{t('dropZone.instruction')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SessionEditorProps {
  session: SessionItem | null;
  isOpen: boolean;
  onSave: (session: SessionItem, targetDay?: string) => void;
  onClose: () => void;
  schedule: Record<string, SessionItem[]>;
}

function SessionEditor({
  session,
  isOpen,
  onSave,
  onClose,
  schedule,
}: SessionEditorProps) {
  const t = useTranslations('createPlan.schedule');
  const [editSession, setEditSession] = useState<SessionItem | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const durationListId = useId();

  React.useEffect(() => {
    if (isOpen && session) {
      // If it's a new session using the default display name, clear to use placeholder UX
      const defaultName = t('defaultSession.name');
      setEditSession({
        ...session,
        name: session.name && session.name !== defaultName ? session.name : '',
      });

      // Find which day this session is currently on, default to Monday for new sessions
      let currentDay = 'monday';
      for (const [day, sessions] of Object.entries(schedule)) {
        if (sessions.find((s) => s.id === session.id)) {
          currentDay = day;
          break;
        }
      }
      setSelectedDay(currentDay);
    }
  }, [isOpen, session, schedule, t]);

  const handleSave = useCallback(() => {
    if (editSession) {
      // Ensure name is not empty - use default if needed
      const sessionToSave = {
        ...editSession,
        name: editSession.name.trim() || t('defaultSession.name'),
      };
      onSave(sessionToSave, selectedDay);
      onClose();
    }
  }, [editSession, selectedDay, onSave, onClose, t]);

  const handleSessionTypeChange = useCallback((type: SessionItem['type']) => {
    setEditSession((prev) => (prev ? { ...prev, type } : null));
  }, []);

  const handleDurationChange = useCallback((duration: number) => {
    setEditSession((prev) => (prev ? { ...prev, duration } : null));
  }, []);

  if (!isOpen || !editSession) {
    return null;
  }

  // Duration slider configuration
  const durationConfig: SliderConfig = {
    value: editSession.duration,
    onChange: handleDurationChange,
    label: t('editor.duration'),
    min: 15,
    max: 180,
    step: 15,
    minLabel: '15 min',
    maxLabel: '3h',
    marks: [30, 45, 60, 90, 120],
  };

  return (
    <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'>
      <div
        className={cn(
          'bg-white shadow-xl transition-transform duration-300 ease-out',
          'fixed left-1/2 top-1/2 mx-4 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg',
          'max-h-[90vh] overflow-y-auto',
          // Mobile-specific optimizations
          'w-[calc(100%-2rem)] max-md:max-w-none max-md:w-[calc(100%-2rem)]'
        )}
      >

        <div className='space-y-6 p-6'>
          <div className='text-center md:text-left'>
            <h2 className='text-lg font-semibold text-gray-900'>
              {t('editor.title')}
            </h2>
          </div>

          {/* Session Name Input */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-900'>
              {t('editor.sessionName')}
            </label>
            <Input
              type='text'
              value={editSession.name}
              onChange={(e) =>
                setEditSession((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              placeholder={t('editor.sessionNamePlaceholder')}
              className='h-12 text-base' // Larger touch target and 16px text for iOS
              autoFocus
            />
          </div>

          {/* Day Selector - Mobile-friendly */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-900'>
              Schedule Day
            </label>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
              {DAYS_OF_WEEK.map((day) => (
                <SelectableCard
                  key={day.key}
                  selected={selectedDay === day.key}
                  onClick={() => setSelectedDay(day.key)}
                  className='h-12 touch-manipulation text-sm'
                  title={
                    <span className='text-sm font-medium'>
                      {t(`days.${day.key}`)}
                    </span>
                  }
                  align='center'
                />
              ))}
            </div>
          </div>

          {/* Session Type Selector - Visual Cards */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-900'>
              {t('editor.sessionType')}
            </label>
            <div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
              {SESSION_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectableCard
                    key={type.value}
                    selected={editSession.type === type.value}
                    onClick={() =>
                      handleSessionTypeChange(type.value as SessionItem['type'])
                    }
                    className='h-16 touch-manipulation md:h-20' // 64px+ touch targets
                    icon={
                      <div className={cn('mb-1 rounded-lg p-2', type.color)}>
                        <Icon className='h-5 w-5 text-white' />
                      </div>
                    }
                    title={
                      <span className='text-sm font-medium'>{type.label}</span>
                    }
                    align='center'
                  />
                );
              })}
            </div>
          </div>

          {/* Duration Slider */}
          <div>
            <MobileSlider
              config={durationConfig}
              unit='min'
              listId={durationListId}
            />

            {/* Quick preset buttons */}
            <div className='mt-4 flex justify-center gap-2'>
              {[30, 45, 60, 90].map((preset) => (
                <Button
                  key={preset}
                  variant={
                    editSession.duration === preset ? 'default' : 'outline'
                  }
                  size='sm'
                  onClick={() => handleDurationChange(preset)}
                  className='h-10 min-w-[48px] touch-manipulation text-sm'
                >
                  {preset}m
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4'>
            <Button
              onClick={handleSave}
              className='h-12 flex-1 touch-manipulation text-base font-medium'
            >
              {t('editor.save')}
            </Button>
            <Button
              variant='outline'
              onClick={onClose}
              className='h-12 flex-1 touch-manipulation text-base font-medium'
            >
              {t('editor.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScheduleBuilder() {
  const t = useTranslations('createPlan.schedule');
  const { formData, updateFormData } = useFormState();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(
    null
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper function to map DayScheduleType to SessionItem type
  const mapDayScheduleTypeToSessionType = (
    type: string
  ): SessionItem['type'] => {
    switch (type) {
      case 'workout':
        return 'workout';
      case 'active_recovery':
        return 'recovery';
      case 'rest':
        return 'rest';
      default:
        return 'workout';
    }
  };

  // Convert form data to schedule
  const schedule = useMemo(() => {
    const weeklySchedule = formData.weeklySchedule || {};
    return DAYS_OF_WEEK.reduce(
      (acc, day) => {
        const daySchedules = weeklySchedule[day.key] || [];
        // Convert DaySchedule[] to SessionItem[]
        acc[day.key] = daySchedules.map((daySchedule, index) => ({
          id: daySchedule.sessionId || `${day.key}-session-${index}`,
          name: daySchedule.sessionName,
          type: mapDayScheduleTypeToSessionType(daySchedule.type),
          duration: daySchedule.duration,
          templateId: daySchedule.sessionId,
        }));
        return acc;
      },
      {} as Record<string, SessionItem[]>
    );
  }, [formData.weeklySchedule]);

  const handleSessionsChange = useCallback(
    (day: string, sessions: SessionItem[]) => {
      const currentWeeklySchedule = formData.weeklySchedule || {};
      // Convert SessionItem[] back to DaySchedule[]
      const daySchedules = sessions.map((session) => ({
        day,
        sessionId: session.templateId || session.id,
        sessionName: session.name,
        type: mapSessionTypeToDayScheduleType(session.type),
        duration: session.duration,
      }));

      const newWeeklySchedule = {
        ...currentWeeklySchedule,
        [day]: daySchedules,
      };

      updateFormData({ weeklySchedule: newWeeklySchedule });
    },
    [formData.weeklySchedule, updateFormData]
  );

  // Helper function to map SessionItem type back to DayScheduleType
  const mapSessionTypeToDayScheduleType = (
    type: SessionItem['type']
  ): DayScheduleType => {
    switch (type) {
      case 'workout':
      case 'cardio':
      case 'strength':
      case 'hiit':
        return 'workout';
      case 'recovery':
        return 'active_recovery';
      case 'rest':
        return 'rest';
      default:
        return 'workout';
    }
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) {
        return;
      }

      // Find source and destination
      let sourceDay = '';
      let sourceIndex = -1;
      let destinationDay = '';
      let destinationIndex = -1;

      // Find source
      for (const [day, sessions] of Object.entries(schedule)) {
        const index = sessions.findIndex((s) => s.id === active.id);
        if (index !== -1) {
          sourceDay = day;
          sourceIndex = index;
          break;
        }
      }

      // Find destination
      if (over.id === active.id) {
        return;
      }

      // Check if dropping on a day container
      const dayKey = DAYS_OF_WEEK.find((d) => d.key === over.id)?.key;
      if (dayKey) {
        destinationDay = dayKey;
        destinationIndex = schedule[dayKey]?.length || 0;
      } else {
        // Find the day containing the destination session
        for (const [day, sessions] of Object.entries(schedule)) {
          const index = sessions.findIndex((s) => s.id === over.id);
          if (index !== -1) {
            destinationDay = day;
            destinationIndex = index;
            break;
          }
        }
      }

      if (sourceDay && destinationDay && sourceIndex !== -1) {
        const sourceSession = schedule[sourceDay]?.[sourceIndex];

        if (!sourceSession) {
          return;
        }

        if (sourceDay === destinationDay) {
          // Reorder within same day
          const currentDaySessions = schedule[sourceDay];
          if (currentDaySessions) {
            const newSessions = arrayMove(
              currentDaySessions,
              sourceIndex,
              destinationIndex
            );
            handleSessionsChange(sourceDay, newSessions);
          }
        } else {
          // Move between days
          const sourceDaySessions = schedule[sourceDay];
          const destDaySessions = schedule[destinationDay];

          if (sourceDaySessions && destDaySessions) {
            const sourceSessions = [...sourceDaySessions];
            sourceSessions.splice(sourceIndex, 1);

            const destSessions = [...destDaySessions];
            destSessions.splice(destinationIndex, 0, sourceSession);

            // Convert SessionItem[] back to DaySchedule[] for both days
            const currentWeeklySchedule = formData.weeklySchedule || {};
            const newWeeklySchedule = {
              ...currentWeeklySchedule,
              [sourceDay]: sourceSessions.map((session) => ({
                day: sourceDay,
                sessionId: session.templateId || session.id,
                sessionName: session.name,
                type: mapSessionTypeToDayScheduleType(session.type),
                duration: session.duration,
              })),
              [destinationDay]: destSessions.map((session) => ({
                day: destinationDay,
                sessionId: session.templateId || session.id,
                sessionName: session.name,
                type: mapSessionTypeToDayScheduleType(session.type),
                duration: session.duration,
              })),
            };

            updateFormData({ weeklySchedule: newWeeklySchedule });
          }
        }
      }
    },
    [schedule, handleSessionsChange, updateFormData, formData.weeklySchedule]
  );

  const handleAddSession = useCallback(() => {
    const newSession: SessionItem = {
      id: `session-${Date.now()}`,
      name: '',
      type: 'workout',
      duration: 60,
    };

    setEditingSession(newSession);
    setIsEditorOpen(true);
  }, [t]);

  const handleEditSession = useCallback((session: SessionItem) => {
    setEditingSession(session);
    setIsEditorOpen(true);
  }, []);

  const handleSaveSession = useCallback(
    (session: SessionItem, targetDay?: string) => {
      // Check if this is a new session (not found in any day)
      let foundInDay = '';
      for (const [day, sessions] of Object.entries(schedule)) {
        if (sessions.find((s) => s.id === session.id)) {
          foundInDay = day;
          break;
        }
      }

      if (!foundInDay) {
        // New session - add to target day or Monday by default
        const dayToUse = targetDay || 'monday';
        const daySessions = [...(schedule[dayToUse] || []), session];
        handleSessionsChange(dayToUse, daySessions);
      } else {
        // Existing session - check if we need to move to a different day
        if (targetDay && targetDay !== foundInDay) {
          // Move session to target day
          const sourceDaySessions = schedule[foundInDay]?.filter((s) => s.id !== session.id) || [];
          const targetDaySessions = [...(schedule[targetDay] || []), session];
          
          handleSessionsChange(foundInDay, sourceDaySessions);
          handleSessionsChange(targetDay, targetDaySessions);
        } else {
          // Update existing session in same day
          const daySchedule = schedule[foundInDay];
          if (daySchedule) {
            const updatedSessions = daySchedule.map((s) =>
              s.id === session.id ? session : s
            );
            handleSessionsChange(foundInDay, updatedSessions);
          }
        }
      }
    },
    [schedule, handleSessionsChange]
  );

  const handleDeleteSession = useCallback((_sessionId: string) => {
    // Session deletion is handled in DroppableDay
  }, []);

  const activeSession = useMemo(() => {
    if (!activeId) {
      return null;
    }

    for (const sessions of Object.values(schedule)) {
      const session = sessions.find((s) => s.id === activeId);
      if (session) {
        return session;
      }
    }
    return null;
  }, [activeId, schedule]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const allSessions = Object.values(schedule).flat();
    const workoutSessions = allSessions.filter((s) => s.type !== 'rest');
    const totalDuration = allSessions.reduce((sum, s) => sum + s.duration, 0);

    return {
      totalSessions: workoutSessions.length,
      totalDuration,
      avgSessionDuration: workoutSessions.length
        ? Math.round(totalDuration / workoutSessions.length)
        : 0,
      restDays: 7 - workoutSessions.length,
    };
  }, [schedule]);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>{t('title')}</h3>
          <p className='text-sm text-gray-600'>{t('description')}</p>
        </div>
        <Button onClick={handleAddSession}>
          <Plus className='mr-2 h-4 w-4' />
          {t('addSession')}
        </Button>
      </div>

      {/* Weekly Stats */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {weeklyStats.totalSessions}
            </div>
            <div className='text-sm text-gray-600'>{t('stats.sessions')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {weeklyStats.totalDuration}m
            </div>
            <div className='text-sm text-gray-600'>{t('stats.totalTime')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {weeklyStats.avgSessionDuration}m
            </div>
            <div className='text-sm text-gray-600'>
              {t('stats.avgDuration')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              {weeklyStats.restDays}
            </div>
            <div className='text-sm text-gray-600'>{t('stats.restDays')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7'>
          {DAYS_OF_WEEK.map((day) => (
            <SortableContext
              key={day.key}
              items={schedule[day.key]?.map((s) => s.id) || []}
              strategy={rectSortingStrategy}
            >
              <DroppableDay
                day={day}
                sessions={schedule[day.key] || []}
                onSessionsChange={handleSessionsChange}
                onEditSession={handleEditSession}
                onDeleteSession={handleDeleteSession}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeSession ? (
            <div className='flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-lg'>
              <div
                className={cn(
                  'flex-shrink-0 rounded-lg p-2',
                  SESSION_TYPES.find((t) => t.value === activeSession.type)
                    ?.color
                )}
              >
                {React.createElement(
                  SESSION_TYPES.find((t) => t.value === activeSession.type)
                    ?.icon || Dumbbell,
                  {
                    className: 'h-4 w-4 text-white',
                  }
                )}
              </div>
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  {activeSession.name}
                </p>
                <p className='text-xs text-gray-500'>
                  {activeSession.duration} min
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Session Editor Modal */}
      <SessionEditor
        session={editingSession}
        isOpen={isEditorOpen}
        onSave={handleSaveSession}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingSession(null);
        }}
        schedule={schedule}
      />
    </div>
  );
}
