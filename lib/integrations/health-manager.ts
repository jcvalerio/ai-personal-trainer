/**
 * Health Integration Manager
 * Manages all health platform integrations and provides a unified interface
 */

import { AppleHealthIntegration } from './apple-health';
import { GoogleFitIntegration } from './google-fit';
import {
  HealthIntegration,
  HealthMeasurement,
  SyncOptions,
  SyncResult,
  HEALTH_PLATFORMS,
} from './types';

export class HealthIntegrationManager {
  private integrations: Map<string, HealthIntegration> = new Map();
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.initializeIntegrations();
  }

  private initializeIntegrations(): void {
    // Initialize Apple Health integration
    const appleHealth = new AppleHealthIntegration(this.userId);
    this.integrations.set('apple-health', appleHealth);

    // Initialize Google Fit integration
    const googleFit = new GoogleFitIntegration(this.userId);
    this.integrations.set('google-fit', googleFit);
  }

  /**
   * Get all available health platforms for the current device
   */
  getAvailablePlatforms(): Array<{
    provider: string;
    config: any;
    available: boolean;
  }> {
    return Array.from(this.integrations.entries()).map(
      ([provider, integration]) => ({
        provider,
        config: HEALTH_PLATFORMS[provider],
        available: integration.isAvailable(),
      })
    );
  }

  /**
   * Get a specific health integration
   */
  getIntegration(provider: string): HealthIntegration | null {
    return this.integrations.get(provider) || null;
  }

  /**
   * Check if a provider is available on current device
   */
  isProviderAvailable(provider: string): boolean {
    const integration = this.integrations.get(provider);
    return integration ? integration.isAvailable() : false;
  }

  /**
   * Sync measurements from a specific provider
   */
  async syncProvider(
    provider: string,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const integration = this.integrations.get(provider);
    if (!integration) {
      return {
        success: false,
        provider,
        measurementsAdded: 0,
        measurementsUpdated: 0,
        error: `Provider ${provider} not found`,
      };
    }

    if (!integration.isAvailable()) {
      return {
        success: false,
        provider,
        measurementsAdded: 0,
        measurementsUpdated: 0,
        error: `Provider ${provider} is not available on this device`,
      };
    }

    try {
      // Set start date to last sync if not provided
      if (!options.startDate) {
        const lastSync = await integration.getLastSyncDate();
        if (lastSync) {
          options.startDate = lastSync;
        }
      }

      const measurements = await integration.fetchMeasurements(options);

      if (measurements.length === 0) {
        return {
          success: true,
          provider,
          measurementsAdded: 0,
          measurementsUpdated: 0,
          lastSyncDate: new Date(),
        };
      }

      // Update last sync date
      await integration.setLastSyncDate(new Date());

      return {
        success: true,
        provider,
        measurementsAdded: measurements.length,
        measurementsUpdated: 0,
        lastSyncDate: new Date(),
      };
    } catch (error) {
      console.error(`Health sync error for ${provider}:`, error);

      return {
        success: false,
        provider,
        measurementsAdded: 0,
        measurementsUpdated: 0,
        error: error instanceof Error ? error.message : 'Unknown sync error',
      };
    }
  }

  /**
   * Sync from all available providers
   */
  async syncAllProviders(options: SyncOptions = {}): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const [provider, integration] of this.integrations) {
      if (integration.isAvailable()) {
        const result = await this.syncProvider(provider, options);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get sync status for all providers
   */
  async getSyncStatus(): Promise<
    Array<{
      provider: string;
      available: boolean;
      lastSync: Date | null;
      config: any;
    }>
  > {
    const statuses = [];

    for (const [provider, integration] of this.integrations) {
      const lastSync = await integration.getLastSyncDate();

      statuses.push({
        provider,
        available: integration.isAvailable(),
        lastSync,
        config: HEALTH_PLATFORMS[provider],
      });
    }

    return statuses;
  }

  /**
   * Clear sync data for a provider
   */
  async clearProviderData(provider: string): Promise<void> {
    const integration = this.integrations.get(provider);
    if (integration) {
      // Clear last sync date
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`health-sync-${provider}-${this.userId}`);
      }
    }
  }

  /**
   * Test connection to a provider
   */
  async testConnection(
    provider: string
  ): Promise<{ success: boolean; error?: string }> {
    const integration = this.integrations.get(provider);
    if (!integration) {
      return { success: false, error: 'Provider not found' };
    }

    if (!integration.isAvailable()) {
      return { success: false, error: 'Provider not available on this device' };
    }

    try {
      const hasPermissions = await integration.requestPermissions();
      if (!hasPermissions) {
        return { success: false, error: 'Permissions not granted' };
      }

      // Try to fetch a small sample of data
      const measurements = await integration.fetchMeasurements({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        endDate: new Date(),
      });

      return {
        success: true,
        error: `Connection successful. Found ${measurements.length} measurements.`,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  /**
   * Get recommended sync frequency for a provider
   */
  getRecommendedSyncFrequency(provider: string): string {
    const config = HEALTH_PLATFORMS[provider];
    if (!config) return 'Unknown';

    if (config.supportsBackground) {
      return 'Automatic (Background)';
    } else {
      return 'Manual (Daily)';
    }
  }
}
