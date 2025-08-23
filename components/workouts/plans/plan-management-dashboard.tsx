/**
 * Plan Management Dashboard Component
 * Comprehensive CRUD interface for workout plans with modern UX patterns
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar as CalendarIcon,
  Star,
  Copy,
  Edit,
  Trash2,
  Play,
  Pause,
  MoreVertical,
  Eye,
  Share,
  Download,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkoutCard } from '@/components/workouts/workout-card';
import type { WorkoutPlan, WorkoutStatus } from '@/types/workouts';
import { cn } from '@/lib/utils';

interface PlanManagementDashboardProps {
  plans: WorkoutPlan[];
  onCreatePlan: () => void;
  onEditPlan: (planId: string) => void;
  onDeletePlan: (planId: string) => void;
  onDuplicatePlan: (planId: string) => void;
  onSharePlan: (planId: string) => void;
  onStartPlan: (planId: string) => void;
  onPausePlan: (planId: string) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list' | 'calendar';
type SortOption = 'recent' | 'name' | 'status' | 'duration' | 'created';

export function PlanManagementDashboard({
  plans,
  onCreatePlan,
  onEditPlan,
  onDeletePlan,
  onDuplicatePlan,
  onSharePlan,
  onStartPlan,
  onPausePlan,
  className,
}: PlanManagementDashboardProps) {
  const t = useTranslations('workouts.plans');

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<WorkoutStatus | 'all'>(
    'all'
  );
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());

  // Filter and sort plans
  const filteredPlans = useMemo(() => {
    let filtered = plans;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (plan) =>
          plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plan.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plan.fitnessGoals.some((goal) =>
            goal.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((plan) => plan.status === selectedStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'duration':
          return b.durationWeeks - a.durationWeeks;
        case 'created':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'recent':
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });

    return filtered;
  }, [plans, searchQuery, selectedStatus, sortBy]);

  // Plan stats
  const planStats = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((p) => p.status === 'active').length,
      draft: plans.filter((p) => p.status === 'draft').length,
      completed: plans.filter((p) => p.status === 'completed').length,
      paused: plans.filter((p) => p.status === 'paused').length,
      templates: plans.filter((p) => p.isTemplate).length,
    }),
    [plans]
  );

  const handleSelectPlan = useCallback((planId: string, selected: boolean) => {
    setSelectedPlans((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(planId);
      } else {
        newSet.delete(planId);
      }
      return newSet;
    });
  }, []);

  const handleBulkAction = useCallback(
    (action: string) => {
      console.log(
        'Bulk action:',
        action,
        'on plans:',
        Array.from(selectedPlans)
      );
      // Implement bulk actions
    },
    [selectedPlans]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Stats */}
      <div className='flex flex-col space-y-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>
              {t('management.title')}
            </h2>
            <p className='text-gray-600'>{t('management.subtitle')}</p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={onCreatePlan}>
              <Plus className='mr-2 h-4 w-4' />
              {t('actions.create')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-2 gap-4 md:grid-cols-6'>
          <Card className='border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100'>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold text-blue-700'>
                {planStats.total}
              </div>
              <div className='text-sm text-blue-600'>{t('stats.total')}</div>
            </CardContent>
          </Card>
          <Card className='border-green-200 bg-gradient-to-r from-green-50 to-green-100'>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold text-green-700'>
                {planStats.active}
              </div>
              <div className='text-sm text-green-600'>{t('stats.active')}</div>
            </CardContent>
          </Card>
          <Card className='border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100'>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold text-yellow-700'>
                {planStats.draft}
              </div>
              <div className='text-sm text-yellow-600'>{t('stats.drafts')}</div>
            </CardContent>
          </Card>
          <Card className='border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100'>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold text-purple-700'>
                {planStats.completed}
              </div>
              <div className='text-sm text-purple-600'>
                {t('stats.completed')}
              </div>
            </CardContent>
          </Card>
          <Card className='border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100'>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold text-orange-700'>
                {planStats.paused}
              </div>
              <div className='text-sm text-orange-600'>{t('stats.paused')}</div>
            </CardContent>
          </Card>
          <Card className='border-indigo-200 bg-gradient-to-r from-indigo-50 to-indigo-100'>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold text-indigo-700'>
                {planStats.templates}
              </div>
              <div className='text-sm text-indigo-600'>
                {t('stats.templates')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        {/* Search */}
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
          <Input
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>

        {/* Status Filter */}
        <Select
          value={selectedStatus}
          onValueChange={(value) =>
            setSelectedStatus(value as WorkoutStatus | 'all')
          }
        >
          <SelectTrigger className='w-48'>
            <Filter className='mr-2 h-4 w-4' />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('filters.all')}</SelectItem>
            <SelectItem value='active'>{t('filters.active')}</SelectItem>
            <SelectItem value='draft'>{t('filters.draft')}</SelectItem>
            <SelectItem value='completed'>{t('filters.completed')}</SelectItem>
            <SelectItem value='paused'>{t('filters.paused')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as SortOption)}
        >
          <SelectTrigger className='w-48'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='recent'>{t('sort.recent')}</SelectItem>
            <SelectItem value='name'>{t('sort.name')}</SelectItem>
            <SelectItem value='status'>{t('sort.status')}</SelectItem>
            <SelectItem value='duration'>{t('sort.duration')}</SelectItem>
            <SelectItem value='created'>{t('sort.created')}</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode */}
        <div className='flex rounded-lg border'>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('grid')}
            className='rounded-r-none border-r-0'
          >
            <Grid3X3 className='h-4 w-4' />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('list')}
            className='rounded-none border-r-0'
          >
            <List className='h-4 w-4' />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('calendar')}
            className='rounded-l-none'
          >
            <CalendarIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPlans.size > 0 && (
        <Card className='border-blue-200 bg-blue-50 p-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-medium text-blue-900'>
              {selectedPlans.size} {t('selected.plans')}
            </div>
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleBulkAction('export')}
              >
                <Download className='mr-2 h-4 w-4' />
                {t('bulk.export')}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleBulkAction('share')}
              >
                <Share className='mr-2 h-4 w-4' />
                {t('bulk.share')}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleBulkAction('delete')}
              >
                <Trash2 className='mr-2 h-4 w-4' />
                {t('bulk.delete')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Plans Display */}
      <div className='space-y-4'>
        {viewMode === 'grid' && (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {filteredPlans.map((plan) => (
              <EnhancedPlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlans.has(plan.id)}
                onSelect={(selected) => handleSelectPlan(plan.id, selected)}
                onEdit={() => onEditPlan(plan.id)}
                onDelete={() => onDeletePlan(plan.id)}
                onDuplicate={() => onDuplicatePlan(plan.id)}
                onShare={() => onSharePlan(plan.id)}
                onStart={() => onStartPlan(plan.id)}
                onPause={() => onPausePlan(plan.id)}
              />
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className='space-y-4'>
            {filteredPlans.map((plan) => (
              <PlanListItem
                key={plan.id}
                plan={plan}
                selected={selectedPlans.has(plan.id)}
                onSelect={(selected) => handleSelectPlan(plan.id, selected)}
                onEdit={() => onEditPlan(plan.id)}
                onDelete={() => onDeletePlan(plan.id)}
                onDuplicate={() => onDuplicatePlan(plan.id)}
                onShare={() => onSharePlan(plan.id)}
                onStart={() => onStartPlan(plan.id)}
                onPause={() => onPausePlan(plan.id)}
              />
            ))}
          </div>
        )}

        {viewMode === 'calendar' && <PlanCalendarView plans={filteredPlans} />}
      </div>

      {/* Empty State */}
      {filteredPlans.length === 0 && (
        <div className='py-16 text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
            <Search className='h-8 w-8 text-gray-400' />
          </div>
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            {searchQuery || selectedStatus !== 'all'
              ? t('empty.noResults')
              : t('empty.noPlans')}
          </h3>
          <p className='mx-auto mb-6 max-w-md text-gray-600'>
            {searchQuery || selectedStatus !== 'all'
              ? t('empty.tryDifferentFilters')
              : t('empty.createFirstPlan')}
          </p>
          <div className='flex justify-center gap-3'>
            {searchQuery || selectedStatus !== 'all' ? (
              <Button
                variant='outline'
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                }}
              >
                {t('actions.clearFilters')}
              </Button>
            ) : (
              <>
                <Button onClick={onCreatePlan}>
                  <Plus className='mr-2 h-4 w-4' />
                  {t('actions.create')}
                </Button>
                <Button variant='outline'>
                  {t('actions.browseTemplates')}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced Plan Card with additional actions
function EnhancedPlanCard({
  plan,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  onStart,
  onPause,
}: {
  plan: WorkoutPlan;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onStart: () => void;
  onPause: () => void;
}) {
  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-lg',
        selected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-3'>
            <input
              type='checkbox'
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              className='mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
              onClick={(e) => e.stopPropagation()}
            />
            <div className='flex-1'>
              <CardTitle className='text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600'>
                {plan.name}
              </CardTitle>
              {plan.description && (
                <p className='mt-1 line-clamp-2 text-sm text-gray-600'>
                  {plan.description}
                </p>
              )}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant={plan.status === 'active' ? 'success' : 'outline'}>
              {plan.status}
            </Badge>
            <PlanActionMenu
              plan={plan}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onShare={onShare}
              onStart={onStart}
              onPause={onPause}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Plan details */}
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <CalendarIcon className='h-4 w-4' />
              <span>{plan.durationWeeks} weeks</span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <span>{plan.sessionsPerWeek}/week</span>
            </div>
          </div>

          {plan.fitnessGoals && (
            <div className='flex flex-wrap gap-1'>
              {plan.fitnessGoals.slice(0, 3).map((goal, index) => (
                <Badge key={index} variant='outline' className='text-xs'>
                  {goal}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Plan List Item for list view
function PlanListItem({
  plan,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  onStart,
  onPause,
}: {
  plan: WorkoutPlan;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onStart: () => void;
  onPause: () => void;
}) {
  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-blue-500'
      )}
    >
      <CardContent className='p-4'>
        <div className='flex items-center gap-4'>
          <input
            type='checkbox'
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
          />

          <div className='min-w-0 flex-1'>
            <div className='mb-2 flex items-center gap-3'>
              <h3 className='truncate font-semibold text-gray-900'>
                {plan.name}
              </h3>
              <Badge variant={plan.status === 'active' ? 'success' : 'outline'}>
                {plan.status}
              </Badge>
            </div>

            <p className='mb-2 truncate text-sm text-gray-600'>
              {plan.description}
            </p>

            <div className='flex items-center gap-4 text-xs text-gray-500'>
              <span>{plan.durationWeeks} weeks</span>
              <span>{plan.sessionsPerWeek}/week</span>
              <span>{plan.targetFitnessLevel}</span>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <PlanActionMenu
              plan={plan}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onShare={onShare}
              onStart={onStart}
              onPause={onPause}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Action Menu Component
function PlanActionMenu({
  plan,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  onStart,
  onPause,
}: {
  plan: WorkoutPlan;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onStart: () => void;
  onPause: () => void;
}) {
  return (
    <div className='flex items-center gap-1'>
      {plan.status === 'active' ? (
        <Button size='sm' variant='outline' onClick={onPause}>
          <Pause className='h-4 w-4' />
        </Button>
      ) : plan.status === 'paused' ? (
        <Button size='sm' variant='default' onClick={onStart}>
          <Play className='h-4 w-4' />
        </Button>
      ) : (
        <Button size='sm' variant='default' onClick={onStart}>
          <Play className='h-4 w-4' />
        </Button>
      )}

      <Button size='sm' variant='outline' onClick={onEdit}>
        <Edit className='h-4 w-4' />
      </Button>

      <Button size='sm' variant='outline' onClick={onDuplicate}>
        <Copy className='h-4 w-4' />
      </Button>

      {/* More actions dropdown would go here */}
    </div>
  );
}

// Placeholder for calendar view
function PlanCalendarView({ plans }: { plans: WorkoutPlan[] }) {
  return (
    <Card>
      <CardContent className='p-8 text-center'>
        <CalendarIcon className='mx-auto mb-4 h-16 w-16 text-gray-400' />
        <h3 className='mb-2 text-lg font-semibold text-gray-900'>
          Calendar View
        </h3>
        <p className='text-gray-600'>
          Calendar view with drag-and-drop scheduling coming in the next design
          iteration.
        </p>
      </CardContent>
    </Card>
  );
}
