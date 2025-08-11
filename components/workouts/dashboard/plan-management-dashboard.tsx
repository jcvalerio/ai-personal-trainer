/**
 * Plan Management Dashboard Component
 * Comprehensive CRUD operations for workout plan management with modern UX
 */
'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Archive, 
  Copy, 
  Share2, 
  Edit, 
  Trash2,
  Star,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Download
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { WorkoutPlan } from '@/types/workouts'

// Enhanced WorkoutPlan type for dashboard management
interface DashboardWorkoutPlan extends WorkoutPlan {
  // Management metadata
  lastAccessed?: Date
  completionRate: number
  totalSessions: number
  completedSessions: number
  averageRating?: number
  createdBy: {
    id: string
    name: string
    avatar?: string
  }
  
  // Analytics
  stats: {
    totalWorkouts: number
    avgDuration: number
    popularityScore: number
    successRate: number
  }
  
  // Social features
  isShared: boolean
  shareCount: number
  likeCount: number
  commentCount: number
}

type PlanStatus = 'active' | 'draft' | 'paused' | 'completed' | 'archived'
type ViewMode = 'grid' | 'list'
type SortOption = 'name' | 'created' | 'modified' | 'popularity' | 'completion'

interface PlanFilters {
  status: PlanStatus[]
  fitnessLevel: string[]
  goals: string[]
  duration: {
    min?: number
    max?: number
  }
  sessionsPerWeek: {
    min?: number
    max?: number
  }
  tags: string[]
}

interface PlanManagementDashboardProps {
  initialPlans?: DashboardWorkoutPlan[]
  onCreatePlan?: () => void
  onEditPlan?: (planId: string) => void
  onDeletePlan?: (planId: string) => void
  onDuplicatePlan?: (planId: string) => void
  onSharePlan?: (planId: string) => void
  onStartPlan?: (planId: string) => void
  onPausePlan?: (planId: string) => void
  onArchivePlan?: (planId: string) => void
  className?: string
}

// Mock data for demonstration
const mockPlans: DashboardWorkoutPlan[] = [
  {
    id: '1',
    userId: 'user1',
    name: 'Summer Body Challenge',
    description: 'Intensive 12-week program designed to build lean muscle and improve cardiovascular fitness',
    durationWeeks: 12,
    sessionsPerWeek: 4,
    fitnessGoals: ['muscle_gain', 'fat_loss', 'strength'],
    targetFitnessLevel: 'intermediate',
    estimatedSessionDuration: 75,
    status: 'active',
    planData: { summary: '', phases: [], progressionStrategy: '' },
    weeklySchedule: {},
    version: 1,
    isTemplate: false,
    isPublic: false,
    isFeatured: false,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
    lastAccessed: new Date('2024-02-10'),
    completionRate: 67,
    totalSessions: 48,
    completedSessions: 32,
    averageRating: 4.6,
    createdBy: {
      id: 'user1',
      name: 'Alex Johnson',
      avatar: '/avatars/alex.jpg'
    },
    stats: {
      totalWorkouts: 32,
      avgDuration: 72,
      popularityScore: 8.5,
      successRate: 85
    },
    isShared: true,
    shareCount: 15,
    likeCount: 28,
    commentCount: 12
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Morning Energy Boost',
    description: 'Quick 30-minute morning routines to energize your day',
    durationWeeks: 4,
    sessionsPerWeek: 5,
    fitnessGoals: ['cardio', 'endurance', 'general_fitness'],
    targetFitnessLevel: 'beginner',
    estimatedSessionDuration: 30,
    status: 'draft',
    planData: { summary: '', phases: [], progressionStrategy: '' },
    weeklySchedule: {},
    version: 1,
    isTemplate: false,
    isPublic: false,
    isFeatured: false,
    isActive: true,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-08'),
    completionRate: 0,
    totalSessions: 20,
    completedSessions: 0,
    createdBy: {
      id: 'user1',
      name: 'Alex Johnson',
      avatar: '/avatars/alex.jpg'
    },
    stats: {
      totalWorkouts: 0,
      avgDuration: 30,
      popularityScore: 0,
      successRate: 0
    },
    isShared: false,
    shareCount: 0,
    likeCount: 0,
    commentCount: 0
  },
  {
    id: '3',
    userId: 'user1',
    name: 'Strength Foundation',
    description: 'Build a solid strength base with compound movements and progressive overload',
    durationWeeks: 8,
    sessionsPerWeek: 3,
    fitnessGoals: ['strength', 'muscle_gain'],
    targetFitnessLevel: 'intermediate',
    estimatedSessionDuration: 90,
    status: 'completed',
    planData: { summary: '', phases: [], progressionStrategy: '' },
    weeklySchedule: {},
    version: 1,
    isTemplate: true,
    isPublic: true,
    isFeatured: true,
    isActive: true,
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-01-15'),
    lastAccessed: new Date('2024-01-20'),
    completionRate: 100,
    totalSessions: 24,
    completedSessions: 24,
    averageRating: 4.8,
    createdBy: {
      id: 'user1',
      name: 'Alex Johnson',
      avatar: '/avatars/alex.jpg'
    },
    stats: {
      totalWorkouts: 24,
      avgDuration: 87,
      popularityScore: 9.2,
      successRate: 96
    },
    isShared: true,
    shareCount: 45,
    likeCount: 89,
    commentCount: 34
  }
]

