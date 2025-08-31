/**
 * Wizard Content Component - Main wizard logic separated from page wrapper
 * Manages step navigation, form validation, and submission
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Play,
  Plus,
  Calendar,
  Target,
  Dumbbell,
  Clock,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Custom Plan Creation Wizard Components
import { PlanBasicsStep } from './plan-basics-step';
import { WeeklyScheduleStep } from './weekly-schedule-step';
import { SessionTemplatesStep } from './session-templates-step-simple';
import { PlanPreviewStep } from './plan-preview-step';
import { useFormState } from './form-state-provider';
import { useWorkoutPlanSubmission } from '@/lib/hooks/use-workout-plan-submission';
import { createWorkoutPlan } from '@/lib/api/workout-plans';
import {
  createWorkoutSession,
  startWorkoutSession,
} from '@/lib/api/workout-sessions';

import { createLocalizedPath } from '@/lib/localized-navigation';

const STEPS = ['basics', 'schedule', 'templates', 'preview'] as const;
type Step = (typeof STEPS)[number];

const STEP_CONFIG = {
  basics: { icon: Target, titleKey: 'steps.basics.title' },
  schedule: { icon: Calendar, titleKey: 'steps.schedule.title' },
  templates: { icon: Dumbbell, titleKey: 'steps.templates.title' },
  preview: { icon: Check, titleKey: 'steps.preview.title' },
};

interface WizardContentProps {
  locale: string;
}

export function WizardContent({ locale }: WizardContentProps) {
  const t = useTranslations('createPlan');
  const router = useRouter();
  const { formData, updateFormData, currentStep, setCurrentStep } =
    useFormState();

  // Use the submission hook with proper error handling and success callbacks
  const { submitWorkoutPlan, isSubmitting, error, success, clearError } =
    useWorkoutPlanSubmission({
      redirectOnSuccess: true,
      redirectPath: createLocalizedPath(
        '/workouts',
        locale as 'en' | 'es'
      ),
      onSuccess: (response) => {
        console.log('Workout plan created successfully:', response);
      },
      onError: (error) => {
        console.error('Failed to create workout plan:', error);
      },
    });

  const currentStepIndex = STEPS.indexOf(currentStep as Step);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const canContinue = validateCurrentStep();

  function validateCurrentStep(): boolean {
    switch (currentStep) {
      case 'basics':
        return Boolean(
          formData.name && formData.durationWeeks && formData.sessionsPerWeek
        );
      case 'schedule':
        return Object.keys(formData.weeklySchedule).length > 0;
      case 'templates':
        return formData.sessionTemplates.length > 0;
      case 'preview':
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (!canContinue || isLastStep) {
      return;
    }

    const nextStepIndex = currentStepIndex + 1;
    const nextStep = STEPS[nextStepIndex];
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  }

  function handlePrevious() {
    if (isFirstStep) {
      return;
    }

    const prevStepIndex = currentStepIndex - 1;
    const prevStep = STEPS[prevStepIndex];
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  }

  function handleStepClick(step: Step) {
    const stepIndex = STEPS.indexOf(step);
    const currentIndex = currentStepIndex;

    // Only allow going to previous steps or current step
    if (stepIndex <= currentIndex) {
      setCurrentStep(step);
    }
  }

  async function handleSubmit() {
    if (!canContinue) {
      return;
    }

    // Clear any existing errors
    if (error) {
      clearError();
    }

    // Submit the workout plan using the submission hook
    await submitWorkoutPlan();
  }

  // Create plan and immediately start first session from first template
  async function handleCreateAndStart() {
    if (!canContinue || formData.sessionTemplates.length === 0) return;

    // Create the plan first (no redirect here)
    const planRes = await createWorkoutPlan(formData);
    if (!planRes.success || !planRes.data) {
      return;
    }

    // Map first template into a simple session payload
    const firstTemplate = formData.sessionTemplates[0];
    if (!firstTemplate) {
      console.error('No session templates found');
      return;
    }
    const mainExercises = firstTemplate.exerciseStructure.map((ex, idx) => ({
      exerciseId: ex.exerciseId || `exercise-${idx}`,
      orderIndex: idx,
      exercisePhase: 'main' as const,
      plannedSets: ex.sets || 3,
      plannedReps: ex.repsMin || 10,
      plannedDurationSeconds: ex.durationSeconds,
      plannedRestSeconds: ex.restSeconds || 60,
      equipmentAlternatives: [],
    }));

    const sessionPayload = {
      name: firstTemplate.name || 'Custom Session',
      workoutPlanId: planRes.data.id,
      sessionType: 'workout' as const,
      scheduledDate: new Date().toISOString(),
      scheduledDuration:
        firstTemplate.estimatedDuration || formData.estimatedSessionDuration,
      sessionData: {
        totalExercises: mainExercises.length,
        estimatedDuration:
          firstTemplate.estimatedDuration || formData.estimatedSessionDuration,
        targetMuscleGroups: firstTemplate.targetMuscleGroups || [],
        equipmentNeeded: [],
        difficultyLevel: formData.targetFitnessLevel,
      },
      warmUpExercises: [],
      mainExercises,
      coolDownExercises: [],
    };

    const sessionRes = await createWorkoutSession(sessionPayload as any);
    if (!sessionRes.success || !sessionRes.data) {
      return;
    }

    // Start the session
    await startWorkoutSession(sessionRes.data.id);

    // Navigate to the live session page
    router.push(
      createLocalizedPath(
        `/workouts/sessions/${sessionRes.data.id}`,
        locale as 'en' | 'es'
      )
    );
  }

  function renderCurrentStep() {
    switch (currentStep) {
      case 'basics':
        return <PlanBasicsStep data={formData} onUpdate={updateFormData} />;
      case 'schedule':
        return <WeeklyScheduleStep data={formData} onUpdate={updateFormData} />;
      case 'templates':
        return <SessionTemplatesStep />;
      case 'preview':
        return <PlanPreviewStep data={formData} onUpdate={updateFormData} />;
      default:
        return null;
    }
  }

  return (
    <div className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='mb-8 flex items-center'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.back()}
          className='mr-4'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          {t('common.back')}
        </Button>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>{t('title')}</h1>
          <p className='mt-1 text-gray-600'>{t('subtitle')}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className='mb-8'>
        <div className='flex flex-wrap items-center justify-center gap-2 sm:justify-between sm:gap-0'>
          {STEPS.map((step, index) => {
            const StepIcon = STEP_CONFIG[step].icon;
            const isActive = currentStep === step;
            const isCompleted = index < currentStepIndex;
            const isAccessible = index <= currentStepIndex;

            return (
              <div key={step} className='flex flex-col items-center text-center sm:flex-row sm:text-left'>
                {/* Step Circle */}
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={!isAccessible}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isActive
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : isCompleted
                        ? 'border-green-600 bg-green-600 text-white'
                        : isAccessible
                          ? 'border-gray-300 text-gray-500 hover:border-blue-600'
                          : 'border-gray-200 text-gray-300'
                  } `}
                >
                  {isCompleted ? (
                    <Check className='h-5 w-5' />
                  ) : (
                    <StepIcon className='h-5 w-5' />
                  )}
                </button>

                {/* Step Label */}
                <div className='mt-2 min-w-0 sm:ml-3 sm:mt-0 sm:flex-1'>
                  <p
                    className={`text-xs font-medium sm:text-sm ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'} `}
                  >
                    {t(STEP_CONFIG[step].titleKey)}
                  </p>
                </div>

                {/* Connector Line - Hidden on mobile, shown on larger screens */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-4 hidden h-0.5 w-16 sm:block ${isCompleted ? 'bg-green-600' : 'bg-gray-200'} `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Card */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='flex items-center'>
            {(() => {
              const StepIcon = STEP_CONFIG[currentStep as Step].icon;
              return <StepIcon className='mr-2 h-5 w-5 text-blue-600' />;
            })()}
            {t(STEP_CONFIG[currentStep as Step].titleKey)}
          </CardTitle>
          <CardDescription>
            {t(`steps.${currentStep}.description`)}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderCurrentStep()}</CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant='destructive' className='mb-6'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation Footer */}
      <div className='flex items-center justify-between'>
        <Button
          variant='outline'
          onClick={handlePrevious}
          disabled={isFirstStep || isSubmitting}
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          {t('navigation.previous')}
        </Button>

        <div className='text-sm text-gray-500'>
          {t('navigation.stepProgress', {
            current: currentStepIndex + 1,
            total: STEPS.length,
          })}
        </div>

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={!canContinue || isSubmitting}
            className='min-w-[120px]'
          >
            {isSubmitting ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                {t('navigation.creating')}
              </>
            ) : (
              <>
                <Check className='mr-2 h-4 w-4' />
                {t('navigation.createPlan')}
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canContinue || isSubmitting}>
            {t('navigation.next')}
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        )}

        {isLastStep && (
          <Button
            variant='outline'
            onClick={handleCreateAndStart}
            disabled={
              !canContinue ||
              isSubmitting ||
              formData.sessionTemplates.length === 0
            }
          >
            <Play className='mr-2 h-4 w-4' /> Start first session
          </Button>
        )}
      </div>
    </div>
  );
}
