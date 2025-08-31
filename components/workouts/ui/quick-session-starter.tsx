/**
 * Quick Session Starter Component
 * Provides quick access to start today's workout or create a new session
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Play, Plus, Calendar, Clock, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SelectableCard } from './selectable-card';
import { LoadingState } from '@/components/ui/loading-state';

import { createWorkoutSession } from '@/lib/api/workout-sessions';
import type { WorkoutSession, WorkoutPlan, SessionTemplate, CreateWorkoutSessionRequest } from '@/types/workouts';

interface QuickSessionStarterProps {
  workoutPlan: WorkoutPlan;
  todaysSessions: WorkoutSession[];
  availableTemplates: SessionTemplate[];
  onSessionCreated: (sessionId: string) => void;
  onStartSession: (sessionId: string) => void;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

export function QuickSessionStarter({
  workoutPlan,
  todaysSessions,
  availableTemplates,
  onSessionCreated,
  onStartSession,
}: QuickSessionStarterProps) {
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Filter sessions for today
  const todaysActiveSessions = useMemo(() => {
    const today = new Date();
    return todaysSessions.filter(session => {
      const sessionDate = new Date(session.scheduledDate);
      return isSameDay(sessionDate, today) && 
             (session.status === 'active' || session.status === 'paused' || session.status === 'scheduled');
    });
  }, [todaysSessions]);

  const todaysCompletedSessions = useMemo(() => {
    const today = new Date();
    return todaysSessions.filter(session => {
      const sessionDate = new Date(session.scheduledDate);
      return isSameDay(sessionDate, today) && session.status === 'completed';
    });
  }, [todaysSessions]);

  // Get suggested templates based on plan's weekly schedule
  const suggestedTemplates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[dayOfWeek];
    
    // Try to match templates based on plan's weekly schedule or default muscle group patterns
    const dayBasedSuggestions = availableTemplates.filter(template => {
      const templateName = template.name.toLowerCase();
      
      // Match specific day patterns
      if (templateName.includes(todayName)) return true;
      
      // Match common workout split patterns
      switch (dayOfWeek) {
        case 1: // Monday - often chest/push or full body
          return templateName.includes('push') || 
                 templateName.includes('chest') || 
                 templateName.includes('full body');
        case 2: // Tuesday - often legs or pull
          return templateName.includes('leg') || 
                 templateName.includes('pull') || 
                 templateName.includes('back');
        case 3: // Wednesday - often push or functional
          return templateName.includes('push') || 
                 templateName.includes('functional') ||
                 templateName.includes('cardio');
        case 4: // Thursday - often legs or pull
          return templateName.includes('leg') || 
                 templateName.includes('pull');
        case 5: // Friday - often push or full body
          return templateName.includes('push') || 
                 templateName.includes('full body') ||
                 templateName.includes('upper');
        case 6: // Saturday - often functional or cardio
          return templateName.includes('functional') || 
                 templateName.includes('cardio') ||
                 templateName.includes('hiit');
        case 0: // Sunday - often rest or light cardio
          return templateName.includes('recovery') || 
                 templateName.includes('cardio') ||
                 templateName.includes('mobility');
        default:
          return false;
      }
    });
    
    // If no day-based suggestions, return first few templates
    return dayBasedSuggestions.length > 0 
      ? dayBasedSuggestions.slice(0, 3)
      : availableTemplates.slice(0, 3);
  }, [availableTemplates]);

  const handleQuickCreate = useCallback(async () => {
    if (!selectedTemplateId || isCreating) return;

    const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId);
    if (!selectedTemplate) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const today = new Date();
      const createRequest: CreateWorkoutSessionRequest = {
        planId: workoutPlan.id,
        sessionName: selectedTemplate.name,
        scheduledDate: today.toISOString(),
        sessionTemplate: selectedTemplate,
        estimatedDuration: selectedTemplate.estimatedDuration,
        notes: 'Quick-created for today',
      };

      const response = await createWorkoutSession(createRequest);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create session');
      }

      onSessionCreated(response.data!.id);
      setIsQuickCreateOpen(false);
      setSelectedTemplateId('');
    } catch (error) {
      console.error('Failed to create session:', error);
      setCreateError(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  }, [selectedTemplateId, availableTemplates, workoutPlan.id, onSessionCreated, isCreating]);

  // If there are active sessions today, show them
  if (todaysActiveSessions.length > 0) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-900 flex items-center">
            <Play className="mr-2 h-5 w-5" />
            Today's Workouts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysActiveSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {session.sessionName || session.sessionTemplate?.name || 'Workout Session'}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <Badge 
                    variant={session.status === 'active' ? 'default' : 
                            session.status === 'paused' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {session.status}
                  </Badge>
                  {session.estimatedDuration && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {session.estimatedDuration}m
                    </div>
                  )}
                  {session.sessionTemplate?.exerciseStructure && (
                    <div className="flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      {session.sessionTemplate.exerciseStructure.length} exercises
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={() => onStartSession(session.id)}
                className="ml-3 h-10 px-4"
              >
                <Play className="h-4 w-4 mr-2" />
                {session.status === 'scheduled' ? 'Start' : 'Continue'}
              </Button>
            </div>
          ))}

          {/* Show completed sessions count */}
          {todaysCompletedSessions.length > 0 && (
            <div className="text-center text-sm text-gray-600 pt-2 border-t">
              ✅ {todaysCompletedSessions.length} session{todaysCompletedSessions.length !== 1 ? 's' : ''} completed today
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // If no sessions today but there are completed sessions, show achievement
  if (todaysCompletedSessions.length > 0) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="font-semibold text-green-900 mb-2">
            Great Job Today!
          </h3>
          <p className="text-green-700 mb-4">
            You've completed {todaysCompletedSessions.length} workout{todaysCompletedSessions.length !== 1 ? 's' : ''} today
          </p>
          <Button
            variant="outline"
            onClick={() => setIsQuickCreateOpen(true)}
            className="border-green-200 hover:bg-green-100"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No sessions today - show quick start options
  return (
    <>
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-orange-900 flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Start Today's Workout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-orange-700 text-sm">
            No workouts scheduled for today. Start a session now!
          </p>
          
          {/* Quick suggestions */}
          {suggestedTemplates.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-orange-900 text-sm">Suggested for today:</h4>
              <div className="grid gap-2">
                {suggestedTemplates.slice(0, 2).map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      handleQuickCreate();
                    }}
                    disabled={isCreating}
                    className="justify-start h-auto p-3 border-orange-200 hover:bg-orange-100"
                  >
                    <div className="flex items-center w-full">
                      <div className="rounded-lg bg-orange-100 p-2 mr-3">
                        <Play className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {template.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <span>{template.estimatedDuration}m</span>
                          <span>•</span>
                          <span>{template.exerciseStructure.length} exercises</span>
                          <Badge variant="outline" className="text-xs">
                            {template.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setIsQuickCreateOpen(true)}
              className="flex-1"
              disabled={availableTemplates.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Choose Workout
            </Button>
          </div>

          {availableTemplates.length === 0 && (
            <p className="text-xs text-gray-500 text-center">
              Create session templates first to start workouts
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Create Dialog */}
      <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
        <DialogContent mobileMode="bottomSheet" className="bg-white p-0 shadow-xl max-w-lg">
          <DialogHeader className="p-4 pb-0 md:p-6">
            <DialogTitle>Start Today's Workout</DialogTitle>
            <DialogDescription>
              Choose a workout template to start your session
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 md:p-6 space-y-4">
            {availableTemplates.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Templates Available</h3>
                <p className="text-gray-600 text-sm">
                  Create session templates first to start workouts
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableTemplates.map((template) => (
                  <SelectableCard
                    key={template.id}
                    selected={selectedTemplateId === template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className="p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 flex-shrink-0">
                        <Play className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {template.estimatedDuration} min
                          </div>
                          <div className="flex items-center">
                            <Target className="mr-1 h-3 w-3" />
                            {template.exerciseStructure.length} exercises
                          </div>
                          <Badge 
                            variant={template.difficulty === 'advanced' ? 'destructive' : 
                                    template.difficulty === 'intermediate' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {template.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </SelectableCard>
                ))}
              </div>
            )}

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{createError}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t px-4 pb-4 pt-4 md:px-6 md:pb-6">
            <Button
              onClick={handleQuickCreate}
              disabled={!selectedTemplateId || isCreating || availableTemplates.length === 0}
              className="h-12 flex-1 touch-manipulation text-base font-medium"
              size="lg"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 mr-2 border-b-2 border-white"></div>
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Workout
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsQuickCreateOpen(false)}
              disabled={isCreating}
              className="h-12 touch-manipulation px-6 text-base font-medium"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default QuickSessionStarter;