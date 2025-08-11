/**
 * Session Templates Step Component
 * Create and configure workout session templates with exercise selection
 */
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Dumbbell, Plus, Edit2, Trash2, Timer, Target, Zap, BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import { ExerciseSelector } from './exercise-selector'
import { useFormState } from './form-state-provider'

interface ExerciseConfig {
  exerciseId: string
  sets: number
  reps?: number
  weight?: number
  duration?: number
  restTime?: number
  notes?: string
}

interface SessionTemplate {
  id: string
  name: string
  description: string
  type: 'workout' | 'assessment' | 'recovery'
  estimatedDuration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  targetMuscleGroups: string[]
  exercises: ExerciseConfig[]
  notes?: string
}

const SESSION_TYPES = [
  { value: 'workout', label: 'Workout', icon: Dumbbell },
  { value: 'assessment', label: 'Assessment', icon: Target },
  { value: 'recovery', label: 'Recovery', icon: Timer }
] as const

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-500' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-500' }
] as const

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps',
  'legs', 'quadriceps', 'hamstrings', 'glutes', 'calves',
  'core', 'abs', 'cardio', 'full_body'
]

// Predefined session templates
const PREDEFINED_TEMPLATES = [
  {
    id: 'lower_body_quad_focus',
    name: 'Lower Body - Quad Focus',
    description: 'Quadriceps emphasis with imbalance correction',
    type: 'workout' as const,
    estimatedDuration: 75,
    difficulty: 'intermediate' as const,
    targetMuscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'calves'],
    exercises: []
  },
  {
    id: 'upper_body_push',
    name: 'Upper Body - Push Focus',
    description: 'Chest, shoulders, and triceps development',
    type: 'workout' as const,
    estimatedDuration: 60,
    difficulty: 'intermediate' as const,
    targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
    exercises: []
  }
]

