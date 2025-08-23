/**
 * Session Templates Step Component
 * Create and configure workout session templates with exercise selection
 */
'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dumbbell,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Timer,
  Target,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ExerciseSelector } from './exercise-selector';
import { useFormState } from './form-state-provider';
import type {
  CustomPlanFormData,
  SessionType,
  ExerciseType,
  ExercisePhase,
  FitnessLevel,
  SessionTemplate,
  ExerciseStructure,
} from '@/types/workouts';

interface SessionTemplatesStepProps {
  data: CustomPlanFormData;
  onUpdate: (updates: Partial<CustomPlanFormData>) => void;
}

const SESSION_TYPES: SessionType[] = ['workout', 'assessment', 'recovery'];
const EXERCISE_TYPES: ExerciseType[] = [
  'strength',
  'cardio',
  'flexibility',
  'sports',
];
const EXERCISE_PHASES: ExercisePhase[] = ['warm_up', 'main', 'cool_down'];
const FITNESS_LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'biceps',
  'triceps',
  'legs',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'abs',
  'cardio',
  'full_body',
];

// Predefined exercise templates based on the PDF structure
const EXERCISE_TEMPLATES = {
  lower_body_quad_focus: [
    {
      name: 'Leg Press',
      type: 'strength',
      sets: 4,
      repsMin: 12,
      repsMax: 15,
      rest: 120,
    },
    {
      name: 'Leg Extension',
      type: 'strength',
      sets: 4,
      repsMin: 12,
      repsMax: 15,
      rest: 90,
    },
    {
      name: 'Single Leg Press',
      type: 'strength',
      sets: 4,
      repsMin: 8,
      repsMax: 10,
      rest: 90,
    },
    {
      name: 'Single Leg Extension',
      type: 'strength',
      sets: 3,
      repsMin: 10,
      repsMax: 12,
      rest: 60,
    },
    {
      name: 'Hip Abduction',
      type: 'strength',
      sets: 3,
      repsMin: 12,
      repsMax: 15,
      rest: 60,
    },
    {
      name: 'Seated Calf Raises',
      type: 'strength',
      sets: 4,
      repsMin: 15,
      repsMax: 20,
      rest: 60,
    },
  ],
  upper_body_push: [
    {
      name: 'Chest Press',
      type: 'strength',
      sets: 4,
      repsMin: 10,
      repsMax: 12,
      rest: 90,
    },
    {
      name: 'Incline Press',
      type: 'strength',
      sets: 4,
      repsMin: 10,
      repsMax: 12,
      rest: 90,
    },
    {
      name: 'Shoulder Press',
      type: 'strength',
      sets: 4,
      repsMin: 10,
      repsMax: 12,
      rest: 90,
    },
    {
      name: 'Lateral Raises',
      type: 'strength',
      sets: 3,
      repsMin: 12,
      repsMax: 15,
      rest: 60,
    },
    {
      name: 'Tricep Extension',
      type: 'strength',
      sets: 4,
      repsMin: 10,
      repsMax: 12,
      rest: 75,
    },
    {
      name: 'Pec Deck',
      type: 'strength',
      sets: 3,
      repsMin: 12,
      repsMax: 15,
      rest: 60,
    },
  ],
};

