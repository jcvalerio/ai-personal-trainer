'use client';

import { Button } from '@/components/ui/button';
import { Home, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
            <Search className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/en/dashboard">
            <Button className="w-full" size="lg">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-8">
          <p className="text-sm text-gray-600 mb-4">
            Looking for something specific?
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link
              href="/en/workouts"
              className="text-blue-600 hover:underline"
            >
              My Workouts
            </Link>
            <Link
              href="/en/progress"
              className="text-blue-600 hover:underline"
            >
              Progress Tracking
            </Link>
            <Link
              href="/en/exercises"
              className="text-blue-600 hover:underline"
            >
              Exercise Library
            </Link>
            <Link
              href="/en/organizations"
              className="text-blue-600 hover:underline"
            >
              Community
            </Link>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-6">
          <p className="text-xs text-gray-500">
            Still need help?{' '}
            <a 
              href="https://github.com/anthropics/claude-code/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