export function PlanManagementDashboard({
  initialPlans = mockPlans,
  onCreatePlan,
  onEditPlan,
  onDeletePlan,
  onDuplicatePlan,
  onSharePlan,
  onStartPlan,
  onPausePlan,
  onArchivePlan,
  className = ''
}: PlanManagementDashboardProps) {
  const t = useTranslations('workouts.dashboard')
  
  // State management
  const [plans, setPlans] = useState<DashboardWorkoutPlan[]>(initialPlans)
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('modified')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const [filters, setFilters] = useState<PlanFilters>({
    status: [],
    fitnessLevel: [],
    goals: [],
    duration: {},
    sessionsPerWeek: {},
    tags: []
  })

  // Filter and sort plans
  const filteredAndSortedPlans = useMemo(() => {
    const filtered = plans.filter(plan => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!plan.name.toLowerCase().includes(query) && 
            !plan.description.toLowerCase().includes(query)) {
          return false
        }
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(plan.status as PlanStatus)) {
        return false
      }

      // Fitness level filter
      if (filters.fitnessLevel.length > 0 && !filters.fitnessLevel.includes(plan.targetFitnessLevel)) {
        return false
      }

      // Goals filter
      if (filters.goals.length > 0) {
        const hasMatchingGoal = plan.fitnessGoals.some(goal => filters.goals.includes(goal))
        if (!hasMatchingGoal) {
          return false
        }
      }

      // Duration filter
      if (filters.duration.min !== undefined && plan.durationWeeks < filters.duration.min) {
        return false
      }
      if (filters.duration.max !== undefined && plan.durationWeeks > filters.duration.max) {
        return false
      }

      // Sessions per week filter
      if (filters.sessionsPerWeek.min !== undefined && plan.sessionsPerWeek < filters.sessionsPerWeek.min) {
        return false
      }
      if (filters.sessionsPerWeek.max !== undefined && plan.sessionsPerWeek > filters.sessionsPerWeek.max) {
        return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'modified':
          aValue = a.updatedAt.getTime()
          bValue = b.updatedAt.getTime()
          break
        case 'popularity':
          aValue = a.stats.popularityScore
          bValue = b.stats.popularityScore
          break
        case 'completion':
          aValue = a.completionRate
          bValue = b.completionRate
          break
        default:
          aValue = a.updatedAt.getTime()
          bValue = b.updatedAt.getTime()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [plans, searchQuery, filters, sortBy, sortOrder])

  // Plan statistics
  const planStats = useMemo(() => {
    const total = plans.length
    const active = plans.filter(p => p.status === 'active').length
    const completed = plans.filter(p => p.status === 'completed').length
    const draft = plans.filter(p => p.status === 'draft').length
    const avgCompletion = plans.reduce((sum, p) => sum + p.completionRate, 0) / (total || 1)
    
    return {
      total,
      active,
      completed,
      draft,
      avgCompletion: Math.round(avgCompletion)
    }
  }, [plans])

  // Plan action handlers
  const handleSelectPlan = useCallback((planId: string) => {
    setSelectedPlans(prev => 
      prev.includes(planId) 
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    )
  }, [])

  const handleSelectAllPlans = useCallback(() => {
    if (selectedPlans.length === filteredAndSortedPlans.length) {
      setSelectedPlans([])
    } else {
      setSelectedPlans(filteredAndSortedPlans.map(p => p.id))
    }
  }, [selectedPlans, filteredAndSortedPlans])

  const handleBulkAction = useCallback((action: string) => {
    console.log(`Bulk action: ${action} on plans:`, selectedPlans)
    // Implement bulk actions
    setSelectedPlans([])
  }, [selectedPlans])

  const handlePlanAction = useCallback((planId: string, action: string) => {
    console.log(`Plan action: ${action} on plan: ${planId}`)
    
    switch (action) {
      case 'start':
        onStartPlan?.(planId)
        break
      case 'pause':
        onPausePlan?.(planId)
        break
      case 'edit':
        onEditPlan?.(planId)
        break
      case 'duplicate':
        onDuplicatePlan?.(planId)
        break
      case 'share':
        onSharePlan?.(planId)
        break
      case 'archive':
        onArchivePlan?.(planId)
        break
      case 'delete':
        onDeletePlan?.(planId)
        break
    }
  }, [onStartPlan, onPausePlan, onEditPlan, onDuplicatePlan, onSharePlan, onArchivePlan, onDeletePlan])

  // Status badge styling
  const getStatusBadge = (status: PlanStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>
      case 'draft':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Edit className="w-3 h-3 mr-1" />Draft</Badge>
      case 'paused':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800"><Pause className="w-3 h-3 mr-1" />Paused</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>
      case 'archived':
        return <Badge variant="outline" className="bg-gray-100 text-gray-600"><Archive className="w-3 h-3 mr-1" />Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Render plan card (grid view)
  const renderPlanCard = (plan: DashboardWorkoutPlan) => (
    <Card key={plan.id} className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={selectedPlans.includes(plan.id)}
              onCheckedChange={() => handleSelectPlan(plan.id)}
            />
            <div>
              <CardTitle className="text-lg leading-tight">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handlePlanAction(plan.id, 'start')}>
                <Play className="w-4 h-4 mr-2" />Start Plan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePlanAction(plan.id, 'edit')}>
                <Edit className="w-4 h-4 mr-2" />Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePlanAction(plan.id, 'duplicate')}>
                <Copy className="w-4 h-4 mr-2" />Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePlanAction(plan.id, 'share')}>
                <Share2 className="w-4 h-4 mr-2" />Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handlePlanAction(plan.id, 'archive')}>
                <Archive className="w-4 h-4 mr-2" />Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handlePlanAction(plan.id, 'delete')}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          {getStatusBadge(plan.status as PlanStatus)}
          {plan.isFeatured && <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{plan.durationWeeks} weeks</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{plan.sessionsPerWeek}/week</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span>{plan.targetFitnessLevel}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span>{plan.completionRate}% done</span>
          </div>
        </div>

        {plan.completionRate > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{plan.completedSessions}/{plan.totalSessions} sessions</span>
            </div>
            <Progress value={plan.completionRate} className="h-2" />
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-4">
          {plan.fitnessGoals.slice(0, 3).map(goal => (
            <Badge key={goal} variant="secondary" className="text-xs">{goal.replace('_', ' ')}</Badge>
          ))}
          {plan.fitnessGoals.length > 3 && (
            <Badge variant="secondary" className="text-xs">+{plan.fitnessGoals.length - 3}</Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {plan.isShared && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{plan.shareCount}</span>
              </div>
            )}
            {plan.averageRating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current text-yellow-500" />
                <span>{plan.averageRating}</span>
              </div>
            )}
          </div>
          <span>Modified {plan.updatedAt.toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )

  // Render plan row (list view)
  const renderPlanRow = (plan: DashboardWorkoutPlan) => (
    <div key={plan.id} className="flex items-center gap-4 p-4 border-b hover:bg-gray-50 group">
      <Checkbox 
        checked={selectedPlans.includes(plan.id)}
        onCheckedChange={() => handleSelectPlan(plan.id)}
      />
      
      <div className="flex-1 grid grid-cols-6 gap-4 items-center">
        <div>
          <div className="font-medium">{plan.name}</div>
          <div className="text-sm text-muted-foreground truncate">{plan.description}</div>
        </div>
        
        <div>
          {getStatusBadge(plan.status as PlanStatus)}
        </div>
        
        <div className="text-sm">
          <div>{plan.durationWeeks} weeks</div>
          <div className="text-muted-foreground">{plan.sessionsPerWeek} sessions/week</div>
        </div>
        
        <div className="text-sm">
          <div>{plan.completionRate}% complete</div>
          <div className="text-muted-foreground">{plan.completedSessions}/{plan.totalSessions} sessions</div>
        </div>
        
        <div className="text-sm">
          <div>{plan.targetFitnessLevel}</div>
          <div className="text-muted-foreground">{plan.fitnessGoals.slice(0, 2).join(', ')}</div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {plan.updatedAt.toLocaleDateString()}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handlePlanAction(plan.id, 'start')}>
            <Play className="w-4 h-4 mr-2" />Start Plan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePlanAction(plan.id, 'edit')}>
            <Edit className="w-4 h-4 mr-2" />Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePlanAction(plan.id, 'duplicate')}>
            <Copy className="w-4 h-4 mr-2" />Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePlanAction(plan.id, 'share')}>
            <Share2 className="w-4 h-4 mr-2" />Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handlePlanAction(plan.id, 'archive')}>
            <Archive className="w-4 h-4 mr-2" />Archive
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handlePlanAction(plan.id, 'delete')}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with statistics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Plan Management</h1>
          <p className="text-muted-foreground">Manage your workout plans and track progress</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg">{planStats.total}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-green-600">{planStats.active}</div>
              <div className="text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-blue-600">{planStats.completed}</div>
              <div className="text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{planStats.avgCompletion}%</div>
              <div className="text-muted-foreground">Avg Progress</div>
            </div>
          </div>
          
          <Button onClick={onCreatePlan}>
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modified">Modified</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="completion">Completion</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['active', 'draft', 'paused', 'completed', 'archived'] as PlanStatus[]).map(status => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status.includes(status)}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      status: checked 
                        ? [...prev.status, status]
                        : prev.status.filter(s => s !== status)
                    }))
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPlans.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{selectedPlans.length} plan{selectedPlans.length > 1 ? 's' : ''} selected</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('share')}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Plans Display */}
      {filteredAndSortedPlans.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No plans found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : Object.keys(f).length > 0)
              ? 'Try adjusting your search or filters'
              : 'Create your first workout plan to get started'
            }
          </p>
          <Button onClick={onCreatePlan}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Plan
          </Button>
        </div>
      ) : (
        <>
          {/* Table header for list view */}
          {viewMode === 'list' && (
            <div className="flex items-center gap-4 p-4 border-b bg-gray-50 rounded-t-lg">
              <Checkbox 
                checked={selectedPlans.length === filteredAndSortedPlans.length}
                onCheckedChange={handleSelectAllPlans}
              />
              
              <div className="flex-1 grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground">
                <div>Name & Description</div>
                <div>Status</div>
                <div>Duration</div>
                <div>Progress</div>
                <div>Level & Goals</div>
                <div>Modified</div>
              </div>
              
              <div className="w-10"></div> {/* Actions column */}
            </div>
          )}

          {/* Plans Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedPlans.map(renderPlanCard)}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {filteredAndSortedPlans.map(renderPlanRow)}
            </div>
          )}
        </>
      )}
    </div>
  )
}