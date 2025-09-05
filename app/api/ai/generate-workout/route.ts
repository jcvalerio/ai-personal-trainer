/**
 * AI Workout Generation API
 * Uses Google Gemini to generate personalized workouts
 */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { generateWithHighestQuality, isAIServiceConfigured } from '@/lib/services/ai-model-service';

// Helper functions for personalized guidance
function getAgeSpecificGuidance(age?: number): string {
  if (!age) return 'No specific age considerations';
  
  if (age < 18) return 'Focus on bodyweight exercises, proper form, avoid heavy weights';
  if (age < 30) return 'Can handle high intensity, focus on strength and skill development';
  if (age < 40) return 'Balance strength with mobility, include injury prevention';
  if (age < 50) return 'Emphasize functional movement, joint health, gradual progression';
  if (age < 60) return 'Prioritize muscle preservation, balance, low-impact options';
  return 'Focus on functional fitness, fall prevention, gentle progressive overload';
}

function getGenderSpecificGuidance(gender?: string): string {
  switch (gender) {
    case 'female':
      return 'Consider hormonal fluctuations, bone density focus, pelvic floor health';
    case 'male':
      return 'Focus on balanced muscle development, cardiovascular health';
    default:
      return 'Use inclusive approach suitable for all body types';
  }
}

function getConditionSpecificGuidance(conditions?: string[]): string {
  if (!conditions?.length) return 'No specific medical considerations';
  
  const guidance = [];
  
  if (conditions.some(c => c.toLowerCase().includes('sarcopenia'))) {
    guidance.push('CRITICAL: Progressive resistance training, compound movements, protein timing emphasis');
  }
  if (conditions.some(c => c.toLowerCase().includes('diabetes'))) {
    guidance.push('Monitor blood sugar, emphasize consistency, include both aerobic and resistance');
  }
  if (conditions.some(c => c.toLowerCase().includes('arthritis') || c.includes('joint'))) {
    guidance.push('Low-impact alternatives, warm-up emphasis, range of motion maintenance');
  }
  if (conditions.some(c => c.toLowerCase().includes('osteoporosis'))) {
    guidance.push('Weight-bearing exercises, balance training, avoid spinal flexion');
  }
  
  return guidance.length > 0 ? guidance.join('; ') : 'General health considerations apply';
}

function getGoalSpecificGuidance(goalDetails?: string): string {
  if (!goalDetails) return 'Follow general fitness principles';
  
  const details = goalDetails.toLowerCase();
  const guidance = [];
  
  if (details.includes('sarcopenia') || details.includes('muscle preservation')) {
    guidance.push('Compound movements 2-3x/week, progressive overload, adequate recovery');
  }
  if (details.includes('bone density')) {
    guidance.push('Weight-bearing exercises, impact training (if appropriate), resistance training');
  }
  if (details.includes('functional')) {
    guidance.push('Multi-planar movements, real-world applications, balance challenges');
  }
  if (details.includes('flexibility') || details.includes('mobility')) {
    guidance.push('Dynamic warm-up, static stretching post-workout, mobility flows');
  }
  
  return guidance.length > 0 ? guidance.join('; ') : 'Standard programming principles';
}

// Enhanced User Profile Schema
const enhancedUserProfileSchema = z.object({
  age: z.number().min(13).max(100).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  primaryGoalDetails: z.string().max(500).optional(),
  healthConditions: z.array(z.string()).optional().default([]),
  specificFocus: z.string().max(2000).optional(),
  experienceLevel: z.object({
    yearsActive: z.enum(['0-1', '1-3', '3-5', '5+']).optional(),
    familiarExercises: z.array(z.string()).optional().default([]),
    enjoyedActivities: z.array(z.string()).optional().default([]),
    dislikedActivities: z.array(z.string()).optional().default([]),
  }).optional(),
  lifestyle: z.object({
    recoveryNeeds: z.enum(['low', 'moderate', 'high']).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
    consistencyLevel: z.enum(['strict', 'flexible', 'variable']).optional(),
    motivationStyle: z.enum(['challenging', 'gentle', 'varied']).optional(),
    sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
    stressLevel: z.enum(['low', 'moderate', 'high']).optional(),
  }).optional(),
}).optional();

