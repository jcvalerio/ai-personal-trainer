/**
 * Progress Tracking Page
 * View fitness progress and analytics
 */

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { 
  Dumbbell, 
  TrendingUp, 
  Calendar,
  Target,
  Award,
  Activity,
  Camera,
  Plus,
  BarChart3,
  LineChart,
  PieChart,
  Scale,
  Ruler,
  Heart,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StatCard, WorkoutStatsGrid } from '@/components/workouts/workout-stats'
import { cn } from '@/lib/utils'
import { format, subDays, subMonths } from 'date-fns'

// Mock data for demonstration
const mockStats = {
  totalWorkouts: 47,
  weeklyWorkouts: 4,
  currentStreak: 12,
  totalMinutes: 2340,
  averageIntensity: 7.5,
  completionRate: 85
}

const mockTrends = {
  workouts: { value: 15, direction: 'up' as const },
  streak: { value: 3, direction: 'up' as const },
  intensity: { value: -5, direction: 'down' as const },
  completion: { value: 8, direction: 'up' as const }
}

const mockMeasurements = [
  { 
    id: '1',
    type: 'weight',
    value: 175,
    unit: 'lbs',
    date: new Date(),
    change: -2
  },
  { 
    id: '2',
    type: 'body_fat',
    value: 15.2,
    unit: '%',
    date: new Date(),
    change: -0.8
  },
  { 
    id: '3',
    type: 'muscle_mass',
    value: 148,
    unit: 'lbs',
    date: new Date(),
    change: 3.5
  }
]

const mockAchievements = [
  {
    id: '1',
    name: 'Consistency Champion',
    description: 'Completed 7 consecutive workouts',
    icon: '🔥',
    category: 'streak',
    date: new Date(Date.now() - 2 * 86400000),
    points: 100
  },
  {
    id: '2',
    name: 'Strength Milestone',
    description: 'Increased bench press by 20 lbs',
    icon: '💪',
    category: 'strength',
    date: new Date(Date.now() - 7 * 86400000),
    points: 150
  },
  {
    id: '3',
    name: 'Cardio Crusher',
    description: 'Completed first 5K run',
    icon: '🏃',
    category: 'cardio',
    date: new Date(Date.now() - 14 * 86400000),
    points: 200
  }
]

const mockWorkoutData = [
  { date: format(subDays(new Date(), 6), 'MM/dd'), workouts: 1, duration: 75 },
  { date: format(subDays(new Date(), 5), 'MM/dd'), workouts: 0, duration: 0 },
  { date: format(subDays(new Date(), 4), 'MM/dd'), workouts: 1, duration: 60 },
  { date: format(subDays(new Date(), 3), 'MM/dd'), workouts: 1, duration: 80 },
  { date: format(subDays(new Date(), 2), 'MM/dd'), workouts: 0, duration: 0 },
  { date: format(subDays(new Date(), 1), 'MM/dd'), workouts: 1, duration: 70 },
  { date: format(new Date(), 'MM/dd'), workouts: 1, duration: 65 }
]

