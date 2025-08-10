/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */
'use client'

import Link from 'next/link'
import { use } from 'react'
import { useTranslations } from 'next-intl'
import { Dumbbell, Users, Target, TrendingUp } from 'lucide-react'
import { AppNavigation } from '../../../components/navigation/app-navigation'
import { createLocalizedPath } from '../../../lib/localized-navigation'

interface DashboardPageProps {
  params: Promise<{ locale: string }>
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const t = useTranslations('dashboard')
  const { locale } = use(params)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Navigation Header */}
      <AppNavigation locale={locale} variant="dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('welcome.title')}</h2>
          <p className="text-gray-600">{t('welcome.subtitle')}</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stats.workoutsThisWeek')}</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stats.currentStreak')}</p>
                <p className="text-2xl font-bold text-gray-900">0 {t('stats.streakDays')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Dumbbell className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stats.totalWorkouts')}</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stats.community')}</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Start Workout */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quickActions.title')}</h3>
            <div className="space-y-3">
              <Link
                href={createLocalizedPath('workouts/new', locale as 'en' | 'es')}
                className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:bg-blue-700 transition-colors">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('quickActions.startWorkout.title')}</p>
                    <p className="text-sm text-gray-600">{t('quickActions.startWorkout.description')}</p>
                  </div>
                </div>
              </Link>

              <Link
                href={createLocalizedPath('progress', locale as 'en' | 'es')}
                className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 text-white rounded-lg group-hover:bg-green-700 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('quickActions.trackProgress.title')}</p>
                    <p className="text-sm text-gray-600">{t('quickActions.trackProgress.description')}</p>
                  </div>
                </div>
              </Link>

              <Link
                href={createLocalizedPath('organizations', locale as 'en' | 'es')}
                className="flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 text-white rounded-lg group-hover:bg-purple-700 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('quickActions.joinCommunity.title')}</p>
                    <p className="text-sm text-gray-600">{t('quickActions.joinCommunity.description')}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('recentActivity.title')}</h3>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">{t('recentActivity.empty.title')}</p>
              <p className="text-sm text-gray-500">{t('recentActivity.empty.description')}</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('comingSoon.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-700">{t('comingSoon.features.aiWorkout')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-sm text-gray-700">{t('comingSoon.features.analytics')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-sm text-gray-700">{t('comingSoon.features.social')}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}