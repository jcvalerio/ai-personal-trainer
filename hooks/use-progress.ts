/**
 * Progress Data Hooks
 * React hooks for managing progress measurements and statistics
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProgressApi, ProgressApiError } from '@/lib/api/progress';
import {
  ProgressMeasurement,
  CreateProgressMeasurementRequest,
} from '@/types/workouts';
import { toast } from 'sonner';

interface UseProgressMeasurementsOptions {
  measurementType?: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference';
  measurementLocation?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseProgressMeasurementsResult {
  measurements: ProgressMeasurement[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Hook for fetching and managing progress measurements
 */
export function useProgressMeasurements(
  options: UseProgressMeasurementsOptions = {}
): UseProgressMeasurementsResult {
  const [measurements, setMeasurements] = useState<ProgressMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const {
    measurementType,
    measurementLocation,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    autoFetch = true,
  } = options;

  const fetchMeasurements = useCallback(
    async (isLoadMore = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const currentPage = isLoadMore ? (pagination?.page || 0) + 1 : page;

        const result = await ProgressApi.getMeasurements({
          measurementType,
          measurementLocation,
          dateFrom,
          dateTo,
          page: currentPage,
          limit,
          sortBy: 'measured_at',
          sortOrder: 'desc',
        });

        if (isLoadMore) {
          setMeasurements((prev) => [...prev, ...result.items]);
        } else {
          setMeasurements(result.items);
        }

        setPagination(result.pagination);
      } catch (err) {
        const errorMessage =
          err instanceof ProgressApiError
            ? err.message
            : 'Failed to fetch measurements';
        setError(errorMessage);
        console.error('Error fetching measurements:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [
      measurementType,
      measurementLocation,
      dateFrom,
      dateTo,
      page,
      limit,
      pagination?.page,
    ]
  );

  const refetch = useCallback(
    () => fetchMeasurements(false),
    [fetchMeasurements]
  );

  const loadMore = useCallback(
    () => fetchMeasurements(true),
    [fetchMeasurements]
  );

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  useEffect(() => {
    if (autoFetch) {
      fetchMeasurements(false);
    }
  }, [fetchMeasurements, autoFetch]);

  return {
    measurements,
    isLoading,
    error,
    pagination,
    refetch,
    hasMore,
    loadMore,
  };
}

interface UseCreateMeasurementResult {
  createMeasurement: (
    data: CreateProgressMeasurementRequest
  ) => Promise<ProgressMeasurement | null>;
  isCreating: boolean;
  error: string | null;
}

/**
 * Hook for creating new progress measurements
 */
export function useCreateMeasurement(): UseCreateMeasurementResult {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMeasurement = useCallback(
    async (
      data: CreateProgressMeasurementRequest
    ): Promise<ProgressMeasurement | null> => {
      try {
        setIsCreating(true);
        setError(null);

        const measurement = await ProgressApi.createMeasurement(data);

        toast.success('Measurement logged successfully');
        return measurement;
      } catch (err) {
        const errorMessage =
          err instanceof ProgressApiError
            ? err.message
            : 'Failed to create measurement';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error creating measurement:', err);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return {
    createMeasurement,
    isCreating,
    error,
  };
}

interface UseProgressStatsOptions {
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  measurementTypes?: string[];
  includeComparisons?: boolean;
  includeTrends?: boolean;
  autoFetch?: boolean;
}

interface UseProgressStatsResult {
  stats: any | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching progress statistics
 */
export function useProgressStats(
  options: UseProgressStatsOptions = {}
): UseProgressStatsResult {
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    timeframe = 'month',
    measurementTypes,
    includeComparisons = true,
    includeTrends = true,
    autoFetch = true,
  } = options;

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ProgressApi.getStats({
        timeframe,
        measurementTypes,
        includeComparisons,
        includeTrends,
      });

      setStats(result);
    } catch (err) {
      const errorMessage =
        err instanceof ProgressApiError
          ? err.message
          : 'Failed to fetch statistics';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, measurementTypes, includeComparisons, includeTrends]);

  const refetch = useCallback(() => fetchStats(), [fetchStats]);

  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [fetchStats, autoFetch]);

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}

interface UseMeasurementTrendsOptions {
  measurementType: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference';
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  autoFetch?: boolean;
}

interface UseMeasurementTrendsResult {
  measurements: ProgressMeasurement[];
  trends: any | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching measurement trends for charts
 */
export function useMeasurementTrends(
  options: UseMeasurementTrendsOptions
): UseMeasurementTrendsResult {
  const [measurements, setMeasurements] = useState<ProgressMeasurement[]>([]);
  const [trends, setTrends] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { measurementType, timeframe = 'month', autoFetch = true } = options;

  const fetchTrends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ProgressApi.getMeasurementTrends(
        measurementType,
        timeframe
      );

      setMeasurements(result.measurements);
      setTrends(result.trends);
    } catch (err) {
      const errorMessage =
        err instanceof ProgressApiError
          ? err.message
          : 'Failed to fetch trends';
      setError(errorMessage);
      console.error('Error fetching trends:', err);
    } finally {
      setIsLoading(false);
    }
  }, [measurementType, timeframe]);

  const refetch = useCallback(() => fetchTrends(), [fetchTrends]);

  useEffect(() => {
    if (autoFetch) {
      fetchTrends();
    }
  }, [fetchTrends, autoFetch]);

  return {
    measurements,
    trends,
    isLoading,
    error,
    refetch,
  };
}

interface UseUpdateMeasurementResult {
  updateMeasurement: (
    id: string,
    data: Partial<CreateProgressMeasurementRequest>
  ) => Promise<ProgressMeasurement | null>;
  isUpdating: boolean;
  error: string | null;
}

/**
 * Hook for updating measurements
 */
export function useUpdateMeasurement(): UseUpdateMeasurementResult {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMeasurement = useCallback(
    async (
      id: string,
      data: Partial<CreateProgressMeasurementRequest>
    ): Promise<ProgressMeasurement | null> => {
      try {
        setIsUpdating(true);
        setError(null);

        const measurement = await ProgressApi.updateMeasurement(id, data);

        toast.success('Measurement updated successfully');
        return measurement;
      } catch (err) {
        const errorMessage =
          err instanceof ProgressApiError
            ? err.message
            : 'Failed to update measurement';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error updating measurement:', err);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  return {
    updateMeasurement,
    isUpdating,
    error,
  };
}

interface UseDeleteMeasurementResult {
  deleteMeasurement: (id: string) => Promise<boolean>;
  isDeleting: boolean;
  error: string | null;
}

/**
 * Hook for deleting measurements
 */
export function useDeleteMeasurement(): UseDeleteMeasurementResult {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMeasurement = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setIsDeleting(true);
        setError(null);

        await ProgressApi.deleteMeasurement(id);

        toast.success('Measurement deleted successfully');
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof ProgressApiError
            ? err.message
            : 'Failed to delete measurement';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error deleting measurement:', err);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    []
  );

  return {
    deleteMeasurement,
    isDeleting,
    error,
  };
}