export default function ProgressPage() {
  const totalPoints = mockAchievements.reduce((sum, achievement) => sum + achievement.points, 0)
  const averageWorkoutDuration = Math.round(mockStats.totalMinutes / mockStats.totalWorkouts)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI Personal Trainer</h1>
                  <p className="text-xs text-gray-500">Progress Tracking</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/workouts" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Workouts
                </Link>
                <Link 
                  href="/progress" 
                  className="text-blue-600 font-medium border-b-2 border-blue-600 pb-4 -mb-4"
                >
                  Progress
                </Link>
                <Link 
                  href="/exercises" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Exercises
                </Link>
              </nav>
              
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  }
                }}
                showName={false}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h2>
            <p className="text-gray-600">Track your fitness journey and celebrate achievements</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              Progress Photos
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log Measurement
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="mb-8">
          <WorkoutStatsGrid stats={mockStats} trends={mockTrends} />
        </div>

        {/* Main Progress Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="measurements">
              <Scale className="w-4 h-4 mr-2" />
              Body
            </TabsTrigger>
            <TabsTrigger value="strength">
              <Dumbbell className="w-4 h-4 mr-2" />
              Strength
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Award className="w-4 h-4 mr-2" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <LineChart className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your workout activity over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {mockWorkoutData.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-500 mb-2">{day.date}</div>
                      <div className={cn(
                        'w-full h-20 rounded-lg flex items-end justify-center p-2',
                        day.workouts > 0 ? 'bg-green-100' : 'bg-gray-100'
                      )}>
                        {day.workouts > 0 && (
                          <div className={cn(
                            'w-full rounded bg-green-500',
                            `h-${Math.max(2, Math.floor((day.duration / 90) * 16))}`
                          )} />
                        )}
                      </div>
                      <div className="text-xs font-medium mt-1">
                        {day.workouts > 0 ? `${day.duration}min` : 'Rest'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Workouts</span>
                      <span className="font-semibold">16/20</span>
                    </div>
                    <Progress value={80} variant="success" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Minutes</span>
                      <span className="font-semibold">1,240</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Intensity</span>
                      <span className="font-semibold">7.8/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bench Press</span>
                      <Badge variant="success">225 lbs</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Squat</span>
                      <Badge variant="success">315 lbs</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Deadlift</span>
                      <Badge variant="success">365 lbs</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">5K Run</span>
                      <Badge variant="success">22:15</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Achievement Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{totalPoints}</div>
                    <div className="text-sm text-gray-600 mb-4">Total Points Earned</div>
                    <div className="space-y-2">
                      {mockAchievements.slice(0, 2).map(achievement => (
                        <div key={achievement.id} className="flex items-center gap-2 text-sm">
                          <span>{achievement.icon}</span>
                          <span className="truncate">{achievement.name}</span>
                          <Badge variant="outline" className="text-xs">+{achievement.points}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Body Measurements Tab */}
          <TabsContent value="measurements" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockMeasurements.map(measurement => {
                const isPositive = measurement.change > 0
                const isWeight = measurement.type === 'weight' || measurement.type === 'body_fat'
                const trendDirection = isWeight ? !isPositive : isPositive
                
                return (
                  <Card key={measurement.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg capitalize">
                          {measurement.type.replace('_', ' ')}
                        </CardTitle>
                        {measurement.type === 'weight' && <Scale className="w-5 h-5 text-gray-500" />}
                        {measurement.type === 'body_fat' && <PieChart className="w-5 h-5 text-gray-500" />}
                        {measurement.type === 'muscle_mass' && <Dumbbell className="w-5 h-5 text-gray-500" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">
                        {measurement.value} {measurement.unit}
                      </div>
                      <div className={cn(
                        'flex items-center gap-1 text-sm',
                        trendDirection ? 'text-green-600' : 'text-red-600'
                      )}>
                        <TrendingUp className={cn(
                          'w-4 h-4',
                          !trendDirection && 'rotate-180'
                        )} />
                        <span>
                          {isPositive ? '+' : ''}{measurement.change} {measurement.unit} this month
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {/* Body Composition Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Body Composition Trends</CardTitle>
                <CardDescription>
                  Track changes in your body composition over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <LineChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Chart visualization would appear here</p>
                    <p className="text-sm">Connect a smart scale for automatic tracking</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strength Progress Tab */}
          <TabsContent value="strength" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Bench Press PR"
                value="225 lbs"
                trend={{ value: 15, direction: 'up', label: 'since last month' }}
                icon={<Dumbbell className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Squat PR"
                value="315 lbs"
                trend={{ value: 10, direction: 'up', label: 'since last month' }}
                icon={<Target className="w-6 h-6" />}
                color="green"
              />
              <StatCard
                title="Deadlift PR"
                value="365 lbs"
                trend={{ value: 8, direction: 'up', label: 'since last month' }}
                icon={<Zap className="w-6 h-6" />}
                color="purple"
              />
              <StatCard
                title="Total Volume"
                value="12,450 lbs"
                trend={{ value: 22, direction: 'up', label: 'this week' }}
                icon={<BarChart3 className="w-6 h-6" />}
                color="orange"
              />
            </div>
            
            {/* Strength Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Strength Progress</CardTitle>
                <CardDescription>
                  Track your main lift progress over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Strength progression chart would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAchievements.map(achievement => (
                <Card key={achievement.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="capitalize">
                            {achievement.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-purple-600">
                            <Award className="w-4 h-4" />
                            +{achievement.points} pts
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Earned {format(achievement.date, 'MMM d, yyyy')}
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
                <CardTitle>Active Goals</CardTitle>
                <CardDescription>
                  Track your progress towards fitness milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Bench Press 250 lbs</h4>
                      <p className="text-sm text-gray-600">Current: 225 lbs</p>
                    </div>
                    <div className="text-right">
                      <Progress value={90} className="w-24 mb-1" />
                      <span className="text-xs text-gray-500">90% complete</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Lose 10 lbs</h4>
                      <p className="text-sm text-gray-600">Progress: -8 lbs</p>
                    </div>
                    <div className="text-right">
                      <Progress value={80} className="w-24 mb-1" variant="success" />
                      <span className="text-xs text-gray-500">80% complete</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">30-day Consistency</h4>
                      <p className="text-sm text-gray-600">Current streak: 12 days</p>
                    </div>
                    <div className="text-right">
                      <Progress value={40} className="w-24 mb-1" variant="warning" />
                      <span className="text-xs text-gray-500">40% complete</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Detailed analytics and insights will be available with more workout data.
              </p>
              <Button asChild>
                <Link href="/workouts">
                  Continue Training
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}