/**
 * Progress Statistics API
 * Provides analytics and insights for user progress data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import ProgressService from '@/lib/services/progress-service';
import { progressStatsQuerySchema } from '@/lib/validation/workout-schemas';

const progressService = new ProgressService();

/**
 * GET /api/progress/stats
 * Get comprehensive progress statistics and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Convert string parameters to appropriate types
    const processedParams = {
      ...queryParams,
      measurementTypes: queryParams.measurementTypes?.split(','),
      includeGoalTracking: queryParams.includeGoalTracking === 'true',
      includeProjections: queryParams.includeProjections === 'true',
    };

    const validatedQuery = progressStatsQuerySchema.safeParse(processedParams);
    if (!validatedQuery.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validatedQuery.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      timeframe,
      measurementTypes,
      includeGoalTracking,
      includeProjections,
      includeComparisons = 'true',
      includeTrends = 'true',
    } = validatedQuery.data;

    // Get basic progress statistics
    const statsResult = await progressService.getProgressStats(
      { userId, organizationId: orgId || undefined },
      timeframe
    );

    if (!statsResult.success) {
      return NextResponse.json(
        { error: statsResult.error.message },
        { status: 500 }
      );
    }

    const stats = statsResult.data!;

    // Get recent measurements for overview
    const recentResult = await progressService.getProgressMeasurements(
      { userId, organizationId: orgId || undefined },
      {},
      { page: 1, limit: 10, sortBy: 'measured_at', sortOrder: 'desc' }
    );

    const recentMeasurements = recentResult.success
      ? recentResult.data!.items
      : [];

    // Build comprehensive response
    const response: any = {
      success: true,
      data: {
        timeframe,
        stats,
        recentMeasurements,
        summary: {
          totalMeasurements: stats.measurementSummary.reduce(
            (sum, m) => sum + m.count,
            0
          ),
          measurementTypes: stats.measurementSummary.map(
            (m) => m.measurementType
          ),
          overallTrend: stats.overallTrend,
          lastMeasurement: recentMeasurements[0]?.measuredAt || null,
        },
      },
    };

    // Add comparison data if requested
    if (includeComparisons === 'true') {
      // Get previous period for comparison
      const previousTimeframe = getPreviousTimeframe(timeframe);
      const comparisonResult = await progressService.getProgressStats(
        { userId, organizationId: orgId || undefined },
        timeframe // Will be filtered by date range in service
      );

      if (comparisonResult.success) {
        response.data.comparison = {
          previousPeriod: comparisonResult.data,
          changes: calculateChanges(stats, comparisonResult.data!),
        };
      }
    }

    // Add detailed trends if requested
    if (includeTrends === 'true') {
      // Get measurement history for trend analysis
      const historyResult = await progressService.getProgressMeasurements(
        { userId, organizationId: orgId || undefined },
        {
          dateFrom: getHistoryStartDate(timeframe),
          ...(measurementTypes && {
            measurementTypes: measurementTypes.split(',') as any,
          }),
        },
        { page: 1, limit: 100, sortBy: 'measured_at', sortOrder: 'asc' }
      );

      if (historyResult.success) {
        response.data.trends = {
          measurements: historyResult.data!.items,
          analysis: analyzeTrends(historyResult.data!.items),
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching progress stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get previous timeframe period
 */
function getPreviousTimeframe(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case 'week':
      return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 2 weeks ago
    case 'month':
      return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 2 months ago
    case 'quarter':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 months ago
    case 'year':
      return new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000); // 2 years ago
    default:
      return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Helper function to get history start date for trends
 */
function getHistoryStartDate(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case 'week':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    case 'month':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // Last 3 months
    case 'quarter':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // Last year
    case 'year':
      return new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000); // Last 2 years
    default:
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Helper function to calculate changes between periods
 */
function calculateChanges(current: any, previous: any) {
  const changes: any = {};

  current.measurementSummary.forEach((currentMeasurement: any) => {
    const previousMeasurement = previous.measurementSummary.find(
      (m: any) => m.measurementType === currentMeasurement.measurementType
    );

    if (previousMeasurement) {
      const change = currentMeasurement.average - previousMeasurement.average;
      const percentChange = (change / previousMeasurement.average) * 100;

      changes[currentMeasurement.measurementType] = {
        absolute: change,
        percentage: percentChange,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        previousAverage: previousMeasurement.average,
        currentAverage: currentMeasurement.average,
      };
    }
  });

  return changes;
}

/**
 * Helper function to analyze trends from measurement history
 */
function analyzeTrends(measurements: any[]) {
  const analysis: any = {
    patterns: [],
    insights: [],
    recommendations: [],
  };

  // Group measurements by type
  const byType = measurements.reduce((acc, measurement) => {
    if (!acc[measurement.measurementType]) {
      acc[measurement.measurementType] = [];
    }
    acc[measurement.measurementType].push(measurement);
    return acc;
  }, {});

  // Analyze each measurement type
  Object.entries(byType).forEach(([type, typeMeasurements]: [string, any]) => {
    if (typeMeasurements.length > 1) {
      const values = typeMeasurements.map((m: any) => m.value);
      const trend = calculateSimpleTrend(values);

      analysis.patterns.push({
        measurementType: type,
        trend: trend.direction,
        strength: trend.strength,
        recent: values.slice(-3), // Last 3 values
        overall: {
          min: Math.min(...values),
          max: Math.max(...values),
          average:
            values.reduce((a: number, b: number) => a + b) / values.length,
        },
      });

      // Generate insights based on patterns
      if (trend.strength > 0.5) {
        analysis.insights.push({
          type,
          message: `${type} shows a ${trend.direction} trend over time`,
          significance: 'medium',
        });
      }
    }
  });

  return analysis;
}

/**
 * Helper function to calculate simple trend direction and strength
 */
function calculateSimpleTrend(values: number[]) {
  if (values.length < 2) {
    return { direction: 'stable', strength: 0 };
  }

  let upCount = 0;
  let downCount = 0;

  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) upCount++;
    else if (values[i] < values[i - 1]) downCount++;
  }

  const totalChanges = upCount + downCount;
  if (totalChanges === 0) {
    return { direction: 'stable', strength: 0 };
  }

  const upRatio = upCount / totalChanges;
  const downRatio = downCount / totalChanges;

  if (upRatio > 0.6) {
    return { direction: 'up', strength: upRatio };
  } else if (downRatio > 0.6) {
    return { direction: 'down', strength: downRatio };
  } else {
    return { direction: 'stable', strength: Math.max(upRatio, downRatio) };
  }
}
