/**
 * Device Integrations Component
 * Manage connections to smart health devices and platforms
 */
'use client';

import { useState, useEffect } from 'react';
import {
  Smartphone,
  Watch,
  Scale,
  Bluetooth,
  Wifi,
  QrCode,
  Settings,
  Check,
  AlertCircle,
  Loader2,
  Plus,
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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  HealthDataSync,
  HealthDataSource,
  HealthIntegrationConfig,
} from '@/lib/integrations/health-data-sync';
import { toast } from 'sonner';

interface DeviceIntegrationsProps {
  onSyncComplete?: () => void;
}

const integrationConfigs = {
  apple_health: {
    name: 'Apple Health',
    description: 'Sync data from iPhone Health app and connected devices',
    icon: Smartphone,
    color: 'bg-gray-100 text-gray-700',
    availability: 'iOS only',
  },
  google_health: {
    name: 'Health Connect',
    description: 'Sync from Android Health Connect and partner apps',
    icon: Smartphone,
    color: 'bg-green-100 text-green-700',
    availability: 'Android only',
  },
  samsung_health: {
    name: 'Samsung Health',
    description: 'Connect to Samsung Health ecosystem',
    icon: Watch,
    color: 'bg-blue-100 text-blue-700',
    availability: 'Samsung devices',
  },
  fitbit: {
    name: 'Fitbit',
    description: 'Sync weight and body composition from Fitbit scales',
    icon: Watch,
    color: 'bg-purple-100 text-purple-700',
    availability: 'Fitbit account required',
  },
  withings: {
    name: 'Withings',
    description: 'Body+ and other Withings smart scales',
    icon: Scale,
    color: 'bg-indigo-100 text-indigo-700',
    availability: 'Withings account required',
  },
  fitindex: {
    name: 'FitIndex Smart Scale',
    description: 'Multiple sync options for FitIndex scales',
    icon: Scale,
    color: 'bg-orange-100 text-orange-700',
    availability: '2025 integration ready',
  },
  garmin: {
    name: 'Garmin Connect',
    description: 'Sync from Garmin Index smart scales',
    icon: Watch,
    color: 'bg-cyan-100 text-cyan-700',
    availability: 'Garmin Connect account',
  },
  renpho: {
    name: 'RENPHO',
    description: 'RENPHO smart scale integration',
    icon: Scale,
    color: 'bg-pink-100 text-pink-700',
    availability: 'RENPHO app required',
  },
} as const;

