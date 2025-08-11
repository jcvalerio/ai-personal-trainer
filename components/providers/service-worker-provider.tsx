/**
 * Service Worker Provider
 * Handles service worker registration and communication
 */
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ServiceWorkerContextType {
  isSupported: boolean
  isRegistered: boolean
  isUpdateAvailable: boolean
  registration: ServiceWorkerRegistration | null
  
  // Actions
  updateServiceWorker: () => void
  unregisterServiceWorker: () => Promise<boolean>
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType | undefined>(undefined)

interface ServiceWorkerProviderProps {
  children: React.ReactNode
  swUrl?: string
  enableDevelopment?: boolean
}

export function ServiceWorkerProvider({ 
  children, 
  swUrl = '/sw.js',
  enableDevelopment = false 
}: ServiceWorkerProviderProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Check service worker support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'serviceWorker' in navigator
      setIsSupported(supported)
      
      if (supported) {
        console.log('SW: Service Worker supported')
      } else {
        console.warn('SW: Service Worker not supported')
      }
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if (!isSupported) {return}

    // Only register in production or if explicitly enabled in development
    const isProduction = process.env.NODE_ENV === 'production'
    if (!isProduction && !enableDevelopment) {
      console.log('SW: Skipping registration in development')
      return
    }

    const registerServiceWorker = async () => {
      try {
        console.log('SW: Registering service worker...')
        
        const reg = await navigator.serviceWorker.register(swUrl, {
          scope: '/',
          updateViaCache: 'none'
        })

        setRegistration(reg)
        setIsRegistered(true)
        console.log('SW: Service worker registered successfully')

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          console.log('SW: Update found')
          const newWorker = reg.installing
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('SW: New version available')
                setIsUpdateAvailable(true)
              }
            })
          }
        })

        // Check for existing controller
        if (reg.active && !navigator.serviceWorker.controller) {
          window.location.reload()
        }

      } catch (error) {
        console.error('SW: Registration failed:', error)
        setIsRegistered(false)
      }
    }

    registerServiceWorker()
  }, [isSupported, swUrl, enableDevelopment])

  // Listen for service worker messages
  useEffect(() => {
    if (!isSupported) {return}

    const handleMessage = (event: MessageEvent) => {
      console.log('SW: Received message:', event.data)
      
      if (event.data?.type) {
        switch (event.data.type) {
          case 'SW_UPDATE_READY':
            setIsUpdateAvailable(true)
            break
          case 'SW_CACHE_UPDATED':
            console.log('SW: Cache updated')
            break
          case 'OFFLINE_STATUS':
            console.log('SW: Offline status:', event.data.payload)
            break
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [isSupported])

  // Listen for controller change (new SW activated)
  useEffect(() => {
    if (!isSupported) {return}

    const handleControllerChange = () => {
      console.log('SW: Controller changed, reloading...')
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [isSupported])

  // Actions
  const updateServiceWorker = () => {
    if (registration?.waiting) {
      console.log('SW: Activating new service worker...')
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  const unregisterServiceWorker = async (): Promise<boolean> => {
    if (registration) {
      try {
        const unregistered = await registration.unregister()
        if (unregistered) {
          console.log('SW: Service worker unregistered')
          setIsRegistered(false)
          setRegistration(null)
          return true
        }
      } catch (error) {
        console.error('SW: Unregistration failed:', error)
      }
    }
    return false
  }

  const contextValue: ServiceWorkerContextType = {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    registration,
    updateServiceWorker,
    unregisterServiceWorker
  }

  return (
    <ServiceWorkerContext.Provider value={contextValue}>
      {children}
    </ServiceWorkerContext.Provider>
  )
}

// Custom hook to use service worker context
export function useServiceWorker() {
  const context = useContext(ServiceWorkerContext)
  if (!context) {
    throw new Error('useServiceWorker must be used within a ServiceWorkerProvider')
  }
  return context
}

// Hook for service worker communication
export function useServiceWorkerMessaging() {
  const { registration } = useServiceWorker()

  const sendMessage = (message: any) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message)
    } else {
      console.warn('SW: No service worker controller available')
    }
  }

  const requestSync = (tag: string) => {
    if (registration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      return (registration as any).sync.register(tag)
    } else {
      console.warn('SW: Background Sync not supported')
      return Promise.reject(new Error('Background Sync not supported'))
    }
  }

  return {
    sendMessage,
    requestSync,
    canSync: registration && 'sync' in window.ServiceWorkerRegistration.prototype
  }
}

// Component to show update prompt
export function ServiceWorkerUpdatePrompt() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker()
  const [isDismissed, setIsDismissed] = useState(false)

  if (!isUpdateAvailable || isDismissed) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-medium text-sm">App Update Available</h3>
          <p className="text-xs opacity-90 mt-1">
            A new version of the app is ready. Refresh to get the latest features and improvements.
          </p>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-white/80 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={updateServiceWorker}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
        >
          Update Now
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="px-3 py-1 text-white/80 hover:text-white text-xs transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  )
}