/**
 * Integrated Dashboard Component
 * Main Phase 3 dashboard that combines plan management, calendar, templates, and analytics
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Import Phase 3 components
import { PlanManagementDashboard } from './plan-management-dashboard';
import { WorkoutCalendar } from '../calendar/workout-calendar';

// Temporary placeholder components for templates and analytics
function TemplateBrowser() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Template Browser</h2>
          <p className='text-muted-foreground'>
            Discover and share workout plans
          </p>
        </div>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Create Template
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <Card className='md:col-span-3'>
          <CardHeader>
            <CardTitle>Template Marketplace</CardTitle>
            <CardDescription>
              Coming soon - Browse community templates and share your own
            </CardDescription>
          </CardHeader>
          <CardContent className='py-12'>
            <div className='text-center'>
              <Archive className='mx-auto mb-4 h-16 w-16 text-gray-400' />
              <h3 className='mb-2 text-lg font-medium'>
                Template Browser Coming Soon
              </h3>
              <p className='mb-4 text-gray-600'>
                Browse community templates, share your workout plans, and
                discover new training methods.
              </p>
              <div className='flex justify-center gap-2'>
                <Button variant='outline'>Browse Templates</Button>
                <Button>Share Your Plan</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsDashboard() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Analytics & Progress</h2>
          <p className='text-muted-foreground'>
            Track your fitness journey and performance
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm'>
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
          <Button variant='outline' size='sm'>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Quick Stats */}
        <div className='space-y-4'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Workouts
                  </span>
                  <span className='font-medium'>4/5</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Total Time
                  </span>
                  <span className='font-medium'>5h 30m</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Calories
                  </span>
                  <span className='font-medium'>1,280</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>Streak</span>
                  <span className='font-medium'>12 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Personal Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Bench Press
                  </span>
                  <span className='font-medium'>185 lbs</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>Squat</span>
                  <span className='font-medium'>225 lbs</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>5K Run</span>
                  <span className='font-medium'>22:30</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Placeholder */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Progress Analytics</CardTitle>
            <CardDescription>
              Comprehensive analytics dashboard coming soon
            </CardDescription>
          </CardHeader>
          <CardContent className='py-12'>
            <div className='text-center'>
              <BarChart3 className='mx-auto mb-4 h-16 w-16 text-gray-400' />
              <h3 className='mb-2 text-lg font-medium'>
                Advanced Analytics Coming Soon
              </h3>
              <p className='mb-4 text-gray-600'>
                Get detailed insights into your performance, progress trends,
                and goal achievement with interactive charts and reports.
              </p>
              <div className='flex justify-center gap-2'>
                <Button variant='outline'>View Basic Stats</Button>
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
          <CardDescription>
            Your latest workouts and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center gap-3 rounded-lg bg-gray-50 p-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm text-white'>
                ✓
              </div>
              <div className='flex-1'>
                <p className='font-medium'>Completed Upper Body Strength</p>
                <p className='text-muted-foreground text-sm'>
                  Today at 9:30 AM • 75 minutes
                </p>
              </div>
              <Badge variant='secondary'>+280 cal</Badge>
            </div>

            <div className='flex items-center gap-3 rounded-lg bg-gray-50 p-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm text-white'>
                🏃
              </div>
              <div className='flex-1'>
                <p className='font-medium'>Morning Cardio Session</p>
                <p className='text-muted-foreground text-sm'>
                  Yesterday at 7:00 AM • 45 minutes
                </p>
              </div>
              <Badge variant='secondary'>+320 cal</Badge>
            </div>

            <div className='flex items-center gap-3 rounded-lg bg-gray-50 p-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm text-white'>
                🏆
              </div>
              <div className='flex-1'>
                <p className='font-medium'>New Personal Record!</p>
                <p className='text-muted-foreground text-sm'>
                  Bench Press: 185 lbs
                </p>
              </div>
              <Badge variant='default'>Achievement</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface IntegratedDashboardProps {
  defaultTab?: string;
  onPlanCreate?: () => void;
  onEventCreate?: () => void;
  className?: string;
}

