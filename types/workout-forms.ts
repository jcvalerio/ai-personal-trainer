/**
 * Workout Form Types
 * Type-safe interfaces for workout creation form components
 */

import type { CustomPlanFormData, SessionTemplate } from './workouts';

/**
 * Base props for all step components in the workout creation wizard
 */
export interface BaseStepProps {
  data: CustomPlanFormData;
  onUpdate: (updates: Partial<CustomPlanFormData>) => void;
}

/**
 * Props for PlanBasicsStep component
 */
export interface PlanBasicsStepProps extends BaseStepProps {}

/**
 * Props for WeeklyScheduleStep component
 */
export interface WeeklyScheduleStepProps extends BaseStepProps {}

/**
 * Props for SessionTemplatesStep component
 */
export interface SessionTemplatesStepProps extends BaseStepProps {}

/**
 * Props for PlanPreviewStep component
 */
export interface PlanPreviewStepProps extends BaseStepProps {}

/**
 * Form validation errors
 */
export interface FormValidationErrors {
  name?: string;
  durationWeeks?: string;
  sessionsPerWeek?: string;
  fitnessGoals?: string;
  weeklySchedule?: string;
  sessionTemplates?: string;
}

/**
 * Form state interface
 */
export interface FormState {
  data: CustomPlanFormData;
  errors: FormValidationErrors;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * Update handler type for type safety
 */
export type FormUpdateHandler = (updates: Partial<CustomPlanFormData>) => void;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: FormValidationErrors;
}

/**
 * Step validation function type
 */
export type StepValidator = (data: CustomPlanFormData) => ValidationResult;

/**
 * Session template editor props
 */
export interface SessionTemplateEditorProps {
  template: SessionTemplate | null;
  isOpen: boolean;
  onSave: (template: SessionTemplate) => void;
  onCancel: () => void;
  onDelete?: (templateId: string) => void;
}

/**
 * Exercise structure editor props
 */
export interface ExerciseStructureEditorProps {
  exercises: Array<any>;
  onUpdate: (exercises: Array<any>) => void;
  targetMuscleGroups?: string[];
  difficulty?: string;
}
