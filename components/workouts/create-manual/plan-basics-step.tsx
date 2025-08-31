/**
 * Plan Basics Step Component
 * First step in the custom workout plan creation wizard
 */
'use client';

import { useTranslations } from 'next-intl';
import { Target, Clock, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Removed Selects in favor of shared sliders

import type { CustomPlanFormData } from '@/types/workouts';
import type { FitnessLevel } from '@/types';
import { FitnessLevelSelector } from '@/components/workouts/ui/fitness-level-selector';
import { FitnessGoalsSelector } from '@/components/workouts/ui/fitness-goals-selector';
import { ScheduleSliders } from '@/components/workouts/ui/schedule-sliders';

interface PlanBasicsStepProps {
  data: CustomPlanFormData;
  onUpdate: (updates: Partial<CustomPlanFormData>) => void;
}

const FITNESS_GOALS = [
  'strength',
  'muscle_gain',
  'fat_loss',
  'cardio',
  'endurance',
  'flexibility',
  'sports_performance',
  'general_fitness',
];

const FITNESS_GOALS_DEFS: Record<string, { icon?: string }> = {
  strength: { icon: '🏋️' },
  muscle_gain: { icon: '💪' },
  fat_loss: { icon: '⚖️' },
  cardio: { icon: '❤️‍🔥' },
  endurance: { icon: '🏃' },
  flexibility: { icon: '🧘' },
  sports_performance: { icon: '🏅' },
  general_fitness: { icon: '✨' },
};

const FITNESS_LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

// Prior discrete options replaced by slider ranges

export function PlanBasicsStep({ data, onUpdate }: PlanBasicsStepProps) {
  const t = useTranslations('createPlan.steps.basics');

  function toggleGoal(goal: string) {
    const currentGoals = data.fitnessGoals;
    if (currentGoals.includes(goal)) {
      onUpdate({
        fitnessGoals: currentGoals.filter((g) => g !== goal),
      });
    } else {
      onUpdate({
        fitnessGoals: [...currentGoals, goal],
      });
    }
  }

  function handleInputChange<K extends keyof CustomPlanFormData>(
    field: K,
    value: CustomPlanFormData[K]
  ) {
    onUpdate({ [field]: value } as Partial<CustomPlanFormData>);
  }

  const totalWeeklyHours =
    (data.sessionsPerWeek * data.estimatedSessionDuration) / 60;
  const totalProgramHours = totalWeeklyHours * data.durationWeeks;

  return (
    <div className='space-y-8'>
      {/* Plan Identification */}
      <div className='grid grid-cols-1 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='name' className='text-sm font-medium text-gray-900'>
            {t('fields.name.label')} *
          </Label>
          <Input
            id='name'
            type='text'
            value={data.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={t('fields.name.placeholder')}
            className='text-base'
            required
          />
          <p className='text-sm text-gray-500'>{t('fields.name.help')}</p>
        </div>

        <div className='space-y-2'>
          <Label
            htmlFor='description'
            className='text-sm font-medium text-gray-900'
          >
            {t('fields.description.label')}
          </Label>
          <Textarea
            id='description'
            value={data.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder={t('fields.description.placeholder')}
            rows={3}
          />
          <p className='text-sm text-gray-500'>
            {t('fields.description.help')}
          </p>
        </div>
      </div>

      {/* Program Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center text-lg'>
            <Calendar className='mr-2 h-5 w-5 text-blue-600' />
            {t('programConfig.title')}
          </CardTitle>
          <CardDescription>{t('programConfig.description')}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Unified, mobile-friendly sliders */}
          <ScheduleSliders
            weeks={{
              value: data.durationWeeks,
              onChange: (val) => handleInputChange('durationWeeks', val),
              label: `${t('fields.duration.label')} * — ${t('fields.duration.weeks', { count: data.durationWeeks })}`,
              min: 2,
              max: 20,
              step: 1,
              minLabel: t('fields.duration.weeks', { count: 2 }),
              maxLabel: t('fields.duration.weeks', { count: 20 }),
              marks: [2, 4, 6, 8, 12, 16, 20],
            }}
            daysPerWeek={{
              value: data.sessionsPerWeek,
              onChange: (val) => handleInputChange('sessionsPerWeek', val),
              label: `${t('fields.sessionsPerWeek.label')} * — ${t('fields.sessionsPerWeek.sessions', { count: data.sessionsPerWeek })}`,
              min: 2,
              max: 7,
              step: 1,
              minLabel: t('fields.sessionsPerWeek.sessions', { count: 2 }),
              maxLabel: t('fields.sessionsPerWeek.sessions', { count: 7 }),
              marks: [2, 3, 4, 5, 6, 7],
            }}
            minutes={{
              value: data.estimatedSessionDuration,
              onChange: (val) =>
                handleInputChange('estimatedSessionDuration', val),
              label: `${t('fields.sessionDuration.label')} — ${t('fields.sessionDuration.minutes', { count: data.estimatedSessionDuration })}`,
              min: 30,
              max: 120,
              step: 15,
              minLabel: t('fields.sessionDuration.minutes', { count: 30 }),
              maxLabel: t('fields.sessionDuration.minutes', { count: 120 }),
              marks: [30, 45, 60, 75, 90, 105, 120],
            }}
          />

          {/* Program Overview */}
          <div className='rounded-lg bg-blue-50 p-4'>
            <h4 className='mb-3 flex items-center font-medium text-blue-900'>
              <Clock className='mr-2 h-4 w-4' />
              {t('programConfig.overview.title')}
            </h4>
            <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
              <div>
                <span className='font-medium text-blue-700'>
                  {data.durationWeeks}
                </span>
                <span className='ml-1 text-blue-600'>
                  {t('programConfig.overview.weeks')}
                </span>
              </div>
              <div>
                <span className='font-medium text-blue-700'>
                  {data.sessionsPerWeek}
                </span>
                <span className='ml-1 text-blue-600'>
                  {t('programConfig.overview.sessionsWeek')}
                </span>
              </div>
              <div>
                <span className='font-medium text-blue-700'>
                  {totalWeeklyHours.toFixed(1)}
                </span>
                <span className='ml-1 text-blue-600'>
                  {t('programConfig.overview.hoursWeek')}
                </span>
              </div>
              <div>
                <span className='font-medium text-blue-700'>
                  {totalProgramHours.toFixed(0)}
                </span>
                <span className='ml-1 text-blue-600'>
                  {t('programConfig.overview.totalHours')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fitness Goals */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center text-lg'>
            <Target className='mr-2 h-5 w-5 text-blue-600' />
            {t('fitnessGoals.title')}
          </CardTitle>
          <CardDescription>{t('fitnessGoals.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FitnessGoalsSelector
            selected={data.fitnessGoals}
            onToggle={toggleGoal}
            options={FITNESS_GOALS.map((goal) => ({
              id: goal,
              label: t(`fitnessGoals.options.${goal}.name`),
              description: t(`fitnessGoals.options.${goal}.description`),
              icon: FITNESS_GOALS_DEFS[goal]?.icon,
            }))}
          />
          {data.fitnessGoals.length === 0 && (
            <div className='mt-4 flex items-center rounded-lg bg-amber-50 p-3 text-sm text-amber-700'>
              <AlertCircle className='mr-2 h-4 w-4' />
              {t('fitnessGoals.selectAtLeastOne')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Fitness Level */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center text-lg'>
            <TrendingUp className='mr-2 h-5 w-5 text-blue-600' />
            {t('fitnessLevel.title')}
          </CardTitle>
          <CardDescription>{t('fitnessLevel.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FitnessLevelSelector
            value={data.targetFitnessLevel}
            onChange={(level) =>
              handleInputChange('targetFitnessLevel', level as FitnessLevel)
            }
            options={FITNESS_LEVELS.map((level) => ({
              id: level,
              name: t(`fitnessLevel.levels.${level}.name`),
              description: t(`fitnessLevel.levels.${level}.description`),
            }))}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className='border-gray-200 bg-gray-50'>
        <CardHeader>
          <CardTitle className='text-lg text-gray-900'>
            {t('summary.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>{t('summary.planName')}</span>
              <span className='font-medium'>
                {data.name || t('summary.notSet')}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>{t('summary.duration')}</span>
              <span className='font-medium'>
                {t('summary.durationValue', {
                  weeks: data.durationWeeks,
                  sessions: data.sessionsPerWeek,
                })}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>{t('summary.goals')}</span>
              <div className='flex flex-wrap gap-1'>
                {data.fitnessGoals.length > 0 ? (
                  data.fitnessGoals.map((goal) => (
                    <Badge key={goal} variant='secondary' className='text-xs'>
                      {t(`fitnessGoals.options.${goal}.name`)}
                    </Badge>
                  ))
                ) : (
                  <span className='italic text-gray-400'>
                    {t('summary.noGoals')}
                  </span>
                )}
              </div>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>{t('summary.level')}</span>
              <span className='font-medium'>
                {t(`fitnessLevel.levels.${data.targetFitnessLevel}.name`)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
