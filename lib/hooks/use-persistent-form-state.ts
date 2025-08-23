/**
 * Custom hook for persisting form state across language switches
 * Prevents form data loss during internationalization navigation
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';

interface UsePersistentFormStateOptions<T> {
  key: string;
  initialData: T;
  storage?: 'sessionStorage' | 'localStorage';
}

/**
 * Hook that persists form state across language switches and page reloads
 */
export function usePersistentFormState<T>({
  key,
  initialData,
  storage = 'sessionStorage',
}: UsePersistentFormStateOptions<T>) {
  const locale = useLocale();
  const prevLocale = useRef(locale);
  const [formData, setFormData] = useState<T>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Storage key with locale to prevent conflicts
  const storageKey = `${key}-${locale}`;

  // Load persisted data on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storageImpl =
        storage === 'localStorage' ? localStorage : sessionStorage;
      const saved = storageImpl.getItem(storageKey);

      if (saved) {
        const parsedData = JSON.parse(saved);
        console.log(`Restored form data for ${key}:`, parsedData);
        setFormData(parsedData);
      }
    } catch (error) {
      console.warn(`Failed to restore form data for ${key}:`, error);
      // Use initial data on error
      setFormData(initialData);
    } finally {
      setIsLoaded(true);
    }
  }, [key, storageKey, storage, initialData]);

  // Save data when form changes (use a ref to prevent infinite loops)
  const formDataRef = useRef(formData);

  useEffect(() => {
    // Only persist if data actually changed and component is loaded
    if (!isLoaded || typeof window === 'undefined') {
      return;
    }
    if (JSON.stringify(formDataRef.current) === JSON.stringify(formData)) {
      return;
    }

    try {
      const storageImpl =
        storage === 'localStorage' ? localStorage : sessionStorage;
      storageImpl.setItem(storageKey, JSON.stringify(formData));
      formDataRef.current = formData;
    } catch (error) {
      console.warn(`Failed to persist form data for ${key}:`, error);
    }
  }, [formData, storageKey, storage, isLoaded]);

  // Handle locale changes
  useEffect(() => {
    if (prevLocale.current !== locale) {
      console.log(
        `Locale changed from ${prevLocale.current} to ${locale} for form ${key}`
      );

      // Try to migrate data from previous locale if current locale has no data
      if (typeof window !== 'undefined') {
        try {
          const storageImpl =
            storage === 'localStorage' ? localStorage : sessionStorage;
          const currentData = storageImpl.getItem(storageKey);

          if (!currentData) {
            const prevKey = `${key}-${prevLocale.current}`;
            const prevData = storageImpl.getItem(prevKey);

            if (prevData) {
              console.log(
                `Migrating form data from ${prevKey} to ${storageKey}`
              );
              storageImpl.setItem(storageKey, prevData);
              setFormData(JSON.parse(prevData));
            }
          }
        } catch (error) {
          console.warn('Failed to migrate form data across locales:', error);
        }
      }

      prevLocale.current = locale;
    }
  }, [locale, key, storageKey, storage]);

  // Update function that triggers persistence
  const updateFormData = (updates: Partial<T> | ((prev: T) => T)) => {
    setFormData((prev) => {
      const newData =
        typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      // Only update if data actually changed
      if (JSON.stringify(prev) === JSON.stringify(newData)) {
        return prev;
      }
      return newData;
    });
  };

  // Clear persisted data
  const clearPersistedData = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storageImpl =
        storage === 'localStorage' ? localStorage : sessionStorage;
      storageImpl.removeItem(storageKey);

      // Also clear data for all locales
      const locales = ['en', 'es'];
      locales.forEach((loc) => {
        storageImpl.removeItem(`${key}-${loc}`);
      });

      setFormData(initialData);
    } catch (error) {
      console.warn(`Failed to clear persisted data for ${key}:`, error);
    }
  };

  return {
    formData,
    updateFormData,
    clearPersistedData,
    isLoaded,
  };
}

/**
 * Simplified version that supports multiple form steps without infinite loops
 */
export function usePersistentWizardState<T>({
  key,
  initialData,
  storage = 'sessionStorage',
}: UsePersistentFormStateOptions<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [currentStep, setCurrentStep] = useState<string>('basics');
  const [isLoaded, setIsLoaded] = useState(false);
  const locale = useLocale();

  // Storage keys
  const formStorageKey = `${key}-${locale}`;
  const stepStorageKey = `${key}-step-${locale}`;

  // Load persisted data on mount and locale change
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storageImpl =
        storage === 'localStorage' ? localStorage : sessionStorage;

      // Load form data
      const savedFormData = storageImpl.getItem(formStorageKey);
      if (savedFormData) {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
      }

      // Load current step
      const savedStep = storageImpl.getItem(stepStorageKey);
      if (savedStep) {
        setCurrentStep(savedStep);
      }
    } catch (error) {
      console.warn(`Failed to restore data for ${key}:`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [formStorageKey, stepStorageKey, storage, key]);

  // Save form data when it changes
  const updateFormData = (updates: Partial<T> | ((prev: T) => T)) => {
    setFormData((prev) => {
      const newData =
        typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };

      // Persist to storage
      if (typeof window !== 'undefined' && isLoaded) {
        try {
          const storageImpl =
            storage === 'localStorage' ? localStorage : sessionStorage;
          storageImpl.setItem(formStorageKey, JSON.stringify(newData));
        } catch (error) {
          console.warn(`Failed to persist form data for ${key}:`, error);
        }
      }

      return newData;
    });
  };

  // Save step when it changes
  const updateCurrentStep = (step: string) => {
    setCurrentStep(step);

    if (typeof window !== 'undefined' && isLoaded) {
      try {
        const storageImpl =
          storage === 'localStorage' ? localStorage : sessionStorage;
        storageImpl.setItem(stepStorageKey, step);
      } catch (error) {
        console.warn(`Failed to persist current step for ${key}:`, error);
      }
    }
  };

  // Clear all persisted data
  const clearPersistedData = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storageImpl =
        storage === 'localStorage' ? localStorage : sessionStorage;
      storageImpl.removeItem(formStorageKey);
      storageImpl.removeItem(stepStorageKey);
      setFormData(initialData);
      setCurrentStep('basics');
    } catch (error) {
      console.warn(`Failed to clear persisted data for ${key}:`, error);
    }
  };

  return {
    formData,
    updateFormData,
    currentStep,
    setCurrentStep: updateCurrentStep,
    clearPersistedData,
    isLoaded,
  };
}
