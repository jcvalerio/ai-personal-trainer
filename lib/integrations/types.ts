/**
 * Health Integration Types
 * Type definitions for health platform integrations
 */

export interface HealthMeasurement {
  measurementType: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference';
  measurementLocation?: string;
  value: number;
  unit: string;
  measuredAt: Date;
  measurementMethod?: string;
  measurementDevice?: string;
  source: string;
  sourceId?: string;
  notes?: string;
}

export interface HealthIntegration {
  provider: 'apple-health' | 'google-fit' | 'fitbit' | 'myfitnesspal';
  isAvailable(): boolean;
  requestPermissions(): Promise<boolean>;
  fetchMeasurements(options?: SyncOptions): Promise<HealthMeasurement[]>;
  getLastSyncDate(): Promise<Date | null>;
  setLastSyncDate(date: Date): Promise<void>;
}

export interface SyncOptions {
  startDate?: Date;
  endDate?: Date;
  measurementTypes?: (
    | 'weight'
    | 'body_fat'
    | 'muscle_mass'
    | 'circumference'
  )[];
}

export interface SyncResult {
  success: boolean;
  provider: string;
  measurementsAdded: number;
  measurementsUpdated: number;
  error?: string;
  lastSyncDate?: Date;
}

export interface HealthPlatformConfig {
  name: string;
  icon: string;
  description: string;
  isNative: boolean;
  supportsBackground: boolean;
  supportedMeasurements: string[];
}

export const HEALTH_PLATFORMS: Record<string, HealthPlatformConfig> = {
  'apple-health': {
    name: 'Apple Health',
    icon: '🍎',
    description: 'Sync with Apple Health on iOS devices',
    isNative: true,
    supportsBackground: true,
    supportedMeasurements: ['weight', 'body_fat', 'muscle_mass'],
  },
  'google-fit': {
    name: 'Google Fit',
    icon: '🔗',
    description: 'Sync with Google Fit on Android devices',
    isNative: true,
    supportsBackground: true,
    supportedMeasurements: ['weight', 'body_fat'],
  },
  fitbit: {
    name: 'Fitbit',
    icon: '⌚',
    description: 'Connect your Fitbit account',
    isNative: false,
    supportsBackground: false,
    supportedMeasurements: ['weight', 'body_fat', 'muscle_mass'],
  },
  myfitnesspal: {
    name: 'MyFitnessPal',
    icon: '📱',
    description: 'Sync with MyFitnessPal',
    isNative: false,
    supportsBackground: false,
    supportedMeasurements: ['weight'],
  },
};
