/**
 * Plan Preview Step Component
 * Final step in the custom workout plan creation wizard
 */
'use client';

import { useTranslations } from 'next-intl';
import {
  Check,
  Calendar,
  Dumbbell,
  Clock,
  Target,
  Users,
  Globe,
  AlertTriangle,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import type { CustomPlanFormData } from '@/types/workouts';

interface PlanPreviewStepProps {
  data: CustomPlanFormData;
  onUpdate: (updates: Partial<CustomPlanFormData>) => void;
}

export function PlanPreviewStep({ data, onUpdate }: PlanPreviewStepProps) {
  const t = useTranslations('createPlan.steps.preview');

  // Calculate plan statistics - fix to properly count sessions
  const totalSessions = Object.values(data.weeklySchedule).reduce(
    (total, daySchedule: any) => {
      if (!daySchedule || !Array.isArray(daySchedule)) {
        return total;
      }
      return (
        total + daySchedule.filter((session: any) => session.type === 'workout' || session.type === 'strength' || session.type === 'cardio' || session.type === 'hiit').length
      );
    },
    0
  ) * data.durationWeeks;

  const totalRestDays = data.durationWeeks * 7 - totalSessions;
  const totalProgramHours = Math.round(
    (totalSessions * data.estimatedSessionDuration) / 60
  );
  const averageSessionsPerWeek =
    Math.round((totalSessions / data.durationWeeks) * 10) / 10;

  const allTargetMuscles = [
    ...new Set(
      data.sessionTemplates.flatMap((template) => template.targetMuscleGroups)
    ),
  ];
  const totalExercises = data.sessionTemplates.reduce(
    (total, template) => total + template.exerciseStructure.length,
    0
  );

  // Validation checks
  const validationIssues: string[] = [];

  if (!data.name.trim()) {
    validationIssues.push(t('validation.missingName'));
  }

  if (data.fitnessGoals.length === 0) {
    validationIssues.push(t('validation.noGoals'));
  }

  if (data.sessionTemplates.length === 0) {
    validationIssues.push(t('validation.noTemplates'));
  }

  if (totalSessions === 0) {
    validationIssues.push(t('validation.noWorkouts'));
  }

  if (averageSessionsPerWeek < 1) {
    validationIssues.push(t('validation.tooFewSessions'));
  }

  const hasValidationIssues = validationIssues.length > 0;

  return (
    <div className='space-y-6'>
      {/* Validation Status */}
      {hasValidationIssues ? (
        <Card className='border-red-200 bg-red-50'>
          <CardHeader>
            <CardTitle className='flex items-center text-red-800'>
              <AlertTriangle className='mr-2 h-5 w-5' />
              {t('validation.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='list-inside list-disc space-y-1 text-red-700'>
              {validationIssues.map((issue, index) => (
                <li key={index} className='text-sm'>
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className='border-green-200 bg-green-50'>
          <CardHeader>
            <CardTitle className='flex items-center text-green-800'>
              <Check className='mr-2 h-5 w-5' />
              {t('validation.ready')}
            </CardTitle>
            <CardDescription className='text-green-700'>
              {t('validation.readyDescription')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Target className='mr-2 h-5 w-5 text-blue-600' />
            {t('overview.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* Basic Info */}
            <div className='space-y-4'>
              <div>
                <h3 className='text-lg font-medium text-gray-900'>
                  {data.name}
                </h3>
                {data.description && (
                  <p className='mt-1 text-gray-600'>{data.description}</p>
                )}
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>
                    {t('overview.duration')}
                  </span>
                  <span className='font-medium'>
                    {t('overview.durationValue', { weeks: data.durationWeeks })}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>
                    {t('overview.targetLevel')}
                  </span>
                  <Badge variant='secondary'>
                    {t(`fitnessLevel.${data.targetFitnessLevel}`)}
                  </Badge>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>
                    {t('overview.sessionDuration')}
                  </span>
                  <span className='font-medium'>
                    {data.estimatedSessionDuration} {t('overview.minutes')}
                  </span>
                </div>
              </div>

              {/* Fitness Goals */}
              <div>
                <div className='mb-2 text-sm text-gray-600'>
                  {t('overview.goals')}
                </div>
                <div className='flex flex-wrap gap-1'>
                  {data.fitnessGoals.map((goal) => (
                    <Badge key={goal} variant='default' className='text-xs'>
                      {t(`goals.${goal}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='rounded-lg bg-blue-50 p-4 text-center'>
                <div className='text-2xl font-bold text-blue-700'>
                  {totalSessions}
                </div>
                <div className='text-sm text-blue-600'>
                  {t('stats.totalWorkouts')}
                </div>
              </div>
              <div className='rounded-lg bg-green-50 p-4 text-center'>
                <div className='text-2xl font-bold text-green-700'>
                  {totalProgramHours}h
                </div>
                <div className='text-sm text-green-600'>
                  {t('stats.totalHours')}
                </div>
              </div>
              <div className='rounded-lg bg-purple-50 p-4 text-center'>
                <div className='text-2xl font-bold text-purple-700'>
                  {averageSessionsPerWeek}
                </div>
                <div className='text-sm text-purple-600'>
                  {t('stats.avgPerWeek')}
                </div>
              </div>
              <div className='rounded-lg bg-orange-50 p-4 text-center'>
                <div className='text-2xl font-bold text-orange-700'>
                  {totalRestDays}
                </div>
                <div className='text-sm text-orange-600'>
                  {t('stats.restDays')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule Preview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Calendar className='mr-2 h-5 w-5 text-blue-600' />
            {t('schedule.title')}
          </CardTitle>
          <CardDescription>{t('schedule.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Array.from(
              { length: Math.min(data.durationWeeks, 4) },
              (_, weekIndex) => {
                // Get sessions for this week by mapping day names to schedule data
                const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                
                // Count workouts for this week
                let weekWorkouts = 0;
                dayNames.forEach(dayName => {
                  const daySchedule = data.weeklySchedule[dayName] || [];
                  weekWorkouts += daySchedule.filter((session: any) => 
                    session.type === 'workout' || session.type === 'strength' || session.type === 'cardio' || session.type === 'hiit'
                  ).length;
                });

                return (
                  <div key={weekIndex} className='rounded-lg border p-4'>
                    <div className='mb-3 flex items-center justify-between'>
                      <h4 className='font-medium'>
                        {t('schedule.week', { number: weekIndex + 1 })}
                      </h4>
                      <Badge variant='outline'>
                        {weekWorkouts} {t('schedule.workouts')}
                      </Badge>
                    </div>

                    <div className='grid grid-cols-7 gap-2 text-xs'>
                      {dayShortNames.map((dayShort, dayIndex) => {
                        const dayName = dayNames[dayIndex];
                        const daySchedule = data.weeklySchedule[dayName] || [];
                        const workoutSessions = daySchedule.filter((session: any) => 
                          session.type === 'workout' || session.type === 'strength' || session.type === 'cardio' || session.type === 'hiit'
                        );
                        const hasWorkout = workoutSessions.length > 0;
                        const firstSession = workoutSessions[0];

                        return (
                          <div
                            key={dayShort}
                            className={`rounded p-2 text-center ${
                              hasWorkout 
                                ? firstSession?.type === 'cardio' 
                                  ? 'bg-red-100 text-red-800'
                                  : firstSession?.type === 'hiit'
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <div className='font-medium'>{dayShort}</div>
                            <div className='mt-1 truncate'>
                              {hasWorkout
                                ? firstSession?.name || t(`schedule.${firstSession?.type}`) || t('schedule.workout')
                                : t('schedule.rest')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}

            {data.durationWeeks > 4 && (
              <div className='text-center text-sm text-gray-500'>
                ... {t('schedule.moreWeeks', { count: data.durationWeeks - 4 })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Templates Preview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Dumbbell className='mr-2 h-5 w-5 text-blue-600' />
            {t('templates.title')}
          </CardTitle>
          <CardDescription>{t('templates.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {data.sessionTemplates.map((template) => (
              <Card key={template.id} className='bg-gray-50'>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <div className='min-w-0 flex-1'>
                      <h4 className='truncate font-medium'>{template.name}</h4>
                      <p className='line-clamp-1 text-sm text-gray-600'>
                        {template.description}
                      </p>
                    </div>
                    <Badge variant='secondary' className='ml-2'>
                      {t(`difficulty.${template.difficulty}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                    <div className='flex items-center'>
                      <Clock className='mr-1 h-4 w-4 text-gray-500' />
                      <span>{template.estimatedDuration}m</span>
                    </div>
                    <div className='flex items-center'>
                      <Dumbbell className='mr-1 h-4 w-4 text-gray-500' />
                      <span>{template.exerciseStructure.length} exercises</span>
                    </div>
                  </div>

                  {template.targetMuscleGroups.length > 0 && (
                    <div>
                      <div className='mb-1 text-xs text-gray-600'>
                        {t('templates.muscles')}
                      </div>
                      <div className='flex flex-wrap gap-1'>
                        {template.targetMuscleGroups
                          .slice(0, 3)
                          .map((muscle) => (
                            <Badge
                              key={muscle}
                              variant='outline'
                              className='text-xs'
                            >
                              {t(`muscles.${muscle}`)}
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Template Summary */}
          <Separator className='my-6' />

          <div className='grid grid-cols-2 gap-4 text-center md:grid-cols-4'>
            <div>
              <div className='text-xl font-bold text-gray-900'>
                {data.sessionTemplates.length}
              </div>
              <div className='text-sm text-gray-600'>
                {t('templates.summary.totalTemplates')}
              </div>
            </div>
            <div>
              <div className='text-xl font-bold text-gray-900'>
                {totalExercises}
              </div>
              <div className='text-sm text-gray-600'>
                {t('templates.summary.totalExercises')}
              </div>
            </div>
            <div>
              <div className='text-xl font-bold text-gray-900'>
                {allTargetMuscles.length}
              </div>
              <div className='text-sm text-gray-600'>
                {t('templates.summary.muscleGroups')}
              </div>
            </div>
            <div>
              <div className='text-xl font-bold text-gray-900'>
                {Math.round(
                  data.sessionTemplates.reduce(
                    (avg, template) => avg + template.estimatedDuration,
                    0
                  ) / data.sessionTemplates.length
                ) || 0}
                m
              </div>
              <div className='text-sm text-gray-600'>
                {t('templates.summary.avgDuration')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Users className='mr-2 h-5 w-5 text-blue-600' />
            {t('settings.title')}
          </CardTitle>
          <CardDescription>{t('settings.description')}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <div className='flex items-center'>
              <div className='mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100'>
                <Users className='h-4 w-4 text-blue-600' />
              </div>
              <div>
                <div className='font-medium'>
                  {t('settings.template.title')}
                </div>
                <div className='text-sm text-gray-600'>
                  {t('settings.template.description')}
                </div>
              </div>
            </div>
            <Button
              variant={data.isTemplate ? 'default' : 'outline'}
              size='sm'
              onClick={() => onUpdate({ isTemplate: !data.isTemplate })}
            >
              {data.isTemplate
                ? t('settings.template.enabled')
                : t('settings.template.disabled')}
            </Button>
          </div>

          <div className='flex items-center justify-between rounded-lg border p-4'>
            <div className='flex items-center'>
              <div className='mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100'>
                <Globe className='h-4 w-4 text-green-600' />
              </div>
              <div>
                <div className='font-medium'>{t('settings.public.title')}</div>
                <div className='text-sm text-gray-600'>
                  {t('settings.public.description')}
                </div>
              </div>
            </div>
            <Button
              variant={data.isPublic ? 'default' : 'outline'}
              size='sm'
              onClick={() => onUpdate({ isPublic: !data.isPublic })}
            >
              {data.isPublic
                ? t('settings.public.enabled')
                : t('settings.public.disabled')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Final Summary */}
      <Card className='border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50'>
        <CardContent className='pt-6'>
          <div className='text-center'>
            <h3 className='mb-2 text-xl font-bold text-gray-900'>
              {t('summary.title')}
            </h3>
            <p className='mb-4 text-gray-600'>
              {t('summary.description', {
                weeks: data.durationWeeks,
                sessions: totalSessions,
                hours: totalProgramHours,
              })}
            </p>

            {hasValidationIssues && (
              <div className='mb-4 rounded-lg border border-red-200 bg-red-100 p-3'>
                <p className='text-sm text-red-800'>
                  {t('summary.validationWarning')}
                </p>
              </div>
            )}

            <div className='flex flex-wrap justify-center gap-2'>
              {data.fitnessGoals.slice(0, 4).map((goal) => (
                <Badge key={goal} variant='default'>
                  {t(`goals.${goal}`)}
                </Badge>
              ))}
              {data.fitnessGoals.length > 4 && (
                <Badge variant='outline'>
                  +{data.fitnessGoals.length - 4} {t('summary.moreGoals')}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
