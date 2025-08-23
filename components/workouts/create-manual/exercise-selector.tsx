/**
 * Exercise Selector Component
 * Browse, search, and select exercises for workout sessions
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Filter,
  Plus,
  Minus,
  Target,
  Clock,
  Activity,
  Dumbbell,
  Heart,
  Zap,
  Timer,
  Check,
  X,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Mock exercise data - in a real app, this would come from an API
const MOCK_EXERCISES: Exercise[] = [
  {
    id: '1',
    name: 'Barbell Squat',
    category: 'legs',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['barbell', 'squat_rack'],
    difficulty: 'intermediate' as const,
    type: 'compound',
    instructions:
      'Stand with feet shoulder-width apart, lower into squat position...',
    videoUrl: null,
    imageUrl: null,
  },
  {
    id: '2',
    name: 'Push-ups',
    category: 'chest',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['bodyweight'],
    difficulty: 'beginner' as const,
    type: 'compound',
    instructions: 'Start in plank position, lower chest to ground...',
    videoUrl: null,
    imageUrl: null,
  },
  {
    id: '3',
    name: 'Deadlift',
    category: 'back',
    muscleGroups: ['hamstrings', 'glutes', 'back', 'traps'],
    equipment: ['barbell'],
    difficulty: 'advanced' as const,
    type: 'compound',
    instructions: 'Stand with feet hip-width apart, grip barbell...',
    videoUrl: null,
    imageUrl: null,
  },
  {
    id: '4',
    name: 'Dumbbell Bench Press',
    category: 'chest',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['dumbbells', 'bench'],
    difficulty: 'intermediate' as const,
    type: 'compound',
    instructions: 'Lie on bench, hold dumbbells above chest...',
    videoUrl: null,
    imageUrl: null,
  },
  {
    id: '5',
    name: 'Plank',
    category: 'core',
    muscleGroups: ['abs', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner' as const,
    type: 'isometric',
    instructions: 'Hold plank position with straight body...',
    videoUrl: null,
    imageUrl: null,
  },
  {
    id: '6',
    name: 'Pull-ups',
    category: 'back',
    muscleGroups: ['lats', 'biceps', 'back'],
    equipment: ['pull_up_bar'],
    difficulty: 'advanced' as const,
    type: 'compound',
    instructions: 'Hang from bar, pull body up until chin over bar...',
    videoUrl: null,
    imageUrl: null,
  },
  {
    id: '7',
    name: 'Lunges',
    category: 'legs',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['bodyweight'],
    difficulty: 'beginner' as const,
    type: 'compound',
    instructions: 'Step forward into lunge position...',
    videoUrl: null,
    imageUrl: null,
  },
  {
    id: '8',
    name: 'Shoulder Press',
    category: 'shoulders',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: ['dumbbells'],
    difficulty: 'intermediate' as const,
    type: 'compound',
    instructions: 'Press dumbbells overhead from shoulder height...',
    videoUrl: null,
    imageUrl: null,
  },
];

const CATEGORIES = [
  { value: 'all', label: 'All Exercises', icon: Activity },
  { value: 'chest', label: 'Chest', icon: Dumbbell },
  { value: 'back', label: 'Back', icon: Target },
  { value: 'legs', label: 'Legs', icon: Zap },
  { value: 'shoulders', label: 'Shoulders', icon: Activity },
  { value: 'arms', label: 'Arms', icon: Dumbbell },
  { value: 'core', label: 'Core', icon: Target },
  { value: 'cardio', label: 'Cardio', icon: Heart },
];

const DIFFICULTY_LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner', color: 'bg-green-500' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-500' },
];

const EQUIPMENT_FILTERS = [
  { value: 'all', label: 'All Equipment' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'machines', label: 'Machines' },
  { value: 'cables', label: 'Cables' },
];

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: string;
  instructions: string;
  videoUrl?: string | null;
  imageUrl?: string | null;
}

interface ExerciseConfig {
  exerciseId: string;
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
}

interface ExerciseSelectorProps {
  selectedExercises: ExerciseConfig[];
  onExercisesChange: (exercises: ExerciseConfig[]) => void;
  maxExercises?: number;
}

function ExerciseCard({
  exercise,
  isSelected,
  onSelect,
  onDeselect,
}: {
  exercise: Exercise;
  isSelected: boolean;
  onSelect: (exercise: Exercise) => void;
  onDeselect: (exerciseId: string) => void;
}) {
  const t = useTranslations('workouts.createPlan.templates');

  const difficultyConfig = DIFFICULTY_LEVELS.find(
    (d) => d.value === exercise.difficulty
  );

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md',
        isSelected && 'bg-blue-50 ring-2 ring-blue-500'
      )}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <CardTitle className='mb-1 text-base font-semibold'>
              {exercise.name}
            </CardTitle>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='outline' className='text-xs'>
                {exercise.category}
              </Badge>
              {difficultyConfig && (
                <Badge variant='outline' className='text-xs'>
                  <div
                    className={cn(
                      'mr-1 h-2 w-2 rounded-full',
                      difficultyConfig.color
                    )}
                  />
                  {difficultyConfig.label}
                </Badge>
              )}
            </div>
          </div>
          <Button
            size='sm'
            variant={isSelected ? 'default' : 'outline'}
            onClick={() =>
              isSelected ? onDeselect(exercise.id) : onSelect(exercise)
            }
            className='ml-2'
          >
            {isSelected ? (
              <Check className='h-4 w-4' />
            ) : (
              <Plus className='h-4 w-4' />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        {/* Muscle Groups */}
        {exercise.muscleGroups.length > 0 && (
          <div className='mb-3'>
            <p className='mb-1 text-xs font-medium text-gray-700'>
              Target Muscles:
            </p>
            <div className='flex flex-wrap gap-1'>
              {exercise.muscleGroups.slice(0, 3).map((muscle, index) => (
                <Badge
                  key={index}
                  variant='secondary'
                  className='text-xs capitalize'
                >
                  {muscle}
                </Badge>
              ))}
              {exercise.muscleGroups.length > 3 && (
                <Badge variant='secondary' className='text-xs'>
                  +{exercise.muscleGroups.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Equipment */}
        {exercise.equipment.length > 0 && (
          <div className='mb-3'>
            <p className='mb-1 text-xs font-medium text-gray-700'>Equipment:</p>
            <div className='flex flex-wrap gap-1'>
              {exercise.equipment.map((equip, index) => (
                <Badge
                  key={index}
                  variant='outline'
                  className='text-xs capitalize'
                >
                  {equip.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Instructions Preview */}
        <p className='line-clamp-2 text-xs text-gray-600'>
          {exercise.instructions}
        </p>
      </CardContent>
    </Card>
  );
}

function ExerciseConfigPanel({
  exercise,
  config,
  onConfigChange,
  onRemove,
}: {
  exercise: Exercise;
  config: ExerciseConfig;
  onConfigChange: (config: ExerciseConfig) => void;
  onRemove: (exerciseId: string) => void;
}) {
  const t = useTranslations('workouts.createPlan.templates');

  const updateConfig = useCallback(
    (updates: Partial<ExerciseConfig>) => {
      onConfigChange({ ...config, ...updates });
    },
    [config, onConfigChange]
  );

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-semibold'>
            {exercise.name}
          </CardTitle>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => onRemove(config.exerciseId)}
            className='text-red-500 hover:text-red-700'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {/* Sets */}
        <div>
          <label className='mb-1 block text-xs font-medium text-gray-700'>
            Sets
          </label>
          <Input
            type='number'
            min='1'
            max='10'
            value={config.sets}
            onChange={(e) =>
              updateConfig({ sets: parseInt(e.target.value) || 1 })
            }
            className='h-8'
          />
        </div>

        {/* Reps or Duration based on exercise type */}
        {exercise.type !== 'isometric' ? (
          <div>
            <label className='mb-1 block text-xs font-medium text-gray-700'>
              Reps
            </label>
            <Input
              type='number'
              min='1'
              max='50'
              value={config.reps || ''}
              onChange={(e) =>
                updateConfig({ reps: parseInt(e.target.value) || undefined })
              }
              placeholder='8-12'
              className='h-8'
            />
          </div>
        ) : (
          <div>
            <label className='mb-1 block text-xs font-medium text-gray-700'>
              Duration (seconds)
            </label>
            <Input
              type='number'
              min='10'
              max='300'
              value={config.duration || ''}
              onChange={(e) =>
                updateConfig({
                  duration: parseInt(e.target.value) || undefined,
                })
              }
              placeholder='30-60'
              className='h-8'
            />
          </div>
        )}

        {/* Weight */}
        {exercise.equipment.some((eq) =>
          ['dumbbells', 'barbell', 'machines'].includes(eq)
        ) && (
          <div>
            <label className='mb-1 block text-xs font-medium text-gray-700'>
              Weight (lbs)
            </label>
            <Input
              type='number'
              min='0'
              step='5'
              value={config.weight || ''}
              onChange={(e) =>
                updateConfig({ weight: parseInt(e.target.value) || undefined })
              }
              placeholder='Optional'
              className='h-8'
            />
          </div>
        )}

        {/* Rest Time */}
        <div>
          <label className='mb-1 block text-xs font-medium text-gray-700'>
            Rest Time (seconds)
          </label>
          <Select
            value={config.restTime?.toString() || '60'}
            onValueChange={(value) =>
              updateConfig({ restTime: parseInt(value) })
            }
          >
            <SelectTrigger className='h-8'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='30'>30 seconds</SelectItem>
              <SelectItem value='45'>45 seconds</SelectItem>
              <SelectItem value='60'>1 minute</SelectItem>
              <SelectItem value='90'>1.5 minutes</SelectItem>
              <SelectItem value='120'>2 minutes</SelectItem>
              <SelectItem value='180'>3 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div>
          <label className='mb-1 block text-xs font-medium text-gray-700'>
            Notes
          </label>
          <Input
            value={config.notes || ''}
            onChange={(e) => updateConfig({ notes: e.target.value })}
            placeholder='Optional notes...'
            className='h-8 text-xs'
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function ExerciseSelector({
  selectedExercises,
  onExercisesChange,
  maxExercises = 12,
}: ExerciseSelectorProps) {
  const t = useTranslations('workouts.createPlan.templates');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    return MOCK_EXERCISES.filter((exercise) => {
      const matchesSearch =
        searchQuery === '' ||
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscleGroups.some((muscle) =>
          muscle.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'all' || exercise.category === selectedCategory;
      const matchesDifficulty =
        selectedDifficulty === 'all' ||
        exercise.difficulty === selectedDifficulty;
      const matchesEquipment =
        selectedEquipment === 'all' ||
        exercise.equipment.includes(selectedEquipment);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty &&
        matchesEquipment
      );
    });
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedEquipment]);

  const selectedExerciseIds = useMemo(
    () => selectedExercises.map((config) => config.exerciseId),
    [selectedExercises]
  );

  const handleSelectExercise = useCallback(
    (exercise: Exercise) => {
      if (selectedExercises.length >= maxExercises) {
        return;
      }

      const newConfig: ExerciseConfig = {
        exerciseId: exercise.id,
        sets: 3,
        reps: exercise.type !== 'isometric' ? 10 : undefined,
        duration: exercise.type === 'isometric' ? 30 : undefined,
        restTime: 60,
      };

      onExercisesChange([...selectedExercises, newConfig]);
    },
    [selectedExercises, maxExercises, onExercisesChange]
  );

  const handleDeselectExercise = useCallback(
    (exerciseId: string) => {
      onExercisesChange(
        selectedExercises.filter((config) => config.exerciseId !== exerciseId)
      );
    },
    [selectedExercises, onExercisesChange]
  );

  const handleUpdateExerciseConfig = useCallback(
    (updatedConfig: ExerciseConfig) => {
      onExercisesChange(
        selectedExercises.map((config) =>
          config.exerciseId === updatedConfig.exerciseId
            ? updatedConfig
            : config
        )
      );
    },
    [selectedExercises, onExercisesChange]
  );

  const getExerciseById = useCallback(
    (id: string) => MOCK_EXERCISES.find((ex) => ex.id === id),
    []
  );

  return (
    <div className='space-y-6'>
      <Tabs defaultValue='browse' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='browse'>Browse Exercises</TabsTrigger>
          <TabsTrigger value='selected'>
            Selected ({selectedExercises.length}/{maxExercises})
          </TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value='browse' className='space-y-4'>
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Find Exercises</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Search */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search exercises or muscle groups...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>

              {/* Filters */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Category' />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedDifficulty}
                  onValueChange={setSelectedDifficulty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Difficulty' />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedEquipment}
                  onValueChange={setSelectedEquipment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Equipment' />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_FILTERS.map((equipment) => (
                      <SelectItem key={equipment.value} value={equipment.value}>
                        {equipment.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              <div className='flex items-center justify-between text-sm text-gray-600'>
                <span>{filteredExercises.length} exercises found</span>
                {selectedExercises.length > 0 && (
                  <span>
                    {selectedExercises.length}/{maxExercises} selected
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exercise Grid */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isSelected={selectedExerciseIds.includes(exercise.id)}
                onSelect={handleSelectExercise}
                onDeselect={handleDeselectExercise}
              />
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <Card>
              <CardContent className='py-12 text-center'>
                <Search className='mx-auto mb-4 h-12 w-12 text-gray-400' />
                <h3 className='mb-2 text-lg font-medium text-gray-900'>
                  No exercises found
                </h3>
                <p className='text-gray-600'>
                  Try adjusting your search terms or filters
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Selected Tab */}
        <TabsContent value='selected' className='space-y-4'>
          {selectedExercises.length === 0 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <Dumbbell className='mx-auto mb-4 h-12 w-12 text-gray-400' />
                <h3 className='mb-2 text-lg font-medium text-gray-900'>
                  No exercises selected
                </h3>
                <p className='text-gray-600'>
                  Browse exercises and add them to configure your workout
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              {selectedExercises.map((config) => {
                const exercise = getExerciseById(config.exerciseId);
                if (!exercise) {
                  return null;
                }

                return (
                  <ExerciseConfigPanel
                    key={config.exerciseId}
                    exercise={exercise}
                    config={config}
                    onConfigChange={handleUpdateExerciseConfig}
                    onRemove={handleDeselectExercise}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
