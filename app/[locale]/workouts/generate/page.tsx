/**
 * AI Workout Generation Page
 * Create personalized workouts using AI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Star,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FitnessLevelSelector } from '@/components/workouts/ui/fitness-level-selector';
import { FitnessGoalsSelector } from '@/components/workouts/ui/fitness-goals-selector';
import { EquipmentSelector } from '@/components/workouts/ui/equipment-selector';
import { LimitationsSelector } from '@/components/workouts/ui/limitations-selector';
import { ScheduleSliders } from '@/components/workouts/ui/schedule-sliders';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { SelectableCard } from '@/components/workouts/ui/selectable-card';

// React Query hooks for template system
import {
  useFeaturedTemplates,
  useTemplateCategories,
  useCreatePlanFromTemplate,
} from '@/hooks/queries/use-template-system-query';

type GenerationStep = 'templates' | 'preferences' | 'generating' | 'review' | 'complete';

interface WorkoutPreferences {
  fitnessLevel: string;
  goals: string[];
  duration: number;
  daysPerWeek: number;
  equipment: string[];
  limitations: string[];
  preferences: string[];
  selectedTemplate?: string;
  useTemplate: boolean;
}

const fitnessGoalsDefs = [
  { id: 'weight_loss', icon: '⚖️' },
  { id: 'muscle_gain', icon: '💪' },
  { id: 'strength', icon: '🏋️' },
  { id: 'endurance', icon: '🏃' },
  { id: 'flexibility', icon: '🧘' },
  { id: 'general_fitness', icon: '✨' },
];

const availableEquipmentDefs = [
  { id: 'bodyweight', icon: '🧍' },
  { id: 'dumbbells', icon: '🏋️‍♂️' },
  { id: 'barbell', icon: '🏋️' },
  { id: 'resistance_bands', icon: '🪢' },
  { id: 'full_gym', icon: '🏋️‍♀️' },
  { id: 'home_gym', icon: '🏠' },
];

const commonLimitations = [
  { label: 'Lower back issues', icon: '🦴' },
  { label: 'Knee problems', icon: '🦵' },
  { label: 'Shoulder injury', icon: '💪' },
  { label: 'Time constraints', icon: '⏱️' },
  { label: 'Beginner to exercise', icon: '🌱' },
  { label: 'Recovering from injury', icon: '🤕' },
];

interface GeneratedWorkout {
  name: string;
  description: string;
  duration: number;
  difficulty: string;
  exercises: Array<{
    id: string;
    name: string;
    description: string;
    sets: number;
    reps?: string;
    duration?: string;
    restTime: number;
    muscleGroups: string[];
    equipment: string[];
    difficulty: string;
  }>;
}

// Complete Step Component
function CompleteStep({ generatedWorkout }: { generatedWorkout: GeneratedWorkout }) {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string>('');
  const router = useRouter();

  const handleStartWorkout = async () => {
    setIsCreatingSession(true);
    setSessionError('');

    try {
      // Create a workout session from the generated workout
      const sessionData = {
        name: generatedWorkout.name,
        description: generatedWorkout.description,
        planId: null, // This is a standalone session, not from a plan
        scheduledDate: new Date().toISOString(),
        estimatedDuration: generatedWorkout.duration,
        warmUpExercises: [],
        mainExercises: generatedWorkout.exercises.map((ex, index) => ({
          exerciseId: ex.id,
          name: ex.name,
          orderIndex: index,
          exercisePhase: 'main',
          plannedSets: ex.sets,
          plannedReps: typeof ex.reps === 'string' && ex.reps ? parseInt(ex.reps.split('-')[0] || '12') : 12,
          plannedRestSeconds: ex.restTime,
          plannedWeightKg: null,
          plannedDurationSeconds: ex.duration && typeof ex.duration === 'string' ? parseInt(ex.duration.split('-')[0] || '30') : null,
        })),
        coolDownExercises: [],
        sessionType: 'standalone',
        difficultyLevel: generatedWorkout.difficulty,
        targetMuscleGroups: Array.from(new Set(
          generatedWorkout.exercises.flatMap(ex => ex.muscleGroups)
        )),
        equipmentNeeded: Array.from(new Set(
          generatedWorkout.exercises.flatMap(ex => ex.equipment || [])
        )),
      };

      const response = await fetch('/api/workouts/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create workout session');
      }

      const result = await response.json();
      
      if (!result.success || !result.data?.id) {
        throw new Error('Invalid response from session creation');
      }

      // Navigate to the newly created session
      router.push(`/workouts/sessions/${result.data.id}`);
    } catch (error) {
      console.error('Error creating workout session:', error);
      setSessionError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create workout session. Please try again.'
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
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

      {sessionError && (
        <div className='mb-6 rounded-lg bg-red-50 p-4 text-red-700'>
          <p className='text-sm'>{sessionError}</p>
        </div>
      )}

      <div className='space-y-4'>
        <Button 
          onClick={handleStartWorkout}
          disabled={isCreatingSession}
          className='w-full'
        >
          {isCreatingSession ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Creating Session...
            </>
          ) : (
            <>
              <Play className='mr-2 h-4 w-4' />
              Start Workout Now
            </>
          )}
        </Button>
        <Button variant='outline' asChild className='w-full'>
          <Link href='/workouts'>Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AIWorkoutGenerationPage() {
  const t = useTranslations('generate');
  const [currentStep, setCurrentStep] = useState<GenerationStep>('templates');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [generationError, setGenerationError] = useState<string>('');
  const [preferences, setPreferences] = useState<WorkoutPreferences>({
    fitnessLevel: '',
    goals: [],
    duration: 60,
    daysPerWeek: 3,
    equipment: [],
    limitations: [],
    preferences: [],
    selectedTemplate: undefined,
    useTemplate: false,
  });

  // React Query hooks
  const featuredTemplatesQuery = useFeaturedTemplates();
  const categoriesQuery = useTemplateCategories();
  const createPlanFromTemplateMutation = useCreatePlanFromTemplate();

  const featuredTemplates = featuredTemplatesQuery.data || [];
  const categories = categoriesQuery.data || [];

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
    setGenerationError('');
    setGenerationProgress(0);

    if (preferences.useTemplate && preferences.selectedTemplate) {
      try {
        // Create plan from template
        await createPlanFromTemplateMutation.mutateAsync({
          templateId: preferences.selectedTemplate,
          name: `My Custom Plan - ${new Date().toLocaleDateString()}`,
          personalizations: {
            targetFitnessLevel: preferences.fitnessLevel as any,
            durationWeeks: Math.ceil(preferences.daysPerWeek / 3) * 4, // Estimate weeks
            sessionsPerWeek: preferences.daysPerWeek,
            estimatedSessionDuration: preferences.duration,
            fitnessGoals: preferences.goals,
            preferences: {
              focusAreas: preferences.goals,
              preferredEquipment: preferences.equipment,
              timeConstraints: {
                maxSessionDuration: preferences.duration,
              },
            },
          },
        });
        setCurrentStep('complete');
        return;
      } catch (error) {
        console.error('Failed to create plan from template:', error);
        // Fall back to AI generation
      }
    }

    try {
      // Progress updates for AI generation
      const progressSteps = [
        { progress: 20, message: 'Analyzing your preferences...' },
        { progress: 40, message: 'Consulting AI trainer...' },
        { progress: 60, message: 'Selecting optimal exercises...' },
        { progress: 80, message: 'Calculating sets and reps...' },
      ];

      // Update progress incrementally
      for (const step of progressSteps) {
        setGenerationProgress(step.progress);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Call the AI API
      const response = await fetch('/api/ai/generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fitnessLevel: preferences.fitnessLevel,
          goals: preferences.goals,
          duration: preferences.duration,
          daysPerWeek: preferences.daysPerWeek,
          equipment: preferences.equipment,
          limitations: preferences.limitations,
          preferences: preferences.preferences,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate workout');
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid response from workout generator');
      }

      setGenerationProgress(100);
      setGeneratedWorkout(result.data);
      
      // Short delay for final progress
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCurrentStep('review');

    } catch (error) {
      console.error('Error generating workout:', error);
      setGenerationError(
        error instanceof Error 
          ? error.message 
          : 'Failed to generate workout. Please try again.'
      );
      setCurrentStep('preferences'); // Go back to preferences on error
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = preferences.useTemplate 
    ? preferences.selectedTemplate
    : preferences.fitnessLevel &&
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
                    {t('header.title')}
                  </h1>
                  <p className='text-xs text-gray-500'>
                    {t('header.subtitle')}
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
              {
                step: 'templates',
                label: 'Templates',
                icon: BookOpen,
              },
              {
                step: 'preferences',
                label: t('steps.preferences'),
                icon: Target,
              },
              {
                step: 'generating',
                label: t('steps.generating'),
                icon: Sparkles,
              },
              { step: 'review', label: t('steps.review'), icon: CheckCircle },
              { step: 'complete', label: t('steps.complete'), icon: Play },
            ].map(({ step, label, icon: Icon }, index) => {
              const isActive = currentStep === step;
              const isCompleted =
                (step === 'templates' &&
                  ['preferences', 'generating', 'review', 'complete'].includes(currentStep)) ||
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
                  {index < 4 && (
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
        {/* Templates Step */}
        {currentStep === 'templates' && (
          <div className='space-y-8'>
            <div className='mb-8 text-center'>
              <h2 className='mb-2 text-2xl font-bold text-gray-900'>
                Choose Your Starting Point
              </h2>
              <p className='text-gray-600'>
                Start with a proven template or create a custom workout from scratch
              </p>
            </div>

            {/* Template Options */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Use Template Option */}
              <SelectableCard
                selected={preferences.useTemplate}
                onSelect={() => setPreferences((prev) => ({ ...prev, useTemplate: true, selectedTemplate: undefined }))}
                title='Start with a Template'
                description='Choose from proven workout templates and customize them to your needs'
                icon={<BookOpen className='h-8 w-8 text-blue-600' />}
                className='min-h-[120px]'
              />

              {/* Custom Workout Option */}
              <SelectableCard
                selected={!preferences.useTemplate}
                onSelect={() => setPreferences((prev) => ({ ...prev, useTemplate: false, selectedTemplate: undefined }))}
                title='Create from Scratch'
                description='Build a completely custom workout based on your specific preferences'
                icon={<Sparkles className='h-8 w-8 text-purple-600' />}
                className='min-h-[120px]'
              />
            </div>

            {/* Featured Templates */}
            {preferences.useTemplate && (
              <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Featured Templates
                  </h3>
                  {categories.length > 0 && (
                    <Button variant='outline' size='sm'>
                      Browse All Categories
                      <ChevronRight className='ml-2 h-4 w-4' />
                    </Button>
                  )}
                </div>

                {featuredTemplatesQuery.isLoading ? (
                  <LoadingState message='Loading templates...' variant='grid' />
                ) : featuredTemplatesQuery.error ? (
                  <ErrorState 
                    message='Failed to load templates'
                    description='Please try again or create a custom workout instead'
                    onRetry={() => featuredTemplatesQuery.refetch()}
                  />
                ) : (
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {featuredTemplates.map((template: any) => (
                      <SelectableCard
                        key={template.id}
                        selected={preferences.selectedTemplate === template.id}
                        onSelect={() => setPreferences((prev) => ({ 
                          ...prev, 
                          selectedTemplate: template.id 
                        }))}
                        title={template.name}
                        description={template.description}
                        badge={template.difficulty ? { text: template.difficulty, variant: 'outline' as const } : undefined}
                        metadata={[
                          template.estimatedDuration && `${template.estimatedDuration} min`,
                          template.sessionCount && `${template.sessionCount} sessions`,
                          template.targetFitnessLevel,
                        ].filter(Boolean)}
                        icon={<Star className='h-6 w-6 text-yellow-500' />}
                      />
                    ))}
                  </div>
                )}

                {featuredTemplates.length === 0 && !featuredTemplatesQuery.isLoading && (
                  <div className='py-12 text-center'>
                    <BookOpen className='mx-auto mb-4 h-16 w-16 text-gray-400' />
                    <h3 className='mb-2 text-lg font-medium text-gray-900'>
                      No templates available
                    </h3>
                    <p className='mb-6 text-gray-600'>
                      Create a custom workout instead or check back later.
                    </p>
                    <Button 
                      onClick={() => setPreferences((prev) => ({ ...prev, useTemplate: false }))}
                    >
                      Create Custom Workout
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className='flex justify-center'>
              <Button
                onClick={() => setCurrentStep('preferences')}
                disabled={preferences.useTemplate && !preferences.selectedTemplate}
                size='lg'
                className='w-full sm:w-auto'
              >
                {preferences.useTemplate ? 'Customize Template' : 'Set Preferences'}
                <ChevronRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </div>
        )}

        {/* Preferences Step */}
        {currentStep === 'preferences' && (
          <div className='space-y-8'>
            <div className='mb-8 text-center'>
              <h2 className='mb-2 text-2xl font-bold text-gray-900'>
                {t('intro.title')}
              </h2>
              <p className='text-gray-600'>{t('intro.subtitle')}</p>
            </div>

            <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
              {/* Fitness Level */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Users className='h-5 w-5' />
                    {t('fitnessLevel.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('fitnessLevel.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FitnessLevelSelector
                    value={preferences.fitnessLevel}
                    onChange={(level) =>
                      setPreferences((prev) => ({
                        ...prev,
                        fitnessLevel: level,
                      }))
                    }
                    options={[
                      {
                        id: 'beginner',
                        name: t('fitnessLevel.levels.beginner.name'),
                        description: t(
                          'fitnessLevel.levels.beginner.description'
                        ),
                      },
                      {
                        id: 'intermediate',
                        name: t('fitnessLevel.levels.intermediate.name'),
                        description: t(
                          'fitnessLevel.levels.intermediate.description'
                        ),
                      },
                      {
                        id: 'advanced',
                        name: t('fitnessLevel.levels.advanced.name'),
                        description: t(
                          'fitnessLevel.levels.advanced.description'
                        ),
                      },
                    ]}
                  />
                </CardContent>
              </Card>

              {/* Fitness Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Target className='h-5 w-5' />
                    {t('fitnessGoals.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('fitnessGoals.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FitnessGoalsSelector
                    selected={preferences.goals}
                    onToggle={handleGoalToggle}
                    options={fitnessGoalsDefs.map((g) => ({
                      id: g.id,
                      icon: g.icon,
                      label: t(`fitnessGoals.options.${g.id}`),
                    }))}
                  />
                </CardContent>
              </Card>

              {/* Workout Duration */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Clock className='h-5 w-5' />
                    {t('duration.title')}
                  </CardTitle>
                  <CardDescription>{t('duration.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScheduleSliders
                    minutes={{
                      value: preferences.duration,
                      onChange: (val) =>
                        setPreferences((prev) => ({ ...prev, duration: val })),
                      label: t('duration.label', {
                        minutes: preferences.duration,
                      }),
                      min: 20,
                      max: 120,
                      step: 10,
                      minLabel: t('duration.minLabel'),
                      maxLabel: t('duration.maxLabel'),
                      marks: [30, 45, 60, 90, 120],
                    }}
                    daysPerWeek={{
                      value: preferences.daysPerWeek,
                      onChange: (val) =>
                        setPreferences((prev) => ({
                          ...prev,
                          daysPerWeek: val,
                        })),
                      label: t('daysPerWeek.label', {
                        days: preferences.daysPerWeek,
                      }),
                      min: 1,
                      max: 7,
                      step: 1,
                      minLabel: t('daysPerWeek.min'),
                      maxLabel: t('daysPerWeek.max'),
                      marks: [1, 2, 3, 4, 5, 6, 7],
                    }}
                  />
                </CardContent>
              </Card>

              {/* Available Equipment */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Dumbbell className='h-5 w-5' />
                    {t('equipment.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('equipment.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EquipmentSelector
                    selected={preferences.equipment}
                    onToggle={handleEquipmentToggle}
                    options={availableEquipmentDefs.map((e) => ({
                      id: e.id,
                      label: t(`equipment.options.${e.id}`),
                      icon: e.icon,
                    }))}
                  />
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
                <LimitationsSelector
                  selected={preferences.limitations}
                  onToggle={handleLimitationToggle}
                  options={commonLimitations.map((l) => ({
                    id: l.label,
                    label: l.label,
                    icon: l.icon,
                  }))}
                />
              </CardContent>
            </Card>

            {/* Error Message */}
            {generationError && (
              <div className='mx-auto max-w-md rounded-lg bg-red-50 p-4 text-red-700'>
                <div className='flex items-start gap-3'>
                  <AlertCircle className='h-5 w-5 flex-shrink-0 mt-0.5' />
                  <div>
                    <h4 className='font-medium'>Generation Failed</h4>
                    <p className='text-sm mt-1'>{generationError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className='flex justify-center'>
              <Button
                onClick={generateWorkout}
                disabled={!canGenerate || isGenerating}
                size='lg'
                className='w-full sm:w-auto'
              >
                {isGenerating ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className='mr-2 h-5 w-5' />
                    {t('actions.generate')}
                  </>
                )}
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
        {currentStep === 'review' && generatedWorkout && (
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
                      {generatedWorkout.name}
                    </CardTitle>
                    <CardDescription>
                      {generatedWorkout.description}
                    </CardDescription>
                  </div>
                  <Button 
                    variant='outline' 
                    size='sm'
                    onClick={generateWorkout}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Shuffle className='mr-2 h-4 w-4' />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='mb-6 flex items-center gap-6'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Clock className='h-4 w-4' />
                    <span>{generatedWorkout.duration} minutes</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Target className='h-4 w-4' />
                    <Badge variant='outline' className='capitalize'>
                      {generatedWorkout.difficulty}
                    </Badge>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Dumbbell className='h-4 w-4' />
                    <span>
                      {generatedWorkout.exercises.length} exercises
                    </span>
                  </div>
                </div>

                <div className='space-y-4'>
                  {generatedWorkout.exercises.map((exercise, index) => (
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
        {currentStep === 'complete' && generatedWorkout && (
          <CompleteStep generatedWorkout={generatedWorkout} />
        )}
      </main>
    </div>
  );
}
