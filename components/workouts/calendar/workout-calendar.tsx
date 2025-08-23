/**
 * Workout Calendar Component
 * Advanced calendar interface with drag-and-drop scheduling and session management
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Play,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Calendar event interface
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'workout' | 'rest' | 'assessment' | 'recovery';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
  planId?: string;
  planName?: string;
  location?: string;
  instructor?: string;
  participants?: number;
  maxParticipants?: number;
  equipment?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedCalories?: number;
  tags?: string[];
  isRecurring?: boolean;
  recurrenceRule?: string;
  color?: string;
  conflictsWith?: string[];
}

// Calendar view types
type CalendarView = 'month' | 'week' | 'day' | 'agenda';

// Time slot interface for scheduling
interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflicts: string[];
}

interface WorkoutCalendarProps {
  events?: CalendarEvent[];
  onEventCreate?: (event: Omit<CalendarEvent, 'id'>) => void;
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void;
  onEventDelete?: (eventId: string) => void;
  onEventMove?: (eventId: string, newStartTime: Date) => void;
  onEventStart?: (eventId: string) => void;
  onEventComplete?: (eventId: string) => void;
  currentDate?: Date;
  view?: CalendarView;
  className?: string;
}

// Mock events data
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Upper Body Strength',
    description:
      'Focus on chest, shoulders, and triceps with progressive overload',
    startTime: new Date(2024, 2, 15, 9, 0), // March 15, 2024 at 9:00 AM
    endTime: new Date(2024, 2, 15, 10, 30),
    type: 'workout',
    status: 'scheduled',
    planId: 'plan-1',
    planName: 'Summer Body Challenge',
    location: 'Home Gym',
    difficulty: 'intermediate',
    estimatedCalories: 350,
    equipment: ['dumbbells', 'bench', 'resistance_bands'],
    tags: ['strength', 'upper_body'],
    color: '#3b82f6',
  },
  {
    id: '2',
    title: 'Morning Cardio',
    description: 'High-intensity interval training session',
    startTime: new Date(2024, 2, 16, 7, 0),
    endTime: new Date(2024, 2, 16, 7, 45),
    type: 'workout',
    status: 'completed',
    planId: 'plan-2',
    planName: 'Morning Energy Boost',
    difficulty: 'beginner',
    estimatedCalories: 280,
    tags: ['cardio', 'hiit'],
    color: '#10b981',
  },
  {
    id: '3',
    title: 'Rest Day',
    description: 'Active recovery with light stretching',
    startTime: new Date(2024, 2, 17, 0, 0),
    endTime: new Date(2024, 2, 17, 23, 59),
    type: 'rest',
    status: 'scheduled',
    difficulty: 'beginner',
    tags: ['recovery', 'flexibility'],
    color: '#6b7280',
  },
  {
    id: '4',
    title: 'Leg Day Intense',
    description: 'Squats, deadlifts, and leg accessories',
    startTime: new Date(2024, 2, 18, 18, 0),
    endTime: new Date(2024, 2, 18, 19, 30),
    type: 'workout',
    status: 'in_progress',
    planId: 'plan-1',
    planName: 'Summer Body Challenge',
    difficulty: 'advanced',
    estimatedCalories: 420,
    equipment: ['barbell', 'plates', 'squat_rack'],
    tags: ['strength', 'legs'],
    color: '#f59e0b',
  },
];

export function WorkoutCalendar({
  events = mockEvents,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onEventMove,
  onEventStart,
  onEventComplete,
  currentDate = new Date(),
  view = 'week',
  className = '',
}: WorkoutCalendarProps) {
  const t = useTranslations('workouts.calendar');

  // State management
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [currentView, setCurrentView] = useState<CalendarView>(view);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  // New event form state
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    type: 'workout',
    difficulty: 'intermediate',
    startTime: new Date(),
    endTime: new Date(),
    tags: [],
  });

  // Calendar navigation
  const navigateCalendar = useCallback(
    (direction: 'prev' | 'next') => {
      const newDate = new Date(selectedDate);

      switch (currentView) {
        case 'month':
          newDate.setMonth(
            newDate.getMonth() + (direction === 'next' ? 1 : -1)
          );
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'day':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
          break;
      }

      setSelectedDate(newDate);
    },
    [selectedDate, currentView]
  );

  // Get filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Tag filter
      if (filterTags.length > 0) {
        const hasMatchingTag = event.tags?.some((tag) =>
          filterTags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Status filter
      if (filterStatus.length > 0 && !filterStatus.includes(event.status)) {
        return false;
      }

      return true;
    });
  }, [events, filterTags, filterStatus]);

  // Get events for current view
  const viewEvents = useMemo(() => {
    const startOfView = new Date(selectedDate);
    const endOfView = new Date(selectedDate);

    switch (currentView) {
      case 'month':
        startOfView.setDate(1);
        endOfView.setMonth(endOfView.getMonth() + 1, 0);
        break;
      case 'week':
        const dayOfWeek = startOfView.getDay();
        startOfView.setDate(startOfView.getDate() - dayOfWeek);
        endOfView.setDate(startOfView.getDate() + 6);
        break;
      case 'day':
        endOfView.setDate(startOfView.getDate());
        break;
      case 'agenda':
        endOfView.setDate(startOfView.getDate() + 30); // Next 30 days
        break;
    }

    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startOfView && eventDate <= endOfView;
    });
  }, [selectedDate, currentView, filteredEvents]);

  // Handle event actions
  const handleEventAction = useCallback(
    (event: CalendarEvent, action: string) => {
      switch (action) {
        case 'start':
          onEventStart?.(event.id);
          break;
        case 'complete':
          onEventComplete?.(event.id);
          break;
        case 'edit':
          setSelectedEvent(event);
          setIsCreateMode(false);
          setIsEventDialogOpen(true);
          break;
        case 'delete':
          onEventDelete?.(event.id);
          break;
        case 'duplicate':
          const duplicatedEvent = {
            ...event,
            title: `${event.title} (Copy)`,
            startTime: new Date(
              event.startTime.getTime() + 24 * 60 * 60 * 1000
            ), // Next day
            endTime: new Date(event.endTime.getTime() + 24 * 60 * 60 * 1000),
            status: 'scheduled' as const,
          };
          delete (duplicatedEvent as any).id;
          onEventCreate?.(duplicatedEvent);
          break;
      }
    },
    [onEventStart, onEventComplete, onEventDelete, onEventCreate]
  );

  // Handle create new event
  const handleCreateEvent = useCallback(() => {
    setSelectedEvent(null);
    setIsCreateMode(true);
    setNewEvent({
      title: '',
      description: '',
      type: 'workout',
      difficulty: 'intermediate',
      startTime: new Date(selectedDate),
      endTime: new Date(selectedDate.getTime() + 60 * 60 * 1000), // 1 hour later
      tags: [],
    });
    setIsEventDialogOpen(true);
  }, [selectedDate]);

  // Save event (create or update)
  const handleSaveEvent = useCallback(() => {
    if (isCreateMode) {
      onEventCreate?.(newEvent as Omit<CalendarEvent, 'id'>);
    } else if (selectedEvent) {
      onEventUpdate?.(selectedEvent.id, newEvent);
    }
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
    setNewEvent({});
  }, [isCreateMode, newEvent, selectedEvent, onEventCreate, onEventUpdate]);

  // Get status badge
  const getStatusBadge = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant='outline' className='bg-blue-100 text-blue-800'>
            <Clock className='mr-1 h-3 w-3' />
            Scheduled
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant='default' className='bg-orange-100 text-orange-800'>
            <Play className='mr-1 h-3 w-3' />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            <CheckCircle2 className='mr-1 h-3 w-3' />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant='outline' className='bg-red-100 text-red-800'>
            <XCircle className='mr-1 h-3 w-3' />
            Cancelled
          </Badge>
        );
      case 'missed':
        return (
          <Badge variant='outline' className='bg-gray-100 text-gray-800'>
            <AlertCircle className='mr-1 h-3 w-3' />
            Missed
          </Badge>
        );
    }
  };

  // Get type badge
  const getTypeBadge = (type: CalendarEvent['type']) => {
    const colors = {
      workout: 'bg-blue-500',
      rest: 'bg-gray-500',
      assessment: 'bg-purple-500',
      recovery: 'bg-green-500',
    };

    return (
      <div className={`h-3 w-3 rounded-full ${colors[type]}`} title={type} />
    );
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = new Date(selectedDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className='grid grid-cols-8 gap-px overflow-hidden rounded-lg bg-gray-200'>
        {/* Time column header */}
        <div className='bg-gray-50 p-2 text-center text-sm font-medium text-gray-500'>
          Time
        </div>

        {/* Day headers */}
        {days.map((day) => (
          <div key={day.toISOString()} className='bg-gray-50 p-2 text-center'>
            <div className='text-sm font-medium text-gray-900'>
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className='text-lg font-bold text-gray-900'>
              {day.getDate()}
            </div>
          </div>
        ))}

        {/* Hour rows */}
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time label */}
            <div className='border-r bg-white p-2 text-center text-xs text-gray-500'>
              {hour === 0
                ? '12 AM'
                : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                    ? '12 PM'
                    : `${hour - 12} PM`}
            </div>

            {/* Day cells */}
            {days.map((day) => {
              const cellStart = new Date(day);
              cellStart.setHours(hour, 0, 0, 0);

              const cellEnd = new Date(day);
              cellEnd.setHours(hour + 1, 0, 0, 0);

              const eventsInCell = viewEvents.filter((event) => {
                const eventStart = new Date(event.startTime);
                return eventStart >= cellStart && eventStart < cellEnd;
              });

              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className='relative min-h-[60px] cursor-pointer border-b border-r bg-white p-1 hover:bg-gray-50'
                  onClick={() => {
                    const clickTime = new Date(day);
                    clickTime.setHours(hour, 0, 0, 0);
                    setNewEvent({
                      ...newEvent,
                      startTime: clickTime,
                      endTime: new Date(clickTime.getTime() + 60 * 60 * 1000),
                    });
                    handleCreateEvent();
                  }}
                >
                  {eventsInCell.map((event) => (
                    <div
                      key={event.id}
                      className='mb-1 cursor-pointer rounded p-1 text-xs transition-shadow hover:shadow-sm'
                      style={{ backgroundColor: event.color, color: 'white' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                        setIsEventDialogOpen(true);
                      }}
                    >
                      <div className='truncate font-medium'>{event.title}</div>
                      <div className='opacity-90'>
                        {formatTime(event.startTime)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Render agenda view
  const renderAgendaView = () => {
    const sortedEvents = [...viewEvents].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    if (sortedEvents.length === 0) {
      return (
        <div className='py-12 text-center'>
          <CalendarIcon className='mx-auto mb-4 h-16 w-16 text-gray-400' />
          <h3 className='mb-2 text-lg font-medium'>No upcoming sessions</h3>
          <p className='mb-4 text-gray-600'>
            Schedule your next workout to get started
          </p>
          <Button onClick={handleCreateEvent}>
            <Plus className='mr-2 h-4 w-4' />
            Schedule Workout
          </Button>
        </div>
      );
    }

    return (
      <div className='space-y-4'>
        {sortedEvents.map((event) => (
          <Card
            key={event.id}
            className='group transition-shadow hover:shadow-md'
          >
            <CardContent className='p-4'>
              <div className='flex items-start justify-between'>
                <div className='flex items-start gap-3'>
                  {getTypeBadge(event.type)}
                  <div className='flex-1'>
                    <div className='mb-1 flex items-center gap-2'>
                      <h3 className='font-medium'>{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>

                    {event.description && (
                      <p className='mb-2 text-sm text-gray-600'>
                        {event.description}
                      </p>
                    )}

                    <div className='flex items-center gap-4 text-sm text-gray-500'>
                      <div className='flex items-center gap-1'>
                        <CalendarIcon className='h-4 w-4' />
                        {formatDate(event.startTime)}
                      </div>
                      <div className='flex items-center gap-1'>
                        <Clock className='h-4 w-4' />
                        {formatTime(event.startTime)} -{' '}
                        {formatTime(event.endTime)}
                      </div>
                      {event.location && (
                        <div className='flex items-center gap-1'>
                          <MapPin className='h-4 w-4' />
                          {event.location}
                        </div>
                      )}
                    </div>

                    {event.tags && event.tags.length > 0 && (
                      <div className='mt-2 flex gap-1'>
                        {event.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant='secondary'
                            className='text-xs'
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='opacity-0 transition-opacity group-hover:opacity-100'
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {event.status === 'scheduled' && (
                      <DropdownMenuItem
                        onClick={() => handleEventAction(event, 'start')}
                      >
                        <Play className='mr-2 h-4 w-4' />
                        Start Session
                      </DropdownMenuItem>
                    )}
                    {event.status === 'in_progress' && (
                      <DropdownMenuItem
                        onClick={() => handleEventAction(event, 'complete')}
                      >
                        <CheckCircle2 className='mr-2 h-4 w-4' />
                        Complete
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleEventAction(event, 'edit')}
                    >
                      <Edit className='mr-2 h-4 w-4' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEventAction(event, 'duplicate')}
                    >
                      <Copy className='mr-2 h-4 w-4' />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleEventAction(event, 'delete')}
                      className='text-red-600'
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Calendar Header */}
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigateCalendar('prev')}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>

            <h2 className='min-w-[200px] text-center text-xl font-bold'>
              {currentView === 'month' &&
                selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              {currentView === 'week' &&
                `Week of ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              {currentView === 'day' && formatDate(selectedDate)}
              {currentView === 'agenda' && 'Upcoming Sessions'}
            </h2>

            <Button
              variant='outline'
              size='sm'
              onClick={() => navigateCalendar('next')}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          <Select
            value={currentView}
            onValueChange={(value) => setCurrentView(value as CalendarView)}
          >
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='agenda'>Agenda</SelectItem>
              <SelectItem value='day'>Day</SelectItem>
              <SelectItem value='week'>Week</SelectItem>
              <SelectItem value='month'>Month</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleCreateEvent}>
            <Plus className='mr-2 h-4 w-4' />
            Schedule
          </Button>
        </div>
      </div>

      {/* Calendar Views */}
      <div className='min-h-[600px]'>
        {currentView === 'week' && renderWeekView()}
        {currentView === 'agenda' && renderAgendaView()}
        {(currentView === 'month' || currentView === 'day') && (
          <div className='flex h-96 items-center justify-center text-gray-500'>
            <div className='text-center'>
              <CalendarIcon className='mx-auto mb-4 h-16 w-16 opacity-50' />
              <p>
                {currentView === 'month' ? 'Month' : 'Day'} view coming soon
              </p>
              <p className='text-sm'>
                Switch to Week or Agenda view for full functionality
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className='max-h-[80vh] max-w-md overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Schedule New Session' : selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? 'Create a new workout session'
                : 'View and manage session details'}
            </DialogDescription>
          </DialogHeader>

          {isCreateMode ? (
            <div className='space-y-4'>
              <div>
                <Label htmlFor='title'>Session Title</Label>
                <Input
                  id='title'
                  value={newEvent.title || ''}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  placeholder='e.g., Upper Body Strength'
                />
              </div>

              <div>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  value={newEvent.description || ''}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  placeholder='Session details...'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='start-time'>Start Time</Label>
                  <Input
                    id='start-time'
                    type='datetime-local'
                    value={newEvent.startTime?.toISOString().slice(0, 16)}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        startTime: new Date(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='end-time'>End Time</Label>
                  <Input
                    id='end-time'
                    type='datetime-local'
                    value={newEvent.endTime?.toISOString().slice(0, 16)}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        endTime: new Date(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='type'>Session Type</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value) =>
                      setNewEvent({
                        ...newEvent,
                        type: value as CalendarEvent['type'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='workout'>Workout</SelectItem>
                      <SelectItem value='rest'>Rest Day</SelectItem>
                      <SelectItem value='assessment'>Assessment</SelectItem>
                      <SelectItem value='recovery'>Recovery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='difficulty'>Difficulty</Label>
                  <Select
                    value={newEvent.difficulty}
                    onValueChange={(value) =>
                      setNewEvent({
                        ...newEvent,
                        difficulty: value as CalendarEvent['difficulty'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='beginner'>Beginner</SelectItem>
                      <SelectItem value='intermediate'>Intermediate</SelectItem>
                      <SelectItem value='advanced'>Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='flex justify-end gap-2 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => setIsEventDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEvent}>Schedule Session</Button>
              </div>
            </div>
          ) : (
            selectedEvent && (
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  {getTypeBadge(selectedEvent.type)}
                  <h3 className='font-medium'>{selectedEvent.title}</h3>
                  {getStatusBadge(selectedEvent.status)}
                </div>

                {selectedEvent.description && (
                  <p className='text-sm text-gray-600'>
                    {selectedEvent.description}
                  </p>
                )}

                <div className='space-y-2 text-sm'>
                  <div className='flex items-center gap-2'>
                    <CalendarIcon className='h-4 w-4 text-gray-400' />
                    <span>{formatDate(selectedEvent.startTime)}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-gray-400' />
                    <span>
                      {formatTime(selectedEvent.startTime)} -{' '}
                      {formatTime(selectedEvent.endTime)}
                    </span>
                  </div>
                  {selectedEvent.location && (
                    <div className='flex items-center gap-2'>
                      <MapPin className='h-4 w-4 text-gray-400' />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                </div>

                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {selectedEvent.tags.map((tag) => (
                      <Badge key={tag} variant='secondary' className='text-xs'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className='flex justify-end gap-2 pt-4'>
                  {selectedEvent.status === 'scheduled' && (
                    <Button
                      onClick={() => handleEventAction(selectedEvent, 'start')}
                    >
                      <Play className='mr-2 h-4 w-4' />
                      Start
                    </Button>
                  )}
                  {selectedEvent.status === 'in_progress' && (
                    <Button
                      onClick={() =>
                        handleEventAction(selectedEvent, 'complete')
                      }
                    >
                      <CheckCircle2 className='mr-2 h-4 w-4' />
                      Complete
                    </Button>
                  )}
                  <Button
                    variant='outline'
                    onClick={() => handleEventAction(selectedEvent, 'edit')}
                  >
                    <Edit className='mr-2 h-4 w-4' />
                    Edit
                  </Button>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
