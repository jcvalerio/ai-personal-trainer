/**
 * Mobile Component Showcase
 * Demonstrates proper usage of mobile-responsive components
 * Remove this file after implementation - it's for reference only
 */
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TouchInput, SearchInput, NumericInput } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { MobileSessionEditor } from '@/components/workouts/ui/mobile-session-editor';
import { 
  MobileDaySelector, 
  DayPills, 
  WeeklyCalendar 
} from '@/components/workouts/ui/mobile-day-selector';
import { useMobileSchedule } from '@/hooks/use-mobile-schedule';
import type { MobileSessionData } from '@/types/mobile-components';

export function MobileComponentShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sessionEditorOpen, setSessionEditorOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'wednesday']);
  const [searchValue, setSearchValue] = useState('');
  const [numericValue, setNumericValue] = useState('');

  const {
    sessions,
    weeklySchedule,
    scheduleStats,
    saveSession,
    removeSession,
    validateSchedule,
  } = useMobileSchedule({
    maxSessionsPerDay: 2,
    minRestDays: 1,
  });

  const handleSaveSession = (session: MobileSessionData) => {
    saveSession(session);
  };

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-bold text-gray-900">Mobile Components Showcase</h1>
      
      {/* Enhanced Input Components */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Enhanced Input Components</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Touch-Optimized Input (16px font, prevents iOS zoom)
            </label>
            <TouchInput 
              placeholder="Enter workout name..."
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Input (optimized keyboard)
            </label>
            <SearchInput
              placeholder="Search exercises..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numeric Input (number keyboard)
            </label>
            <NumericInput
              placeholder="Enter weight..."
              value={numericValue}
              onChange={(e) => setNumericValue(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Mobile Dialog Modes */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Mobile Dialog Modes</h2>
        
        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={() => setDialogOpen(true)}
            className="touch-manipulation"
          >
            Open Responsive Dialog
          </Button>
          
          <Button 
            onClick={() => setSessionEditorOpen(true)}
            className="touch-manipulation"
          >
            Open Session Editor
          </Button>
        </div>

        {/* Responsive Dialog Example */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent mobileMode="bottomSheet">
            <DialogHeader>
              <DialogTitle>Mobile-Optimized Dialog</DialogTitle>
              <DialogDescription>
                This dialog adapts to mobile devices with bottom sheet behavior
                and proper touch targets.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 p-4">
              <TouchInput 
                placeholder="Sample input with mobile optimization..."
                className="w-full"
              />
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => setDialogOpen(false)}
                  className="h-12 flex-1 touch-manipulation"
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="h-12 touch-manipulation px-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* Day Selection Components */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Day Selection Components</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Day Selector (replaces drag-and-drop)
            </label>
            <MobileDaySelector
              selectedDays={selectedDays}
              onDaysChange={setSelectedDays}
              placeholder="Select training days"
            />
          </div>
          
          {selectedDays.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Days (removable pills)
              </label>
              <DayPills
                selectedDays={selectedDays}
                onRemoveDay={(day) => 
                  setSelectedDays(prev => prev.filter(d => d !== day))
                }
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weekly Calendar View
            </label>
            <WeeklyCalendar
              selectedDays={selectedDays}
              onDayToggle={(day) => {
                setSelectedDays(prev => 
                  prev.includes(day) 
                    ? prev.filter(d => d !== day)
                    : [...prev, day]
                );
              }}
            />
          </div>
        </div>
      </section>

      {/* Mobile Session Editor */}
      <MobileSessionEditor
        session={null} // null for new session
        isOpen={sessionEditorOpen}
        onSave={handleSaveSession}
        onClose={() => setSessionEditorOpen(false)}
        showDayScheduling={true}
        validate={(session) => {
          if (!session.name.trim()) return 'Session name is required';
          if (session.scheduledDays.length === 0) return 'Select at least one day';
          return null;
        }}
      />

      {/* Schedule Statistics */}
      {sessions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Schedule Statistics</h2>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-blue-600">
                {scheduleStats.totalSessions}
              </div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-green-600">
                {scheduleStats.activeDays}
              </div>
              <div className="text-sm text-gray-600">Active Days</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-purple-600">
                {scheduleStats.avgSessionDuration}m
              </div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-orange-600">
                {scheduleStats.restDays}
              </div>
              <div className="text-sm text-gray-600">Rest Days</div>
            </div>
          </div>
        </section>
      )}

      {/* Usage Guidelines */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Usage Guidelines</h2>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li>• All inputs use 16px font size to prevent iOS zoom</li>
          <li>• Touch targets are minimum 44px for WCAG AA compliance</li>
          <li>• Dialogs adapt from bottom sheets (mobile) to centered modals (desktop)</li>
          <li>• Day selection replaces drag-and-drop with touch-friendly interface</li>
          <li>• Components include proper ARIA labels and keyboard navigation</li>
          <li>• Validation provides clear feedback with mobile-optimized error states</li>
        </ul>
      </section>
    </div>
  );
}

/**
 * Integration Example: Updating Existing Schedule Builder
 * Replace the drag-and-drop schedule builder with mobile-optimized version
 */
export function MobileScheduleBuilderExample() {
  const {
    sessions,
    scheduleStats,
    saveSession,
    removeSession,
    applySchedulePattern,
    validateSchedule,
  } = useMobileSchedule();

  const [sessionEditorOpen, setSessionEditorOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<MobileSessionData | null>(null);

  const handleCreateSession = () => {
    setEditingSession(null);
    setSessionEditorOpen(true);
  };

  const handleEditSession = (session: MobileSessionData) => {
    setEditingSession(session);
    setSessionEditorOpen(true);
  };

  const handleSaveSession = (session: MobileSessionData) => {
    saveSession(session);
    setSessionEditorOpen(false);
    setEditingSession(null);
  };

  const validation = validateSchedule();

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
        <Button 
          onClick={handleCreateSession}
          className="touch-manipulation"
        >
          Add Session
        </Button>
      </div>

      {/* Quick Schedule Patterns */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => applySchedulePattern('beginner')}
          className="touch-manipulation"
        >
          Beginner Plan
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => applySchedulePattern('intermediate')}
          className="touch-manipulation"
        >
          Intermediate Plan
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => applySchedulePattern('advanced')}
          className="touch-manipulation"
        >
          Advanced Plan
        </Button>
      </div>

      {/* Schedule Validation */}
      {!validation.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800 mb-2">Schedule Issues</h3>
          <ul className="space-y-1 text-sm text-red-700">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Recommendations</h3>
          <ul className="space-y-1 text-sm text-yellow-700">
            {validation.warnings.map((warning, index) => (
              <li key={index}>• {warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.map((session) => (
          <div 
            key={session.id}
            className="bg-white border rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{session.name}</h3>
              <p className="text-sm text-gray-600">
                {session.duration} min • {session.type} • {session.scheduledDays.length} days
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSession(session)}
                className="touch-manipulation"
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeSession(session.id)}
                className="touch-manipulation text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        
        {sessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sessions scheduled. Create your first session to get started.
          </div>
        )}
      </div>

      {/* Session Editor */}
      <MobileSessionEditor
        session={editingSession}
        isOpen={sessionEditorOpen}
        onSave={handleSaveSession}
        onClose={() => {
          setSessionEditorOpen(false);
          setEditingSession(null);
        }}
        showDayScheduling={true}
      />
    </div>
  );
}