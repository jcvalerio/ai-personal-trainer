/**
 * Apple Health Integration
 * Integrates with Apple HealthKit for iOS devices
 */

import { BaseHealthIntegration } from './base-integration';
import { HealthMeasurement, SyncOptions, HEALTH_PLATFORMS } from './types';

// HealthKit types for TypeScript
interface HealthKitQuantity {
  value: number;
  unit: string;
}

interface HealthKitSample {
  uuid: string;
  value?: number;
  quantity?: HealthKitQuantity;
  startDate: string;
  endDate: string;
  sourceName?: string;
  sourceRevision?: {
    source: {
      name: string;
      bundleIdentifier: string;
    };
  };
}

interface HealthKitPermissions {
  read?: string[];
  write?: string[];
}

interface HealthKitQueryOptions {
  sampleName: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
  ascending?: boolean;
}

// Mock HealthKit interface for web/development
interface MockHealthKit {
  isAvailable(): boolean;
  requestAuthorization(
    permissions: HealthKitPermissions
  ): Promise<{ granted: boolean }>;
  queryHKitSampleType(
    options: HealthKitQueryOptions
  ): Promise<HealthKitSample[]>;
}

// Declare global HealthKit (will be available in Capacitor iOS app)
declare global {
  interface Window {
    HealthKit?: MockHealthKit;
    isNativeApp?: boolean;
  }
}

export class AppleHealthIntegration extends BaseHealthIntegration {
  provider = 'apple-health' as const;
  private healthKit: MockHealthKit | null = null;

  constructor(userId: string) {
    super(userId, HEALTH_PLATFORMS['apple-health']);
    this.healthKit = this.getHealthKit();
  }

  private getHealthKit(): MockHealthKit | null {
    if (typeof window === 'undefined') return null;

    // In a real Capacitor app, this would be the actual HealthKit plugin
    if (window.HealthKit) {
      return window.HealthKit;
    }

    // For PWA and web environments on iOS, create mock implementation
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari =
      /Safari/.test(navigator.userAgent) &&
      /Apple Computer/.test(navigator.vendor);
    const isPWA =
      window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS || isSafari || isPWA) {
      console.log('Creating mock HealthKit for iOS PWA environment');
      return this.createMockHealthKit();
    }

