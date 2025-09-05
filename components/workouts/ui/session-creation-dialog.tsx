/**
 * Session Creation Dialog
 * Mobile-first dialog for creating workout sessions from templates
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, Dumbbell, Plus, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SelectableCard } from './selectable-card';
import { ErrorState } from '@/components/ui/error-state';

import type { SessionTemplate, WorkoutPlan, CreateWorkoutSessionRequest, ExercisePhase } from '@/types/workouts';
import { createWorkoutSession } from '@/lib/api/workout-sessions';

interface SessionCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (sessionId: string) => void;
  workoutPlan: WorkoutPlan;
  selectedDate?: Date;
  availableTemplates: SessionTemplate[];
}

interface SessionFormData {
  templateId: string;
  sessionName: string;
  scheduledDate: string;
  estimatedDuration: number;
  notes: string;
}

export function SessionCreationDialog({
  isOpen,
  onClose,
  onSessionCreated,
  workoutPlan,
  selectedDate = new Date(),
  availableTemplates,
}: SessionCreationDialogProps) {
  const [formData, setFormData] = useState<SessionFormData>({
    templateId: '',
    sessionName: '',
    scheduledDate: selectedDate.toISOString().split('T')[0],
    estimatedDuration: 60,
    notes: '',
  });

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedTemplate = useMemo(() => {
    return availableTemplates.find(t => t.id === formData.templateId);
  }, [availableTemplates, formData.templateId]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        sessionName: template.name,
        estimatedDuration: template.estimatedDuration,
      }));
    }
  }, [availableTemplates]);

  // Emergency templates for quick start when no templates exist
  const emergencyTemplates = useMemo(() => ({
    full_body: {
      id: 'emergency-full-body',
      name: 'Full Body Workout',
      description: 'Complete full body workout for any fitness level',
      sessionType: 'workout' as const,
      estimatedDuration: 30,
      targetMuscleGroups: ['chest', 'legs', 'core', 'shoulders'],
      difficulty: 'beginner' as const,
      equipmentRequired: [],
      exerciseStructure: [
        {
          id: 'ex1',
          exerciseName: 'Push-ups',
          exerciseType: 'strength' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 60,
          alternatives: ['Modified Push-ups', 'Wall Push-ups']
        },
        {
          id: 'ex2',
          exerciseName: 'Bodyweight Squats',
          exerciseType: 'strength' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 10,
          repsMax: 15,
          restSeconds: 60,
          alternatives: ['Chair Squats', 'Half Squats']
        },
        {
          id: 'ex3',
          exerciseName: 'Plank',
          exerciseType: 'strength' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 1,
          repsMax: 1,
          durationSeconds: 45,
          restSeconds: 60,
          alternatives: ['Modified Plank', 'Wall Plank']
        },
        {
          id: 'ex4',
          exerciseName: 'Mountain Climbers',
          exerciseType: 'cardio' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 20,
          repsMax: 30,
          restSeconds: 60,
          alternatives: ['Marching in Place', 'Step-ups']
        },
      ]
    },
    upper_body: {
      id: 'emergency-upper-body',
      name: 'Upper Body Focus',
      description: 'Upper body strength and endurance workout',
      sessionType: 'workout' as const,
      estimatedDuration: 20,
      targetMuscleGroups: ['chest', 'shoulders', 'arms'],
      difficulty: 'beginner' as const,
      equipmentRequired: [],
      exerciseStructure: [
        {
          id: 'ex1',
          exerciseName: 'Push-ups',
          exerciseType: 'strength' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 8,
          repsMax: 15,
          restSeconds: 60,
          alternatives: ['Modified Push-ups', 'Wall Push-ups']
        },
        {
          id: 'ex2',
          exerciseName: 'Pike Push-ups',
          exerciseType: 'strength' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 5,
          repsMax: 10,
          restSeconds: 60,
          alternatives: ['Wall Push-ups', 'Incline Push-ups']
        },
        {
          id: 'ex3',
          exerciseName: 'Tricep Dips',
          exerciseType: 'strength' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 60,
          alternatives: ['Chair Dips', 'Wall Push-offs']
        },
      ]
    },
    lower_body: {
      id: 'emergency-lower-body',
      name: 'Lower Body Focus',
      description: 'Lower body strength and power workout',
      sessionType: 'workout' as const,
      estimatedDuration: 25,
      targetMuscleGroups: ['legs', 'glutes', 'calves'],
      difficulty: 'beginner' as const,
      equipmentRequired: [],
      exerciseStructure: [
        {
          id: 'ex1',
          exerciseName: 'Bodyweight Squats',
          exerciseType: 'strength' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 12,
          repsMax: 20,
          restSeconds: 60,
          alternatives: ['Chair Squats', 'Half Squats']
        },
        {
          id: 'ex2',
          exerciseName: 'Lunges',
          exerciseType: 'strength' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 10,
          repsMax: 15,
          restSeconds: 60,
          alternatives: ['Static Lunges', 'Step-back Lunges']
        },
        {
          id: 'ex3',
          exerciseName: 'Wall Sit',
          exerciseType: 'strength' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 1,
          repsMax: 1,
          durationSeconds: 45,
          restSeconds: 60,
          alternatives: ['Chair Sit', 'Partial Wall Sit']
        },
        {
          id: 'ex4',
          exerciseName: 'Calf Raises',
          exerciseType: 'strength' as const,
          phase: 'main' as const,
          sets: 3,
          repsMin: 15,
          repsMax: 25,
          restSeconds: 45,
          alternatives: ['Single Leg Calf Raises', 'Seated Calf Raises']
        },
      ]
    }
  }), []);

  const handleQuickStartWorkout = useCallback(async (templateType: 'full_body' | 'upper_body' | 'lower_body') => {
    const template = emergencyTemplates[templateType];
    setIsCreating(true);
    setCreateError(null);

    try {
      const today = new Date();
      const createRequest: CreateWorkoutSessionRequest = {
        name: `${template.name || 'Quick Workout'} - ${today.toLocaleDateString()}`,
        workoutPlanId: workoutPlan.id,
        sessionType: 'workout',
        scheduledDate: today.toISOString(),
        scheduledDuration: template.estimatedDuration,
        sessionData: {
          totalExercises: template.exerciseStructure.length,
          estimatedDuration: template.estimatedDuration,
          targetMuscleGroups: template.targetMuscleGroups,
          equipmentNeeded: template.equipmentRequired || [],
          difficultyLevel: template.difficulty,
        },
        warmUpExercises: template.exerciseStructure
          .filter(exercise => exercise.phase === 'warm_up')
          .map((exercise, index) => ({
            exerciseId: exercise.exerciseId || exercise.id,
            orderIndex: index,
            exercisePhase: exercise.phase as ExercisePhase,
            plannedSets: exercise.sets || 1,
            plannedReps: exercise.repsMin || 1,
            plannedWeightKg: undefined,
            plannedDurationSeconds: exercise.durationSeconds || undefined,
            plannedRestSeconds: exercise.restSeconds || 60,
            equipmentAlternatives: exercise.alternatives || [],
          })),
        mainExercises: template.exerciseStructure
          .filter(exercise => exercise.phase === 'main')
          .map((exercise, index) => ({
            exerciseId: exercise.exerciseId || exercise.id,
            orderIndex: index,
            exercisePhase: exercise.phase as ExercisePhase,
            plannedSets: exercise.sets || 1,
            plannedReps: exercise.repsMin || 1,
            plannedWeightKg: undefined,
            plannedDurationSeconds: exercise.durationSeconds || undefined,
            plannedRestSeconds: exercise.restSeconds || 60,
            equipmentAlternatives: exercise.alternatives || [],
          })),
        coolDownExercises: template.exerciseStructure
          .filter(exercise => exercise.phase === 'cool_down')
          .map((exercise, index) => ({
            exerciseId: exercise.exerciseId || exercise.id,
            orderIndex: index,
            exercisePhase: exercise.phase as ExercisePhase,
            plannedSets: exercise.sets || 1,
            plannedReps: exercise.repsMin || 1,
            plannedWeightKg: undefined,
            plannedDurationSeconds: exercise.durationSeconds || undefined,
            plannedRestSeconds: exercise.restSeconds || 60,
            equipmentAlternatives: exercise.alternatives || [],
          })),
      };

      const response = await createWorkoutSession(createRequest);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create session');
      }

      onSessionCreated(response.data!.id);
      onClose();
    } catch (error) {
      console.error('Failed to create quick workout session:', error);
      setCreateError(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  }, [workoutPlan.id, emergencyTemplates, onSessionCreated, onClose]);

  const handleFormChange = useCallback((field: keyof SessionFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleCreateSession = useCallback(async () => {
    if (!selectedTemplate || isCreating) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const createRequest: CreateWorkoutSessionRequest = {
        name: formData.sessionName.trim() || selectedTemplate.name || 'Workout Session',
        workoutPlanId: workoutPlan.id,
        sessionType: 'workout',
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        scheduledDuration: formData.estimatedDuration,
        sessionData: {
          totalExercises: selectedTemplate.exerciseStructure.length,
          estimatedDuration: formData.estimatedDuration,
          targetMuscleGroups: selectedTemplate.targetMuscleGroups,
          equipmentNeeded: selectedTemplate.equipmentRequired || [],
          difficultyLevel: selectedTemplate.difficulty,
        },
        warmUpExercises: selectedTemplate.exerciseStructure
          .filter(exercise => exercise.phase === 'warm_up')
          .map((exercise, index) => ({
            exerciseId: exercise.exerciseId || exercise.id,
            orderIndex: index,
            exercisePhase: exercise.phase as ExercisePhase,
            plannedSets: exercise.sets || 1,
            plannedReps: exercise.repsMin || 1,
            plannedWeightKg: undefined,
            plannedDurationSeconds: exercise.durationSeconds || undefined,
            plannedRestSeconds: exercise.restSeconds || 60,
            equipmentAlternatives: exercise.alternatives || [],
          })),
        mainExercises: selectedTemplate.exerciseStructure
          .filter(exercise => exercise.phase === 'main')
          .map((exercise, index) => ({
            exerciseId: exercise.exerciseId || exercise.id,
            orderIndex: index,
            exercisePhase: exercise.phase as ExercisePhase,
            plannedSets: exercise.sets || 1,
            plannedReps: exercise.repsMin || 1,
            plannedWeightKg: undefined,
            plannedDurationSeconds: exercise.durationSeconds || undefined,
            plannedRestSeconds: exercise.restSeconds || 60,
            equipmentAlternatives: exercise.alternatives || [],
          })),
        coolDownExercises: selectedTemplate.exerciseStructure
          .filter(exercise => exercise.phase === 'cool_down')
          .map((exercise, index) => ({
            exerciseId: exercise.exerciseId || exercise.id,
            orderIndex: index,
            exercisePhase: exercise.phase as ExercisePhase,
            plannedSets: exercise.sets || 1,
            plannedReps: exercise.repsMin || 1,
            plannedWeightKg: undefined,
            plannedDurationSeconds: exercise.durationSeconds || undefined,
            plannedRestSeconds: exercise.restSeconds || 60,
            equipmentAlternatives: exercise.alternatives || [],
          })),
      };

      const response = await fetch('/api/workouts/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createRequest),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create session');
      }

      onSessionCreated(result.data.id);
      onClose();

      // Reset form
      setFormData({
        templateId: '',
        sessionName: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        estimatedDuration: 60,
        notes: '',
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      setCreateError(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  }, [selectedTemplate, formData, workoutPlan.id, onSessionCreated, onClose, selectedDate, isCreating]);

  const isFormValid = formData.templateId && formData.sessionName.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        mobileMode="bottomSheet" 
        className="bg-white p-0 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader className="p-4 pb-0 md:p-6">
          <DialogTitle className="text-center md:text-left">
            Create New Session
          </DialogTitle>
          <DialogDescription className="text-center md:text-left">
            Choose a template and schedule your workout session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-4 md:p-6">
          {/* Template Selection */}
          <section className="space-y-4">
            <h3 className="border-b pb-2 text-lg font-semibold text-gray-900">
              Choose Template
            </h3>
            
            {(!availableTemplates || availableTemplates.length === 0) ? (
              <div className="text-center py-6 bg-gradient-to-b from-blue-50 to-purple-50 rounded-lg border-2 border-blue-100">
                <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Ready to Start Your Workout?</h3>
                <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
                  Choose from our quick-start templates to begin your fitness journey
                </p>
                
                {/* Quick Start Options - Enhanced Visual Design */}
                <div className="space-y-3 mb-6">
                  <SelectableCard
                    selected={false}
                    onClick={() => handleQuickStartWorkout('full_body')}
                    title="Full Body Workout"
                    description="Complete workout • 30 minutes"
                    icon={<Dumbbell className="h-5 w-5 text-green-600" />}
                    badge={{ text: "Beginner", variant: "outline" }}
                    metadata={["No Equipment"]}
                    className="hover:shadow-md transition-all bg-white"
                  />
                  
                  <SelectableCard
                    selected={false}
                    onClick={() => handleQuickStartWorkout('upper_body')}
                    title="Upper Body Focus"
                    description="Chest, shoulders & arms • 20 minutes"
                    icon={<Target className="h-5 w-5 text-blue-600" />}
                    badge={{ text: "Beginner", variant: "outline" }}
                    metadata={["No Equipment"]}
                    className="hover:shadow-md transition-all bg-white"
                  />
                  
                  <SelectableCard
                    selected={false}
                    onClick={() => handleQuickStartWorkout('lower_body')}
                    title="Lower Body Focus"
                    description="Legs, glutes & core • 25 minutes"
                    icon={<Calendar className="h-5 w-5 text-purple-600" />}
                    badge={{ text: "Beginner", variant: "outline" }}
                    metadata={["No Equipment"]}
                    className="hover:shadow-md transition-all bg-white"
                  />
                </div>
                
                <Button 
                  variant="ghost" 
                  onClick={() => onClose()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel and create custom templates later
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {availableTemplates.map((template) => (
                  <SelectableCard
                    key={template.id}
                    selected={formData.templateId === template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    title={template.name}
                    description={template.description}
                    icon={<Dumbbell className="h-5 w-5 text-blue-600" />}
                    badge={{ 
                      text: template.difficulty, 
                      variant: template.difficulty === 'advanced' ? 'destructive' : template.difficulty === 'intermediate' ? 'default' : 'secondary'
                    }}
                    metadata={[
                      `${template.estimatedDuration} min`,
                      `${template.exerciseStructure.length} exercises`
                    ]}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Session Details */}
          {selectedTemplate && (
            <section className="space-y-4">
              <h3 className="border-b pb-2 text-lg font-semibold text-gray-900">
                Session Details
              </h3>

              {/* Session Name */}
              <div>
                <Label htmlFor="sessionName" className="text-base font-medium">
                  Session Name
                </Label>
                <Input
                  id="sessionName"
                  value={formData.sessionName}
                  onChange={(e) => handleFormChange('sessionName', e.target.value)}
                  placeholder="Enter session name"
                  className="mt-2 h-12 text-base"
                />
              </div>

              {/* Scheduled Date */}
              <div>
                <Label htmlFor="scheduledDate" className="text-base font-medium">
                  Scheduled Date
                </Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleFormChange('scheduledDate', e.target.value)}
                  className="mt-2 h-12 text-base"
                />
              </div>

              {/* Duration */}
              <div>
                <Label htmlFor="duration" className="text-base font-medium">
                  Estimated Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  value={formData.estimatedDuration}
                  onChange={(e) => handleFormChange('estimatedDuration', parseInt(e.target.value) || 60)}
                  className="mt-2 h-12 text-base"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-base font-medium">
                  Notes (Optional)
                </Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Add any notes for this session..."
                  className="mt-2 h-12 text-base"
                />
              </div>

              {/* Template Preview */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Template Preview</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exercises:</span>
                      <span className="font-medium">{selectedTemplate.exerciseStructure.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Duration:</span>
                      <span className="font-medium">{selectedTemplate.estimatedDuration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <Badge 
                        variant={selectedTemplate.difficulty === 'advanced' ? 'destructive' : selectedTemplate.difficulty === 'intermediate' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {selectedTemplate.difficulty}
                      </Badge>
                    </div>
                    {selectedTemplate.targetMuscleGroups.length > 0 && (
                      <div>
                        <span className="text-gray-600 block mb-1">Target Muscles:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedTemplate.targetMuscleGroups.slice(0, 4).map((muscle) => (
                            <Badge key={muscle} variant="outline" className="text-xs capitalize">
                              {muscle}
                            </Badge>
                          ))}
                          {selectedTemplate.targetMuscleGroups.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{selectedTemplate.targetMuscleGroups.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Error Display */}
          {createError && (
            <ErrorState
              message="Failed to create session"
              description={createError}
              variant="card"
              onRetry={handleCreateSession}
              className="my-4"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 border-t px-4 pb-4 pt-4 md:px-6 md:pb-6">
          <Button
            onClick={handleCreateSession}
            disabled={!isFormValid || isCreating}
            className="h-12 flex-1 touch-manipulation text-base font-medium"
            size="lg"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 mr-2 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Session
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isCreating}
            className="h-12 touch-manipulation px-6 text-base font-medium"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SessionCreationDialog;