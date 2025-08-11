/**
 * Workout Plans List Page
 * View and manage all workout plans
 */

'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Dumbbell, Plus, Search, Filter, MoreVertical, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WorkoutCard } from '@/components/workouts/workout-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock data for demonstration
const mockPlans = [
  {
    id: '1',
    userId: 'user1',
    name: 'Summer Strength Challenge',
    description: 'Build lean muscle and increase strength over 12 weeks with progressive overload principles',
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
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Morning Cardio Blast',
    description: 'High-intensity cardio workouts to start your day and boost metabolism',
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
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date()
  },
  {
    id: '3',
    userId: 'user1',
    name: 'Flexibility & Mobility',
    description: 'Improve flexibility, mobility, and recovery with targeted stretching and movement patterns',
    durationWeeks: 6,
    sessionsPerWeek: 3,
    fitnessGoals: ['flexibility', 'recovery', 'mobility'],
    targetFitnessLevel: 'beginner' as const,
    estimatedSessionDuration: 20,
    status: 'completed' as const,
    planData: { summary: '', phases: [], progressionStrategy: '' },
    weeklySchedule: {},
    version: 1,
    isTemplate: false,
    isPublic: false,
    isFeatured: false,
    isActive: true,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '4',
    userId: 'user1',
    name: 'Powerlifting Foundation',
    description: 'Master the big three lifts: squat, bench, and deadlift with proper form and progression',
    durationWeeks: 16,
    sessionsPerWeek: 3,
    fitnessGoals: ['strength', 'powerlifting', 'technique'],
    targetFitnessLevel: 'advanced' as const,
    estimatedSessionDuration: 90,
    status: 'paused' as const,
    planData: { summary: '', phases: [], progressionStrategy: '' },
    weeklySchedule: {},
    version: 1,
    isTemplate: false,
    isPublic: false,
    isFeatured: false,
    isActive: true,
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-01-05')
  }
]

export default function WorkoutPlansPage() {
  const handleStartWorkout = useCallback((workoutId: string) => {
    console.log('Starting workout:', workoutId)
  }, [])

  const activePlans = mockPlans.filter(plan => plan.status === 'active')
  const draftPlans = mockPlans.filter(plan => plan.status === 'draft')
  const completedPlans = mockPlans.filter(plan => plan.status === 'completed')
  const pausedPlans = mockPlans.filter(plan => plan.status === 'paused')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/workouts" className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI Personal Trainer</h1>
                  <p className="text-xs text-gray-500">Workout Plans</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/workouts" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/workouts/plans" 
                  className="text-blue-600 font-medium border-b-2 border-blue-600 pb-4 -mb-4"
                >
                  Plans
                </Link>
                <Link 
                  href="/workouts/sessions" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Sessions
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Workout Plans</h2>
            <p className="text-gray-600">Manage and track your workout programs</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline" asChild>
              <Link href="/workouts/templates">
                Browse Templates
              </Link>
            </Button>
            <Button asChild>
              <Link href="/workouts/plans/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search workout plans..." 
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="recent">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Updated</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="created">Date Created</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Plans Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{activePlans.length}</div>
              <div className="text-sm text-gray-600">Active Plans</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{draftPlans.length}</div>
              <div className="text-sm text-gray-600">Drafts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{completedPlans.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{pausedPlans.length}</div>
              <div className="text-sm text-gray-600">Paused</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Plans Section */}
        {activePlans.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Active Plans</h3>
              <Badge variant="success">{activePlans.length} active</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePlans.map(plan => (
                <WorkoutCard 
                  key={plan.id}
                  workout={plan}
                  onStart={handleStartWorkout}
                  showProgress
                />
              ))}
            </div>
          </div>
        )}

        {/* Draft Plans Section */}
        {draftPlans.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Draft Plans</h3>
              <Badge variant="outline">{draftPlans.length} drafts</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftPlans.map(plan => (
                <WorkoutCard 
                  key={plan.id}
                  workout={plan}
                  onStart={handleStartWorkout}
                />
              ))}
            </div>
          </div>
        )}

        {/* Paused Plans Section */}
        {pausedPlans.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Paused Plans</h3>
              <Badge variant="warning">{pausedPlans.length} paused</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pausedPlans.map(plan => (
                <WorkoutCard 
                  key={plan.id}
                  workout={plan}
                  onStart={handleStartWorkout}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Plans Section */}
        {completedPlans.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Completed Plans</h3>
              <Badge variant="success">{completedPlans.length} completed</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedPlans.map(plan => (
                <WorkoutCard 
                  key={plan.id}
                  workout={plan}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {mockPlans.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workout plans yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by creating your first workout plan or choosing from our templates.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/workouts/plans/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plan
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/workouts/templates">
                  Browse Templates
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}