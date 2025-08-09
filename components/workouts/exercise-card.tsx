/**
 * Exercise Card Component
 * Displays exercise information in a card format
 */
'use client'

import { Clock, Target, AlertTriangle, Play, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/types/workouts'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: Exercise
  showAddButton?: boolean
  showInstructions?: boolean
  onAdd?: (exercise: Exercise) => void
  onViewDemo?: (exercise: Exercise) => void
  className?: string
}

function getDifficultyColor(level: string) {
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

function getExerciseTypeColor(type: string) {
  switch (type) {
    case 'strength':
      return 'default'
    case 'cardio':
      return 'destructive'
    case 'flexibility':
      return 'success'
    case 'sports':
      return 'warning'
    default:
      return 'outline'
  }
}

export function ExerciseCard({ 
  exercise, 
  showAddButton = false,
  showInstructions = false,
  onAdd,
  onViewDemo,
  className 
}: ExerciseCardProps) {
  return (
    <Card className={cn('group hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {exercise.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getExerciseTypeColor(exercise.exerciseType)}>
                {exercise.exerciseType}
              </Badge>
              <Badge variant={getDifficultyColor(exercise.difficultyLevel)}>
                {exercise.difficultyLevel}
              </Badge>
              {exercise.isVerified && (
                <Badge variant="success" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        {exercise.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {exercise.description}
          </p>
        )}
        
        <div className="space-y-3">
          {/* Primary Muscle Groups */}
          {exercise.primaryMuscleGroups && exercise.primaryMuscleGroups.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Primary Muscles</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {exercise.primaryMuscleGroups.map((muscle, index) => (
                  <Badge key={index} variant="outline" className="text-xs capitalize">
                    {muscle}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Equipment Required */}
          {exercise.equipmentRequired && exercise.equipmentRequired.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Equipment:</p>
              <div className="flex flex-wrap gap-1">
                {exercise.equipmentRequired.slice(0, 3).map((equipment, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {equipment}
                  </Badge>
                ))}
                {exercise.equipmentRequired.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{exercise.equipmentRequired.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Default Sets/Reps */}
          {(exercise.defaultSets || exercise.defaultRepsMin || exercise.defaultDurationSeconds) && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {exercise.defaultSets && (
                <span>{exercise.defaultSets} sets</span>
              )}
              {exercise.defaultRepsMin && exercise.defaultRepsMax && (
                <span>{exercise.defaultRepsMin}-{exercise.defaultRepsMax} reps</span>
              )}
              {exercise.defaultDurationSeconds && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{Math.floor(exercise.defaultDurationSeconds / 60)}:{(exercise.defaultDurationSeconds % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Safety Warnings */}
          {exercise.contraindications && exercise.contraindications.length > 0 && (
            <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-yellow-800">Contraindications</p>
                <p className="text-xs text-yellow-700">
                  {exercise.contraindications.slice(0, 2).join(', ')}
                  {exercise.contraindications.length > 2 && '...'}
                </p>
              </div>
            </div>
          )}
          
          {/* Instructions Preview */}
          {showInstructions && exercise.instructions && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs font-medium text-gray-700 mb-1">Instructions:</p>
              <p className="text-xs text-gray-600 line-clamp-3">
                {exercise.instructions}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <div className="px-6 pb-4">
        <div className="flex gap-2">
          {exercise.demoVideoUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onViewDemo?.(exercise)}
            >
              <Play className="h-3 w-3 mr-1" />
              Demo
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            <Info className="h-3 w-3 mr-1" />
            Details
          </Button>
          {showAddButton && onAdd && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onAdd(exercise)}
            >
              Add to Plan
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}