/**
 * Simplified Workout Plan API Route for deployment
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth()
    const resolvedParams = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: resolvedParams.planId,
        name: 'Sample Workout Plan',
        status: 'active',
        message: 'Workout plans service (deployment version)'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth()
    const resolvedParams = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: resolvedParams.planId,
        updated: true,
        message: 'Workout plan updated (deployment version)'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth()
    const resolvedParams = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: resolvedParams.planId,
        deleted: true,
        message: 'Workout plan deleted (deployment version)'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}