/**
 * Weekly Schedule Component
 * Mobile-first weekly schedule view with session management
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  Play, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Pause,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

import type { WorkoutSession, WorkoutPlan, SessionTemplate } from '@/types/workouts';

interface WeeklyScheduleProps {
  workoutPlan: WorkoutPlan;
  sessions: WorkoutSession[];
  availableTemplates: SessionTemplate[];
  isLoading?: boolean;
  error?: string | null;
  onCreateSession: (date: Date) => void;
  onStartSession: (sessionId: string) => void;
  onEditSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onRefresh?: () => void;
}

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  sessions: WorkoutSession[];
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

function getWeekDays(startDate: Date): WeekDay[] {
  const today = new Date();
  const week: WeekDay[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    week.push({
      date: new Date(date),
      dayName: DAYS_OF_WEEK[i],
      dayNumber: date.getDate(),
      isToday: isSameDay(date, today),
      sessions: [],
    });
  }
  
  return week;
}

function getMonday(date: Date): Date {
  const monday = new Date(date);
  const dayOfWeek = monday.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday being 0
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function SessionCard({ 
  session, 
  onStart, 
  onEdit, 
  onDelete 
}: { 
  session: WorkoutSession;
  onStart: (sessionId: string) => void;
  onEdit?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'active':
        return <Play className="h-3 w-3" />;
      case 'paused':
        return <Pause className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const canStart = session.status === 'scheduled';
  const canContinue = session.status === 'active' || session.status === 'paused';

  return (
    <Card className={`transition-shadow hover:shadow-md ${getStatusColor(session.status)} border`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm truncate">
              {session.sessionName || session.sessionTemplate?.name || 'Workout Session'}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-xs text-gray-600">
                {getStatusIcon(session.status)}
                <span className="ml-1 capitalize">{session.status}</span>
              </div>
              {session.estimatedDuration && (
                <div className="flex items-center text-xs text-gray-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {session.estimatedDuration}m
                </div>
              )}
            </div>
          </div>
          
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && session.status !== 'completed' && (
                  <DropdownMenuItem onClick={() => onEdit(session.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && session.status === 'scheduled' && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(session.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Exercises preview */}
        {session.sessionTemplate?.exerciseStructure && session.sessionTemplate.exerciseStructure.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1">
              {session.sessionTemplate.exerciseStructure.length} exercises
            </div>
          </div>
        )}

        {/* Action Button */}
        {canStart && (
          <Button
            size="sm"
            onClick={() => onStart(session.id)}
            className="w-full h-8 text-xs font-medium"
          >
            <Play className="mr-1 h-3 w-3" />
            Start
          </Button>
        )}
        {canContinue && (
          <Button
            size="sm"
            onClick={() => onStart(session.id)}
            className="w-full h-8 text-xs font-medium"
          >
            <Play className="mr-1 h-3 w-3" />
            Continue
          </Button>
        )}
        {session.status === 'completed' && (
          <Button
            size="sm"
            variant="outline"
            disabled
            className="w-full h-8 text-xs font-medium"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function WeeklySchedule({
  workoutPlan,
  sessions,
  availableTemplates,
  isLoading = false,
  error = null,
  onCreateSession,
  onStartSession,
  onEditSession,
  onDeleteSession,
  onRefresh,
}: WeeklyScheduleProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));

  const weekDays = useMemo(() => {
    const days = getWeekDays(currentWeekStart);
    
    // Group sessions by day
    days.forEach(day => {
      day.sessions = sessions.filter(session => {
        const sessionDate = new Date(session.scheduledDate);
        return isSameDay(sessionDate, day.date);
      });
    });
    
    return days;
  }, [currentWeekStart, sessions]);

  const handlePreviousWeek = useCallback(() => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  }, []);

  const handleToday = useCallback(() => {
    setCurrentWeekStart(getMonday(new Date()));
  }, []);

  const todaysSessions = useMemo(() => {
    const today = new Date();
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduledDate);
      return isSameDay(sessionDate, today);
    });
  }, [sessions]);

  const hasActiveSessions = todaysSessions.some(s => s.status === 'active' || s.status === 'paused');

  if (isLoading) {
    return (
      <LoadingState 
        message="Loading schedule..." 
        variant="centered"
        className="py-12"
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load schedule"
        description={error}
        variant="card"
        onRetry={onRefresh}
        className="mx-auto max-w-md"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm font-medium text-gray-700">
          {currentWeekStart.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
          })} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Today's Quick Actions */}
      {todaysSessions.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-blue-900">Today's Workouts</h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {todaysSessions.length} session{todaysSessions.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {todaysSessions.slice(0, 2).map((session) => (
                <Button
                  key={session.id}
                  size="sm"
                  variant={session.status === 'scheduled' ? 'default' : 'outline'}
                  onClick={() => onStartSession(session.id)}
                  className="h-10"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {session.status === 'scheduled' ? 'Start' : 'Continue'} {session.sessionName}
                </Button>
              ))}
              {todaysSessions.length > 2 && (
                <span className="text-sm text-blue-700 self-center">
                  +{todaysSessions.length - 2} more
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => (
          <div key={day.date.toISOString()} className="min-h-[120px]">
            {/* Day Header */}
            <div className={`text-center p-2 text-sm font-medium border-b ${
              day.isToday ? 'bg-blue-100 text-blue-900 border-blue-200' : 'text-gray-700 border-gray-200'
            }`}>
              <div>{day.dayName}</div>
              <div className={`text-xs ${day.isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                {day.dayNumber}
              </div>
            </div>

            {/* Day Content */}
            <div className="p-1 space-y-1">
              {/* Sessions */}
              {day.sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onStart={onStartSession}
                  onEdit={onEditSession}
                  onDelete={onDeleteSession}
                />
              ))}

              {/* Add Session Button */}
              {availableTemplates.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreateSession(day.date)}
                  className={`w-full h-8 text-xs border-2 border-dashed ${
                    day.sessions.length === 0 
                      ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}

              {/* Empty state for days without sessions */}
              {day.sessions.length === 0 && availableTemplates.length === 0 && (
                <div className="text-center py-4">
                  <div className="text-xs text-gray-400">Rest day</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Overview */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Week Overview</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {sessions.filter(s => {
                  const sessionDate = new Date(s.scheduledDate);
                  return sessionDate >= currentWeekStart && 
                         sessionDate < new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                }).length}
              </div>
              <div className="text-xs text-gray-600">Sessions This Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {sessions.filter(s => {
                  const sessionDate = new Date(s.scheduledDate);
                  return sessionDate >= currentWeekStart && 
                         sessionDate < new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000) &&
                         s.status === 'completed';
                }).length}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WeeklySchedule;