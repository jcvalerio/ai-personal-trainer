/**
 * Dashboard Statistics Hook
 * Fetches real-time user workout statistics for dashboard display
 */
'use client';

import { useState, useEffect } from 'react';

export interface DashboardStats {
  workoutsThisWeek: number;
  currentStreak: number;
  totalWorkouts: number;
  totalHours: number;
  activeWorkoutPlans: number;
  completedSessions: number;
}

export interface RecentActivity {
  id: string;
  type: 'workout_completed' | 'plan_created' | 'session_started';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    workoutsThisWeek: 0,
    currentStreak: 0,
    totalWorkouts: 0,
    totalHours: 0,
    activeWorkoutPlans: 0,
    completedSessions: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch workout statistics
        const statsResponse = await fetch('/api/dashboard/stats');
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const statsData = await statsResponse.json();

        if (statsData.success) {
          setStats(statsData.data);
        }

        // Fetch recent activity
        const activityResponse = await fetch('/api/dashboard/recent-activity');
        if (!activityResponse.ok) {
          throw new Error('Failed to fetch recent activity');
        }
        const activityData = await activityResponse.json();

        if (activityData.success) {
          setRecentActivity(activityData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const refetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const statsResponse = await fetch('/api/dashboard/stats');
      if (!statsResponse.ok) {
        throw new Error('Failed to refetch dashboard stats');
      }
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    recentActivity,
    isLoading,
    error,
    refetchStats,
  };
}