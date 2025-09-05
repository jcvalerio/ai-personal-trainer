/**
 * AI Video Enhancement API
 * Enhances workout exercises with real YouTube, TikTok, and Instagram videos
 * Uses platform APIs to search and AI to rank and select best content
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { generateForVideoEnhancement, isAIServiceConfigured, getAvailableModels } from '@/lib/services/ai-model-service';

// Simple in-memory cache for development (use Redis in production)
const videoCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes


// Validation schemas
const exerciseInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  instructions: z.string(),
  muscleGroups: z.array(z.string()),
  equipment: z.array(z.string()),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

const userContextSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  language: z.string().optional().default('en'),
  region: z.string().optional().default('US'),
  preferences: z.array(z.string()).optional().default([]),
});

const enhanceVideosRequestSchema = z.object({
  exercises: z.array(exerciseInputSchema).min(1).max(20),
  userContext: userContextSchema,
});

const videoResultSchema = z.object({
  url: z.string().url(),
  platform: z.enum(['youtube', 'tiktok', 'instagram']),
  title: z.string(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
  duration: z.string().optional().nullable(),
  viewCount: z.string().optional().nullable(),
  channelName: z.string().optional().nullable(),
  relevanceScore: z.number().min(0).max(100),
});

// YouTube Data API integration
async function searchYouTubeVideos(
  query: string,
  userContext: z.infer<typeof userContextSchema>
): Promise<any[]> {
  if (!process.env.YOUTUBE_DATA_API_KEY) {
    console.warn('YouTube Data API key not configured');
    return [];
  }

  try {
    const searchQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&type=video&q=${searchQuery}&` +
      `maxResults=10&order=relevance&videoDefinition=any&` +
      `regionCode=${userContext.region}&relevanceLanguage=${userContext.language}&` +
      `key=${process.env.YOUTUBE_DATA_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('YouTube search failed:', error);
    return [];
  }
}

// Get video details from YouTube
async function getYouTubeVideoDetails(videoIds: string[]): Promise<any[]> {
  if (!process.env.YOUTUBE_DATA_API_KEY || videoIds.length === 0) {
    return [];
  }

  try {
    const ids = videoIds.join(',');
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet,statistics,contentDetails&id=${ids}&` +
      `key=${process.env.YOUTUBE_DATA_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('YouTube video details failed:', error);
    return [];
  }
}

// Convert YouTube search results to standardized format
function convertYouTubeResults(searchResults: any[], videoDetails: any[]) {
  const detailsMap = new Map(videoDetails.map(item => [item.id, item]));
  
  return searchResults.map(item => {
    const details = detailsMap.get(item.id.videoId);
    return {
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      platform: 'youtube',
      title: item.snippet.title || 'Untitled Video',
      description: item.snippet.description || undefined,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || null,
      duration: details?.contentDetails?.duration || null,
      viewCount: details?.statistics?.viewCount || null,
      channelName: item.snippet.channelTitle || null,
      publishedAt: item.snippet.publishedAt,
    };
  });
}

// AI-powered video ranking and selection
async function rankAndSelectVideos(
  videos: any[],
  exercise: z.infer<typeof exerciseInputSchema>,
  userContext: z.infer<typeof userContextSchema>
): Promise<z.infer<typeof videoResultSchema>[]> {
  if (videos.length === 0) {
    return [];
  }

  const prompt = `You are a fitness expert evaluating exercise tutorial videos. 
Analyze these YouTube videos for the exercise "${exercise.name}" and select the best 1-3 videos.

Exercise Details:
- Name: ${exercise.name}
- Description: ${exercise.description}
- Instructions: ${exercise.instructions}
- Muscle Groups: ${exercise.muscleGroups.join(', ')}
- Equipment: ${exercise.equipment.join(', ')}
- Difficulty: ${exercise.difficulty}

User Context:
- Fitness Level: ${userContext.fitnessLevel}
- Language: ${userContext.language}
- Preferences: ${userContext.preferences.join(', ')}

Available Videos:
${videos.map((video, index) => `
${index + 1}. Title: "${video.title}"
   Channel: ${video.channelName}
   URL: ${video.url}
   Views: ${video.viewCount || 'N/A'}
   Duration: ${video.duration || 'N/A'}
   Description: ${video.description?.substring(0, 200) || 'No description'}...
`).join('\n')}

Evaluate each video based on:
1. Form instruction quality (40%)
2. Fitness level appropriateness (25%)
3. Video quality and clarity (15%)
4. Channel credibility (10%)
5. User engagement (view count, likes) (10%)

Select the 1-3 BEST videos and assign relevance scores (0-100).
Prioritize videos that:
- Show proper form clearly
- Match the user's fitness level
- Have good production quality
- Come from credible fitness channels
- Are in the preferred language

Return ONLY a valid JSON array:
[
  {
    "url": "full_youtube_url",
    "platform": "youtube",
    "title": "video_title",
    "description": "brief_description",
    "thumbnailUrl": "thumbnail_url_if_available",
    "duration": "duration_if_available",
    "viewCount": "view_count_if_available",
    "channelName": "channel_name",
    "relevanceScore": 85
  }
]`;

  try {
    // Generate video enhancement using optimized model selection (legacy fast models)
    const result = await generateForVideoEnhancement(prompt, {
      verbose: process.env.NODE_ENV === 'development',
    });

    const text = result.text;
    const usedModel = result.usedModel;
    
    // Log model usage in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Video enhancement generated using ${result.usedModel.name} in ${result.duration}ms (${result.attempts} attempts)`);
    }

    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const rankedVideos = JSON.parse(jsonMatch[0]);
    
    // Validate the results
    const validatedVideos = z.array(videoResultSchema).safeParse(rankedVideos);
    if (!validatedVideos.success) {
      console.error(`Invalid video ranking results from ${usedModel?.name}:`, validatedVideos.error);
      return [];
    }

    console.log(`📊 Model ${usedModel?.name} ranked ${validatedVideos.data.length} videos for ${exercise.name}`);
    return {
      videos: validatedVideos.data,
      modelUsed: usedModel?.name
    };
  } catch (error) {
    console.error('AI video ranking failed:', error);
    
    // Fallback: Return top 3 videos with basic scoring
    console.warn('Using fallback video selection');
    return {
      videos: videos.slice(0, 3).map((video, index) => ({
        url: video.url,
        platform: video.platform,
        title: video.title,
        description: video.description || undefined,
        thumbnailUrl: video.thumbnailUrl || null,
        duration: video.duration || null,
        viewCount: video.viewCount || null,
        channelName: video.channelName || null,
        relevanceScore: Math.max(85 - (index * 10), 50), // 85, 75, 65...
      })),
      modelUsed: null // Indicates fallback was used
    };
  }
}

/**
 * POST /api/ai/enhance-videos
 * Enhance exercises with curated video content
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if AI service is configured
    if (!isAIServiceConfigured()) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedRequest = enhanceVideosRequestSchema.safeParse(body);
    if (!validatedRequest.success) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: validatedRequest.error.errors,
        },
        { status: 400 }
      );
    }

    const { exercises, userContext } = validatedRequest.data;

    // Process each exercise
    const enhancedExercises = [];
    const modelUsageStats = {
      'gemini-1.5-pro': 0,
      'gemini-1.5-flash': 0,
      'gemini-1.5-flash-8b': 0,
      'fallback': 0,
    };

    for (const exercise of exercises) {
      try {
        // Create search query for the exercise
        const searchQuery = `${exercise.name} exercise form tutorial ${exercise.difficulty} ${exercise.equipment.join(' ')}`;
        
        // Generate cache key
        const cacheKey = createHash('sha256')
          .update(JSON.stringify({ searchQuery, userContext }))
          .digest('hex');

        // Check cache first
        const cached = videoCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          console.log(`Using cached results for: ${exercise.name} (was ${cached.modelUsed || 'fallback'})`);
          enhancedExercises.push({
            ...exercise,
            videoUrls: cached.videos,
            videoSearched: true,
            videoCount: cached.videos.length,
            fromCache: true,
          });
          
          // Track cached model usage
          const cachedModel = cached.modelUsed || 'fallback';
          modelUsageStats[cachedModel] = (modelUsageStats[cachedModel] || 0) + 1;
          continue;
        }

        // Search YouTube for videos
        const youtubeResults = await searchYouTubeVideos(searchQuery, userContext);
        
        // Get detailed video information
        const videoIds = youtubeResults.map(item => item.id.videoId).filter(Boolean);
        const videoDetails = await getYouTubeVideoDetails(videoIds);
        
        // Convert to standardized format
        const standardizedVideos = convertYouTubeResults(youtubeResults, videoDetails);

        // Use AI to rank and select best videos
        const { videos: selectedVideos, modelUsed } = await rankAndSelectVideos(standardizedVideos, exercise, userContext);
        
        // Track model usage
        if (modelUsed) {
          modelUsageStats[modelUsed] = (modelUsageStats[modelUsed] || 0) + 1;
        } else {
          modelUsageStats.fallback += 1;
        }

        // Cache the results
        videoCache.set(cacheKey, {
          videos: selectedVideos,
          modelUsed: modelUsed,
          timestamp: Date.now()
        });

        enhancedExercises.push({
          ...exercise,
          videoUrls: selectedVideos,
          videoSearched: true,
          videoCount: selectedVideos.length,
        });

        // Add delay to respect API rate limits and reduce load
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to enhance exercise "${exercise.name}":`, error);
        
        // Return exercise without videos if enhancement fails
        enhancedExercises.push({
          ...exercise,
          videoUrls: [],
          videoSearched: false,
          videoCount: 0,
          enhancementError: 'Failed to fetch videos',
        });
        
        modelUsageStats.fallback += 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        exercises: enhancedExercises,
        totalExercises: exercises.length,
        enhancedCount: enhancedExercises.filter(ex => ex.videoCount > 0).length,
        userContext,
        modelUsage: modelUsageStats,
      },
      message: 'Exercises enhanced with video content',
      meta: {
        modelsAvailable: getAvailableModels().map(m => ({
          name: m.name,
          description: m.description
        })),
        modelUsageStats,
      }
    });
  } catch (error) {
    console.error('Error enhancing videos:', error);

    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage =
      isDevelopment && error instanceof Error
        ? error.message
        : 'Failed to enhance exercises with videos. Please try again.';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET /api/ai/enhance-videos
 * Get video enhancement service info
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      supportedPlatforms: ['youtube'],
      maxExercises: 20,
      maxVideosPerExercise: 3,
      supportedLanguages: ['en', 'es', 'fr', 'de'],
      features: [
        'AI-powered video ranking',
        'Cascading model fallback (Pro → Flash → Flash-8B)',
        'Fitness level matching',
        'Form quality assessment',
        'Channel credibility scoring',
        'Real-time video validation',
        'Intelligent caching system',
      ],
      aiModels: getAvailableModels().map(model => ({
        name: model.name,
        description: model.description,
        maxTokens: model.config.maxOutputTokens,
        temperature: model.config.temperature,
      })),
      fallbackStrategy: 'Most powerful model first, auto-fallback on overload',
    },
  });
}