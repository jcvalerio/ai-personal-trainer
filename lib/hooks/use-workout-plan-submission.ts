/**
 * Workout Plan Submission Hook
 * Handles form submission with error handling and user feedback
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useClearFormOnSubmit } from '@/components/workouts/create-manual/form-state-provider'
import { createWorkoutPlan, type ApiResponse, type CreateWorkoutPlanResponse } from '@/lib/api/workout-plans'
import type { CustomPlanFormData } from '@/types/workouts'

export interface UseWorkoutPlanSubmissionOptions {
  onSuccess?: (response: ApiResponse<CreateWorkoutPlanResponse>) => void
  onError?: (error: ApiResponse) => void
  redirectOnSuccess?: boolean
  redirectPath?: string
}

export interface SubmissionState {
  isSubmitting: boolean
  error: string | null
  success: boolean
}

export function useWorkoutPlanSubmission(options: UseWorkoutPlanSubmissionOptions = {}) {
  const router = useRouter()
  const { formData } = useFormState()
  const clearFormOnSubmit = useClearFormOnSubmit()
  
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    error: null,
    success: false
  })

  const validateFormData = (data: CustomPlanFormData): string | null => {
    // Basic validation
    if (!data.name.trim()) {
      return 'Plan name is required'
    }
    
    if (data.durationWeeks < 1 || data.durationWeeks > 52) {
      return 'Duration must be between 1 and 52 weeks'
    }
    
    if (data.sessionsPerWeek < 1 || data.sessionsPerWeek > 7) {
      return 'Sessions per week must be between 1 and 7'
    }
    
    if (data.fitnessGoals.length === 0) {
      return 'At least one fitness goal is required'
    }
    
    if (data.sessionTemplates.length === 0) {
      return 'At least one session template is required'
    }
    
    // Validate session templates have exercise structure
    const invalidTemplates = data.sessionTemplates.filter(
      template => !template.exerciseStructure || template.exerciseStructure.length === 0
    )
    
    if (invalidTemplates.length > 0) {
      return 'All session templates must have at least one exercise'
    }
    
    return null
  }

  const submitWorkoutPlan = async (customData?: Partial<CustomPlanFormData>) => {
    const dataToSubmit = customData ? { ...formData, ...customData } : formData
    
    setSubmissionState({
      isSubmitting: true,
      error: null,
      success: false
    })

    try {
      // Client-side validation
      const validationError = validateFormData(dataToSubmit)
      if (validationError) {
        setSubmissionState({
          isSubmitting: false,
          error: validationError,
          success: false
        })
        options.onError?.({
          success: false,
          error: validationError,
          code: 'VALIDATION_ERROR'
        })
        return
      }

      // Submit to API
      const response = await createWorkoutPlan(dataToSubmit)
      
      if (response.success) {
        setSubmissionState({
          isSubmitting: false,
          error: null,
          success: true
        })
        
        // Clear form data on successful submission
        clearFormOnSubmit()
        
        // Call success callback
        options.onSuccess?.(response)
        
        // Redirect if configured
        if (options.redirectOnSuccess !== false) {
          const redirectPath = options.redirectPath || '/dashboard/workouts'
          router.push(redirectPath)
        }
      } else {
        setSubmissionState({
          isSubmitting: false,
          error: response.error || 'Failed to create workout plan',
          success: false
        })
        
        options.onError?.(response)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      setSubmissionState({
        isSubmitting: false,
        error: errorMessage,
        success: false
      })
      
      options.onError?.({
        success: false,
        error: errorMessage,
        code: 'UNEXPECTED_ERROR'
      })
    }
  }

  const clearError = () => {
    setSubmissionState(prev => ({ ...prev, error: null }))
  }

  const resetSubmission = () => {
    setSubmissionState({
      isSubmitting: false,
      error: null,
      success: false
    })
  }

  return {
    submitWorkoutPlan,
    submissionState,
    clearError,
    resetSubmission,
    isSubmitting: submissionState.isSubmitting,
    error: submissionState.error,
    success: submissionState.success
  }
}