// Enhanced Validation schemas
const workoutPreferencesSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.array(z.string()).min(1),
  duration: z.number().min(15).max(180),
  daysPerWeek: z.number().min(1).max(7),
  equipment: z.array(z.string()).min(1),
  limitations: z.array(z.string()).optional().default([]),
  preferences: z.array(z.string()).optional().default([]),
  userProfile: enhancedUserProfileSchema,
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
  videoUrls: z
    .array(
      z.object({
        url: z.string().url(),
        platform: z.enum(['youtube', 'tiktok', 'instagram']),
        title: z.string(),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
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

    // Check if AI service is configured
    if (!isAIServiceConfigured()) {
      console.error('AI service not configured');
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

    // Generate workout using highest quality models (starts with gemini-2.5-pro)
    const result = await generateWithHighestQuality(prompt, {
      verbose: process.env.NODE_ENV === 'development',
    });

    const text = result.text;
    
    // Log model usage in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Workout generated using ${result.usedModel.name} in ${result.duration}ms (${result.attempts} attempts)`);
    }

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
  const currentMonth = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const {
    fitnessLevel,
    goals,
    duration,
    equipment,
    limitations,
    preferences: userPrefs,
    userProfile,
  } = preferences;

  const equipmentList = equipment.join(', ');
  const goalsList = goals.join(', ');
  const limitationsList =
    limitations.length > 0 ? limitations.join(', ') : 'none';
  const preferencesList = userPrefs.length > 0 ? userPrefs.join(', ') : 'none';

  // Build enhanced context sections
  const personalContext = userProfile ? `
**ENHANCED PERSONAL CONTEXT:**
- Age: ${userProfile.age || 'not specified'} (${getAgeSpecificGuidance(userProfile.age)})
- Gender: ${userProfile.gender || 'not specified'} (${getGenderSpecificGuidance(userProfile.gender)})
- Specific Goal Details: ${userProfile.primaryGoalDetails || 'general fitness'}
- Health Conditions: ${userProfile.healthConditions?.join(', ') || 'none specified'} (${getConditionSpecificGuidance(userProfile.healthConditions)})
- Focus Areas: ${userProfile.specificFocus || 'overall fitness'}
` : '';

  const experienceContext = userProfile?.experienceLevel ? `
**EXPERIENCE PROFILE:**
- Years Active: ${userProfile.experienceLevel.yearsActive || 'not specified'}
- Familiar Exercises: ${userProfile.experienceLevel.familiarExercises?.join(', ') || 'assess and include basics'}
- Enjoys: ${userProfile.experienceLevel.enjoyedActivities?.join(', ') || 'open to variety'}
- Prefers to Avoid: ${userProfile.experienceLevel.dislikedActivities?.join(', ') || 'none specified'}
` : '';

  const lifestyleContext = userProfile?.lifestyle ? `
**LIFESTYLE FACTORS:**
- Recovery Needs: ${userProfile.lifestyle.recoveryNeeds || 'moderate'} (adjust rest periods accordingly)
- Preferred Time: ${userProfile.lifestyle.timeOfDay || 'flexible'}
- Schedule Consistency: ${userProfile.lifestyle.consistencyLevel || 'flexible'}
- Motivation Style: ${userProfile.lifestyle.motivationStyle || 'balanced'}
- Sleep Quality: ${userProfile.lifestyle.sleepQuality || 'not specified'}
- Stress Level: ${userProfile.lifestyle.stressLevel || 'moderate'}
` : '';

  return `You are a certified personal trainer with expertise in personalized fitness programming and access to current ${currentYear} research. Today is ${currentMonth}. 

IMPORTANT: Use your knowledge of the latest fitness research, exercise science developments, and evidence-based training methodologies as of ${currentYear}. If you need current information about specific conditions, exercises, or training protocols, apply the most recent scientific evidence available to you.

Create a workout specifically tailored to this individual's unique profile and goals using current best practices.

**🌐 LANGUAGE AND LOCALIZATION INSTRUCTIONS 🌐**
CRITICAL: Analyze ONLY the user's "Specific Focus" field for language preference (ignore other fields):

🇪🇸 SPANISH DETECTION - Specific Focus Field Only:
- If "Specific Focus" contains "español", "idioma español" → GENERATE EVERYTHING IN SPANISH
- If "Specific Focus" is predominantly in Spanish → GENERATE EVERYTHING IN SPANISH
- Spanish request in Specific Focus OVERRIDES all other language considerations

🚨 MANDATORY SPANISH GENERATION WHEN DETECTED:
- ALL exercise names in Spanish (no English names allowed)
- ALL descriptions and instructions in Spanish
- ALL workout content in Spanish (name, description, everything)
- Use Spanish fitness terminology exclusively
- Ignore any English in other form fields - Spanish in Specific Focus takes priority

Other languages: Apply same logic for French ("français"), Portuguese ("português")
Default: English only if no language detected in Specific Focus field

**BASIC USER PROFILE:**
- Fitness Level: ${fitnessLevel}
- Primary Goals: ${goalsList}
- Workout Duration: ${duration} minutes
- Available Equipment: ${equipmentList}
- Physical Limitations: ${limitationsList}
- Additional Preferences: ${preferencesList}
${personalContext}${experienceContext}${lifestyleContext}

**CRITICAL PERSONALIZATION REQUIREMENTS:**
1. **Age-Specific Considerations**: ${getAgeSpecificGuidance(userProfile?.age)}
2. **Gender-Specific Factors**: ${getGenderSpecificGuidance(userProfile?.gender)}
3. **Condition-Specific Adaptations**: ${getConditionSpecificGuidance(userProfile?.healthConditions)}
4. **Goal-Specific Programming**: ${getGoalSpecificGuidance(userProfile?.primaryGoalDetails)}
5. **HIGHEST PRIORITY - User's Specific Focus**: Pay maximum attention to the "Focus Areas" field above. This contains the user's most important and detailed requirements. Prioritize these specific needs above all other considerations.

**ADVANCED PERSONALIZATION RULES:**
- If sarcopenia/muscle preservation mentioned: Emphasize compound movements, progressive overload, 8-12 rep range for hypertrophy
- If joint issues mentioned: Include mobility work, low-impact alternatives, proper warm-up sequences
- If time-constrained: Prioritize compound movements, supersets, circuit training for efficiency
- If recovery concerns: Include longer rest periods, stress management exercises, lighter intensity days
- If bone density concerns: Include weight-bearing exercises, impact training (if appropriate), resistance work
- If flexibility/mobility goals: Dynamic warm-up sequences, static stretching cool-down, mobility flows
- If muscle imbalance/asymmetry mentioned: Include unilateral exercises, single-limb training, corrective exercises for the weaker side
- If sedentary work mentioned: Include posture correction exercises, hip flexor stretches, thoracic spine mobility
- If machine preference mentioned: Prioritize machine-based exercises for safety, progressive loading, and injury prevention
- If core strengthening mentioned: Include core stability exercises, anti-extension/rotation movements, functional core training

Create a workout that demonstrates deep understanding of this person's specific needs and context.

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
      "difficulty": "beginner"
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
      "difficulty": "${fitnessLevel}"
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
      "difficulty": "beginner"
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
✓ Instructions: Detailed form guidance for each exercise
✓ Either plannedReps OR plannedDurationSeconds for each exercise, never both
✓ sessionData: accurate totals and arrays reflecting all exercises
✓ ENUM VALIDATION: All enum values match exactly - no synonyms allowed

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
