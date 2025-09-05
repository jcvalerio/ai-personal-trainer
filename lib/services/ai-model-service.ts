/**
 * Reusable AI Model Service with Cascading Fallback Logic
 * 
 * Provides robust model fallback from most powerful to least powerful
 * with timeout handling and retry logic for overloaded models.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
);

// Model configuration with cascading fallback strategy
export interface GeminiModelConfig {
  name: string;
  description: string;
  config: {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  };
}

// Cascading model fallback - most powerful first, then degrade on overload
// Based on Google AI Studio documentation (January 2025)
export const GEMINI_MODELS: GeminiModelConfig[] = [
  {
    name: 'gemini-2.5-pro',
    description: 'Most powerful thinking model - maximum response accuracy',
    config: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
    }
  },
  {
    name: 'gemini-2.5-flash',
    description: 'Best price-performance with adaptive thinking',
    config: {
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 4096,
    }
  },
  {
    name: 'gemini-2.5-flash-lite',
    description: 'Most cost-efficient with high throughput',
    config: {
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    }
  },
  {
    name: 'gemini-2.0-flash',
    description: 'Next generation features and speed',
    config: {
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    }
  },
  {
    name: 'gemini-2.0-flash-lite',
    description: 'Cost efficient with low latency',
    config: {
      temperature: 0.4,
      topP: 0.9,
      topK: 64,
      maxOutputTokens: 1024,
    }
  },
  {
    name: 'gemini-1.5-flash',
    description: 'Fast and versatile (legacy)',
    config: {
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    }
  },
  {
    name: 'gemini-1.5-flash-8b',
    description: 'High volume and lower intelligence (deprecated)',
    config: {
      temperature: 0.4,
      topP: 0.9,
      topK: 64,
      maxOutputTokens: 1024,
    }
  }
];

export interface AIModelOptions {
  /** Custom timeout in milliseconds (default: from AI_GENERATION_TIMEOUT_MS env or 60000) */
  timeoutMs?: number;
  /** Start from a specific model instead of the most powerful (default: 'gemini-2.5-pro') */
  startFromModel?: string;
  /** Custom model configs to override defaults */
  customModels?: GeminiModelConfig[];
  /** Enable verbose logging */
  verbose?: boolean;
  /** Custom retry delay between models in ms (default: 1000) */
  retryDelayMs?: number;
}

export interface AIModelResult {
  /** The generated response text */
  text: string;
  /** The model configuration that was successfully used */
  usedModel: GeminiModelConfig;
  /** Total attempts made before success */
  attempts: number;
  /** Time taken in milliseconds */
  duration: number;
}

/**
 * Generate content with cascading model fallback
 * 
 * @param prompt - The prompt to send to the AI model
 * @param options - Configuration options for the AI service
 * @returns Promise<AIModelResult> - The result with metadata
 * @throws Error when all models fail
 */
export async function generateWithFallback(
  prompt: string, 
  options: AIModelOptions = {}
): Promise<AIModelResult> {
  const {
    timeoutMs = getDefaultTimeout(),
    startFromModel,
    customModels = GEMINI_MODELS,
    verbose = false,
    retryDelayMs = 1000
  } = options;

  const startTime = Date.now();
  let result;
  let usedModel: GeminiModelConfig | null = null;
  let attempts = 0;

  // Validate API key
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
  }

  // Reorder models based on startFromModel preference
  let modelsToTry = [...customModels];
  if (startFromModel) {
    const startIndex = modelsToTry.findIndex(model => model.name === startFromModel);
    if (startIndex !== -1) {
      // Move the preferred model to the front, keep others in fallback order
      const preferredModel = modelsToTry.splice(startIndex, 1)[0];
      modelsToTry = [preferredModel, ...modelsToTry];
      
      if (verbose) {
        console.info(`🎯 Starting with preferred model: ${startFromModel}`);
      }
    } else if (verbose) {
      console.warn(`⚠️  Preferred model '${startFromModel}' not found, using default order`);
    }
  }

  // Try models in order (preferred first, then fallback order)
  for (let modelIndex = 0; modelIndex < modelsToTry.length; modelIndex++) {
    const modelConfig = modelsToTry[modelIndex];
    attempts++;
    
    try {
      if (verbose) {
        console.log(`🤖 Trying model: ${modelConfig.name} (${modelConfig.description})`);
      }
      
      const model = genAI.getGenerativeModel({ 
        model: modelConfig.name,
        generationConfig: modelConfig.config,
      });
      
      // Try this model with timeout for quick failover
      const modelPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Model timeout')), timeoutMs)
      );
      
      const response = await Promise.race([modelPromise, timeoutPromise]);
      
      if (!response?.response) {
        throw new Error('No response from AI model');
      }

      result = response.response.text();
      usedModel = modelConfig;
      
      if (verbose) {
        console.log(`✅ Successfully used model: ${modelConfig.name}`);
      }
      break; // Success with this model
      
    } catch (error: any) {
      const isLastModel = modelIndex === modelsToTry.length - 1;
      
      // Check for retryable errors (overload, timeout, rate limit)
      const isRetryableError = 
        error?.status === 503 || 
        error?.status === 429 || 
        error?.message?.includes('overloaded') || 
        error?.message?.includes('quota') ||
        error?.message === 'Model timeout';
      
      if (isRetryableError) {
        if (verbose) {
          console.warn(`⚠️  Model ${modelConfig.name} failed (${error?.status || 'timeout'}): ${error?.message}`);
        }
        
        if (!isLastModel) {
          if (verbose) {
            console.log(`🔄 Falling back to next model: ${modelsToTry[modelIndex + 1].name}`);
          }
          // Small delay before trying next model
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue;
        }
      }
      
      // If it's the last model or non-retryable error, throw
      if (isLastModel) {
        const duration = Date.now() - startTime;
        console.error(`❌ All models failed after ${attempts} attempts in ${duration}ms. Last error from ${modelConfig.name}:`, error);
        
        throw new Error(
          `AI service unavailable: All ${modelsToTry.length} models failed. ` +
          `Last error: ${error?.message || 'Unknown error'}`
        );
      }
      
      // For non-retryable errors on non-last models, still throw immediately
      throw error;
    }
  }

  if (!result || !usedModel) {
    throw new Error('Unexpected error: No result generated');
  }

  const duration = Date.now() - startTime;
  
  return {
    text: result,
    usedModel,
    attempts,
    duration
  };
}

