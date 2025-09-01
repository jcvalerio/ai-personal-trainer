/**
 * AI Workout Generation API
 * Uses Google Gemini to generate personalized workouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
);

const GEMINI_MODEL = 'gemini-2.5-flash';

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

const aiSessionExerciseSchema = z.object({
  name: z.string(),
  description: z.string(),
  instructions: z.string(),
  plannedSets: z.number().min(1).max(10),
  plannedReps: z.number().int().min(1).optional(),
  plannedDurationSeconds: z.number().int().min(1).optional(),
  plannedRestSeconds: z.number().min(15).max(300),
  muscleGroups: z.array(z.string()).min(1),
  equipment: z.array(z.string()).min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  videoUrl: z.string().url(),
});

const aiWorkoutSessionSchema = z.object({
  name: z.string(),
  description: z.string(),
  sessionType: z.enum(['workout', 'assessment', 'recovery']).default('workout'),
  scheduledDate: z.string(),
  scheduledDuration: z.number().min(15).max(300).optional(),
  sessionData: z.object({
    totalExercises: z.number().int().min(0),
    estimatedDuration: z.number().int().min(1),
    targetMuscleGroups: z.array(z.string()),
    equipmentNeeded: z.array(z.string()),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  }),
  warmUpExercises: z.array(aiSessionExerciseSchema).default([]),
  mainExercises: z.array(aiSessionExerciseSchema).min(1),
  coolDownExercises: z.array(aiSessionExerciseSchema).default([]),
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
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
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

    // Validate the generated workout session
    const validatedSession = aiWorkoutSessionSchema.safeParse(workoutData);
    console.log('AI Response Text:', JSON.stringify(validatedSession, null, 2));
    if (!validatedSession.success) {
      console.error(
        'Invalid workout session structure:',
        validatedSession.error.errors
      );
      throw new Error(
        'Generated workout session does not match expected format'
      );
    }

    const session = validatedSession.data;

    // Calculate total exercises and get all muscle groups/equipment
    const allExercises = [
      ...session.warmUpExercises,
      ...session.mainExercises,
      ...session.coolDownExercises,
    ];

    // Add unique IDs to exercises and update session metadata
    const sessionWithIds = {
      ...session,
      warmUpExercises: session.warmUpExercises.map((exercise, index) => ({
        ...exercise,
        exerciseId: randomUUID(), // Generate proper UUID for AI-generated exercises
        orderIndex: index,
      })),
      mainExercises: session.mainExercises.map((exercise, index) => ({
        ...exercise,
        exerciseId: randomUUID(), // Generate proper UUID for AI-generated exercises
        orderIndex: index,
      })),
      coolDownExercises: session.coolDownExercises.map((exercise, index) => ({
        ...exercise,
        exerciseId: randomUUID(), // Generate proper UUID for AI-generated exercises
        orderIndex: index,
      })),
      sessionData: {
        ...session.sessionData,
        totalExercises: allExercises.length,
        estimatedDuration: session.sessionData.estimatedDuration,
        targetMuscleGroups: Array.from(
          new Set(allExercises.flatMap((e) => e.muscleGroups))
        ),
        equipmentNeeded: Array.from(
          new Set(allExercises.flatMap((e) => e.equipment))
        ),
      },
    };

    return NextResponse.json({
      success: true,
      data: sessionWithIds,
      message: 'Workout session generated successfully',
    });
  } catch (error) {
    console.error('Error generating workout:', error);

    // Return detailed error for development, generic for production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage =
      isDevelopment && error instanceof Error
        ? error.message
        : 'Failed to generate workout. Please try again.';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Build a comprehensive prompt for Gemini to generate a workout
 */
