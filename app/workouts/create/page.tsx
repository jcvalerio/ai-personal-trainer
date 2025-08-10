'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Redirect route for /workouts/create -> /workouts/generate
 * Maintains consistency with existing workout creation flow
 */
export default function CreateWorkoutRedirect() {
  useEffect(() => {
    redirect('/workouts/generate')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p className="mt-2 text-gray-600">Redirecting to workout generator...</p>
      </div>
    </div>
  )
}