/**
 * Progress API Client
 * Frontend client for progress measurements and statistics
 */

import {
  ProgressMeasurement,
  CreateProgressMeasurementRequest,
  ProgressStats,
} from '@/types/workouts';

const API_BASE = '/api/progress';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface GetMeasurementsParams {
  measurementType?: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference';
  measurementLocation?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface GetStatsParams {
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  measurementTypes?: string[];
  includeComparisons?: boolean;
  includeTrends?: boolean;
}

class ProgressApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ProgressApiError';
  }
}

/**
 * Progress Measurements API Client
 */
export class ProgressApi {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new ProgressApiError(
        data.error || data.message || 'An error occurred',
        response.status,
        data.details
      );
    }

    return data.data!;
  }

  private static buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          searchParams.append(key, value.toISOString());
        } else if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return searchParams.toString();
  }

  /**
   * Get user's progress measurements
   */
  static async getMeasurements(params: GetMeasurementsParams = {}): Promise<{
    items: ProgressMeasurement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/measurements${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  /**
   * Create a new progress measurement
   */
  static async createMeasurement(
    data: CreateProgressMeasurementRequest
  ): Promise<ProgressMeasurement> {
    return this.request('/measurements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get a specific measurement by ID
   */
  static async getMeasurement(id: string): Promise<ProgressMeasurement> {
    return this.request(`/measurements/${id}`);
  }

  /**
   * Update a measurement
   */
  static async updateMeasurement(
    id: string,
    data: Partial<CreateProgressMeasurementRequest>
  ): Promise<ProgressMeasurement> {
    return this.request(`/measurements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a measurement
   */
  static async deleteMeasurement(id: string): Promise<void> {
    await this.request(`/measurements/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get progress statistics
   */
  static async getStats(params: GetStatsParams = {}): Promise<{
    timeframe: string;
    stats: ProgressStats;
    recentMeasurements: ProgressMeasurement[];
    summary: {
      totalMeasurements: number;
      measurementTypes: string[];
      overallTrend: string;
      lastMeasurement: string | null;
    };
    comparison?: any;
    trends?: any;
  }> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/stats${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  /**
   * Get recent measurements (convenience method)
   */
  static async getRecentMeasurements(
    limit: number = 10
  ): Promise<ProgressMeasurement[]> {
    const result = await this.getMeasurements({
      page: 1,
      limit,
      sortBy: 'measured_at',
      sortOrder: 'desc',
    });
    return result.items;
  }

  /**
   * Get measurements by type
   */
  static async getMeasurementsByType(
    measurementType: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference',
    params: Omit<GetMeasurementsParams, 'measurementType'> = {}
  ): Promise<ProgressMeasurement[]> {
    const result = await this.getMeasurements({
      ...params,
      measurementType,
      sortBy: 'measured_at',
      sortOrder: 'desc',
    });
    return result.items;
  }

  /**
   * Get measurement trends for charts
   */
  static async getMeasurementTrends(
    measurementType: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference',
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    measurements: ProgressMeasurement[];
    trends: any;
  }> {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const [measurements, stats] = await Promise.all([
      this.getMeasurementsByType(measurementType, {
        dateFrom: startDate,
        dateTo: endDate,
        limit: 100,
      }),
      this.getStats({
        timeframe,
        measurementTypes: [measurementType],
        includeTrends: true,
      }),
    ]);

    return {
      measurements,
      trends: stats.trends,
    };
  }
}

/**
 * React Query / SWR compatible hooks data fetchers
 */
export const progressQueries = {
  // Keys for query invalidation
  keys: {
    all: ['progress'] as const,
    measurements: () => [...progressQueries.keys.all, 'measurements'] as const,
    measurement: (id: string) =>
      [...progressQueries.keys.measurements(), id] as const,
    stats: (params: GetStatsParams) =>
      [...progressQueries.keys.all, 'stats', params] as const,
    trends: (type: string, timeframe: string) =>
      [...progressQueries.keys.all, 'trends', type, timeframe] as const,
  },

  // Data fetcher functions
  fetchers: {
    measurements: (params: GetMeasurementsParams) =>
      ProgressApi.getMeasurements(params),
    measurement: (id: string) => ProgressApi.getMeasurement(id),
    stats: (params: GetStatsParams) => ProgressApi.getStats(params),
    trends: (
      type: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference',
      timeframe: 'week' | 'month' | 'quarter' | 'year'
    ) => ProgressApi.getMeasurementTrends(type, timeframe),
  },
};

export { ProgressApiError };
