/**
 * Create Workout Plan From Template API Route
 * Allows users to create personalized workout plans from existing templates
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { workoutPlanRepository } from '@/lib/repositories/workout-plan.repository';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';

// Schema for creating a plan from template
const createFromTemplateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID format'),
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(2000).optional(),
  personalizations: z.object({
    targetFitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    durationWeeks: z.number().min(1).max(52).optional(),
    sessionsPerWeek: z.number().min(1).max(7).optional(),
    estimatedSessionDuration: z.number().min(15).max(180).optional(),
    fitnessGoals: z.array(z.string()).min(1).max(10).optional(),
    modifications: z.object({
      equipmentSubstitutions: z.record(z.string()).optional(),
      exerciseModifications: z.record(z.any()).optional(),
      intensityAdjustments: z.record(z.number()).optional(),
      scheduleAdjustments: z.record(z.any()).optional(),
    }).optional(),
    preferences: z.object({
      focusAreas: z.array(z.string()).optional(),
      avoidedExercises: z.array(z.string()).optional(),
      preferredEquipment: z.array(z.string()).optional(),
      timeConstraints: z.object({
        maxSessionDuration: z.number().optional(),
        preferredDays: z.array(z.string()).optional(),
        unavailableDays: z.array(z.string()).optional(),
      }).optional(),
    }).optional(),
  }).optional(),
  startDate: z.string().datetime().optional(),
});

/**
 * POST /api/workouts/plans/from-template
 * Create a personalized workout plan from an existing template
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authentication
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate limiting for creation
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (
      !RATE_LIMITS.PROFILE_UPDATE.isAllowed(
        `create_plan_from_template:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Plan from template creation rate limit exceeded',
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
      validatedData = createFromTemplateSchema.parse(body);
    } catch (error) {
      await logAuthEvent(
        'plan_from_template_validation_failed',
        'security',
        'Invalid plan from template data',
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

    // Find the template
    const template = await workoutPlanRepository.findById(validatedData.templateId);
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found',
          code: 'TEMPLATE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Verify it's actually a template and accessible
    if (!template.isTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Specified plan is not a template',
          code: 'NOT_A_TEMPLATE',
        },
        { status: 400 }
      );
    }

    if (!template.isPublic && template.organizationId !== (orgId || userProfile.organizationId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not accessible',
          code: 'TEMPLATE_ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    // Apply personalizations to the template
    const personalizations = validatedData.personalizations;
    const personalizedPlan = {
      // Base template data
      ...template,
      
      // Override with user-specific data
      id: undefined, // Will be generated
      userId,
      organizationId: orgId || userProfile.organizationId,
      name: validatedData.name,
      description: validatedData.description || template.description,
      
      // Apply personalizations
      targetFitnessLevel: personalizations?.targetFitnessLevel || template.targetFitnessLevel,
      durationWeeks: personalizations?.durationWeeks || template.durationWeeks,
      sessionsPerWeek: personalizations?.sessionsPerWeek || template.sessionsPerWeek,
      estimatedSessionDuration: personalizations?.estimatedSessionDuration || template.estimatedSessionDuration,
      fitnessGoals: personalizations?.fitnessGoals || template.fitnessGoals,

      // Plan metadata
      parentPlanId: template.id,
      isTemplate: false,
      isPublic: false,
      status: 'draft',
      version: 1,
      startedAt: validatedData.startDate ? new Date(validatedData.startDate) : null,

      // Apply modifications to plan data
      planData: applyPersonalizations(template.planData, personalizations),
      
      // Tracking metadata
      generationParameters: {
        ...template.generationParameters,
        templateId: template.id,
        personalizations: personalizations || {},
        createdFromTemplate: true,
        createdAt: new Date().toISOString(),
      },

      // Reset timestamps
      createdAt: undefined,
      updatedAt: undefined,
    };

    // Create the personalized plan
    const newPlan = await workoutPlanRepository.create(personalizedPlan);

    // Log successful template usage
    await logAuthEvent(
      'plan_created_from_template',
      'audit',
      'Workout plan created from template',
      userId,
      orgId || undefined,
      { 
        templateId: template.id,
        templateName: template.name,
        newPlanId: newPlan.id,
        personalizations: personalizations || {}
      }
    );

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: newPlan,
        meta: {
          responseTime,
          timestamp: new Date().toISOString(),
          template: {
            id: template.id,
            name: template.name,
            category: template.templateCategory,
          },
          personalizations: personalizations || {},
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating plan from template:', error);
    const authResult = await auth();
    await logAuthEvent(
      'plan_from_template_creation_failed',
      'security',
      'Plan from template creation failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { error: (error as Error).message }
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
 * Apply personalizations to the plan data
 */
