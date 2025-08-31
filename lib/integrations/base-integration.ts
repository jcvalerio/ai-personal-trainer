/**
 * Base Health Integration Class
 * Abstract base class for all health platform integrations
 */

import {
  HealthIntegration,
  HealthMeasurement,
  SyncOptions,
  HealthPlatformConfig,
} from './types';

export abstract class BaseHealthIntegration implements HealthIntegration {
  abstract provider: 'apple-health' | 'google-fit' | 'fitbit' | 'myfitnesspal';
  protected userId: string;
  protected config: HealthPlatformConfig;

  constructor(userId: string, config: HealthPlatformConfig) {
    this.userId = userId;
    this.config = config;
  }

  abstract isAvailable(): boolean;
  abstract requestPermissions(): Promise<boolean>;
  abstract fetchMeasurements(
    options?: SyncOptions
  ): Promise<HealthMeasurement[]>;

  async getLastSyncDate(): Promise<Date | null> {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === 'undefined' ||
        typeof localStorage === 'undefined'
      ) {
        return null;
      }

      const stored = localStorage.getItem(
        `health-sync-${this.provider}-${this.userId}`
      );
      return stored ? new Date(stored) : null;
    } catch (error) {
      console.warn('Failed to get last sync date:', error);
      return null;
    }
  }

  async setLastSyncDate(date: Date): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === 'undefined' ||
        typeof localStorage === 'undefined'
      ) {
        return;
      }

      localStorage.setItem(
        `health-sync-${this.provider}-${this.userId}`,
        date.toISOString()
      );
    } catch (error) {
      console.warn('Failed to set last sync date:', error);
    }
  }

  protected transformToStandardFormat(
    rawData: any[],
    source: string,
    measurementType: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference'
  ): HealthMeasurement[] {
    return rawData.map((item) => ({
      measurementType,
      value: this.parseValue(item.value || item.quantity?.value),
      unit: this.parseUnit(
        item.unit || item.quantity?.unit || this.getDefaultUnit(measurementType)
      ),
      measuredAt: new Date(
        item.startDate || item.endDate || item.timestamp || item.date
      ),
      source,
      sourceId: item.uuid || item.id || `${source}-${Date.now()}`,
      measurementDevice: this.parseDevice(item.sourceName || item.device),
      notes: `Imported from ${this.config.name}`,
    }));
  }

  private parseValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    return 0;
  }

  private parseUnit(unit: any): string {
    if (typeof unit === 'string') return unit;
    return 'unknown';
  }

  private getDefaultUnit(measurementType: string): string {
    switch (measurementType) {
      case 'weight':
        return 'lbs';
      case 'body_fat':
        return '%';
      case 'muscle_mass':
        return 'lbs';
      case 'circumference':
        return 'in';
      default:
        return 'unknown';
    }
  }

  private parseDevice(sourceName?: string): string {
    if (!sourceName) return 'Unknown Device';

    // Map common source names to device names
    const deviceMap: Record<string, string> = {
      fitindex: 'Fitindex Smart Scale',
      fitbit: 'Fitbit Scale',
      withings: 'Withings Scale',
      renpho: 'RENPHO Smart Scale',
      eufy: 'Eufy Smart Scale',
      health: 'Manual Entry',
    };

    const lowerSourceName = sourceName.toLowerCase();
    for (const [key, device] of Object.entries(deviceMap)) {
      if (lowerSourceName.includes(key)) {
        return device;
      }
    }

    return sourceName;
  }

  protected async handleSyncError(error: any, context: string): Promise<never> {
    console.error(`${this.provider} integration error in ${context}:`, error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : `Failed to sync with ${this.config.name}`;

    throw new Error(`${this.config.name}: ${errorMessage}`);
  }

  protected validateMeasurement(measurement: HealthMeasurement): boolean {
    if (!measurement.value || measurement.value <= 0) return false;
    if (!measurement.unit) return false;
    if (!measurement.measuredAt || isNaN(measurement.measuredAt.getTime()))
      return false;
    return true;
  }
}
