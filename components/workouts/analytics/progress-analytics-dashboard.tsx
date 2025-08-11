/**
 * Progress Analytics Dashboard Component
 * Comprehensive analytics and progress tracking with visual charts and metrics
 */
'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Zap,
  Trophy,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Award,
  Flame,
  ChevronDown,
  Download,
  Share,
  Filter
} from 'lucide-react'
import { 
  LineChart as RechartsLineChart,
  AreaChart,
  BarChart,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  Bar,
  Line,
  Cell,
  Pie
} from 'recharts'
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { WorkoutSession, ProgressMeasurement } from '@/types/workouts'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  workoutStats: {
    totalWorkouts: number
    totalTime: number
    avgIntensity: number
    currentStreak: number
    longestStreak: number
    completionRate: number
    consistency: number
  }
  progressMetrics: {
    strengthGains: number
    enduranceImprovement: number
    flexibilityProgress: number
    weightChange: number
    bodyFatChange: number
  }
  timeSeriesData: Array<{
    date: string
    workouts: number
    duration: number
    intensity: number
    calories: number
  }>
  exerciseBreakdown: Array<{
    category: string
    sessions: number
    percentage: number
    color: string
  }>
  achievements: Array<{
    id: string
    name: string
    description: string
    icon: string
    achievedAt: Date
    category: string
  }>
  goals: Array<{
    id: string
    name: string
    target: number
    current: number
    unit: string
    deadline: Date
    category: string
  }>
}

interface ProgressAnalyticsDashboardProps {
  data: AnalyticsData
  sessions: WorkoutSession[]
  measurements: ProgressMeasurement[]
  className?: string
}

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
]

const TREND_COLORS = {
  positive: 'text-green-600',
  negative: 'text-red-600',
  neutral: 'text-gray-500'
}

