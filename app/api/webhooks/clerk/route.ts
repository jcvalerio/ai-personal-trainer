/**
 * Clerk Webhook Handler
 * Handles Clerk authentication events and syncs with our database
 */

import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { 
  handleClerkUserWebhook,
  handleClerkOrganizationWebhook,
  logAuthEvent
} from '@/lib/db/auth'
import { 
  ClerkWebhookEvent,
  ClerkUserWebhookData,
  ClerkOrganizationWebhookData
} from '@/types/auth'

/**
 * POST /api/webhooks/clerk
 * Handle Clerk webhook events
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // Get the webhook secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET is not set')
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured', code: 'CONFIG_ERROR' },
        { status: 500 }
      )
    }

    // Get the headers
    const headerPayload = headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing svix headers', { svix_id, svix_timestamp, svix_signature })
      return NextResponse.json(
        { success: false, error: 'Missing webhook headers', code: 'INVALID_HEADERS' },
        { status: 400 }
      )
    }

    // Get the body
    const body = await req.text()

    // Create a new Svix instance with your secret
    const wh = new Webhook(webhookSecret)

    let event: ClerkWebhookEvent

    // Verify the payload with the headers
    try {
      event = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent
    } catch (err) {
      console.error('Webhook verification failed:', err)
      
      // Log the security event
      await logAuthEvent('webhook_verification_failed', 'security', 'Webhook verification failed', 
        undefined, undefined, { 
          error: err.message,
          svix_id,
          svix_timestamp,
          headers: Object.fromEntries(headerPayload.entries())
        })

      return NextResponse.json(
        { success: false, error: 'Webhook verification failed', code: 'VERIFICATION_FAILED' },
        { status: 400 }
      )
    }

    // Log the webhook event
    console.log('Received Clerk webhook:', event.type)

    // Handle the webhook event
    try {
      switch (event.type) {
        case 'user.created':
        case 'user.updated':
        case 'user.deleted':
          await handleUserWebhook(event.type, event.data as ClerkUserWebhookData)
          break

        case 'organization.created':
        case 'organization.updated':
        case 'organization.deleted':
          await handleOrganizationWebhook(event.type, event.data as ClerkOrganizationWebhookData)
          break

        case 'organizationMembership.created':
        case 'organizationMembership.updated':
        case 'organizationMembership.deleted':
          await handleOrganizationMembershipWebhook(event.type, event.data)
          break

        default:
          console.warn('Unhandled webhook event type:', event.type)
          // Log but don't fail for unknown event types
          await logAuthEvent('webhook_unhandled', 'security', `Unhandled webhook event: ${event.type}`, 
            undefined, undefined, { eventType: event.type })
          break
      }

      // Log successful webhook processing
      await logAuthEvent('webhook_processed', 'auth', `Webhook processed: ${event.type}`, 
        event.data.id, undefined, { 
          eventType: event.type,
          processingTime: Date.now() - startTime
        })

      const responseTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        eventType: event.type,
        meta: {
          responseTime,
          timestamp: new Date().toISOString(),
        }
      }, { status: 200 })

    } catch (processingError) {
      console.error('Error processing webhook:', processingError)
      
      // Log the processing error
      await logAuthEvent('webhook_processing_failed', 'security', `Webhook processing failed: ${event.type}`, 
        event.data.id, undefined, { 
          eventType: event.type,
          error: processingError.message,
          processingTime: Date.now() - startTime
        })

      return NextResponse.json(
        { 
          success: false, 
          error: 'Webhook processing failed', 
          code: 'PROCESSING_FAILED',
          eventType: event.type,
          message: process.env.NODE_ENV === 'development' ? processingError.message : undefined
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Unexpected webhook error:', error)
    
    // Log the unexpected error
    await logAuthEvent('webhook_error', 'security', 'Unexpected webhook error', 
      undefined, undefined, { error: error.message })

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Handle user-related webhook events
 */
async function handleUserWebhook(eventType: string, data: ClerkUserWebhookData): Promise<void> {
  console.log(`Processing user webhook: ${eventType} for user ${data.id}`)

  try {
    await handleClerkUserWebhook(eventType, data)
    
    // Additional processing based on event type
    switch (eventType) {
      case 'user.created':
        console.log(`New user created: ${data.id}`)
        // You could send welcome emails, create default data, etc.
        break

      case 'user.updated':
        console.log(`User updated: ${data.id}`)
        // Handle profile updates, email changes, etc.
        break

      case 'user.deleted':
        console.log(`User deleted: ${data.id}`)
        // Handle data cleanup, send confirmation emails, etc.
        break
    }

  } catch (error) {
    console.error(`Error handling user webhook ${eventType}:`, error)
    throw error
  }
}

/**
 * Handle organization-related webhook events
 */
async function handleOrganizationWebhook(eventType: string, data: ClerkOrganizationWebhookData): Promise<void> {
  console.log(`Processing organization webhook: ${eventType} for org ${data.id}`)

  try {
    await handleClerkOrganizationWebhook(eventType, data)
    
    // Additional processing based on event type
    switch (eventType) {
      case 'organization.created':
        console.log(`New organization created: ${data.id}`)
        // Set up default organization data, send notifications, etc.
        break

      case 'organization.updated':
        console.log(`Organization updated: ${data.id}`)
        // Handle organization profile updates
        break

      case 'organization.deleted':
        console.log(`Organization deleted: ${data.id}`)
        // Handle organization cleanup
        break
    }

  } catch (error) {
    console.error(`Error handling organization webhook ${eventType}:`, error)
    throw error
  }
}

/**
 * Handle organization membership-related webhook events
 */
async function handleOrganizationMembershipWebhook(eventType: string, data: any): Promise<void> {
  console.log(`Processing organization membership webhook: ${eventType}`)

  try {
    // Extract relevant data from the membership event
    const { organization, user } = data
    
    switch (eventType) {
      case 'organizationMembership.created':
        console.log(`User ${user.id} joined organization ${organization.id}`)
        
        // You might want to:
        // 1. Update user's organization_id in your database
        // 2. Send welcome email to the new member
        // 3. Update organization member count
        // 4. Grant appropriate permissions
        
        await logAuthEvent('membership_created', 'organization', 
          `User joined organization via Clerk`, user.id, organization.id, {
            organizationName: organization.name,
            userEmail: user.email_addresses?.[0]?.email_address
          })
        break

      case 'organizationMembership.updated':
        console.log(`Membership updated for user ${user.id} in organization ${organization.id}`)
        
        // Handle role changes, permission updates, etc.
        await logAuthEvent('membership_updated', 'organization', 
          `Organization membership updated`, user.id, organization.id)
        break

      case 'organizationMembership.deleted':
        console.log(`User ${user.id} left organization ${organization.id}`)
        
        // You might want to:
        // 1. Remove user from organization in your database
        // 2. Update organization member count
        // 3. Handle data ownership transfer
        // 4. Send departure confirmation
        
        await logAuthEvent('membership_deleted', 'organization', 
          `User left organization`, user.id, organization.id)
        break
    }

  } catch (error) {
    console.error(`Error handling organization membership webhook ${eventType}:`, error)
    throw error
  }
}

/**
 * Health check for webhook endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    message: 'Clerk webhook endpoint is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  })
}

/**
 * Webhook endpoint configuration
 */
export const runtime = 'nodejs'
export const maxDuration = 30 // 30 seconds timeout