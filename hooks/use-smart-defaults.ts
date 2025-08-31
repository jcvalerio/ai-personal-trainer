/**
 * Smart Defaults Hook
 * Provides intelligent default values for weight and reps based on user history and exercise type
 */
'use client';

import { useCallback, useMemo } from 'react';
import type { ExerciseType, SetPerformanceData } from '@/types/workouts';

interface SmartDefaults {
  weight: number;
  reps: number;
  duration?: number;
  restPeriod: number;
}

interface UseSmartDefaultsOptions {
  exerciseType?: ExerciseType;
  muscleGroup?: string;
  userHistory?: SetPerformanceData[];
  bodyWeight?: number;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface UseSmartDefaultsReturn {
  getDefaults: (options?: Partial<UseSmartDefaultsOptions>) => SmartDefaults;
  getSmartWeight: (exerciseName: string, previousSets?: SetPerformanceData[]) => number;
  getSmartReps: (exerciseName: string, exerciseType?: ExerciseType) => number;
  getSmartRestPeriod: (exerciseType?: ExerciseType, intensity?: number) => number;
  adjustForExperience: (baseValue: number, experienceLevel?: string) => number;
}

const DEFAULT_VALUES: Record<ExerciseType, SmartDefaults> = {
  strength: { weight: 20, reps: 10, restPeriod: 90 },
  cardio: { weight: 0, reps: 1, duration: 300, restPeriod: 60 },
  flexibility: { weight: 0, reps: 1, duration: 30, restPeriod: 30 },
  balance: { weight: 0, reps: 10, duration: 60, restPeriod: 45 },
  plyometric: { weight: 0, reps: 8, restPeriod: 120 },
  isometric: { weight: 0, reps: 1, duration: 30, restPeriod: 60 },
  mobility: { weight: 0, reps: 10, duration: 45, restPeriod: 30 },
  rehabilitation: { weight: 5, reps: 15, restPeriod: 45 },
};

// Exercise-specific weight recommendations (in lbs)
const EXERCISE_WEIGHT_DEFAULTS: Record<string, number> = {
  // Upper body
  'bench press': 95,
  'push-ups': 0,
  'pull-ups': 0,
  'shoulder press': 45,
  'bicep curls': 20,
  'tricep dips': 0,
  
  // Lower body
  'squats': 75,
  'deadlifts': 95,
  'lunges': 40,
  'leg press': 135,
  'calf raises': 50,
  
  // Core
  'planks': 0,
  'crunches': 0,
  'russian twists': 15,
  
  // Default fallback
  'default': 20,
};

// Exercise-specific rep recommendations
const EXERCISE_REP_DEFAULTS: Record<string, number> = {
  // Strength exercises (lower reps)
  'bench press': 8,
  'deadlifts': 6,
  'squats': 10,
  'shoulder press': 8,
  
  // Bodyweight exercises (higher reps)
  'push-ups': 15,
  'pull-ups': 8,
  'lunges': 12,
  'planks': 1, // Duration-based
  
  // Isolation exercises (moderate reps)
  'bicep curls': 12,
  'tricep extensions': 12,
  'calf raises': 15,
  
  // Default fallback
  'default': 10,
};

export function useSmartDefaults(baseOptions: UseSmartDefaultsOptions = {}): UseSmartDefaultsReturn {
  const getDefaults = useCallback((options: Partial<UseSmartDefaultsOptions> = {}) => {
    const opts = { ...baseOptions, ...options };
    const exerciseType = opts.exerciseType || 'strength';
    const experienceLevel = opts.experienceLevel || 'intermediate';
    
    let defaults = { ...DEFAULT_VALUES[exerciseType] };
    
    // Adjust based on experience level
    if (exerciseType === 'strength') {
      switch (experienceLevel) {
        case 'beginner':
          defaults.weight = Math.max(10, defaults.weight * 0.7);
          defaults.reps = Math.max(8, defaults.reps - 2);
          break;
        case 'advanced':
          defaults.weight = defaults.weight * 1.3;
          defaults.reps = defaults.reps + 2;
          break;
        default:
          // intermediate - use defaults as-is
          break;
      }
    }
    
    // Round weight to nearest 5 lbs
    defaults.weight = Math.round(defaults.weight / 5) * 5;
    
    return defaults;
  }, [baseOptions]);

  const getSmartWeight = useCallback((exerciseName: string, previousSets?: SetPerformanceData[]) => {
    const normalizedName = exerciseName.toLowerCase();
    
    // If we have previous set data, use the last weight with progressive overload
    if (previousSets && previousSets.length > 0) {
      const lastSet = previousSets[previousSets.length - 1];
      if (lastSet.weight && !isNaN(lastSet.weight)) {
        // Progressive overload: add 2.5-5 lbs for upper body, 5-10 lbs for lower body
        const isLowerBody = normalizedName.includes('squat') || 
                           normalizedName.includes('deadlift') || 
                           normalizedName.includes('leg');
        const increment = isLowerBody ? 5 : 2.5;
        return Math.round((lastSet.weight + increment) / 2.5) * 2.5;
      }
    }
    
    // Find exercise-specific default
    for (const [exercise, weight] of Object.entries(EXERCISE_WEIGHT_DEFAULTS)) {
      if (normalizedName.includes(exercise)) {
        return weight;
      }
    }
    
    return EXERCISE_WEIGHT_DEFAULTS.default;
  }, []);

  const getSmartReps = useCallback((exerciseName: string, exerciseType?: ExerciseType) => {
    const normalizedName = exerciseName.toLowerCase();
    
    // Find exercise-specific default
    for (const [exercise, reps] of Object.entries(EXERCISE_REP_DEFAULTS)) {
      if (normalizedName.includes(exercise)) {
        return reps;
      }
    }
    
    // Fallback to exercise type defaults
    if (exerciseType && DEFAULT_VALUES[exerciseType]) {
      return DEFAULT_VALUES[exerciseType].reps;
    }
    
    return EXERCISE_REP_DEFAULTS.default;
  }, []);

  const getSmartRestPeriod = useCallback((exerciseType: ExerciseType = 'strength', intensity = 0.7) => {
    const baseRest = DEFAULT_VALUES[exerciseType].restPeriod;
    
    // Adjust rest based on intensity (0.0 = very light, 1.0 = maximal)
    const intensityMultiplier = 0.7 + (intensity * 0.6); // 0.7x to 1.3x multiplier
    const adjustedRest = Math.round(baseRest * intensityMultiplier);
    
    // Ensure rest periods are within reasonable bounds (30-300 seconds)
    return Math.max(30, Math.min(300, adjustedRest));
  }, []);

  const adjustForExperience = useCallback((baseValue: number, experienceLevel = 'intermediate') => {
    switch (experienceLevel) {
      case 'beginner':
        return Math.round(baseValue * 0.75);
      case 'advanced':
        return Math.round(baseValue * 1.25);
      default:
        return baseValue;
    }
  }, []);

  return useMemo(() => ({
    getDefaults,
    getSmartWeight,
    getSmartReps,
    getSmartRestPeriod,
    adjustForExperience,
  }), [getDefaults, getSmartWeight, getSmartReps, getSmartRestPeriod, adjustForExperience]);
}