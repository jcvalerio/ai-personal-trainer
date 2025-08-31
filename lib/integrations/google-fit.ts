/**
 * Google Fit Integration
 * Integrates with Google Fit API for Android and web
 */

import { BaseHealthIntegration } from './base-integration';
import { HealthMeasurement, SyncOptions, HEALTH_PLATFORMS } from './types';

interface GoogleFitDataSource {
  dataStreamId: string;
  dataStreamName: string;
  type: string;
  application?: {
    name: string;
    packageName: string;
  };
}

interface GoogleFitDataPoint {
  dataTypeName: string;
  startTimeNanos: string;
  endTimeNanos: string;
  value: Array<{
    fpVal?: number;
    intVal?: number;
    stringVal?: string;
  }>;
  originDataSourceId?: string;
  rawTimestampNanos?: string;
}

interface GoogleFitDataSet {
  dataSourceId: string;
  point: GoogleFitDataPoint[];
}

interface GoogleFitResponse {
  bucket?: Array<{
    dataset: GoogleFitDataSet[];
  }>;
  point?: GoogleFitDataPoint[];
}

// Mock Google Fit API for development
interface MockGoogleFit {
  isAvailable(): boolean;
  requestAuth(): Promise<{ accessToken: string }>;
  getDataSources(): Promise<GoogleFitDataSource[]>;
  queryData(request: any): Promise<GoogleFitResponse>;
}

declare global {
  interface Window {
    GoogleFit?: MockGoogleFit;
    gapi?: any;
  }
}

export class GoogleFitIntegration extends BaseHealthIntegration {
  provider = 'google-fit' as const;
  private googleFit: MockGoogleFit | null = null;
  private accessToken: string | null = null;

  constructor(userId: string) {
    super(userId, HEALTH_PLATFORMS['google-fit']);
    this.googleFit = this.getGoogleFit();
  }

  private getGoogleFit(): MockGoogleFit | null {
    if (typeof window !== 'undefined' && window.GoogleFit) {
      return window.GoogleFit;
    }

    // Mock implementation for development
    if (typeof window !== 'undefined') {
      return this.createMockGoogleFit();
    }

    return null;
  }

  private createMockGoogleFit(): MockGoogleFit {
    return {
      isAvailable: () => true,
      requestAuth: async () => {
        console.log('Mock Google Fit: Requesting authentication');
        return { accessToken: 'mock-access-token' };
      },
      getDataSources: async () => {
        return [
          {
            dataStreamId: 'mock-fitindex-weight-stream',
            dataStreamName: 'Weight from Fitindex',
            type: 'com.google.weight',
            application: {
              name: 'Fitindex',
              packageName: 'com.fitindex.app',
            },
          },
          {
            dataStreamId: 'mock-fitindex-bodyfat-stream',
            dataStreamName: 'Body Fat from Fitindex',
            type: 'com.google.body.fat.percentage',
            application: {
              name: 'Fitindex',
              packageName: 'com.fitindex.app',
            },
          },
        ];
      },
      queryData: async (request: any) => {
        console.log('Mock Google Fit: Querying data', request);
        return this.generateMockGoogleFitData(request);
      },
    };
  }

  private generateMockGoogleFitData(request: any): GoogleFitResponse {
    const points: GoogleFitDataPoint[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Generate mock data for the last 30 days
    for (let i = 0; i < 30; i++) {
      const timestamp = now - i * dayMs;
      const timestampNanos = `${timestamp}000000`; // Convert to nanoseconds

      // Weight data
      if (
        request.aggregateBy?.some(
          (agg: any) => agg.dataTypeName === 'com.google.weight'
        )
      ) {
        points.push({
          dataTypeName: 'com.google.weight',
          startTimeNanos: timestampNanos,
          endTimeNanos: timestampNanos,
          value: [
            {
              fpVal: 175 + Math.random() * 5 - 2.5, // 172.5-177.5 lbs
            },
          ],
          originDataSourceId: 'mock-fitindex-weight-stream',
        });
      }

      // Body fat data
      if (
        request.aggregateBy?.some(
          (agg: any) => agg.dataTypeName === 'com.google.body.fat.percentage'
        )
      ) {
        points.push({
          dataTypeName: 'com.google.body.fat.percentage',
          startTimeNanos: timestampNanos,
          endTimeNanos: timestampNanos,
          value: [
            {
              fpVal: 18 + Math.random() * 4 - 2, // 16-20%
            },
          ],
          originDataSourceId: 'mock-fitindex-bodyfat-stream',
        });
      }
    }

    return {
      bucket: [
        {
          dataset: [
            {
              dataSourceId: 'mock-fitindex-aggregated',
              point: points,
            },
          ],
        },
      ],
    };
  }

  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    const isAndroid = /Android/.test(navigator.userAgent);
    const hasGoogleFit = this.googleFit?.isAvailable() ?? false;

    return isAndroid || hasGoogleFit; // Allow in development
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.googleFit) {
      throw new Error('Google Fit is not available on this device');
    }

