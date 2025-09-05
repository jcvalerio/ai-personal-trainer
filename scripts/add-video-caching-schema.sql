-- Video Caching Schema Migration
-- Adds video enhancement and caching capabilities to the database
-- Designed to store YouTube, TikTok, and Instagram video results

-- Create video platform enum
CREATE TYPE video_platform AS ENUM ('youtube', 'tiktok', 'instagram');

-- Create video cache status enum
CREATE TYPE video_cache_status AS ENUM ('fresh', 'stale', 'expired', 'invalid');

-- Exercise video cache table
-- Stores cached video search results for exercises to reduce API calls
CREATE TABLE exercise_video_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Exercise identification (can work with both library exercises and AI-generated ones)
  exercise_name VARCHAR(200) NOT NULL,
  exercise_description TEXT,
  muscle_groups JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  difficulty_level fitness_level DEFAULT 'beginner',
  
  -- Search context for cache key generation
  user_context JSONB NOT NULL DEFAULT '{}', -- fitness level, language, region, preferences
  search_query VARCHAR(500) NOT NULL, -- the actual search query used
  search_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for quick lookups
  
  -- Cache metadata
  cache_status video_cache_status DEFAULT 'fresh',
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  access_count INTEGER DEFAULT 1,
  
  -- API call tracking
  api_calls_made INTEGER DEFAULT 1, -- number of API calls made to generate this cache
  total_results_found INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT valid_exercise_name CHECK (LENGTH(TRIM(exercise_name)) >= 2),
  CONSTRAINT valid_search_query CHECK (LENGTH(TRIM(search_query)) >= 3),
  CONSTRAINT valid_search_hash CHECK (LENGTH(search_hash) = 64),
  CONSTRAINT valid_expiration CHECK (expires_at > cached_at),
  CONSTRAINT valid_access_count CHECK (access_count >= 0),
  CONSTRAINT valid_api_calls CHECK (api_calls_made >= 0)
);

-- Exercise videos table
-- Stores individual video results with quality scores and metadata
CREATE TABLE exercise_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_id UUID NOT NULL REFERENCES exercise_video_cache(id) ON DELETE CASCADE,
  
  -- Video identification
  url TEXT NOT NULL,
  platform video_platform NOT NULL,
  video_id VARCHAR(100) NOT NULL, -- platform-specific video ID
  
  -- Video metadata
  title VARCHAR(500) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration VARCHAR(20), -- e.g., "PT5M30S" for ISO 8601 duration
  channel_name VARCHAR(200),
  channel_id VARCHAR(100),
  
  -- Engagement metrics (when available)
  view_count BIGINT,
  like_count BIGINT,
  comment_count BIGINT,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- AI quality scoring
  relevance_score INTEGER NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  form_instruction_score INTEGER CHECK (form_instruction_score >= 0 AND form_instruction_score <= 100),
  fitness_level_match_score INTEGER CHECK (fitness_level_match_score >= 0 AND fitness_level_match_score <= 100),
  
  -- Selection metadata
  selected_for_user BOOLEAN DEFAULT FALSE,
  selection_rank INTEGER, -- 1, 2, 3 for top selections
  ai_selection_reasoning TEXT,
  
  -- Validation and quality flags
  url_validated BOOLEAN DEFAULT FALSE,
  url_last_checked TIMESTAMP WITH TIME ZONE,
  is_available BOOLEAN DEFAULT TRUE,
  content_warning_flags JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT valid_video_url CHECK (url ~ '^https?://'),
  CONSTRAINT valid_video_title CHECK (LENGTH(TRIM(title)) >= 1),
  CONSTRAINT valid_video_id CHECK (LENGTH(TRIM(video_id)) >= 1),
  CONSTRAINT valid_selection_rank CHECK (selection_rank IS NULL OR (selection_rank >= 1 AND selection_rank <= 10)),
  CONSTRAINT unique_video_per_cache UNIQUE (cache_id, platform, video_id)
);

-- API usage tracking table
-- Tracks API calls to monitor quotas and costs
CREATE TABLE video_api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- API identification
  api_provider VARCHAR(50) NOT NULL, -- 'youtube', 'tiktok', 'instagram'
  endpoint VARCHAR(200) NOT NULL, -- specific API endpoint used
  
  -- Usage tracking
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  cache_id UUID REFERENCES exercise_video_cache(id) ON DELETE SET NULL,
  
  -- Request details
  request_parameters JSONB DEFAULT '{}',
  query_used VARCHAR(500),
  results_count INTEGER DEFAULT 0,
  
  -- Response details
  response_status VARCHAR(20), -- 'success', 'error', 'rate_limit', 'quota_exceeded'
  response_time_ms INTEGER,
  api_quota_used INTEGER DEFAULT 1,
  error_message TEXT,
  
  -- Cost tracking (if applicable)
  estimated_cost_usd DECIMAL(10,6) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_api_provider CHECK (api_provider IN ('youtube', 'tiktok', 'instagram')),
  CONSTRAINT valid_response_status CHECK (response_status IN ('success', 'error', 'rate_limit', 'quota_exceeded')),
  CONSTRAINT valid_results_count CHECK (results_count >= 0),
  CONSTRAINT valid_response_time CHECK (response_time_ms >= 0),
  CONSTRAINT valid_quota_used CHECK (api_quota_used >= 0)
);

-- User video preferences table
-- Tracks user preferences and feedback on video selections
CREATE TABLE user_video_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES exercise_videos(id) ON DELETE CASCADE,
  
  -- User feedback
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'helpful', 'not_helpful', 'inappropriate')),
  feedback_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Usage tracking
  times_viewed INTEGER DEFAULT 1 CHECK (times_viewed >= 0),
  total_watch_time_seconds INTEGER DEFAULT 0 CHECK (total_watch_time_seconds >= 0),
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- User notes
  user_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_user_video_feedback UNIQUE (user_id, video_id, feedback_type)
);

