/**
 * Organizations Management Page
 * Create and manage family groups and gym communities
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { 
  Users, 
  Building, 
  Plus, 
  Search,
  Filter,
  Crown,
  UserPlus,
  Settings,
  ArrowRight,
  Dumbbell,
  Calendar,
  Trophy,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateOrganization } from '@/components/organizations/create-organization'

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

export default function OrganizationsPage() {
  const [view, setView] = useState<'list' | 'create'>('list')
  const [searchQuery, setSearchQuery] = useState('')

  const handleCreateSuccess = (organization: any) => {
    console.log('Organization created:', organization)
    setView('list')
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Dumbbell className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">AI Personal Trainer</h1>
                    <p className="text-xs text-gray-500">Create Organization</p>
                  </div>
                </Link>
              </div>
              
              <div className="flex items-center gap-4">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8',
                    }
                  }}
                  showName={false}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CreateOrganization 
            onBack={() => setView('list')}
            onSuccess={handleCreateSuccess}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI Personal Trainer</h1>
                  <p className="text-xs text-gray-500">Organizations</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/workouts" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Workouts
                </Link>
                <Link 
                  href="/progress" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Progress
                </Link>
                <Link 
                  href="/organizations" 
                  className="text-blue-600 font-medium border-b-2 border-blue-600 pb-4 -mb-4"
                >
                  Organizations
                </Link>
              </nav>
              
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  }
                }}
                showName={false}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Organizations</h2>
            <p className="text-gray-600">Manage your fitness communities and family groups</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button onClick={() => setView('create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Search className="w-4 h-4 mr-2" />
            Join Organization
          </Button>
        </div>

        {/* Organizations List */}
        <Tabs defaultValue="my-organizations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-organizations">My Organizations</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          {/* My Organizations Tab */}
          <TabsContent value="my-organizations" className="mt-6 space-y-6">
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
                            <Link href={`/organizations/${org.id}`}>
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
                <CardContent className="py-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Organizations Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create or join an organization to start training with others.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={() => setView('create')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Organization
                    </Button>
                    <Button variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      Join Organization
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Invitations</h3>
                <p className="text-gray-600">
                  When others invite you to their organizations, they'll appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Discover Organizations</h3>
                <p className="text-gray-600 mb-6">
                  Find public gyms and fitness communities in your area.
                </p>
                <Button variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Public Organizations
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}