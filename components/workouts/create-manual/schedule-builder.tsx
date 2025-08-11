/**
 * Weekly Schedule Builder Component
 * Drag-and-drop weekly schedule configuration for custom workout plans
 */
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  GripVertical,
  Target,
  Timer,
  Dumbbell,
  Heart,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFormState } from './form-state-provider'
import type { WeeklySchedule, SessionTemplate } from '@/types/workouts'

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
] as const

const SESSION_TYPES = [
  { value: 'workout', label: 'Workout', icon: Dumbbell, color: 'bg-blue-500' },
  { value: 'cardio', label: 'Cardio', icon: Heart, color: 'bg-red-500' },
  { value: 'strength', label: 'Strength', icon: Target, color: 'bg-green-500' },
  { value: 'hiit', label: 'HIIT', icon: Zap, color: 'bg-orange-500' },
  { value: 'recovery', label: 'Recovery', icon: Timer, color: 'bg-purple-500' },
  { value: 'rest', label: 'Rest Day', icon: Calendar, color: 'bg-gray-500' }
] as const

interface SessionItem {
  id: string
  name: string
  type: 'workout' | 'cardio' | 'strength' | 'hiit' | 'recovery' | 'rest'
  duration: number
  templateId?: string
}

interface DraggableSessionProps {
  session: SessionItem
  onEdit: (session: SessionItem) => void
  onDelete: (sessionId: string) => void
}

function DraggableSession({ session, onEdit, onDelete }: DraggableSessionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: session.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const sessionType = SESSION_TYPES.find(type => type.value === session.type)
  const SessionIcon = sessionType?.icon || Dumbbell

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 shadow-lg scale-105'
      )}
    >
      <div
        className="flex-shrink-0 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className={cn('flex-shrink-0 p-2 rounded-lg', sessionType?.color)}>
        <SessionIcon className="h-4 w-4 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {session.name}
        </p>
        <p className="text-xs text-gray-500">
          {session.duration} min • {sessionType?.label}
        </p>
      </div>
      
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(session)}
          className="h-6 w-6 p-0"
        >
          <Clock className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(session.id)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

interface DroppableDayProps {
  day: typeof DAYS_OF_WEEK[number]
  sessions: SessionItem[]
  onSessionsChange: (day: string, sessions: SessionItem[]) => void
  onEditSession: (session: SessionItem) => void
  onDeleteSession: (sessionId: string) => void
}

