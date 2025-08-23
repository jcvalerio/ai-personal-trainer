/**
 * Create Organization Component
 * Form for creating new family or gym organizations
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Users, Building, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading';
import { OrganizationType, CreateOrganizationRequest } from '@/types/auth';
import { cn } from '@/lib/utils';

interface CreateOrganizationProps {
  onBack?: () => void;
  onSuccess?: (organization: any) => void;
}

export function CreateOrganization({
  onBack,
  onSuccess,
}: CreateOrganizationProps) {
  const router = useRouter();
  const { user } = useUser();

  const [step, setStep] = useState<'type' | 'details' | 'creating'>('type');
  const [selectedType, setSelectedType] = useState<OrganizationType | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: '',
  });

  const organizationTypes = [
    {
      type: 'family' as OrganizationType,
      icon: Users,
      title: 'Family Group',
      description:
        'Create a private group for family members to train together',
      features: [
        'Up to 10 members',
        'Private workouts',
        'Family challenges',
        'Progress sharing',
      ],
      maxMembers: 10,
    },
    {
      type: 'gym' as OrganizationType,
      icon: Building,
      title: 'Gym Community',
      description: 'Manage your gym or fitness center with member tools',
      features: [
        'Up to 100 members',
        'Equipment tracking',
        'Class scheduling',
        'Analytics',
      ],
      maxMembers: 100,
    },
  ];

  const handleTypeSelect = (type: OrganizationType) => {
    setSelectedType(type);
    const selectedConfig = organizationTypes.find((org) => org.type === type);
    setFormData((prev) => ({
      ...prev,
      maxMembers: selectedConfig?.maxMembers.toString() || '10',
    }));
    setStep('details');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      return;
    }

    setIsLoading(true);
    setError('');
    setStep('creating');

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Organization name is required');
      }

      if (formData.name.trim().length < 2) {
        throw new Error('Organization name must be at least 2 characters long');
      }

      const requestData: CreateOrganizationRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: selectedType,
        maxMembers: parseInt(formData.maxMembers) || undefined,
      };

      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organization');
      }

      setSuccess(
        `${selectedType === 'family' ? 'Family group' : 'Gym'} created successfully!`
      );

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result.data);
      }

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating organization:', error);
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      setStep('details'); // Go back to details step
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('type');
      setSelectedType(null);
    } else if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className='mx-auto max-w-2xl'>
      {/* Step: Select Organization Type */}
      {step === 'type' && (
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>Create Your Organization</CardTitle>
            <CardDescription>
              Choose the type of organization you'd like to create
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {organizationTypes.map((org) => {
              const IconComponent = org.icon;
              return (
                <div
                  key={org.type}
                  className={cn(
                    'cursor-pointer rounded-lg border-2 p-6 transition-all hover:border-blue-300',
                    'group hover:shadow-md'
                  )}
                  onClick={() => handleTypeSelect(org.type)}
                >
                  <div className='flex items-start gap-4'>
                    <div className='rounded-lg bg-blue-100 p-3 transition-colors group-hover:bg-blue-200'>
                      <IconComponent className='h-6 w-6 text-blue-600' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                        {org.title}
                      </h3>
                      <p className='mb-4 text-gray-600'>{org.description}</p>
                      <ul className='grid grid-cols-2 gap-2'>
                        {org.features.map((feature, index) => (
                          <li
                            key={index}
                            className='flex items-center gap-2 text-sm text-gray-700'
                          >
                            <Check className='h-4 w-4 text-green-600' />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}

            {onBack && (
              <div className='flex justify-start pt-4'>
                <Button variant='outline' onClick={handleBack}>
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Organization Details */}
      {step === 'details' && selectedType && (
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>
              {selectedType === 'family' ? 'Family Group' : 'Gym'} Details
            </CardTitle>
            <CardDescription>
              Provide information about your{' '}
              {selectedType === 'family' ? 'family group' : 'gym'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <ErrorAlert onDismiss={() => setError('')} className='mb-6'>
                {error}
              </ErrorAlert>
            )}

            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label
                  htmlFor='name'
                  className='mb-2 block text-sm font-medium text-gray-700'
                >
                  {selectedType === 'family' ? 'Family Group' : 'Gym'} Name *
                </label>
                <Input
                  id='name'
                  type='text'
                  required
                  placeholder={
                    selectedType === 'family'
                      ? 'Smith Family Fitness'
                      : 'Downtown Gym'
                  }
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className='w-full'
                />
                <p className='mt-1 text-xs text-gray-500'>
                  This will be visible to all members
                </p>
              </div>

              <div>
                <label
                  htmlFor='description'
                  className='mb-2 block text-sm font-medium text-gray-700'
                >
                  Description (Optional)
                </label>
                <textarea
                  id='description'
                  rows={3}
                  placeholder={
                    selectedType === 'family'
                      ? 'A place for our family to stay fit together'
                      : 'Your neighborhood fitness center'
                  }
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label
                  htmlFor='maxMembers'
                  className='mb-2 block text-sm font-medium text-gray-700'
                >
                  Maximum Members
                </label>
                <Input
                  id='maxMembers'
                  type='number'
                  min='2'
                  max={selectedType === 'family' ? '25' : '1000'}
                  value={formData.maxMembers}
                  onChange={(e) =>
                    handleInputChange('maxMembers', e.target.value)
                  }
                  className='w-full'
                />
                <p className='mt-1 text-xs text-gray-500'>
                  You can change this later if needed
                </p>
              </div>

              <div className='flex justify-between pt-6'>
                <Button type='button' variant='outline' onClick={handleBack}>
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Back
                </Button>

                <Button type='submit' disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner size='sm' className='mr-2' />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create{' '}
                      {selectedType === 'family' ? 'Family Group' : 'Gym'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step: Creating (Loading) */}
      {step === 'creating' && (
        <Card>
          <CardContent className='py-12 text-center'>
            <LoadingSpinner size='lg' className='mx-auto mb-4' />
            <h3 className='mb-2 text-lg font-semibold text-gray-900'>
              Creating Your {selectedType === 'family' ? 'Family Group' : 'Gym'}
              ...
            </h3>
            <p className='text-gray-600'>This will only take a moment</p>

            {success && <SuccessAlert className='mt-6'>{success}</SuccessAlert>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
