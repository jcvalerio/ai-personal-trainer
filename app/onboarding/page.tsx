/**
 * User Onboarding Flow
 * Multi-step onboarding process for new users
 */

'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Activity, 
  Target, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Dumbbell,
  AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OnboardingData } from '@/types/auth'
import { cn } from '@/lib/utils'

const ONBOARDING_STEPS = [
  { id: 'profile', title: 'Profile', icon: User },
  { id: 'fitness', title: 'Fitness Level', icon: Activity },
  { id: 'goals', title: 'Goals', icon: Target },
  { id: 'organization', title: 'Community', icon: Users },
  { id: 'complete', title: 'Complete', icon: CheckCircle },
] as const

type OnboardingStep = typeof ONBOARDING_STEPS[number]['id']

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  const [data, setData] = useState<OnboardingData>({
    step: 'profile',
    profileData: {
      displayName: '',
    },
    fitnessData: {
      fitnessLevel: 'beginner',
    },
    goalsData: {
      primaryGoals: [],
      workoutPreference: 'home',
      availableHours: 1,
    },
    organizationData: {
      action: 'skip',
    },
  })

  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100

  // Initialize with user data if available
  useEffect(() => {
    if (isLoaded && user) {
      setData(prev => ({
        ...prev,
        profileData: {
          displayName: user.fullName || `${user.firstName} ${user.lastName}`.trim() || user.emailAddresses[0]?.emailAddress || '',
          avatarUrl: user.imageUrl,
        },
      }))
    }
  }, [isLoaded, user])

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
    setError('')
  }

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < ONBOARDING_STEPS.length) {
      const nextStepId = ONBOARDING_STEPS[nextIndex].id
      setCurrentStep(nextStepId)
      updateData({ step: nextStepId })
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      const prevStepId = ONBOARDING_STEPS[prevIndex].id
      setCurrentStep(prevStepId)
      updateData({ step: prevStepId })
    }
  }

  const completeOnboarding = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Save user profile
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: data.profileData?.displayName,
          fitnessLevel: data.fitnessData?.fitnessLevel,
          heightCm: data.fitnessData?.heightCm,
          weightKg: data.fitnessData?.weightKg,
          birthDate: data.fitnessData?.birthDate,
          primaryGoals: data.goalsData?.primaryGoals || [],
          preferences: {
            units: 'metric',
            workoutReminders: true,
            theme: 'auto',
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      // Handle organization creation/joining if needed
      if (data.organizationData?.action === 'create' && data.organizationData.organizationName) {
        const orgResponse = await fetch('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.organizationData.organizationName,
            type: data.organizationData.organizationType || 'family',
          }),
        })

        if (!orgResponse.ok) {
          console.warn('Failed to create organization, but profile was saved')
        }
      }

      // Clerk metadata is updated by the backend API when the profile is created

      nextStep() // Move to complete step
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Onboarding error:', error)
      setError(error instanceof Error ? error.message : 'Failed to complete onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-8 h-8 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Dumbbell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Welcome to AI Personal Trainer</h1>
                <p className="text-sm text-gray-600">Let's personalize your fitness experience</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}</span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {currentStep === 'profile' && (
          <ProfileStep data={data} updateData={updateData} nextStep={nextStep} />
        )}

        {currentStep === 'fitness' && (
          <FitnessStep data={data} updateData={updateData} nextStep={nextStep} prevStep={prevStep} />
        )}

        {currentStep === 'goals' && (
          <GoalsStep data={data} updateData={updateData} nextStep={nextStep} prevStep={prevStep} />
        )}

        {currentStep === 'organization' && (
          <OrganizationStep data={data} updateData={updateData} nextStep={completeOnboarding} prevStep={prevStep} isLoading={isLoading} />
        )}

        {currentStep === 'complete' && (
          <CompleteStep />
        )}
      </div>
    </div>
  )
}

