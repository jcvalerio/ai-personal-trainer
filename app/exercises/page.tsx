'use client'

/**
 * Exercise Library Page
 * Browse and search exercises
 */

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { 
  Dumbbell, 
  Search, 
  Filter, 
  Grid, 
  List,
  Play,
  Star,
  TrendingUp,
  Target,
  Clock,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExerciseCard } from '@/components/workouts/exercise-card'
import type { Exercise } from '@/types/workouts'

// Mock exercise data
const mockExercises: Exercise[] = [
  {
    id: '1',
    name: 'Barbell Bench Press',
    slug: 'barbell-bench-press',
    description: 'A compound upper body exercise that primarily targets the chest muscles while engaging shoulders and triceps.',
    instructions: 'Lie on a bench with feet flat on the floor. Grip the barbell with hands slightly wider than shoulder-width. Lower the bar to your chest with control, then press back up to starting position.',
    exerciseType: 'strength',
    primaryMuscleGroups: ['chest', 'pectorals'],
    secondaryMuscleGroups: ['shoulders', 'triceps'],
    difficultyLevel: 'intermediate',
    equipmentRequired: ['barbell', 'bench'],
    equipmentOptional: ['safety_bars'],
    equipmentAlternatives: { 'barbell': ['dumbbells', 'cables'] },
    defaultSets: 4,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 180,
    demoVideoUrl: 'https://example.com/video',
    instructionImages: [],
    contraindications: ['shoulder_injury', 'wrist_injury'],
    modifications: {},
    safetyTips: ['Always use a spotter', 'Keep feet planted', 'Control the descent'],
    isVerified: true,
    isPublic: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Squat',
    slug: 'squat',
    description: 'A fundamental compound exercise targeting the lower body, particularly quadriceps, hamstrings, and glutes.',
    instructions: 'Stand with feet shoulder-width apart. Lower your body by bending at the knees and hips as if sitting back into a chair. Keep your chest up and knees tracking over toes. Return to standing.',
    exerciseType: 'strength',
    primaryMuscleGroups: ['quadriceps', 'glutes'],
    secondaryMuscleGroups: ['hamstrings', 'calves', 'core'],
    difficultyLevel: 'beginner',
    equipmentRequired: [],
    equipmentOptional: ['barbell', 'dumbbells'],
    equipmentAlternatives: {},
    defaultSets: 3,
    defaultRepsMin: 12,
    defaultRepsMax: 15,
    defaultRestSeconds: 120,
    demoVideoUrl: 'https://example.com/video',
    instructionImages: [],
    contraindications: ['knee_injury', 'back_injury'],
    modifications: {},
    safetyTips: ['Keep knees aligned with toes', 'Maintain neutral spine'],
    isVerified: true,
    isPublic: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Deadlift',
    slug: 'deadlift',
    description: 'A powerful compound exercise that works the entire posterior chain, building overall strength and muscle mass.',
    instructions: 'Stand with feet hip-width apart, barbell over mid-foot. Hinge at hips and bend knees to grip the bar. Keep chest up, core tight. Drive through heels to stand, pulling the bar up your legs.',
    exerciseType: 'strength',
    primaryMuscleGroups: ['hamstrings', 'glutes', 'lower_back'],
    secondaryMuscleGroups: ['quadriceps', 'traps', 'forearms'],
    difficultyLevel: 'advanced',
    equipmentRequired: ['barbell', 'plates'],
    equipmentOptional: ['lifting_belt', 'chalk'],
    equipmentAlternatives: { 'barbell': ['dumbbells', 'trap_bar'] },
    defaultSets: 4,
    defaultRepsMin: 5,
    defaultRepsMax: 8,
    defaultRestSeconds: 240,
    demoVideoUrl: 'https://example.com/video',
    instructionImages: [],
    contraindications: ['lower_back_injury', 'hernia'],
    modifications: {},
    safetyTips: ['Master form with light weight first', 'Keep bar close to body', 'Neutral spine throughout'],
    isVerified: true,
    isPublic: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Running',
    slug: 'running',
    description: 'A cardiovascular exercise that improves heart health, endurance, and burns calories effectively.',
    instructions: 'Maintain an upright posture with a slight forward lean. Land on the balls of your feet with a midfoot strike. Keep arms relaxed at your sides with a natural swing.',
    exerciseType: 'cardio',
    primaryMuscleGroups: ['quadriceps', 'hamstrings', 'calves'],
    secondaryMuscleGroups: ['glutes', 'core'],
    difficultyLevel: 'beginner',
    equipmentRequired: [],
    equipmentOptional: ['running_shoes', 'fitness_tracker'],
    equipmentAlternatives: {},
    defaultDurationSeconds: 1800, // 30 minutes
    defaultRestSeconds: 0,
    instructionImages: [],
    contraindications: ['severe_joint_problems', 'heart_conditions'],
    modifications: {},
    safetyTips: ['Start slowly and build up distance', 'Stay hydrated', 'Listen to your body'],
    isVerified: true,
    isPublic: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Yoga Flow',
    slug: 'yoga-flow',
    description: 'A flowing sequence of yoga poses that improves flexibility, balance, and mindfulness.',
    instructions: 'Move smoothly between poses, focusing on breath coordination. Hold each pose for 30-60 seconds while maintaining proper alignment and deep breathing.',
    exerciseType: 'flexibility',
    primaryMuscleGroups: ['full_body'],
    secondaryMuscleGroups: [],
    difficultyLevel: 'beginner',
    equipmentRequired: [],
    equipmentOptional: ['yoga_mat', 'blocks'],
    equipmentAlternatives: {},
    defaultDurationSeconds: 3600, // 60 minutes
    defaultRestSeconds: 0,
    instructionImages: [],
    contraindications: ['acute_injuries'],
    modifications: {},
    safetyTips: ['Never force a pose', 'Focus on breath', 'Listen to your body'],
    isVerified: true,
    isPublic: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    name: 'Pull-ups',
    slug: 'pull-ups',
    description: 'An upper body strength exercise that targets the back muscles and biceps using body weight.',
    instructions: 'Hang from a pull-up bar with palms facing away, hands slightly wider than shoulders. Pull your body up until chin clears the bar, then lower with control.',
    exerciseType: 'strength',
    primaryMuscleGroups: ['lats', 'rhomboids'],
    secondaryMuscleGroups: ['biceps', 'rear_delts'],
    difficultyLevel: 'intermediate',
    equipmentRequired: ['pull_up_bar'],
    equipmentOptional: ['resistance_bands'],
    equipmentAlternatives: { 'pull_up_bar': ['lat_pulldown_machine'] },
    defaultSets: 3,
    defaultRepsMin: 5,
    defaultRepsMax: 12,
    defaultRestSeconds: 150,
    demoVideoUrl: 'https://example.com/video',
    instructionImages: [],
    contraindications: ['shoulder_impingement', 'elbow_injury'],
    modifications: {},
    safetyTips: ['Start with assisted variations', 'Full range of motion', 'Controlled movement'],
    isVerified: true,
    isPublic: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const muscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full_body']
const exerciseTypes = ['strength', 'cardio', 'flexibility', 'sports']
const difficultyLevels = ['beginner', 'intermediate', 'advanced']

export default function ExercisesPage() {
  const handleAddToWorkout = (exercise: Exercise) => {
    console.log('Adding exercise to workout:', exercise.name)
  }

  const handleViewDemo = (exercise: Exercise) => {
    console.log('Viewing demo for:', exercise.name)
  }

  const favoriteExercises = mockExercises.slice(0, 3)
  const popularExercises = mockExercises.slice(1, 4)
  const featuredExercises = mockExercises.slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/workouts" className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI Personal Trainer</h1>
                  <p className="text-xs text-gray-500">Exercise Library</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/workouts" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Workouts
                </Link>
                <Link 
                  href="/exercises" 
                  className="text-blue-600 font-medium border-b-2 border-blue-600 pb-4 -mb-4"
                >
                  Exercises
                </Link>
                <Link 
                  href="/progress" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Progress
                </Link>
              </nav>
              
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Exercise Library</h2>
            <p className="text-gray-600">Discover exercises and build your perfect workout</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Star className="w-4 h-4 mr-2" />
              Favorites
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search exercises by name, muscle group, or equipment..." 
              className="pl-10"
            />
          </div>
          <Select defaultValue="all-types">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-types">All Exercise Types</SelectItem>
              {exerciseTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="all-levels">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-levels">All Difficulty Levels</SelectItem>
              {difficultyLevels.map(level => (
                <SelectItem key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{mockExercises.length}</div>
              <div className="text-sm text-gray-600">Total Exercises</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{mockExercises.filter(e => e.difficultyLevel === 'beginner').length}</div>
              <div className="text-sm text-gray-600">Beginner Friendly</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{mockExercises.filter(e => e.exerciseType === 'strength').length}</div>
              <div className="text-sm text-gray-600">Strength</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{mockExercises.filter(e => e.exerciseType === 'cardio').length}</div>
              <div className="text-sm text-gray-600">Cardio</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Exercise Browser */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Exercises</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>

          {/* All Exercises Tab */}
          <TabsContent value="all" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{mockExercises.length} exercises</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Grid className="w-4 h-4 mr-2" />
                  Grid
                </Button>
                <Button variant="ghost" size="sm">
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockExercises.map(exercise => (
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

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteExercises.map(exercise => (
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
              <div className="text-center py-12">
                <Star className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No favorite exercises yet</h3>
                <p className="text-gray-600 mb-6">
                  Start adding exercises to your favorites to see them here.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Popular Tab */}
          <TabsContent value="popular" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularExercises.map(exercise => (
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
          <TabsContent value="featured" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredExercises.map(exercise => (
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
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Browse by Muscle Group</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {muscleGroups.map(muscle => {
              const count = mockExercises.filter(ex => 
                ex.primaryMuscleGroups.some(mg => mg.toLowerCase().includes(muscle.toLowerCase())) ||
                ex.secondaryMuscleGroups?.some(mg => mg.toLowerCase().includes(muscle.toLowerCase()))
              ).length
              
              return (
                <Button 
                  key={muscle} 
                  variant="outline" 
                  className="flex flex-col h-auto p-4 text-center"
                >
                  <Target className="w-5 h-5 mb-1" />
                  <span className="text-sm font-medium capitalize">
                    {muscle.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">{count} exercises</span>
                </Button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}