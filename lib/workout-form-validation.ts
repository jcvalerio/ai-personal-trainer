/**
 * Workout Form Validation Utilities
 * Comprehensive validation functions for workout creation forms
 */

import type { CustomPlanFormData } from '@/types/workouts';
import type {
  FormValidationErrors,
  ValidationResult,
  StepValidator,
} from '@/types/workout-forms';

/**
 * Validates the basics step of the workout plan creation
 */
export const validateBasicsStep: StepValidator = (
  data: CustomPlanFormData
): ValidationResult => {
  const errors: FormValidationErrors = {};

  if (!data.name || data.name.trim().length < 3) {
    errors.name = 'Plan name must be at least 3 characters long';
  }

  if (
    !data.durationWeeks ||
    data.durationWeeks < 1 ||
    data.durationWeeks > 52
  ) {
    errors.durationWeeks = 'Duration must be between 1 and 52 weeks';
  }

  if (
    !data.sessionsPerWeek ||
    data.sessionsPerWeek < 1 ||
    data.sessionsPerWeek > 7
  ) {
    errors.sessionsPerWeek = 'Sessions per week must be between 1 and 7';
  }

  if (!data.fitnessGoals || data.fitnessGoals.length === 0) {
    errors.fitnessGoals = 'At least one fitness goal must be selected';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates the schedule step of the workout plan creation
 */
export const validateScheduleStep: StepValidator = (
  data: CustomPlanFormData
): ValidationResult => {
  const errors: FormValidationErrors = {};

  if (!data.weeklySchedule || Object.keys(data.weeklySchedule).length === 0) {
    errors.weeklySchedule = 'Weekly schedule must be configured';
  }

  // Validate that at least one workout is scheduled
  const totalWorkouts = Object.values(data.weeklySchedule || {}).reduce(
    (total, weekSchedule: any) => {
      if (!weekSchedule) {
        return total;
      }
      return (
        total + weekSchedule.filter((day: any) => day.type === 'workout').length
      );
    },
    0
  );

  if (totalWorkouts === 0) {
    errors.weeklySchedule = 'At least one workout session must be scheduled';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates the templates step of the workout plan creation
 */
export const validateTemplatesStep: StepValidator = (
  data: CustomPlanFormData
): ValidationResult => {
  const errors: FormValidationErrors = {};

  if (!data.sessionTemplates || data.sessionTemplates.length === 0) {
    errors.sessionTemplates = 'At least one session template must be created';
  }

  // Validate each template has required fields
  if (data.sessionTemplates) {
    const invalidTemplates = data.sessionTemplates.filter(
      (template) =>
        !template.name ||
        template.name.trim().length < 2 ||
        template.estimatedDuration < 15 ||
        template.estimatedDuration > 180
    );

    if (invalidTemplates.length > 0) {
      errors.sessionTemplates =
        'All templates must have valid names and durations (15-180 minutes)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates the entire form across all steps
 */
export const validateCompleteForm = (
  data: CustomPlanFormData
): ValidationResult => {
  const basicsResult = validateBasicsStep(data);
  const scheduleResult = validateScheduleStep(data);
  const templatesResult = validateTemplatesStep(data);

  const allErrors = {
    ...basicsResult.errors,
    ...scheduleResult.errors,
    ...templatesResult.errors,
  };

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
  };
};

/**
 * Gets validation function for a specific step
 */
export const getStepValidator = (step: string): StepValidator => {
  switch (step) {
    case 'basics':
      return validateBasicsStep;
    case 'schedule':
      return validateScheduleStep;
    case 'templates':
      return validateTemplatesStep;
    case 'preview':
      return validateCompleteForm;
    default:
      return () => ({ isValid: false, errors: {} });
  }
};

/**
 * Checks if a step can be progressed to
 */
export const canProgressToStep = (
  data: CustomPlanFormData,
  targetStep: string
): boolean => {
  const stepOrder = ['basics', 'schedule', 'templates', 'preview'];
  const targetIndex = stepOrder.indexOf(targetStep);

  if (targetIndex === -1) {
    return false;
  }

  // Check all previous steps are valid
  for (let i = 0; i < targetIndex; i++) {
    const stepId = stepOrder[i];
    if (stepId) {
      const validator = getStepValidator(stepId);
      const result = validator(data);
      if (!result.isValid) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Sanitizes form data to ensure no malicious content
 */
export const sanitizeFormData = (
  data: CustomPlanFormData
): CustomPlanFormData => {
  const sanitizeString = (str: string): string => {
    return str
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  return {
    ...data,
    name: sanitizeString(data.name),
    description: sanitizeString(data.description),
    sessionTemplates: data.sessionTemplates.map((template) => ({
      ...template,
      name: sanitizeString(template.name),
      description: sanitizeString(template.description),
      notes: template.notes ? sanitizeString(template.notes) : template.notes,
    })),
  };
};
