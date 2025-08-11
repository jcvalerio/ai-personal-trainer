/**
 * Integrated Dashboard Component
 * Main Phase 3 dashboard that combines plan management, calendar, templates, and analytics
 */
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { 
  LayoutDashboard, 
  Calendar,
  Archive,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Import Phase 3 components
import { PlanManagementDashboard } from './plan-management-dashboard'
import { WorkoutCalendar } from '../calendar/workout-calendar'

// Temporary placeholder components for templates and analytics
function TemplateBrowser() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Template Browser</h2>
          <p className="text-muted-foreground">Discover and share workout plans</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Template Marketplace</CardTitle>
            <CardDescription>Coming soon - Browse community templates and share your own</CardDescription>
          </CardHeader>
          <CardContent className="py-12">
            <div className="text-center">
              <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Template Browser Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                Browse community templates, share your workout plans, and discover new training methods.
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline">Browse Templates</Button>
                <Button>Share Your Plan</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Progress</h2>
          <p className="text-muted-foreground">Track your fitness journey and performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Workouts</span>
                  <span className="font-medium">4/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Time</span>
                  <span className="font-medium">5h 30m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Calories</span>
                  <span className="font-medium">1,280</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <span className="font-medium">12 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personal Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bench Press</span>
                  <span className="font-medium">185 lbs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Squat</span>
                  <span className="font-medium">225 lbs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">5K Run</span>
                  <span className="font-medium">22:30</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Progress Analytics</CardTitle>
            <CardDescription>Comprehensive analytics dashboard coming soon</CardDescription>
          </CardHeader>
          <CardContent className="py-12">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                Get detailed insights into your performance, progress trends, and goal achievement with interactive charts and reports.
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline">View Basic Stats</Button>
                <Button>Enable Advanced Analytics</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest workouts and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                ✓
              </div>
              <div className="flex-1">
                <p className="font-medium">Completed Upper Body Strength</p>
                <p className="text-sm text-muted-foreground">Today at 9:30 AM • 75 minutes</p>
              </div>
              <Badge variant="secondary">+280 cal</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                🏃
              </div>
              <div className="flex-1">
                <p className="font-medium">Morning Cardio Session</p>
                <p className="text-sm text-muted-foreground">Yesterday at 7:00 AM • 45 minutes</p>
              </div>
              <Badge variant="secondary">+320 cal</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">
                🏆
              </div>
              <div className="flex-1">
                <p className="font-medium">New Personal Record!</p>
                <p className="text-sm text-muted-foreground">Bench Press: 185 lbs</p>
              </div>
              <Badge variant="default">Achievement</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface IntegratedDashboardProps {
  defaultTab?: string
  onPlanCreate?: () => void
  onEventCreate?: () => void
  className?: string
}

export function IntegratedDashboard({
  defaultTab = 'overview',
  onPlanCreate,
  onEventCreate,
  className = ''
}: IntegratedDashboardProps) {
  const t = useTranslations('workouts')
  
  // State management
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Workout reminder: Upper Body in 30 min', type: 'reminder' },
    { id: 2, text: 'Week goal: 1 more workout to reach target', type: 'goal' },
    { id: 3, text: 'New personal record achieved!', type: 'achievement' }
  ])

  // Tab configuration
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Dashboard overview and quick actions'
    },
    {
      id: 'plans',
      label: 'Plan Manager',
      icon: Archive,
      description: 'Manage your workout plans'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      description: 'Schedule and view workout sessions'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: Archive,
      description: 'Browse and share workout templates'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Progress tracking and insights'
    }
  ]

  // Overview statistics
  const overviewStats = useMemo(() => ({
    totalPlans: 12,
    activePlans: 3,
    completedSessions: 47,
    upcomingSessions: 8,
    weeklyGoal: 5,
    weeklyProgress: 4,
    currentStreak: 12
  }), [])

  // Handle quick actions
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'create-plan':
        onPlanCreate?.()
        break
      case 'schedule-session':
        onEventCreate?.()
        break
      case 'start-workout':
        // Navigate to session execution
        console.log('Starting workout...')
        break
      case 'view-progress':
        setActiveTab('analytics')
        break
    }
  }, [onPlanCreate, onEventCreate])

  // Render overview tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Workout Dashboard</h1>
          <p className="text-muted-foreground">Manage your fitness journey and track progress</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="py-3">
                  <div>
                    <p className="text-sm">{notification.text}</p>
                    <p className="text-xs text-muted-foreground">{notification.type}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overviewStats.activePlans}</p>
                <p className="text-sm text-muted-foreground">Active Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overviewStats.upcomingSessions}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overviewStats.weeklyProgress}/{overviewStats.weeklyGoal}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                🔥
              </div>
              <div>
                <p className="text-2xl font-bold">{overviewStats.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="h-20 flex-col"
              onClick={() => handleQuickAction('create-plan')}
            >
              <Plus className="w-6 h-6 mb-2" />
              Create Plan
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => handleQuickAction('schedule-session')}
            >
              <Calendar className="w-6 h-6 mb-2" />
              Schedule Session
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => handleQuickAction('start-workout')}
            >
              <Archive className="w-6 h-6 mb-2" />
              Start Workout
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => handleQuickAction('view-progress')}
            >
              <BarChart3 className="w-6 h-6 mb-2" />
              View Progress
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest workouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Upper Body Strength</p>
                  <p className="text-xs text-muted-foreground">Completed today</p>
                </div>
                <Badge variant="secondary" className="text-xs">75 min</Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">
                  🏃
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Morning Cardio</p>
                  <p className="text-xs text-muted-foreground">Completed yesterday</p>
                </div>
                <Badge variant="secondary" className="text-xs">45 min</Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm">
                  💪
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Leg Day</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
                <Badge variant="secondary" className="text-xs">90 min</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Next scheduled workouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">
                  📅
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Lower Body Focus</p>
                  <p className="text-xs text-muted-foreground">Tomorrow at 9:00 AM</p>
                </div>
                <Badge variant="outline" className="text-xs">90 min</Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">
                  🧘
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Recovery Yoga</p>
                  <p className="text-xs text-muted-foreground">Saturday at 7:30 AM</p>
                </div>
                <Badge variant="outline" className="text-xs">60 min</Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm">
                  🎯
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">HIIT Training</p>
                  <p className="text-xs text-muted-foreground">Sunday at 6:00 PM</p>
                </div>
                <Badge variant="outline" className="text-xs">45 min</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className={`w-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Navigation */}
        <div className="border-b mb-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col sm:flex-row items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <tab.icon className="w-4 h-4" />
                <div className="text-center sm:text-left">
                  <div className="text-sm font-medium">{tab.label}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    {tab.description}
                  </div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <PlanManagementDashboard onCreatePlan={onPlanCreate} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <WorkoutCalendar onEventCreate={onEventCreate} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateBrowser />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}