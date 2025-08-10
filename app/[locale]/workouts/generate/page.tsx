/**
 * AI Workout Generation Page
 * Create personalized workouts using AI
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { 
  Sparkles, 
  ArrowLeft,
  Target,
  Clock,
  Calendar,
  Dumbbell,
  Heart,
  Zap,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
  Play,
  Save,
  Shuffle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ExerciseCard } from '@/components/workouts/exercise-card'
import { cn } from '@/lib/utils'

type GenerationStep = 'preferences' | 'generating' | 'review' | 'complete'

interface WorkoutPreferences {
  fitnessLevel: string
  goals: string[]
  duration: number
  daysPerWeek: number
  equipment: string[]
  limitations: string[]
  preferences: string[]
}

const fitnessGoals = [
  { id: 'weight_loss', label: 'Weight Loss', icon: '⚖️' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'strength', label: 'Strength', icon: '🏋️' },
  { id: 'endurance', label: 'Endurance', icon: '🏃' },
  { id: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { id: 'general_fitness', label: 'General Fitness', icon: '✨' }
]

const availableEquipment = [
  { id: 'bodyweight', label: 'Bodyweight Only' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'resistance_bands', label: 'Resistance Bands' },
  { id: 'full_gym', label: 'Full Gym Access' },
  { id: 'home_gym', label: 'Home Gym Setup' }
]

const commonLimitations = [
  'Lower back issues',
  'Knee problems',
  'Shoulder injury',
  'Time constraints',
  'Beginner to exercise',
  'Recovering from injury'
]

const mockGeneratedWorkout = {
  name: 'Strength & Conditioning Workout',
  description: 'A balanced full-body workout focusing on strength building and muscle development',
  duration: 60,
  difficulty: 'intermediate',
  exercises: [
    {
      id: '1',
      name: 'Goblet Squats',
      description: 'A beginner-friendly squat variation that targets your entire lower body',
      sets: 3,
      reps: '12-15',
      restTime: 90,
      muscleGroups: ['quadriceps', 'glutes', 'core'],
      equipment: ['dumbbell'],
      difficulty: 'beginner'
    },
    {
      id: '2',
      name: 'Push-ups',
      description: 'Classic upper body exercise targeting chest, shoulders, and triceps',
      sets: 3,
      reps: '8-12',
      restTime: 60,
      muscleGroups: ['chest', 'shoulders', 'triceps'],
      equipment: [],
      difficulty: 'beginner'
    },
    {
      id: '3',
      name: 'Dumbbell Rows',
      description: 'Strengthen your back and improve posture with this rowing movement',
      sets: 3,
      reps: '10-12',
      restTime: 90,
      muscleGroups: ['lats', 'rhomboids', 'biceps'],
      equipment: ['dumbbell'],
      difficulty: 'beginner'
    },
    {
      id: '4',
      name: 'Plank Hold',
      description: 'Core stability exercise that strengthens your entire midsection',
      sets: 3,
      duration: '30-45 seconds',
      restTime: 60,
      muscleGroups: ['core', 'shoulders'],
      equipment: [],
      difficulty: 'beginner'
    }
  ]
}

export default function AIWorkoutGenerationPage() {
  const [currentStep, setCurrentStep] = useState<GenerationStep>('preferences')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [preferences, setPreferences] = useState<WorkoutPreferences>({
    fitnessLevel: '',
    goals: [],
    duration: 60,
    daysPerWeek: 3,
    equipment: [],
    limitations: [],
    preferences: []
  })

  const handleGoalToggle = (goalId: string) => {
    setPreferences(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }))
  }

  const handleEquipmentToggle = (equipmentId: string) => {
    setPreferences(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipmentId)
        ? prev.equipment.filter(e => e !== equipmentId)
        : [...prev.equipment, equipmentId]
    }))
  }

  const handleLimitationToggle = (limitation: string) => {
    setPreferences(prev => ({
      ...prev,
      limitations: prev.limitations.includes(limitation)
        ? prev.limitations.filter(l => l !== limitation)
        : [...prev.limitations, limitation]
    }))
  }

  const generateWorkout = async () => {
    setCurrentStep('generating')
    setIsGenerating(true)
    
    // Simulate AI generation with progress updates
    const steps = [
      { progress: 20, message: 'Analyzing your preferences...' },
      { progress: 40, message: 'Selecting optimal exercises...' },
      { progress: 60, message: 'Calculating sets and reps...' },
      { progress: 80, message: 'Optimizing workout flow...' },
      { progress: 100, message: 'Finalizing your workout...' }
    ]
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setGenerationProgress(step.progress)
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsGenerating(false)
    setCurrentStep('review')
  }

  const canGenerate = preferences.fitnessLevel && preferences.goals.length > 0 && preferences.equipment.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/workouts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI Workout Generator</h1>
                  <p className="text-xs text-gray-500">Create personalized workouts</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
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

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {[
              { step: 'preferences', label: 'Preferences', icon: Target },
              { step: 'generating', label: 'Generating', icon: Sparkles },
              { step: 'review', label: 'Review', icon: CheckCircle },
              { step: 'complete', label: 'Complete', icon: Play }
            ].map(({ step, label, icon: Icon }, index) => {
              const isActive = currentStep === step
              const isCompleted = 
                (step === 'preferences' && ['generating', 'review', 'complete'].includes(currentStep)) ||
                (step === 'generating' && ['review', 'complete'].includes(currentStep)) ||
                (step === 'review' && currentStep === 'complete')
              
              return (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                    isActive ? 'bg-purple-100 text-purple-700' : 
                    isCompleted ? 'bg-green-100 text-green-700' : 'text-gray-500'
                  )}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  {index < 3 && (
                    <div className={cn(
                      'w-8 h-px mx-2',
                      isCompleted ? 'bg-green-300' : 'bg-gray-300'
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Preferences Step */}
        {currentStep === 'preferences' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's Create Your Perfect Workout</h2>
              <p className="text-gray-600">Tell us about your fitness goals and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Fitness Level */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Fitness Level
                  </CardTitle>
                  <CardDescription>
                    Help us understand your current fitness experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['beginner', 'intermediate', 'advanced'].map(level => (
                    <button
                      key={level}
                      onClick={() => setPreferences(prev => ({ ...prev, fitnessLevel: level }))}
                      className={cn(
                        'w-full p-3 text-left rounded-lg border transition-colors',
                        preferences.fitnessLevel === level
                          ? 'border-purple-500 bg-purple-50 text-purple-900'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="font-medium capitalize">{level}</div>
                      <div className="text-sm text-gray-600">
                        {level === 'beginner' && 'New to exercise or getting back into it'}
                        {level === 'intermediate' && 'Regular exercise routine for 6+ months'}
                        {level === 'advanced' && 'Consistent training for 2+ years'}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Fitness Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Fitness Goals
                  </CardTitle>
                  <CardDescription>
                    Select all goals that apply to you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {fitnessGoals.map(goal => (
                      <button
                        key={goal.id}
                        onClick={() => handleGoalToggle(goal.id)}
                        className={cn(
                          'p-3 text-center rounded-lg border transition-colors',
                          preferences.goals.includes(goal.id)
                            ? 'border-purple-500 bg-purple-50 text-purple-900'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="text-2xl mb-1">{goal.icon}</div>
                        <div className="text-sm font-medium">{goal.label}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Workout Duration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Workout Duration
                  </CardTitle>
                  <CardDescription>
                    How long do you want each workout to be?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Duration: {preferences.duration} minutes</Label>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      step="10"
                      value={preferences.duration}
                      onChange={(e) => setPreferences(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>20 min</span>
                      <span>120 min</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Days per week: {preferences.daysPerWeek}</Label>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      step="1"
                      value={preferences.daysPerWeek}
                      onChange={(e) => setPreferences(prev => ({ ...prev, daysPerWeek: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>1 day</span>
                      <span>7 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Equipment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Available Equipment
                  </CardTitle>
                  <CardDescription>
                    Select all equipment you have access to
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {availableEquipment.map(equipment => (
                    <button
                      key={equipment.id}
                      onClick={() => handleEquipmentToggle(equipment.id)}
                      className={cn(
                        'w-full p-3 text-left rounded-lg border transition-colors',
                        preferences.equipment.includes(equipment.id)
                          ? 'border-purple-500 bg-purple-50 text-purple-900'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {equipment.label}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Limitations & Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Limitations & Considerations
                </CardTitle>
                <CardDescription>
                  Let us know about any injuries or limitations (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonLimitations.map(limitation => (
                    <button
                      key={limitation}
                      onClick={() => handleLimitationToggle(limitation)}
                      className={cn(
                        'p-2 text-sm text-center rounded-lg border transition-colors',
                        preferences.limitations.includes(limitation)
                          ? 'border-orange-500 bg-orange-50 text-orange-900'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {limitation}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={generateWorkout}
                disabled={!canGenerate}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Workout
              </Button>
            </div>
          </div>
        )}

        {/* Generation Step */}
        {currentStep === 'generating' && (
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Workout</h2>
              <p className="text-gray-600">Our AI is analyzing your preferences to create the perfect workout for you.</p>
            </div>
            
            <div className="space-y-4">
              <Progress value={generationProgress} className="w-full" />
              <p className="text-sm text-gray-600">
                {generationProgress}% complete
              </p>
            </div>
          </div>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Workout is Ready!</h2>
              <p className="text-gray-600">Review your personalized workout and make any adjustments.</p>
            </div>

            {/* Generated Workout */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{mockGeneratedWorkout.name}</CardTitle>
                    <CardDescription>{mockGeneratedWorkout.description}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Shuffle className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{mockGeneratedWorkout.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="w-4 h-4" />
                    <Badge variant="outline" className="capitalize">
                      {mockGeneratedWorkout.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Dumbbell className="w-4 h-4" />
                    <span>{mockGeneratedWorkout.exercises.length} exercises</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {mockGeneratedWorkout.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{exercise.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">
                            {exercise.sets} sets × {exercise.reps || exercise.duration}
                          </span>
                          <span className="text-gray-500">Rest: {exercise.restTime}s</span>
                          <div className="flex gap-1">
                            {exercise.muscleGroups.slice(0, 2).map(muscle => (
                              <Badge key={muscle} variant="outline" className="text-xs capitalize">
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button variant="outline" className="flex-1 sm:flex-none">
                <Save className="w-4 h-4 mr-2" />
                Save as Plan
              </Button>
              <Button 
                onClick={() => setCurrentStep('complete')}
                className="flex-1 sm:flex-none"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Workout
              </Button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start!</h2>
            <p className="text-gray-600 mb-8">
              Your personalized workout has been created and saved. You can start it now or access it later from your workout dashboard.
            </p>
            
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/workouts/sessions/1">
                  <Play className="w-4 h-4 mr-2" />
                  Start Workout Now
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/workouts">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}