/**
 * Exercise Video Enhancer Component
 * Handles video display and fetching for exercises during sessions
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExerciseVideoPlayer } from './exercise-video-player';
import { Loader2, Video, RefreshCw } from 'lucide-react';

interface VideoUrl {
  url: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: string;
  viewCount?: string;
  channelName?: string;
  relevanceScore?: number;
}

interface Exercise {
  name: string;
  description: string;
  instructions: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ExerciseVideoEnhancerProps {
  exerciseName: string;
  exercise: Exercise;
  videoUrls?: VideoUrl[];
  userContext?: {
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    language?: string;
    region?: string;
    preferences?: string[];
  };
  className?: string;
}

export function ExerciseVideoEnhancer({
  exerciseName,
  exercise,
  videoUrls = [],
  userContext = {
    fitnessLevel: 'intermediate',
    language: 'en',
    region: 'US',
    preferences: [],
  },
  className = ''
}: ExerciseVideoEnhancerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedVideos, setEnhancedVideos] = useState<VideoUrl[]>(videoUrls);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/enhance-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercises: [exercise],
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.exercises?.[0]?.videoUrls) {
        setEnhancedVideos(data.data.exercises[0].videoUrls);
      } else {
        throw new Error('No videos found for this exercise');
      }
    } catch (err) {
      console.error('Failed to enhance videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  // If we have videos, show them
  if (enhancedVideos.length > 0) {
    return (
      <div className={className}>
        <ExerciseVideoPlayer 
          exerciseName={exerciseName}
          videoUrls={enhancedVideos}
        />
        {/* Refresh option */}
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchVideos}
            disabled={isLoading}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Videos
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-4 px-3 bg-gray-50 rounded-lg border border-gray-200`}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-600">Loading exercise videos...</span>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className={`${className} p-3 bg-red-50 rounded-lg border border-red-200`}>
        <div className="flex items-start gap-2">
          <Video className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">Failed to load videos</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchVideos}
          className="mt-2 text-red-700 hover:text-red-800 hover:bg-red-100 h-auto p-1"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Try Again
        </Button>
      </div>
    );
  }

  // Show option to fetch videos
  return (
    <div className={`${className} p-3 bg-blue-50 rounded-lg border border-blue-200`}>
      <div className="flex items-center gap-2 mb-2">
        <Video className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-blue-900">Exercise Tutorials</span>
      </div>
      <p className="text-xs text-blue-700 mb-3">
        Get AI-curated video tutorials to learn proper form for this exercise.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={fetchVideos}
        disabled={isLoading}
        className="w-full bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
      >
        <Video className="h-4 w-4 mr-2" />
        Load Exercise Videos
      </Button>
    </div>
  );
}

export default ExerciseVideoEnhancer;