/**
 * Wizard Content Component - Main wizard logic separated from page wrapper
 * Manages step navigation, form validation, and submission
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, ArrowRight, Check, Plus, Calendar, Target, Dumbbell, Clock, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Custom Plan Creation Wizard Components
import { PlanBasicsStep } from './plan-basics-step'
import { WeeklyScheduleStep } from './weekly-schedule-step'
import { SessionTemplatesStep } from './session-templates-step-simple'
import { PlanPreviewStep } from './plan-preview-step'
import { useFormState } from './form-state-provider'
import { useWorkoutPlanSubmission } from '@/lib/hooks/use-workout-plan-submission'

import { createLocalizedPath } from '@/lib/localized-navigation'

const STEPS = ['basics', 'schedule', 'templates', 'preview'] as const
type Step = typeof STEPS[number]

const STEP_CONFIG = {
  basics: { icon: Target, titleKey: 'steps.basics.title' },
  schedule: { icon: Calendar, titleKey: 'steps.schedule.title' },
  templates: { icon: Dumbbell, titleKey: 'steps.templates.title' },
  preview: { icon: Check, titleKey: 'steps.preview.title' }
}

interface WizardContentProps {
  locale: string
}

export function WizardContent({ locale }: WizardContentProps) {
  const t = useTranslations('createPlan')
  const router = useRouter()
  const { formData, updateFormData, currentStep, setCurrentStep } = useFormState()
  
  // Use the submission hook with proper error handling and success callbacks
  const { submitWorkoutPlan, isSubmitting, error, success, clearError } = useWorkoutPlanSubmission({
    redirectOnSuccess: true,
    redirectPath: createLocalizedPath('/dashboard/workouts', locale as 'en' | 'es'),
    onSuccess: (response) => {
      console.log('Workout plan created successfully:', response)
    },
    onError: (error) => {
      console.error('Failed to create workout plan:', error)
    }
  })

  const currentStepIndex = STEPS.indexOf(currentStep as Step)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === STEPS.length - 1
  const canContinue = validateCurrentStep()

  function validateCurrentStep(): boolean {
    switch (currentStep) {
      case 'basics':
        return Boolean(formData.name && formData.durationWeeks && formData.sessionsPerWeek)
      case 'schedule':
        return Object.keys(formData.weeklySchedule).length > 0
      case 'templates':
        return formData.sessionTemplates.length > 0
      case 'preview':
        return true
      default:
        return false
    }
  }

  function handleNext() {
    if (!canContinue || isLastStep) {
      return
    }
    
    const nextStepIndex = currentStepIndex + 1
    setCurrentStep(STEPS[nextStepIndex])
  }

  function handlePrevious() {
    if (isFirstStep) {
      return
    }
    
    const prevStepIndex = currentStepIndex - 1
    setCurrentStep(STEPS[prevStepIndex])
  }

  function handleStepClick(step: Step) {
    const stepIndex = STEPS.indexOf(step)
    const currentIndex = currentStepIndex
    
    // Only allow going to previous steps or current step
    if (stepIndex <= currentIndex) {
      setCurrentStep(step)
    }
  }

  async function handleSubmit() {
    if (!canContinue) {return}
    
    // Clear any existing errors
    if (error) {clearError()}
    
    // Submit the workout plan using the submission hook
    await submitWorkoutPlan()
  }

  function renderCurrentStep() {
    switch (currentStep) {
      case 'basics':
        return (
          <PlanBasicsStep
            data={formData}
            onUpdate={updateFormData}
          />
        )
      case 'schedule':
        return (
          <WeeklyScheduleStep
            data={formData}
            onUpdate={updateFormData}
          />
        )
      case 'templates':
        return (
          <SessionTemplatesStep
            data={formData}
            onUpdate={updateFormData}
          />
        )
      case 'preview':
        return (
          <PlanPreviewStep
            data={formData}
            onUpdate={updateFormData}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = STEP_CONFIG[step].icon
            const isActive = currentStep === step
            const isCompleted = index < currentStepIndex
            const isAccessible = index <= currentStepIndex

            return (
              <div
                key={step}
                className="flex items-center"
              >
                {/* Step Circle */}
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={!isAccessible}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                    ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 border-green-600 text-white'
                        : isAccessible
                        ? 'border-gray-300 text-gray-500 hover:border-blue-600'
                        : 'border-gray-200 text-gray-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </button>

                {/* Step Label */}
                <div className="ml-3 min-w-0 flex-1">
                  <p className={`
                    text-sm font-medium
                    ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}
                  `}>
                    {t(STEP_CONFIG[step].titleKey)}
                  </p>
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-4
                    ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            {(() => {
              const StepIcon = STEP_CONFIG[currentStep as Step].icon
              return <StepIcon className="w-5 h-5 mr-2 text-blue-600" />
            })()}
            {t(STEP_CONFIG[currentStep as Step].titleKey)}
          </CardTitle>
          <CardDescription>
            {t(`steps.${currentStep}.description`)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('navigation.previous')}
        </Button>

        <div className="text-sm text-gray-500">
          {t('navigation.stepProgress', { current: currentStepIndex + 1, total: STEPS.length })}
        </div>

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={!canContinue || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('navigation.creating')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t('navigation.createPlan')}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canContinue || isSubmitting}
          >
            {t('navigation.next')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}