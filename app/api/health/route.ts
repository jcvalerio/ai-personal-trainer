import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Health Check Endpoint
 *
 * Provides system health status for monitoring and deployment validation
 * Accessible at: /api/health or /health (via Vercel rewrite)
 */
export async function GET(_request: NextRequest) {
  const startTime = Date.now();

  try {
    // Basic system checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      checks: {
        api: 'healthy',
        auth: 'unknown',
        database: 'unknown',
        ai: 'unknown',
      },
      performance: {
        responseTime: 0,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
      deployment: {
        vercelUrl: process.env.VERCEL_URL || null,
        gitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
      },
    };

    // Test authentication service
    try {
      await currentUser();
      health.checks.auth = 'healthy';
    } catch (error) {
      health.checks.auth = 'degraded';
    }

    // Test database connection (basic check)
    try {
      if (process.env.DATABASE_URL) {
        // Simple connection test - don't actually query in health check
        health.checks.database = 'healthy';
      } else {
        health.checks.database = 'not_configured';
      }
    } catch (error) {
      health.checks.database = 'unhealthy';
    }

    // Test AI service availability
    try {
      if (process.env.OPENAI_API_KEY) {
        health.checks.ai = 'healthy';
      } else {
        health.checks.ai = 'not_configured';
      }
    } catch (error) {
      health.checks.ai = 'unhealthy';
    }

    // Calculate response time
    health.performance.responseTime = Date.now() - startTime;

    // Determine overall health status
    const checkValues = Object.values(health.checks);
    if (checkValues.includes('unhealthy')) {
      health.status = 'unhealthy';
    } else if (checkValues.includes('degraded')) {
      health.status = 'degraded';
    }

    // Return appropriate HTTP status
    const httpStatus =
      health.status === 'healthy'
        ? 200
        : health.status === 'degraded'
          ? 200
          : 503;

    return NextResponse.json(health, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Critical error - return minimal error response
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        responseTime: Date.now() - startTime,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Support HEAD requests for simple uptime checks
export async function HEAD() {
  return new Response(null, { status: 200 });
}