export function SessionTemplatesStep({
  data,
  onUpdate,
}: SessionTemplatesStepProps) {
  const t = useTranslations('createPlan.steps.templates');
  const [editingTemplate, setEditingTemplate] =
    useState<SessionTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  function createNewTemplate(): SessionTemplate {
    return {
      id: `template_${Date.now()}`,
      name: '',
      description: '',
      sessionType: 'workout',
      estimatedDuration: data.estimatedSessionDuration,
      targetMuscleGroups: [],
      exerciseStructure: [],
      difficulty: data.targetFitnessLevel,
      equipmentRequired: [],
      notes: '',
    };
  }

  function addTemplate(template?: Partial<SessionTemplate>) {
    const newTemplate = { ...createNewTemplate(), ...template };
    const updatedTemplates = [...data.sessionTemplates, newTemplate];
    onUpdate({ sessionTemplates: updatedTemplates });

    if (!template) {
      setEditingTemplate(newTemplate);
      setIsDialogOpen(true);
    }
  }

  function updateTemplate(
    templateId: string,
    updates: Partial<SessionTemplate>
  ) {
    const updatedTemplates = data.sessionTemplates.map((template) =>
      template.id === templateId ? { ...template, ...updates } : template
    );
    onUpdate({ sessionTemplates: updatedTemplates });
  }

  function deleteTemplate(templateId: string) {
    const updatedTemplates = data.sessionTemplates.filter(
      (template) => template.id !== templateId
    );
    onUpdate({ sessionTemplates: updatedTemplates });
  }

  function duplicateTemplate(template: SessionTemplate) {
    const duplicated = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
    };
    addTemplate(duplicated);
  }

  function addPredefinedTemplate(templateType: string) {
    const exercises =
      EXERCISE_TEMPLATES[templateType as keyof typeof EXERCISE_TEMPLATES];

    const template: Partial<SessionTemplate> = {
      name: t(`predefined.${templateType}.name`),
      description: t(`predefined.${templateType}.description`),
      sessionType: 'workout',
      estimatedDuration: 70,
      targetMuscleGroups: templateType.includes('lower')
        ? ['legs', 'quadriceps', 'glutes']
        : ['chest', 'shoulders', 'arms'],
      difficulty: data.targetFitnessLevel,
      exerciseStructure: exercises.map((exercise, index) => ({
        id: `ex_${Date.now()}_${index}`,
        exerciseName: exercise.name,
        exerciseType: exercise.type as ExerciseType,
        phase: 'main' as ExercisePhase,
        sets: exercise.sets,
        repsMin: exercise.repsMin,
        repsMax: exercise.repsMax,
        restSeconds: exercise.rest,
        alternatives: [],
      })),
    };

    addTemplate(template);
  }

  function addExerciseToTemplate(
    templateId: string,
    exercise: ExerciseStructure
  ) {
    const template = data.sessionTemplates.find((t) => t.id === templateId);
    if (template) {
      const updatedExercises = [...template.exerciseStructure, exercise];
      updateTemplate(templateId, { exerciseStructure: updatedExercises });
    }
  }

  const handleTemplateEdit = (template: SessionTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, editingTemplate);
      setEditingTemplate(null);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header with actions */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-semibold text-gray-900'>{t('title')}</h3>
          <p className='mt-1 text-gray-600'>{t('description')}</p>
        </div>
        <div className='flex gap-2'>
          {/* Predefined Templates */}
          <Select onValueChange={addPredefinedTemplate}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder={t('predefined.select')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='lower_body_quad_focus'>
                {t('predefined.lower_body_quad_focus.name')}
              </SelectItem>
              <SelectItem value='upper_body_push'>
                {t('predefined.upper_body_push.name')}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => addTemplate()}>
            <Plus className='mr-2 h-4 w-4' />
            {t('actions.createNew')}
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      {data.sessionTemplates.length === 0 ? (
        <Card className='border-2 border-dashed border-gray-300'>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Dumbbell className='mb-4 h-12 w-12 text-gray-400' />
            <h3 className='mb-2 text-lg font-medium text-gray-900'>
              {t('empty.title')}
            </h3>
            <p className='mb-6 max-w-md text-center text-gray-600'>
              {t('empty.description')}
            </p>
            <div className='flex gap-2'>
              <Button
                onClick={() => addPredefinedTemplate('lower_body_quad_focus')}
                variant='outline'
              >
                {t('empty.useTemplate')}
              </Button>
              <Button onClick={() => addTemplate()}>
                {t('empty.createFromScratch')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {data.sessionTemplates.map((template) => (
            <Card
              key={template.id}
              className='transition-shadow hover:shadow-md'
            >
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='min-w-0 flex-1'>
                    <CardTitle className='truncate text-lg'>
                      {template.name || t('untitled')}
                    </CardTitle>
                    <CardDescription className='line-clamp-2'>
                      {template.description || t('noDescription')}
                    </CardDescription>
                  </div>
                  <div className='ml-2 flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleTemplateEdit(template)}
                    >
                      <Edit2 className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Template Stats */}
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <div className='flex items-center'>
                    <Timer className='mr-2 h-4 w-4 text-gray-500' />
                    <span>
                      {template.estimatedDuration} {t('stats.minutes')}
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <Dumbbell className='mr-2 h-4 w-4 text-gray-500' />
                    <span>
                      {template.exerciseStructure.length} {t('stats.exercises')}
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <Zap className='mr-2 h-4 w-4 text-gray-500' />
                    <Badge variant='secondary' className='text-xs'>
                      {t(`difficulty.${template.difficulty}`)}
                    </Badge>
                  </div>
                  <div className='flex items-center'>
                    <Target className='mr-2 h-4 w-4 text-gray-500' />
                    <span>
                      {template.targetMuscleGroups.length}{' '}
                      {t('stats.muscleGroups')}
                    </span>
                  </div>
                </div>

                {/* Target Muscle Groups */}
                {template.targetMuscleGroups.length > 0 && (
                  <div>
                    <div className='mb-1 text-xs text-gray-600'>
                      {t('fields.muscleGroups')}
                    </div>
                    <div className='flex flex-wrap gap-1'>
                      {template.targetMuscleGroups.slice(0, 3).map((group) => (
                        <Badge
                          key={group}
                          variant='outline'
                          className='text-xs'
                        >
                          {t(`muscleGroups.${group}`)}
                        </Badge>
                      ))}
                      {template.targetMuscleGroups.length > 3 && (
                        <Badge variant='outline' className='text-xs'>
                          +{template.targetMuscleGroups.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Exercise Preview */}
                {template.exerciseStructure.length > 0 && (
                  <div>
                    <div className='mb-1 text-xs text-gray-600'>
                      {t('exercisePreview')}
                    </div>
                    <div className='space-y-1 text-xs text-gray-800'>
                      {template.exerciseStructure
                        .slice(0, 3)
                        .map((exercise, index) => (
                          <div
                            key={exercise.id}
                            className='flex justify-between'
                          >
                            <span className='mr-2 truncate'>
                              {exercise.exerciseName}
                            </span>
                            <span className='whitespace-nowrap text-gray-500'>
                              {exercise.sets}×{exercise.repsMin}-
                              {exercise.repsMax}
                            </span>
                          </div>
                        ))}
                      {template.exerciseStructure.length > 3 && (
                        <div className='text-center text-gray-500'>
                          +{template.exerciseStructure.length - 3}{' '}
                          {t('moreExercises')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.name
                ? t('dialog.editTemplate')
                : t('dialog.createTemplate')}
            </DialogTitle>
            <DialogDescription>{t('dialog.description')}</DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <div className='space-y-6'>
              {/* Basic Info */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>{t('fields.name')}</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        name: e.target.value,
                      })
                    }
                    placeholder={t('fields.namePlaceholder')}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>{t('fields.duration')}</Label>
                  <Input
                    type='number'
                    value={editingTemplate.estimatedDuration}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        estimatedDuration: parseInt(e.target.value),
                      })
                    }
                    min='15'
                    max='180'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label>{t('fields.description')}</Label>
                <textarea
                  value={editingTemplate.description}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      description: e.target.value,
                    })
                  }
                  placeholder={t('fields.descriptionPlaceholder')}
                  className='w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-600'
                  rows={2}
                />
              </div>

              {/* Template Settings */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>{t('fields.sessionType')}</Label>
                  <Select
                    value={editingTemplate.sessionType}
                    onValueChange={(type: SessionType) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        sessionType: type,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`sessionType.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>{t('fields.difficulty')}</Label>
                  <Select
                    value={editingTemplate.difficulty}
                    onValueChange={(level: FitnessLevel) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        difficulty: level,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FITNESS_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {t(`difficulty.${level}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('dialog.cancel')}
                </Button>
                <Button onClick={handleSaveTemplate}>{t('dialog.save')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary */}
      <Card className='bg-gray-50'>
        <CardHeader>
          <CardTitle className='text-lg'>{t('summary.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4 text-center md:grid-cols-4'>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {data.sessionTemplates.length}
              </div>
              <div className='text-sm text-gray-600'>
                {t('summary.totalTemplates')}
              </div>
            </div>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {Math.round(
                  data.sessionTemplates.reduce(
                    (avg, template) => avg + template.estimatedDuration,
                    0
                  ) / data.sessionTemplates.length
                ) || 0}
              </div>
              <div className='text-sm text-gray-600'>
                {t('summary.avgDuration')}
              </div>
            </div>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {data.sessionTemplates.reduce(
                  (total, template) =>
                    total + template.exerciseStructure.length,
                  0
                )}
              </div>
              <div className='text-sm text-gray-600'>
                {t('summary.totalExercises')}
              </div>
            </div>
            <div>
              <div className='text-2xl font-bold text-gray-900'>
                {
                  [
                    ...new Set(
                      data.sessionTemplates.flatMap(
                        (template) => template.targetMuscleGroups
                      )
                    ),
                  ].length
                }
              </div>
              <div className='text-sm text-gray-600'>
                {t('summary.muscleGroupsCovered')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
