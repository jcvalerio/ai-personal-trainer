/**
 * AI Workout Generation Page
 * Create personalized workouts using AI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import {
  Sparkles,
  ArrowLeft,
  Target,
  Clock,
  Dumbbell,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
  Play,
  Save,
  Shuffle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type GenerationStep = 'preferences' | 'generating' | 'review' | 'complete';

interface WorkoutPreferences {
  fitnessLevel: string;
  goals: string[];
  duration: number;
  daysPerWeek: number;
  equipment: string[];
  limitations: string[];
  preferences: string[];
}

const fitnessGoals = [
  { id: 'weight_loss', label: 'Weight Loss', icon: '⚖️' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'strength', label: 'Strength', icon: '🏋️' },
  { id: 'endurance', label: 'Endurance', icon: '🏃' },
  { id: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { id: 'general_fitness', label: 'General Fitness', icon: '✨' },
];

const availableEquipment = [
  { id: 'bodyweight', label: 'Bodyweight Only' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'resistance_bands', label: 'Resistance Bands' },
  { id: 'full_gym', label: 'Full Gym Access' },
  { id: 'home_gym', label: 'Home Gym Setup' },
];

const commonLimitations = [
  'Lower back issues',
  'Knee problems',
  'Shoulder injury',
  'Time constraints',
  'Beginner to exercise',
  'Recovering from injury',
];

const mockGeneratedWorkout = {
  name: 'Strength & Conditioning Workout',
  description:
    'A balanced full-body workout focusing on strength building and muscle development',
  duration: 60,
  difficulty: 'intermediate',
  exercises: [
    {
      id: '1',
      name: 'Goblet Squats',
      description:
        'A beginner-friendly squat variation that targets your entire lower body',
      sets: 3,
      reps: '12-15',
      restTime: 90,
      muscleGroups: ['quadriceps', 'glutes', 'core'],
      equipment: ['dumbbell'],
      difficulty: 'beginner',
    },
    {
      id: '2',
      name: 'Push-ups',
      description:
        'Classic upper body exercise targeting chest, shoulders, and triceps',
      sets: 3,
      reps: '8-12',
      restTime: 60,
      muscleGroups: ['chest', 'shoulders', 'triceps'],
      equipment: [],
      difficulty: 'beginner',
    },
    {
      id: '3',
      name: 'Dumbbell Rows',
      description:
        'Strengthen your back and improve posture with this rowing movement',
      sets: 3,
      reps: '10-12',
      restTime: 90,
      muscleGroups: ['lats', 'rhomboids', 'biceps'],
      equipment: ['dumbbell'],
      difficulty: 'beginner',
    },
    {
      id: '4',
      name: 'Plank Hold',
      description:
        'Core stability exercise that strengthens your entire midsection',
      sets: 3,
      duration: '30-45 seconds',
      restTime: 60,
      muscleGroups: ['core', 'shoulders'],
      equipment: [],
      difficulty: 'beginner',
    },
  ],
};

export default function AIWorkoutGenerationPage() {
  const [currentStep, setCurrentStep] = useState<GenerationStep>('preferences');
  const [, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [preferences, setPreferences] = useState<WorkoutPreferences>({
    fitnessLevel: '',
    goals: [],
    duration: 60,
    daysPerWeek: 3,
    equipment: [],
    limitations: [],
    preferences: [],
  });

  const handleGoalToggle = (goalId: string) => {
    setPreferences((prev) => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter((g) => g !== goalId)
        : [...prev.goals, goalId],
    }));
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    setPreferences((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipmentId)
        ? prev.equipment.filter((e) => e !== equipmentId)
        : [...prev.equipment, equipmentId],
    }));
  };

  const handleLimitationToggle = (limitation: string) => {
    setPreferences((prev) => ({
      ...prev,
      limitations: prev.limitations.includes(limitation)
        ? prev.limitations.filter((l) => l !== limitation)
        : [...prev.limitations, limitation],
    }));
  };

  const generateWorkout = async () => {
    setCurrentStep('generating');
    setIsGenerating(true);

    // Simulate AI generation with progress updates
    const steps = [
      { progress: 20, message: 'Analyzing your preferences...' },
      { progress: 40, message: 'Selecting optimal exercises...' },
      { progress: 60, message: 'Calculating sets and reps...' },
      { progress: 80, message: 'Optimizing workout flow...' },
      { progress: 100, message: 'Finalizing your workout...' },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setGenerationProgress(step.progress);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsGenerating(false);
    setCurrentStep('review');
  };

  const canGenerate =
    preferences.fitnessLevel &&
    preferences.goals.length > 0 &&
    preferences.equipment.length > 0;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='sticky top-0 z-40 border-b border-gray-200 bg-white'>
        <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Link
                href='/workouts'
                className='rounded-lg p-2 transition-colors hover:bg-gray-100'
              >
                <ArrowLeft className='h-5 w-5 text-gray-600' />
              </Link>
              <div className='flex items-center gap-3'>
                <div className='rounded-xl bg-purple-100 p-2'>
                  <Sparkles className='h-6 w-6 text-purple-600' />
                </div>
                <div>
                  <h1 className='text-xl font-bold text-gray-900'>
                    AI Workout Generator
                  </h1>
                  <p className='text-xs text-gray-500'>
                    Create personalized workouts
                  </p>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  },
                }}
                showName={false}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className='border-b border-gray-200 bg-white'>
        <div className='mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between'>
            {[
              { step: 'preferences', label: 'Preferences', icon: Target },
              { step: 'generating', label: 'Generating', icon: Sparkles },
              { step: 'review', label: 'Review', icon: CheckCircle },
              { step: 'complete', label: 'Complete', icon: Play },
            ].map(({ step, label, icon: Icon }, index) => {
              const isActive = currentStep === step;
              const isCompleted =
                (step === 'preferences' &&
                  ['generating', 'review', 'complete'].includes(currentStep)) ||
                (step === 'generating' &&
                  ['review', 'complete'].includes(currentStep)) ||
                (step === 'review' && currentStep === 'complete');

              return (
                <div key={step} className='flex items-center'>
                  <div
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                      isActive
                        ? 'bg-purple-100 text-purple-700'
                        : isCompleted
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-500'
                    )}
                  >
                    <Icon className='h-4 w-4' />
                    <span className='text-sm font-medium'>{label}</span>
                  </div>
                  {index < 3 && (
                    <div
                      className={cn(
                        'mx-2 h-px w-8',
                        isCompleted ? 'bg-green-300' : 'bg-gray-300'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Preferences Step */}
        {currentStep === 'preferences' && (
          <div className='space-y-8'>
            <div className='mb-8 text-center'>
              <h2 className='mb-2 text-2xl font-bold text-gray-900'>
                Let's Create Your Perfect Workout
              </h2>
              <p className='text-gray-600'>
                Tell us about your fitness goals and preferences
              </p>
            </div>

            <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
              {/* Fitness Level */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Users className='h-5 w-5' />
                    Fitness Level
                  </CardTitle>
                  <CardDescription>
                    Help us understand your current fitness experience
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() =>
                        setPreferences((prev) => ({
                          ...prev,
                          fitnessLevel: level,
                        }))
                      }
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors',
                        preferences.fitnessLevel === level
                          ? 'border-purple-500 bg-purple-50 text-purple-900'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className='font-medium capitalize'>{level}</div>
                      <div className='text-sm text-gray-600'>
                        {level === 'beginner' &&
                          'New to exercise or getting back into it'}
                        {level === 'intermediate' &&
                          'Regular exercise routine for 6+ months'}
                        {level === 'advanced' &&
                          'Consistent training for 2+ years'}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Fitness Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Target className='h-5 w-5' />
                    Fitness Goals
                  </CardTitle>
                  <CardDescription>
                    Select all goals that apply to you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-2'>
                    {fitnessGoals.map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => handleGoalToggle(goal.id)}
                        className={cn(
                          'rounded-lg border p-3 text-center transition-colors',
                          preferences.goals.includes(goal.id)
                            ? 'border-purple-500 bg-purple-50 text-purple-900'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className='mb-1 text-2xl'>{goal.icon}</div>
                        <div className='text-sm font-medium'>{goal.label}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Workout Duration */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Clock className='h-5 w-5' />
                    Workout Duration
                  </CardTitle>
                  <CardDescription>
                    How long do you want each workout to be?
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Duration: {preferences.duration} minutes</Label>
                    <input
                      type='range'
                      min='20'
                      max='120'
                      step='10'
                      value={preferences.duration}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          duration: parseInt(e.target.value),
                        }))
                      }
                      className='w-full'
                    />
                    <div className='flex justify-between text-sm text-gray-500'>
                      <span>20 min</span>
                      <span>120 min</span>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label>Days per week: {preferences.daysPerWeek}</Label>
                    <input
                      type='range'
                      min='1'
                      max='7'
                      step='1'
                      value={preferences.daysPerWeek}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          daysPerWeek: parseInt(e.target.value),
                        }))
                      }
                      className='w-full'
                    />
                    <div className='flex justify-between text-sm text-gray-500'>
                      <span>1 day</span>
                      <span>7 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Equipment */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Dumbbell className='h-5 w-5' />
                    Available Equipment
                  </CardTitle>
                  <CardDescription>
                    Select all equipment you have access to
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {availableEquipment.map((equipment) => (
                    <button
                      key={equipment.id}
                      onClick={() => handleEquipmentToggle(equipment.id)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors',
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
                <CardTitle className='flex items-center gap-2'>
                  <AlertCircle className='h-5 w-5' />
                  Limitations & Considerations
                </CardTitle>
                <CardDescription>
                  Let us know about any injuries or limitations (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
                  {commonLimitations.map((limitation) => (
                    <button
                      key={limitation}
                      onClick={() => handleLimitationToggle(limitation)}
                      className={cn(
                        'rounded-lg border p-2 text-center text-sm transition-colors',
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
            <div className='flex justify-center'>
              <Button
                onClick={generateWorkout}
                disabled={!canGenerate}
                size='lg'
                className='w-full sm:w-auto'
              >
                <Sparkles className='mr-2 h-5 w-5' />
                Generate My Workout
              </Button>
            </div>
          </div>
        )}

        {/* Generation Step */}
        {currentStep === 'generating' && (
          <div className='mx-auto max-w-md text-center'>
            <div className='mb-8'>
              <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100'>
                <Loader2 className='h-10 w-10 animate-spin text-purple-600' />
              </div>
              <h2 className='mb-2 text-2xl font-bold text-gray-900'>
                Creating Your Workout
              </h2>
              <p className='text-gray-600'>
                Our AI is analyzing your preferences to create the perfect
                workout for you.
              </p>
            </div>

            <div className='space-y-4'>
              <Progress value={generationProgress} className='w-full' />
              <p className='text-sm text-gray-600'>
                {generationProgress}% complete
              </p>
            </div>
          </div>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <div className='space-y-8'>
            <div className='text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
                <CheckCircle className='h-8 w-8 text-green-600' />
              </div>
              <h2 className='mb-2 text-2xl font-bold text-gray-900'>
                Your Workout is Ready!
              </h2>
              <p className='text-gray-600'>
                Review your personalized workout and make any adjustments.
              </p>
            </div>

            {/* Generated Workout */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-xl'>
                      {mockGeneratedWorkout.name}
                    </CardTitle>
                    <CardDescription>
                      {mockGeneratedWorkout.description}
                    </CardDescription>
                  </div>
                  <Button variant='outline' size='sm'>
                    <Shuffle className='mr-2 h-4 w-4' />
                    Regenerate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='mb-6 flex items-center gap-6'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Clock className='h-4 w-4' />
                    <span>{mockGeneratedWorkout.duration} minutes</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Target className='h-4 w-4' />
                    <Badge variant='outline' className='capitalize'>
                      {mockGeneratedWorkout.difficulty}
                    </Badge>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Dumbbell className='h-4 w-4' />
                    <span>
                      {mockGeneratedWorkout.exercises.length} exercises
                    </span>
                  </div>
                </div>

                <div className='space-y-4'>
                  {mockGeneratedWorkout.exercises.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className='flex items-start gap-4 rounded-lg bg-gray-50 p-4'
                    >
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white'>
                        {index + 1}
                      </div>
                      <div className='flex-1'>
                        <h4 className='mb-1 font-semibold text-gray-900'>
                          {exercise.name}
                        </h4>
                        <p className='mb-2 text-sm text-gray-600'>
                          {exercise.description}
                        </p>
                        <div className='flex items-center gap-4 text-sm'>
                          <span className='font-medium'>
                            {exercise.sets} sets ×{' '}
                            {exercise.reps || exercise.duration}
                          </span>
                          <span className='text-gray-500'>
                            Rest: {exercise.restTime}s
                          </span>
                          <div className='flex gap-1'>
                            {exercise.muscleGroups.slice(0, 2).map((muscle) => (
                              <Badge
                                key={muscle}
                                variant='outline'
                                className='text-xs capitalize'
                              >
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
            <div className='flex justify-center gap-4'>
              <Button variant='outline' className='flex-1 sm:flex-none'>
                <Save className='mr-2 h-4 w-4' />
                Save as Plan
              </Button>
              <Button
                onClick={() => setCurrentStep('complete')}
                className='flex-1 sm:flex-none'
              >
                <Play className='mr-2 h-4 w-4' />
                Start Workout
              </Button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className='mx-auto max-w-md text-center'>
            <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100'>
              <Play className='h-10 w-10 text-green-600' />
            </div>
            <h2 className='mb-4 text-2xl font-bold text-gray-900'>
              Ready to Start!
            </h2>
            <p className='mb-8 text-gray-600'>
              Your personalized workout has been created and saved. You can
              start it now or access it later from your workout dashboard.
            </p>

            <div className='space-y-4'>
              <Button asChild className='w-full'>
                <Link href='/workouts/sessions/1'>
                  <Play className='mr-2 h-4 w-4' />
                  Start Workout Now
                </Link>
              </Button>
              <Button variant='outline' asChild className='w-full'>
                <Link href='/workouts'>Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
