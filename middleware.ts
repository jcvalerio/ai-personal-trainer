import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  // - … auth pages (`/sign-in`, `/sign-up`) which should remain at root level
  matcher: ['/((?!api|_next|_vercel|sign-in|sign-up|.*\\..*).*)'],
};
