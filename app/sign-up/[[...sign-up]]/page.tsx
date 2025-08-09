/**
 * Custom Sign-Up Page
 * Provides branded registration experience with fitness goals integration
 */

import { SignUp } from '@clerk/nextjs'
import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowLeft, Target, TrendingUp, Heart, Users2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign Up | AI Personal Trainer',
  description: 'Create your AI Personal Trainer account and start your personalized fitness journey today.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="flex min-h-screen">
        {/* Left Side - Sign Up Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden mb-8 text-center">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors"
                aria-label="AI Personal Trainer - Go to homepage"
              >
                <Dumbbell className="w-5 h-5 text-blue-600" />
                AI Personal Trainer
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Start your journey</h1>
              <p className="text-gray-600">Create your account and get personalized workout plans</p>
            </div>

            {/* Sign Up Component */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 lg:p-8">
                <SignUp
                  appearance={{
                    elements: {
                      rootBox: 'w-full',
                      card: 'shadow-none border-0 bg-transparent',
                      headerTitle: 'hidden', // We have our own header
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton: 'border-gray-200 hover:bg-gray-50 text-gray-700 font-medium h-12',
                      socialButtonsBlockButtonText: 'font-medium',
                      dividerLine: 'bg-gray-200',
                      dividerText: 'text-gray-500 text-sm',
                      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium',
                      formFieldInput: 'h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                      formFieldLabel: 'text-gray-700 font-medium',
                      footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium',
                      identityPreviewText: 'text-gray-700',
                      identityPreviewEditButton: 'text-blue-600 hover:text-blue-700',
                      formHeaderTitle: 'text-xl font-bold text-gray-900 mb-2',
                      formHeaderSubtitle: 'text-gray-600',
                    },
                    variables: {
                      colorPrimary: '#3b82f6',
                      colorBackground: 'transparent',
                      colorInputBackground: '#ffffff',
                      colorInputText: '#1f2937',
                      borderRadius: '0.5rem',
                      spacingUnit: '1rem',
                    },
                  }}
                  redirectUrl="/onboarding"
                />
              </div>

              {/* Additional Links */}
              <div className="px-6 lg:px-8 pb-6 lg:pb-8 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link 
                      href="/sign-in" 
                      className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 group"
                    >
                      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                      Sign in instead
                    </Link>
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-gray-700">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="underline hover:text-gray-700">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">What happens next?</h3>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                  <span>Complete your fitness profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                  <span>Set your fitness goals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</div>
                  <span>Get your first AI-generated workout plan</span>
                </div>
              </div>
            </div>

            {/* Help Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need help?{' '}
                <Link 
                  href="/support" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Benefits & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-blue-700 p-12 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="white"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col justify-between w-full max-w-md ml-auto">
            {/* Header */}
            <div>
              <div className="mb-12">
                <Link 
                  href="/" 
                  className="inline-flex items-center gap-3 text-2xl font-bold hover:opacity-80 transition-opacity group"
                  aria-label="AI Personal Trainer - Go to homepage"
                >
                  <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  AI Personal Trainer
                </Link>
              </div>

              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold leading-tight mb-4">
                    Transform your fitness
                    <span className="block text-yellow-300">with AI guidance</span>
                  </h1>
                  <p className="text-purple-100 text-lg leading-relaxed">
                    Join thousands who have achieved their fitness goals with personalized AI-powered workout plans and progress tracking.
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group">
                    <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                      <Target className="w-5 h-5 text-green-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Personalized Plans</h3>
                      <p className="text-purple-100 text-sm">AI creates workouts tailored to your goals, fitness level, and available equipment</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                      <TrendingUp className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Track Progress</h3>
                      <p className="text-purple-100 text-sm">Monitor your improvements with detailed analytics and achievement milestones</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                      <Users2 className="w-5 h-5 text-pink-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Family & Community</h3>
                      <p className="text-purple-100 text-sm">Share your journey with family members or connect with gym communities</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                      <Heart className="w-5 h-5 text-red-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Adaptive Learning</h3>
                      <p className="text-purple-100 text-sm">Your AI trainer learns from your feedback and adjusts plans for better results</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-300">10K+</div>
                      <div className="text-sm text-purple-100">Active users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-300">85%</div>
                      <div className="text-sm text-purple-100">Goal achievement</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Quote */}
            <div className="border-l-4 border-yellow-300 pl-4">
              <p className="italic text-purple-100 mb-2">
                "Success is the sum of small efforts, repeated day in and day out."
              </p>
              <p className="text-sm text-purple-200">— Robert Collier</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}