/**
 * Health Data Sync API
 * Handles syncing measurement data from health platforms like Fitindex via Apple Health/Google Fit
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db/connection';
import { HealthIntegrationManager } from '@/lib/integrations/health-manager';
import { HealthMeasurement } from '@/lib/integrations/types';

// Request validation schemas
const syncRequestSchema = z.object({
  provider: z.enum(['apple-health', 'google-fit', 'fitbit', 'myfitnesspal']),
  options: z
    .object({
      startDate: z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
      endDate: z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
      measurementTypes: z
        .array(z.enum(['weight', 'body_fat', 'muscle_mass', 'circumference']))
        .optional(),
    })
    .optional(),
});

const testConnectionSchema = z.object({
  provider: z.enum(['apple-health', 'google-fit', 'fitbit', 'myfitnesspal']),
});

/**
 * POST /api/progress/sync
 * Sync measurements from a health platform
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, options = {} } = syncRequestSchema.parse(body);

    // Initialize health integration manager
    const healthManager = new HealthIntegrationManager(userId);

    // Check if provider is available
    if (!healthManager.isProviderAvailable(provider)) {
      return NextResponse.json(
        {
          error: `${provider} is not available on this device`,
          success: false,
          provider,
        },
        { status: 400 }
      );
    }

    // Perform sync
    const syncResult = await healthManager.syncProvider(provider, options);

    if (!syncResult.success) {
      return NextResponse.json(
        {
          error: syncResult.error,
          success: false,
          provider: syncResult.provider,
        },
        { status: 400 }
      );
    }

    // Get the integration to fetch actual measurements
    const integration = healthManager.getIntegration(provider);
    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 500 }
      );
    }

    // Fetch measurements from the integration
    const measurements = await integration.fetchMeasurements(options);

    // Save measurements to database
    let measurementsAdded = 0;
    let measurementsUpdated = 0;

    for (const measurement of measurements) {
      try {
        // Check if measurement already exists (prevent duplicates)
        const existing = await db.queryOne<{
          id: string;
          user_id: string;
          measurement_type: string;
          value: number;
          measured_at: string;
          source: string;
        }>`
          SELECT id, user_id, measurement_type, value, measured_at, source
          FROM measurements
          WHERE user_id = ${userId}
            AND measurement_type = ${measurement.measurementType}
            AND value = ${measurement.value}
            AND measured_at = ${measurement.measuredAt.toISOString()}
            AND source = ${measurement.source}
          LIMIT 1
        `;

        if (existing) {
          // Update existing measurement
          await db`
            UPDATE measurements
            SET unit = ${measurement.unit},
                measurement_method = ${measurement.measurementMethod || null},
                measurement_device = ${measurement.measurementDevice || null},
                notes = ${measurement.notes || null},
                updated_at = ${new Date().toISOString()}
            WHERE id = ${existing.id}
          `;
          measurementsUpdated++;
        } else {
          // Create new measurement
          await db`
            INSERT INTO measurements (
              user_id,
              measurement_type,
              measurement_location,
              value,
              unit,
              measured_at,
              measurement_method,
              measurement_device,
              notes,
              source,
              created_at,
              updated_at
            ) VALUES (
              ${userId},
              ${measurement.measurementType},
              ${measurement.measurementLocation || null},
              ${measurement.value},
              ${measurement.unit},
              ${measurement.measuredAt.toISOString()},
              ${measurement.measurementMethod || null},
              ${measurement.measurementDevice || null},
              ${measurement.notes || null},
              ${measurement.source},
              ${new Date().toISOString()},
              ${new Date().toISOString()}
            )
          `;
          measurementsAdded++;
        }
      } catch (error) {
        console.error('Error saving measurement:', error);
        // Continue with other measurements
      }
    }

    // Update sync result with actual database operations
    const finalResult = {
      ...syncResult,
      measurementsAdded,
      measurementsUpdated,
      totalMeasurements: measurementsAdded + measurementsUpdated,
    };

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error('Health sync API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
          success: false,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/progress/sync
 * Get sync status for all providers
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const healthManager = new HealthIntegrationManager(userId);

    const [syncStatuses, availablePlatforms] = await Promise.all([
      healthManager.getSyncStatus(),
      Promise.resolve(healthManager.getAvailablePlatforms()),
    ]);

    return NextResponse.json({
      syncStatuses,
      availablePlatforms,
      success: true,
    });
  } catch (error) {
    console.error('Health sync status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/progress/sync
 * Test connection to a health platform
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = testConnectionSchema.parse(body);

    const healthManager = new HealthIntegrationManager(userId);
    const testResult = await healthManager.testConnection(provider);

    return NextResponse.json({
      provider,
      ...testResult,
    });
  } catch (error) {
    console.error('Health connection test API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/progress/sync
 * Clear sync data for a provider
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (
      !provider ||
      !['apple-health', 'google-fit', 'fitbit', 'myfitnesspal'].includes(
        provider
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid or missing provider parameter' },
        { status: 400 }
      );
    }

    const healthManager = new HealthIntegrationManager(userId);
    await healthManager.clearProviderData(provider);

    // Optionally, also remove synced measurements from database
    const deleteFromDb = searchParams.get('deleteData') === 'true';
    if (deleteFromDb) {
      await db`
        DELETE FROM measurements
        WHERE user_id = ${userId}
          AND source ILIKE ${'%' + provider + '%'}
      `;
    }

    return NextResponse.json({
      success: true,
      provider,
      message: `Sync data cleared for ${provider}`,
    });
  } catch (error) {
    console.error('Clear sync data API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
