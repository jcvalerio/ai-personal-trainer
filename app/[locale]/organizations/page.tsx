/**
 * Organizations Management Page
 * Create and manage family groups and gym communities
 */
'use client'

import { useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  Users, 
  Building, 
  Plus, 
  Search,
  Filter,
  Crown,
  Settings,
  ArrowRight,
  Calendar,
  Trophy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateOrganization } from '@/components/organizations/create-organization'
import { AppNavigation } from '../../../components/navigation/app-navigation'
import { createLocalizedPath } from '../../../lib/localized-navigation'
import { TranslationErrorBoundary } from '../../../components/providers/translation-error-boundary'

interface OrganizationsPageProps {
  params: Promise<{ locale: string }>
}

// Mock organization data
const mockOrganizations = [
  {
    id: '1',
    name: 'Smith Family Fitness',
    type: 'family' as const,
    description: 'Our family\'s fitness journey together',
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
  }
]

export default function OrganizationsPage({ params }: OrganizationsPageProps) {
  const t = useTranslations('organizations')
  const { locale } = use(params)
  const [view, setView] = useState<'list' | 'create'>('list')
  const [searchQuery, setSearchQuery] = useState('')

  const handleCreateSuccess = (organization: any) => {
    console.log('Organization created:', organization)
    setView('list')
  }

  if (view === 'create') {
    return (
      <TranslationErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          {/* Modern Navigation Header */}
          <AppNavigation locale={locale} variant="organizations" />

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CreateOrganization 
              onBack={() => setView('list')}
              onSuccess={handleCreateSuccess}
            />
          </main>
        </div>
      </TranslationErrorBoundary>
    )
  }

  return (
    <TranslationErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Modern Navigation Header */}
        <AppNavigation locale={locale} variant="organizations" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h2>
              <p className="text-gray-600">{t('subtitle')}</p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                {t('buttons.joinWithCode')}
              </Button>
              <Button onClick={() => setView('create')}>
                <Plus className="w-4 h-4 mr-2" />
                {t('buttons.createOrganization')}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={`${t('title')}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Organizations Content */}
          {mockOrganizations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockOrganizations.map((org) => {
                const IconComponent = org.type === 'family' ? Users : Building
                return (
                  <Card key={org.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                              {org.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={org.type === 'family' ? 'default' : 'secondary'}>
                                {org.type}
                              </Badge>
                              {org.isOwner && (
                                <Badge variant="outline" className="text-xs">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Owner
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {org.description && (
                        <CardDescription className="mt-2 line-clamp-2">
                          {org.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        {/* Member Count */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Members</span>
                          <span className="font-medium">
                            {org.memberCount}/{org.maxMembers}
                          </span>
                        </div>
                        
                        {/* Member Progress */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(org.memberCount / org.maxMembers) * 100}%` }}
                          />
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">12</div>
                            <div className="text-xs text-gray-500">Workouts</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">85%</div>
                            <div className="text-xs text-gray-500">Active</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">7</div>
                            <div className="text-xs text-gray-500">Days</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Actions */}
                    <div className="px-6 pb-4">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          asChild
                        >
                          <Link href={createLocalizedPath(`organizations/${org.id}`, locale as 'en' | 'es')}>
                            <ArrowRight className="w-3 w-3 mr-1" />
                            View Details
                          </Link>
                        </Button>
                        {org.isOwner && (
                          <Button variant="outline" size="sm">
                            <Settings className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('noOrganizations.title')}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {t('noOrganizations.description')}
                </p>

                {/* Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Trophy className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600">{t('noOrganizations.benefits.shareProgress')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">{t('noOrganizations.benefits.familyChallenges')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600">{t('noOrganizations.benefits.leaderboards')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <ArrowRight className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-600">{t('noOrganizations.benefits.motivation')}</p>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <Button onClick={() => setView('create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('buttons.createOrganization')}
                  </Button>
                  <Button variant="outline">
                    <Search className="w-4 h-4 mr-2" />
                    {t('buttons.joinWithCode')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </TranslationErrorBoundary>
  )
}