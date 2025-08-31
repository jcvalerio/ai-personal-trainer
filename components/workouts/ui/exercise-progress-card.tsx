/**
 * Exercise Progress Card Component
 * Mobile-first card for tracking exercise progress with touch-friendly controls
 */
'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Clock,
  Weight,
  Target,
  MoreHorizontal,
  Edit3,
} from 'lucide-react';
import { SmartSetInput } from './smart-set-input';
import { TouchButton } from '@/components/ui/touch-button';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export interface ExerciseProgressCardProps {
  /** Exercise name */
  name: string;
  /** Exercise description */
  description?: string;
  /** Current set number (1-based) */
  currentSet: number;
  /** Total sets */
  totalSets: number;
  /** Target values */
  targets: {
    reps?: number;
    weight?: number;
    duration?: number; // in seconds
    distance?: number; // in meters
  };
  /** Completed sets data */
  completedSets: Array<{
    setNumber: number;
    reps?: number;
    weight?: number;
    duration?: number;
    distance?: number;
    notes?: string;
  }>;
  /** Current set input values */
  currentInputs: {
    reps: string;
    weight: string;
    duration: string;
    distance: string;
    notes: string;
  };
  /** Set completion progress (0-1) */
  progress: number;
  /** Is currently active set */
  isActive?: boolean;
  /** Is in rest period */
  isResting?: boolean;
  /** Rest time remaining in seconds */
  restTimeRemaining?: number;
  /** Event handlers */
  onInputChange: (field: keyof ExerciseProgressCardProps['currentInputs'], value: string) => void;
  onCompleteSet: () => void;
  onSkipSet?: () => void;
  onEditSet?: (setNumber: number) => void;
  onSkipRest?: () => void;
  /** Units */
  weightUnit?: 'lbs' | 'kg';
  distanceUnit?: 'm' | 'km' | 'mi';
  /** Accessibility */
  className?: string;
}