    try {
      const authResult = await this.googleFit.requestAuth();
      this.accessToken = authResult.accessToken;
      return !!this.accessToken;
    } catch (error) {
      await this.handleSyncError(error, 'requestPermissions');
    }
  }

  async fetchMeasurements(
    options: SyncOptions = {}
  ): Promise<HealthMeasurement[]> {
    if (!this.googleFit) {
      throw new Error('Google Fit is not available');
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Google Fit authentication failed');
    }

    try {
      const endDate = options.endDate || new Date();
      const startDate =
        options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const startTimeMillis = startDate.getTime();
      const endTimeMillis = endDate.getTime();

      // Get Fitindex data sources
      const dataSources = await this.googleFit.getDataSources();
      const fitindexSources = dataSources.filter((source) =>
        this.isFitindexSource(source)
      );

      if (fitindexSources.length === 0) {
        console.log('Google Fit: No Fitindex data sources found');
        return [];
      }

      const measurements: HealthMeasurement[] = [];

      // Query weight data
      if (
        !options.measurementTypes ||
        options.measurementTypes.includes('weight')
      ) {
        const weightRequest = {
          aggregateBy: [
            {
              dataTypeName: 'com.google.weight',
            },
          ],
          bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
          startTimeMillis,
          endTimeMillis,
        };

        const weightResponse = await this.googleFit.queryData(weightRequest);
        const weightMeasurements = this.parseGoogleFitResponse(
          weightResponse,
          'weight',
          'fitindex-via-google-fit'
        );
        measurements.push(...weightMeasurements);
      }

      // Query body fat data
      if (
        !options.measurementTypes ||
        options.measurementTypes.includes('body_fat')
      ) {
        const bodyFatRequest = {
          aggregateBy: [
            {
              dataTypeName: 'com.google.body.fat.percentage',
            },
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis,
          endTimeMillis,
        };

        const bodyFatResponse = await this.googleFit.queryData(bodyFatRequest);
        const bodyFatMeasurements = this.parseGoogleFitResponse(
          bodyFatResponse,
          'body_fat',
          'fitindex-via-google-fit'
        );
        measurements.push(...bodyFatMeasurements);
      }

      // Filter and deduplicate
      const validMeasurements = measurements
        .filter((m) => this.validateMeasurement(m))
        .filter((measurement, index, self) => {
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
        `Google Fit: Fetched ${validMeasurements.length} measurements from Fitindex`
      );
      return validMeasurements;
    } catch (error) {
      await this.handleSyncError(error, 'fetchMeasurements');
    }
  }

  private parseGoogleFitResponse(
    response: GoogleFitResponse,
    measurementType: 'weight' | 'body_fat' | 'muscle_mass',
    source: string
  ): HealthMeasurement[] {
    const measurements: HealthMeasurement[] = [];

    // Parse buckets (aggregated data)
    if (response.bucket) {
      for (const bucket of response.bucket) {
        for (const dataset of bucket.dataset) {
          for (const point of dataset.point) {
            const measurement = this.parseGoogleFitPoint(
              point,
              measurementType,
              source
            );
            if (measurement) {
              measurements.push(measurement);
            }
          }
        }
      }
    }

    // Parse direct points
    if (response.point) {
      for (const point of response.point) {
        const measurement = this.parseGoogleFitPoint(
          point,
          measurementType,
          source
        );
        if (measurement) {
          measurements.push(measurement);
        }
      }
    }

    return measurements;
  }

  private parseGoogleFitPoint(
    point: GoogleFitDataPoint,
    measurementType: 'weight' | 'body_fat' | 'muscle_mass',
    source: string
  ): HealthMeasurement | null {
    if (!point.value || point.value.length === 0) return null;

    const value = point.value[0].fpVal || point.value[0].intVal;
    if (!value) return null;

    const timestampNanos = point.startTimeNanos || point.rawTimestampNanos;
    if (!timestampNanos) return null;

    const measuredAt = new Date(parseInt(timestampNanos) / 1000000); // Convert nanoseconds to milliseconds

    let unit: string;
    switch (measurementType) {
      case 'weight':
        unit = 'lbs';
        break;
      case 'body_fat':
        unit = '%';
        break;
      case 'muscle_mass':
        unit = 'lbs';
        break;
      default:
        unit = 'unknown';
    }

    return {
      measurementType,
      value,
      unit,
      measuredAt,
      source,
      sourceId: `google-fit-${point.startTimeNanos}`,
      measurementDevice: 'Fitindex Smart Scale',
      notes: 'Imported from Google Fit',
    };
  }

  private isFitindexSource(source: GoogleFitDataSource): boolean {
    const sourceName = source.dataStreamName?.toLowerCase() || '';
    const packageName = source.application?.packageName?.toLowerCase() || '';
    const appName = source.application?.name?.toLowerCase() || '';

    const fitindexIndicators = [
      'fitindex',
      'fit index',
      'smart scale',
      'body composition',
    ];

    return fitindexIndicators.some(
      (indicator) =>
        sourceName.includes(indicator) ||
        packageName.includes(indicator) ||
        appName.includes(indicator)
    );
  }
}
