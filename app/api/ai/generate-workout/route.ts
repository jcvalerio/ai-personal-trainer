/**
 * AI Workout Generation API
 * Uses Google Gemini to generate personalized workouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

// Validation schemas
const workoutPreferencesSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.array(z.string()).min(1),
  duration: z.number().min(15).max(180),
  daysPerWeek: z.number().min(1).max(7),
  equipment: z.array(z.string()).min(1),
  limitations: z.array(z.string()).optional().default([]),
  preferences: z.array(z.string()).optional().default([]),
});

const exerciseSchema = z.object({
  name: z.string(),
  description: z.string(),
  sets: z.number().min(1).max(10),
  reps: z.string().optional(),
  duration: z.string().optional(),
  restTime: z.number().min(15).max(300),
  muscleGroups: z.array(z.string()).min(1),
  equipment: z.array(z.string()),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

const workoutSchema = z.object({
  name: z.string(),
  description: z.string(),
  duration: z.number(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  exercises: z.array(exerciseSchema).min(3).max(12),
});

/**
 * POST /api/ai/generate-workout
 * Generate a personalized workout using AI
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Gemini API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedPreferences = workoutPreferencesSchema.safeParse(body);
    if (!validatedPreferences.success) {
      return NextResponse.json(
        {
          error: 'Invalid workout preferences',
          details: validatedPreferences.error.errors,
        },
        { status: 400 }
      );
    }

    const preferences = validatedPreferences.data;

    // Create the prompt for Gemini
    const prompt = buildWorkoutPrompt(preferences);

    // Generate workout using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    
    if (!result.response) {
      throw new Error('No response from AI model');
    }

    const response = await result.response;
    const text = response.text();

    // Parse the AI response
    let workoutData;
    try {
      // Extract JSON from the response (in case AI includes additional text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      workoutData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Invalid response format from AI');
    }

    // Validate the generated workout
    const validatedWorkout = workoutSchema.safeParse(workoutData);
    if (!validatedWorkout.success) {
      console.error('Invalid workout structure:', validatedWorkout.error.errors);
      throw new Error('Generated workout does not match expected format');
    }

    const workout = validatedWorkout.data;

    // Add unique IDs to exercises
    const workoutWithIds = {
      ...workout,
      exercises: workout.exercises.map((exercise, index) => ({
        ...exercise,
        id: `ex-${Date.now()}-${index}`,
      })),
    };

    return NextResponse.json({
      success: true,
      data: workoutWithIds,
      message: 'Workout generated successfully',
    });

  } catch (error) {
    console.error('Error generating workout:', error);
    
    // Return detailed error for development, generic for production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment && error instanceof Error 
      ? error.message 
      : 'Failed to generate workout. Please try again.';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Build a comprehensive prompt for Gemini to generate a workout
 */
function buildWorkoutPrompt(preferences: z.infer<typeof workoutPreferencesSchema>): string {
  const {
    fitnessLevel,
    goals,
    duration,
    equipment,
    limitations,
    preferences: userPrefs
  } = preferences;

  const equipmentList = equipment.join(', ');
  const goalsList = goals.join(', ');
  const limitationsList = limitations.length > 0 ? limitations.join(', ') : 'none';
  const preferencesList = userPrefs.length > 0 ? userPrefs.join(', ') : 'none';

  return `You are a certified personal trainer and fitness expert. Create a personalized workout plan based on the following user preferences:

**User Profile:**
- Fitness Level: ${fitnessLevel}
- Primary Goals: ${goalsList}
- Workout Duration: ${duration} minutes
- Available Equipment: ${equipmentList}
- Physical Limitations: ${limitationsList}
- Additional Preferences: ${preferencesList}

**Requirements:**
1. Create a workout that matches the ${duration}-minute duration
2. Use only the available equipment: ${equipmentList}
3. Match the ${fitnessLevel} fitness level
4. Focus on the goals: ${goalsList}
5. Account for any limitations: ${limitationsList}
6. Include 4-8 exercises with proper progression
7. Provide appropriate sets, reps, and rest periods
8. Include muscle groups targeted by each exercise

**Output Format:**
Return ONLY a valid JSON object with this exact structure (no additional text, markdown, or explanations):

{
  "name": "Descriptive workout name",
  "description": "Brief workout overview focusing on the main goals",
  "duration": ${duration},
  "difficulty": "${fitnessLevel}",
  "exercises": [
    {
      "name": "Exercise name",
      "description": "Clear, helpful description of how to perform the exercise",
      "sets": 3,
      "reps": "8-12" OR "duration": "30-45 seconds" (use reps for strength, duration for time-based),
      "restTime": 60,
      "muscleGroups": ["primary", "secondary"],
      "equipment": ["required", "equipment"],
      "difficulty": "${fitnessLevel}"
    }
  ]
}

**Exercise Selection Guidelines:**
- Beginner: Focus on bodyweight, basic movements, form-based exercises
- Intermediate: Include compound movements, moderate intensity
- Advanced: Complex movements, higher intensity, advanced variations

**Rep/Set Guidelines:**
- Strength goals: 3-5 sets, 6-8 reps, 90-120 seconds rest
- Muscle gain: 3-4 sets, 8-12 reps, 60-90 seconds rest  
- Endurance: 2-3 sets, 12-20 reps, 30-60 seconds rest
- Weight loss: 3-4 sets, 10-15 reps, 45-60 seconds rest

**Equipment Mapping:**
- bodyweight: push-ups, squats, lunges, planks, burpees
- dumbbells: dumbbell press, rows, curls, lunges, deadlifts
- barbell: squats, deadlifts, rows, presses, curls
- resistance_bands: band pulls, presses, extensions, curls
- full_gym: all equipment available including machines, cables
- home_gym: mix of basic equipment suitable for home use

Generate the workout now:`;
}

/**
 * GET /api/ai/generate-workout
 * Get available workout generation parameters
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      fitnessLevels: ['beginner', 'intermediate', 'advanced'],
      availableGoals: [
        'weight_loss',
        'muscle_gain', 
        'strength',
        'endurance',
        'flexibility',
        'general_fitness'
      ],
      availableEquipment: [
        'bodyweight',
        'dumbbells',
        'barbell', 
        'resistance_bands',
        'full_gym',
        'home_gym'
      ],
      durationRange: { min: 15, max: 180 },
      daysPerWeekRange: { min: 1, max: 7 }
    }
  });
}