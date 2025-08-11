/**
 * Custom Workout Plan Creation Page
 * Manual creation interface for workout plans with step-by-step wizard
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, ArrowRight, Check, Plus, Calendar, Target, Dumbbell, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppNavigation } from '@/components/navigation/app-navigation'
import { TranslationErrorBoundary } from '@/components/providers/translation-error-boundary'

// Custom Plan Creation Wizard Components
import { PlanBasicsStep } from '@/components/workouts/create-manual/plan-basics-step'
import { WeeklyScheduleStep } from '@/components/workouts/create-manual/weekly-schedule-step'
import { SessionTemplatesStep } from '@/components/workouts/create-manual/session-templates-step'
import { PlanPreviewStep } from '@/components/workouts/create-manual/plan-preview-step'

import { createLocalizedPath } from '@/lib/localized-navigation'
import { getStepValidator, sanitizeFormData } from '@/lib/workout-form-validation'
import type { CustomPlanFormData, DaySchedule, SessionTemplate } from '@/types/workouts'

interface CreateManualPlanPageProps {
  params: Promise<{ locale: string }>
}

interface ResolvedParams {
  locale: string
}

const STEPS = ['basics', 'schedule', 'templates', 'preview'] as const
type Step = typeof STEPS[number]

const STEP_CONFIG = {
  basics: { icon: Target, titleKey: 'steps.basics.title' },
  schedule: { icon: Calendar, titleKey: 'steps.schedule.title' },
  templates: { icon: Dumbbell, titleKey: 'steps.templates.title' },
  preview: { icon: Check, titleKey: 'steps.preview.title' }
}

export default function CreateManualPlanPage({ params }: CreateManualPlanPageProps) {
  const t = useTranslations('createPlan')
  const router = useRouter()
  
  // Handle async params properly for Next.js 15
  const [resolvedParams, setResolvedParams] = useState<ResolvedParams | null>(null)
  
  useEffect(() => {
    params.then((resolved) => {
      setResolvedParams({ locale: resolved.locale })
    }).catch((error) => {
      console.error('Failed to resolve params:', error)
      // Fallback to default locale
      setResolvedParams({ locale: 'en' })
    })
  }, [params])

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>('basics')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data state  
  const [formData, setFormData] = useState<CustomPlanFormData>({
    // Basic Info
    name: '',
    description: '',
    durationWeeks: 4,
    sessionsPerWeek: 5,
    fitnessGoals: [],
    targetFitnessLevel: 'beginner',
    estimatedSessionDuration: 70,

    // Weekly Schedule
    weeklySchedule: {},

    // Session Templates
    sessionTemplates: [],
    
    // Additional Settings
    isTemplate: false,
    isPublic: false
  })

  const currentStepIndex = STEPS.indexOf(currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === STEPS.length - 1
  const canContinue = validateCurrentStep()

  function validateCurrentStep(): boolean {
    const validator = getStepValidator(currentStep)
    const result = validator(formData)
    return result.isValid
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
    
    setIsSubmitting(true)
    
    try {
      // Sanitize form data before submission
      const sanitizedData = sanitizeFormData(formData)
      
      // Here we would call the API to create the workout plan
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Log plan creation in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating plan with data:', sanitizedData)
      }
      
      // Navigate to the new plan
      if (resolvedParams?.locale) {
        router.push(createLocalizedPath('workouts/plans', resolvedParams.locale as 'en' | 'es'))
      }
    } catch (error) {
      console.error('Error creating plan:', error)
      // TODO: Add proper error handling and user feedback
    } finally {
      setIsSubmitting(false)
    }
  }

  function updateFormData(updates: Partial<CustomPlanFormData>) {
    setFormData(prev => ({ ...prev, ...updates }))
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

  // Show loading state while params are being resolved
  if (!resolvedParams) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { locale } = resolvedParams

  return (
    <TranslationErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <AppNavigation locale={locale} variant="workouts" />
        
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
                  const StepIcon = STEP_CONFIG[currentStep].icon
                  return <StepIcon className="w-5 h-5 mr-2 text-blue-600" />
                })()}
                {t(STEP_CONFIG[currentStep].titleKey)}
              </CardTitle>
              <CardDescription>
                {t(`steps.${currentStep}.description`)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderCurrentStep()}
            </CardContent>
          </Card>

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
      </div>
    </TranslationErrorBoundary>
  )
}