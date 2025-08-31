/**
 * Individual Progress Measurement API
 * Handles operations on specific measurements by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import ProgressService from '@/lib/services/progress-service';
import type { CreateProgressMeasurementRequest } from '@/types/workouts';

// Validation schema for updates (all fields optional)
const updateMeasurementSchema = z.object({
  value: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  measuredAt: z.string().datetime().optional(),
  measurementMethod: z.string().optional(),
  measurementDevice: z.string().optional(),
  bodyComposition: z.record(z.any()).optional(),
  notes: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

const progressService = new ProgressService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/progress/measurements/[id]
 * Get a specific measurement by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Measurement ID is required' },
        { status: 400 }
      );
    }

    // For individual measurements, we'll use the update method to check existence
    // This is a workaround since the service doesn't expose a direct get by ID method
    const result = await progressService.updateProgressMeasurement(
      id,
      {}, // Empty update just to check if measurement exists and get data
      { userId, organizationId: orgId || undefined }
    );

    if (!result.success) {
      if (result.error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Measurement not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching measurement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/progress/measurements/[id]
 * Update a specific measurement
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Measurement ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateMeasurementSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid measurement data',
          details: validatedData.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData: Partial<CreateProgressMeasurementRequest> = {
      ...validatedData.data,
      ...(validatedData.data.measuredAt && {
        measuredAt: new Date(validatedData.data.measuredAt),
      }),
    };

    // Update measurement
    const result = await progressService.updateProgressMeasurement(
      id,
      updateData,
      { userId, organizationId: orgId || null }
    );

    if (!result.success) {
      if (result.error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Measurement not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Measurement updated successfully',
    });
  } catch (error) {
    console.error('Error updating measurement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/progress/measurements/[id]
 * Delete a specific measurement
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Measurement ID is required' },
        { status: 400 }
      );
    }

    // Delete measurement
    const result = await progressService.deleteProgressMeasurement(id, {
      userId,
      organizationId: orgId || null,
    });

    if (!result.success) {
      if (result.error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Measurement not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Measurement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting measurement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
