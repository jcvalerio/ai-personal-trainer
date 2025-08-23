import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import {
  ServiceWorkerProvider,
  ServiceWorkerUpdatePrompt,
} from '@/components/providers/service-worker-provider';
import { OfflineIndicator } from '@/components/ui/offline-indicator';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  colorScheme: 'light dark',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'AI Personal Trainer',
    template: '%s | AI Personal Trainer',
  },
  description:
    'AI-powered personal trainer PWA for families and gyms. Create personalized workout plans, track progress, and achieve your fitness goals.',
  keywords: [
    'fitness',
    'personal trainer',
    'AI',
    'workout',
    'exercise',
    'gym',
    'health',
    'PWA',
  ],
  authors: [{ name: 'AI Personal Trainer Team' }],
  creator: 'AI Personal Trainer',
  publisher: 'AI Personal Trainer',

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-personal-trainer.vercel.app',
    siteName: 'AI Personal Trainer',
    title: 'AI Personal Trainer - Your Personal Fitness Coach',
    description:
      'Transform your fitness journey with AI-powered workout plans, progress tracking, and personalized coaching.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Personal Trainer - Fitness Made Personal',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'AI Personal Trainer - Your Personal Fitness Coach',
    description:
      'Transform your fitness journey with AI-powered workout plans, progress tracking, and personalized coaching.',
    images: ['/twitter-image.jpg'],
    creator: '@ai_trainer_app',
  },

  // PWA metadata (will be enhanced in Phase 2)
  manifest: '/manifest.json',

  // Icons
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#3b82f6',
      },
    ],
  },

  // Additional metadata
  category: 'Health & Fitness',
  classification: 'Business',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add when needed)
  // verification: {
  //   google: 'verification-code',
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Handle missing environment variables during build
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If no Clerk key is provided, render without ClerkProvider (for build-time)
  if (!clerkPublishableKey) {
    return (
      <html lang='en' className={inter.variable} suppressHydrationWarning>
        <body className='bg-background min-h-screen font-sans antialiased'>
          <div className='flex min-h-screen flex-col'>
            <div className='p-8 text-center'>
              <p className='text-gray-600'>Authentication not configured</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={{
        baseTheme: undefined, // Will be customized in sign-in/sign-up pages
        variables: {
          colorPrimary: '#3b82f6', // Blue-500 for primary actions
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary:
            'bg-blue-600 hover:bg-blue-700 text-sm font-medium',
          card: 'shadow-xl border-0',
          headerTitle: 'text-xl font-semibold text-gray-900',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButton: 'border-gray-200 hover:bg-gray-50',
          formFieldInput:
            'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          footerActionLink: 'text-blue-600 hover:text-blue-700',
        },
      }}
    >
      <html lang='en' className={inter.variable}>
        <body className={`${inter.className} antialiased`}>
          <ServiceWorkerProvider enableDevelopment={false}>
            <div className='min-h-dvh min-h-screen bg-gray-50'>
              {/* Skip to main content for accessibility */}
              <a
                href='#main-content'
                className='sr-only z-50 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4'
              >
                Skip to main content
              </a>

              {/* Main application content */}
              <main id='main-content' className='relative'>
                {children}
              </main>

              {/* Offline capabilities */}
              <OfflineIndicator position='floating' />
              <ServiceWorkerUpdatePrompt />
            </div>
          </ServiceWorkerProvider>

          {/* Development tools - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className='fixed bottom-4 right-4 z-50'>
              <div className='rounded bg-black/80 px-2 py-1 text-xs text-white'>
                <span className='block sm:hidden'>XS</span>
                <span className='hidden sm:block md:hidden'>SM</span>
                <span className='hidden md:block lg:hidden'>MD</span>
                <span className='hidden lg:block xl:hidden'>LG</span>
                <span className='hidden xl:block 2xl:hidden'>XL</span>
                <span className='hidden 2xl:block'>2XL</span>
              </div>
            </div>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
