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

export function ExerciseProgressCard({
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

  // Check if set can be completed
  const canCompleteSet = currentInputs.reps || currentInputs.weight || currentInputs.duration || currentInputs.distance;

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

          {/* Current Set Input Form */}
          {!isResting && isActive && (
            <div className="space-y-4">
              <Separator />
              <h4 className="font-medium">Log Current Set</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weight Input */}
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-medium">
                    Weight ({weightUnit})
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustValue('weight', -5)}
                      disabled={!currentInputs.weight || parseFloat(currentInputs.weight) <= 0}
                      className="min-w-[44px] min-h-[44px] p-0"
                      aria-label="Decrease weight by 5"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="weight"
                      type="number"
                      value={currentInputs.weight}
                      onChange={(e) => onInputChange('weight', e.target.value)}
                      placeholder="0"
                      className="text-center"
                      inputMode="decimal"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustValue('weight', 5)}
                      className="min-w-[44px] min-h-[44px] p-0"
                      aria-label="Increase weight by 5"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Reps Input */}
                <div className="space-y-2">
                  <Label htmlFor="reps" className="text-sm font-medium">
                    Reps
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustValue('reps', -1)}
                      disabled={!currentInputs.reps || parseInt(currentInputs.reps) <= 0}
                      className="min-w-[44px] min-h-[44px] p-0"
                      aria-label="Decrease reps by 1"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="reps"
                      type="number"
                      value={currentInputs.reps}
                      onChange={(e) => onInputChange('reps', e.target.value)}
                      placeholder="0"
                      className="text-center"
                      inputMode="numeric"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustValue('reps', 1)}
                      className="min-w-[44px] min-h-[44px] p-0"
                      aria-label="Increase reps by 1"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
                  placeholder="Add notes about this set..."
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={onCompleteSet}
                  disabled={!canCompleteSet}
                  className="flex-1 min-h-[48px] touch-manipulation"
                  size="lg"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Complete Set
                </Button>
                
                {onSkipSet && (
                  <Button
                    variant="outline"
                    onClick={onSkipSet}
                    className="min-h-[48px] touch-manipulation"
                  >
                    Skip Set
                  </Button>
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
}