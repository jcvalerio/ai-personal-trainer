/**
 * Mobile-Optimized Dashboard Component
 * Touch-friendly interface with swipe gestures, pull-to-refresh, and mobile-first design
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  BarChart3,
  Library,
  User,
  Bell,
  Settings,
  ChevronRight,
  Play,
  Clock,
  Target,
  Zap,
  Star,
  Heart,
  Share,
  Download,
  X,
  Check,
  ArrowUp,
  Dumbbell,
  Trophy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { WorkoutPlan, WorkoutSession } from '@/types/workouts';
import { cn } from '@/lib/utils';

interface MobileOptimizedDashboardProps {
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
  user: {
    name: string;
    avatar?: string;
    currentPlan?: string;
    streak: number;
    level: number;
  };
  onPlanSelect: (planId: string) => void;
  onSessionStart: (sessionId: string) => void;
  onQuickAction: (action: string) => void;
  className?: string;
}

type TabValue = 'home' | 'plans' | 'calendar' | 'progress' | 'more';

interface SwipeHandler {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

// Custom hook for swipe gestures
function useSwipeGesture(
  handler: SwipeHandler,
  element?: React.RefObject<HTMLElement>
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    const target = element?.current || document;

    const onTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      const firstTouch = touchEvent.targetTouches[0];
      if (!firstTouch) return;

      touchEnd.current = null;
      touchStart.current = {
        x: firstTouch.clientX,
        y: firstTouch.clientY,
      };
    };

    const onTouchMove = (e: Event) => {
      const touchEvent = e as TouchEvent;
      const firstTouch = touchEvent.targetTouches[0];
      if (!firstTouch) return;

      touchEnd.current = {
        x: firstTouch.clientX,
        y: firstTouch.clientY,
      };
    };

    const onTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) {
        return;
      }

      const distanceX = touchStart.current.x - touchEnd.current.x;
      const distanceY = touchStart.current.y - touchEnd.current.y;

      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

      if (
        Math.abs(distanceX) < minSwipeDistance &&
        Math.abs(distanceY) < minSwipeDistance
      ) {
        return;
      }

      if (isHorizontalSwipe) {
        if (distanceX > 0 && handler.onSwipeLeft) {
          handler.onSwipeLeft();
        } else if (distanceX < 0 && handler.onSwipeRight) {
          handler.onSwipeRight();
        }
      } else {
        if (distanceY > 0 && handler.onSwipeUp) {
          handler.onSwipeUp();
        } else if (distanceY < 0 && handler.onSwipeDown) {
          handler.onSwipeDown();
        }
      }
    };

    target.addEventListener('touchstart', onTouchStart, { passive: true });
    target.addEventListener('touchmove', onTouchMove, { passive: true });
    target.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
    };
  }, [handler, element]);
}

// Pull-to-refresh hook
function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStart = useRef<number | null>(null);
  const refreshThreshold = 80;

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        const firstTouch = e.targetTouches[0];
        if (firstTouch) {
          touchStart.current = firstTouch.clientY;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStart.current && window.scrollY === 0) {
        const firstTouch = e.targetTouches[0];
        if (!firstTouch) return;
        const touchCurrent = firstTouch.clientY;
        const pullDist = touchCurrent - touchStart.current;

        if (pullDist > 0) {
          e.preventDefault();
          setPullDistance(Math.min(pullDist, 120));
        }
      }
    };

    const onTouchEnd = async () => {
      if (pullDistance > refreshThreshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        }
        setIsRefreshing(false);
      }
      setPullDistance(0);
      touchStart.current = null;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, pullDistance, refreshThreshold, isRefreshing]);

  return { isRefreshing, pullDistance };
}

export function MobileOptimizedDashboard({
  plans,
  sessions,
  user,
  onPlanSelect,
  onSessionStart,
  onQuickAction,
  className,
}: MobileOptimizedDashboardProps) {
  const t = useTranslations('workouts.mobile');

  const [activeTab, setActiveTab] = useState<TabValue>('home');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshAction = useCallback(async () => {
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    window.location.reload();
  }, []);

  const { isRefreshing, pullDistance } = usePullToRefresh(refreshAction);

  const swipeHandler = useSwipeGesture({
    onSwipeLeft: () => {
      const tabs: TabValue[] = [
        'home',
        'plans',
        'calendar',
        'progress',
        'more',
      ];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        const nextTab = tabs[currentIndex + 1];
        if (nextTab) {
          setActiveTab(nextTab);
        }
      }
    },
    onSwipeRight: () => {
      const tabs: TabValue[] = [
        'home',
        'plans',
        'calendar',
        'progress',
        'more',
      ];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        const prevTab = tabs[currentIndex - 1];
        if (prevTab) {
          setActiveTab(prevTab);
        }
      }
    },
  });

  // Today's sessions
  const todaySessions = sessions.filter((session) => {
    const today = new Date().toDateString();
    return new Date(session.scheduledDate).toDateString() === today;
  });

  // Active plan
  const activePlan = plans.find((plan) => plan.status === 'active');

  return (
    <div className={cn('min-h-screen bg-gray-50 pb-20', className)}>
      {/* Pull-to-refresh indicator */}
      <div
        className={cn(
          'fixed left-0 right-0 top-0 z-50 border-b bg-white transition-all duration-300',
          pullDistance > 0 ? 'translate-y-0' : '-translate-y-full'
        )}
        style={{ height: Math.min(pullDistance, 80) }}
      >
        <div className='flex h-full items-center justify-center'>
          {isRefreshing ? (
            <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600' />
          ) : (
            <ArrowUp
              className={cn(
                'h-6 w-6 text-blue-600 transition-transform duration-300',
                pullDistance > 60 && 'rotate-180'
              )}
            />
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <header className='sticky top-0 z-40 border-b border-gray-200 bg-white'>
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Avatar className='h-8 w-8'>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  {t('greeting', {
                    name: user.name.split(' ')[0] || user.name,
                  })}
                </p>
                <p className='text-xs text-gray-500'>
                  {user.streak} {t('dayStreak')} • {t('level')} {user.level}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowSearch(!showSearch)}
                className='p-2'
              >
                <Search className='h-5 w-5' />
              </Button>
              <Button variant='ghost' size='sm' className='p-2'>
                <Bell className='h-5 w-5' />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className='mt-3 flex items-center gap-2'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <input
                  type='text'
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full rounded-lg border-0 bg-gray-100 py-2 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500'
                  autoFocus
                />
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowSearch(false)}
                className='p-2'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Tab Content */}
      <main className='flex-1 overflow-y-auto'>
        {activeTab === 'home' && (
          <HomeTab
            user={user}
            activePlan={activePlan}
            todaySessions={todaySessions}
            onQuickAction={onQuickAction}
            onPlanSelect={onPlanSelect}
            onSessionStart={onSessionStart}
          />
        )}

        {activeTab === 'plans' && (
          <PlansTab
            plans={plans}
            onPlanSelect={onPlanSelect}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'calendar' && <CalendarTab sessions={sessions} />}

        {activeTab === 'progress' && <ProgressTab user={user} />}

        {activeTab === 'more' && <MoreTab onAction={onQuickAction} />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className='fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white'>
        <div className='grid grid-cols-5 py-2'>
          {[
            { key: 'home', icon: Dumbbell, label: t('tabs.home') },
            { key: 'plans', icon: Target, label: t('tabs.plans') },
            { key: 'calendar', icon: Calendar, label: t('tabs.calendar') },
            { key: 'progress', icon: BarChart3, label: t('tabs.progress') },
            { key: 'more', icon: MoreHorizontal, label: t('tabs.more') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabValue)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all duration-200 active:scale-95',
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className='h-5 w-5' />
              <span className='text-xs font-medium'>{tab.label}</span>
              {activeTab === tab.key && (
                <div className='absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full bg-blue-600' />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Floating Action Button */}
      <button
        onClick={() => onQuickAction('create')}
        className='fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-200 hover:bg-blue-700 active:scale-95'
      >
        <Plus className='h-6 w-6' />
      </button>
    </div>
  );
}

// Home Tab Component
function HomeTab({
  user,
  activePlan,
  todaySessions,
  onQuickAction,
  onPlanSelect,
  onSessionStart,
}: {
  user: any;
  activePlan?: WorkoutPlan;
  todaySessions: WorkoutSession[];
  onQuickAction: (action: string) => void;
  onPlanSelect: (planId: string) => void;
  onSessionStart: (sessionId: string) => void;
}) {
  const t = useTranslations('workouts.mobile');

  return (
    <div className='space-y-4 p-4'>
      {/* Quick Stats */}
      <Card>
        <CardContent className='p-4'>
          <div className='grid grid-cols-3 gap-4 text-center'>
            <div>
              <div className='text-2xl font-bold text-blue-600'>
                {user.streak}
              </div>
              <div className='text-xs text-gray-600'>
                {t('stats.dayStreak')}
              </div>
            </div>
            <div>
              <div className='text-2xl font-bold text-green-600'>
                {user.level}
              </div>
              <div className='text-xs text-gray-600'>{t('stats.level')}</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-orange-600'>
                {activePlan ? Math.round(Math.random() * 100) : 0}%
              </div>
              <div className='text-xs text-gray-600'>{t('stats.progress')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Plan */}
      {activePlan && (
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg'>{t('activePlan.title')}</CardTitle>
              <Badge variant='success'>{t('status.active')}</Badge>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='space-y-3'>
              <h3 className='font-semibold text-gray-900'>{activePlan.name}</h3>
              <p className='line-clamp-2 text-sm text-gray-600'>
                {activePlan.description}
              </p>

              <div className='grid grid-cols-2 gap-3'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Clock className='h-4 w-4' />
                  <span>{activePlan.estimatedSessionDuration}min</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Target className='h-4 w-4' />
                  <span>{activePlan.sessionsPerWeek}/week</span>
                </div>
              </div>

              <Progress value={65} variant='success' className='mt-3' />
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>
                  {t('progress.weeks', {
                    current: 3,
                    total: activePlan.durationWeeks,
                  })}
                </span>
                <span className='font-medium text-green-600'>65%</span>
              </div>

              <Button
                onClick={() => onPlanSelect(activePlan.id)}
                className='mt-3 w-full'
              >
                <Play className='mr-2 h-4 w-4' />
                {t('actions.continuePlan')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Sessions */}
      <div>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {t('todaySessions.title')}
          </h3>
          {todaySessions.length > 0 && (
            <Badge variant='outline'>{todaySessions.length}</Badge>
          )}
        </div>

        {todaySessions.length > 0 ? (
          <div className='space-y-3'>
            {todaySessions.map((session) => (
              <TouchFriendlySessionCard
                key={session.id}
                session={session}
                onStart={() => onSessionStart(session.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className='p-6 text-center'>
              <Calendar className='mx-auto mb-2 h-12 w-12 text-gray-400' />
              <p className='mb-3 text-gray-600'>{t('todaySessions.empty')}</p>
              <Button
                variant='outline'
                onClick={() => onQuickAction('schedule')}
              >
                {t('actions.scheduleWorkout')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>{t('quickActions.title')}</CardTitle>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='grid grid-cols-2 gap-3'>
            <Button
              variant='outline'
              className='h-auto flex-col gap-2 py-4'
              onClick={() => onQuickAction('generate')}
            >
              <Zap className='h-6 w-6 text-blue-600' />
              <span className='text-sm font-medium'>
                {t('actions.generateAI')}
              </span>
            </Button>

            <Button
              variant='outline'
              className='h-auto flex-col gap-2 py-4'
              onClick={() => onQuickAction('templates')}
            >
              <Library className='h-6 w-6 text-green-600' />
              <span className='text-sm font-medium'>
                {t('actions.browseTemplates')}
              </span>
            </Button>

            <Button
              variant='outline'
              className='h-auto flex-col gap-2 py-4'
              onClick={() => onQuickAction('create')}
            >
              <Plus className='h-6 w-6 text-orange-600' />
              <span className='text-sm font-medium'>
                {t('actions.createCustom')}
              </span>
            </Button>

            <Button
              variant='outline'
              className='h-auto flex-col gap-2 py-4'
              onClick={() => onQuickAction('progress')}
            >
              <Trophy className='h-6 w-6 text-purple-600' />
              <span className='text-sm font-medium'>
                {t('actions.viewProgress')}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Touch-friendly Session Card
function TouchFriendlySessionCard({
  session,
  onStart,
}: {
  session: WorkoutSession;
  onStart: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-orange-500';
      case 'scheduled':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <Card className='transition-transform duration-100 active:scale-[0.98]'>
      <CardContent className='p-4'>
        <div className='flex items-center gap-3'>
          <div
            className={cn(
              'h-3 w-3 rounded-full',
              getStatusColor(session.status)
            )}
          />

          <div className='min-w-0 flex-1'>
            <h4 className='truncate font-medium text-gray-900'>
              {session.name}
            </h4>
            <div className='mt-1 flex items-center gap-4 text-sm text-gray-500'>
              <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                <span>{session.scheduledTime || 'Anytime'}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Target className='h-3 w-3' />
                <span>{session.sessionData.estimatedDuration}min</span>
              </div>
            </div>
          </div>

          <Button size='sm' onClick={onStart} className='min-w-0'>
            <Play className='h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Placeholder components for other tabs
function PlansTab({ plans, onPlanSelect, searchQuery }: any) {
  const filteredPlans = searchQuery
    ? plans.filter((plan: WorkoutPlan) =>
        plan.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : plans;

  return (
    <div className='space-y-4 p-4'>
      {filteredPlans.map((plan: WorkoutPlan) => (
        <Card
          key={plan.id}
          className='transition-transform duration-100 active:scale-[0.98]'
        >
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='min-w-0 flex-1'>
                <h3 className='truncate font-semibold text-gray-900'>
                  {plan.name}
                </h3>
                <p className='line-clamp-2 text-sm text-gray-600'>
                  {plan.description}
                </p>
              </div>
              <Button size='sm' onClick={() => onPlanSelect(plan.id)}>
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CalendarTab({ sessions }: any) {
  return (
    <div className='p-4'>
      <Card>
        <CardContent className='p-8 text-center'>
          <Calendar className='mx-auto mb-4 h-16 w-16 text-gray-400' />
          <h3 className='mb-2 text-lg font-semibold text-gray-900'>
            Calendar View
          </h3>
          <p className='text-gray-600'>Mobile calendar coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressTab({ user }: any) {
  return (
    <div className='space-y-4 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <div className='mb-2 flex justify-between'>
                <span className='text-sm font-medium'>Strength Gains</span>
                <span className='text-sm text-green-600'>+12%</span>
              </div>
              <Progress value={75} variant='success' />
            </div>
            <div>
              <div className='mb-2 flex justify-between'>
                <span className='text-sm font-medium'>Consistency</span>
                <span className='text-sm text-blue-600'>85%</span>
              </div>
              <Progress value={85} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MoreTab({ onAction }: any) {
  const menuItems = [
    { icon: User, label: 'Profile', action: 'profile' },
    { icon: Settings, label: 'Settings', action: 'settings' },
    { icon: Bell, label: 'Notifications', action: 'notifications' },
    { icon: Share, label: 'Share App', action: 'share' },
    { icon: Download, label: 'Export Data', action: 'export' },
  ];

  return (
    <div className='space-y-2 p-4'>
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => onAction(item.action)}
          className='flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-transform duration-100 active:scale-[0.98]'
        >
          <item.icon className='h-5 w-5 text-gray-600' />
          <span className='font-medium text-gray-900'>{item.label}</span>
          <ChevronRight className='ml-auto h-4 w-4 text-gray-400' />
        </button>
      ))}
    </div>
  );
}
