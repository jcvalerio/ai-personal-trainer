'use client'

import { useState, useEffect } from 'react'

/**
 * Hook for hydration-safe time rendering
 * Prevents SSR/client mismatches in time-sensitive components
 * 
 * @returns {Object} - { isHydrated: boolean, currentTime: Date | null }
 */
export function useHydrationSafeTime() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  
  useEffect(() => {
    setCurrentTime(new Date())
    setIsHydrated(true)
  }, [])
  
  return { isHydrated, currentTime }
}

/**
 * Hook for hydration-safe time formatting
 * Provides consistent server/client rendering for time-sensitive content
 * 
 * @param date - The date to format
 * @param dynamicFormatter - Function to format date when hydrated
 * @param staticFallback - Static string to show before hydration
 * @returns {string} - Formatted time string
 */
export function useHydrationSafeTimeFormat(
  date: Date | string | number,
  dynamicFormatter: (date: Date) => string,
  staticFallback: string
): string {
  const { isHydrated } = useHydrationSafeTime()
  
  if (!isHydrated) {
    return staticFallback
  }
  
  try {
    const dateObj = new Date(date)
    return dynamicFormatter(dateObj)
  } catch {
    return staticFallback
  }
}