function DroppableDay({ 
  day, 
  sessions, 
  onSessionsChange, 
  onEditSession, 
  onDeleteSession 
}: DroppableDayProps) {
  const t = useTranslations('workouts.createPlan.schedule')
  
  const totalDuration = useMemo(() => 
    sessions.reduce((sum, session) => sum + session.duration, 0),
    [sessions]
  )

  const handleDeleteSession = useCallback((sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId)
    onSessionsChange(day.key, updatedSessions)
    onDeleteSession(sessionId)
  }, [sessions, day.key, onSessionsChange, onDeleteSession])

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {t(`days.${day.key}`)}
          </CardTitle>
          {sessions.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalDuration} min
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <SortableContext items={sessions.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sessions.map(session => (
            <DraggableSession
              key={session.id}
              session={session}
              onEdit={onEditSession}
              onDelete={handleDeleteSession}
            />
          ))}
        </SortableContext>
        
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <Calendar className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">{t('dropZone.empty')}</p>
            <p className="text-xs text-gray-400">{t('dropZone.instruction')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface SessionEditorProps {
  session: SessionItem | null
  isOpen: boolean
  onSave: (session: SessionItem) => void
  onClose: () => void
}

function SessionEditor({ session, isOpen, onSave, onClose }: SessionEditorProps) {
  const t = useTranslations('workouts.createPlan.schedule')
  const [editSession, setEditSession] = useState<SessionItem | null>(null)

  React.useEffect(() => {
    if (isOpen && session) {
      setEditSession({ ...session })
    }
  }, [isOpen, session])

  const handleSave = useCallback(() => {
    if (editSession) {
      onSave(editSession)
      onClose()
    }
  }, [editSession, onSave, onClose])

  if (!isOpen || !editSession) {return null}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{t('editor.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t('editor.sessionName')}
            </label>
            <input
              type="text"
              value={editSession.name}
              onChange={(e) => setEditSession(prev => prev ? { ...prev, name: e.target.value } : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('editor.sessionNamePlaceholder')}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t('editor.sessionType')}
            </label>
            <Select
              value={editSession.type}
              onValueChange={(value: any) => setEditSession(prev => prev ? { ...prev, type: value } : null)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map(type => {
                  const Icon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn('p-1 rounded', type.color)}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t('editor.duration')}
            </label>
            <input
              type="number"
              min="15"
              max="180"
              step="15"
              value={editSession.duration}
              onChange={(e) => setEditSession(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 30 } : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">{t('editor.durationHint')}</p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {t('editor.save')}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t('editor.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ScheduleBuilder() {
  const t = useTranslations('workouts.createPlan.schedule')
  const { formData, updateFormData } = useFormState()
  
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Convert form data to schedule
  const schedule = useMemo(() => {
    const weeklySchedule = formData.weeklySchedule || {}
    return DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day.key] = weeklySchedule[day.key] || []
      return acc
    }, {} as Record<string, SessionItem[]>)
  }, [formData.weeklySchedule])

  const handleSessionsChange = useCallback((day: string, sessions: SessionItem[]) => {
    const newSchedule = { ...schedule, [day]: sessions }
    updateFormData({ weeklySchedule: newSchedule })
  }, [schedule, updateFormData])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {return}

    // Find source and destination
    let sourceDay = ''
    let sourceIndex = -1
    let destinationDay = ''
    let destinationIndex = -1

    // Find source
    for (const [day, sessions] of Object.entries(schedule)) {
      const index = sessions.findIndex(s => s.id === active.id)
      if (index !== -1) {
        sourceDay = day
        sourceIndex = index
        break
      }
    }

    // Find destination
    if (over.id === active.id) {return}

    // Check if dropping on a day container
    const dayKey = DAYS_OF_WEEK.find(d => d.key === over.id)?.key
    if (dayKey) {
      destinationDay = dayKey
      destinationIndex = schedule[dayKey]?.length || 0
    } else {
      // Find the day containing the destination session
      for (const [day, sessions] of Object.entries(schedule)) {
        const index = sessions.findIndex(s => s.id === over.id)
        if (index !== -1) {
          destinationDay = day
          destinationIndex = index
          break
        }
      }
    }

    if (sourceDay && destinationDay && sourceIndex !== -1) {
      const sourceSession = schedule[sourceDay][sourceIndex]
      
      if (sourceDay === destinationDay) {
        // Reorder within same day
        const newSessions = arrayMove(schedule[sourceDay], sourceIndex, destinationIndex)
        handleSessionsChange(sourceDay, newSessions)
      } else {
        // Move between days
        const sourceSessions = [...schedule[sourceDay]]
        sourceSessions.splice(sourceIndex, 1)
        
        const destSessions = [...schedule[destinationDay]]
        destSessions.splice(destinationIndex, 0, sourceSession)
        
        const newSchedule = {
          ...schedule,
          [sourceDay]: sourceSessions,
          [destinationDay]: destSessions
        }
        
        updateFormData({ weeklySchedule: newSchedule })
      }
    }
  }, [schedule, handleSessionsChange, updateFormData])

  const handleAddSession = useCallback(() => {
    const newSession: SessionItem = {
      id: `session-${Date.now()}`,
      name: t('defaultSession.name'),
      type: 'workout',
      duration: 60
    }
    
    setEditingSession(newSession)
    setIsEditorOpen(true)
  }, [t])

  const handleEditSession = useCallback((session: SessionItem) => {
    setEditingSession(session)
    setIsEditorOpen(true)
  }, [])

  const handleSaveSession = useCallback((session: SessionItem) => {
    // If it's a new session, add it to the first available day
    if (!editingSession || editingSession.id !== session.id) {
      // Add to Monday by default
      const mondaySessions = [...(schedule.monday || []), session]
      handleSessionsChange('monday', mondaySessions)
    } else {
      // Update existing session
      const newSchedule = { ...schedule }
      for (const [day, sessions] of Object.entries(newSchedule)) {
        const index = sessions.findIndex(s => s.id === session.id)
        if (index !== -1) {
          sessions[index] = session
          break
        }
      }
      updateFormData({ weeklySchedule: newSchedule })
    }
  }, [editingSession, schedule, handleSessionsChange, updateFormData])

  const handleDeleteSession = useCallback((sessionId: string) => {
    // Session deletion is handled in DroppableDay
  }, [])

  const activeSession = useMemo(() => {
    if (!activeId) {return null}
    
    for (const sessions of Object.values(schedule)) {
      const session = sessions.find(s => s.id === activeId)
      if (session) {return session}
    }
    return null
  }, [activeId, schedule])

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const allSessions = Object.values(schedule).flat()
    const workoutSessions = allSessions.filter(s => s.type !== 'rest')
    const totalDuration = allSessions.reduce((sum, s) => sum + s.duration, 0)
    
    return {
      totalSessions: workoutSessions.length,
      totalDuration,
      avgSessionDuration: workoutSessions.length ? Math.round(totalDuration / workoutSessions.length) : 0,
      restDays: 7 - workoutSessions.length
    }
  }, [schedule])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('title')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('description')}
          </p>
        </div>
        <Button onClick={handleAddSession}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addSession')}
        </Button>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{weeklyStats.totalSessions}</div>
            <div className="text-sm text-gray-600">{t('stats.sessions')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{weeklyStats.totalDuration}m</div>
            <div className="text-sm text-gray-600">{t('stats.totalTime')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{weeklyStats.avgSessionDuration}m</div>
            <div className="text-sm text-gray-600">{t('stats.avgDuration')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{weeklyStats.restDays}</div>
            <div className="text-sm text-gray-600">{t('stats.restDays')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map(day => (
            <SortableContext
              key={day.key}
              items={schedule[day.key]?.map(s => s.id) || []}
              strategy={rectSortingStrategy}
            >
              <DroppableDay
                day={day}
                sessions={schedule[day.key] || []}
                onSessionsChange={handleSessionsChange}
                onEditSession={handleEditSession}
                onDeleteSession={handleDeleteSession}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeSession ? (
            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className={cn('flex-shrink-0 p-2 rounded-lg', SESSION_TYPES.find(t => t.value === activeSession.type)?.color)}>
                {React.createElement(SESSION_TYPES.find(t => t.value === activeSession.type)?.icon || Dumbbell, {
                  className: "h-4 w-4 text-white"
                })}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {activeSession.name}
                </p>
                <p className="text-xs text-gray-500">
                  {activeSession.duration} min
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Session Editor Modal */}
      <SessionEditor
        session={editingSession}
        isOpen={isEditorOpen}
        onSave={handleSaveSession}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingSession(null)
        }}
      />
    </div>
  )
}