function applyPersonalizations(
  originalPlanData: any,
  personalizations?: typeof createFromTemplateSchema._type.personalizations
): any {
  if (!personalizations) {
    return originalPlanData;
  }

  const planData = JSON.parse(JSON.stringify(originalPlanData)); // Deep clone

  // Apply equipment substitutions
  if (personalizations.modifications?.equipmentSubstitutions) {
    applyEquipmentSubstitutions(planData, personalizations.modifications.equipmentSubstitutions);
  }

  // Apply exercise modifications
  if (personalizations.modifications?.exerciseModifications) {
    applyExerciseModifications(planData, personalizations.modifications.exerciseModifications);
  }

  // Apply intensity adjustments
  if (personalizations.modifications?.intensityAdjustments) {
    applyIntensityAdjustments(planData, personalizations.modifications.intensityAdjustments);
  }

  // Apply preferences
  if (personalizations.preferences) {
    applyPreferences(planData, personalizations.preferences);
  }

  return planData;
}

/**
 * Helper functions for applying specific personalizations
 */
function applyEquipmentSubstitutions(planData: any, substitutions: Record<string, string>) {
  // Recursively find and replace equipment references
  JSON.stringify(planData, (key, value) => {
    if (key === 'equipmentRequired' && Array.isArray(value)) {
      return value.map(equipId => substitutions[equipId] || equipId);
    }
    if (key === 'equipmentOptional' && Array.isArray(value)) {
      return value.map(equipId => substitutions[equipId] || equipId);
    }
    return value;
  });
}

function applyExerciseModifications(planData: any, modifications: Record<string, any>) {
  // Apply exercise-specific modifications
  if (planData.templates) {
    planData.templates.forEach((template: any) => {
      if (template.exerciseStructure) {
        template.exerciseStructure.forEach((exercise: any) => {
          if (modifications[exercise.exerciseId]) {
            Object.assign(exercise, modifications[exercise.exerciseId]);
          }
        });
      }
    });
  }
}

function applyIntensityAdjustments(planData: any, adjustments: Record<string, number>) {
  // Apply intensity multipliers to sets, reps, weights, etc.
  const intensityMultiplier = adjustments.overall || 1.0;
  
  if (planData.templates) {
    planData.templates.forEach((template: any) => {
      if (template.exerciseStructure) {
        template.exerciseStructure.forEach((exercise: any) => {
          if (exercise.sets) exercise.sets = Math.round(exercise.sets * intensityMultiplier);
          if (exercise.repsMin) exercise.repsMin = Math.round(exercise.repsMin * intensityMultiplier);
          if (exercise.repsMax) exercise.repsMax = Math.round(exercise.repsMax * intensityMultiplier);
        });
      }
    });
  }
}

function applyPreferences(planData: any, preferences: any) {
  // Remove avoided exercises
  if (preferences.avoidedExercises?.length) {
    const avoidedIds = new Set(preferences.avoidedExercises);
    if (planData.templates) {
      planData.templates.forEach((template: any) => {
        if (template.exerciseStructure) {
          template.exerciseStructure = template.exerciseStructure.filter(
            (exercise: any) => !avoidedIds.has(exercise.exerciseId)
          );
        }
      });
    }
  }

  // Add focus area annotations
  if (preferences.focusAreas?.length) {
    planData.focusAreas = [...(planData.focusAreas || []), ...preferences.focusAreas];
  }
}