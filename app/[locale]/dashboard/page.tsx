/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */
'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Dumbbell, Users, Target, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Dumbbell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Personal Trainer</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/workouts" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Workouts
                </Link>
                <Link 
                  href="/progress" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Progress
                </Link>
                <Link 
                  href="/organizations" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Community
                </Link>
              </nav>
              
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  }
                }}
                showName={false}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-600">Ready to continue your fitness journey?</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Workouts This Week</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">0 days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Dumbbell className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Workouts</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Community</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Start Workout */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/workouts/new"
                className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:bg-blue-700 transition-colors">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Start New Workout</p>
                    <p className="text-sm text-gray-600">Get an AI-generated workout plan</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/progress"
                className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 text-white rounded-lg group-hover:bg-green-700 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Track Progress</p>
                    <p className="text-sm text-gray-600">Log measurements and view analytics</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/organizations"
                className="flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 text-white rounded-lg group-hover:bg-purple-700 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Join Community</p>
                    <p className="text-sm text-gray-600">Connect with family or gym members</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No activity yet</p>
              <p className="text-sm text-gray-500">Start your first workout to see your progress here!</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-700">AI Workout Generation</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Progress Analytics</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Social Features</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}