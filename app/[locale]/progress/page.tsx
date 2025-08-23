/**
 * Progress Tracking Page
 * View fitness progress and analytics
 */
'use client';

import { use } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Dumbbell,
  TrendingUp,
  Target,
  Award,
  Activity,
  Camera,
  Plus,
  BarChart3,
  LineChart,
  PieChart,
  Scale,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  StatCard,
  WorkoutStatsGrid,
} from '@/components/workouts/workout-stats';
import { AppNavigation } from '../../../components/navigation/app-navigation';
import { createLocalizedPath } from '../../../lib/localized-navigation';
import { TranslationErrorBoundary } from '../../../components/providers/translation-error-boundary';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';

interface ProgressPageProps {
  params: Promise<{ locale: string }>;
}

// Mock data for demonstration
const mockStats = {
  totalWorkouts: 47,
  weeklyWorkouts: 4,
  currentStreak: 12,
  totalMinutes: 2340,
  averageIntensity: 7.5,
  completionRate: 85,
};

const mockTrends = {
  workouts: { value: 15, direction: 'up' as const },
  streak: { value: 3, direction: 'up' as const },
  intensity: { value: -5, direction: 'down' as const },
  completion: { value: 8, direction: 'up' as const },
};

const mockMeasurements = [
  {
    id: '1',
    type: 'weight',
    value: 175,
    unit: 'lbs',
    date: new Date(),
    change: -2,
  },
  {
    id: '2',
    type: 'body_fat',
    value: 15.2,
    unit: '%',
    date: new Date(),
    change: -0.8,
  },
  {
    id: '3',
    type: 'muscle_mass',
    value: 148,
    unit: 'lbs',
    date: new Date(),
    change: 3.5,
  },
];

const mockWorkoutData = [
  { date: format(subDays(new Date(), 6), 'MM/dd'), workouts: 1, duration: 75 },
  { date: format(subDays(new Date(), 5), 'MM/dd'), workouts: 0, duration: 0 },
  { date: format(subDays(new Date(), 4), 'MM/dd'), workouts: 1, duration: 60 },
  { date: format(subDays(new Date(), 3), 'MM/dd'), workouts: 1, duration: 80 },
  { date: format(subDays(new Date(), 2), 'MM/dd'), workouts: 0, duration: 0 },
  { date: format(subDays(new Date(), 1), 'MM/dd'), workouts: 1, duration: 70 },
  { date: format(new Date(), 'MM/dd'), workouts: 1, duration: 65 },
];

