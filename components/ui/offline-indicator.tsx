/**
 * Offline Indicator Component
 * Shows offline status and sync information to users
 * Note: This component doesn't use translations to work at the root layout level
 */
'use client';

import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  Wifi,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  Settings,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOfflineStatus } from '@/lib/hooks/use-offline-status';
import { offlineStorage } from '@/lib/services/offline-storage-service';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top' | 'bottom' | 'floating';
}

export function OfflineIndicator({
  className = '',
  showDetails = false,
  position = 'floating',
}: OfflineIndicatorProps) {
  const offlineStatus = useOfflineStatus();
  const [storageStats, setStorageStats] = useState<{
    workouts: number;
    unsyncedWorkouts: number;
    queueSize: number;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load storage stats when offline
  useEffect(() => {
    if (offlineStatus.isOffline) {
      loadStorageStats();
    }
  }, [offlineStatus.isOffline]);

  // Listen for sync events
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SYNC_START') {
          setIsSyncing(true);
        } else if (event.data?.type === 'SYNC_COMPLETE') {
          setIsSyncing(false);
          loadStorageStats(); // Refresh stats after sync
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }

    return undefined;
  }, []);

  const loadStorageStats = async () => {
    try {
      const stats = await offlineStorage.getStorageStats();
      setStorageStats({
        workouts: stats.workouts,
        unsyncedWorkouts: stats.unsyncedWorkouts,
        queueSize: stats.queueSize,
      });
    } catch (error) {
      console.warn('Failed to load storage stats:', error);
    }
  };

  const handleForceSync = async () => {
    if (offlineStatus.isOnline && 'serviceWorker' in navigator) {
      try {
        setIsSyncing(true);
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('workout-sync');
      } catch (error) {
        console.error('Failed to trigger sync:', error);
        setIsSyncing(false);
      }
    }
  };

  // Don't show indicator if online and no pending data
  if (
    offlineStatus.isOnline &&
    (!storageStats || storageStats.unsyncedWorkouts === 0)
  ) {
    return null;
  }

  const positionClasses = {
    top: 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    bottom: 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
    floating: 'fixed bottom-4 right-4 z-50',
  };

  if (!isExpanded && position === 'floating') {
    return (
      <Button
        variant={offlineStatus.isOffline ? 'destructive' : 'secondary'}
        size='sm'
        className={`${positionClasses[position]} ${className} shadow-lg`}
        onClick={() => setIsExpanded(true)}
      >
        {offlineStatus.isOffline ? (
          <WifiOff className='mr-1 h-4 w-4' />
        ) : isSyncing ? (
          <RefreshCw className='mr-1 h-4 w-4 animate-spin' />
        ) : (
          <AlertCircle className='mr-1 h-4 w-4' />
        )}
        {offlineStatus.isOffline
          ? 'Offline'
          : isSyncing
            ? 'Syncing...'
            : storageStats?.unsyncedWorkouts || 0}
      </Button>
    );
  }

  return (
    <Card
      className={`${positionClasses[position]} ${className} w-80 border-2 shadow-lg ${
        offlineStatus.isOffline
          ? 'border-red-200 bg-red-50'
          : 'border-yellow-200 bg-yellow-50'
      }`}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {offlineStatus.isOffline ? (
              <WifiOff className='h-5 w-5 text-red-600' />
            ) : isSyncing ? (
              <RefreshCw className='h-5 w-5 animate-spin text-blue-600' />
            ) : (
              <Wifi className='h-5 w-5 text-green-600' />
            )}
            <CardTitle className='text-sm'>
              {offlineStatus.isOffline
                ? "You're Offline"
                : isSyncing
                  ? 'Syncing Data...'
                  : 'Back Online'}
            </CardTitle>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0'
            onClick={() => setIsExpanded(false)}
          >
            <X className='h-3 w-3' />
          </Button>
        </div>
        <CardDescription className='text-xs'>
          {offlineStatus.isOffline
            ? 'Your workout data is being saved locally'
            : isSyncing
              ? 'Uploading your offline workout data'
              : 'Data will sync automatically'}
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-3 pt-0'>
        {/* Status Badges */}
        <div className='flex flex-wrap gap-1'>
          <Badge
            variant={offlineStatus.isOffline ? 'destructive' : 'secondary'}
          >
            {offlineStatus.isOffline ? 'Offline Mode' : 'Online'}
          </Badge>

          {offlineStatus.isSlowConnection && (
            <Badge variant='outline'>Slow Connection</Badge>
          )}

          {offlineStatus.isUnstableConnection && (
            <Badge variant='outline'>Unstable Connection</Badge>
          )}

          {offlineStatus.isForceOffline && (
            <Badge variant='outline'>Force Offline</Badge>
          )}
        </div>

        {/* Storage Statistics */}
        {storageStats && (
          <div className='space-y-2'>
            <div className='text-xs font-medium text-gray-700'>Local Data:</div>
            <div className='grid grid-cols-2 gap-2 text-xs'>
              <div className='flex justify-between'>
                <span>Workouts:</span>
                <span className='font-medium'>{storageStats.workouts}</span>
              </div>
              <div className='flex justify-between'>
                <span>Unsynced:</span>
                <span
                  className={`font-medium ${storageStats.unsyncedWorkouts > 0 ? 'text-yellow-600' : 'text-green-600'}`}
                >
                  {storageStats.unsyncedWorkouts}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Connection Info */}
        {showDetails && offlineStatus.isOnline && (
          <div className='space-y-1 text-xs text-gray-600'>
            {offlineStatus.connectionType && (
              <div>Type: {offlineStatus.connectionType}</div>
            )}
            {offlineStatus.effectiveType && (
              <div>Speed: {offlineStatus.effectiveType}</div>
            )}
            {offlineStatus.downlink !== undefined && (
              <div>Bandwidth: {offlineStatus.downlink.toFixed(1)} Mbps</div>
            )}
            {offlineStatus.rtt !== undefined && (
              <div>Latency: {offlineStatus.rtt}ms</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-2'>
          {offlineStatus.isOnline &&
            storageStats?.unsyncedWorkouts &&
            storageStats.unsyncedWorkouts > 0 && (
              <Button
                size='sm'
                variant='outline'
                onClick={handleForceSync}
                disabled={isSyncing}
                className='flex-1 text-xs'
              >
                {isSyncing ? (
                  <RefreshCw className='mr-1 h-3 w-3 animate-spin' />
                ) : (
                  <RefreshCw className='mr-1 h-3 w-3' />
                )}
                Sync Now
              </Button>
            )}

          {offlineStatus.isForceOffline && (
            <Button
              size='sm'
              variant='outline'
              onClick={offlineStatus.exitOfflineMode}
              className='flex-1 text-xs'
            >
              <Wifi className='mr-1 h-3 w-3' />
              Go Online
            </Button>
          )}

          {!offlineStatus.isForceOffline && offlineStatus.isOnline && (
            <Button
              size='sm'
              variant='outline'
              onClick={offlineStatus.forceOfflineMode}
              className='flex-1 text-xs'
            >
              <WifiOff className='mr-1 h-3 w-3' />
              Force Offline
            </Button>
          )}
        </div>

        {/* Last sync info */}
        {(offlineStatus.lastOnlineTime || offlineStatus.lastOfflineTime) && (
          <div className='text-xs text-gray-500'>
            {offlineStatus.isOffline && offlineStatus.lastOfflineTime && (
              <div>
                Offline since:{' '}
                {offlineStatus.lastOfflineTime.toLocaleTimeString()}
              </div>
            )}
            {offlineStatus.isOnline && offlineStatus.lastOnlineTime && (
              <div>
                Connected: {offlineStatus.lastOnlineTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simple offline banner for page headers
 */
export function OfflineBanner({ className = '' }: { className?: string }) {
  const { isOffline } = useOfflineStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
      <WifiOff className='h-4 w-4' />
      <AlertDescription className='text-sm'>
        <strong>You're offline.</strong> Your workout data is being saved
        locally and will sync when you reconnect.
      </AlertDescription>
    </Alert>
  );
}

/**
 * Connection quality indicator
 */
export function ConnectionQualityIndicator({
  className = '',
}: {
  className?: string;
}) {
  const { isOnline, isSlowConnection, isUnstableConnection, effectiveType } =
    useOfflineStatus();

  if (!isOnline) {
    return null;
  }

  const getConnectionColor = () => {
    if (isUnstableConnection) {
      return 'text-red-500';
    }
    if (isSlowConnection) {
      return 'text-yellow-500';
    }
    return 'text-green-500';
  };

  const getConnectionText = () => {
    if (isUnstableConnection) {
      return 'Poor';
    }
    if (isSlowConnection) {
      return 'Slow';
    }
    return effectiveType?.toUpperCase() || 'Good';
  };

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      <div
        className={`h-2 w-2 rounded-full ${getConnectionColor().replace('text-', 'bg-')}`}
      />
      <span className={getConnectionColor()}>{getConnectionText()}</span>
    </div>
  );
}
