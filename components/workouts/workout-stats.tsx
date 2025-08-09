/**
 * Workout Statistics Component
 * Displays workout statistics and metrics
 */

import { TrendingUp, TrendingDown, Minus, Calendar, Clock, Target, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  className?: string
}

function getTrendIcon(direction: 'up' | 'down' | 'neutral') {
  switch (direction) {
    case 'up':
      return <TrendingUp className="h-3 w-3" />
    case 'down':
      return <TrendingDown className="h-3 w-3" />
    case 'neutral':
    default:
      return <Minus className="h-3 w-3" />
  }
}

function getTrendColor(direction: 'up' | 'down' | 'neutral') {
  switch (direction) {
    case 'up':
      return 'text-green-600'
    case 'down':
      return 'text-red-600'
    case 'neutral':
    default:
      return 'text-gray-500'
  }
}

function getColorClasses(color: string) {
  switch (color) {
    case 'green':
      return {
        icon: 'bg-green-100 text-green-600',
        value: 'text-green-900'
      }
    case 'purple':
      return {
        icon: 'bg-purple-100 text-purple-600',
        value: 'text-purple-900'
      }
    case 'orange':
      return {
        icon: 'bg-orange-100 text-orange-600',
        value: 'text-orange-900'
      }
    case 'red':
      return {
        icon: 'bg-red-100 text-red-600',
        value: 'text-red-900'
      }
    case 'blue':
    default:
      return {
        icon: 'bg-blue-100 text-blue-600',
        value: 'text-blue-900'
      }
  }
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  color = 'blue',
  className 
}: StatCardProps) {
  const colorClasses = getColorClasses(color)
  
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-lg', colorClasses.icon)}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">{title}</p>
            <p className={cn('text-2xl font-bold', colorClasses.value)}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
            {trend && (
              <div className={cn('flex items-center gap-1 text-xs mt-1', getTrendColor(trend.direction))}>
                {getTrendIcon(trend.direction)}
                <span>{trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface WorkoutStatsGridProps {
  stats: {
    totalWorkouts: number
    weeklyWorkouts: number
    currentStreak: number
    totalMinutes: number
    averageIntensity: number
    completionRate: number
  }
  trends?: {
    workouts: { value: number; direction: 'up' | 'down' | 'neutral' }
    streak: { value: number; direction: 'up' | 'down' | 'neutral' }
    intensity: { value: number; direction: 'up' | 'down' | 'neutral' }
    completion: { value: number; direction: 'up' | 'down' | 'neutral' }
  }
  className?: string
}

export function WorkoutStatsGrid({ stats, trends, className }: WorkoutStatsGridProps) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <StatCard
        title="Total Workouts"
        value={stats.totalWorkouts}
        trend={trends?.workouts ? { ...trends.workouts, label: 'from last month' } : undefined}
        icon={<Target className="h-6 w-6" />}
        color="blue"
      />
      
      <StatCard
        title="This Week"
        value={stats.weeklyWorkouts}
        subtitle="workouts completed"
        icon={<Calendar className="h-6 w-6" />}
        color="green"
      />
      
      <StatCard
        title="Current Streak"
        value={`${stats.currentStreak} days`}
        trend={trends?.streak ? { ...trends.streak, label: 'streak change' } : undefined}
        icon={<Zap className="h-6 w-6" />}
        color="purple"
      />
      
      <StatCard
        title="Total Time"
        value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`}
        subtitle="time exercised"
        icon={<Clock className="h-6 w-6" />}
        color="orange"
      />
    </div>
  )
}

interface ProgressOverviewProps {
  weeklyGoal: number
  currentProgress: number
  monthlyStats: {
    planned: number
    completed: number
  }
  className?: string
}

export function ProgressOverview({ 
  weeklyGoal, 
  currentProgress, 
  monthlyStats,
  className 
}: ProgressOverviewProps) {
  const weeklyPercentage = Math.min((currentProgress / weeklyGoal) * 100, 100)
  const monthlyPercentage = Math.min((monthlyStats.completed / monthlyStats.planned) * 100, 100)
  
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Progress Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Weekly Goal</span>
            <span className="text-sm text-gray-500">
              {currentProgress} of {weeklyGoal} workouts
            </span>
          </div>
          <Progress value={weeklyPercentage} variant="success" className="mb-2" />
          <div className="flex justify-between items-center">
            <Badge variant={weeklyPercentage >= 100 ? 'success' : 'outline'}>
              {Math.round(weeklyPercentage)}% complete
            </Badge>
            {weeklyPercentage >= 100 && (
              <span className="text-xs text-green-600 font-medium">Goal achieved! 🎉</span>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">This Month</span>
            <span className="text-sm text-gray-500">
              {monthlyStats.completed} of {monthlyStats.planned} sessions
            </span>
          </div>
          <Progress value={monthlyPercentage} variant="default" className="mb-2" />
          <Badge variant={monthlyPercentage >= 80 ? 'success' : monthlyPercentage >= 60 ? 'warning' : 'destructive'}>
            {Math.round(monthlyPercentage)}% completion rate
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}