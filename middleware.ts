import { clerkMiddleware } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { NextResponse } from 'next/server';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default clerkMiddleware(async (_, req) => {
  // Check if this is an API route that needs authentication
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // For API routes, just let Clerk handle authentication
    return NextResponse.next();
  }

  // Check if this is a sign-in or sign-up page (no locale prefix needed)
  if (
    req.nextUrl.pathname.startsWith('/sign-in') ||
    req.nextUrl.pathname.startsWith('/sign-up')
  ) {
    return NextResponse.next();
  }

  // For all other routes, apply internationalization
  return intlMiddleware(req);
});

export const config = {
  // Match all pathnames except for
  // - … the ones containing a dot (e.g. `favicon.ico`)
  // - … static files (`/_next`, `/_vercel`)
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
