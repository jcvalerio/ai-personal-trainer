'use client';

/**
 * Exercise Library Page
 * Browse and search exercises with Phase 3 API integration
 */

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { useState, useMemo } from 'react';
import {
  Dumbbell,
  Search,
  Grid,
  List,
  Star,
  TrendingUp,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ExerciseCard } from '@/components/workouts/exercise-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import type { Exercise } from '@/types/workouts';

// React Query hooks for Phase 3 API
import {
  useExerciseLibrary,
  useExerciseSearch,
  useExerciseCategories,
  useMuscleGroups,
  useEquipment,
} from '@/hooks/queries/use-exercise-library-query';

const exerciseTypes = ['strength', 'cardio', 'flexibility', 'sports'];
const difficultyLevels = ['beginner', 'intermediate', 'advanced'];

export default function ExercisesPage() {
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all-types');
  const [selectedLevel, setSelectedLevel] = useState<string>('all-levels');
  const [activeTab, setActiveTab] = useState('all');

  // React Query hooks for fetching data
  const exerciseLibraryQuery = useExerciseLibrary({
    page: 1,
    limit: 50,
    exerciseType: selectedType !== 'all-types' ? selectedType as any : undefined,
    difficultyLevel: selectedLevel !== 'all-levels' ? selectedLevel as any : undefined,
    isPublic: true,
    isVerified: true,
  });

  const searchQuery = useExerciseSearch(
    searchTerm,
    {
      type: selectedType !== 'all-types' ? selectedType as any : undefined,
      difficulty: selectedLevel !== 'all-levels' ? selectedLevel as any : undefined,
      verified: true,
      public: true,
      limit: 50,
    }
  );

  const muscleGroupsQuery = useMuscleGroups();
  const categoriesQuery = useExerciseCategories();

  // Determine which data to use
  const shouldUseSearch = searchTerm.length >= 2;
  const activeQuery = shouldUseSearch ? searchQuery : exerciseLibraryQuery;
  const exercises = activeQuery.data?.exercises || [];
  const isLoading = activeQuery.isLoading;
  const error = activeQuery.error;

  // Computed values for tabs
  const favoriteExercises = useMemo(() => {
    // TODO: Implement favorites functionality with user preferences
    return exercises.slice(0, 3);
  }, [exercises]);

  const popularExercises = useMemo(() => {
    // TODO: Implement popularity metrics from backend
    return exercises.slice(1, 4);
  }, [exercises]);

  const featuredExercises = useMemo(() => {
    // TODO: Implement featured exercises from backend
    return exercises.slice(0, 2);
  }, [exercises]);

  const muscleGroups = muscleGroupsQuery.data || [
    'chest',
    'back',
    'shoulders',
    'arms',
    'legs',
    'core',
    'full_body',
  ];

  // Event handlers
  const handleAddToWorkout = (exercise: Exercise) => {
    console.log('Adding exercise to workout:', exercise.name);
    // TODO: Implement add to workout functionality
  };

  const handleViewDemo = (exercise: Exercise) => {
    console.log('Viewing demo for:', exercise.name);
    // TODO: Implement demo video functionality
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
  };

  // Loading state
  if (isLoading && exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingState 
          message="Loading exercise library..." 
          variant="page" 
        />
      </div>
    );
  }

  // Error state
  if (error && exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorState 
          message="Failed to load exercises" 
          description={error instanceof Error ? error.message : 'Unknown error occurred'}
          onRetry={() => activeQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='sticky top-0 z-40 border-b border-gray-200 bg-white'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Link href='/workouts' className='flex items-center gap-3'>
                <div className='rounded-xl bg-blue-100 p-2'>
                  <Dumbbell className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <h1 className='text-xl font-bold text-gray-900'>
                    AI Personal Trainer
                  </h1>
                  <p className='text-xs text-gray-500'>Exercise Library</p>
                </div>
              </Link>
            </div>

            <div className='flex items-center gap-4'>
              <nav className='hidden items-center gap-6 md:flex'>
                <Link
                  href='/workouts'
                  className='font-medium text-gray-600 hover:text-gray-900'
                >
                  Workouts
                </Link>
                <Link
                  href='/exercises'
                  className='-mb-4 border-b-2 border-blue-600 pb-4 font-medium text-blue-600'
                >
                  Exercises
                </Link>
                <Link
                  href='/progress'
                  className='font-medium text-gray-600 hover:text-gray-900'
                >
                  Progress
                </Link>
              </nav>

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

      {/* Main Content */}
      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Page Header */}
        <div className='mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='mb-2 text-3xl font-bold text-gray-900'>
              Exercise Library
            </h2>
            <p className='text-gray-600'>
              Discover exercises and build your perfect workout
            </p>
          </div>
          <div className='mt-4 flex gap-3 sm:mt-0'>
            <Button variant='outline' size='sm'>
              <Star className='mr-2 h-4 w-4' />
              Favorites
            </Button>
            <Button variant='outline' size='sm'>
              <TrendingUp className='mr-2 h-4 w-4' />
              Popular
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className='mb-8 grid grid-cols-1 gap-4 lg:grid-cols-4'>
          <div className='relative lg:col-span-2'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
            <Input
              placeholder='Search exercises by name, muscle group, or equipment...'
              className='pl-10'
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all-types'>All Exercise Types</SelectItem>
              {exerciseTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLevel} onValueChange={handleLevelChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all-levels'>All Difficulty Levels</SelectItem>
              {difficultyLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        <div className='mb-8 grid grid-cols-2 gap-4 md:grid-cols-4'>
          <Card>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {isLoading ? '-' : exercises.length}
              </div>
              <div className='text-sm text-gray-600'>Total Exercises</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {isLoading 
                  ? '-' 
                  : exercises.filter((e: Exercise) => e.difficultyLevel === 'beginner').length
                }
              </div>
              <div className='text-sm text-gray-600'>Beginner Friendly</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {isLoading 
                  ? '-' 
                  : exercises.filter((e: Exercise) => e.exerciseType === 'strength').length
                }
              </div>
              <div className='text-sm text-gray-600'>Strength</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-orange-600'>
                {isLoading 
                  ? '-' 
                  : exercises.filter((e: Exercise) => e.exerciseType === 'cardio').length
                }
              </div>
              <div className='text-sm text-gray-600'>Cardio</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Exercise Browser */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='all'>All Exercises</TabsTrigger>
            <TabsTrigger value='favorites'>Favorites</TabsTrigger>
            <TabsTrigger value='popular'>Popular</TabsTrigger>
            <TabsTrigger value='featured'>Featured</TabsTrigger>
          </TabsList>

          {/* All Exercises Tab */}
          <TabsContent value='all' className='mt-6'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Badge variant='outline'>
                  {isLoading ? 'Loading...' : `${exercises.length} exercises`}
                </Badge>
                {shouldUseSearch && (
                  <Badge variant='outline'>
                    Search: "{searchTerm}"
                  </Badge>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm'>
                  <Grid className='mr-2 h-4 w-4' />
                  Grid
                </Button>
                <Button variant='ghost' size='sm'>
                  <List className='mr-2 h-4 w-4' />
                  List
                </Button>
              </div>
            </div>

            {isLoading ? (
              <LoadingState message="Loading exercises..." variant="grid" />
            ) : exercises.length === 0 ? (
              <div className='py-12 text-center'>
                <Target className='mx-auto mb-4 h-16 w-16 text-gray-400' />
                <h3 className='mb-2 text-lg font-medium text-gray-900'>
                  {shouldUseSearch ? 'No exercises found' : 'No exercises available'}
                </h3>
                <p className='mb-6 text-gray-600'>
                  {shouldUseSearch 
                    ? `Try adjusting your search "${searchTerm}" or filters.`
                    : 'Try adjusting your filters or check back later.'
                  }
                </p>
                {shouldUseSearch && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {exercises.map((exercise: Exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    showAddButton
                    showInstructions
                    onAdd={handleAddToWorkout}
                    onViewDemo={handleViewDemo}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value='favorites' className='mt-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {favoriteExercises.map((exercise: Exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  showAddButton
                  showInstructions
                  onAdd={handleAddToWorkout}
                  onViewDemo={handleViewDemo}
                />
              ))}
            </div>
            {favoriteExercises.length === 0 && (
              <div className='py-12 text-center'>
                <Star className='mx-auto mb-4 h-16 w-16 text-gray-400' />
                <h3 className='mb-2 text-lg font-medium text-gray-900'>
                  No favorite exercises yet
                </h3>
                <p className='mb-6 text-gray-600'>
                  Start adding exercises to your favorites to see them here.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Popular Tab */}
          <TabsContent value='popular' className='mt-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {popularExercises.map((exercise: Exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  showAddButton
                  showInstructions
                  onAdd={handleAddToWorkout}
                  onViewDemo={handleViewDemo}
                />
              ))}
            </div>
          </TabsContent>

          {/* Featured Tab */}
          <TabsContent value='featured' className='mt-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {featuredExercises.map((exercise: Exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  showAddButton
                  showInstructions
                  onAdd={handleAddToWorkout}
                  onViewDemo={handleViewDemo}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Muscle Group Quick Filter */}
        <div className='mt-12'>
          <h3 className='mb-4 text-xl font-semibold text-gray-900'>
            Browse by Muscle Group
          </h3>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7'>
            {muscleGroups.map((muscle: string) => {
              const count = exercises.filter(
                (ex: Exercise) =>
                  ex.primaryMuscleGroups.some((mg: string) =>
                    mg.toLowerCase().includes(muscle.toLowerCase())
                  ) ||
                  ex.secondaryMuscleGroups?.some((mg: string) =>
                    mg.toLowerCase().includes(muscle.toLowerCase())
                  )
              ).length;

              return (
                <Button
                  key={muscle}
                  variant='outline'
                  className='flex h-auto flex-col p-4 text-center'
                >
                  <Target className='mb-1 h-5 w-5' />
                  <span className='text-sm font-medium capitalize'>
                    {muscle.replace('_', ' ')}
                  </span>
                  <span className='text-xs text-gray-500'>
                    {count} exercises
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
