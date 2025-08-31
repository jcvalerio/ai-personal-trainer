/**
 * Mobile-Optimized Schedule Management Hook
 * Provides touch-friendly scheduling functionality as alternative to drag-and-drop
 */

import { useState, useCallback, useMemo } from 'react';
import type { DayScheduleType } from '@/types/workouts';

export interface MobileSessionItem {
  id: string;
  name: string;
  type: 'workout' | 'cardio' | 'strength' | 'hiit' | 'recovery' | 'rest';
  duration: number;
  scheduledDays: string[];
  templateId?: string;
  notes?: string;
}

export interface DaySchedule {
  day: string;
  sessionId: string;
  sessionName: string;
  type: DayScheduleType;
  duration: number;
}

export interface WeeklySchedule {
  [day: string]: DaySchedule[];
}

export interface ScheduleStats {
  totalSessions: number;
  totalDuration: number;
  avgSessionDuration: number;
  activeDays: number;
  restDays: number;
  sessionsByType: Record<string, number>;
}

interface UseMobileScheduleOptions {
  initialSchedule?: WeeklySchedule;
  onScheduleChange?: (schedule: WeeklySchedule) => void;
  maxSessionsPerDay?: number;
  minRestDays?: number;
}

export function useMobileSchedule({
  initialSchedule = {},
  onScheduleChange,
  maxSessionsPerDay = 2,
  minRestDays = 1,
}: UseMobileScheduleOptions = {}) {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(initialSchedule);
  const [sessions, setSessions] = useState<MobileSessionItem[]>([]);

  // Convert session to day schedules based on scheduledDays
  const sessionToDaySchedules = useCallback((session: MobileSessionItem): DaySchedule[] => {
    return session.scheduledDays.map((day) => ({
      day,
      sessionId: session.id,
      sessionName: session.name,
      type: mapSessionTypeToDayScheduleType(session.type),
      duration: session.duration,
    }));
  }, []);

  // Helper to map session types to day schedule types
  const mapSessionTypeToDayScheduleType = (
    type: MobileSessionItem['type']
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

  // Update weekly schedule when sessions change
  const updateWeeklySchedule = useCallback((updatedSessions: MobileSessionItem[]) => {
    const newWeeklySchedule: WeeklySchedule = {};
    
    // Clear existing schedule
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    daysOfWeek.forEach(day => {
      newWeeklySchedule[day] = [];
    });

    // Populate schedule from sessions
    updatedSessions.forEach(session => {
      const daySchedules = sessionToDaySchedules(session);
      daySchedules.forEach(schedule => {
        if (newWeeklySchedule[schedule.day]) {
          newWeeklySchedule[schedule.day].push(schedule);
        }
      });
    });

    setWeeklySchedule(newWeeklySchedule);
    onScheduleChange?.(newWeeklySchedule);
  }, [sessionToDaySchedules, onScheduleChange]);

  // Add or update a session
  const saveSession = useCallback((session: MobileSessionItem) => {
    setSessions(prev => {
      const existingIndex = prev.findIndex(s => s.id === session.id);
      const updatedSessions = existingIndex >= 0
        ? prev.map((s, idx) => idx === existingIndex ? session : s)
        : [...prev, session];
      
      // Update weekly schedule
      updateWeeklySchedule(updatedSessions);
      
      return updatedSessions;
    });
  }, [updateWeeklySchedule]);

  // Remove a session
  const removeSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updatedSessions = prev.filter(s => s.id !== sessionId);
      updateWeeklySchedule(updatedSessions);
      return updatedSessions;
    });
  }, [updateWeeklySchedule]);

  // Clone a session
  const cloneSession = useCallback((sessionId: string) => {
    const sessionToClone = sessions.find(s => s.id === sessionId);
    if (sessionToClone) {
      const clonedSession: MobileSessionItem = {
        ...sessionToClone,
        id: `session-${Date.now()}`,
        name: `${sessionToClone.name} (Copy)`,
        scheduledDays: [], // Clear scheduled days for manual re-assignment
      };
      saveSession(clonedSession);
      return clonedSession;
    }
    return null;
  }, [sessions, saveSession]);

  // Move session to different days
  const rescheduleSession = useCallback((sessionId: string, newDays: string[]) => {
    setSessions(prev => {
      const updatedSessions = prev.map(session => 
        session.id === sessionId 
          ? { ...session, scheduledDays: newDays }
          : session
      );
      updateWeeklySchedule(updatedSessions);
      return updatedSessions;
    });
  }, [updateWeeklySchedule]);

  // Validate schedule constraints
  const validateSchedule = useCallback((testSessions?: MobileSessionItem[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } => {
    const sessionsToCheck = testSessions || sessions;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Create temporary schedule for validation
    const tempSchedule: WeeklySchedule = {};
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    daysOfWeek.forEach(day => {
      tempSchedule[day] = [];
    });

    sessionsToCheck.forEach(session => {
      session.scheduledDays.forEach(day => {
        if (tempSchedule[day]) {
          tempSchedule[day].push({
            day,
            sessionId: session.id,
            sessionName: session.name,
            type: mapSessionTypeToDayScheduleType(session.type),
            duration: session.duration,
          });
        }
      });
    });

    // Check max sessions per day
    daysOfWeek.forEach(day => {
      const daySchedule = tempSchedule[day];
      if (daySchedule && daySchedule.length > maxSessionsPerDay) {
        errors.push(`${day} has ${daySchedule.length} sessions (max ${maxSessionsPerDay})`);
      }
    });

    // Check minimum rest days
    const activeDays = daysOfWeek.filter(day => {
      const daySchedule = tempSchedule[day];
      return daySchedule && daySchedule.length > 0;
    }).length;
    
    const restDays = 7 - activeDays;
    if (restDays < minRestDays) {
      warnings.push(`Only ${restDays} rest days (recommended minimum: ${minRestDays})`);
    }

    // Check for very long days (>2 hours total)
    daysOfWeek.forEach(day => {
      const daySchedule = tempSchedule[day];
      if (daySchedule) {
        const totalDuration = daySchedule.reduce((sum, session) => sum + session.duration, 0);
        if (totalDuration > 120) {
          warnings.push(`${day} has ${totalDuration} minutes of sessions (>2 hours)`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [sessions, maxSessionsPerDay, minRestDays]);

  // Calculate schedule statistics
  const scheduleStats = useMemo((): ScheduleStats => {
    const workoutSessions = sessions.filter(s => s.type !== 'rest');
    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (session.duration * session.scheduledDays.length);
    }, 0);

    const activeDays = new Set();
    sessions.forEach(session => {
      session.scheduledDays.forEach(day => activeDays.add(day));
    });

    const sessionsByType = sessions.reduce((acc, session) => {
      const count = session.scheduledDays.length;
      acc[session.type] = (acc[session.type] || 0) + count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSessions: sessions.length,
      totalDuration,
      avgSessionDuration: workoutSessions.length 
        ? Math.round(
            workoutSessions.reduce((sum, s) => sum + s.duration, 0) / workoutSessions.length
          )
        : 0,
      activeDays: activeDays.size,
      restDays: 7 - activeDays.size,
      sessionsByType,
    };
  }, [sessions]);

  // Get sessions for a specific day
  const getSessionsForDay = useCallback((day: string): MobileSessionItem[] => {
    return sessions.filter(session => session.scheduledDays.includes(day));
  }, [sessions]);

  // Get available time slots for a day
  const getAvailableTimeSlots = useCallback((day: string): { start: string; end: string }[] => {
    const daySession = getSessionsForDay(day);
    const totalScheduledTime = daySession.reduce((sum, session) => sum + session.duration, 0);
    const availableTime = Math.max(0, 480 - totalScheduledTime); // 8 hours max per day
    
    // Simple implementation - return available time as one slot
    if (availableTime > 0) {
      return [{ start: '08:00', end: `${Math.floor(8 + availableTime / 60)}:${(availableTime % 60).toString().padStart(2, '0')}` }];
    }
    
    return [];
  }, [getSessionsForDay]);

  // Quick schedule generators
  const generateBasicSchedule = useCallback((
    pattern: 'beginner' | 'intermediate' | 'advanced'
  ): MobileSessionItem[] => {
    const baseId = Date.now();
    
    switch (pattern) {
      case 'beginner':
        return [
          {
            id: `session-${baseId}-1`,
            name: 'Full Body Workout',
            type: 'strength',
            duration: 45,
            scheduledDays: ['monday', 'wednesday', 'friday'],
          },
          {
            id: `session-${baseId}-2`,
            name: 'Light Cardio',
            type: 'cardio',
            duration: 30,
            scheduledDays: ['tuesday', 'thursday'],
          },
        ];
        
      case 'intermediate':
        return [
          {
            id: `session-${baseId}-1`,
            name: 'Upper Body',
            type: 'strength',
            duration: 60,
            scheduledDays: ['monday', 'thursday'],
          },
          {
            id: `session-${baseId}-2`,
            name: 'Lower Body',
            type: 'strength',
            duration: 60,
            scheduledDays: ['tuesday', 'friday'],
          },
          {
            id: `session-${baseId}-3`,
            name: 'HIIT Cardio',
            type: 'hiit',
            duration: 30,
            scheduledDays: ['wednesday', 'saturday'],
          },
        ];
        
      case 'advanced':
        return [
          {
            id: `session-${baseId}-1`,
            name: 'Push Day',
            type: 'strength',
            duration: 75,
            scheduledDays: ['monday', 'thursday'],
          },
          {
            id: `session-${baseId}-2`,
            name: 'Pull Day',
            type: 'strength',
            duration: 75,
            scheduledDays: ['tuesday', 'friday'],
          },
          {
            id: `session-${baseId}-3`,
            name: 'Leg Day',
            type: 'strength',
            duration: 90,
            scheduledDays: ['wednesday', 'saturday'],
          },
          {
            id: `session-${baseId}-4`,
            name: 'Active Recovery',
            type: 'recovery',
            duration: 30,
            scheduledDays: ['sunday'],
          },
        ];
        
      default:
        return [];
    }
  }, []);

  const applySchedulePattern = useCallback((
    pattern: 'beginner' | 'intermediate' | 'advanced'
  ) => {
    const newSessions = generateBasicSchedule(pattern);
    setSessions(newSessions);
    updateWeeklySchedule(newSessions);
  }, [generateBasicSchedule, updateWeeklySchedule]);

  return {
    // State
    sessions,
    weeklySchedule,
    scheduleStats,
    
    // Actions
    saveSession,
    removeSession,
    cloneSession,
    rescheduleSession,
    
    // Utilities
    validateSchedule,
    getSessionsForDay,
    getAvailableTimeSlots,
    
    // Quick generators
    applySchedulePattern,
    generateBasicSchedule,
  };
}