/**
 * Get available models information
 */
export function getAvailableModels(): GeminiModelConfig[] {
  return GEMINI_MODELS;
}

/**
 * Get default timeout from environment variable or fallback to 1 minute
 */
function getDefaultTimeout(): number {
  const envTimeout = process.env.AI_GENERATION_TIMEOUT_MS;
  if (envTimeout) {
    const parsed = parseInt(envTimeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 60000; // 1 minute default
}

/**
 * Check if AI service is configured
 */
export function isAIServiceConfigured(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

/**
 * Generate content with highest quality (starts from most powerful model)
 * Best for: Complex workout generation, detailed analysis, important tasks
 */
export async function generateWithHighestQuality(
  prompt: string,
  options: Omit<AIModelOptions, 'startFromModel'> = {}
): Promise<AIModelResult> {
  return generateWithFallback(prompt, {
    ...options,
    startFromModel: 'gemini-2.5-pro',
  });
}

/**
 * Generate content with balanced performance (starts from Flash model)
 * Best for: Video enhancement, quick tasks, high-throughput operations
 */
export async function generateWithBalancedPerformance(
  prompt: string,
  options: Omit<AIModelOptions, 'startFromModel'> = {}
): Promise<AIModelResult> {
  return generateWithFallback(prompt, {
    ...options,
    startFromModel: 'gemini-2.5-flash',
  });
}

/**
 * Generate content with cost efficiency (starts from Lite model)
 * Best for: Bulk operations, simple tasks, cost-sensitive use cases
 */
export async function generateWithCostEfficiency(
  prompt: string,
  options: Omit<AIModelOptions, 'startFromModel'> = {}
): Promise<AIModelResult> {
  return generateWithFallback(prompt, {
    ...options,
    startFromModel: 'gemini-2.5-flash-lite',
  });
}

/**
 * Generate content optimized for video enhancement tasks
 * Uses legacy 1.5-flash models that work better for simple ranking tasks
 * Best for: Video ranking, simple classification, quick responses
 */
export async function generateForVideoEnhancement(
  prompt: string,
  options: Omit<AIModelOptions, 'startFromModel' | 'customModels'> = {}
): Promise<AIModelResult> {
  // Use legacy models that don't have thinking overhead for video ranking
  const videoOptimizedModels: GeminiModelConfig[] = [
    {
      name: 'gemini-1.5-flash',
      description: 'Fast and versatile - optimal for video ranking',
      config: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    },
    {
      name: 'gemini-2.5-flash-lite',
      description: 'Cost-efficient backup for video ranking',
      config: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    },
    {
      name: 'gemini-1.5-flash-8b',
      description: 'Reliable fallback for video ranking',
      config: {
        temperature: 0.4,
        topP: 0.9,
        topK: 64,
        maxOutputTokens: 1024,
      }
    },
  ];

  return generateWithFallback(prompt, {
    ...options,
    customModels: videoOptimizedModels,
    timeoutMs: options.timeoutMs || 15000, // 15s timeout like the original
  });
}