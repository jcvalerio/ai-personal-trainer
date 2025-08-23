/**
 * Organizations Management Page
 * Create and manage family groups and gym communities
 */
'use client';

import { useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Users,
  Building,
  Plus,
  Search,
  Crown,
  Settings,
  ArrowRight,
  Calendar,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CreateOrganization } from '@/components/organizations/create-organization';
import { AppNavigation } from '../../../components/navigation/app-navigation';
import { createLocalizedPath } from '../../../lib/localized-navigation';
import { TranslationErrorBoundary } from '../../../components/providers/translation-error-boundary';

interface OrganizationsPageProps {
  params: Promise<{ locale: string }>;
}

// Mock organization data
const mockOrganizations = [
  {
    id: '1',
    name: 'Smith Family Fitness',
    type: 'family' as const,
    description: "Our family's fitness journey together",
    memberCount: 4,
    maxMembers: 10,
    isOwner: true,
    role: 'owner' as const,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  },
  {
    id: '2',
    name: 'Downtown CrossFit',
    type: 'gym' as const,
    description: 'Premium CrossFit training facility',
    memberCount: 47,
    maxMembers: 100,
    isOwner: false,
    role: 'member' as const,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
  },
];

export default function OrganizationsPage({ params }: OrganizationsPageProps) {
  const t = useTranslations('organizations');
  const { locale } = use(params);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateSuccess = (organization: any) => {
    console.log('Organization created:', organization);
    setView('list');
  };

  if (view === 'create') {
    return (
      <TranslationErrorBoundary>
        <div className='min-h-screen bg-gray-50'>
          {/* Modern Navigation Header */}
          <AppNavigation locale={locale} variant='organizations' />

          {/* Main Content */}
          <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
            <CreateOrganization
              onBack={() => setView('list')}
              onSuccess={handleCreateSuccess}
            />
          </main>
        </div>
      </TranslationErrorBoundary>
    );
  }

  return (
    <TranslationErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Modern Navigation Header */}
        <AppNavigation locale={locale} variant='organizations' />

        {/* Main Content */}
        <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
          {/* Page Header */}
          <div className='mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h2 className='mb-2 text-3xl font-bold text-gray-900'>
                {t('title')}
              </h2>
              <p className='text-gray-600'>{t('subtitle')}</p>
            </div>
            <div className='mt-4 flex gap-3 sm:mt-0'>
              <Button variant='outline' size='sm'>
                <Search className='mr-2 h-4 w-4' />
                {t('buttons.joinWithCode')}
              </Button>
              <Button onClick={() => setView('create')}>
                <Plus className='mr-2 h-4 w-4' />
                {t('buttons.createOrganization')}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className='mb-8 flex flex-col gap-4 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
              <Input
                placeholder={`${t('title')}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          {/* Organizations Content */}
          {mockOrganizations.length > 0 ? (
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {mockOrganizations.map((org) => {
                const IconComponent = org.type === 'family' ? Users : Building;
                return (
                  <Card
                    key={org.id}
                    className='group transition-shadow hover:shadow-lg'
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='rounded-lg bg-blue-100 p-2'>
                            <IconComponent className='h-5 w-5 text-blue-600' />
                          </div>
                          <div>
                            <CardTitle className='text-lg transition-colors group-hover:text-blue-600'>
                              {org.name}
                            </CardTitle>
                            <div className='mt-1 flex items-center gap-2'>
                              <Badge
                                variant={
                                  org.type === 'family'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {org.type}
                              </Badge>
                              {org.isOwner && (
                                <Badge variant='outline' className='text-xs'>
                                  <Crown className='mr-1 h-3 w-3' />
                                  Owner
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {org.description && (
                        <CardDescription className='mt-2 line-clamp-2'>
                          {org.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent>
                      <div className='space-y-4'>
                        {/* Member Count */}
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-600'>Members</span>
                          <span className='font-medium'>
                            {org.memberCount}/{org.maxMembers}
                          </span>
                        </div>

                        {/* Member Progress */}
                        <div className='h-2 w-full rounded-full bg-gray-200'>
                          <div
                            className='h-2 rounded-full bg-blue-600 transition-all duration-300'
                            style={{
                              width: `${(org.memberCount / org.maxMembers) * 100}%`,
                            }}
                          />
                        </div>

                        {/* Quick Stats */}
                        <div className='grid grid-cols-3 gap-3 pt-2'>
                          <div className='text-center'>
                            <div className='text-lg font-bold text-blue-600'>
                              12
                            </div>
                            <div className='text-xs text-gray-500'>
                              Workouts
                            </div>
                          </div>
                          <div className='text-center'>
                            <div className='text-lg font-bold text-green-600'>
                              85%
                            </div>
                            <div className='text-xs text-gray-500'>Active</div>
                          </div>
                          <div className='text-center'>
                            <div className='text-lg font-bold text-purple-600'>
                              7
                            </div>
                            <div className='text-xs text-gray-500'>Days</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {/* Actions */}
                    <div className='px-6 pb-4'>
                      <div className='flex gap-2'>
                        <Button size='sm' className='flex-1' asChild>
                          <Link
                            href={createLocalizedPath(
                              `organizations/${org.id}`,
                              locale as 'en' | 'es'
                            )}
                          >
                            <ArrowRight className='mr-1 w-3' />
                            View Details
                          </Link>
                        </Button>
                        {org.isOwner && (
                          <Button variant='outline' size='sm'>
                            <Settings className='h-3 w-3' />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className='py-16 text-center'>
                <Users className='mx-auto mb-4 h-16 w-16 text-gray-400' />
                <h3 className='mb-2 text-xl font-semibold text-gray-900'>
                  {t('noOrganizations.title')}
                </h3>
                <p className='mx-auto mb-6 max-w-md text-gray-600'>
                  {t('noOrganizations.description')}
                </p>

                {/* Benefits */}
                <div className='mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  <div className='text-center'>
                    <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                      <Trophy className='h-6 w-6 text-blue-600' />
                    </div>
                    <p className='text-sm text-gray-600'>
                      {t('noOrganizations.benefits.shareProgress')}
                    </p>
                  </div>
                  <div className='text-center'>
                    <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
                      <Calendar className='h-6 w-6 text-green-600' />
                    </div>
                    <p className='text-sm text-gray-600'>
                      {t('noOrganizations.benefits.familyChallenges')}
                    </p>
                  </div>
                  <div className='text-center'>
                    <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100'>
                      <Users className='h-6 w-6 text-purple-600' />
                    </div>
                    <p className='text-sm text-gray-600'>
                      {t('noOrganizations.benefits.leaderboards')}
                    </p>
                  </div>
                  <div className='text-center'>
                    <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100'>
                      <ArrowRight className='h-6 w-6 text-orange-600' />
                    </div>
                    <p className='text-sm text-gray-600'>
                      {t('noOrganizations.benefits.motivation')}
                    </p>
                  </div>
                </div>

                <div className='flex justify-center gap-3'>
                  <Button onClick={() => setView('create')}>
                    <Plus className='mr-2 h-4 w-4' />
                    {t('buttons.createOrganization')}
                  </Button>
                  <Button variant='outline'>
                    <Search className='mr-2 h-4 w-4' />
                    {t('buttons.joinWithCode')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </TranslationErrorBoundary>
  );
}