export function ProgressAnalyticsDashboard({
  data,
  sessions,
  measurements,
  className
}: ProgressAnalyticsDashboardProps) {
  const t = useTranslations('workouts.analytics')
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'workouts' | 'duration' | 'intensity' | 'calories'>('workouts')

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date()
    const cutoffDate = selectedTimeRange === 'all' ? new Date(0) :
                     selectedTimeRange === '1y' ? subMonths(now, 12) :
                     selectedTimeRange === '90d' ? subDays(now, 90) :
                     selectedTimeRange === '30d' ? subDays(now, 30) :
                     subDays(now, 7)
    
    return data.timeSeriesData.filter(item => new Date(item.date) >= cutoffDate)
  }, [data.timeSeriesData, selectedTimeRange])

  // Calculate trends
  const trends = useMemo(() => {
    if (filteredData.length < 2) {return {}}
    
    const recent = filteredData.slice(-7)
    const previous = filteredData.slice(-14, -7)
    
    const getAverage = (arr: typeof recent, key: keyof typeof recent[0]) => 
      arr.reduce((sum, item) => sum + (item[key] as number), 0) / arr.length
    
    const recentAvg = {
      workouts: getAverage(recent, 'workouts'),
      duration: getAverage(recent, 'duration'),
      intensity: getAverage(recent, 'intensity'),
      calories: getAverage(recent, 'calories')
    }
    
    const previousAvg = {
      workouts: getAverage(previous, 'workouts'),
      duration: getAverage(previous, 'duration'),
      intensity: getAverage(previous, 'intensity'),
      calories: getAverage(previous, 'calories')
    }
    
    return {
      workouts: ((recentAvg.workouts - previousAvg.workouts) / previousAvg.workouts * 100) || 0,
      duration: ((recentAvg.duration - previousAvg.duration) / previousAvg.duration * 100) || 0,
      intensity: ((recentAvg.intensity - previousAvg.intensity) / previousAvg.intensity * 100) || 0,
      calories: ((recentAvg.calories - previousAvg.calories) / previousAvg.calories * 100) || 0
    }
  }, [filteredData])

  const getTrendIcon = (value: number) => {
    if (value > 0) {return <TrendingUp className="w-4 h-4 text-green-600" />}
    if (value < 0) {return <TrendingDown className="w-4 h-4 text-red-600" />}
    return <div className="w-4 h-4" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) {return TREND_COLORS.positive}
    if (value < 0) {return TREND_COLORS.negative}
    return TREND_COLORS.neutral
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h2>
          <p className="text-gray-600">{t('dashboard.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('timeRange.7d')}</SelectItem>
              <SelectItem value="30d">{t('timeRange.30d')}</SelectItem>
              <SelectItem value="90d">{t('timeRange.90d')}</SelectItem>
              <SelectItem value="1y">{t('timeRange.1y')}</SelectItem>
              <SelectItem value="all">{t('timeRange.all')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('actions.export')}
          </Button>
          
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            {t('actions.share')}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('metrics.totalWorkouts')}
          value={data.workoutStats.totalWorkouts}
          icon={<Target className="w-5 h-5" />}
          trend={trends.workouts}
          color="blue"
        />
        <MetricCard
          title={t('metrics.totalTime')}
          value={`${Math.floor(data.workoutStats.totalTime / 60)}h`}
          subtitle={`${data.workoutStats.totalTime % 60}m`}
          icon={<Clock className="w-5 h-5" />}
          trend={trends.duration}
          color="green"
        />
        <MetricCard
          title={t('metrics.avgIntensity')}
          value={data.workoutStats.avgIntensity.toFixed(1)}
          subtitle="/10"
          icon={<Zap className="w-5 h-5" />}
          trend={trends.intensity}
          color="orange"
        />
        <MetricCard
          title={t('metrics.currentStreak')}
          value={data.workoutStats.currentStreak}
          subtitle="days"
          icon={<Flame className="w-5 h-5" />}
          trend={0} // Streaks don't have trends in the same way
          color="red"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            {t('tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('tabs.progress')}
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Trophy className="w-4 h-4 mr-2" />
            {t('tabs.goals')}
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="w-4 h-4 mr-2" />
            {t('tabs.achievements')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t('charts.activityOverTime')}</CardTitle>
                  <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as typeof selectedMetric)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workouts">{t('metrics.workouts')}</SelectItem>
                      <SelectItem value="duration">{t('metrics.duration')}</SelectItem>
                      <SelectItem value="intensity">{t('metrics.intensity')}</SelectItem>
                      <SelectItem value="calories">{t('metrics.calories')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredData}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value as string), 'MMM dd, yyyy')}
                      formatter={(value: number, name: string) => [
                        selectedMetric === 'duration' ? `${value}min` :
                        selectedMetric === 'intensity' ? `${value}/10` :
                        selectedMetric === 'calories' ? `${value} cal` :
                        value,
                        t(`metrics.${selectedMetric}`)
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke={CHART_COLORS[0]}
                      fillOpacity={1}
                      fill="url(#colorMetric)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Exercise Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('charts.exerciseBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={data.exerciseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="sessions"
                    >
                      {data.exerciseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string, props: any) => [
                      `${value} sessions (${props.payload.percentage}%)`,
                      props.payload.category
                    ]} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                
                <div className="space-y-2 mt-4">
                  {data.exerciseBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600">{item.category}</span>
                      </div>
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('stats.completionRate')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {data.workoutStats.completionRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Trophy className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('stats.longestStreak')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {data.workoutStats.longestStreak} {t('common.days')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('stats.consistency')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {data.workoutStats.consistency}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('progress.physicalMetrics')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressMetric
                  label={t('progress.strengthGains')}
                  value={data.progressMetrics.strengthGains}
                  unit="%"
                  color="blue"
                />
                <ProgressMetric
                  label={t('progress.enduranceImprovement')}
                  value={data.progressMetrics.enduranceImprovement}
                  unit="%"
                  color="green"
                />
                <ProgressMetric
                  label={t('progress.flexibilityProgress')}
                  value={data.progressMetrics.flexibilityProgress}
                  unit="%"
                  color="purple"
                />
                <ProgressMetric
                  label={t('progress.weightChange')}
                  value={data.progressMetrics.weightChange}
                  unit="kg"
                  color="orange"
                />
                <ProgressMetric
                  label={t('progress.bodyFatChange')}
                  value={data.progressMetrics.bodyFatChange}
                  unit="%"
                  color="red"
                />
              </CardContent>
            </Card>

            {/* Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('progress.progressOverTime')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value as string), 'MMM dd, yyyy')}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="intensity"
                      stroke={CHART_COLORS[0]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name={t('metrics.intensity')}
                    />
                    <Line
                      type="monotone"
                      dataKey="workouts"
                      stroke={CHART_COLORS[1]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name={t('metrics.workouts')}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.achievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Metric Card Component
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue'
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: number
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  }

  const getTrendIcon = (value?: number) => {
    if (!value || Math.abs(value) < 0.1) {return null}
    return value > 0 ? 
      <TrendingUp className="w-3 h-3 text-green-600" /> : 
      <TrendingDown className="w-3 h-3 text-red-600" />
  }

  const getTrendColor = (value?: number) => {
    if (!value || Math.abs(value) < 0.1) {return 'text-gray-500'}
    return value > 0 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <span className="text-sm text-gray-500">{subtitle}</span>
              )}
            </div>
            {trend !== undefined && Math.abs(trend) >= 0.1 && (
              <div className={cn('flex items-center gap-1 text-xs', getTrendColor(trend))}>
                {getTrendIcon(trend)}
                <span>
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}% from last week
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Progress Metric Component
function ProgressMetric({
  label,
  value,
  unit,
  color = 'blue'
}: {
  label: string
  value: number
  unit: string
  color?: string
}) {
  const isPositive = value > 0
  const progressValue = Math.min(Math.abs(value), 100)

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={cn(
          'text-sm font-medium',
          isPositive ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
        )}>
          {isPositive ? '+' : ''}{value.toFixed(1)}{unit}
        </span>
      </div>
      <Progress 
        value={progressValue} 
        variant={isPositive ? 'success' : value < 0 ? 'destructive' : 'default'}
        size="sm"
      />
    </div>
  )
}

// Goal Card Component
function GoalCard({ goal }: { goal: any }) {
  const progress = Math.min((goal.current / goal.target) * 100, 100)
  const isOverdue = new Date() > new Date(goal.deadline)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900">{goal.name}</h3>
            <Badge variant={isOverdue ? 'destructive' : progress >= 100 ? 'success' : 'outline'}>
              {isOverdue ? 'Overdue' : progress >= 100 ? 'Complete' : 'In Progress'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">
                {goal.current} / {goal.target} {goal.unit}
              </span>
            </div>
            <Progress value={progress} variant={progress >= 100 ? 'success' : 'default'} />
          </div>
          
          <div className="text-xs text-gray-500">
            Deadline: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Achievement Card Component
function AchievementCard({ achievement }: { achievement: any }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{achievement.icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{achievement.name}</h3>
            <p className="text-sm text-gray-600">{achievement.description}</p>
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(achievement.achievedAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}