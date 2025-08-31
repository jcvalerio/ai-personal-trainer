/**
 * Progress Measurements API
 * Handles CRUD operations for user body measurements and progress tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import ProgressService from '@/lib/services/progress-service';
import type { CreateProgressMeasurementRequest } from '@/types/workouts';

// Validation schemas
const measurementSchema = z.object({
  measurementType: z.enum([
    'weight',
    'body_fat',
    'muscle_mass',
    'circumference',
  ]),
  measurementLocation: z.string().optional(),
  value: z.number().positive(),
  unit: z.string().min(1),
  measuredAt: z.string().datetime().optional(),
  measurementMethod: z.string().optional(),
  measurementDevice: z.string().optional(),
  bodyComposition: z.record(z.any()).optional(),
  notes: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

const querySchema = z.object({
  measurementType: z
    .enum(['weight', 'body_fat', 'muscle_mass', 'circumference'])
    .optional(),
  measurementLocation: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const progressService = new ProgressService();

/**
 * GET /api/progress/measurements
 * Retrieve user's progress measurements with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validatedQuery = querySchema.safeParse(queryParams);
    if (!validatedQuery.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validatedQuery.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      measurementType,
      measurementLocation,
      dateFrom,
      dateTo,
      page = '1',
      limit = '20',
      sortBy = 'measured_at',
      sortOrder = 'desc',
    } = validatedQuery.data;

    // Build filters
    const filters: any = {};
    if (measurementType) filters.measurementType = measurementType;
    if (measurementLocation) filters.measurementLocation = measurementLocation;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    // Build pagination
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    // Get measurements
    const result = await progressService.getProgressMeasurements(
      { userId, organizationId: orgId || undefined },
      filters,
      pagination
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.data!.total,
        totalPages: result.data!.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching progress measurements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/progress/measurements
 * Create a new progress measurement
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validatedData = measurementSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid measurement data',
          details: validatedData.error.errors,
        },
        { status: 400 }
      );
    }

    const measurementData: CreateProgressMeasurementRequest = {
      ...validatedData.data,
      measuredAt: validatedData.data.measuredAt
        ? new Date(validatedData.data.measuredAt)
        : new Date(),
    };

    // Validate circumference measurements have location
    if (
      measurementData.measurementType === 'circumference' &&
      !measurementData.measurementLocation
    ) {
      return NextResponse.json(
        { error: 'Circumference measurements require a measurement location' },
        { status: 400 }
      );
    }

    // Create measurement
    const result = await progressService.createProgressMeasurement(
      measurementData,
      { userId, organizationId: orgId || null }
    );

    if (!result.success) {
      const code = result.error.code || 'BAD_REQUEST';
      const status = code === 'RESOURCE_CONFLICT' ? 409 : 400;
      return NextResponse.json(
        { error: result.error.message, code },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: 'Measurement logged successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating progress measurement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
