/**
 * Translation Fallback Component
 * Displays user-friendly text when translations fail
 */
'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TranslationFallbackProps {
  translationKey: string;
  fallbackText: string;
  showKey?: boolean;
}

export function TranslationFallback({
  translationKey,
  fallbackText,
  showKey = false,
}: TranslationFallbackProps) {
  return (
    <span className='inline-flex items-center gap-1 text-amber-700'>
      {showKey && <AlertTriangle className='h-3 w-3 text-amber-500' />}
      {fallbackText}
      {showKey && (
        <span className='font-mono text-xs text-amber-500'>
          ({translationKey})
        </span>
      )}
    </span>
  );
}

export function TranslationErrorCard({
  message = 'Translation system encountered issues',
  details,
}: {
  message?: string;
  details?: string;
}) {
  return (
    <Card className='border-amber-200 bg-amber-50'>
      <CardContent className='pt-6'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='mt-0.5 h-5 w-5 text-amber-600' />
          <div>
            <h3 className='font-medium text-amber-800'>{message}</h3>
            {details && (
              <p className='mt-1 text-sm text-amber-700'>{details}</p>
            )}
            <p className='mt-2 text-xs text-amber-600'>
              The page is functional, but some text may not display correctly.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for safer translation with fallbacks
export function useSafeTranslation(
  useTranslations: (key: string) => any,
  namespace: string
) {
  const t = useTranslations(namespace);

  return (key: string, params?: Record<string, any>, fallback?: string) => {
    try {
      const result = params ? t(key, params) : t(key);

      // Check if the result is a translation key (indicates failure)
      if (
        typeof result === 'string' &&
        result.includes('.') &&
        result === key
      ) {
        return fallback || key.split('.').pop() || key;
      }

      return result;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return fallback || key.split('.').pop() || key;
    }
  };
}