    return null;
  }

  private createMockHealthKit(): MockHealthKit {
    return {
      isAvailable: () => true,
      requestAuthorization: async (permissions: HealthKitPermissions) => {
        console.log('Mock HealthKit: Requesting permissions', permissions);
        // Simulate user granting permissions
        return { granted: true };
      },
      queryHKitSampleType: async (options: HealthKitQueryOptions) => {
        console.log('Mock HealthKit: Querying samples', options);

        // Generate mock Fitindex data
        return this.generateMockFitindexData(options);
      },
    };
  }

  private generateMockFitindexData(
    options: HealthKitQueryOptions
  ): HealthKitSample[] {
    const samples: HealthKitSample[] = [];
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    // Generate sample data for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * dayMs);

      if (options.sampleName === 'weight') {
        samples.push({
          uuid: `mock-weight-${i}`,
          quantity: {
            value: 175 + Math.random() * 5 - 2.5, // 172.5-177.5 lbs
            unit: 'lbs',
          },
          startDate: date.toISOString(),
          endDate: date.toISOString(),
          sourceName: 'Fitindex Smart Scale',
          sourceRevision: {
            source: {
              name: 'Fitindex',
              bundleIdentifier: 'com.fitindex.app',
            },
          },
        });
      } else if (options.sampleName === 'body_fat_percentage') {
        samples.push({
          uuid: `mock-bodyfat-${i}`,
          quantity: {
            value: 18 + Math.random() * 4 - 2, // 16-20%
            unit: '%',
          },
          startDate: date.toISOString(),
          endDate: date.toISOString(),
          sourceName: 'Fitindex Smart Scale',
        });
      } else if (options.sampleName === 'lean_body_mass') {
        samples.push({
          uuid: `mock-muscle-${i}`,
          quantity: {
            value: 140 + Math.random() * 10 - 5, // 135-145 lbs
            unit: 'lbs',
          },
          startDate: date.toISOString(),
          endDate: date.toISOString(),
          sourceName: 'Fitindex Smart Scale',
        });
      }
    }

    return samples
      .filter((s) => {
        const sampleDate = new Date(s.startDate);
        return sampleDate >= options.startDate && sampleDate <= options.endDate;
      })
      .slice(0, options.limit || 100);
  }

  isAvailable(): boolean {
    // Check if running on iOS
    if (typeof window === 'undefined') return false;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari =
      /Safari/.test(navigator.userAgent) &&
      /Apple Computer/.test(navigator.vendor);
    const isPWA =
      window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches;

    // Available on iOS devices (including PWA)
    const isAppleDevice = isIOS || isSafari || isPWA;

    console.log('Apple Health availability check:', {
      isIOS,
      isSafari,
      isPWA,
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      available: isAppleDevice,
    });

    return isAppleDevice;
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.healthKit) {
      throw new Error('Apple Health is not available on this device');
    }

    try {
      const permissions: HealthKitPermissions = {
        read: ['weight', 'body_fat_percentage', 'lean_body_mass', 'height'],
        write: [], // We only read data
      };

      const result = await this.healthKit.requestAuthorization(permissions);
      return result.granted;
    } catch (error) {
      await this.handleSyncError(error, 'requestPermissions');
    }
  }

  async fetchMeasurements(
    options: SyncOptions = {}
  ): Promise<HealthMeasurement[]> {
    if (!this.healthKit) {
      throw new Error('Apple Health is not available');
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Apple Health permissions not granted');
    }

    try {
      const endDate = options.endDate || new Date();
      const startDate =
        options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const measurements: HealthMeasurement[] = [];

      // Fetch weight measurements
      if (
        !options.measurementTypes ||
        options.measurementTypes.includes('weight')
      ) {
        const weightSamples = await this.healthKit.queryHKitSampleType({
          sampleName: 'weight',
          startDate,
          endDate,
          limit: 100,
          ascending: false,
        });

        const weightMeasurements = this.transformToStandardFormat(
          weightSamples.filter((s) => this.isFitindexSource(s)),
          'fitindex-via-apple-health',
          'weight'
        );

        measurements.push(...weightMeasurements);
      }

      // Fetch body fat measurements
      if (
        !options.measurementTypes ||
        options.measurementTypes.includes('body_fat')
      ) {
        const bodyFatSamples = await this.healthKit.queryHKitSampleType({
          sampleName: 'body_fat_percentage',
          startDate,
          endDate,
          limit: 100,
          ascending: false,
        });

        const bodyFatMeasurements = this.transformToStandardFormat(
          bodyFatSamples.filter((s) => this.isFitindexSource(s)),
          'fitindex-via-apple-health',
          'body_fat'
        );

        measurements.push(...bodyFatMeasurements);
      }

      // Fetch muscle mass measurements
      if (
        !options.measurementTypes ||
        options.measurementTypes.includes('muscle_mass')
      ) {
        const muscleSamples = await this.healthKit.queryHKitSampleType({
          sampleName: 'lean_body_mass',
          startDate,
          endDate,
          limit: 100,
          ascending: false,
        });

        const muscleMeasurements = this.transformToStandardFormat(
          muscleSamples.filter((s) => this.isFitindexSource(s)),
          'fitindex-via-apple-health',
          'muscle_mass'
        );

        measurements.push(...muscleMeasurements);
      }

      // Filter out invalid measurements and remove duplicates
      const validMeasurements = measurements
        .filter((m) => this.validateMeasurement(m))
        .filter((measurement, index, self) => {
          // Remove duplicates based on type, value, and date
          return (
            index ===
            self.findIndex(
              (m) =>
                m.measurementType === measurement.measurementType &&
                m.value === measurement.value &&
                m.measuredAt.getTime() === measurement.measuredAt.getTime()
            )
          );
        });

      console.log(
        `Apple Health: Fetched ${validMeasurements.length} measurements from Fitindex`
      );
      return validMeasurements;
    } catch (error) {
      await this.handleSyncError(error, 'fetchMeasurements');
    }
  }

  private isFitindexSource(sample: HealthKitSample): boolean {
    const sourceName = sample.sourceName?.toLowerCase() || '';
    const bundleId =
      sample.sourceRevision?.source?.bundleIdentifier?.toLowerCase() || '';

    // Check for Fitindex-related source names and bundle identifiers
    const fitindexIndicators = [
      'fitindex',
      'fit index',
      'smart scale',
      'body composition',
      'com.fitindex',
    ];

    return fitindexIndicators.some(
      (indicator) =>
        sourceName.includes(indicator) || bundleId.includes(indicator)
    );
  }
}
