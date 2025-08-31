/**
 * AI Recommendations Component
 * Displays AI-powered recommendations during workout sessions
 */
'use client';

import React, { useState } from 'react';
import { 
  Brain, 
  Lightbulb, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { useSessionRecommendations } from '@/hooks/queries/use-workout-sessions-query';

interface AIRecommendationsProps {
  sessionId: string;
  context: {
    type: 'exercise_substitute' | 'rest_time' | 'intensity_adjustment' | 
          'form_improvement' | 'progression' | 'recovery';
    currentExerciseId?: string;
    perceivedExertion?: number;
    formRating?: number;
    availableEquipment?: string[];
    timeConstraint?: number;
    energyLevel?: number;
  };
  compact?: boolean;
  className?: string;
  onApplyRecommendation?: (recommendation: any) => void;
  onDismiss?: () => void;
}

interface RecommendationItemProps {
  recommendation: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
    action?: any;
    reason?: string;
  };
  onApply?: (recommendation: any) => void;
  compact?: boolean;
}

function RecommendationItem({ recommendation, onApply, compact = false }: RecommendationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = recommendation.description.length > 100;
  
  const getPriorityIcon = () => {
    switch (recommendation.priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Lightbulb className="h-4 w-4 text-orange-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  return (
    <div className={cn('p-3 rounded-lg border', getPriorityColor())}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getPriorityIcon()}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-gray-900 text-sm">
              {recommendation.title}
            </h4>
            <Badge variant="outline" className="ml-2 text-xs">
              {recommendation.priority}
            </Badge>
          </div>
          
          <div className="text-gray-600 text-xs mt-1">
            <p className={cn(
              "leading-relaxed",
              compact && isLongText && !isExpanded ? "line-clamp-2" : ""
            )}>
              {recommendation.description}
            </p>
            
            {compact && isLongText && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-blue-600 hover:text-blue-700 text-xs font-medium touch-manipulation"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                {isExpanded ? (
                  <span className="flex items-center gap-1">
                    Show Less <ChevronUp className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    Show More <ChevronDown className="h-3 w-3" />
                  </span>
                )}
              </button>
            )}
          </div>
          
          {recommendation.reason && !compact && (
            <p className="text-gray-500 text-xs mt-1 italic">
              {recommendation.reason}
            </p>
          )}
          
          {recommendation.actionable && onApply && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 px-2 text-xs"
              onClick={() => onApply(recommendation)}
            >
              Apply
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AIRecommendations({
  sessionId,
  context,
  compact = false,
  className,
  onApplyRecommendation,
  onDismiss,
}: AIRecommendationsProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isVisible, setIsVisible] = useState(true);

  const { 
    data: recommendationsData, 
    isLoading, 
    error, 
    refetch 
  } = useSessionRecommendations(sessionId, context);

  const recommendations = recommendationsData?.recommendations || [];

  const handleApplyRecommendation = (recommendation: any) => {
    onApplyRecommendation?.(recommendation);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible || recommendations.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={cn("border-blue-200", className)}>
        <CardContent className="p-4">
          <LoadingState 
            message="Getting AI recommendations..." 
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-red-200", className)}>
        <CardContent className="p-4">
          <ErrorState
            message="Failed to load recommendations"
            description={error instanceof Error ? error.message : 'Unknown error'}
            onRetry={refetch}
            variant="compact"
          />
        </CardContent>
      </Card>
    );
  }

  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
  
  return (
    <Card className={cn("border-blue-200 bg-blue-50/30", className)}>
      <CardHeader className={cn(
        "pb-2",
        compact ? "px-4 py-2" : "px-4 py-3"
      )}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center gap-2",
            compact ? "text-sm" : "text-base"
          )}>
            <Brain className={cn(
              "text-blue-600",
              compact ? "h-4 w-4" : "h-5 w-5"
            )} />
            AI Recommendations
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {highPriorityCount} urgent
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-1">
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-6 w-6 p-0"
              disabled={isLoading}
            >
              <RefreshCw className={cn(
                "h-3 w-3",
                isLoading && "animate-spin"
              )} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {(!compact || isExpanded) && (
        <CardContent className="px-4 pb-4 pt-0">
          <div className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <RecommendationItem
                key={index}
                recommendation={recommendation}
                onApply={handleApplyRecommendation}
                compact={compact}
              />
            ))}
          </div>
          
          {recommendationsData?.meta && (
            <div className="mt-3 pt-2 border-t border-blue-200">
              <div className="flex items-center justify-between text-xs text-blue-600">
                <span>
                  Confidence: {recommendationsData.meta.confidence}%
                </span>
                <span>
                  <Clock className="inline h-3 w-3 mr-1" />
                  {new Date(recommendationsData.generatedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Quick recommendation types for common scenarios
export function RestTimeRecommendations(props: Omit<AIRecommendationsProps, 'context'> & {
  perceivedExertion?: number;
  timeConstraint?: number;
}) {
  return (
    <AIRecommendations
      {...props}
      context={{
        type: 'rest_time',
        perceivedExertion: props.perceivedExertion,
        timeConstraint: props.timeConstraint,
      }}
    />
  );
}

export function FormImprovementRecommendations(props: Omit<AIRecommendationsProps, 'context'> & {
  currentExerciseId: string;
  formRating?: number;
  perceivedExertion?: number;
}) {
  return (
    <AIRecommendations
      {...props}
      context={{
        type: 'form_improvement',
        currentExerciseId: props.currentExerciseId,
        formRating: props.formRating,
        perceivedExertion: props.perceivedExertion,
      }}
    />
  );
}

export function IntensityAdjustmentRecommendations(props: Omit<AIRecommendationsProps, 'context'> & {
  perceivedExertion?: number;
  energyLevel?: number;
}) {
  return (
    <AIRecommendations
      {...props}
      context={{
        type: 'intensity_adjustment',
        perceivedExertion: props.perceivedExertion,
        energyLevel: props.energyLevel,
      }}
    />
  );
}