function TemplateCard({ template, onEdit, onDelete }: {
  template: SessionTemplate
  onEdit: (template: SessionTemplate) => void
  onDelete: (templateId: string) => void
}) {
  const t = useTranslations('workouts.createPlan.templates')
  
  const difficultyConfig = DIFFICULTY_LEVELS.find(d => d.value === template.difficulty)
  const sessionType = SESSION_TYPES.find(s => s.value === template.type)
  const SessionIcon = sessionType?.icon || Dumbbell

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SessionIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {template.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(template)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(template.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Template Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <Timer className="w-4 h-4 mr-2 text-gray-500" />
            <span>{template.estimatedDuration} min</span>
          </div>
          <div className="flex items-center">
            <Dumbbell className="w-4 h-4 mr-2 text-gray-500" />
            <span>{template.exercises.length} exercises</span>
          </div>
          <div className="flex items-center">
            {difficultyConfig && (
              <>
                <div className={`w-3 h-3 rounded-full mr-2 ${difficultyConfig.color}`} />
                <span>{difficultyConfig.label}</span>
              </>
            )}
          </div>
          <div className="flex items-center">
            <Target className="w-4 h-4 mr-2 text-gray-500" />
            <span>{template.targetMuscleGroups.length} muscle groups</span>
          </div>
        </div>

        {/* Target Muscle Groups */}
        {template.targetMuscleGroups.length > 0 && (
          <div>
            <div className="text-xs text-gray-600 mb-1">Target Muscles:</div>
            <div className="flex flex-wrap gap-1">
              {template.targetMuscleGroups.slice(0, 3).map(group => (
                <Badge key={group} variant="outline" className="text-xs capitalize">
                  {group.replace('_', ' ')}
                </Badge>
              ))}
              {template.targetMuscleGroups.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.targetMuscleGroups.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Exercise Preview */}
        {template.exercises.length > 0 && (
          <div>
            <div className="text-xs text-gray-600 mb-1">Exercise Preview:</div>
            <div className="text-xs text-gray-800 space-y-1">
              {template.exercises.slice(0, 3).map((exercise, index) => (
                <div key={index} className="flex justify-between">
                  <span className="truncate mr-2">Exercise {index + 1}</span>
                  <span className="text-gray-500 whitespace-nowrap">
                    {exercise.sets}×{exercise.reps || exercise.duration}
                  </span>
                </div>
              ))}
              {template.exercises.length > 3 && (
                <div className="text-gray-500 text-center">
                  +{template.exercises.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TemplateEditor({ 
  template, 
  isOpen, 
  onSave, 
  onClose 
}: {
  template: SessionTemplate | null
  isOpen: boolean
  onSave: (template: SessionTemplate) => void
  onClose: () => void
}) {
  const t = useTranslations('workouts.createPlan.templates')
  const [editingTemplate, setEditingTemplate] = useState<SessionTemplate | null>(null)

  React.useEffect(() => {
    if (isOpen && template) {
      setEditingTemplate({ ...template })
    }
  }, [isOpen, template])

  const handleSave = useCallback(() => {
    if (editingTemplate) {
      onSave(editingTemplate)
      onClose()
    }
  }, [editingTemplate, onSave, onClose])

  const updateTemplate = useCallback((updates: Partial<SessionTemplate>) => {
    setEditingTemplate(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  if (!isOpen || !editingTemplate) {return null}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template?.id ? t('dialog.editTemplate') : t('dialog.createTemplate')}
          </DialogTitle>
          <DialogDescription>
            {t('dialog.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="templateName">{t('fields.name')}</Label>
              <Input
                id="templateName"
                value={editingTemplate.name}
                onChange={(e) => updateTemplate({ name: e.target.value })}
                placeholder={t('fields.namePlaceholder')}
              />
            </div>
            
            <div>
              <Label htmlFor="templateType">{t('fields.sessionType')}</Label>
              <Select
                value={editingTemplate.type}
                onValueChange={(value: 'workout' | 'assessment' | 'recovery') => 
                  updateTemplate({ type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="templateDuration">{t('fields.duration')}</Label>
              <Input
                id="templateDuration"
                type="number"
                min="15"
                max="180"
                step="15"
                value={editingTemplate.estimatedDuration}
                onChange={(e) => updateTemplate({ estimatedDuration: parseInt(e.target.value) || 60 })}
              />
            </div>
            
            <div>
              <Label htmlFor="templateDifficulty">{t('fields.difficulty')}</Label>
              <Select
                value={editingTemplate.difficulty}
                onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                  updateTemplate({ difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${level.color}`} />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="templateDescription">{t('fields.description')}</Label>
            <Textarea
              id="templateDescription"
              value={editingTemplate.description}
              onChange={(e) => updateTemplate({ description: e.target.value })}
              placeholder={t('fields.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          {/* Exercise Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Exercises</h3>
            <ExerciseSelector
              selectedExercises={editingTemplate.exercises}
              onExercisesChange={(exercises) => updateTemplate({ exercises })}
              maxExercises={15}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t">
          <Button onClick={handleSave} disabled={!editingTemplate.name.trim()}>
            {t('dialog.save')}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SessionTemplatesStep() {
  const t = useTranslations('workouts.createPlan.steps.templates')
  const { formData, updateFormData } = useFormState()
  
  const [editingTemplate, setEditingTemplate] = useState<SessionTemplate | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const sessionTemplates = formData.sessionTemplates || []

  const handleCreateTemplate = useCallback(() => {
    const newTemplate: SessionTemplate = {
      id: `template-${Date.now()}`,
      name: '',
      description: '',
      type: 'workout',
      estimatedDuration: 60,
      difficulty: 'intermediate',
      targetMuscleGroups: [],
      exercises: []
    }
    
    setEditingTemplate(newTemplate)
    setIsEditorOpen(true)
  }, [])

  const handleEditTemplate = useCallback((template: SessionTemplate) => {
    setEditingTemplate(template)
    setIsEditorOpen(true)
  }, [])

  const handleSaveTemplate = useCallback((template: SessionTemplate) => {
    const existingIndex = sessionTemplates.findIndex(t => t.id === template.id)
    
    if (existingIndex >= 0) {
      // Update existing template
      const updatedTemplates = [...sessionTemplates]
      updatedTemplates[existingIndex] = template
      updateFormData({ sessionTemplates: updatedTemplates })
    } else {
      // Add new template
      updateFormData({ sessionTemplates: [...sessionTemplates, template] })
    }
  }, [sessionTemplates, updateFormData])

  const handleDeleteTemplate = useCallback((templateId: string) => {
    const updatedTemplates = sessionTemplates.filter(t => t.id !== templateId)
    updateFormData({ sessionTemplates: updatedTemplates })
  }, [sessionTemplates, updateFormData])

  const handleUsePredefinedTemplate = useCallback((predefinedTemplate: typeof PREDEFINED_TEMPLATES[0]) => {
    const newTemplate: SessionTemplate = {
      ...predefinedTemplate,
      id: `template-${Date.now()}`
    }
    
    setEditingTemplate(newTemplate)
    setIsEditorOpen(true)
  }, [])

  const templateStats = useMemo(() => {
    const totalExercises = sessionTemplates.reduce((sum, template) => sum + template.exercises.length, 0)
    const avgDuration = sessionTemplates.length > 0 
      ? Math.round(sessionTemplates.reduce((sum, template) => sum + template.estimatedDuration, 0) / sessionTemplates.length)
      : 0
    const allMuscleGroups = new Set(sessionTemplates.flatMap(template => template.targetMuscleGroups))

    return {
      totalTemplates: sessionTemplates.length,
      totalExercises,
      avgDuration,
      muscleGroupsCovered: allMuscleGroups.size
    }
  }, [sessionTemplates])

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Start</CardTitle>
          <CardDescription>Use predefined templates or create from scratch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              {t('actions.createNew')}
            </Button>
            {PREDEFINED_TEMPLATES.map(template => (
              <Button
                key={template.id}
                variant="outline"
                onClick={() => handleUsePredefinedTemplate(template)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {template.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {sessionTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('empty.title')}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {t('empty.description')}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleCreateTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                {t('empty.createFromScratch')}
              </Button>
              <Button variant="outline" onClick={() => handleUsePredefinedTemplate(PREDEFINED_TEMPLATES[0])}>
                <BookOpen className="w-4 h-4 mr-2" />
                {t('empty.useTemplate')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('summary.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{templateStats.totalTemplates}</div>
                  <div className="text-sm text-gray-600">{t('summary.totalTemplates')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{templateStats.avgDuration}m</div>
                  <div className="text-sm text-gray-600">{t('summary.avgDuration')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{templateStats.totalExercises}</div>
                  <div className="text-sm text-gray-600">{t('summary.totalExercises')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{templateStats.muscleGroupsCovered}</div>
                  <div className="text-sm text-gray-600">{t('summary.muscleGroupsCovered')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessionTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
              />
            ))}
          </div>
        </>
      )}

      {/* Template Editor Modal */}
      <TemplateEditor
        template={editingTemplate}
        isOpen={isEditorOpen}
        onSave={handleSaveTemplate}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingTemplate(null)
        }}
      />
    </div>
  )
}