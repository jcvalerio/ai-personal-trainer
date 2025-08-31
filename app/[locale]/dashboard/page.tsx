/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */
'use client';

import Link from 'next/link';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { Dumbbell, Users, Target, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { AppNavigation } from '../../../components/navigation/app-navigation';
import { createLocalizedPath } from '../../../lib/localized-navigation';
import { useDashboardStats } from '../../../hooks/use-dashboard-stats';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const t = useTranslations('dashboard');
  const { locale } = use(params);
  const { stats, recentActivity, isLoading, error } = useDashboardStats();

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
          <StatCard
            icon={Target}
            iconColor="blue"
            label={t('stats.workoutsThisWeek')}
            value={stats.workoutsThisWeek}
            isLoading={isLoading}
            error={error || undefined}
          />
          
          <StatCard
            icon={TrendingUp}
            iconColor="green"
            label={t('stats.currentStreak')}
            value={`${stats.currentStreak} ${t('stats.streakDays')}`}
            isLoading={isLoading}
            error={error || undefined}
          />
          
          <StatCard
            icon={Dumbbell}
            iconColor="purple"
            label={t('stats.totalWorkouts')}
            value={stats.totalWorkouts}
            isLoading={isLoading}
            error={error || undefined}
          />
          
          <StatCard
            icon={Users}
            iconColor="orange"
            label={t('stats.community')}
            value={stats.activeWorkoutPlans}
            isLoading={isLoading}
            error={error || undefined}
          />
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
            {isLoading ? (
              <LoadingState 
                variant="centered" 
                message="Loading activity..." 
                icon={TrendingUp}
              />
            ) : error ? (
              <ErrorState
                variant="centered"
                message="Error loading activity"
                description={error || undefined}
                onRetry={() => window.location.reload()}
              />
            ) : recentActivity.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title={t('recentActivity.empty.title')}
                description={t('recentActivity.empty.description')}
              />
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`rounded-full p-2 ${
                      activity.type === 'workout_completed' 
                        ? 'bg-green-100 text-green-600' 
                        : activity.type === 'plan_created'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {activity.type === 'workout_completed' ? (
                        <Target className="h-4 w-4" />
                      ) : activity.type === 'plan_created' ? (
                        <Dumbbell className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length > 5 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">
                      +{recentActivity.length - 5} more activities
                    </p>
                  </div>
                )}
              </div>
            )}
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