// Step Components
function ProfileStep({ data, updateData, nextStep }: { data: OnboardingData, updateData: (updates: Partial<OnboardingData>) => void, nextStep: () => void }) {
  const canProceed = data.profileData?.displayName && data.profileData.displayName.trim().length >= 2

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell us about yourself</CardTitle>
        <CardDescription>
          We'll use this information to personalize your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name *
          </label>
          <Input
            id="displayName"
            type="text"
            placeholder="Enter your display name"
            value={data.profileData?.displayName || ''}
            onChange={(e) => updateData({ profileData: { ...data.profileData, displayName: e.target.value } })}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500">This is how others will see your name</p>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={nextStep} 
            disabled={!canProceed}
            className="min-w-32"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FitnessStep({ data, updateData, nextStep, prevStep }: { data: OnboardingData, updateData: (updates: Partial<OnboardingData>) => void, nextStep: () => void, prevStep: () => void }) {
  const fitnessLevels = [
    { value: 'beginner', title: 'Beginner', description: 'New to fitness or getting back into it' },
    { value: 'intermediate', title: 'Intermediate', description: 'Regular exercise, comfortable with basic movements' },
    { value: 'advanced', title: 'Advanced', description: 'Experienced with complex movements and training' },
  ] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle>What's your fitness level?</CardTitle>
        <CardDescription>
          This helps us create appropriate workout plans for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {fitnessLevels.map((level) => (
            <div 
              key={level.value}
              className={cn(
                'p-4 border-2 rounded-lg cursor-pointer transition-colors',
                data.fitnessData?.fitnessLevel === level.value 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              )}
              onClick={() => updateData({ fitnessData: { ...data.fitnessData, fitnessLevel: level.value } })}
            >
              <h3 className="font-semibold text-gray-900">{level.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{level.description}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={nextStep} className="min-w-32">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function GoalsStep({ data, updateData, nextStep, prevStep }: { data: OnboardingData, updateData: (updates: Partial<OnboardingData>) => void, nextStep: () => void, prevStep: () => void }) {
  const goals = [
    'Lose weight',
    'Build muscle',
    'Improve endurance',
    'Increase strength',
    'Better flexibility',
    'Overall health',
    'Sport performance',
    'Stress relief',
  ]

  const toggleGoal = (goal: string) => {
    const currentGoals = data.goalsData?.primaryGoals || []
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal]
    
    updateData({ 
      goalsData: { 
        primaryGoals: updatedGoals,
        workoutPreference: data.goalsData?.workoutPreference || 'home',
        availableHours: data.goalsData?.availableHours || 1
      } 
    })
  }

  const canProceed = (data.goalsData?.primaryGoals?.length || 0) > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>What are your fitness goals?</CardTitle>
        <CardDescription>
          Select all that apply. We'll tailor your workouts to help achieve these goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {goals.map((goal) => {
            const isSelected = data.goalsData?.primaryGoals?.includes(goal) || false
            return (
              <div 
                key={goal}
                className={cn(
                  'p-3 border-2 rounded-lg cursor-pointer transition-colors text-center',
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => toggleGoal(goal)}
              >
                <span className="text-sm font-medium">{goal}</span>
              </div>
            )
          })}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={nextStep} disabled={!canProceed} className="min-w-32">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OrganizationStep({ data, updateData, nextStep, prevStep, isLoading }: { data: OnboardingData, updateData: (updates: Partial<OnboardingData>) => void, nextStep: () => void, prevStep: () => void, isLoading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Join or create a community</CardTitle>
        <CardDescription>
          Connect with family members or gym communities to stay motivated (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div 
            className={cn(
              'p-4 border-2 rounded-lg cursor-pointer transition-colors',
              data.organizationData?.action === 'skip' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            )}
            onClick={() => updateData({ organizationData: { action: 'skip' } })}
          >
            <h3 className="font-semibold text-gray-900">Skip for now</h3>
            <p className="text-sm text-gray-600 mt-1">You can create or join a community later</p>
          </div>

          <div 
            className={cn(
              'p-4 border-2 rounded-lg cursor-pointer transition-colors',
              data.organizationData?.action === 'create' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            )}
            onClick={() => updateData({ organizationData: { action: 'create', organizationType: 'family' } })}
          >
            <h3 className="font-semibold text-gray-900">Create a family group</h3>
            <p className="text-sm text-gray-600 mt-1">Invite family members to train together</p>
            
            {data.organizationData?.action === 'create' && (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <Input
                  placeholder="Family group name"
                  value={data.organizationData?.organizationName || ''}
                  onChange={(e) => updateData({ 
                    organizationData: { 
                      action: data.organizationData?.action || 'create',
                      organizationType: data.organizationData?.organizationType,
                      organizationName: e.target.value,
                      joinCode: data.organizationData?.joinCode
                    } 
                  })}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={isLoading}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={nextStep} 
            disabled={isLoading}
            className="min-w-32"
          >
            {isLoading ? 'Setting up...' : 'Complete Setup'}
            {!isLoading && <CheckCircle className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CompleteStep() {
  return (
    <Card className="text-center">
      <CardContent className="pt-8 pb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AI Personal Trainer!</h2>
        <p className="text-gray-600 mb-6">
          Your profile is set up and you're ready to start your fitness journey.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span>Redirecting to your dashboard...</span>
        </div>
      </CardContent>
    </Card>
  )
}