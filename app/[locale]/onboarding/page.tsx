/**
 * User Onboarding Flow
 * Multi-step onboarding process for new users
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  User,
  Activity,
  Target,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Dumbbell,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OnboardingData } from '@/types/auth';
import { cn } from '@/lib/utils';

const ONBOARDING_STEPS = [
  { id: 'profile', title: 'Profile', icon: User },
  { id: 'fitness', title: 'Fitness Level', icon: Activity },
  { id: 'goals', title: 'Goals', icon: Target },
  { id: 'organization', title: 'Community', icon: Users },
  { id: 'complete', title: 'Complete', icon: CheckCircle },
] as const;

type OnboardingStep = (typeof ONBOARDING_STEPS)[number]['id'];

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

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
  });

  const currentStepIndex = ONBOARDING_STEPS.findIndex(
    (step) => step.id === currentStep
  );
  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  // Initialize with user data if available
  useEffect(() => {
    if (isLoaded && user) {
      setData((prev) => ({
        ...prev,
        profileData: {
          displayName:
            user.fullName ||
            `${user.firstName} ${user.lastName}`.trim() ||
            user.emailAddresses[0]?.emailAddress ||
            '',
          avatarUrl: user.imageUrl,
        },
      }));
    }
  }, [isLoaded, user]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    setError('');
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < ONBOARDING_STEPS.length) {
      const nextStepId = ONBOARDING_STEPS[nextIndex]?.id;
      if (nextStepId) {
        setCurrentStep(nextStepId);
        updateData({ step: nextStepId });
      }
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStepId = ONBOARDING_STEPS[prevIndex]?.id;
      if (prevStepId) {
        setCurrentStep(prevStepId);
        updateData({ step: prevStepId });
      }
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    setError('');

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
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      // Handle organization creation/joining if needed
      if (
        data.organizationData?.action === 'create' &&
        data.organizationData.organizationName
      ) {
        const orgResponse = await fetch('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.organizationData.organizationName,
            type: data.organizationData.organizationType || 'family',
          }),
        });

        if (!orgResponse.ok) {
          console.warn('Failed to create organization, but profile was saved');
        }
      }

      // Clerk metadata is updated by the backend API when the profile is created

      nextStep(); // Move to complete step

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Onboarding error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to complete onboarding'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50'>
        <div className='text-center'>
          <Dumbbell className='mx-auto mb-4 h-8 w-8 animate-pulse text-blue-600' />
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      {/* Header */}
      <div className='border-b border-gray-200 bg-white'>
        <div className='mx-auto max-w-4xl px-4 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-blue-100 p-2'>
                <Dumbbell className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <h1 className='text-xl font-bold text-gray-900'>
                  Welcome to AI Personal Trainer
                </h1>
                <p className='text-sm text-gray-600'>
                  Let's personalize your fitness experience
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className='mt-6'>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm text-gray-600'>
                Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
              </span>
              <span className='text-sm text-gray-600'>
                {Math.round(progress)}% complete
              </span>
            </div>
            <div className='h-2 w-full rounded-full bg-gray-200'>
              <div
                className='h-2 rounded-full bg-blue-600 transition-all duration-300'
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto max-w-2xl px-4 py-8'>
        {error && (
          <div className='mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4'>
            <AlertCircle className='h-5 w-5 text-red-600' />
            <p className='text-red-700'>{error}</p>
          </div>
        )}

        {currentStep === 'profile' && (
          <ProfileStep
            data={data}
            updateData={updateData}
            nextStep={nextStep}
          />
        )}

        {currentStep === 'fitness' && (
          <FitnessStep
            data={data}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}

        {currentStep === 'goals' && (
          <GoalsStep
            data={data}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}

        {currentStep === 'organization' && (
          <OrganizationStep
            data={data}
            updateData={updateData}
            nextStep={completeOnboarding}
            prevStep={prevStep}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'complete' && <CompleteStep />}
      </div>
    </div>
  );
}

// Step Components
function ProfileStep({
  data,
  updateData,
  nextStep,
}: {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
}) {
  const canProceed =
    data.profileData?.displayName &&
    data.profileData.displayName.trim().length >= 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell us about yourself</CardTitle>
        <CardDescription>
          We'll use this information to personalize your experience
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div>
          <label
            htmlFor='displayName'
            className='mb-2 block text-sm font-medium text-gray-700'
          >
            Display Name *
          </label>
          <Input
            id='displayName'
            type='text'
            placeholder='Enter your display name'
            value={data.profileData?.displayName || ''}
            onChange={(e) =>
              updateData({
                profileData: {
                  ...data.profileData,
                  displayName: e.target.value,
                },
              })
            }
            className='w-full'
          />
          <p className='mt-1 text-xs text-gray-500'>
            This is how others will see your name
          </p>
        </div>

        <div className='flex justify-end'>
          <Button
            onClick={nextStep}
            disabled={!canProceed}
            className='min-w-32'
          >
            Continue
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FitnessStep({
  data,
  updateData,
  nextStep,
  prevStep,
}: {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}) {
  const fitnessLevels = [
    {
      value: 'beginner',
      title: 'Beginner',
      description: 'New to fitness or getting back into it',
    },
    {
      value: 'intermediate',
      title: 'Intermediate',
      description: 'Regular exercise, comfortable with basic movements',
    },
    {
      value: 'advanced',
      title: 'Advanced',
      description: 'Experienced with complex movements and training',
    },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>What's your fitness level?</CardTitle>
        <CardDescription>
          This helps us create appropriate workout plans for you
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid gap-4'>
          {fitnessLevels.map((level) => (
            <div
              key={level.value}
              className={cn(
                'cursor-pointer rounded-lg border-2 p-4 transition-colors',
                data.fitnessData?.fitnessLevel === level.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              onClick={() =>
                updateData({
                  fitnessData: {
                    ...data.fitnessData,
                    fitnessLevel: level.value,
                  },
                })
              }
            >
              <h3 className='font-semibold text-gray-900'>{level.title}</h3>
              <p className='mt-1 text-sm text-gray-600'>{level.description}</p>
            </div>
          ))}
        </div>

        <div className='flex justify-between'>
          <Button variant='outline' onClick={prevStep}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
          <Button onClick={nextStep} className='min-w-32'>
            Continue
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalsStep({
  data,
  updateData,
  nextStep,
  prevStep,
}: {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}) {
  const goals = [
    'Lose weight',
    'Build muscle',
    'Improve endurance',
    'Increase strength',
    'Better flexibility',
    'Overall health',
    'Sport performance',
    'Stress relief',
  ];

  const toggleGoal = (goal: string) => {
    const currentGoals = data.goalsData?.primaryGoals || [];
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter((g) => g !== goal)
      : [...currentGoals, goal];

    updateData({
      goalsData: {
        primaryGoals: updatedGoals,
        workoutPreference: data.goalsData?.workoutPreference || 'home',
        availableHours: data.goalsData?.availableHours || 1,
      },
    });
  };

  const canProceed = (data.goalsData?.primaryGoals?.length || 0) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>What are your fitness goals?</CardTitle>
        <CardDescription>
          Select all that apply. We'll tailor your workouts to help achieve
          these goals.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-2 gap-3'>
          {goals.map((goal) => {
            const isSelected =
              data.goalsData?.primaryGoals?.includes(goal) || false;
            return (
              <div
                key={goal}
                className={cn(
                  'cursor-pointer rounded-lg border-2 p-3 text-center transition-colors',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => toggleGoal(goal)}
              >
                <span className='text-sm font-medium'>{goal}</span>
              </div>
            );
          })}
        </div>

        <div className='flex justify-between'>
          <Button variant='outline' onClick={prevStep}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={!canProceed}
            className='min-w-32'
          >
            Continue
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OrganizationStep({
  data,
  updateData,
  nextStep,
  prevStep,
  isLoading,
}: {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Join or create a community</CardTitle>
        <CardDescription>
          Connect with family members or gym communities to stay motivated
          (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-4'>
          <div
            className={cn(
              'cursor-pointer rounded-lg border-2 p-4 transition-colors',
              data.organizationData?.action === 'skip'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
            onClick={() => updateData({ organizationData: { action: 'skip' } })}
          >
            <h3 className='font-semibold text-gray-900'>Skip for now</h3>
            <p className='mt-1 text-sm text-gray-600'>
              You can create or join a community later
            </p>
          </div>

          <div
            className={cn(
              'cursor-pointer rounded-lg border-2 p-4 transition-colors',
              data.organizationData?.action === 'create'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
            onClick={() =>
              updateData({
                organizationData: {
                  action: 'create',
                  organizationType: 'family',
                },
              })
            }
          >
            <h3 className='font-semibold text-gray-900'>
              Create a family group
            </h3>
            <p className='mt-1 text-sm text-gray-600'>
              Invite family members to train together
            </p>

            {data.organizationData?.action === 'create' && (
              <div className='mt-3' onClick={(e) => e.stopPropagation()}>
                <Input
                  placeholder='Family group name'
                  value={data.organizationData?.organizationName || ''}
                  onChange={(e) =>
                    updateData({
                      organizationData: {
                        action: data.organizationData?.action || 'create',
                        organizationType:
                          data.organizationData?.organizationType,
                        organizationName: e.target.value,
                        joinCode: data.organizationData?.joinCode,
                      },
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className='flex justify-between'>
          <Button variant='outline' onClick={prevStep} disabled={isLoading}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
          <Button onClick={nextStep} disabled={isLoading} className='min-w-32'>
            {isLoading ? 'Setting up...' : 'Complete Setup'}
            {!isLoading && <CheckCircle className='ml-2 h-4 w-4' />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompleteStep() {
  return (
    <Card className='text-center'>
      <CardContent className='pb-8 pt-8'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
          <CheckCircle className='h-8 w-8 text-green-600' />
        </div>
        <h2 className='mb-2 text-2xl font-bold text-gray-900'>
          Welcome to AI Personal Trainer!
        </h2>
        <p className='mb-6 text-gray-600'>
          Your profile is set up and you're ready to start your fitness journey.
        </p>
        <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
          <div className='h-2 w-2 animate-pulse rounded-full bg-blue-600'></div>
          <span>Redirecting to your dashboard...</span>
        </div>
      </CardContent>
    </Card>
  );
}
