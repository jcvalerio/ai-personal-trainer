/**
 * Exercise Video Player Component
 * Supports YouTube, TikTok, and Instagram videos during workout sessions
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Play,
  ExternalLink,
  Video,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface VideoUrl {
  url: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
  title: string;
  description?: string;
}

interface ExerciseVideoPlayerProps {
  exerciseName: string;
  videoUrls: VideoUrl[];
  className?: string;
}

export function ExerciseVideoPlayer({ 
  exerciseName, 
  videoUrls, 
  className = '' 
}: ExerciseVideoPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  if (!videoUrls || videoUrls.length === 0) {
    return null;
  }

  const currentVideo = videoUrls[currentVideoIndex];
  
  const platformConfig = {
    youtube: {
      icon: '📺',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      name: 'YouTube'
    },
    tiktok: {
      icon: '🎵',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      name: 'TikTok'
    },
    instagram: {
      icon: '📸',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      name: 'Instagram'
    }
  };

  const getEmbedUrl = (video: VideoUrl): string => {
    switch (video.platform) {
      case 'youtube':
        // Extract video ID from YouTube URL and create embed URL
        const youtubeMatch = video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (youtubeMatch) {
          return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }
        break;
      case 'tiktok':
        // TikTok doesn't support embedding directly, return original URL
        return video.url;
      case 'instagram':
        // Instagram doesn't support direct embedding, return original URL
        return video.url;
    }
    return video.url;
  };

  const canEmbed = (platform: string): boolean => {
    return platform === 'youtube';
  };

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videoUrls.length);
  };

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videoUrls.length) % videoUrls.length);
  };

  return (
    <div className={className}>
      {/* Compact video links for mobile */}
      <div className="flex flex-wrap gap-2 mb-2 md:hidden">
        {videoUrls.map((video, index) => {
          const config = platformConfig[video.platform];
          return (
            <a
              key={index}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${config.bgColor} ${config.color} hover:opacity-80`}
              title={video.title}
            >
              <span>{config.icon}</span>
              <span className="capitalize">{video.platform}</span>
            </a>
          );
        })}
      </div>

      {/* Video player dialog for larger screens */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full md:w-auto hidden md:flex"
          >
            <Play className="h-4 w-4 mr-2" />
            Watch Tutorial ({videoUrls.length})
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{exerciseName} - Tutorial</span>
              <div className="flex items-center gap-2">
                {videoUrls.length > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevVideo}
                      disabled={videoUrls.length <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      {currentVideoIndex + 1} / {videoUrls.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextVideo}
                      disabled={videoUrls.length <= 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current video info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${platformConfig[currentVideo.platform].bgColor}`}>
                <span>{platformConfig[currentVideo.platform].icon}</span>
                <span className={`text-sm font-medium ${platformConfig[currentVideo.platform].color}`}>
                  {platformConfig[currentVideo.platform].name}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{currentVideo.title}</h3>
                {currentVideo.description && (
                  <p className="text-sm text-gray-600">{currentVideo.description}</p>
                )}
              </div>
              <a
                href={currentVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </a>
            </div>

            {/* Video player */}
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {canEmbed(currentVideo.platform) ? (
                <iframe
                  src={getEmbedUrl(currentVideo)}
                  title={currentVideo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200">
                  <div className="text-center p-6">
                    <Video className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3">
                      This video cannot be embedded directly.
                    </p>
                    <a
                      href={currentVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Watch on {platformConfig[currentVideo.platform].name}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* All video options */}
            {videoUrls.length > 1 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">All tutorials:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {videoUrls.map((video, index) => {
                    const config = platformConfig[video.platform];
                    const isActive = index === currentVideoIndex;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentVideoIndex(index)}
                        className={`flex items-center gap-3 p-3 text-left rounded-lg border transition-colors ${
                          isActive 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${config.bgColor}`}>
                          <span className="text-sm">{config.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isActive ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {video.title}
                          </p>
                          <p className={`text-xs truncate ${
                            isActive ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {config.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExerciseVideoPlayer;