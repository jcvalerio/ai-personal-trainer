/**
 * Session Recommendations API Route
 * Provides AI-powered recommendations for workout sessions
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { workoutSessionRepository } from '@/lib/repositories/workout-session.repository';
import { exerciseRepository } from '@/lib/repositories/exercise.repository';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';
import { recommendationRequestSchema } from '@/lib/validation/workout-schemas';

/**
 * POST /api/workouts/sessions/[sessionId]/recommendations
 * Get AI-powered recommendations for workout sessions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Validate route parameters first
    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing session ID', code: 'INVALID_PARAMS' },
        { status: 400 }
      );
    }

    // Development Mode: Allow operation without authentication for valid UUID
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    
    if (isDevelopment && isValidUUID) {
      // Skip authentication and use mock data for development
      const mockUserProfile = {
        id: 'dev-user-profile-id',
        clerkUserId: 'dev-user-id',
        organizationId: null,
        role: 'user'
      };

      // Skip rate limiting and user profile validation in development
      const mockSession = {
        id: sessionId,
        userId: 'dev-user-id',
        organizationId: null,
        status: 'in_progress',
        sessionData: {
          totalExercises: 4,
          estimatedDuration: 45,
          targetMuscleGroups: ['full-body'],
          progress: {
            exercisesCompleted: 1,
            currentExerciseIndex: 1,
            elapsedTime: 600000 // 10 minutes
          }
        }
      };

      // Generate recommendations using mock data
      const mockValidatedData = {
        type: 'form_improvement',
        context: {
          perceivedExertion: 6,
          formRating: 3,
          energyLevel: 7
        },
        userFeedback: null
      };

      const recommendations = await generateRecommendations(
        mockValidatedData,
        mockSession,
        mockUserProfile,
        sessionId
      );

      return NextResponse.json({
        success: true,
        data: {
          type: mockValidatedData.type,
          sessionId,
          recommendations,
          context: mockValidatedData.context,
          generatedAt: new Date().toISOString(),
        },
        meta: {
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          confidence: calculateConfidence(recommendations),
          mode: 'development'
        },
      });
    }

    // Production Mode: Full authentication required
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (
      !RATE_LIMITS.PROFILE_UPDATE.isAllowed(
        `session_recommendations:${userId}:${sessionId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Session recommendations rate limit exceeded',
        userId
      );
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // Get user profile for context
    const userProfile = await getUserProfileByClerkId(userId);
    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User profile not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Verify session exists and user has access
    const session = await workoutSessionRepository.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check access permissions
    if (session.userId !== userId && session.organizationId !== (orgId || userProfile.organizationId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    let validatedData;
    try {
      validatedData = recommendationRequestSchema.parse(body);
    } catch (error) {
      await logAuthEvent(
        'recommendation_validation_failed',
        'security',
        'Invalid recommendation request data',
        userId,
        orgId || undefined,
        { errors: error instanceof z.ZodError ? error.issues : undefined }
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error instanceof z.ZodError ? error.issues : undefined,
        },
        { status: 400 }
      );
    }

    // Generate recommendations based on type and context
    const recommendations = await generateRecommendations(
      validatedData,
      session,
      userProfile,
      sessionId
    );

    // Log recommendation request
    await logAuthEvent(
      'session_recommendations_generated',
      'audit',
      'Session recommendations generated',
      userId,
      orgId || undefined,
      { 
        sessionId,
        recommendationType: validatedData.type,
        contextProvided: Object.keys(validatedData.context).length > 0,
      }
    );

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        type: validatedData.type,
        sessionId,
        recommendations,
        context: validatedData.context,
        generatedAt: new Date().toISOString(),
      },
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
        confidence: calculateConfidence(recommendations),
      },
    });
  } catch (error) {
    console.error('Error generating session recommendations:', error);
    const authResult = await auth();
    const { sessionId: errorSessionId } = await params;
    await logAuthEvent(
      'session_recommendations_failed',
      'security',
      'Session recommendations generation failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { 
        error: (error as Error).message,
        sessionId: errorSessionId,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on request type and context
 */