-- Indexes for optimal performance

-- Cache lookup indexes
CREATE UNIQUE INDEX idx_video_cache_search_hash ON exercise_video_cache(search_hash) WHERE is_active = true;
CREATE INDEX idx_video_cache_exercise_context ON exercise_video_cache(exercise_name, difficulty_level, cache_status) WHERE is_active = true;
CREATE INDEX idx_video_cache_expiration ON exercise_video_cache(expires_at, cache_status) WHERE is_active = true;
CREATE INDEX idx_video_cache_access_pattern ON exercise_video_cache(last_accessed_at DESC, access_count DESC) WHERE is_active = true;

-- Video lookup indexes
CREATE INDEX idx_videos_cache_relevance ON exercise_videos(cache_id, relevance_score DESC, selected_for_user DESC) WHERE is_active = true;
CREATE INDEX idx_videos_platform_availability ON exercise_videos(platform, is_available, url_validated) WHERE is_active = true;
CREATE INDEX idx_videos_selection_rank ON exercise_videos(cache_id, selection_rank) WHERE selected_for_user = true AND is_active = true;
CREATE INDEX idx_videos_quality_scores ON exercise_videos(cache_id, quality_score DESC, form_instruction_score DESC) WHERE is_active = true;

-- API usage indexes
CREATE INDEX idx_api_usage_provider_time ON video_api_usage(api_provider, request_timestamp DESC);
CREATE INDEX idx_api_usage_user_time ON video_api_usage(user_id, request_timestamp DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_api_usage_quota_tracking ON video_api_usage(api_provider, DATE(request_timestamp), api_quota_used);
CREATE INDEX idx_api_usage_response_status ON video_api_usage(api_provider, response_status, request_timestamp DESC);

-- User preferences indexes
CREATE INDEX idx_user_preferences_feedback ON user_video_preferences(user_id, feedback_type, feedback_timestamp DESC);
CREATE INDEX idx_user_preferences_usage ON user_video_preferences(user_id, times_viewed DESC, last_viewed_at DESC);
CREATE INDEX idx_video_feedback_aggregation ON user_video_preferences(video_id, feedback_type);

-- Update triggers
CREATE TRIGGER update_video_cache_updated_at BEFORE UPDATE ON exercise_video_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_videos_updated_at BEFORE UPDATE ON exercise_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_video_preferences_updated_at BEFORE UPDATE ON user_video_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cache management functions

-- Function to check and update cache expiration status
CREATE OR REPLACE FUNCTION update_video_cache_status()
RETURNS void AS $$
BEGIN
  -- Mark expired caches as expired
  UPDATE exercise_video_cache 
  SET cache_status = 'expired'
  WHERE expires_at < CURRENT_TIMESTAMP 
    AND cache_status != 'expired'
    AND is_active = true;
    
  -- Mark stale caches (older than 3 days but not expired)
  UPDATE exercise_video_cache 
  SET cache_status = 'stale'
  WHERE cached_at < (CURRENT_TIMESTAMP - INTERVAL '3 days')
    AND expires_at > CURRENT_TIMESTAMP
    AND cache_status = 'fresh'
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_video_cache(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete expired cache entries older than retention period
  DELETE FROM exercise_video_cache 
  WHERE cache_status = 'expired' 
    AND expires_at < (CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days);
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update cache access tracking
CREATE OR REPLACE FUNCTION update_cache_access(cache_hash VARCHAR(64))
RETURNS void AS $$
BEGIN
  UPDATE exercise_video_cache 
  SET 
    last_accessed_at = CURRENT_TIMESTAMP,
    access_count = access_count + 1
  WHERE search_hash = cache_hash 
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get API usage statistics
CREATE OR REPLACE FUNCTION get_api_usage_stats(
  provider_name VARCHAR(50) DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  api_provider VARCHAR(50),
  request_count BIGINT,
  quota_used BIGINT,
  success_rate DECIMAL(5,2),
  avg_response_time INTEGER,
  total_cost DECIMAL(10,6)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vau.api_provider,
    COUNT(*)::BIGINT as request_count,
    SUM(vau.api_quota_used)::BIGINT as quota_used,
    (COUNT(CASE WHEN vau.response_status = 'success' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)::DECIMAL(5,2) as success_rate,
    AVG(vau.response_time_ms)::INTEGER as avg_response_time,
    SUM(vau.estimated_cost_usd)::DECIMAL(10,6) as total_cost
  FROM video_api_usage vau
  WHERE (provider_name IS NULL OR vau.api_provider = provider_name)
    AND DATE(vau.request_timestamp) BETWEEN start_date AND end_date
  GROUP BY vau.api_provider
  ORDER BY quota_used DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy cache statistics
CREATE VIEW video_cache_statistics AS
SELECT 
  cache_status,
  COUNT(*) as cache_count,
  AVG(access_count) as avg_access_count,
  AVG(total_results_found) as avg_results_per_cache,
  MIN(cached_at) as oldest_cache,
  MAX(cached_at) as newest_cache,
  COUNT(CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_caches
FROM exercise_video_cache
WHERE is_active = true
GROUP BY cache_status;

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Video caching schema migration completed successfully';
  RAISE NOTICE 'Tables created: exercise_video_cache, exercise_videos, video_api_usage, user_video_preferences';
  RAISE NOTICE 'Indexes created: % performance-optimized indexes', 15;
  RAISE NOTICE 'Functions created: cache management and statistics functions';
  RAISE NOTICE 'Views created: video_cache_statistics';
END $$;