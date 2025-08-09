/**
 * Workout Plan Card Component
 * Displays workout plan information in a card format
 */
'use client'

import { Clock, Calendar, Target, Users } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { WorkoutPlan } from '@/types/workouts'
import { cn } from '@/lib/utils'

interface WorkoutCardProps {
  workout: WorkoutPlan
  onStart?: (workoutId: string) => void
  showProgress?: boolean
  className?: string
}

function getStatusColor(status: string) {
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

function getFitnessLevelColor(level: string) {
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

export function WorkoutCard({ 
  workout, 
  onStart, 
  showProgress = false,
  className 
}: WorkoutCardProps) {
  const progress = showProgress ? Math.floor(Math.random() * 100) : 0 // Mock progress for now
  
  return (
    <Card className={cn('group hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {workout.name}
            </CardTitle>
            {workout.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {workout.description}
              </p>
            )}
          </div>
          <Badge variant={getStatusColor(workout.status)}>
            {workout.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{workout.estimatedSessionDuration || 60} min</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{workout.durationWeeks} weeks</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="h-4 w-4" />
            <span>{workout.sessionsPerWeek}/week</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <Badge size="sm" variant={getFitnessLevelColor(workout.targetFitnessLevel)}>
              {workout.targetFitnessLevel}
            </Badge>
          </div>
        </div>
        
        {workout.fitnessGoals && workout.fitnessGoals.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Goals:</p>
            <div className="flex flex-wrap gap-1">
              {workout.fitnessGoals.slice(0, 3).map((goal, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {goal}
                </Badge>
              ))}
              {workout.fitnessGoals.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{workout.fitnessGoals.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {showProgress && workout.status === 'active' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Progress</span>
              <span className="text-xs text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} variant="success" size="sm" />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/workouts/plans/${workout.id}`}>
              View Details
            </Link>
          </Button>
          {workout.status === 'active' && onStart && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onStart(workout.id)}
            >
              Start Workout
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}