/**
 * Offline Status Hook
 * Provides real-time offline/online status detection and management
 */
'use client'

import { useState, useEffect, useCallback } from 'react'

export interface OfflineStatus {
  isOffline: boolean
  isOnline: boolean
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
}

export interface OfflineStatusHook extends OfflineStatus {
  // Actions
  forceOfflineMode: () => void
  exitOfflineMode: () => void
  
  // State
  isForceOffline: boolean
  lastOnlineTime: Date | null
  lastOfflineTime: Date | null
  
  // Network quality indicators
  isSlowConnection: boolean
  isUnstableConnection: boolean
}

/**
 * Hook to manage offline/online status with enhanced network detection
 */
export function useOfflineStatus(): OfflineStatusHook {
  const [isOffline, setIsOffline] = useState(false)
  const [isForceOffline, setIsForceOffline] = useState(false)
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null)
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<{
    type?: string
    effectiveType?: string
    downlink?: number
    rtt?: number
  }>({})

  // Initialize online status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine)
      
      if (navigator.onLine) {
        setLastOnlineTime(new Date())
      } else {
        setLastOfflineTime(new Date())
      }
    }
  }, [])

  // Update connection info
  const updateConnectionInfo = useCallback(() => {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        setConnectionInfo({
          type: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        })
      }
    }
  }, [])

  // Handle online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') {return}

    const handleOnline = () => {
      console.log('Network: Connection restored')
      if (!isForceOffline) {
        setIsOffline(false)
        setLastOnlineTime(new Date())
        updateConnectionInfo()
        
        // Trigger background sync if service worker is available
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          navigator.serviceWorker.ready.then(registration => {
            return (registration as any).sync.register('workout-sync')
          }).catch(error => {
            console.warn('Background sync registration failed:', error)
          })
        }
        
        // Notify service worker about connection change
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.controller?.postMessage({
            type: 'CONNECTION_CHANGE',
            payload: { isOnline: true }
          })
        }
      }
    }

    const handleOffline = () => {
      console.log('Network: Connection lost')
      setIsOffline(true)
      setLastOfflineTime(new Date())
      
      // Notify service worker about connection change
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CONNECTION_CHANGE',
          payload: { isOnline: false }
        })
      }
    }

    const handleConnectionChange = () => {
      updateConnectionInfo()
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        connection.addEventListener('change', handleConnectionChange)
      }
    }

    // Initial connection info update
    updateConnectionInfo()

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        if (connection) {
          connection.removeEventListener('change', handleConnectionChange)
        }
      }
    }
  }, [isForceOffline, updateConnectionInfo])

  // Periodic connectivity check
  useEffect(() => {
    if (typeof window === 'undefined') {return}

    const checkConnectivity = async () => {
      if (isForceOffline) {return}

      try {
        // Try to fetch a small resource to test actual connectivity
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache'
        })
        
        if (response.ok && isOffline) {
          // We're actually online but state says offline
          setIsOffline(false)
          setLastOnlineTime(new Date())
          updateConnectionInfo()
        }
      } catch (error) {
        if (!isOffline) {
          // We're actually offline but state says online
          setIsOffline(true)
          setLastOfflineTime(new Date())
        }
      }
    }

    // Check connectivity every 30 seconds
    const interval = setInterval(checkConnectivity, 30000)

    return () => clearInterval(interval)
  }, [isOffline, isForceOffline, updateConnectionInfo])

  // Actions
  const forceOfflineMode = useCallback(() => {
    console.log('Offline: Forcing offline mode')
    setIsForceOffline(true)
    setIsOffline(true)
    setLastOfflineTime(new Date())
  }, [])

  const exitOfflineMode = useCallback(() => {
    console.log('Offline: Exiting forced offline mode')
    setIsForceOffline(false)
    
    // Check actual network status
    if (typeof window !== 'undefined' && navigator.onLine) {
      setIsOffline(false)
      setLastOnlineTime(new Date())
      updateConnectionInfo()
    }
  }, [updateConnectionInfo])

  // Calculate network quality indicators
  const isSlowConnection = connectionInfo.effectiveType === 'slow-2g' || 
                         connectionInfo.effectiveType === '2g' ||
                         (connectionInfo.downlink !== undefined && connectionInfo.downlink < 0.5)

  const isUnstableConnection = connectionInfo.rtt !== undefined && connectionInfo.rtt > 2000

  return {
    // Status
    isOffline: isOffline || isForceOffline,
    isOnline: !isOffline && !isForceOffline,
    connectionType: connectionInfo.type,
    effectiveType: connectionInfo.effectiveType,
    downlink: connectionInfo.downlink,
    rtt: connectionInfo.rtt,
    
    // Actions
    forceOfflineMode,
    exitOfflineMode,
    
    // State
    isForceOffline,
    lastOnlineTime,
    lastOfflineTime,
    
    // Network quality
    isSlowConnection,
    isUnstableConnection
  }
}

/**
 * Simplified hook for basic offline status
 */
export function useIsOffline(): boolean {
  const { isOffline } = useOfflineStatus()
  return isOffline
}

/**
 * Hook to handle offline-first operations
 */
export function useOfflineFirst() {
  const offlineStatus = useOfflineStatus()
  
  // Queue for offline operations
  const [operationQueue, setOperationQueue] = useState<{
    id: string
    type: string
    data: any
    timestamp: number
  }[]>([])

  // Add operation to queue when offline
  const queueOperation = useCallback((type: string, data: any) => {
    const operation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now()
    }
    
    setOperationQueue(prev => [...prev, operation])
    console.log('Offline: Queued operation:', operation.id, type)
    
    return operation.id
  }, [])

  // Process queue when coming back online
  useEffect(() => {
    if (offlineStatus.isOnline && operationQueue.length > 0) {
      console.log(`Offline: Processing ${operationQueue.length} queued operations`)
      
      // Process operations in order
      operationQueue.forEach(operation => {
        // This would trigger API calls or other sync operations
        console.log('Offline: Processing queued operation:', operation.id)
        // TODO: Implement actual operation processing
      })
      
      // Clear the queue
      setOperationQueue([])
    }
  }, [offlineStatus.isOnline, operationQueue])

  return {
    ...offlineStatus,
    queueOperation,
    queuedOperations: operationQueue.length
  }
}