export function IntegratedDashboard({
  defaultTab = 'overview',
  onPlanCreate,
  onEventCreate,
  className = '',
}: IntegratedDashboardProps) {
  const t = useTranslations('workouts');

  // State management
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Workout reminder: Upper Body in 30 min', type: 'reminder' },
    { id: 2, text: 'Week goal: 1 more workout to reach target', type: 'goal' },
    { id: 3, text: 'New personal record achieved!', type: 'achievement' },
  ]);

  // Tab configuration
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Dashboard overview and quick actions',
    },
    {
      id: 'plans',
      label: 'Plan Manager',
      icon: Archive,
      description: 'Manage your workout plans',
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      description: 'Schedule and view workout sessions',
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: Archive,
      description: 'Browse and share workout templates',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Progress tracking and insights',
    },
  ];

  // Overview statistics
  const overviewStats = useMemo(
    () => ({
      totalPlans: 12,
      activePlans: 3,
      completedSessions: 47,
      upcomingSessions: 8,
      weeklyGoal: 5,
      weeklyProgress: 4,
      currentStreak: 12,
    }),
    []
  );

  // Handle quick actions
  const handleQuickAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'create-plan':
          onPlanCreate?.();
          break;
        case 'schedule-session':
          onEventCreate?.();
          break;
        case 'start-workout':
          // Navigate to session execution
          console.log('Starting workout...');
          break;
        case 'view-progress':
          setActiveTab('analytics');
          break;
      }
    },
    [onPlanCreate, onEventCreate]
  );

  // Render overview tab
  const renderOverview = () => (
    <div className='space-y-6'>
      {/* Welcome Header */}
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Workout Dashboard</h1>
          <p className='text-muted-foreground'>
            Manage your fitness journey and track progress
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform' />
            <Input
              placeholder='Search...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-64 pl-10'
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon' className='relative'>
                <Bell className='h-4 w-4' />
                {notifications.length > 0 && (
                  <Badge className='absolute -right-1 -top-1 h-5 w-5 p-0 text-xs'>
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-80'>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className='py-3'>
                  <div>
                    <p className='text-sm'>{notification.text}</p>
                    <p className='text-muted-foreground text-xs'>
                      {notification.type}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600'>
                <Archive className='h-5 w-5' />
              </div>
              <div>
                <p className='text-2xl font-bold'>
                  {overviewStats.activePlans}
                </p>
                <p className='text-muted-foreground text-sm'>Active Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600'>
                <Calendar className='h-5 w-5' />
              </div>
              <div>
                <p className='text-2xl font-bold'>
                  {overviewStats.upcomingSessions}
                </p>
                <p className='text-muted-foreground text-sm'>Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600'>
                <BarChart3 className='h-5 w-5' />
              </div>
              <div>
                <p className='text-2xl font-bold'>
                  {overviewStats.weeklyProgress}/{overviewStats.weeklyGoal}
                </p>
                <p className='text-muted-foreground text-sm'>This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600'>
                🔥
              </div>
              <div>
                <p className='text-2xl font-bold'>
                  {overviewStats.currentStreak}
                </p>
                <p className='text-muted-foreground text-sm'>Day Streak</p>
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
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <Button
              className='h-20 flex-col'
              onClick={() => handleQuickAction('create-plan')}
            >
              <Plus className='mb-2 h-6 w-6' />
              Create Plan
            </Button>

            <Button
              variant='outline'
              className='h-20 flex-col'
              onClick={() => handleQuickAction('schedule-session')}
            >
              <Calendar className='mb-2 h-6 w-6' />
              Schedule Session
            </Button>

            <Button
              variant='outline'
              className='h-20 flex-col'
              onClick={() => handleQuickAction('start-workout')}
            >
              <Archive className='mb-2 h-6 w-6' />
              Start Workout
            </Button>

            <Button
              variant='outline'
              className='h-20 flex-col'
              onClick={() => handleQuickAction('view-progress')}
            >
              <BarChart3 className='mb-2 h-6 w-6' />
              View Progress
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Upcoming Sessions */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest workouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm text-green-600'>
                  ✓
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Upper Body Strength</p>
                  <p className='text-muted-foreground text-xs'>
                    Completed today
                  </p>
                </div>
                <Badge variant='secondary' className='text-xs'>
                  75 min
                </Badge>
              </div>

              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-600'>
                  🏃
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Morning Cardio</p>
                  <p className='text-muted-foreground text-xs'>
                    Completed yesterday
                  </p>
                </div>
                <Badge variant='secondary' className='text-xs'>
                  45 min
                </Badge>
              </div>

              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm text-orange-600'>
                  💪
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Leg Day</p>
                  <p className='text-muted-foreground text-xs'>2 days ago</p>
                </div>
                <Badge variant='secondary' className='text-xs'>
                  90 min
                </Badge>
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
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-600'>
                  📅
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Lower Body Focus</p>
                  <p className='text-muted-foreground text-xs'>
                    Tomorrow at 9:00 AM
                  </p>
                </div>
                <Badge variant='outline' className='text-xs'>
                  90 min
                </Badge>
              </div>

              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm text-green-600'>
                  🧘
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Recovery Yoga</p>
                  <p className='text-muted-foreground text-xs'>
                    Saturday at 7:30 AM
                  </p>
                </div>
                <Badge variant='outline' className='text-xs'>
                  60 min
                </Badge>
              </div>

              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm text-purple-600'>
                  🎯
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>HIIT Training</p>
                  <p className='text-muted-foreground text-xs'>
                    Sunday at 6:00 PM
                  </p>
                </div>
                <Badge variant='outline' className='text-xs'>
                  45 min
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        {/* Tab Navigation */}
        <div className='mb-6 border-b'>
          <TabsList className='grid h-auto w-full grid-cols-5 p-1'>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className='flex flex-col items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm sm:flex-row'
              >
                <tab.icon className='h-4 w-4' />
                <div className='text-center sm:text-left'>
                  <div className='text-sm font-medium'>{tab.label}</div>
                  <div className='text-muted-foreground hidden text-xs sm:block'>
                    {tab.description}
                  </div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value='overview' className='mt-6'>
          {renderOverview()}
        </TabsContent>

        <TabsContent value='plans' className='mt-6'>
          <PlanManagementDashboard onCreatePlan={onPlanCreate} />
        </TabsContent>

        <TabsContent value='calendar' className='mt-6'>
          <WorkoutCalendar onEventCreate={onEventCreate} />
        </TabsContent>

        <TabsContent value='templates' className='mt-6'>
          <TemplateBrowser />
        </TabsContent>

        <TabsContent value='analytics' className='mt-6'>
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
