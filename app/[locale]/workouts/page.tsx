/**
 * Main Workouts Dashboard Page
 * Central hub for all workout-related activities
 */
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Dumbbell, Plus, Calendar, BarChart3, Library, Sparkles, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { WorkoutCard } from '@/components/workouts/workout-card'
import { SessionCard } from '@/components/workouts/session-card'
import { WorkoutStatsGrid, ProgressOverview } from '@/components/workouts/workout-stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'

// Mock data for demonstration - in a real app, this would come from API calls 
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

const mockWorkoutPlans = [
  {
    id: '1',
    userId: 'user1',
    name: 'Summer Strength Challenge',
    description: 'Build lean muscle and increase strength over 12 weeks',
    durationWeeks: 12,
    sessionsPerWeek: 4,
    fitnessGoals: ['strength', 'muscle_gain', 'fat_loss'],
    targetFitnessLevel: 'intermediate' as const,
    estimatedSessionDuration: 75,
    status: 'active' as const,
    planData: { summary: '', phases: [], progressionStrategy: '' },
    weeklySchedule: {},
    version: 1,
    isTemplate: false,
    isPublic: false,
    isFeatured: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Morning Cardio Blast',
    description: 'High-intensity cardio workouts to start your day',
    durationWeeks: 8,
    sessionsPerWeek: 5,
    fitnessGoals: ['cardio', 'fat_loss', 'endurance'],
    targetFitnessLevel: 'beginner' as const,
    estimatedSessionDuration: 30,
    status: 'draft' as const,
    planData: { summary: '', phases: [], progressionStrategy: '' },
    weeklySchedule: {},
    version: 1,
    isTemplate: false,
    isPublic: false,
    isFeatured: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockSessions = [
  {
    id: '1',
    userId: 'user1',
    workoutPlanId: '1',
    name: 'Upper Body Power',
    sessionType: 'workout' as const,
    scheduledDate: new Date(),
    scheduledTime: '07:00',
    scheduledDuration: 75,
    sessionData: {
      totalExercises: 8,
      estimatedDuration: 75,
      targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
      equipmentNeeded: ['barbell', 'dumbbells', 'bench'],
      difficultyLevel: 'intermediate' as const
    },
    warmUpExercises: [],
    mainExercises: [],
    coolDownExercises: [],
    completionPercentage: 0,
    status: 'scheduled' as const,
    equipmentUsed: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: 'user1',
    workoutPlanId: '1',
    name: 'Lower Body Strength',
    sessionType: 'workout' as const,
    scheduledDate: new Date(Date.now() + 86400000), // Tomorrow
    scheduledTime: '18:30',
    scheduledDuration: 80,
    sessionData: {
      totalExercises: 6,
      estimatedDuration: 80,
      targetMuscleGroups: ['quadriceps', 'hamstrings', 'glutes'],
      equipmentNeeded: ['squat_rack', 'barbells', 'leg_press'],
      difficultyLevel: 'intermediate' as const
    },
    warmUpExercises: [],
    mainExercises: [],
    coolDownExercises: [],
    completionPercentage: 0,
    status: 'scheduled' as const,
    equipmentUsed: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    userId: 'user1',
    workoutPlanId: '1',
    name: 'Push Day Complete',
    sessionType: 'workout' as const,
    scheduledDate: new Date(Date.now() - 86400000), // Yesterday
    completedAt: new Date(Date.now() - 82800000),
    actualDuration: 72,
    sessionData: {
      totalExercises: 7,
      estimatedDuration: 75,
      targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
      equipmentNeeded: ['dumbbells', 'cables'],
      difficultyLevel: 'intermediate' as const
    },
    warmUpExercises: [],
    mainExercises: [],
    coolDownExercises: [],
    completionPercentage: 100,
    effortRating: 8,
    status: 'completed' as const,
    equipmentUsed: ['dumbbells', 'cables'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function WorkoutsPage() {
  const handleStartWorkout = (workoutId: string) => {
    // Navigate to workout session or create new session
    console.log('Starting workout:', workoutId)
  }

  const handleStartSession = (sessionId: string) => {
    // Navigate to active session
    console.log('Starting session:', sessionId)
  }

  const handleContinueSession = (sessionId: string) => {
    // Navigate to active session
    console.log('Continuing session:', sessionId)
  }

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
                  <p className="text-xs text-gray-500">Workouts Dashboard</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/workouts" 
                  className="text-blue-600 font-medium border-b-2 border-blue-600 pb-4 -mb-4"
                >
                  Workouts
                </Link>
                <Link 
                  href="/progress" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Workouts</h2>
            <p className="text-gray-600">Track your fitness journey and achieve your goals</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button asChild>
              <Link href="/workouts/create">
                <Plus className="w-4 h-4 mr-2" />
                New Workout
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="mb-8">
          <Suspense fallback={<LoadingSpinner />}>
            <WorkoutStatsGrid stats={mockStats} trends={mockTrends} />
          </Suspense>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="plans">
              <Dumbbell className="w-4 h-4 mr-2" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Calendar className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="library">
              <Library className="w-4 h-4 mr-2" />
              Library
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progress Overview */}
              <div className="lg:col-span-2">
                <ProgressOverview 
                  weeklyGoal={4}
                  currentProgress={mockStats.weeklyWorkouts}
                  monthlyStats={{ planned: 16, completed: 13 }}
                />
              </div>
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start">
                    <Link href="/workouts/generate">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate AI Workout
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/workouts/plans/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Custom Plan
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/exercises">
                      <Library className="w-4 h-4 mr-2" />
                      Browse Exercises
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Today's Sessions */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Today&apos;s Sessions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockSessions
                  .filter(session => 
                    new Date(session.scheduledDate).toDateString() === new Date().toDateString()
                  )
                  .map(session => (
                    <SessionCard 
                      key={session.id}
                      session={session}
                      onStart={handleStartSession}
                      onContinue={handleContinueSession}
                    />
                  ))}
                {mockSessions.filter(session => 
                  new Date(session.scheduledDate).toDateString() === new Date().toDateString()
                ).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No sessions scheduled for today</p>
                    <Button asChild className="mt-3">
                      <Link href="/workouts/sessions/schedule">
                        Schedule a Session
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Workout Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">My Workout Plans</h3>
              <Badge variant="outline">{mockWorkoutPlans.length} plans</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockWorkoutPlans.map(plan => (
                <WorkoutCard 
                  key={plan.id}
                  workout={plan}
                  onStart={handleStartWorkout}
                  showProgress={plan.status === 'active'}
                />
              ))}
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">All Sessions</h3>
              <div className="flex gap-2">
                <Badge variant="success">
                  {mockSessions.filter(s => s.status === 'completed').length} completed
                </Badge>
                <Badge variant="warning">
                  {mockSessions.filter(s => s.status === 'scheduled').length} scheduled
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockSessions.map(session => (
                <SessionCard 
                  key={session.id}
                  session={session}
                  onStart={handleStartSession}
                  onContinue={handleContinueSession}
                />
              ))}
            </div>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <div className="text-center py-12">
              <Library className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Exercise Library</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Browse our comprehensive collection of exercises, create custom routines, and discover new movements.
              </p>
              <Button asChild>
                <Link href="/exercises">
                  <Library className="w-4 h-4 mr-2" />
                  Browse Exercises
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}