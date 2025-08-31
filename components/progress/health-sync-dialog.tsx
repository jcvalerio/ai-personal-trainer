/**
 * Health Sync Dialog Component
 * UI for syncing Fitindex measurements via Apple Health and Google Fit
 */
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Smartphone,
  Watch,
  Scale,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HealthPlatform {
  provider: string;
  config: {
    name: string;
    icon: string;
    description: string;
    isNative: boolean;
    supportsBackground: boolean;
    supportedMeasurements: string[];
  };
  available: boolean;
}

interface SyncStatus {
  provider: string;
  available: boolean;
  lastSync: string | null;
  config: {
    name: string;
    icon: string;
    description: string;
    isNative: boolean;
    supportsBackground: boolean;
  };
}

interface SyncResult {
  success: boolean;
  provider: string;
  measurementsAdded: number;
  measurementsUpdated: number;
  totalMeasurements?: number;
  error?: string;
  lastSyncDate?: string;
}

interface HealthSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete?: () => void;
}

const platformIcons = {
  'apple-health': Smartphone,
  'google-fit': Watch,
  fitbit: Watch,
  myfitnesspal: Smartphone,
};

export function HealthSyncDialog({
  open,
  onOpenChange,
  onSyncComplete,
}: HealthSyncDialogProps) {
  const t = useTranslations('progress');
  const [availablePlatforms, setAvailablePlatforms] = useState<
    HealthPlatform[]
  >([]);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch available platforms and sync statuses
  const fetchSyncData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/progress/sync');

      if (!response.ok) {
        throw new Error('Failed to fetch sync data');
      }

      const data = await response.json();
      setAvailablePlatforms(data.availablePlatforms || []);
      setSyncStatuses(data.syncStatuses || []);
    } catch (error) {
      console.error('Failed to fetch sync data:', error);
      toast.error('Failed to load health platforms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSyncData();
    }
  }, [open]);

  const handleSync = async (provider: string) => {
    setSyncing(provider);

    try {
      const response = await fetch('/api/progress/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          options: {
            // Sync last 30 days by default
            startDate: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: new Date().toISOString(),
          },
        }),
      });

      const result: SyncResult = await response.json();

      if (result.success) {
        const message =
          result.totalMeasurements && result.totalMeasurements > 0
            ? `Successfully synced ${result.totalMeasurements} measurements from Fitindex via ${result.provider}`
            : `Sync completed - no new measurements found`;

        toast.success(message);

        // Refresh sync statuses
        await fetchSyncData();

        // Notify parent component
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync measurements');
    } finally {
      setSyncing(null);
    }
  };

  const handleTestConnection = async (provider: string) => {
    setTesting(provider);

    try {
      const response = await fetch('/api/progress/sync', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.error || 'Connection test successful');
      } else {
        toast.error(result.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error('Failed to test connection');
    } finally {
      setTesting(null);
    }
  };

  const formatLastSync = (lastSync: string | null): string => {
    if (!lastSync) return 'Never';

    const date = new Date(lastSync);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  const getPlatformStatus = (provider: string): SyncStatus | undefined => {
    return syncStatuses.find((status) => status.provider === provider);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-3'>
              <Scale className='h-5 w-5 text-primary-600' />
              Sync Fitindex Measurements
            </DialogTitle>
            <DialogDescription>
              Loading available health platforms...
            </DialogDescription>
          </DialogHeader>

          <div className='flex items-center justify-center py-8'>
            <RefreshCw className='h-8 w-8 animate-spin text-primary-600' />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const availableProviders = availablePlatforms.filter((p) => p.available);
  const unavailableProviders = availablePlatforms.filter((p) => !p.available);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] max-w-2xl overflow-y-auto'>
        <DialogHeader className='space-y-3'>
          <DialogTitle className='flex items-center gap-3'>
            <Scale className='h-5 w-5 text-primary-600' />
            Sync Fitindex Measurements
          </DialogTitle>
          <DialogDescription>
            Connect your Fitindex smart scale through your preferred health
            platform to automatically sync your measurements.
          </DialogDescription>
        </DialogHeader>

        {/* Info Banner */}
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
          <div className='flex items-start gap-3'>
            <Info className='mt-0.5 h-5 w-5 text-blue-600' />
            <div className='space-y-1'>
              <p className='text-sm font-medium text-blue-900'>
                How to sync your Fitindex scale
              </p>
              <p className='text-sm text-blue-700'>
                Make sure your Fitindex scale is connected to your Apple Health
                (iOS) or Google Fit (Android) first, then use the sync buttons
                below to import your measurements.
              </p>
            </div>
          </div>
        </div>

        <div className='space-y-6'>
          {availableProviders.length > 0 && (
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <h3 className='text-sm font-semibold text-gray-900'>
                  Available on this device
                </h3>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                {availableProviders.map((platform) => {
                  const IconComponent =
                    platformIcons[
                      platform.provider as keyof typeof platformIcons
                    ] || Scale;
                  const status = getPlatformStatus(platform.provider);
                  const isCurrentlySyncing = syncing === platform.provider;
                  const isCurrentlyTesting = testing === platform.provider;

                  return (
                    <div
                      key={platform.provider}
                      className='space-y-4 rounded-xl border border-gray-200 p-4'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='rounded-lg bg-primary-50 p-2'>
                            <IconComponent className='h-5 w-5 text-primary-600' />
                          </div>
                          <div>
                            <h4 className='font-medium text-gray-900'>
                              {platform.config.name}
                            </h4>
                            <p className='text-xs text-gray-600'>
                              {platform.config.description}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center gap-2'>
                          {platform.config.supportsBackground && (
                            <Badge variant='outline' className='text-xs'>
                              <Zap className='mr-1 h-3 w-3' />
                              Auto
                            </Badge>
                          )}
                          <Badge
                            variant='outline'
                            className={cn(
                              'text-xs',
                              platform.config.isNative
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-blue-200 bg-blue-50 text-blue-700'
                            )}
                          >
                            {platform.config.isNative ? 'Native' : 'API'}
                          </Badge>
                        </div>
                      </div>

                      {status && (
                        <div className='flex items-center gap-2 text-xs text-gray-600'>
                          <Clock className='h-3 w-3' />
                          Last sync: {formatLastSync(status.lastSync)}
                        </div>
                      )}

                      <div className='space-y-2'>
                        <p className='text-xs text-gray-600'>
                          Supports:{' '}
                          {platform.config.supportedMeasurements.join(', ')}
                        </p>

                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            onClick={() => handleSync(platform.provider)}
                            disabled={isCurrentlySyncing || isCurrentlyTesting}
                            className='flex-1'
                          >
                            {isCurrentlySyncing ? (
                              <>
                                <RefreshCw className='mr-2 h-3 w-3 animate-spin' />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className='mr-2 h-3 w-3' />
                                Sync Now
                              </>
                            )}
                          </Button>

                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              handleTestConnection(platform.provider)
                            }
                            disabled={isCurrentlySyncing || isCurrentlyTesting}
                          >
                            {isCurrentlyTesting ? (
                              <RefreshCw className='h-3 w-3 animate-spin' />
                            ) : (
                              'Test'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {unavailableProviders.length > 0 && (
            <>
              {availableProviders.length > 0 && <Separator />}

              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <XCircle className='h-4 w-4 text-gray-400' />
                  <h3 className='text-sm font-semibold text-gray-600'>
                    Not available on this device
                  </h3>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  {unavailableProviders.map((platform) => {
                    const IconComponent =
                      platformIcons[
                        platform.provider as keyof typeof platformIcons
                      ] || Scale;

                    return (
                      <div
                        key={platform.provider}
                        className='rounded-xl border border-gray-100 p-4 opacity-60'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='rounded-lg bg-gray-50 p-2'>
                            <IconComponent className='h-5 w-5 text-gray-400' />
                          </div>
                          <div>
                            <h4 className='font-medium text-gray-600'>
                              {platform.config.name}
                            </h4>
                            <p className='text-xs text-gray-500'>
                              {platform.config.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {availableProviders.length === 0 &&
            unavailableProviders.length === 0 && (
              <div className='py-8 text-center'>
                <AlertCircle className='mx-auto mb-3 h-8 w-8 text-gray-400' />
                <p className='text-gray-600'>No health platforms found</p>
                <p className='text-sm text-gray-500'>
                  Make sure your Fitindex scale is connected to Apple Health or
                  Google Fit
                </p>
              </div>
            )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant='outline'
              onClick={() => {
                console.log('Close button clicked');
              }}
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