export default function ProgressPage({ params }: ProgressPageProps) {
  const t = useTranslations('progress');
  const { locale } = use(params);

  const mockAchievements = [
    {
      id: '1',
      name: t('achievements.consistencyChampion'),
      description: t('achievements.consistencyDesc'),
      icon: '🔥',
      category: 'streak',
      date: new Date(Date.now() - 2 * 86400000),
      points: 100,
    },
    {
      id: '2',
      name: t('achievements.strengthMilestone'),
      description: t('achievements.strengthDesc'),
      icon: '💪',
      category: 'strength',
      date: new Date(Date.now() - 7 * 86400000),
      points: 150,
    },
    {
      id: '3',
      name: t('achievements.cardioCrusher'),
      description: t('achievements.cardioDesc'),
      icon: '🏃',
      category: 'cardio',
      date: new Date(Date.now() - 14 * 86400000),
      points: 200,
    },
  ];

  const totalPoints = mockAchievements.reduce(
    (sum, achievement) => sum + achievement.points,
    0
  );

  return (
    <TranslationErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Modern Navigation Header */}
        <AppNavigation locale={locale} variant='progress' />

        {/* Main Content */}
        <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
          {/* Page Header */}
          <div className='mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h2 className='mb-2 text-3xl font-bold text-gray-900'>
                {t('title')}
              </h2>
              <p className='text-gray-600'>{t('subtitle')}</p>
            </div>
            <div className='mt-4 flex gap-3 sm:mt-0'>
              <Button variant='outline' size='sm'>
                <Camera className='mr-2 h-4 w-4' />
                {t('buttons.progressPhotos')}
              </Button>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                {t('buttons.logMeasurement')}
              </Button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className='mb-8'>
            <WorkoutStatsGrid stats={mockStats} trends={mockTrends} />
          </div>

          {/* Main Progress Tabs */}
          <Tabs defaultValue='overview' className='w-full'>
            <TabsList className='grid w-full grid-cols-5'>
              <TabsTrigger value='overview'>
                <BarChart3 className='mr-2 h-4 w-4' />
                {t('tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value='measurements'>
                <Scale className='mr-2 h-4 w-4' />
                {t('tabs.measurements')}
              </TabsTrigger>
              <TabsTrigger value='strength'>
                <Dumbbell className='mr-2 h-4 w-4' />
                {t('tabs.strength')}
              </TabsTrigger>
              <TabsTrigger value='achievements'>
                <Award className='mr-2 h-4 w-4' />
                {t('tabs.achievements')}
              </TabsTrigger>
              <TabsTrigger value='analytics'>
                <LineChart className='mr-2 h-4 w-4' />
                {t('tabs.analytics')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value='overview' className='mt-6 space-y-6'>
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Activity className='h-5 w-5' />
                    {t('recentActivity.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('recentActivity.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-7 gap-2'>
                    {mockWorkoutData.map((day, index) => (
                      <div key={index} className='text-center'>
                        <div className='mb-2 text-xs text-gray-500'>
                          {day.date}
                        </div>
                        <div
                          className={cn(
                            'flex h-20 w-full items-end justify-center rounded-lg p-2',
                            day.workouts > 0 ? 'bg-green-100' : 'bg-gray-100'
                          )}
                        >
                          {day.workouts > 0 && (
                            <div
                              className={cn(
                                'w-full rounded bg-green-500',
                                `h-${Math.max(2, Math.floor((day.duration / 90) * 16))}`
                              )}
                            />
                          )}
                        </div>
                        <div className='mt-1 text-xs font-medium'>
                          {day.workouts > 0
                            ? `${day.duration}min`
                            : t('recentActivity.rest')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>
                      {t('thisMonth.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>
                          {t('thisMonth.workouts')}
                        </span>
                        <span className='font-semibold'>16/20</span>
                      </div>
                      <Progress value={80} variant='success' />
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>
                          {t('thisMonth.minutes')}
                        </span>
                        <span className='font-semibold'>1,240</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>
                          {t('thisMonth.avgIntensity')}
                        </span>
                        <span className='font-semibold'>7.8/10</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>
                      {t('personalRecords.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>
                          {t('personalRecords.benchPress')}
                        </span>
                        <Badge variant='success'>225 lbs</Badge>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>
                          {t('personalRecords.squat')}
                        </span>
                        <Badge variant='success'>315 lbs</Badge>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>
                          {t('personalRecords.deadlift')}
                        </span>
                        <Badge variant='success'>365 lbs</Badge>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>
                          {t('personalRecords.run5k')}
                        </span>
                        <Badge variant='success'>22:15</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>
                      {t('achievementPoints.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-center'>
                      <div className='mb-2 text-3xl font-bold text-purple-600'>
                        {totalPoints}
                      </div>
                      <div className='mb-4 text-sm text-gray-600'>
                        {t('achievementPoints.totalEarned')}
                      </div>
                      <div className='space-y-2'>
                        {mockAchievements.slice(0, 2).map((achievement) => (
                          <div
                            key={achievement.id}
                            className='flex items-center gap-2 text-sm'
                          >
                            <span>{achievement.icon}</span>
                            <span className='truncate'>{achievement.name}</span>
                            <Badge variant='outline' className='text-xs'>
                              +{achievement.points}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Body Measurements Tab */}
            <TabsContent value='measurements' className='mt-6 space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                {mockMeasurements.map((measurement) => {
                  const isPositive = measurement.change > 0;
                  const isWeight =
                    measurement.type === 'weight' ||
                    measurement.type === 'body_fat';
                  const trendDirection = isWeight ? !isPositive : isPositive;

                  return (
                    <Card key={measurement.id}>
                      <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between'>
                          <CardTitle className='text-lg'>
                            {measurement.type === 'weight'
                              ? t('measurements.weight')
                              : measurement.type === 'body_fat'
                                ? t('measurements.bodyFat')
                                : t('measurements.muscleMass')}
                          </CardTitle>
                          {measurement.type === 'weight' && (
                            <Scale className='h-5 w-5 text-gray-500' />
                          )}
                          {measurement.type === 'body_fat' && (
                            <PieChart className='h-5 w-5 text-gray-500' />
                          )}
                          {measurement.type === 'muscle_mass' && (
                            <Dumbbell className='h-5 w-5 text-gray-500' />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className='mb-2 text-3xl font-bold'>
                          {measurement.value} {measurement.unit}
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1 text-sm',
                            trendDirection ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          <TrendingUp
                            className={cn(
                              'h-4 w-4',
                              !trendDirection && 'rotate-180'
                            )}
                          />
                          <span>
                            {isPositive ? '+' : ''}
                            {measurement.change} {measurement.unit}{' '}
                            {t('measurements.thisMonth')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Body Composition Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('measurements.bodyComposition')}</CardTitle>
                  <CardDescription>
                    {t('measurements.bodyCompositionDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex h-64 items-center justify-center text-gray-500'>
                    <div className='text-center'>
                      <LineChart className='mx-auto mb-4 h-16 w-16 opacity-50' />
                      <p>{t('measurements.chartPlaceholder')}</p>
                      <p className='text-sm'>
                        {t('measurements.connectScale')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Strength Progress Tab */}
            <TabsContent value='strength' className='mt-6 space-y-6'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <StatCard
                  title={t('strength.benchPressPR')}
                  value='225 lbs'
                  trend={{
                    value: 15,
                    direction: 'up',
                    label: t('strength.sinceLastMonth'),
                  }}
                  icon={<Dumbbell className='h-6 w-6' />}
                  color='blue'
                />
                <StatCard
                  title={t('strength.squatPR')}
                  value='315 lbs'
                  trend={{
                    value: 10,
                    direction: 'up',
                    label: t('strength.sinceLastMonth'),
                  }}
                  icon={<Target className='h-6 w-6' />}
                  color='green'
                />
                <StatCard
                  title={t('strength.deadliftPR')}
                  value='365 lbs'
                  trend={{
                    value: 8,
                    direction: 'up',
                    label: t('strength.sinceLastMonth'),
                  }}
                  icon={<Zap className='h-6 w-6' />}
                  color='purple'
                />
                <StatCard
                  title={t('strength.totalVolume')}
                  value='12,450 lbs'
                  trend={{
                    value: 22,
                    direction: 'up',
                    label: t('strength.thisWeek'),
                  }}
                  icon={<BarChart3 className='h-6 w-6' />}
                  color='orange'
                />
              </div>

              {/* Strength Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('strength.strengthProgress')}</CardTitle>
                  <CardDescription>
                    {t('strength.strengthProgressDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex h-64 items-center justify-center text-gray-500'>
                    <div className='text-center'>
                      <TrendingUp className='mx-auto mb-4 h-16 w-16 opacity-50' />
                      <p>{t('strength.chartPlaceholder')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value='achievements' className='mt-6 space-y-6'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {mockAchievements.map((achievement) => (
                  <Card key={achievement.id}>
                    <CardContent className='p-6'>
                      <div className='flex items-start gap-4'>
                        <div className='text-3xl'>{achievement.icon}</div>
                        <div className='flex-1'>
                          <h3 className='mb-1 font-semibold text-gray-900'>
                            {achievement.name}
                          </h3>
                          <p className='mb-3 text-sm text-gray-600'>
                            {achievement.description}
                          </p>
                          <div className='flex items-center justify-between'>
                            <Badge variant='outline' className='capitalize'>
                              {achievement.category}
                            </Badge>
                            <div className='flex items-center gap-1 text-sm text-purple-600'>
                              <Award className='h-4 w-4' />+{achievement.points}{' '}
                              pts
                            </div>
                          </div>
                          <p className='mt-2 text-xs text-gray-500'>
                            {t('achievements.earned')}{' '}
                            {format(achievement.date, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Goals Section */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('achievements.activeGoals')}</CardTitle>
                  <CardDescription>
                    {t('achievements.activeGoalsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between rounded-lg bg-blue-50 p-4'>
                      <div>
                        <h4 className='font-medium'>
                          {t('achievements.benchPress250')}
                        </h4>
                        <p className='text-sm text-gray-600'>
                          {t('achievements.current')}: 225 lbs
                        </p>
                      </div>
                      <div className='text-right'>
                        <Progress value={90} className='mb-1 w-24' />
                        <span className='text-xs text-gray-500'>
                          90% {t('achievements.complete')}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between rounded-lg bg-green-50 p-4'>
                      <div>
                        <h4 className='font-medium'>
                          {t('achievements.lose10lbs')}
                        </h4>
                        <p className='text-sm text-gray-600'>
                          {t('achievements.progress')}: -8 lbs
                        </p>
                      </div>
                      <div className='text-right'>
                        <Progress
                          value={80}
                          className='mb-1 w-24'
                          variant='success'
                        />
                        <span className='text-xs text-gray-500'>
                          80% {t('achievements.complete')}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between rounded-lg bg-purple-50 p-4'>
                      <div>
                        <h4 className='font-medium'>
                          {t('achievements.consistency30')}
                        </h4>
                        <p className='text-sm text-gray-600'>
                          {t('achievements.currentStreak')}: 12 days
                        </p>
                      </div>
                      <div className='text-right'>
                        <Progress
                          value={40}
                          className='mb-1 w-24'
                          variant='warning'
                        />
                        <span className='text-xs text-gray-500'>
                          40% {t('achievements.complete')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value='analytics' className='mt-6'>
              <div className='py-16 text-center'>
                <BarChart3 className='mx-auto mb-4 h-16 w-16 text-gray-400' />
                <h3 className='mb-2 text-xl font-semibold text-gray-900'>
                  {t('analytics.title')}
                </h3>
                <p className='mx-auto mb-6 max-w-md text-gray-600'>
                  {t('analytics.description')}
                </p>
                <Button asChild>
                  <Link
                    href={createLocalizedPath(
                      'workouts',
                      locale as 'en' | 'es'
                    )}
                  >
                    {t('buttons.continueTraining')}
                  </Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TranslationErrorBoundary>
  );
}
