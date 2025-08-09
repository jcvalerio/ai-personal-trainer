/**
 * Authentication middleware for Next.js using Clerk
 * Handles route protection, redirects, and authentication state
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/health',
  '/favicon.ico',
  '/manifest.json',
  '/_next/(.*)',
  '/images/(.*)',
  '/icons/(.*)',
]


const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workouts(.*)',
  '/progress(.*)',
  '/organizations(.*)',
  '/settings(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

/**
 * Route configuration helpers
 */
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    const routeRegex = new RegExp(`^${route.replace('(.*)', '.*')}$`)
    return routeRegex.test(pathname)
  })
}