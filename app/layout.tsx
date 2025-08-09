import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

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
}

export const metadata: Metadata = {
  title: {
    default: 'AI Personal Trainer',
    template: '%s | AI Personal Trainer',
  },
  description: 'AI-powered personal trainer PWA for families and gyms. Create personalized workout plans, track progress, and achieve your fitness goals.',
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
    description: 'Transform your fitness journey with AI-powered workout plans, progress tracking, and personalized coaching.',
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
    description: 'Transform your fitness journey with AI-powered workout plans, progress tracking, and personalized coaching.',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <div className='min-h-screen min-h-dvh bg-gray-50'>
          {/* Skip to main content for accessibility */}
          <a
            href='#main-content'
            className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary-500 text-white px-4 py-2 rounded-lg'
          >
            Skip to main content
          </a>
          
          {/* Main application content */}
          <main id='main-content' className='relative'>
            {children}
          </main>
        </div>
        
        {/* Development tools - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className='fixed bottom-4 right-4 z-50'>
            <div className='bg-black/80 text-white text-xs px-2 py-1 rounded'>
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
  )
}