async function generateRecommendations(
  request: any,
  session: any,
  userProfile: any,
  sessionId: string
) {
  const { type, context, userFeedback } = request;

  switch (type) {
    case 'exercise_substitute':
      return await generateExerciseSubstitutes(context, session);
    
    case 'rest_time':
      return generateRestTimeRecommendations(context, session);
    
    case 'intensity_adjustment':
      return generateIntensityAdjustments(context, session);
    
    case 'form_improvement':
      return await generateFormImprovements(context, session);
    
    case 'progression':
      return await generateProgressionRecommendations(context, session, userProfile);
    
    case 'recovery':
      return generateRecoveryRecommendations(context, session);
    
    default:
      return [];
  }
}

/**
 * Generate exercise substitute recommendations
 */
async function generateExerciseSubstitutes(context: any, session: any) {
  const recommendations = [];

  if (!context.currentExerciseId) {
    return [{
      title: 'No Current Exercise',
      description: 'Please specify the current exercise for substitution recommendations.',
      priority: 'low',
      actionable: false,
    }];
  }

  try {
    // Find similar exercises based on muscle groups and equipment
    const currentExercise = await exerciseRepository.findById(context.currentExerciseId);
    if (!currentExercise) {
      return [{
        title: 'Exercise Not Found',
        description: 'The specified exercise could not be found.',
        priority: 'low',
        actionable: false,
      }];
    }

    // Find alternatives based on muscle groups
    const alternatives = await exerciseRepository.findByMuscleGroup(
      currentExercise.primaryMuscleGroups[0],
      { limit: 5 }
    );

    const substitutes = alternatives
      .filter(ex => ex.id !== currentExercise.id)
      .slice(0, 3)
      .map(exercise => ({
        title: `Try ${exercise.name}`,
        description: `${exercise.description.substring(0, 100)}...`,
        priority: 'medium',
        actionable: true,
        action: {
          type: 'substitute_exercise',
          exerciseId: exercise.id,
          exerciseName: exercise.name,
        },
        reason: 'Similar muscle groups and equipment requirements',
      }));

    if (context.availableEquipment) {
      const equipmentBasedAlternatives = alternatives.filter(ex => 
        ex.equipmentRequired.some(eq => context.availableEquipment.includes(eq)) ||
        ex.equipmentRequired.length === 0
      );

      equipmentBasedAlternatives.slice(0, 2).forEach(exercise => {
        recommendations.push({
          title: `Equipment-Based Alternative: ${exercise.name}`,
          description: `Uses your available equipment: ${exercise.equipmentRequired.join(', ') || 'bodyweight'}`,
          priority: 'high',
          actionable: true,
          action: {
            type: 'substitute_exercise',
            exerciseId: exercise.id,
            exerciseName: exercise.name,
          },
          reason: 'Matches available equipment',
        });
      });
    }

    recommendations.push(...substitutes);

  } catch (error) {
    console.warn('Error generating exercise substitutes:', error);
    recommendations.push({
      title: 'Unable to Generate Substitutes',
      description: 'Could not find alternative exercises at this time.',
      priority: 'low',
      actionable: false,
    });
  }

  return recommendations;
}

/**
 * Generate rest time recommendations
 */
function generateRestTimeRecommendations(context: any, session: any) {
  const recommendations = [];
  const { perceivedExertion, formRating, timeConstraint } = context;

  // Base rest recommendations
  let recommendedRest = 90; // seconds

  if (perceivedExertion >= 8) {
    recommendedRest = 180;
    recommendations.push({
      title: 'Extend Rest Period',
      description: 'Your high effort level indicates you need more recovery time.',
      priority: 'high',
      actionable: true,
      action: {
        type: 'set_rest_time',
        seconds: recommendedRest,
      },
      reason: `High perceived exertion (${perceivedExertion}/10)`,
    });
  } else if (perceivedExertion <= 4) {
    recommendedRest = 60;
    recommendations.push({
      title: 'Shorter Rest Period',
      description: 'You can reduce rest time to maintain workout momentum.',
      priority: 'medium',
      actionable: true,
      action: {
        type: 'set_rest_time',
        seconds: recommendedRest,
      },
      reason: `Low perceived exertion (${perceivedExertion}/10)`,
    });
  }

  if (formRating && formRating <= 2) {
    recommendations.push({
      title: 'Focus on Form Recovery',
      description: 'Take extra time to reset your form before the next set.',
      priority: 'high',
      actionable: true,
      action: {
        type: 'form_reset',
        restSeconds: Math.max(recommendedRest, 120),
      },
      reason: `Form rating needs improvement (${formRating}/5)`,
    });
  }

  if (timeConstraint && timeConstraint < 15) {
    recommendations.push({
      title: 'Time-Efficient Rest',
      description: 'Consider shorter rest periods to complete your workout on time.',
      priority: 'medium',
      actionable: true,
      action: {
        type: 'set_rest_time',
        seconds: 45,
      },
      reason: `Limited time remaining (${timeConstraint} minutes)`,
    });
  }

  return recommendations;
}

/**
 * Generate intensity adjustment recommendations
 */
function generateIntensityAdjustments(context: any, session: any) {
  const recommendations = [];
  const { perceivedExertion, formRating, energyLevel } = context;

  if (perceivedExertion >= 9) {
    recommendations.push({
      title: 'Reduce Intensity',
      description: 'Consider decreasing weight or reps to maintain proper form.',
      priority: 'high',
      actionable: true,
      action: {
        type: 'reduce_intensity',
        adjustment: -15, // 15% reduction
      },
      reason: 'Very high effort level may compromise form and safety',
    });
  } else if (perceivedExertion <= 3) {
    recommendations.push({
      title: 'Increase Intensity',
      description: 'You have room to challenge yourself more.',
      priority: 'medium',
      actionable: true,
      action: {
        type: 'increase_intensity',
        adjustment: 10, // 10% increase
      },
      reason: 'Low effort level indicates potential for more challenge',
    });
  }

  if (energyLevel && energyLevel <= 3) {
    recommendations.push({
      title: 'Adjust for Low Energy',
      description: 'Focus on maintaining good form rather than maximum intensity.',
      priority: 'medium',
      actionable: true,
      action: {
        type: 'modify_approach',
        suggestion: 'form_focused',
      },
      reason: 'Low energy level requires conservative approach',
    });
  }

  return recommendations;
}

/**
 * Generate form improvement recommendations
 */
async function generateFormImprovements(context: any, session: any) {
  const recommendations = [];
  const { formRating, currentExerciseId, perceivedExertion } = context;

  if (formRating && formRating <= 3) {
    recommendations.push({
      title: 'Form Check Required',
      description: 'Consider reviewing proper form for this exercise.',
      priority: 'high',
      actionable: true,
      action: {
        type: 'form_review',
        exerciseId: currentExerciseId,
      },
      reason: `Form rating is below acceptable (${formRating}/5)`,
    });

    if (perceivedExertion >= 7) {
      recommendations.push({
        title: 'Reduce Weight for Better Form',
        description: 'High effort with poor form suggests weight is too heavy.',
        priority: 'high',
        actionable: true,
        action: {
          type: 'reduce_weight',
          adjustment: -20, // 20% reduction
        },
        reason: 'High effort + poor form = weight too heavy',
      });
    }
  }

  // General form tips
  recommendations.push({
    title: 'Form Focus Tips',
    description: 'Maintain controlled tempo, full range of motion, and proper breathing.',
    priority: 'low',
    actionable: false,
    reason: 'General form improvement guidelines',
  });

  return recommendations;
}

/**
 * Generate progression recommendations
 */
async function generateProgressionRecommendations(context: any, session: any, userProfile: any) {
  const recommendations = [];

  try {
    // Get recent sessions for trend analysis
    const recentSessions = await workoutSessionRepository.findByUserId(
      session.userId,
      { limit: 5, orderBy: 'created_at', orderDirection: 'DESC' }
    );

    if (recentSessions.length >= 2) {
      const currentPerformance = analyzeSessionPerformance(recentSessions[0]);
      const previousPerformance = analyzeSessionPerformance(recentSessions[1]);

      if (currentPerformance.completionRate > previousPerformance.completionRate + 10) {
        recommendations.push({
          title: 'Ready for Progression',
          description: 'Your completion rate has improved significantly.',
          priority: 'medium',
          actionable: true,
          action: {
            type: 'suggest_progression',
            metric: 'volume',
            increase: 5, // 5% increase
          },
          reason: 'Consistent improvement in completion rate',
        });
      }

      if (currentPerformance.averagePE < 6 && previousPerformance.averagePE < 6) {
        recommendations.push({
          title: 'Consider Intensity Increase',
          description: 'Your effort levels suggest you could handle more challenge.',
          priority: 'medium',
          actionable: true,
          action: {
            type: 'suggest_progression',
            metric: 'intensity',
            increase: 10,
          },
          reason: 'Consistently low perceived exertion levels',
        });
      }
    }

  } catch (error) {
    console.warn('Error generating progression recommendations:', error);
  }

  return recommendations;
}

/**
 * Generate recovery recommendations
 */
function generateRecoveryRecommendations(context: any, session: any) {
  const recommendations = [];
  const { perceivedExertion, energyLevel } = context;

  if (perceivedExertion >= 8) {
    recommendations.push({
      title: 'Active Recovery Needed',
      description: 'Consider light stretching or walking after this session.',
      priority: 'high',
      actionable: true,
      action: {
        type: 'schedule_recovery',
        activity: 'light_stretching',
        duration: 10,
      },
      reason: 'High intensity session requires proper recovery',
    });
  }

  if (energyLevel && energyLevel <= 4) {
    recommendations.push({
      title: 'Prioritize Rest',
      description: 'Ensure adequate sleep and nutrition for recovery.',
      priority: 'medium',
      actionable: false,
      reason: 'Low energy indicates need for better recovery',
    });
  }

  recommendations.push({
    title: 'Hydration Reminder',
    description: 'Drink water to support recovery and next session performance.',
    priority: 'low',
    actionable: true,
    action: {
      type: 'hydration_reminder',
      amount: '16-20oz',
    },
    reason: 'Proper hydration supports recovery',
  });

  return recommendations;
}

/**
 * Helper functions
 */
function calculateConfidence(recommendations: any[]): number {
  if (recommendations.length === 0) return 0;
  
  const totalScore = recommendations.reduce((sum, rec) => {
    let score = 0;
    if (rec.priority === 'high') score = 3;
    else if (rec.priority === 'medium') score = 2;
    else score = 1;
    
    if (rec.actionable) score *= 1.5;
    
    return sum + score;
  }, 0);
  
  const maxPossibleScore = recommendations.length * 3 * 1.5;
  return Math.round((totalScore / maxPossibleScore) * 100);
}

function analyzeSessionPerformance(session: any) {
  const exercises = session.exercises || [];
  const completedCount = exercises.filter((ex: any) => ex.status === 'completed').length;
  const totalCount = exercises.length;
  
  const peValues = exercises
    .filter((ex: any) => ex.perceivedExertion)
    .map((ex: any) => ex.perceivedExertion);
  
  return {
    completionRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    averagePE: peValues.length > 0 ? peValues.reduce((sum, pe) => sum + pe, 0) / peValues.length : 5,
    totalExercises: totalCount,
    completedExercises: completedCount,
  };
}