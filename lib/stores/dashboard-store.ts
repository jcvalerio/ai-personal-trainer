/**
 * Dashboard State Management Store
 * Zustand-based store for managing dashboard state, filters, and interactions
 */
'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WorkoutPlan, WorkoutSession } from '@/types/workouts'

// Dashboard View Types
export type ViewMode = 'grid' | 'list' | 'calendar'
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'
export type TabValue = 'overview' | 'plans' | 'sessions' | 'templates' | 'progress' | 'analytics'
export type SortOption = 'recent' | 'name' | 'status' | 'duration' | 'created' | 'popular' | 'rating'

// Filter State
interface FilterState {
  searchQuery: string
  selectedStatus: string
  selectedDifficulty: string
  selectedCategory: string
  sortBy: SortOption
  viewMode: ViewMode
  timeRange: TimeRange
}

// UI State
interface UIState {
  activeTab: TabValue
  showFilters: boolean
  showSearch: boolean
  sidebarCollapsed: boolean
  isMobile: boolean
}

// Selection State
interface SelectionState {
  selectedPlans: Set<string>
  selectedSessions: Set<string>
  selectedTemplates: Set<string>
}

// Dashboard Store Interface
interface DashboardStore {
  // State
  filters: FilterState
  ui: UIState
  selection: SelectionState
  favorites: Set<string>
  
  // Actions
  setSearchQuery: (query: string) => void
  setSelectedStatus: (status: string) => void
  setSelectedDifficulty: (difficulty: string) => void
  setSelectedCategory: (category: string) => void
  setSortBy: (sort: SortOption) => void
  setViewMode: (mode: ViewMode) => void
  setTimeRange: (range: TimeRange) => void
  setActiveTab: (tab: TabValue) => void
  toggleFilters: () => void
  toggleSearch: () => void
  toggleSidebar: () => void
  setIsMobile: (mobile: boolean) => void
  
  // Selection actions
  togglePlanSelection: (planId: string) => void
  toggleSessionSelection: (sessionId: string) => void
  toggleTemplateSelection: (templateId: string) => void
  clearSelections: () => void
  selectAllPlans: (planIds: string[]) => void
  selectAllSessions: (sessionIds: string[]) => void
  
  // Favorites
  toggleFavorite: (id: string) => void
  isFavorited: (id: string) => boolean
  
  // Reset actions
  resetFilters: () => void
  resetAll: () => void
  
  // Computed getters
  getFilteredPlans: (plans: WorkoutPlan[]) => WorkoutPlan[]
  getFilteredSessions: (sessions: WorkoutSession[]) => WorkoutSession[]
  hasActiveFilters: () => boolean
  getSelectionCount: () => { plans: number; sessions: number; templates: number }
}

// Default filter state
const defaultFilters: FilterState = {
  searchQuery: '',
  selectedStatus: 'all',
  selectedDifficulty: 'all',
  selectedCategory: 'all',
  sortBy: 'recent',
  viewMode: 'grid',
  timeRange: '30d'
}

// Default UI state
const defaultUI: UIState = {
  activeTab: 'overview',
  showFilters: false,
  showSearch: false,
  sidebarCollapsed: false,
  isMobile: false
}