function buildWorkoutPrompt(
  preferences: z.infer<typeof workoutPreferencesSchema>
): string {
  // Get current date for context
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const {
    fitnessLevel,
    goals,
    duration,
    equipment,
    limitations,
    preferences: userPrefs,
  } = preferences;

  const equipmentList = equipment.join(', ');
  const goalsList = goals.join(', ');
  const limitationsList =
    limitations.length > 0 ? limitations.join(', ') : 'none';
  const preferencesList = userPrefs.length > 0 ? userPrefs.join(', ') : 'none';

  return `You are a certified personal trainer and fitness expert. Today is ${currentMonth}. Create a personalized workout plan based on the following user preferences:

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

<OUTPUT>
{
  "name": "Descriptive workout session name",
  "description": "Brief session overview focusing on the main goals",
  "sessionType": "workout",
  "scheduledDate": "2024-01-01T10:00:00Z",
  "scheduledDuration": ${duration},
  "sessionData": {
    "totalExercises": 6,
    "estimatedDuration": ${duration},
    "targetMuscleGroups": ["chest", "shoulders", "triceps"],
    "equipmentNeeded": ["dumbbells", "bench"],
    "difficultyLevel": "${fitnessLevel}"
  },
  "warmUpExercises": [
    {
      "name": "Warm-up Exercise",
      "description": "Brief overview of the warm-up exercise",
      "instructions": "Detailed step-by-step instructions for proper form",
      "plannedSets": 1,
      "plannedDurationSeconds": 60,
      "plannedRestSeconds": 30,
      "muscleGroups": ["shoulders"],
      "equipment": ["bodyweight"],
      "difficulty": "beginner",
      "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
    }
  ],
  "mainExercises": [
    {
      "name": "Main Exercise",
      "description": "Brief overview of the main exercise",
      "instructions": "Detailed step-by-step instructions for proper form",
      "plannedSets": 3,
      "plannedReps": 10,
      "plannedRestSeconds": 60,
      "muscleGroups": ["chest", "triceps"],
      "equipment": ["dumbbells"],
      "difficulty": "${fitnessLevel}",
      "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
    }
  ],
  "coolDownExercises": [
    {
      "name": "Cool-down Exercise", 
      "description": "Brief overview of the cool-down exercise",
      "instructions": "Detailed step-by-step instructions for proper form",
      "plannedSets": 1,
      "plannedDurationSeconds": 30,
      "plannedRestSeconds": 15,
      "muscleGroups": ["hamstrings"],
      "equipment": ["bodyweight"],
      "difficulty": "beginner", 
      "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
    }
  ]
}
</OUTPUT>

**CRITICAL VALIDATION REQUIREMENTS:**
- Include 1-2 exercises in warmUpExercises array
- Include 4-6 exercises in mainExercises array (MINIMUM 1 required)
- Include 1-2 exercises in coolDownExercises array
- Each exercise MUST have:
  - plannedSets: integer between 1-10
  - plannedRestSeconds: integer between 15-300 seconds (NEVER less than 15)
  - muscleGroups: array with at least 1 muscle group
  - equipment: array with at least 1 equipment item
  - Either "plannedReps" (integer) OR "plannedDurationSeconds" (integer), not both
  - videoUrl: YouTube URL demonstrating proper exercise form and equipment usage
  - instructions: detailed step-by-step form guidance
  - difficulty: EXACTLY "beginner", "intermediate", or "advanced" (NEVER use "easy", "hard", etc.)
- sessionType: EXACTLY "workout", "assessment", or "recovery"
- scheduledDate: Valid ISO datetime string
- sessionData MUST accurately reflect all exercises included
- ENUM VALUES: Use ONLY the exact strings specified - no synonyms or variations

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

**YouTube Video Requirements:**
- CRITICAL: Use only these verified working YouTube URLs for exercises. DO NOT create fake video IDs.
- Bench Press: "https://www.youtube.com/watch?v=4Y2ZdHCOXok" (AthleanX - Perfect Bench Press Form)
- Pull-ups: "https://www.youtube.com/watch?v=eGo4IYlbE5g" (AthleanX - How to Do Pull Ups)
- Push-ups: "https://www.youtube.com/watch?v=IODxDxX7oi4" (Calisthenic Movement - Perfect Push Up)
- Squats: "https://www.youtube.com/watch?v=aclHkVaku9U" (AthleanX - How to Squat Properly)
- Deadlifts: "https://www.youtube.com/watch?v=r4MzxtBKyNE" (AthleanX - How to Deadlift)
- Shoulder Press: "https://www.youtube.com/watch?v=qEwKCR5JCog" (AthleanX - Overhead Press)
- Bicep Curls: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo" (AthleanX - Perfect Bicep Curls)
- Dumbbell Rows: "https://www.youtube.com/watch?v=pYcpY20QaE8" (AthleanX - Dumbbell Row)
- Lunges: "https://www.youtube.com/watch?v=QE_hU5kWNIc" (AthleanX - Perfect Lunge)
- Dips: "https://www.youtube.com/watch?v=2z8JmcrW-As" (Calisthenic Movement - Perfect Dip)
- Plank: "https://www.youtube.com/watch?v=ASdvN_XEl_c" (Calisthenic Movement - Perfect Plank)
- Mountain Climbers: "https://www.youtube.com/watch?v=nmwgirgXLYM" (FitnessBlender - Mountain Climbers)
- Burpees: "https://www.youtube.com/watch?v=auBLPXO8Fww" (FitnessBlender - How to Do Burpees)
- For any other exercises, use: "https://www.youtube.com/watch?v=4Y2ZdHCOXok" as fallback
- NEVER generate random video IDs - only use the URLs listed above

**VALIDATION CHECKLIST - VERIFY BEFORE OUTPUT:**
✓ Session structure: name, description, sessionType, scheduledDate, scheduledDuration
✓ Exercise arrays: warmUpExercises, mainExercises (required), coolDownExercises
✓ Exercise counts: 1-2 warm-up, 4-6 main (min 1), 1-2 cool-down
✓ Session type: EXACTLY "workout", "assessment", or "recovery"
✓ Scheduled date: Valid ISO datetime format (2024-01-01T10:00:00Z)
✓ Difficulty levels: EXACTLY "beginner", "intermediate", "advanced" (NEVER "easy", "hard", etc.)
✓ Rest times: ALL plannedRestSeconds must be ≥15 (15-300 range)
✓ Sets: plannedSets 1-10 for each exercise
✓ Muscle groups: At least 1 per exercise
✓ Equipment: At least 1 per exercise from available equipment
✓ Video URLs: ONLY use the verified YouTube URLs provided above - NO fake video IDs
✓ Instructions: Detailed form guidance for each exercise
✓ Either plannedReps OR plannedDurationSeconds for each exercise, never both
✓ sessionData: accurate totals and arrays reflecting all exercises
✓ ENUM VALIDATION: All enum values match exactly - no synonyms allowed
✓ CRITICAL: Every exercise must use one of the verified YouTube URLs listed above

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
        'general_fitness',
      ],
      availableEquipment: [
        'bodyweight',
        'dumbbells',
        'barbell',
        'resistance_bands',
        'full_gym',
        'home_gym',
      ],
      durationRange: { min: 15, max: 180 },
      daysPerWeekRange: { min: 1, max: 7 },
    },
  });
}
