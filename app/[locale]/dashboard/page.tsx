/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */
'use client';

import Link from 'next/link';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { Dumbbell, Users, Target, TrendingUp } from 'lucide-react';
import { AppNavigation } from '../../../components/navigation/app-navigation';
import { createLocalizedPath } from '../../../lib/localized-navigation';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const t = useTranslations('dashboard');
  const { locale } = use(params);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Modern Navigation Header */}
      <AppNavigation locale={locale} variant='dashboard' />

      {/* Main Content */}
      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Welcome Section */}
        <div className='mb-8'>
          <h2 className='mb-2 text-3xl font-bold text-gray-900'>
            {t('welcome.title')}
          </h2>
          <p className='text-gray-600'>{t('welcome.subtitle')}</p>
        </div>

        {/* Quick Stats Grid */}
        <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-xl border border-gray-200 bg-white p-6'>
            <div className='flex items-center gap-4'>
              <div className='rounded-lg bg-blue-100 p-3'>
                <Target className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>
                  {t('stats.workoutsThisWeek')}
                </p>
                <p className='text-2xl font-bold text-gray-900'>0</p>
              </div>
            </div>
          </div>

          <div className='rounded-xl border border-gray-200 bg-white p-6'>
            <div className='flex items-center gap-4'>
              <div className='rounded-lg bg-green-100 p-3'>
                <TrendingUp className='h-6 w-6 text-green-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>
                  {t('stats.currentStreak')}
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  0 {t('stats.streakDays')}
                </p>
              </div>
            </div>
          </div>

          <div className='rounded-xl border border-gray-200 bg-white p-6'>
            <div className='flex items-center gap-4'>
              <div className='rounded-lg bg-purple-100 p-3'>
                <Dumbbell className='h-6 w-6 text-purple-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>
                  {t('stats.totalWorkouts')}
                </p>
                <p className='text-2xl font-bold text-gray-900'>0</p>
              </div>
            </div>
          </div>

          <div className='rounded-xl border border-gray-200 bg-white p-6'>
            <div className='flex items-center gap-4'>
              <div className='rounded-lg bg-orange-100 p-3'>
                <Users className='h-6 w-6 text-orange-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>{t('stats.community')}</p>
                <p className='text-2xl font-bold text-gray-900'>-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Start Workout */}
          <div className='rounded-xl border border-gray-200 bg-white p-6'>
            <h3 className='mb-4 text-lg font-semibold text-gray-900'>
              {t('quickActions.title')}
            </h3>
            <div className='space-y-3'>
              <Link
                href={createLocalizedPath(
                  'workouts/new',
                  locale as 'en' | 'es'
                )}
                className='group flex items-center justify-between rounded-lg bg-blue-50 p-4 transition-colors hover:bg-blue-100'
              >
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-blue-600 p-2 text-white transition-colors group-hover:bg-blue-700'>
                    <Dumbbell className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>
                      {t('quickActions.startWorkout.title')}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {t('quickActions.startWorkout.description')}
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href={createLocalizedPath('progress', locale as 'en' | 'es')}
                className='group flex items-center justify-between rounded-lg bg-green-50 p-4 transition-colors hover:bg-green-100'
              >
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-green-600 p-2 text-white transition-colors group-hover:bg-green-700'>
                    <TrendingUp className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>
                      {t('quickActions.trackProgress.title')}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {t('quickActions.trackProgress.description')}
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href={createLocalizedPath(
                  'organizations',
                  locale as 'en' | 'es'
                )}
                className='group flex items-center justify-between rounded-lg bg-purple-50 p-4 transition-colors hover:bg-purple-100'
              >
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-purple-600 p-2 text-white transition-colors group-hover:bg-purple-700'>
                    <Users className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>
                      {t('quickActions.joinCommunity.title')}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {t('quickActions.joinCommunity.description')}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className='rounded-xl border border-gray-200 bg-white p-6'>
            <h3 className='mb-4 text-lg font-semibold text-gray-900'>
              {t('recentActivity.title')}
            </h3>
            <div className='py-8 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
                <TrendingUp className='h-8 w-8 text-gray-400' />
              </div>
              <p className='mb-2 text-gray-600'>
                {t('recentActivity.empty.title')}
              </p>
              <p className='text-sm text-gray-500'>
                {t('recentActivity.empty.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className='mt-8 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6'>
          <h3 className='mb-4 text-lg font-semibold text-gray-900'>
            {t('comingSoon.title')}
          </h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='flex items-center gap-3 rounded-lg bg-white p-3'>
              <div className='h-2 w-2 rounded-full bg-blue-600'></div>
              <span className='text-sm text-gray-700'>
                {t('comingSoon.features.aiWorkout')}
              </span>
            </div>
            <div className='flex items-center gap-3 rounded-lg bg-white p-3'>
              <div className='h-2 w-2 rounded-full bg-green-600'></div>
              <span className='text-sm text-gray-700'>
                {t('comingSoon.features.analytics')}
              </span>
            </div>
            <div className='flex items-center gap-3 rounded-lg bg-white p-3'>
              <div className='h-2 w-2 rounded-full bg-purple-600'></div>
              <span className='text-sm text-gray-700'>
                {t('comingSoon.features.social')}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