// Create the store
export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // Initial state
      filters: defaultFilters,
      ui: defaultUI,
      selection: {
        selectedPlans: new Set(),
        selectedSessions: new Set(),
        selectedTemplates: new Set()
      },
      favorites: new Set(),

      // Filter actions
      setSearchQuery: (query) => 
        set((state) => ({
          filters: { ...state.filters, searchQuery: query }
        })),

      setSelectedStatus: (status) =>
        set((state) => ({
          filters: { ...state.filters, selectedStatus: status }
        })),

      setSelectedDifficulty: (difficulty) =>
        set((state) => ({
          filters: { ...state.filters, selectedDifficulty: difficulty }
        })),

      setSelectedCategory: (category) =>
        set((state) => ({
          filters: { ...state.filters, selectedCategory: category }
        })),

      setSortBy: (sort) =>
        set((state) => ({
          filters: { ...state.filters, sortBy: sort }
        })),

      setViewMode: (mode) =>
        set((state) => ({
          filters: { ...state.filters, viewMode: mode }
        })),

      setTimeRange: (range) =>
        set((state) => ({
          filters: { ...state.filters, timeRange: range }
        })),

      // UI actions
      setActiveTab: (tab) =>
        set((state) => ({
          ui: { ...state.ui, activeTab: tab }
        })),

      toggleFilters: () =>
        set((state) => ({
          ui: { ...state.ui, showFilters: !state.ui.showFilters }
        })),

      toggleSearch: () =>
        set((state) => ({
          ui: { ...state.ui, showSearch: !state.ui.showSearch }
        })),

      toggleSidebar: () =>
        set((state) => ({
          ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed }
        })),

      setIsMobile: (mobile) =>
        set((state) => ({
          ui: { ...state.ui, isMobile: mobile }
        })),

      // Selection actions
      togglePlanSelection: (planId) =>
        set((state) => {
          const newSelection = new Set(state.selection.selectedPlans)
          if (newSelection.has(planId)) {
            newSelection.delete(planId)
          } else {
            newSelection.add(planId)
          }
          return {
            selection: { ...state.selection, selectedPlans: newSelection }
          }
        }),

      toggleSessionSelection: (sessionId) =>
        set((state) => {
          const newSelection = new Set(state.selection.selectedSessions)
          if (newSelection.has(sessionId)) {
            newSelection.delete(sessionId)
          } else {
            newSelection.add(sessionId)
          }
          return {
            selection: { ...state.selection, selectedSessions: newSelection }
          }
        }),

      toggleTemplateSelection: (templateId) =>
        set((state) => {
          const newSelection = new Set(state.selection.selectedTemplates)
          if (newSelection.has(templateId)) {
            newSelection.delete(templateId)
          } else {
            newSelection.add(templateId)
          }
          return {
            selection: { ...state.selection, selectedTemplates: newSelection }
          }
        }),

      clearSelections: () =>
        set((state) => ({
          selection: {
            selectedPlans: new Set(),
            selectedSessions: new Set(),
            selectedTemplates: new Set()
          }
        })),

      selectAllPlans: (planIds) =>
        set((state) => ({
          selection: { ...state.selection, selectedPlans: new Set(planIds) }
        })),

      selectAllSessions: (sessionIds) =>
        set((state) => ({
          selection: { ...state.selection, selectedSessions: new Set(sessionIds) }
        })),

      // Favorites
      toggleFavorite: (id) =>
        set((state) => {
          const newFavorites = new Set(state.favorites)
          if (newFavorites.has(id)) {
            newFavorites.delete(id)
          } else {
            newFavorites.add(id)
          }
          return { favorites: newFavorites }
        }),

      isFavorited: (id) => get().favorites.has(id),

      // Reset actions
      resetFilters: () =>
        set((state) => ({
          filters: defaultFilters
        })),

      resetAll: () =>
        set((state) => ({
          filters: defaultFilters,
          ui: { ...defaultUI, isMobile: state.ui.isMobile },
          selection: {
            selectedPlans: new Set(),
            selectedSessions: new Set(),
            selectedTemplates: new Set()
          }
        })),

      // Computed getters
      getFilteredPlans: (plans) => {
        const { filters } = get()
        let filtered = [...plans]

        // Search filter
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase()
          filtered = filtered.filter(plan => 
            plan.name.toLowerCase().includes(query) ||
            plan.description?.toLowerCase().includes(query) ||
            plan.fitnessGoals.some(goal => goal.toLowerCase().includes(query))
          )
        }

        // Status filter
        if (filters.selectedStatus !== 'all') {
          filtered = filtered.filter(plan => plan.status === filters.selectedStatus)
        }

        // Difficulty filter
        if (filters.selectedDifficulty !== 'all') {
          filtered = filtered.filter(plan => plan.targetFitnessLevel === filters.selectedDifficulty)
        }

        // Category filter
        if (filters.selectedCategory !== 'all') {
          if (filters.selectedCategory === 'featured') {
            filtered = filtered.filter(plan => plan.isFeatured)
          } else if (filters.selectedCategory === 'templates') {
            filtered = filtered.filter(plan => plan.isTemplate)
          } else {
            filtered = filtered.filter(plan => 
              plan.fitnessGoals.includes(filters.selectedCategory)
            )
          }
        }

        // Sort
        filtered.sort((a, b) => {
          switch (filters.sortBy) {
            case 'name':
              return a.name.localeCompare(b.name)
            case 'status':
              return a.status.localeCompare(b.status)
            case 'duration':
              return b.durationWeeks - a.durationWeeks
            case 'created':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            case 'recent':
            default:
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          }
        })

        return filtered
      },

      getFilteredSessions: (sessions) => {
        const { filters } = get()
        let filtered = [...sessions]

        // Search filter
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase()
          filtered = filtered.filter(session => 
            session.name.toLowerCase().includes(query) ||
            session.sessionData.targetMuscleGroups.some(group => 
              group.toLowerCase().includes(query)
            )
          )
        }

        // Status filter
        if (filters.selectedStatus !== 'all') {
          filtered = filtered.filter(session => session.status === filters.selectedStatus)
        }

        // Time range filter
        if (filters.timeRange !== 'all') {
          const now = new Date()
          const cutoffDate = new Date()
          
          switch (filters.timeRange) {
            case '7d':
              cutoffDate.setDate(now.getDate() - 7)
              break
            case '30d':
              cutoffDate.setDate(now.getDate() - 30)
              break
            case '90d':
              cutoffDate.setDate(now.getDate() - 90)
              break
            case '1y':
              cutoffDate.setFullYear(now.getFullYear() - 1)
              break
          }
          
          filtered = filtered.filter(session => 
            new Date(session.scheduledDate) >= cutoffDate
          )
        }

        return filtered
      },

      hasActiveFilters: () => {
        const { filters } = get()
        return (
          filters.searchQuery !== '' ||
          filters.selectedStatus !== 'all' ||
          filters.selectedDifficulty !== 'all' ||
          filters.selectedCategory !== 'all'
        )
      },

      getSelectionCount: () => {
        const { selection } = get()
        return {
          plans: selection.selectedPlans.size,
          sessions: selection.selectedSessions.size,
          templates: selection.selectedTemplates.size
        }
      }
    }),
    {
      name: 'ai-trainer-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain parts of the state
      partialize: (state) => ({
        filters: {
          viewMode: state.filters.viewMode,
          timeRange: state.filters.timeRange,
          sortBy: state.filters.sortBy
        },
        ui: {
          sidebarCollapsed: state.ui.sidebarCollapsed
        },
        favorites: state.favorites
      })
    }
  )
)

