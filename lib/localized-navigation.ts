/**
 * Localized Navigation Utilities
 * Standardizes routing across the application
 */

import { locales } from '../i18n';

export type Locale = (typeof locales)[number];

/**
 * Creates a localized path for navigation
 * Always uses consistent locale prefixing
 */
export function createLocalizedPath(path: string, locale: Locale): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Always prefix with locale for consistency
  return `/${locale}/${cleanPath}`;
}

/**
 * Removes locale prefix from pathname
 */
export function removeLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
    return '/' + segments.slice(1).join('/');
  }
  return pathname;
}

/**
 * Extracts locale from pathname
 */
export function getLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
    return segments[0] as Locale;
  }
  return null;
}

/**
 * Checks if a path is localized
 */
export function isLocalizedPath(pathname: string): boolean {
  return getLocaleFromPath(pathname) !== null;
}
