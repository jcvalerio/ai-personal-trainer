/**
 * Phase 3 Workout Dashboard Page
 * Comprehensive dashboard with plan management, calendar, templates, and analytics
 */
'use client'

import React, { use, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AppNavigation } from '../../../../components/navigation/app-navigation'
import { IntegratedDashboard } from '@/components/workouts/dashboard/integrated-dashboard'
import { createLocalizedPath } from '@/lib/localized-navigation'
import { TranslationErrorBoundary } from '../../../../components/providers/translation-error-boundary'

interface WorkoutDashboardPageProps {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function WorkoutDashboardPage({ 
  params, 
  searchParams 
}: WorkoutDashboardPageProps) {
  const t = useTranslations('workouts')
  const { locale } = use(params)
  const router = useRouter()
  
  // Parse search params
  const searchParamsValue = searchParams ? use(searchParams) : {}
  const defaultTab = typeof searchParamsValue?.tab === 'string' ? searchParamsValue.tab : 'overview'

  // Handle plan creation
  const handlePlanCreate = useCallback(() => {
    router.push(createLocalizedPath('workouts/create', locale as 'en' | 'es'))
  }, [router, locale])

  // Handle event creation
  const handleEventCreate = useCallback(() => {
    console.log('Creating new event...')
    // Could navigate to a session scheduling page
  }, [])

  return (
    <TranslationErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Modern Navigation Header */}
        <AppNavigation locale={locale} variant="workouts" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link href={createLocalizedPath('workouts', locale as 'en' | 'es')}>
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workouts
              </Button>
            </Link>
          </div>

          {/* Integrated Dashboard */}
          <IntegratedDashboard
            defaultTab={defaultTab}
            onPlanCreate={handlePlanCreate}
            onEventCreate={handleEventCreate}
          />
        </main>
      </div>
    </TranslationErrorBoundary>
  )
}