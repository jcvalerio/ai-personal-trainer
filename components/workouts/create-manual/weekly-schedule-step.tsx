/**
 * Weekly Schedule Step Component
 * Configure weekly training schedule and rest days with drag-and-drop functionality
 */
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { ScheduleBuilder } from './schedule-builder';
import type { CustomPlanFormData } from '@/types/workouts';

interface WeeklyScheduleStepProps {
  data: CustomPlanFormData;
  onUpdate: (updates: Partial<CustomPlanFormData>) => void;
}

export function WeeklyScheduleStep({
  data: _data,
  onUpdate: _onUpdate,
}: WeeklyScheduleStepProps) {
  const t = useTranslations('createPlan.schedule');

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
      </Card>

      {/* Schedule Builder */}
      <ScheduleBuilder />
    </div>
  );
}
