/**
 * Custom Workout Plan Creation Page - Updated with Form State Persistence
 * Manual creation interface for workout plans with step-by-step wizard
 */
'use client'

import { useState, useEffect } from 'react'
import { AppNavigation } from '@/components/navigation/app-navigation'
import { TranslationErrorBoundary } from '@/components/providers/translation-error-boundary'
import { FormStateProvider } from '@/components/workouts/create-manual/form-state-provider'
import { WizardContent } from '@/components/workouts/create-manual/wizard-content'

interface CreateManualPlanPageProps {
  params: Promise<{ locale: string }>
}

interface ResolvedParams {
  locale: string
}

export default function CreateManualPlanPage({ params }: CreateManualPlanPageProps) {
  // Handle async params properly for Next.js 15
  const [resolvedParams, setResolvedParams] = useState<ResolvedParams | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    params.then((resolved) => {
      setResolvedParams({ locale: resolved.locale })
      setIsLoading(false)
    }).catch((error) => {
      console.error('Failed to resolve params:', error)
      setResolvedParams({ locale: 'en' }) // Fallback
      setIsLoading(false)
    })
  }, [params])

  if (isLoading || !resolvedParams) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <TranslationErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <AppNavigation locale={resolvedParams.locale} variant="workouts" />
        
        <FormStateProvider>
          <WizardContent locale={resolvedParams.locale} />
        </FormStateProvider>
      </div>
    </TranslationErrorBoundary>
  )
}