export function DeviceIntegrations({
  onSyncComplete,
}: DeviceIntegrationsProps) {
  const [integrations, setIntegrations] = useState<
    Map<HealthDataSource, HealthIntegrationConfig>
  >(new Map());
  const [connectingSource, setConnectingSource] =
    useState<HealthDataSource | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<HealthDataSource | null>(null);

  // Initialize health data sync on component mount
  useEffect(() => {
    initializeIntegrations();
  }, []);

  const initializeIntegrations = async () => {
    try {
      await HealthDataSync.initialize([]);

      // Get available integrations
      const availableSources = HealthDataSync.getAvailableIntegrations();
      const integrationMap = new Map();

      availableSources.forEach((source) => {
        const status = HealthDataSync.getIntegrationStatus(source);
        if (status) {
          integrationMap.set(source, status);
        }
      });

      setIntegrations(integrationMap);
    } catch (error) {
      console.error('Failed to initialize integrations:', error);
      toast.error('Failed to load device integrations');
    }
  };

  const handleConnect = async (source: HealthDataSource) => {
    setConnectingSource(source);

    try {
      const success = await HealthDataSync.connectSource(source);

      if (success) {
        toast.success(`Connected to ${integrationConfigs[source].name}!`);
        await initializeIntegrations(); // Refresh status
      } else {
        toast.error(`Failed to connect to ${integrationConfigs[source].name}`);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error(
        `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setConnectingSource(null);
    }
  };

  const handleDisconnect = async (source: HealthDataSource) => {
    try {
      const success = await HealthDataSync.disableIntegration(source);

      if (success) {
        toast.success(`Disconnected from ${integrationConfigs[source].name}`);
        await initializeIntegrations(); // Refresh status
      } else {
        toast.error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnection failed:', error);
      toast.error('Disconnection failed');
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);

    try {
      const results = await HealthDataSync.syncAll();
      const successCount = results.filter((r) => r.success).length;
      const totalSynced = results.reduce((sum, r) => sum + r.count, 0);

      if (successCount > 0) {
        toast.success(
          `Synced ${totalSynced} measurements from ${successCount} sources`
        );
        onSyncComplete?.();
      } else {
        toast.warning('No new data to sync');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed');
    } finally {
      setSyncingAll(false);
    }
  };

  const renderIntegrationCard = (source: HealthDataSource) => {
    const config = integrationConfigs[source];
    const integration = integrations.get(source);
    const isConnected = integration?.enabled || false;
    const isConnecting = connectingSource === source;
    const Icon = config.icon;

    return (
      <Card key={source} className='relative'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className={`rounded-lg p-2 ${config.color}`}>
                <Icon className='h-5 w-5' />
              </div>
              <div>
                <CardTitle className='text-lg'>{config.name}</CardTitle>
                <CardDescription className='text-sm'>
                  {config.availability}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? 'success' : 'secondary'}>
              {isConnected ? 'Connected' : 'Available'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <p className='mb-4 text-sm text-gray-600'>{config.description}</p>

          {isConnected && integration && (
            <div className='mb-4 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Data types:</span>
                <span>{integration.data_types.join(', ')}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span>Sync frequency:</span>
                <span className='capitalize'>{integration.sync_frequency}</span>
              </div>
              {integration.last_sync && (
                <div className='flex justify-between text-sm'>
                  <span>Last synced:</span>
                  <span>{integration.last_sync.toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          <div className='flex gap-2'>
            {isConnected ? (
              <>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleDisconnect(source)}
                  className='flex-1'
                >
                  Disconnect
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelectedIntegration(source)}
                >
                  <Settings className='h-4 w-4' />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleConnect(source)}
                disabled={isConnecting}
                className='flex-1'
              >
                {isConnecting ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Plus className='mr-2 h-4 w-4' />
                )}
                Connect
              </Button>
            )}
          </div>

          {/* Special FitIndex integration options */}
          {source === 'fitindex' && (
            <FitIndexIntegrationOptions
              onConnect={handleConnect}
              isConnecting={isConnecting}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  const connectedCount = Array.from(integrations.values()).filter(
    (i) => i.enabled
  ).length;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Device Integrations</h2>
          <p className='text-gray-600'>
            Connect your smart devices and health platforms
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Badge variant='outline'>{connectedCount} connected</Badge>
          <Button
            onClick={handleSyncAll}
            disabled={syncingAll || connectedCount === 0}
          >
            {syncingAll ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Wifi className='mr-2 h-4 w-4' />
            )}
            Sync All
          </Button>
        </div>
      </div>

      {/* Integration Status Alert */}
      {connectedCount === 0 && (
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            No devices connected yet. Connect your smart scales or health
            platforms to automatically sync your measurements.
          </AlertDescription>
        </Alert>
      )}

      {/* Integration Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {Object.keys(integrationConfigs).map((source) =>
          renderIntegrationCard(source as HealthDataSource)
        )}
      </div>

      {/* Manual Entry Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <QrCode className='h-5 w-5' />
            Manual & QR Code Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='mb-4 text-sm text-gray-600'>
            Can't connect your device? No problem! You can manually log
            measurements or use QR code scanning for supported smart scales.
          </p>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm'>
              <QrCode className='mr-2 h-4 w-4' />
              Scan QR Code
            </Button>
            <Button variant='outline' size='sm'>
              Manual Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * FitIndex specific integration options for 2025
 */
function FitIndexIntegrationOptions({
  onConnect,
  isConnecting,
}: {
  onConnect: (source: HealthDataSource) => void;
  isConnecting: boolean;
}) {
  return (
    <div className='mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3'>
      <h4 className='mb-2 font-medium text-orange-900'>
        FitIndex Integration Options
      </h4>
      <div className='space-y-2 text-sm'>
        <div className='flex items-center gap-2'>
          <Smartphone className='h-4 w-4 text-orange-600' />
          <span>Via Apple Health or Health Connect (Recommended)</span>
        </div>
        <div className='flex items-center gap-2'>
          <QrCode className='h-4 w-4 text-orange-600' />
          <span>QR Code scanning from scale display</span>
        </div>
        <div className='flex items-center gap-2'>
          <Bluetooth className='h-4 w-4 text-orange-600' />
          <span>Direct Bluetooth connection (if supported)</span>
        </div>
      </div>
      <Alert className='mt-3'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription className='text-xs'>
          For best results, enable FitIndex sync in your Apple Health or Google
          Health Connect app first, then connect here to automatically import
          your data.
        </AlertDescription>
      </Alert>
    </div>
  );
}