// Selectors for better performance
export const useFilters = () => useDashboardStore((state) => state.filters)
export const useUI = () => useDashboardStore((state) => state.ui)
export const useSelection = () => useDashboardStore((state) => state.selection)
export const useFavorites = () => useDashboardStore((state) => state.favorites)

// Action selectors
export const useFilterActions = () => useDashboardStore((state) => ({
  setSearchQuery: state.setSearchQuery,
  setSelectedStatus: state.setSelectedStatus,
  setSelectedDifficulty: state.setSelectedDifficulty,
  setSelectedCategory: state.setSelectedCategory,
  setSortBy: state.setSortBy,
  setViewMode: state.setViewMode,
  setTimeRange: state.setTimeRange,
  resetFilters: state.resetFilters
}))

export const useUIActions = () => useDashboardStore((state) => ({
  setActiveTab: state.setActiveTab,
  toggleFilters: state.toggleFilters,
  toggleSearch: state.toggleSearch,
  toggleSidebar: state.toggleSidebar,
  setIsMobile: state.setIsMobile
}))

export const useSelectionActions = () => useDashboardStore((state) => ({
  togglePlanSelection: state.togglePlanSelection,
  toggleSessionSelection: state.toggleSessionSelection,
  toggleTemplateSelection: state.toggleTemplateSelection,
  clearSelections: state.clearSelections,
  selectAllPlans: state.selectAllPlans,
  selectAllSessions: state.selectAllSessions
}))

export const useFavoriteActions = () => useDashboardStore((state) => ({
  toggleFavorite: state.toggleFavorite,
  isFavorited: state.isFavorited
}))

// Computed selectors
export const useFilteredPlans = (plans: WorkoutPlan[]) => 
  useDashboardStore((state) => state.getFilteredPlans(plans))

export const useFilteredSessions = (sessions: WorkoutSession[]) => 
  useDashboardStore((state) => state.getFilteredSessions(sessions))

export const useHasActiveFilters = () => 
  useDashboardStore((state) => state.hasActiveFilters())

export const useSelectionCount = () => 
  useDashboardStore((state) => state.getSelectionCount())

// Hook for responsive design
export const useResponsive = () => {
  const { isMobile } = useUI()
  const { setIsMobile } = useUIActions()

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      if (mobile !== isMobile) {
        setIsMobile(mobile)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isMobile, setIsMobile])

  return { isMobile }
}