/**
 * Workout Session Card Component
 * Displays workout session information in a card format
 */
'use client'

import { Clock, Calendar, Play, CheckCircle, Timer, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { WorkoutSession } from '@/types/workouts'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'

interface SessionCardProps {
  session: WorkoutSession
  onStart?: (sessionId: string) => void
  onContinue?: (sessionId: string) => void
  className?: string
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'warning'
    case 'scheduled':
      return 'default'
    case 'skipped':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
}

function getSessionTypeIcon(type: string) {
  switch (type) {
    case 'workout':
      return <Play className="h-4 w-4" />
    case 'assessment':
      return <CheckCircle className="h-4 w-4" />
    case 'recovery':
      return <Timer className="h-4 w-4" />
    default:
      return <Play className="h-4 w-4" />
  }
}

export function SessionCard({ 
  session, 
  onStart, 
  onContinue,
  className 
}: SessionCardProps) {
  const t = useTranslations('workouts')
  const isScheduledToday = new Date(session.scheduledDate).toDateString() === new Date().toDateString()
  const isOverdue = new Date(session.scheduledDate) < new Date() && session.status === 'scheduled'
  
  return (
    <Card className={cn(
      'group hover:shadow-md transition-shadow',
      isOverdue && 'border-red-200 bg-red-50',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getSessionTypeIcon(session.sessionType)}
              <CardTitle className="text-base font-semibold text-gray-900">
                {session.name}
              </CardTitle>
            </div>
            {session.sessionData && (
              <p className="text-sm text-gray-600">
                {session.sessionData.totalExercises} exercises • {session.sessionData.estimatedDuration} min
              </p>
            )}
          </div>
          <Badge variant={getStatusColor(session.status)}>
            {session.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              {isScheduledToday ? t('sessions.today') : format(session.scheduledDate, 'MMM d')}
              {session.scheduledTime && ` at ${session.scheduledTime}`}
            </span>
          </div>
          {session.sessionData?.estimatedDuration && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{session.sessionData.estimatedDuration} min</span>
            </div>
          )}
          {session.gymLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
              <MapPin className="h-4 w-4" />
              <span>{session.gymLocation}</span>
            </div>
          )}
        </div>
        
        {session.sessionData?.targetMuscleGroups && session.sessionData.targetMuscleGroups.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">{t('sessions.targetMuscles')}:</p>
            <div className="flex flex-wrap gap-1">
              {session.sessionData.targetMuscleGroups.slice(0, 4).map((muscle, index) => (
                <Badge key={index} variant="outline" className="text-xs capitalize">
                  {muscle}
                </Badge>
              ))}
              {session.sessionData.targetMuscleGroups.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{session.sessionData.targetMuscleGroups.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {session.status === 'in_progress' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">{t('sessions.progress')}</span>
              <span className="text-xs text-gray-500">{session.completionPercentage}%</span>
            </div>
            <Progress 
              value={session.completionPercentage} 
              variant="warning" 
              size="sm" 
            />
            {session.startedAt && (
              <p className="text-xs text-gray-500 mt-2">
{t('sessions.started')} {formatDistanceToNow(session.startedAt, { addSuffix: true })}
              </p>
            )}
          </div>
        )}
        
        {session.status === 'completed' && session.completedAt && (
          <div className="text-sm text-gray-600">
            <p>{t('sessions.completed')} {formatDistanceToNow(session.completedAt, { addSuffix: true })}</p>
            {session.actualDuration && (
              <p>{t('sessions.duration')}: {session.actualDuration} minutes</p>
            )}
            {session.effortRating && (
              <p>{t('sessions.effort')}: {session.effortRating}/10</p>
            )}
          </div>
        )}
        
        {isOverdue && (
          <div className="text-sm text-red-600 font-medium">
{t('sessions.overdueBy')} {formatDistanceToNow(session.scheduledDate)}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          {session.status === 'scheduled' && (
            <>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onStart?.(session.id)}
                variant={isScheduledToday ? 'default' : 'outline'}
              >
{isScheduledToday ? t('sessions.startNow') : t('sessions.startSession')}
              </Button>
            </>
          )}
          
          {session.status === 'in_progress' && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onContinue?.(session.id)}
            >
{t('sessions.continue')}
            </Button>
          )}
          
          {session.status === 'completed' && (
            <Button variant="outline" size="sm" className="flex-1" disabled>
{t('sessions.viewResults')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}