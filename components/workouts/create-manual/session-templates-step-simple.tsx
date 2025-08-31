/**
 * Session Templates Step Component
 * Create and configure workout session templates with exercise selection
 */
'use client';

import React, { useState, useCallback, useMemo, useId } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dumbbell,
  Plus,
  Edit2,
  Trash2,
  Timer,
  Target,
  Zap,
  BookOpen,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SelectableCard } from '@/components/workouts/ui/selectable-card';
import {
  MobileSlider,
  type SliderConfig,
} from '@/components/workouts/ui/schedule-sliders';

import { ExerciseSelector } from './exercise-selector';
import { useFormState } from './form-state-provider';
import type { SessionTemplate, ExerciseStructure } from '@/types/workouts';

// Conversion between ExerciseStructure and ExerciseConfig for compatibility
interface ExerciseConfig {
  exerciseId: string;
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
}

// Convert ExerciseStructure to ExerciseConfig
const exerciseStructureToConfig = (
  structure: ExerciseStructure
): ExerciseConfig => ({
  exerciseId: structure.exerciseId || structure.id,
  sets: structure.sets,
  reps: structure.repsMin,
  weight: undefined, // Will be calculated from weightPercentage if needed
  duration: structure.durationSeconds,
  restTime: structure.restSeconds,
  notes: structure.notes,
});

// Convert ExerciseConfig to ExerciseStructure
const exerciseConfigToStructure = (
  config: ExerciseConfig,
  index: number
): ExerciseStructure => ({
  id: `exercise-${index}`,
  exerciseId: config.exerciseId,
  exerciseName: '', // Will be populated when we have exercise data
  exerciseType: 'strength', // Default type
  phase: 'main', // Default phase
  sets: config.sets,
  repsMin: config.reps || 8,
  repsMax: config.reps || 12,
  weightPercentage: undefined,
  restSeconds: config.restTime || 60,
  durationSeconds: config.duration,
  notes: config.notes,
  alternatives: [],
});

const SESSION_TYPES = [
  { value: 'workout', label: 'Workout', icon: Dumbbell },
  { value: 'assessment', label: 'Assessment', icon: Target },
  { value: 'recovery', label: 'Recovery', icon: Timer },
] as const;

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-500' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-500' },
] as const;

