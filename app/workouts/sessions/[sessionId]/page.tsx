/**
 * Active Workout Session Page
 * Real-time workout tracking interface
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  Timer, 
  Play, 
  Pause, 
  SkipForward, 
  Check,
  ArrowLeft,
  Target,
  Clock,
  MoreVertical,
  Volume2,
  VolumeX,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PageProps {
  params: { sessionId: string }
}

// Mock data for demonstration
const mockSession = {
  id: '1',
  name: 'Upper Body Power',
  sessionType: 'workout' as const,
  estimatedDuration: 75,
  exercises: [
    {
      id: '1',
      name: 'Barbell Bench Press',
      type: 'strength',
      targetSets: 4,
      targetReps: '8-10',
      restTime: 180,
      notes: 'Focus on controlled movement',
      completed: true,
      sets: [
        { reps: 10, weight: 135, completed: true },
        { reps: 9, weight: 135, completed: true },
        { reps: 8, weight: 140, completed: true },
        { reps: 8, weight: 140, completed: true },
      ]
    },
    {
      id: '2',
      name: 'Incline Dumbbell Press',
      type: 'strength',
      targetSets: 3,
      targetReps: '10-12',
      restTime: 150,
      notes: 'Keep elbows at 45-degree angle',
      completed: false,
      currentSet: 2,
      sets: [
        { reps: 12, weight: 50, completed: true },
        { reps: 0, weight: 50, completed: false },
        { reps: 0, weight: 0, completed: false },
      ]
    },
    {
      id: '3',
      name: 'Seated Cable Row',
      type: 'strength',
      targetSets: 3,
      targetReps: '12-15',
      restTime: 120,
      notes: 'Squeeze shoulder blades together',
      completed: false,
      sets: [
        { reps: 0, weight: 0, completed: false },
        { reps: 0, weight: 0, completed: false },
        { reps: 0, weight: 0, completed: false },
      ]
    },
    {
      id: '4',
      name: 'Overhead Press',
      type: 'strength',
      targetSets: 3,
      targetReps: '8-10',
      restTime: 150,
      notes: 'Keep core tight',
      completed: false,
      sets: [
        { reps: 0, weight: 0, completed: false },
        { reps: 0, weight: 0, completed: false },
        { reps: 0, weight: 0, completed: false },
      ]
    }
  ]
}

export default function WorkoutSessionPage({ params }: PageProps) {
  const [session, setSession] = useState(mockSession)
  const [isActive, setIsActive] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0) // in seconds
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(1) // 0-based, exercise 1 is completed
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(session.exercises[currentExerciseIndex]?.id || null)

  // Timer effect for workout duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime(time => time + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive])

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(time => {
          if (time <= 1) {
            setIsResting(false)
            if (soundEnabled) {
              // Play notification sound
              console.log('Rest period finished!')
            }
            return 0
          }
          return time - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimer, soundEnabled])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleWorkout = () => {
    setIsActive(!isActive)
  }

  const startRest = (duration: number) => {
    setRestTimer(duration)
    setIsResting(true)
  }

  const completeSet = (exerciseId: string, setIndex: number, reps: number, weight: number) => {
    setSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          const newSets = [...exercise.sets]
          newSets[setIndex] = { reps, weight, completed: true }
          
          const completedSets = newSets.filter(set => set.completed).length
          const isExerciseComplete = completedSets === exercise.targetSets
          
          return {
            ...exercise,
            sets: newSets,
            completed: isExerciseComplete,
            currentSet: isExerciseComplete ? exercise.targetSets : completedSets
          }
        }
        return exercise
      })
    }))

    // Auto-start rest timer after completing a set
    const exercise = session.exercises.find(ex => ex.id === exerciseId)
    if (exercise && !isResting) {
      startRest(exercise.restTime)
    }
  }

  const skipExercise = () => {
    if (currentExerciseIndex < session.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setExpandedExercise(session.exercises[currentExerciseIndex + 1]?.id || null)
    }
  }

  const completedExercises = session.exercises.filter(ex => ex.completed).length
  const progressPercentage = (completedExercises / session.exercises.length) * 100

  const currentExercise = session.exercises[currentExerciseIndex]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/workouts" className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold">{session.name}</h1>
                <p className="text-xs text-gray-400">Session in progress</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white hover:bg-gray-700"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle>Session Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Sound Notifications</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="border-gray-600 text-white"
                      >
                        {soundEnabled ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Workout Controls */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button 
                  onClick={toggleWorkout}
                  size="lg"
                  className={cn(
                    'w-16 h-16 rounded-full',
                    isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  )}
                >
                  {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
                
                <div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</p>
                      <p className="text-xs text-gray-400">Elapsed time</p>
                    </div>
                    {isResting && (
                      <div className="text-orange-400">
                        <p className="text-xl font-mono font-bold">{formatTime(restTimer)}</p>
                        <p className="text-xs">Rest remaining</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold">{completedExercises}/{session.exercises.length}</p>
                <p className="text-xs text-gray-400">Exercises completed</p>
                <Progress value={progressPercentage} className="w-24 mt-2" variant="success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rest Timer Alert */}
        {isResting && (
          <Card className="bg-orange-900 border-orange-700 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5 text-orange-400" />
                  <span className="font-medium">Rest Period</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono font-bold text-orange-400">
                    {formatTime(restTimer)}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsResting(false)}
                    className="border-orange-600 text-orange-400 hover:bg-orange-800"
                  >
                    Skip Rest
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise List */}
        <div className="space-y-4">
          {session.exercises.map((exercise, index) => {
            const isExpanded = expandedExercise === exercise.id
            const isCurrent = index === currentExerciseIndex
            const isNext = index === currentExerciseIndex + 1
            
            return (
              <Card 
                key={exercise.id} 
                className={cn(
                  'transition-all duration-200',
                  exercise.completed 
                    ? 'bg-green-900 border-green-700' 
                    : isCurrent 
                      ? 'bg-blue-900 border-blue-700 ring-2 ring-blue-600' 
                      : isNext
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-800 border-gray-700 opacity-60'
                )}
              >
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        exercise.completed 
                          ? 'bg-green-600' 
                          : isCurrent 
                            ? 'bg-blue-600' 
                            : 'bg-gray-600'
                      )}>
                        {exercise.completed ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{exercise.name}</CardTitle>
                        <p className="text-sm text-gray-400">
                          {exercise.targetSets} sets × {exercise.targetReps} reps
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {exercise.completed && (
                        <Badge variant="success">Complete</Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="default">Current</Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent>
                    {exercise.notes && (
                      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-300">
                          <Target className="w-4 h-4 inline mr-1" />
                          {exercise.notes}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                          <span className="text-sm font-medium w-12">Set {setIndex + 1}:</span>
                          
                          {set.completed ? (
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm">{set.reps} reps @ {set.weight} lbs</span>
                              <Check className="w-4 h-4 text-green-400" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-8 h-8 p-0 border-gray-600"
                                  onClick={() => {
                                    const newReps = Math.max(0, (set.reps || 0) - 1)
                                    setSession(prev => ({
                                      ...prev,
                                      exercises: prev.exercises.map(ex => 
                                        ex.id === exercise.id 
                                          ? {
                                              ...ex,
                                              sets: ex.sets.map((s, i) => 
                                                i === setIndex ? { ...s, reps: newReps } : s
                                              )
                                            }
                                          : ex
                                      )
                                    }))
                                  }}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Input 
                                  type="number" 
                                  value={set.reps || ''}
                                  onChange={(e) => {
                                    const newReps = parseInt(e.target.value) || 0
                                    setSession(prev => ({
                                      ...prev,
                                      exercises: prev.exercises.map(ex => 
                                        ex.id === exercise.id 
                                          ? {
                                              ...ex,
                                              sets: ex.sets.map((s, i) => 
                                                i === setIndex ? { ...s, reps: newReps } : s
                                              )
                                            }
                                          : ex
                                      )
                                    }))
                                  }}
                                  className="w-16 text-center bg-gray-600 border-gray-500" 
                                  placeholder="0"
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-8 h-8 p-0 border-gray-600"
                                  onClick={() => {
                                    const newReps = (set.reps || 0) + 1
                                    setSession(prev => ({
                                      ...prev,
                                      exercises: prev.exercises.map(ex => 
                                        ex.id === exercise.id 
                                          ? {
                                              ...ex,
                                              sets: ex.sets.map((s, i) => 
                                                i === setIndex ? { ...s, reps: newReps } : s
                                              )
                                            }
                                          : ex
                                      )
                                    }))
                                  }}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              
                              <span className="text-gray-400">×</span>
                              
                              <Input 
                                type="number" 
                                value={set.weight || ''}
                                onChange={(e) => {
                                  const newWeight = parseInt(e.target.value) || 0
                                  setSession(prev => ({
                                    ...prev,
                                    exercises: prev.exercises.map(ex => 
                                      ex.id === exercise.id 
                                        ? {
                                            ...ex,
                                            sets: ex.sets.map((s, i) => 
                                              i === setIndex ? { ...s, weight: newWeight } : s
                                            )
                                          }
                                        : ex
                                    )
                                  }))
                                }}
                                className="w-20 text-center bg-gray-600 border-gray-500" 
                                placeholder="0"
                              />
                              <span className="text-sm text-gray-400">lbs</span>
                              
                              <Button 
                                onClick={() => completeSet(exercise.id, setIndex, set.reps || 0, set.weight || 0)}
                                disabled={!set.reps || !set.weight}
                                size="sm"
                                className="ml-2"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {!exercise.completed && isCurrent && (
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => startRest(exercise.restTime)}
                          variant="outline"
                          className="flex-1 border-gray-600"
                        >
                          <Timer className="w-4 h-4 mr-2" />
                          Rest ({exercise.restTime}s)
                        </Button>
                        <Button 
                          onClick={skipExercise}
                          variant="ghost"
                          className="flex-1"
                        >
                          <SkipForward className="w-4 h-4 mr-2" />
                          Skip Exercise
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Session Complete */}
        {completedExercises === session.exercises.length && (
          <Card className="bg-green-900 border-green-700 mt-6">
            <CardContent className="p-6 text-center">
              <Check className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Workout Complete!</h3>
              <p className="text-gray-300 mb-4">
                Great job! You completed all exercises in {formatTime(elapsedTime)}.
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  asChild
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Link href="/workouts">
                    Finish Session
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}