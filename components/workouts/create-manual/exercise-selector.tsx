/**
 * Exercise Selector Component
 * Browse, search, and select exercises for workout sessions
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Plus,
  Target,
  Activity,
  Dumbbell,
  Heart,
  Zap,
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
import { cn } from '@/lib/utils';

// Import Phase 3 API hooks
import {
  useExerciseLibrary,
  useExerciseSearch,
  useExerciseCategories,
  useMuscleGroups,
  useEquipment,
} from '@/hooks/queries/use-exercise-library-query';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import type { Exercise as APIExercise } from '@/types/workouts';

const EXERCISE_TYPE_ICONS = {
  all: Activity,
  strength: Dumbbell,
  cardio: Heart,
  flexibility: Target,
  sports: Zap,
};

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500',
};

// Type alias for API Exercise type
type Exercise = APIExercise;

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

  const difficultyColor = DIFFICULTY_COLORS[exercise.difficultyLevel];

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
                {exercise.exerciseType}
              </Badge>
              <Badge variant='outline' className='text-xs'>
                <div
                  className={cn(
                    'mr-1 h-2 w-2 rounded-full',
                    difficultyColor
                  )}
                />
                {exercise.difficultyLevel}
              </Badge>
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
        {(exercise.primaryMuscleGroups?.length > 0 || exercise.secondaryMuscleGroups?.length > 0) && (
          <div className='mb-3'>
            <p className='mb-1 text-xs font-medium text-gray-700'>
              Target Muscles:
            </p>
            <div className='flex flex-wrap gap-1'>
              {exercise.primaryMuscleGroups?.slice(0, 2).map((muscle, index) => (
                <Badge
                  key={`primary-${index}`}
                  variant='secondary'
                  className='text-xs capitalize'
                >
                  {muscle.replace('_', ' ')}
                </Badge>
              ))}
              {exercise.secondaryMuscleGroups?.slice(0, 1).map((muscle, index) => (
                <Badge
                  key={`secondary-${index}`}
                  variant='outline'
                  className='text-xs capitalize'
                >
                  {muscle.replace('_', ' ')}
                </Badge>
              ))}
              {(exercise.primaryMuscleGroups?.length || 0) + (exercise.secondaryMuscleGroups?.length || 0) > 3 && (
                <Badge variant='secondary' className='text-xs'>
                  +{((exercise.primaryMuscleGroups?.length || 0) + (exercise.secondaryMuscleGroups?.length || 0)) - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Equipment */}
        {exercise.equipmentRequired?.length > 0 && (
          <div className='mb-3'>
            <p className='mb-1 text-xs font-medium text-gray-700'>Equipment:</p>
            <div className='flex flex-wrap gap-1'>
              {exercise.equipmentRequired.map((equip, index) => (
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
        {exercise.exerciseType !== 'flexibility' ? (
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
        {exercise.equipmentRequired?.some((eq) =>
          ['dumbbells', 'barbell', 'machines', 'cable_machine'].includes(eq.toLowerCase())
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
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all');

  // Fetch exercise data using API hooks
  const exerciseLibraryQuery = useExerciseLibrary({
    page: 1,
    limit: 100, // Get more exercises for manual selection
    exerciseType: selectedType !== 'all' ? selectedType as any : undefined,
    difficultyLevel: selectedDifficulty !== 'all' ? selectedDifficulty as any : undefined,
    muscleGroup: selectedMuscleGroup !== 'all' ? selectedMuscleGroup : undefined,
    isPublic: true,
    isVerified: true,
  });

  const searchQueryResult = useExerciseSearch(
    searchQuery,
    {
      type: selectedType !== 'all' ? selectedType as any : undefined,
      difficulty: selectedDifficulty !== 'all' ? selectedDifficulty as any : undefined,
      equipment: selectedEquipment !== 'all' ? [selectedEquipment] : undefined,
      muscleGroups: selectedMuscleGroup !== 'all' ? [selectedMuscleGroup] : undefined,
      verified: true,
      public: true,
      limit: 100,
    }
  );

  // Fetch categories and filters
  const categoriesQuery = useExerciseCategories();
  const muscleGroupsQuery = useMuscleGroups();
  const equipmentQuery = useEquipment();

  // Determine which data to use
  const shouldUseSearch = searchQuery.length >= 2;
  const activeQuery = shouldUseSearch ? searchQueryResult : exerciseLibraryQuery;
  const exercises = activeQuery.data?.exercises || [];
  const isLoading = activeQuery.isLoading;
  const error = activeQuery.error;

  // Get filter options from API
  const exerciseTypes = ['all', 'strength', 'cardio', 'flexibility', 'sports'];
  const difficultyLevels = ['all', 'beginner', 'intermediate', 'advanced'];
  const muscleGroups = ['all', ...(muscleGroupsQuery.data || [])];
  const equipmentOptions = ['all', ...(equipmentQuery.data || [])];

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
        reps: exercise.exerciseType !== 'flexibility' ? 10 : undefined,
        duration: exercise.exerciseType === 'flexibility' ? 30 : undefined,
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
    (id: string) => exercises.find((ex) => ex.id === id),
    [exercises]
  );

  // Show loading state if initial load
  if (isLoading && exercises.length === 0) {
    return (
      <div className='space-y-6'>
        <LoadingState 
          message="Loading exercise library..." 
          variant="card" 
        />
      </div>
    );
  }

  // Show error state if error and no cached data
  if (error && exercises.length === 0) {
    return (
      <div className='space-y-6'>
        <ErrorState 
          message="Failed to load exercises" 
          description={error instanceof Error ? error.message : 'Unable to load exercise library'}
          onRetry={() => activeQuery.refetch()}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Tabs defaultValue='browse' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='browse'>{t('filters.tabs.browse')}</TabsTrigger>
          <TabsTrigger value='selected'>
            {t('filters.tabs.selected', {
              selected: selectedExercises.length,
              max: maxExercises,
            })}
          </TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value='browse' className='space-y-4'>
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>
                {t('filters.findTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Search */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder={t('filters.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>

              {/* Filters */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Exercise Type"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {exerciseTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedDifficulty}
                  onValueChange={setSelectedDifficulty}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Difficulty Level"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedMuscleGroup}
                  onValueChange={setSelectedMuscleGroup}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Muscle Group"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {muscleGroups.map((muscle) => (
                      <SelectItem key={muscle} value={muscle}>
                        {muscle === 'all' ? 'All Muscles' : muscle.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedEquipment}
                  onValueChange={setSelectedEquipment}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Equipment"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentOptions.map((equipment) => (
                      <SelectItem key={equipment} value={equipment}>
                        {equipment === 'all' ? 'All Equipment' : equipment.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Results count and loading indicator */}
              <div className='flex items-center justify-between text-sm text-gray-600'>
                <span className="flex items-center gap-2">
                  {isLoading && <LoadingState size="sm" variant="inline" message="" />}
                  {isLoading 
                    ? 'Loading exercises...'
                    : `${exercises.length} exercise${exercises.length !== 1 ? 's' : ''} found`
                  }
                  {shouldUseSearch && !isLoading && (
                    <span className="text-blue-600">for "{searchQuery}"</span>
                  )}
                </span>
                {selectedExercises.length > 0 && (
                  <span>
                    {selectedExercises.length}/{maxExercises} selected
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exercise Grid */}
          {isLoading && exercises.length === 0 ? (
            <LoadingState 
              message="Loading exercises..." 
              variant="centered" 
            />
          ) : exercises.length === 0 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <Search className='mx-auto mb-4 h-12 w-12 text-gray-400' />
                <h3 className='mb-2 text-lg font-medium text-gray-900'>
                  No exercises found
                </h3>
                <p className='mb-6 text-gray-600'>
                  {shouldUseSearch 
                    ? `Try adjusting your search "${searchQuery}" or filters.`
                    : 'Try adjusting your filters or check back later.'
                  }
                </p>
                {shouldUseSearch && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  isSelected={selectedExerciseIds.includes(exercise.id)}
                  onSelect={handleSelectExercise}
                  onDeselect={handleDeselectExercise}
                />
              ))}
              {/* Show inline loading for additional results */}
              {isLoading && exercises.length > 0 && (
                <div className="col-span-full flex justify-center py-4">
                  <LoadingState 
                    message="Loading more exercises..." 
                    variant="inline" 
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Selected Tab */}
        <TabsContent value='selected' className='space-y-4'>
          {selectedExercises.length === 0 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <Dumbbell className='mx-auto mb-4 h-12 w-12 text-gray-400' />
                <h3 className='mb-2 text-lg font-medium text-gray-900'>
                  {t('filters.selectedEmpty.title')}
                </h3>
                <p className='text-gray-600'>
                  {t('filters.selectedEmpty.description')}
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
