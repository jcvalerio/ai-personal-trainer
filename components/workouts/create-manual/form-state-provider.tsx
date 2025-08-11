/**
 * Form State Provider - Persists form data across language switches
 * Prevents data loss during internationalization changes
 */
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { CustomPlanFormData } from '@/types/workouts'

interface FormStateContextType {
  formData: CustomPlanFormData
  updateFormData: (updates: Partial<CustomPlanFormData>) => void
  resetFormData: () => void
  currentStep: string
  setCurrentStep: (step: string) => void
}

const FormStateContext = createContext<FormStateContextType | null>(null)

const DEFAULT_FORM_DATA: CustomPlanFormData = {
  // Basic Info
  name: '',
  description: '',
  durationWeeks: 4,
  sessionsPerWeek: 5,
  fitnessGoals: [],
  targetFitnessLevel: 'beginner',
  estimatedSessionDuration: 70,

  // Weekly Schedule
  weeklySchedule: {},

  // Session Templates
  sessionTemplates: [],
  
  // Additional Settings
  isTemplate: false,
  isPublic: false
}

const STORAGE_KEY = 'workout_plan_form_data'
const STEP_STORAGE_KEY = 'workout_plan_current_step'

interface FormStateProviderProps {
  children: ReactNode
  initialData?: Partial<CustomPlanFormData>
  initialStep?: string
}

export function FormStateProvider({ 
  children, 
  initialData = {}, 
  initialStep = 'basics' 
}: FormStateProviderProps) {
  const [formData, setFormData] = useState<CustomPlanFormData>(() => {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_FORM_DATA, ...initialData }
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsedData = JSON.parse(saved)
        return { ...DEFAULT_FORM_DATA, ...parsedData, ...initialData }
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error)
    }

    return { ...DEFAULT_FORM_DATA, ...initialData }
  })

  const [currentStep, setCurrentStepState] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return initialStep
    }

    try {
      const savedStep = localStorage.getItem(STEP_STORAGE_KEY)
      return savedStep || initialStep
    } catch (error) {
      console.warn('Failed to load saved step:', error)
      return initialStep
    }
  })

  // Persist form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
      } catch (error) {
        console.warn('Failed to save form data:', error)
      }
    }
  }, [formData])

  // Persist current step to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STEP_STORAGE_KEY, currentStep)
      } catch (error) {
        console.warn('Failed to save current step:', error)
      }
    }
  }, [currentStep])

  const updateFormData = (updates: Partial<CustomPlanFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const resetFormData = () => {
    setFormData({ ...DEFAULT_FORM_DATA, ...initialData })
    setCurrentStepState(initialStep)
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STEP_STORAGE_KEY)
      } catch (error) {
        console.warn('Failed to clear saved data:', error)
      }
    }
  }

  const setCurrentStep = (step: string) => {
    setCurrentStepState(step)
  }

  const contextValue: FormStateContextType = {
    formData,
    updateFormData,
    resetFormData,
    currentStep,
    setCurrentStep
  }

  return (
    <FormStateContext.Provider value={contextValue}>
      {children}
    </FormStateContext.Provider>
  )
}

export function useFormState() {
  const context = useContext(FormStateContext)
  if (!context) {
    throw new Error('useFormState must be used within a FormStateProvider')
  }
  return context
}

// Hook for clearing form data on successful submission
export function useClearFormOnSubmit() {
  const { resetFormData } = useFormState()
  
  return (callback?: () => void) => {
    resetFormData()
    if (callback) {
      callback()
    }
  }
}