export const ExerciseProgressCard = React.memo(function ExerciseProgressCard({
  name,
  description,
  currentSet,
  totalSets,
  targets,
  completedSets,
  currentInputs,
  progress,
  isActive = false,
  isResting = false,
  restTimeRemaining,
  onInputChange,
  onCompleteSet,
  onSkipSet,
  onEditSet,
  onSkipRest,
  weightUnit = 'lbs',
  distanceUnit = 'm',
  className,
}: ExerciseProgressCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Quick adjustment functions
  const adjustValue = (field: keyof typeof currentInputs, delta: number) => {
    const currentValue = parseFloat(currentInputs[field]) || 0;
    const newValue = Math.max(0, currentValue + delta);
    onInputChange(field, newValue.toString());
  };

  // Enhanced validation for set completion with NaN protection
  const canCompleteSet = () => {
    const parseNumber = (value: string | undefined, isInteger = false): number | null => {
      if (!value || value.trim() === '') return null;
      const num = isInteger ? parseInt(value) : parseFloat(value);
      return !isNaN(num) && num > 0 ? num : null;
    };

    // Get validated numeric values
    const validReps = parseNumber(currentInputs.reps, true);
    const validWeight = parseNumber(currentInputs.weight);
    const validDuration = parseNumber(currentInputs.duration, true);
    const validDistance = parseNumber(currentInputs.distance);
    
    // For weight exercises, require both weight and reps
    if (targets.weight && targets.weight > 0) {
      return validReps !== null && validWeight !== null;
    }
    
    // For duration exercises, require duration
    if (targets.duration && targets.duration > 0) {
      return validDuration !== null;
    }
    
    // For distance exercises, require distance
    if (targets.distance && targets.distance > 0) {
      return validDistance !== null;
    }
    
    // Default: just need reps
    return validReps !== null;
  };
  
  const isSetComplete = canCompleteSet();

  return (
    <Card 
      className={cn(
        'touch-manipulation transition-all duration-200',
        isActive && 'ring-2 ring-blue-500 ring-offset-2',
        isResting && 'bg-green-50 border-green-200',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg truncate">{name}</CardTitle>
              <Badge variant="outline" className="flex-shrink-0">
                Set {currentSet} / {totalSets}
              </Badge>
            </div>
            {description && (
              <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 ml-2"
            aria-label={isExpanded ? 'Collapse exercise details' : 'Expand exercise details'}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <Progress 
          value={progress * 100} 
          className="h-2" 
          variant={isActive ? 'default' : 'success'}
        />
        <div className="text-xs text-gray-500 text-right">
          {Math.round(progress * 100)}% Complete
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Rest Period Timer Display */}
          {isResting && (
            <div className="text-center py-2">
              {restTimeRemaining !== undefined && (
                <div className="text-2xl font-mono font-bold text-green-700 mb-3">
                  {formatTime(restTimeRemaining)}
                </div>
              )}
              <p className="text-green-600 text-sm mb-3">Rest Period</p>
              <Button
                size="sm"
                onClick={onSkipRest}
                variant="outline"
                className="border-green-300 hover:bg-green-100 min-w-[100px] min-h-[44px]"
              >
                Skip Rest
              </Button>
            </div>
          )}

          {/* Target Values */}
          {!isResting && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {targets.reps && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Target className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                  <div className="text-xs text-gray-600">Target Reps</div>
                  <div className="font-semibold">{targets.reps}</div>
                </div>
              )}
              
              {targets.weight && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Weight className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                  <div className="text-xs text-gray-600">Target Weight</div>
                  <div className="font-semibold">{targets.weight} {weightUnit}</div>
                </div>
              )}
              
              {targets.duration && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                  <div className="text-xs text-gray-600">Target Duration</div>
                  <div className="font-semibold">{formatTime(targets.duration)}</div>
                </div>
              )}
              
              {targets.distance && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Target className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                  <div className="text-xs text-gray-600">Target Distance</div>
                  <div className="font-semibold">{targets.distance} {distanceUnit}</div>
                </div>
              )}
            </div>
          )}

          {/* Smart Set Input Form */}
          {!isResting && isActive && (
            <div className="space-y-6">
              <Separator />
              <h4 className="font-medium text-lg">Log Current Set</h4>
              
              <div className="space-y-6">
                {/* Smart Weight Input */}
                <div>
                  <h5 className="text-sm font-medium mb-3">Weight ({weightUnit})</h5>
                  <SmartSetInput
                    type="weight"
                    value={currentInputs.weight}
                    unit={weightUnit}
                    target={targets.weight}
                    previousSets={completedSets}
                    exerciseHistory={[]}
                    onChange={(value) => onInputChange('weight', value)}
                  />
                </div>

                {/* Smart Reps Input */}
                <div>
                  <h5 className="text-sm font-medium mb-3">Reps</h5>
                  <SmartSetInput
                    type="reps"
                    value={currentInputs.reps}
                    target={targets.reps}
                    previousSets={completedSets}
                    exerciseHistory={[]}
                    onChange={(value) => onInputChange('reps', value)}
                  />
                </div>

                {/* Duration Input (if relevant) */}
                {targets.duration && (
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium">
                      Duration (seconds)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      value={currentInputs.duration}
                      onChange={(e) => onInputChange('duration', e.target.value)}
                      placeholder="0"
                      className="text-center text-lg font-semibold min-h-[60px] border-2 border-gray-300 focus:border-blue-500"
                      inputMode="numeric"
                    />
                  </div>
                )}

                {/* Distance Input (if relevant) */}
                {targets.distance && (
                  <div className="space-y-2">
                    <Label htmlFor="distance" className="text-sm font-medium">
                      Distance ({distanceUnit})
                    </Label>
                    <Input
                      id="distance"
                      type="number"
                      value={currentInputs.distance}
                      onChange={(e) => onInputChange('distance', e.target.value)}
                      placeholder="0"
                      className="text-center text-lg font-semibold min-h-[60px] border-2 border-gray-300 focus:border-blue-500"
                      inputMode="decimal"
                    />
                  </div>
                )}
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (optional)
                </Label>
                <Input
                  id="notes"
                  value={currentInputs.notes}
                  onChange={(e) => onInputChange('notes', e.target.value)}
                  placeholder="How did this set feel?"
                  className="w-full min-h-[48px]"
                />
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex space-x-3">
                <TouchButton
                  onClick={onCompleteSet}
                  disabled={!isSetComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold disabled:bg-gray-300 disabled:text-gray-500"
                  touchSize="xl"
                >
                  <CheckCircle2 className="mr-2 h-6 w-6" />
                  Complete Set {currentSet}
                  {(() => {
                    const weight = parseFloat(currentInputs.weight || '0');
                    const reps = parseInt(currentInputs.reps || '0');
                    
                    if (!isNaN(weight) && weight > 0 && !isNaN(reps) && reps > 0) {
                      return (
                        <span className="ml-2 text-green-100">({weight} {weightUnit} × {reps})</span>
                      );
                    }
                    return null;
                  })()}
                </TouchButton>
                
                {onSkipSet && (
                  <TouchButton
                    variant="outline"
                    onClick={onSkipSet}
                    touchSize="xl"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Skip
                  </TouchButton>
                )}
              </div>
            </div>
          )}

          {/* Completed Sets Display */}
          {completedSets.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <h4 className="font-medium">Completed Sets</h4>
              <div className="space-y-2">
                {completedSets.map((set) => (
                  <div
                    key={set.setNumber}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="bg-white">
                        Set {set.setNumber}
                      </Badge>
                      <div className="flex space-x-4 text-sm">
                        {set.weight && <span>{set.weight} {weightUnit}</span>}
                        {set.reps && <span>{set.reps} reps</span>}
                        {set.duration && <span>{formatTime(set.duration)}</span>}
                        {set.distance && <span>{set.distance} {distanceUnit}</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {onEditSet && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditSet(set.setNumber)}
                          className="h-8 w-8 p-0"
                          aria-label={`Edit set ${set.setNumber}`}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
});