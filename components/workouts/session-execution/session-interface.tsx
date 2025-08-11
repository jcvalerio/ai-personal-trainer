/**
 * Session Execution Interface
 * Main component for workout session execution with timer integration
 */
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  Play, 
  Pause, 
  Square, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Clock,
  Target,
  Weight,
  RotateCcw,
  CheckCircle2,
  Plus,
  Minus
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TabataTimer } from './tabata-timer'
import { useSessionExecution } from './session-execution-provider'
import { 
  TimerPhase, 
  TabataConfig, 
  LiveSet,
  ExecutingExercise 
} from '@/types/session-execution'

interface SessionInterfaceProps {
  className?: string
}

interface SetInputs {
  weight: string
  reps: string
  duration: string
  distance: string
  notes: string
}

export function SessionInterface({ className = '' }: SessionInterfaceProps) {
  const t = useTranslations('workouts.session')
  const {
    session,
    currentExercise,
    progress,
    settings,
    pauseSession,
    resumeSession,
    completeSession,
    nextExercise,
    previousExercise,
    completeSet,
    updateTimer
  } = useSessionExecution()

  // Component state
  const [showTimer, setShowTimer] = useState(false)
  const [setInputs, setSetInputs] = useState<SetInputs>({
    weight: '',
    reps: '',
    duration: '',
    distance: '',
    notes: ''
  })
  const [isRestPeriod, setIsRestPeriod] = useState(false)
  const [restTimeRemaining, setRestTimeRemaining] = useState(0)

  // Check if session is active
  if (!session || session.status === 'idle') {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500 mb-4">
            <Clock className="w-12 h-12 mx-auto mb-2" />
            <p>{t('noActiveSession')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check if we need to show Tabata timer
  const shouldShowTimer = currentExercise && (
    currentExercise.timerConfig?.protocol === 'tabata' ||
    currentExercise.timerConfig?.protocol === 'emom' ||
    currentExercise.timerConfig?.protocol === 'amrap'
  )

  // Handle set completion
  const handleCompleteSet = useCallback(() => {
    if (!currentExercise) {return}

    const setData: LiveSet = {
      setNumber: (currentExercise.completedSets?.length || 0) + 1,
      weight: setInputs.weight ? parseFloat(setInputs.weight) : undefined,
      reps: setInputs.reps ? parseInt(setInputs.reps) : undefined,
      duration: setInputs.duration ? parseInt(setInputs.duration) : undefined,
      distance: setInputs.distance ? parseFloat(setInputs.distance) : undefined,
      completedAt: new Date(),
      restDuration: settings.restPeriods.betweenSets,
      effort: 8, // Default effort, could be user input
      notes: setInputs.notes || undefined
    }

    completeSet(setData)
    
    // Clear inputs
    setSetInputs({
      weight: '',
      reps: '',
      duration: '',
      distance: '',
      notes: ''
    })

    // Start rest period if not last set
    const isLastSet = (currentExercise.completedSets?.length || 0) + 1 >= currentExercise.sets
    if (!isLastSet && settings.restPeriods.betweenSets > 0) {
      setIsRestPeriod(true)
      setRestTimeRemaining(settings.restPeriods.betweenSets)
    }
  }, [currentExercise, setInputs, settings, completeSet])

  // Handle timer phase changes
  const handleTimerPhaseChange = useCallback((phase: TimerPhase, timeRemaining: number) => {
    // Update timer state in session
    if (session.activeTimer) {
      updateTimer({
        ...session.activeTimer,
        phase,
        timeRemaining
      })
    }
  }, [session.activeTimer, updateTimer])

  // Rest timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRestPeriod && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRestPeriod(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {clearInterval(interval)}
    }
  }, [isRestPeriod, restTimeRemaining])

  // Quick weight adjustments
  const adjustWeight = useCallback((delta: number) => {
    const currentWeight = parseFloat(setInputs.weight) || 0
    const newWeight = Math.max(0, currentWeight + delta)
    setSetInputs(prev => ({ ...prev, weight: newWeight.toString() }))
  }, [setInputs.weight])

  // Quick rep adjustments
  const adjustReps = useCallback((delta: number) => {
    const currentReps = parseInt(setInputs.reps) || 0
    const newReps = Math.max(0, currentReps + delta)
    setSetInputs(prev => ({ ...prev, reps: newReps.toString() }))
  }, [setInputs.reps])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get current set number
  const currentSetNumber = (currentExercise?.completedSets?.length || 0) + 1

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Session Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {t('sessionInProgress')}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {t('exercise')} {session.currentExerciseIndex + 1} {t('of')} {session.exercises.length}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={session.status === 'active' ? pauseSession : resumeSession}
              >
                {session.status === 'active' ? (
                  <Pause className="w-4 h-4 mr-1" />
                ) : (
                  <Play className="w-4 h-4 mr-1" />
                )}
                {session.status === 'active' ? t('pause') : t('resume')}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress.overallProgress * 100} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{Math.round(progress.overallProgress * 100)}% {t('complete')}</span>
              <span>{formatTime(Math.floor(progress.timeElapsed / 1000))}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabata Timer */}
      {shouldShowTimer && currentExercise?.timerConfig?.protocol === 'tabata' && (
        <TabataTimer
          exercise={currentExercise}
          config={currentExercise.timerConfig as TabataConfig}
          audioEnabled={settings.audioEnabled}
          vibrateEnabled={settings.vibrateEnabled}
          onPhaseChange={handleTimerPhaseChange}
          onTimerComplete={() => setShowTimer(false)}
        />
      )}

      {/* Current Exercise */}
      {currentExercise && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{currentExercise.name}</CardTitle>
                {currentExercise.description && (
                  <p className="text-sm text-gray-600 mt-1">{currentExercise.description}</p>
                )}
              </div>
              <Badge variant="outline">
                {t('set')} {currentSetNumber}/{currentExercise.sets}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Rest Period Display */}
            {isRestPeriod && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {formatTime(restTimeRemaining)}
                  </div>
                  <p className="text-blue-700">{t('restPeriod')}</p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setIsRestPeriod(false)}
                  >
                    {t('skipRest')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Exercise Targets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentExercise.targetReps && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Target className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-sm text-gray-600">{t('targetReps')}</div>
                  <div className="font-bold">{currentExercise.targetReps}</div>
                </div>
              )}
              
              {currentExercise.targetWeight && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Weight className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-sm text-gray-600">{t('targetWeight')}</div>
                  <div className="font-bold">{currentExercise.targetWeight} lbs</div>
                </div>
              )}
              
              {currentExercise.targetDuration && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-sm text-gray-600">{t('targetDuration')}</div>
                  <div className="font-bold">{currentExercise.targetDuration}s</div>
                </div>
              )}
            </div>

            {/* Set Input Form */}
            {!isRestPeriod && (
              <div className="space-y-4">
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weight Input */}
                  <div className="space-y-2">
                    <Label htmlFor="weight">{t('weight')} (lbs)</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustWeight(-5)}
                        disabled={!setInputs.weight || parseFloat(setInputs.weight) <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        id="weight"
                        type="number"
                        value={setInputs.weight}
                        onChange={(e) => setSetInputs(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="0"
                        className="text-center"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustWeight(5)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Reps Input */}
                  <div className="space-y-2">
                    <Label htmlFor="reps">{t('reps')}</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustReps(-1)}
                        disabled={!setInputs.reps || parseInt(setInputs.reps) <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        id="reps"
                        type="number"
                        value={setInputs.reps}
                        onChange={(e) => setSetInputs(prev => ({ ...prev, reps: e.target.value }))}
                        placeholder="0"
                        className="text-center"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustReps(1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Duration Input (for time-based exercises) */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">{t('duration')} (s)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={setInputs.duration}
                      onChange={(e) => setSetInputs(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  {/* Distance Input (for cardio exercises) */}
                  <div className="space-y-2">
                    <Label htmlFor="distance">{t('distance')} (m)</Label>
                    <Input
                      id="distance"
                      type="number"
                      value={setInputs.distance}
                      onChange={(e) => setSetInputs(prev => ({ ...prev, distance: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('notes')} ({t('optional')})</Label>
                  <Input
                    id="notes"
                    value={setInputs.notes}
                    onChange={(e) => setSetInputs(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('addNotes')}
                  />
                </div>

                {/* Complete Set Button */}
                <Button
                  size="lg"
                  onClick={handleCompleteSet}
                  className="w-full"
                  disabled={!setInputs.weight && !setInputs.reps && !setInputs.duration}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {t('completeSet')}
                </Button>
              </div>
            )}

            {/* Completed Sets Display */}
            {currentExercise.completedSets && currentExercise.completedSets.length > 0 && (
              <div className="space-y-2">
                <Separator />
                <h4 className="font-medium">{t('completedSets')}</h4>
                <div className="space-y-2">
                  {currentExercise.completedSets.map((set, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{t('set')} {set.setNumber}</Badge>
                        {set.weight && <span>{set.weight} lbs</span>}
                        {set.reps && <span>{set.reps} reps</span>}
                        {set.duration && <span>{set.duration}s</span>}
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={previousExercise}
              disabled={session.currentExerciseIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('previous')}
            </Button>

            <div className="text-center">
              <div className="text-sm text-gray-600">{t('exercise')}</div>
              <div className="font-bold">
                {session.currentExerciseIndex + 1} / {session.exercises.length}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={nextExercise}
              disabled={session.currentExerciseIndex >= session.exercises.length - 1}
            >
              {t('next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Complete Session */}
      {session.currentExerciseIndex >= session.exercises.length - 1 && (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-bold mb-2">{t('sessionComplete')}</h3>
            <p className="text-gray-600 mb-4">{t('sessionCompleteDescription')}</p>
            <Button onClick={completeSession} size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {t('finishSession')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}