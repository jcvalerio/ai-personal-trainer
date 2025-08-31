/**
 * Progress Tracking Page
 * View fitness progress and analytics
 */
'use client';

import { use, useState } from 'react';
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
  Smartphone,
  RefreshCw,
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
import { LogMeasurementDialog } from '@/components/progress/log-measurement-dialog';
import { HealthSyncDialog } from '@/components/progress/health-sync-dialog';
import {
  useProgressMeasurements,
  useProgressStats,
  useCreateMeasurement,
} from '@/hooks/use-progress';
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

  // State for measurement dialog
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<
    'weight' | 'body_fat' | 'muscle_mass' | 'circumference'
  >('weight');

  // Hooks for data fetching
  const {
    measurements,
    isLoading: measurementsLoading,
    refetch: refetchMeasurements,
  } = useProgressMeasurements({
    limit: 10,
  });
  const { stats, isLoading: statsLoading } = useProgressStats({
    timeframe: 'month',
    includeComparisons: true,
    includeTrends: true,
  });
  const { createMeasurement, isCreating } = useCreateMeasurement();

  // Handle measurement submission
  const handleMeasurementSubmit = async (data: any) => {
    const success = await createMeasurement(data);
    if (success) {
      refetchMeasurements();
      setLogDialogOpen(false);
    }
  };

  // Handle opening measurement dialog with specific type
  const openMeasurementDialog = (
    type?: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference'
  ) => {
    if (type) setSelectedMeasurementType(type);
    setLogDialogOpen(true);
  };

  // Handle sync completion
  const handleSyncComplete = () => {
    // Refresh measurements after sync
    refetchMeasurements();
  };

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

  // Get recent measurements for display
  const recentMeasurements = measurements.slice(0, 3);

  // Process measurements for different types
  const measurementsByType = measurements.reduce(
    (acc, measurement) => {
      if (!acc[measurement.measurementType]) {
        acc[measurement.measurementType] = [];
      }
      acc[measurement.measurementType]!.push(measurement);
      return acc;
    },
    {} as Record<string, typeof measurements>
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
            <div className='mt-4 flex flex-wrap gap-3 sm:mt-0'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSyncDialogOpen(true)}
              >
                <Smartphone className='mr-2 h-4 w-4' />
                Sync Fitindex
              </Button>
              <Button variant='outline' size='sm' disabled>
                <Camera className='mr-2 h-4 w-4' />
                {t('buttons.progressPhotos')}
              </Button>
              <Button onClick={() => openMeasurementDialog()}>
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
              {measurementsLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <div className='mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600'></div>
                    <p className='mt-2 text-gray-600'>
                      Loading measurements...
                    </p>
                  </div>
                </div>
              ) : measurements.length === 0 ? (
                <div className='py-12 text-center'>
                  <Scale className='mx-auto h-16 w-16 text-gray-400' />
                  <h3 className='mt-4 text-lg font-medium text-gray-900'>
                    No measurements yet
                  </h3>
                  <p className='mt-2 text-gray-600'>
                    Start tracking your progress by logging your first
                    measurement.
                  </p>
                  <Button
                    onClick={() => openMeasurementDialog()}
                    className='mt-4'
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    Log First Measurement
                  </Button>
                </div>
              ) : (
                <>
                  {/* Quick Action Buttons */}
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setSyncDialogOpen(true)}
                    >
                      <RefreshCw className='mr-2 h-4 w-4' />
                      Sync Fitindex
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openMeasurementDialog('weight')}
                    >
                      <Scale className='mr-2 h-4 w-4' />
                      Log Weight
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openMeasurementDialog('body_fat')}
                    >
                      <PieChart className='mr-2 h-4 w-4' />
                      Log Body Fat
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openMeasurementDialog('muscle_mass')}
                    >
                      <Dumbbell className='mr-2 h-4 w-4' />
                      Log Muscle Mass
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openMeasurementDialog('circumference')}
                    >
                      <Activity className='mr-2 h-4 w-4' />
                      Log Circumference
                    </Button>
                  </div>

                  {/* Current Measurements Grid */}
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                    {['weight', 'body_fat', 'muscle_mass'].map((type) => {
                      const typeMeasurements = measurementsByType[type];
                      const latest = typeMeasurements?.[0];
                      const previous = typeMeasurements?.[1];

                      if (!latest) return null;

                      const change = previous
                        ? latest.value - previous.value
                        : 0;
                      const isPositive = change > 0;
                      const isWeight = type === 'weight' || type === 'body_fat';
                      const trendDirection = isWeight
                        ? !isPositive
                        : isPositive;

                      return (
                        <Card
                          key={type}
                          className='cursor-pointer transition-shadow hover:shadow-md'
                          onClick={() => openMeasurementDialog(type as any)}
                        >
                          <CardHeader className='pb-3'>
                            <div className='flex items-center justify-between'>
                              <CardTitle className='text-lg'>
                                {type === 'weight' && t('measurements.weight')}
                                {type === 'body_fat' &&
                                  t('measurements.bodyFat')}
                                {type === 'muscle_mass' &&
                                  t('measurements.muscleMass')}
                              </CardTitle>
                              {type === 'weight' && (
                                <Scale className='h-5 w-5 text-gray-500' />
                              )}
                              {type === 'body_fat' && (
                                <PieChart className='h-5 w-5 text-gray-500' />
                              )}
                              {type === 'muscle_mass' && (
                                <Dumbbell className='h-5 w-5 text-gray-500' />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className='mb-2 text-3xl font-bold'>
                              {latest.value} {latest.unit}
                            </div>
                            {previous && (
                              <div
                                className={cn(
                                  'flex items-center gap-1 text-sm',
                                  trendDirection
                                    ? 'text-green-600'
                                    : 'text-red-600'
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
                                  {change.toFixed(1)} {latest.unit} from last
                                  measurement
                                </span>
                              </div>
                            )}
                            <p className='mt-1 text-xs text-gray-500'>
                              {format(
                                new Date(latest.measuredAt),
                                'MMM d, yyyy'
                              )}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Recent Measurements List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Measurements</CardTitle>
                      <CardDescription>
                        Your latest body measurements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {recentMeasurements.map((measurement) => (
                          <div
                            key={measurement.id}
                            className='flex items-center justify-between rounded-lg bg-gray-50 p-3'
                          >
                            <div className='flex items-center gap-3'>
                              {measurement.measurementType === 'weight' && (
                                <Scale className='h-5 w-5 text-gray-600' />
                              )}
                              {measurement.measurementType === 'body_fat' && (
                                <PieChart className='h-5 w-5 text-gray-600' />
                              )}
                              {measurement.measurementType ===
                                'muscle_mass' && (
                                <Dumbbell className='h-5 w-5 text-gray-600' />
                              )}
                              {measurement.measurementType ===
                                'circumference' && (
                                <Activity className='h-5 w-5 text-gray-600' />
                              )}
                              <div>
                                <p className='font-medium'>
                                  {measurement.measurementType === 'weight' &&
                                    t('measurements.weight')}
                                  {measurement.measurementType === 'body_fat' &&
                                    t('measurements.bodyFat')}
                                  {measurement.measurementType ===
                                    'muscle_mass' &&
                                    t('measurements.muscleMass')}
                                  {measurement.measurementType ===
                                    'circumference' &&
                                    `${measurement.measurementLocation} circumference`}
                                </p>
                                <p className='text-sm text-gray-600'>
                                  {format(
                                    new Date(measurement.measuredAt),
                                    'MMM d, yyyy h:mm a'
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className='text-right'>
                              <p className='font-semibold'>
                                {measurement.value} {measurement.unit}
                              </p>
                              {measurement.measurementMethod && (
                                <p className='text-sm text-gray-600'>
                                  {measurement.measurementMethod}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

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

        {/* Measurement Logging Dialog */}
        <LogMeasurementDialog
          open={logDialogOpen}
          onOpenChange={setLogDialogOpen}
          onSubmit={handleMeasurementSubmit}
          defaultType={selectedMeasurementType}
          isLoading={isCreating}
        />

        {/* Health Sync Dialog */}
        <HealthSyncDialog
          open={syncDialogOpen}
          onOpenChange={(open) => {
            console.log('Dialog onOpenChange called with:', open);
            setSyncDialogOpen(open);
          }}
          onSyncComplete={handleSyncComplete}
        />
      </div>
    </TranslationErrorBoundary>
  );
}
