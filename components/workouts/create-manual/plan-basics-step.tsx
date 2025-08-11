/**
 * Plan Basics Step Component
 * First step in the custom workout plan creation wizard
 */
'use client'

import { useTranslations } from 'next-intl'
import { Target, Clock, Calendar, TrendingUp, AlertCircle } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { CustomPlanFormData } from '@/types/workouts'
import type { FitnessLevel } from '@/types'
import type { PlanBasicsStepProps } from '@/types/workout-forms'

const FITNESS_GOALS = [
  'strength',
  'muscle_gain',
  'fat_loss',
  'cardio',
  'endurance',
  'flexibility',
  'sports_performance',
  'general_fitness'
]

const FITNESS_LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced']

const DURATION_OPTIONS = [2, 4, 6, 8, 12, 16, 20]
const SESSION_OPTIONS = [2, 3, 4, 5, 6, 7]
const DURATION_OPTIONS_MINUTES = [30, 45, 60, 75, 90, 105, 120]

export function PlanBasicsStep({ data, onUpdate }: PlanBasicsStepProps) {
  const t = useTranslations('createPlan.steps.basics')

  function toggleGoal(goal: string) {
    const currentGoals = data.fitnessGoals
    if (currentGoals.includes(goal)) {
      onUpdate({
        fitnessGoals: currentGoals.filter(g => g !== goal)
      })
    } else {
      onUpdate({
        fitnessGoals: [...currentGoals, goal]
      })
    }
  }

  function handleInputChange(field: keyof CustomPlanFormData, value: any) {
    onUpdate({ [field]: value })
  }

  const totalWeeklyHours = (data.sessionsPerWeek * data.estimatedSessionDuration) / 60
  const totalProgramHours = totalWeeklyHours * data.durationWeeks

  return (
    <div className="space-y-8">
      {/* Plan Identification */}
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-900">
            {t('fields.name.label')} *
          </Label>
          <Input
            id="name"
            type="text"
            value={data.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={t('fields.name.placeholder')}
            className="text-base"
            required
          />
          <p className="text-sm text-gray-500">
            {t('fields.name.help')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-900">
            {t('fields.description.label')}
          </Label>
          <textarea
            id="description"
            value={data.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder={t('fields.description.placeholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            rows={3}
          />
          <p className="text-sm text-gray-500">
            {t('fields.description.help')}
          </p>
        </div>
      </div>

      {/* Program Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            {t('programConfig.title')}
          </CardTitle>
          <CardDescription>
            {t('programConfig.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                {t('fields.duration.label')} *
              </Label>
              <Select
                value={data.durationWeeks.toString()}
                onValueChange={(value) => handleInputChange('durationWeeks', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(weeks => (
                    <SelectItem key={weeks} value={weeks.toString()}>
                      {t('fields.duration.weeks', { count: weeks })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sessions per week */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                {t('fields.sessionsPerWeek.label')} *
              </Label>
              <Select
                value={data.sessionsPerWeek.toString()}
                onValueChange={(value) => handleInputChange('sessionsPerWeek', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_OPTIONS.map(sessions => (
                    <SelectItem key={sessions} value={sessions.toString()}>
                      {t('fields.sessionsPerWeek.sessions', { count: sessions })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session duration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                {t('fields.sessionDuration.label')}
              </Label>
              <Select
                value={data.estimatedSessionDuration.toString()}
                onValueChange={(value) => handleInputChange('estimatedSessionDuration', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS_MINUTES.map(minutes => (
                    <SelectItem key={minutes} value={minutes.toString()}>
                      {t('fields.sessionDuration.minutes', { count: minutes })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Program Overview */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {t('programConfig.overview.title')}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">{data.durationWeeks}</span>
                <span className="text-blue-600 ml-1">{t('programConfig.overview.weeks')}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">{data.sessionsPerWeek}</span>
                <span className="text-blue-600 ml-1">{t('programConfig.overview.sessionsWeek')}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">{totalWeeklyHours.toFixed(1)}</span>
                <span className="text-blue-600 ml-1">{t('programConfig.overview.hoursWeek')}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">{totalProgramHours.toFixed(0)}</span>
                <span className="text-blue-600 ml-1">{t('programConfig.overview.totalHours')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fitness Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            {t('fitnessGoals.title')}
          </CardTitle>
          <CardDescription>
            {t('fitnessGoals.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FITNESS_GOALS.map(goal => {
              const isSelected = data.fitnessGoals.includes(goal)
              return (
                <Button
                  key={goal}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleGoal(goal)}
                  className="justify-start h-auto py-3 px-4"
                >
                  <div className="text-left">
                    <div className="font-medium">{t(`fitnessGoals.options.${goal}.name`)}</div>
                    <div className="text-xs opacity-80 mt-0.5">
                      {t(`fitnessGoals.options.${goal}.description`)}
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
          {data.fitnessGoals.length === 0 && (
            <div className="flex items-center mt-4 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mr-2" />
              {t('fitnessGoals.selectAtLeastOne')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Fitness Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            {t('fitnessLevel.title')}
          </CardTitle>
          <CardDescription>
            {t('fitnessLevel.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FITNESS_LEVELS.map(level => {
              const isSelected = data.targetFitnessLevel === level
              return (
                <Button
                  key={level}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => handleInputChange('targetFitnessLevel', level)}
                  className="h-auto p-4 text-left justify-start"
                >
                  <div>
                    <div className="font-medium mb-1">
                      {t(`fitnessLevel.levels.${level}.name`)}
                    </div>
                    <div className="text-xs opacity-80">
                      {t(`fitnessLevel.levels.${level}.description`)}
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">
            {t('summary.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('summary.planName')}</span>
              <span className="font-medium">{data.name || t('summary.notSet')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('summary.duration')}</span>
              <span className="font-medium">
                {t('summary.durationValue', { weeks: data.durationWeeks, sessions: data.sessionsPerWeek })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('summary.goals')}</span>
              <div className="flex flex-wrap gap-1">
                {data.fitnessGoals.length > 0 ? (
                  data.fitnessGoals.map(goal => (
                    <Badge key={goal} variant="secondary" className="text-xs">
                      {t(`fitnessGoals.options.${goal}.name`)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-400 italic">{t('summary.noGoals')}</span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('summary.level')}</span>
              <span className="font-medium">
                {t(`fitnessLevel.levels.${data.targetFitnessLevel}.name`)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}