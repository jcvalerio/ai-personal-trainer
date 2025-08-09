/**
 * Individual Workout Plan Detail Page
 * View and manage a specific workout plan
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { 
  Dumbbell, 
  Calendar, 
  Clock, 
  Target, 
  Play, 
  Edit, 
  MoreVertical,
  CheckCircle,
  Users,
  ArrowLeft,
  Share2,
  Copy,
  Pause,
  Archive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SessionCard } from '@/components/workouts/session-card'
import { ExerciseCard } from '@/components/workouts/exercise-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface PageProps {
  params: { planId: string }
}

// Mock data - in a real app, this would be fetched from the API
const mockPlan = {
  id: '1',
  userId: 'user1',
  name: 'Summer Strength Challenge',
  description: 'Build lean muscle and increase strength over 12 weeks with progressive overload principles. This comprehensive program targets all major muscle groups with compound movements and isolation exercises.',
  durationWeeks: 12,
  sessionsPerWeek: 4,
  fitnessGoals: ['strength', 'muscle_gain', 'fat_loss'],
  targetFitnessLevel: 'intermediate' as const,
  estimatedSessionDuration: 75,
  status: 'active' as const,
  planData: {
    summary: 'A comprehensive 12-week strength training program designed to build muscle and increase overall strength.',
    phases: [
      {
        name: 'Foundation Phase',
        description: 'Build movement patterns and base strength',
        durationWeeks: 4,
        sessions: []
      },
      {
        name: 'Building Phase',
        description: 'Increase volume and intensity progressively',
        durationWeeks: 6,
        sessions: []
      },
      {
        name: 'Peak Phase',
        description: 'Peak strength and muscle development',
        durationWeeks: 2,
        sessions: []
      }
    ],
    progressionStrategy: 'Linear periodization with progressive overload'
  },
  weeklySchedule: {
    'week-1': [
      { day: 'Monday', sessionId: '1', sessionName: 'Upper Body Power', type: 'workout' as const, duration: 75 },
      { day: 'Tuesday', sessionName: 'Rest Day', type: 'rest' as const, duration: 0 },
      { day: 'Wednesday', sessionId: '2', sessionName: 'Lower Body Strength', type: 'workout' as const, duration: 80 },
      { day: 'Thursday', sessionName: 'Active Recovery', type: 'active_recovery' as const, duration: 30 },
      { day: 'Friday', sessionId: '3', sessionName: 'Push Focus', type: 'workout' as const, duration: 70 },
      { day: 'Saturday', sessionId: '4', sessionName: 'Pull Focus', type: 'workout' as const, duration: 70 },
      { day: 'Sunday', sessionName: 'Rest Day', type: 'rest' as const, duration: 0 }
    ]
  },
  version: 1,
  isTemplate: false,
  isPublic: false,
  isFeatured: false,
  isActive: true,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
  startedAt: new Date('2024-01-20'),
  // Progress data (mock)
  progress: {
    currentWeek: 3,
    completedSessions: 8,
    totalSessions: 48,
    completionPercentage: 17
  }
}

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
    scheduledDate: new Date(Date.now() + 2 * 86400000), // Day after tomorrow
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

export default function WorkoutPlanDetailPage({ params }: PageProps) {
  // In a real app, fetch the plan data based on params.planId
  const plan = mockPlan
  
  if (!plan) {
    notFound()
  }

  const handleStartSession = (sessionId: string) => {
    console.log('Starting session:', sessionId)
  }

  const handleContinueSession = (sessionId: string) => {
    console.log('Continuing session:', sessionId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'completed':
        return 'secondary'
      case 'paused':
        return 'warning'
      case 'draft':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getFitnessLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'success'
      case 'intermediate':
        return 'warning'
      case 'advanced':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/workouts/plans" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{plan.name}</h1>
                  <p className="text-xs text-gray-500">Workout Plan Details</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Plan Actions</DialogTitle>
                    <DialogDescription>
                      Manage your workout plan
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2">
                    <Button variant="outline" className="justify-start">
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate Plan
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Plan
                    </Button>
                    <Button variant="destructive" className="justify-start">
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Plan
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
        {/* Plan Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusColor(plan.status)}>
                        {plan.status}
                      </Badge>
                      <Badge variant={getFitnessLevelColor(plan.targetFitnessLevel)}>
                        {plan.targetFitnessLevel}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base">
                      {plan.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{plan.durationWeeks} weeks</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>{plan.sessionsPerWeek}/week</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{plan.estimatedSessionDuration} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Individual</span>
                  </div>
                </div>
                
                {plan.fitnessGoals && plan.fitnessGoals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Fitness Goals:</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {plan.fitnessGoals.map((goal, index) => (
                        <Badge key={index} variant="outline" className="capitalize">
                          {goal.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {plan.status === 'active' && (
                  <div className="flex gap-3">
                    <Button className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Start Today's Workout
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      View Schedule
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Progress Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {plan.status === 'active' && plan.progress && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm text-gray-500">
                          {plan.progress.completionPercentage}%
                        </span>
                      </div>
                      <Progress value={plan.progress.completionPercentage} variant="success" className="mb-2" />
                      <p className="text-xs text-gray-500">
                        Week {plan.progress.currentWeek} of {plan.durationWeeks}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{plan.progress.completedSessions}</div>
                        <div className="text-xs text-gray-500">Completed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{plan.progress.totalSessions}</div>
                        <div className="text-xs text-gray-500">Total Sessions</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 mb-1">Current Phase</p>
                      <Badge variant="default">
                        {plan.planData.phases[Math.min(Math.floor(plan.progress.currentWeek / 4), plan.planData.phases.length - 1)]?.name}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {plan.status !== 'active' && (
                  <div className="text-center py-4">
                    <p className="text-gray-600">Plan is {plan.status}</p>
                    {plan.status === 'draft' && (
                      <Button className="mt-3 w-full">
                        <Play className="w-4 h-4 mr-2" />
                        Start Plan
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="mt-6">
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

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  Your workout plan's weekly training schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-700 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {plan.weeklySchedule['week-1']?.map((daySchedule, index) => (
                    <Card key={index} className={daySchedule.type === 'rest' ? 'bg-gray-50' : ''}>
                      <CardContent className="p-3">
                        <div className="text-xs font-medium text-gray-900 mb-1">
                          {daySchedule.sessionName}
                        </div>
                        {daySchedule.duration > 0 && (
                          <div className="text-xs text-gray-500">
                            {daySchedule.duration} min
                          </div>
                        )}
                        <Badge 
                          variant={daySchedule.type === 'workout' ? 'default' : 'outline'} 
                          className="mt-1 text-xs"
                        >
                          {daySchedule.type.replace('_', ' ')}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phases Tab */}
          <TabsContent value="phases" className="mt-6">
            <div className="space-y-4">
              {plan.planData.phases.map((phase, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{phase.name}</CardTitle>
                        <CardDescription>{phase.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {phase.durationWeeks} weeks
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Phase {index + 1} of {plan.planData.phases.length}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Detailed analytics and progress tracking will be available once you complete more sessions.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}