// Predefined session templates
const PREDEFINED_TEMPLATES = [
  {
    id: 'lower_body_quad_focus',
    name: 'Lower Body - Quad Focus',
    description: 'Quadriceps emphasis with imbalance correction',
    sessionType: 'workout' as const,
    estimatedDuration: 75,
    difficulty: 'intermediate' as const,
    targetMuscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'calves'],
    exerciseStructure: [],
    equipmentRequired: [],
  },
  {
    id: 'upper_body_push',
    name: 'Upper Body - Push Focus',
    description: 'Chest, shoulders, and triceps development',
    sessionType: 'workout' as const,
    estimatedDuration: 60,
    difficulty: 'intermediate' as const,
    targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
    exerciseStructure: [],
    equipmentRequired: [],
  },
];

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: SessionTemplate;
  onEdit: (template: SessionTemplate) => void;
  onDelete: (templateId: string) => void;
}) {
  const t = useTranslations('workouts.createPlan.templates');

  const difficultyConfig = DIFFICULTY_LEVELS.find(
    (d) => d.value === template.difficulty
  );
  const sessionType = SESSION_TYPES.find(
    (s) => s.value === template.sessionType
  );
  const SessionIcon = sessionType?.icon || Dumbbell;

  return (
    <Card className='transition-shadow hover:shadow-md'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='flex flex-1 items-start gap-3'>
            <div className='rounded-lg bg-blue-100 p-2'>
              <SessionIcon className='h-5 w-5 text-blue-600' />
            </div>
            <div className='min-w-0 flex-1'>
              <CardTitle className='truncate text-base'>
                {template.name}
              </CardTitle>
              <CardDescription className='mt-1 line-clamp-2'>
                {template.description}
              </CardDescription>
            </div>
          </div>
          <div className='flex items-center gap-1'>
            <Button variant='ghost' size='sm' onClick={() => onEdit(template)}>
              <Edit2 className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onDelete(template.id)}
              className='text-red-500 hover:text-red-700'
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
            <span>{template.estimatedDuration} min</span>
          </div>
          <div className='flex items-center'>
            <Dumbbell className='mr-2 h-4 w-4 text-gray-500' />
            <span>
              {template.exerciseStructure.length} {t('stats.exercises')}
            </span>
          </div>
          <div className='flex items-center'>
            {difficultyConfig && (
              <>
                <div
                  className={`mr-2 h-3 w-3 rounded-full ${difficultyConfig.color}`}
                />
                <span>{t(`difficulty.${difficultyConfig.value}`)}</span>
              </>
            )}
          </div>
          <div className='flex items-center'>
            <Target className='mr-2 h-4 w-4 text-gray-500' />
            <span>
              {template.targetMuscleGroups.length} {t('stats.muscleGroups')}
            </span>
          </div>
        </div>

        {/* Target Muscle Groups */}
        {template.targetMuscleGroups.length > 0 && (
          <div>
            <div className='mb-1 text-xs text-gray-600'>
              {t('targetMuscles')}:
            </div>
            <div className='flex flex-wrap gap-1'>
              {template.targetMuscleGroups.slice(0, 3).map((group) => (
                <Badge
                  key={group}
                  variant='outline'
                  className='text-xs capitalize'
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
              {template.exerciseStructure.slice(0, 3).map((exercise, index) => (
                <div key={index} className='flex justify-between'>
                  <span className='mr-2 truncate'>
                    {t('exerciseLabel', { number: index + 1 })}
                  </span>
                  <span className='whitespace-nowrap text-gray-500'>
                    {exercise.sets}×
                    {exercise.repsMin || exercise.durationSeconds}
                  </span>
                </div>
              ))}
              {template.exerciseStructure.length > 3 && (
                <div className='text-center text-gray-500'>
                  {t('moreCount', {
                    count: template.exerciseStructure.length - 3,
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TemplateEditor({
  template,
  isOpen,
  onSave,
  onClose,
}: {
  template: SessionTemplate | null;
  isOpen: boolean;
  onSave: (template: SessionTemplate) => void;
  onClose: () => void;
}) {
  const t = useTranslations('workouts.createPlan.templates');
  const [editingTemplate, setEditingTemplate] =
    useState<SessionTemplate | null>(null);
  const durationListId = useId();

  React.useEffect(() => {
    if (isOpen && template) {
      setEditingTemplate({ ...template });
    }
  }, [isOpen, template]);

  const handleSave = useCallback(() => {
    if (editingTemplate) {
      // Ensure name is not empty - use default if needed
      const templateToSave = {
        ...editingTemplate,
        name: editingTemplate.name.trim() || t('untitled'),
      };
      onSave(templateToSave);
      onClose();
    }
  }, [editingTemplate, onSave, onClose, t]);

  const updateTemplate = useCallback((updates: Partial<SessionTemplate>) => {
    setEditingTemplate((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const handleSessionTypeChange = useCallback(
    (value: 'workout' | 'assessment' | 'recovery') => {
      updateTemplate({ sessionType: value });
    },
    [updateTemplate]
  );

  const handleDifficultyChange = useCallback(
    (value: 'beginner' | 'intermediate' | 'advanced') => {
      updateTemplate({ difficulty: value });
    },
    [updateTemplate]
  );

  const handleDurationChange = useCallback(
    (duration: number) => {
      updateTemplate({ estimatedDuration: duration });
    },
    [updateTemplate]
  );

  if (!isOpen || !editingTemplate) {
    return null;
  }

  // Duration slider configuration
  const durationConfig: SliderConfig = {
    value: editingTemplate.estimatedDuration,
    onChange: handleDurationChange,
    label: t('fields.duration'),
    min: 15,
    max: 180,
    step: 15,
    minLabel: '15 min',
    maxLabel: '3h',
    marks: [30, 45, 60, 90, 120, 150],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        mobileMode="bottomSheet"
        className="bg-white p-0 shadow-xl max-w-2xl"
      >

        <DialogHeader className='p-4 pb-0 md:p-6'>
          <DialogTitle className='text-center md:text-left'>
            {template?.id
              ? t('dialog.editTemplate')
              : t('dialog.createTemplate')}
          </DialogTitle>
          <DialogDescription className='text-center md:text-left'>
            {t('dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 p-4 md:p-6'>
          {/* Section 1: Basic Information */}
          <section className='space-y-4'>
            <h3 className='border-b pb-2 text-lg font-semibold text-gray-900'>
              Basic Information
            </h3>

            {/* Template Name - Full width on mobile */}
            <div>
              <Label htmlFor='templateName' className='text-base font-medium'>
                {t('fields.name')}
              </Label>
              <Input
                id='templateName'
                value={editingTemplate.name}
                onChange={(e) => updateTemplate({ name: e.target.value })}
                placeholder={t('fields.namePlaceholder')}
                className='mt-2 h-12 text-base' // Larger touch target
                autoFocus
              />
            </div>

            {/* Description - Mobile optimized textarea */}
            <div>
              <Label
                htmlFor='templateDescription'
                className='text-base font-medium'
              >
                {t('fields.description')}
              </Label>
              <Textarea
                id='templateDescription'
                value={editingTemplate.description}
                onChange={(e) =>
                  updateTemplate({ description: e.target.value })
                }
                placeholder={t('fields.descriptionPlaceholder')}
                rows={3}
                className='mt-2 resize-none text-base' // Prevent resize on mobile
              />
            </div>
          </section>

          {/* Section 2: Session Configuration */}
          <section className='space-y-6'>
            <h3 className='border-b pb-2 text-lg font-semibold text-gray-900'>
              Configuration
            </h3>

            {/* Session Type - Visual cards */}
            <div>
              <Label className='mb-3 block text-base font-medium'>
                {t('fields.sessionType')}
              </Label>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                {SESSION_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectableCard
                      key={type.value}
                      selected={editingTemplate.sessionType === type.value}
                      onClick={() => handleSessionTypeChange(type.value)}
                      className='h-16 touch-manipulation md:h-20' // 64px+ touch targets
                      icon={
                        <div className='mb-1 rounded-lg bg-blue-100 p-2'>
                          <Icon className='h-5 w-5 text-blue-600' />
                        </div>
                      }
                      title={
                        <span className='text-sm font-medium'>
                          {t(`sessionType.${type.value}`)}
                        </span>
                      }
                      align='center'
                    />
                  );
                })}
              </div>
            </div>

            {/* Duration - Mobile slider */}
            <div>
              <MobileSlider
                config={durationConfig}
                unit='min'
                listId={durationListId}
              />

              {/* Quick preset buttons */}
              <div className='mt-4 flex flex-wrap justify-center gap-2'>
                {[30, 45, 60, 75, 90].map((preset) => (
                  <Button
                    key={preset}
                    variant={
                      editingTemplate.estimatedDuration === preset
                        ? 'default'
                        : 'outline'
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

            {/* Difficulty - Visual cards */}
            <div>
              <Label className='mb-3 block text-base font-medium'>
                {t('fields.difficulty')}
              </Label>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectableCard
                    key={level.value}
                    selected={editingTemplate.difficulty === level.value}
                    onClick={() => handleDifficultyChange(level.value)}
                    className='h-16 touch-manipulation md:h-20'
                    icon={
                      <div
                        className={`h-4 w-4 rounded-full ${level.color} mb-1`}
                      />
                    }
                    title={
                      <span className='text-sm font-medium'>{level.label}</span>
                    }
                    align='center'
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: Exercise Selection */}
          <section className='space-y-4'>
            <h3 className='border-b pb-2 text-lg font-semibold text-gray-900'>
              {t('dialog.exercises')}
            </h3>
            <div className='space-y-4'>
              <ExerciseSelector
                selectedExercises={editingTemplate.exerciseStructure.map(
                  exerciseStructureToConfig
                )}
                onExercisesChange={(exercises) =>
                  updateTemplate({
                    exerciseStructure: exercises.map(exerciseConfigToStructure),
                  })
                }
                maxExercises={15}
              />
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3 border-t px-4 pb-4 pt-4 md:px-6 md:pb-6'>
          <Button
            onClick={handleSave}
            disabled={!editingTemplate.name.trim()}
            className='h-12 flex-1 touch-manipulation text-base font-medium'
            size='lg'
          >
            {t('dialog.save')}
          </Button>
          <Button
            variant='outline'
            onClick={onClose}
            className='h-12 touch-manipulation px-6 text-base font-medium'
            size='lg'
          >
            {t('dialog.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SessionTemplatesStep() {
  const t = useTranslations('workouts.createPlan.templates');
  const { formData, updateFormData } = useFormState();

  const [editingTemplate, setEditingTemplate] =
    useState<SessionTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const sessionTemplates = formData.sessionTemplates || [];

  const handleCreateTemplate = useCallback(() => {
    const newTemplate: SessionTemplate = {
      id: `template-${Date.now()}`,
      name: '',
      description: '',
      sessionType: 'workout',
      estimatedDuration: 60,
      difficulty: 'intermediate',
      targetMuscleGroups: [],
      exerciseStructure: [],
      equipmentRequired: [],
    };

    setEditingTemplate(newTemplate);
    setIsEditorOpen(true);
  }, []);

  const handleEditTemplate = useCallback((template: SessionTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  }, []);

  const handleSaveTemplate = useCallback(
    (template: SessionTemplate) => {
      const existingIndex = sessionTemplates.findIndex(
        (t) => t.id === template.id
      );

      if (existingIndex >= 0) {
        // Update existing template
        const updatedTemplates = [...sessionTemplates];
        updatedTemplates[existingIndex] = template;
        updateFormData({ sessionTemplates: updatedTemplates });
      } else {
        // Add new template
        updateFormData({ sessionTemplates: [...sessionTemplates, template] });
      }
    },
    [sessionTemplates, updateFormData]
  );

  const handleDeleteTemplate = useCallback(
    (templateId: string) => {
      const updatedTemplates = sessionTemplates.filter(
        (t) => t.id !== templateId
      );
      updateFormData({ sessionTemplates: updatedTemplates });
    },
    [sessionTemplates, updateFormData]
  );

  const handleUsePredefinedTemplate = useCallback(
    (predefinedTemplate: (typeof PREDEFINED_TEMPLATES)[0]) => {
      const newTemplate: SessionTemplate = {
        ...predefinedTemplate,
        id: `template-${Date.now()}`,
      };

      setEditingTemplate(newTemplate);
      setIsEditorOpen(true);
    },
    []
  );

  const templateStats = useMemo(() => {
    const totalExercises = sessionTemplates.reduce(
      (sum, template) => sum + template.exerciseStructure.length,
      0
    );
    const avgDuration =
      sessionTemplates.length > 0
        ? Math.round(
            sessionTemplates.reduce(
              (sum, template) => sum + template.estimatedDuration,
              0
            ) / sessionTemplates.length
          )
        : 0;
    const allMuscleGroups = new Set(
      sessionTemplates.flatMap((template) => template.targetMuscleGroups)
    );

    return {
      totalTemplates: sessionTemplates.length,
      totalExercises,
      avgDuration,
      muscleGroupsCovered: allMuscleGroups.size,
    };
  }, [sessionTemplates]);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Dumbbell className='h-5 w-5' />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>{t('quickStart.title')}</CardTitle>
          <CardDescription>{t('quickStart.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-3'>
            <Button onClick={handleCreateTemplate}>
              <Plus className='mr-2 h-4 w-4' />
              {t('actions.createNew')}
            </Button>
            {PREDEFINED_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant='outline'
                onClick={() => handleUsePredefinedTemplate(template)}
              >
                <BookOpen className='mr-2 h-4 w-4' />
                {t(`predefined.${template.id}.name`)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {sessionTemplates.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <Dumbbell className='mx-auto mb-4 h-12 w-12 text-gray-400' />
            <h3 className='mb-2 text-lg font-medium text-gray-900'>
              {t('empty.title')}
            </h3>
            <p className='mx-auto mb-6 max-w-md text-gray-600'>
              {t('empty.description')}
            </p>
            <div className='flex justify-center gap-3'>
              <Button onClick={handleCreateTemplate}>
                <Plus className='mr-2 h-4 w-4' />
                {t('empty.createFromScratch')}
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  const firstTemplate = PREDEFINED_TEMPLATES[0];
                  if (firstTemplate) {
                    handleUsePredefinedTemplate(firstTemplate);
                  }
                }}
              >
                <BookOpen className='mr-2 h-4 w-4' />
                {t('empty.useTemplate')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>{t('summary.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {templateStats.totalTemplates}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {t('summary.totalTemplates')}
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {templateStats.avgDuration}m
                  </div>
                  <div className='text-sm text-gray-600'>
                    {t('summary.avgDuration')}
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {templateStats.totalExercises}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {t('summary.totalExercises')}
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-orange-600'>
                    {templateStats.muscleGroupsCovered}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {t('summary.muscleGroupsCovered')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {sessionTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
              />
            ))}
          </div>
        </>
      )}

      {/* Template Editor Modal */}
      <TemplateEditor
        template={editingTemplate}
        isOpen={isEditorOpen}
        onSave={handleSaveTemplate}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingTemplate(null);
        }}
      />
    </div>
  );
}
