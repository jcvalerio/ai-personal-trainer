/**
 * Custom Sign-In Page
 * Provides branded sign-in experience with social login options
 */

import { SignIn } from '@clerk/nextjs'
import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowRight, Shield, Users, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign In | AI Personal Trainer',
  description: 'Sign in to your AI Personal Trainer account and continue your fitness journey.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col justify-between w-full max-w-md">
            {/* Header */}
            <div>
              <Link 
                href="/" 
                className="inline-flex items-center gap-3 text-2xl font-bold mb-16 hover:opacity-80 transition-opacity group"
                aria-label="AI Personal Trainer - Go to homepage"
              >
                <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                  <Dumbbell className="w-6 h-6" />
                </div>
                AI Personal Trainer
              </Link>

              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold leading-tight mb-4">
                    Welcome back to your
                    <span className="block text-yellow-300">fitness journey</span>
                  </h1>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    Continue your personalized workout plans, track your progress, and achieve your fitness goals with AI-powered guidance.
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group">
                    <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                      <Zap className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">AI-Powered Workouts</h3>
                      <p className="text-blue-100 text-sm">Personalized plans that adapt to your progress and preferences</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                      <Users className="w-5 h-5 text-green-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Family & Gym Support</h3>
                      <p className="text-blue-100 text-sm">Train together with family members or connect with your gym community</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                      <Shield className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Secure & Private</h3>
                      <p className="text-blue-100 text-sm">Your data is protected with enterprise-grade security</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Quote */}
            <div className="border-l-4 border-yellow-300 pl-4">
              <p className="italic text-blue-100 mb-2">
                "The best project you'll ever work on is you."
              </p>
              <p className="text-sm text-blue-200">— Anonymous</p>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
              <p className="text-gray-600">Sign in to continue your fitness journey</p>
            </div>

            {/* Sign In Component */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 lg:p-8">
                <SignIn
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
                  redirectUrl="/dashboard"
                />
              </div>

              {/* Additional Links */}
              <div className="px-6 lg:px-8 pb-6 lg:pb-8 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link 
                      href="/sign-up" 
                      className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 group"
                    >
                      Sign up for free
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    By signing in, you agree to our{' '}
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
      </div>
    </div>
  )
}