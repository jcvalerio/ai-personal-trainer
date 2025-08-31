'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TouchButton } from '@/components/ui/touch-button';
import { Mic, MicOff, Copy, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSmartDefaults } from '@/hooks/use-smart-defaults';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { useSwipeGestures } from '@/hooks/use-swipe-gestures';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface SmartSetInputProps {
  type: 'weight' | 'reps';
  value: string;
  unit?: string;
  target?: number;
  previousSets: Array<{ weight?: number; reps?: number }>;
  exerciseHistory: Array<{ weight?: number; reps?: number; date: Date }>;
  onChange: (value: string) => void;
  className?: string;
}

export const SmartSetInput = React.memo(function SmartSetInput({
  type,
  value,
  unit = '',
  target,
  previousSets,
  exerciseHistory,
  onChange,
  className
}: SmartSetInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use proper hooks
  const { getSmartWeight, getSmartReps } = useSmartDefaults();
  const { vibrateTap, vibrateSuccess } = useHapticFeedback();
  
  // Smart defaults with null safety to prevent NaN
  const smartDefault = type === 'weight' 
    ? getSmartWeight('bench press', exerciseHistory || [])
    : getSmartReps('bench press');
    
  // Calculate progression based on history
  const progression = calculateProgression(type, exerciseHistory || []);
  
  // Quick adjustment values
  const adjustmentValues = type === 'weight' ? [1, 2.5, 5, 10] : [1, 2, 5];
  
  // Define adjustValue before using it
  const adjustValue = useCallback((delta: number) => {
    const currentValue = parseFloat(value) || 0;
    const newValue = Math.max(0, currentValue + delta);
    onChange(newValue.toString());
    vibrateTap();
  }, [value, onChange, vibrateTap]);
  
  // Auto-fill smart default when component mounts
  useEffect(() => {
    if (!value && smartDefault && smartDefault > 0) {
      onChange(smartDefault.toString());
    }
  }, [smartDefault, value, onChange]);

  // Voice input
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceInput();

  // Parse voice input
  useEffect(() => {
    if (transcript) {
      const numericValue = extractNumericValue(transcript);
      if (numericValue && numericValue > 0) {
        onChange(numericValue.toString());
        vibrateSuccess();
      }
    }
  }, [transcript, onChange, vibrateSuccess]);

  // Swipe gesture handlers
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: () => adjustValue(-adjustmentValues[0]),
    onSwipeRight: () => adjustValue(adjustmentValues[0]),
    onSwipeUp: () => adjustValue(adjustmentValues[1]),
    onSwipeDown: () => adjustValue(-adjustmentValues[1])
  });

  const handleSameAsLast = useCallback(() => {
    const lastValue = previousSets[previousSets.length - 1]?.[type];
    if (lastValue && typeof lastValue === 'number' && !isNaN(lastValue) && lastValue > 0) {
      onChange(lastValue.toString());
      vibrateSuccess();
    }
  }, [previousSets, type, onChange, vibrateSuccess]);

  const handleUseProgression = useCallback(() => {
    if (progression && typeof progression === 'number' && !isNaN(progression) && progression > 0) {
      onChange(progression.toString());
      vibrateSuccess();
    }
  }, [progression, onChange, vibrateSuccess]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Smart Suggestions */}
      <div className="flex flex-wrap gap-2">
        {previousSets.length > 0 && (() => {
          const lastValue = previousSets[previousSets.length - 1]?.[type];
          return lastValue && typeof lastValue === 'number' && !isNaN(lastValue) && lastValue > 0 ? (
            <TouchButton
              variant="outline"
              size="sm"
              onClick={handleSameAsLast}
              className="px-3 text-xs font-medium bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              <Copy className="mr-1 h-3 w-3" />
              Same ({lastValue} {unit})
            </TouchButton>
          ) : null;
        })()}
        
        {progression && 
         typeof progression === 'number' && 
         !isNaN(progression) && 
         progression > 0 && 
         progression !== parseFloat(value || '0') && (
          <TouchButton
            variant="outline"
            size="sm"
            onClick={handleUseProgression}
            className="px-3 text-xs font-medium bg-green-50 border-green-200 hover:bg-green-100"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Progress ({progression} {unit})
          </TouchButton>
        )}
      </div>

      {/* Input with Quick Adjustments */}
      <div className="flex items-center space-x-2">
        {/* Large Decrease */}
        <TouchButton
          variant="outline"
          onClick={() => adjustValue(-adjustmentValues[2])}
          className="text-lg font-bold text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={!value || parseFloat(value) <= adjustmentValues[2]}
        >
          -{adjustmentValues[2]}
        </TouchButton>

        {/* Small Decrease */}
        <TouchButton
          variant="outline"
          onClick={() => adjustValue(-adjustmentValues[0])}
          className="text-lg font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          disabled={!value || parseFloat(value) <= 0}
        >
          -{adjustmentValues[0]}
        </TouchButton>

        {/* Main Input */}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            className="text-center text-xl font-semibold min-h-[60px] pr-16 border-2 border-gray-300 focus:border-blue-500"
            inputMode={type === 'weight' ? 'decimal' : 'numeric'}
            step={type === 'weight' ? '0.5' : '1'}
          />
          {unit && (
            <Badge variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2">
              {unit}
            </Badge>
          )}
          
          {/* Voice Input Button */}
          {isSupported && (
            <TouchButton
              variant="ghost"
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "absolute right-12 top-1/2 -translate-y-1/2 w-8 h-8 p-0",
                isListening && "bg-red-100 text-red-600"
              )}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </TouchButton>
          )}
        </div>

        {/* Small Increase */}
        <TouchButton
          variant="outline"
          onClick={() => adjustValue(adjustmentValues[0])}
          className="text-lg font-bold text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          +{adjustmentValues[0]}
        </TouchButton>

        {/* Large Increase */}
        <TouchButton
          variant="outline"
          onClick={() => adjustValue(adjustmentValues[2])}
          className="text-lg font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          +{adjustmentValues[2]}
        </TouchButton>
      </div>

      {/* Target Comparison */}
      {target && parseFloat(value) && (
        <div className="text-center">
          <Badge 
            variant={parseFloat(value) >= target ? "default" : "secondary"}
            className="text-sm"
          >
            Target: {target} {unit} | Current: {value} {unit}
          </Badge>
        </div>
      )}

      {/* Voice Feedback */}
      {isListening && (
        <div className="text-center">
          <Badge variant="outline" className="animate-pulse bg-red-50 text-red-700">
            🎤 Listening... Say a number
          </Badge>
        </div>
      )}
    </div>
  );
});

// Helper function to extract numeric values from voice input
function extractNumericValue(text: string): number | null {
  const numbers = text.match(/\d+\.?\d*/);
  return numbers ? parseFloat(numbers[0]) : null;
}

// Helper function to calculate progression from history
function calculateProgression(type: 'weight' | 'reps', history: Array<{ weight?: number; reps?: number; date: Date }>): number {
  if (!history.length) return 0;
  
  const values = history.map(h => h[type]).filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (!values.length) return 0;
  
  const lastValue = values[values.length - 1];
  const increment = type === 'weight' ? 2.5 : 1;
  
  return lastValue + increment;
}