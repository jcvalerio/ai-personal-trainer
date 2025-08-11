/**
 * Offline Storage Service
 * Manages local storage of workout data using IndexedDB for offline capability
 */

import { SessionExecution, LiveSet } from '@/types/session-execution'
import { WorkoutPlan } from '@/types/workouts'

export interface OfflineWorkoutData {
  id: string
  sessionId: string
  workoutData: SessionExecution
  timestamp: number
  synced: boolean
  version: number
}

export interface OfflineWorkoutPlan {
  id: string
  planData: WorkoutPlan
  timestamp: number
  synced: boolean
  version: number
}

export interface OfflineExerciseData {
  id: string
  exerciseId: string
  sets: LiveSet[]
  timestamp: number
  sessionId: string
}

class OfflineStorageService {
  private dbName = 'AITrainerOfflineDB'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  // Store names
  private stores = {
    workouts: 'workouts',
    plans: 'workout_plans', 
    exercises: 'exercises',
    settings: 'settings',
    sync_queue: 'sync_queue'
  } as const

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        // SSR safety
        resolve()
        return
      }

      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(new Error('Failed to initialize offline storage'))
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('Offline storage initialized successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create workouts store
        if (!db.objectStoreNames.contains(this.stores.workouts)) {
          const workoutsStore = db.createObjectStore(this.stores.workouts, { keyPath: 'id' })
          workoutsStore.createIndex('sessionId', 'sessionId', { unique: false })
          workoutsStore.createIndex('timestamp', 'timestamp', { unique: false })
          workoutsStore.createIndex('synced', 'synced', { unique: false })
        }

        // Create workout plans store
        if (!db.objectStoreNames.contains(this.stores.plans)) {
          const plansStore = db.createObjectStore(this.stores.plans, { keyPath: 'id' })
          plansStore.createIndex('timestamp', 'timestamp', { unique: false })
          plansStore.createIndex('synced', 'synced', { unique: false })
        }

        // Create exercises store
        if (!db.objectStoreNames.contains(this.stores.exercises)) {
          const exercisesStore = db.createObjectStore(this.stores.exercises, { keyPath: 'id' })
          exercisesStore.createIndex('sessionId', 'sessionId', { unique: false })
          exercisesStore.createIndex('exerciseId', 'exerciseId', { unique: false })
          exercisesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Create settings store
        if (!db.objectStoreNames.contains(this.stores.settings)) {
          db.createObjectStore(this.stores.settings, { keyPath: 'key' })
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(this.stores.sync_queue)) {
          const syncStore = db.createObjectStore(this.stores.sync_queue, { keyPath: 'id' })
          syncStore.createIndex('type', 'type', { unique: false })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        console.log('IndexedDB schema updated')
      }
    })
  }

  /**
   * Save workout session data for offline use
   */
  async saveWorkoutData(sessionData: SessionExecution): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const workoutData: OfflineWorkoutData = {
      id: `workout_${sessionData.sessionId}_${Date.now()}`,
      sessionId: sessionData.sessionId,
      workoutData: {
        ...sessionData,
        // Convert dates to ISO strings for storage
        startTime: sessionData.startTime?.toISOString() as any,
        endTime: sessionData.endTime?.toISOString() as any,
      },
      timestamp: Date.now(),
      synced: false,
      version: 1
    }

    return this.putData(this.stores.workouts, workoutData)
  }

  /**
   * Get workout data by session ID
   */
  async getWorkoutData(sessionId: string): Promise<OfflineWorkoutData | null> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.workouts], 'readonly')
      const store = transaction.objectStore(this.stores.workouts)
      const index = store.index('sessionId')
      const request = index.get(sessionId)

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          // Convert date strings back to Date objects
          result.workoutData.startTime = result.workoutData.startTime 
            ? new Date(result.workoutData.startTime) 
            : null
          result.workoutData.endTime = result.workoutData.endTime 
            ? new Date(result.workoutData.endTime) 
            : null
        }
        resolve(result || null)
      }

      request.onerror = () => {
        console.error('Failed to get workout data:', request.error)
        reject(new Error('Failed to retrieve workout data'))
      }
    })
  }

  /**
   * Get all unsynced workout data
   */
  async getAllUnsyncedWorkouts(): Promise<OfflineWorkoutData[]> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.workouts], 'readonly')
      const store = transaction.objectStore(this.stores.workouts)
      const index = store.index('synced')
      const request = index.getAll(false)

      request.onsuccess = () => {
        const results = request.result.map(item => {
          // Convert date strings back to Date objects
          if (item.workoutData.startTime) {
            item.workoutData.startTime = new Date(item.workoutData.startTime)
          }
          if (item.workoutData.endTime) {
            item.workoutData.endTime = new Date(item.workoutData.endTime)
          }
          return item
        })
        resolve(results)
      }

      request.onerror = () => {
        console.error('Failed to get unsynced workouts:', request.error)
        reject(new Error('Failed to retrieve unsynced workouts'))
      }
    })
  }

  /**
   * Mark workout as synced
   */
  async markWorkoutSynced(id: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.workouts], 'readwrite')
      const store = transaction.objectStore(this.stores.workouts)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const workoutData = getRequest.result
        if (workoutData) {
          workoutData.synced = true
          workoutData.timestamp = Date.now()
          
          const putRequest = store.put(workoutData)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => {
            console.error('Failed to mark workout as synced:', putRequest.error)
            reject(new Error('Failed to update workout sync status'))
          }
        } else {
          resolve() // Already doesn't exist, consider it "synced"
        }
      }

      getRequest.onerror = () => {
        console.error('Failed to get workout for sync update:', getRequest.error)
        reject(new Error('Failed to retrieve workout for sync update'))
      }
    })
  }

  /**
   * Save workout plan for offline use
   */
  async saveWorkoutPlan(planData: WorkoutPlan): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const offlinePlan: OfflineWorkoutPlan = {
      id: `plan_${planData.id}_${Date.now()}`,
      planData,
      timestamp: Date.now(),
      synced: false,
      version: 1
    }

    return this.putData(this.stores.plans, offlinePlan)
  }

  /**
   * Get all workout plans
   */
  async getAllWorkoutPlans(): Promise<OfflineWorkoutPlan[]> {
    if (!this.db) {
      await this.initialize()
    }

    return this.getAllData(this.stores.plans)
  }

  /**
   * Save exercise data
   */
  async saveExerciseData(exerciseData: OfflineExerciseData): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    return this.putData(this.stores.exercises, exerciseData)
  }

  /**
   * Get exercise data for a session
   */
  async getExerciseDataForSession(sessionId: string): Promise<OfflineExerciseData[]> {
    if (!this.db) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.exercises], 'readonly')
      const store = transaction.objectStore(this.stores.exercises)
      const index = store.index('sessionId')
      const request = index.getAll(sessionId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        console.error('Failed to get exercise data:', request.error)
        reject(new Error('Failed to retrieve exercise data'))
      }
    })
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(type: string, data: any): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const queueItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    }

    return this.putData(this.stores.sync_queue, queueItem)
  }

  /**
   * Get all items from sync queue
   */
  async getSyncQueue(): Promise<any[]> {
    if (!this.db) {
      await this.initialize()
    }

    return this.getAllData(this.stores.sync_queue)
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    return this.deleteData(this.stores.sync_queue, id)
  }

  /**
   * Save app settings
   */
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    return this.putData(this.stores.settings, { key, value, timestamp: Date.now() })
  }

  /**
   * Get app setting
   */
  async getSetting(key: string): Promise<any> {
    if (!this.db) {
      await this.initialize()
    }

    const setting = await this.getData(this.stores.settings, key)
    return setting?.value || null
  }

  /**
   * Clear all offline data (for testing/cleanup)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const storeNames = Object.values(this.stores)
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeNames, 'readwrite')
      
      let completed = 0
      const total = storeNames.length

      storeNames.forEach(storeName => {
        const store = transaction.objectStore(storeName)
        const request = store.clear()
        
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            console.log('All offline data cleared')
            resolve()
          }
        }
        
        request.onerror = () => {
          console.error('Failed to clear store:', storeName, request.error)
          reject(new Error('Failed to clear offline data'))
        }
      })
    })
  }

  /**
   * Get database size and statistics
   */
  async getStorageStats(): Promise<{
    workouts: number
    plans: number
    exercises: number
    unsyncedWorkouts: number
    queueSize: number
  }> {
    if (!this.db) {
      await this.initialize()
    }

    const [workouts, plans, exercises, unsyncedWorkouts, queueSize] = await Promise.all([
      this.getCount(this.stores.workouts),
      this.getCount(this.stores.plans),
      this.getCount(this.stores.exercises),
      this.getCountByIndex(this.stores.workouts, 'synced', false),
      this.getCount(this.stores.sync_queue)
    ])

    return {
      workouts,
      plans,
      exercises,
      unsyncedWorkouts,
      queueSize
    }
  }

  // Private helper methods

  private async putData(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.error('Failed to save data to store:', storeName, request.error)
        reject(new Error(`Failed to save data to ${storeName}`))
      }
    })
  }

  private async getData(storeName: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        console.error('Failed to get data from store:', storeName, request.error)
        reject(new Error(`Failed to get data from ${storeName}`))
      }
    })
  }

  private async getAllData(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        console.error('Failed to get all data from store:', storeName, request.error)
        reject(new Error(`Failed to get all data from ${storeName}`))
      }
    })
  }

  private async deleteData(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.error('Failed to delete data from store:', storeName, request.error)
        reject(new Error(`Failed to delete data from ${storeName}`))
      }
    })
  }

  private async getCount(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        console.error('Failed to get count from store:', storeName, request.error)
        reject(new Error(`Failed to get count from ${storeName}`))
      }
    })
  }

  private async getCountByIndex(storeName: string, indexName: string, value: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.count(value)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        console.error('Failed to get count by index:', storeName, indexName, request.error)
        reject(new Error(`Failed to get count by index from ${storeName}`))
      }
    })
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService()