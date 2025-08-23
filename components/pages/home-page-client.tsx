'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { CTASection } from '@/components/sections/cta-section';
import { FeaturesSection } from '@/components/sections/features-section';
import { HeroSection } from '@/components/sections/hero-section';
import { AuthenticatedNav } from '@/components/navigation/authenticated-nav';
import LanguageSelector from '@/components/ui/language-selector';

interface HomePageClientProps {
  locale: string;
}

export default function HomePageClient({ locale }: HomePageClientProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const t = useTranslations();

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && user) {
      // Give users a moment to see the personalized landing, then redirect
      const timer = setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 2000);
      return () => clearTimeout(timer);
    }
    return; // Explicit return for when the condition is not met
  }, [isLoaded, user, router, locale]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white'>
        <div className='text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500'></div>
          <p className='mt-2 text-gray-600'>{t('loading.text')}</p>
        </div>
      </div>
    );
  }
  return (
    <div className='flex flex-col'>
      {/* Navigation Bar */}
      <nav className='sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm'>
        <div className='container-safe'>
          <div className='flex h-16 items-center justify-between'>
            {/* Logo */}
            <div className='flex items-center space-x-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500'>
                <span className='text-sm font-bold text-white'>AI</span>
              </div>
              <span className='text-lg font-semibold text-gray-900'>
                {t('nav.brand')}
              </span>
            </div>

            {/* Navigation Links */}
            {user ? (
              <div className='flex items-center space-x-4'>
                <AuthenticatedNav user={user} />
                <LanguageSelector currentLocale={locale} className='ml-4' />
              </div>
            ) : (
              <div className='hidden items-center space-x-6 sm:flex'>
                <Link
                  href='#features'
                  className='text-gray-600 transition-colors hover:text-gray-900'
                >
                  {t('nav.features')}
                </Link>
                <Link
                  href='#pricing'
                  className='text-gray-600 transition-colors hover:text-gray-900'
                >
                  {t('nav.forGyms')}
                </Link>
                <Link
                  href='/sign-in'
                  className='text-gray-600 transition-colors hover:text-gray-900'
                >
                  {t('nav.signIn')}
                </Link>
                <Link href='/sign-up' className='btn-primary'>
                  {t('nav.getStarted')}
                </Link>
                <LanguageSelector currentLocale={locale} className='ml-4' />
              </div>
            )}

            {/* Mobile menu button */}
            <div className='flex items-center space-x-2 sm:hidden'>
              <LanguageSelector currentLocale={locale} />
              <button
                className='touch-target'
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label={t('nav.toggleMenu')}
              >
                <span className='sr-only'>{t('nav.openMenu')}</span>
                <svg
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d={
                      showMobileMenu
                        ? 'M6 18L18 6M6 6l12 12'
                        : 'M4 6h16M4 12h16M4 18h16'
                    }
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {showMobileMenu && (
            <div className='border-t border-gray-200 bg-white sm:hidden'>
              <div className='space-y-3 px-4 py-3'>
                {user ? (
                  <>
                    <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary-500'>
                        <span className='text-sm font-semibold text-white'>
                          {user.firstName?.[0] ||
                            user.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {user.firstName || 'User'}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {user.emailAddresses[0]?.emailAddress}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/${locale}/dashboard`}
                      className='block w-full rounded-lg bg-primary-500 px-4 py-3 text-left font-medium text-white transition-colors hover:bg-primary-600'
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <Link
                      href={`/${locale}/workouts`}
                      className='block py-2 text-gray-700 transition-colors hover:text-gray-900'
                    >
                      {t('nav.myWorkouts')}
                    </Link>
                    <Link
                      href={`/${locale}/progress`}
                      className='block py-2 text-gray-700 transition-colors hover:text-gray-900'
                    >
                      {t('nav.progress')}
                    </Link>
                    <Link
                      href={`/${locale}/exercises`}
                      className='block py-2 text-gray-700 transition-colors hover:text-gray-900'
                    >
                      {t('nav.exercises')}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href='#features'
                      className='block py-2 text-gray-700 transition-colors hover:text-gray-900'
                    >
                      {t('nav.features')}
                    </Link>
                    <Link
                      href='#pricing'
                      className='block py-2 text-gray-700 transition-colors hover:text-gray-900'
                    >
                      {t('nav.forGyms')}
                    </Link>
                    <Link
                      href='/sign-in'
                      className='block py-2 text-gray-700 transition-colors hover:text-gray-900'
                    >
                      {t('nav.signIn')}
                    </Link>
                    <Link
                      href='/sign-up'
                      className='block w-full rounded-lg bg-primary-500 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-primary-600'
                    >
                      {t('nav.getStarted')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Show personalized welcome for authenticated users */}
      {user && (
        <div className='border-b border-green-200 bg-gradient-to-r from-green-50 to-blue-50'>
          <div className='container-safe py-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>
                  {t('welcome.back', { name: user.firstName || 'there' })} 👋
                </h2>
                <p className='text-gray-600'>{t('welcome.redirecting')}</p>
              </div>
              <Link
                href={`/${locale}/dashboard`}
                className='btn-primary whitespace-nowrap'
              >
                {t('welcome.goToDashboard')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection user={user} />

      {/* Features Section */}
      <FeaturesSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <footer className='bg-gray-900 text-white'>
        <div className='container-safe py-12'>
          <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
            {/* Brand */}
            <div className='col-span-1 md:col-span-2'>
              <div className='mb-4 flex items-center space-x-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500'>
                  <span className='text-sm font-bold text-white'>AI</span>
                </div>
                <span className='text-lg font-semibold'>
                  {t('footer.brand')}
                </span>
              </div>
              <p className='max-w-md text-sm text-gray-400'>
                {t('footer.description')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className='mb-4 font-semibold'>{t('footer.product')}</h3>
              <ul className='space-y-2 text-sm text-gray-400'>
                <li>
                  <Link
                    href='#features'
                    className='transition-colors hover:text-white'
                  >
                    {t('footer.features')}
                  </Link>
                </li>
                <li>
                  <Link
                    href='#pricing'
                    className='transition-colors hover:text-white'
                  >
                    {t('footer.pricing')}
                  </Link>
                </li>
                <li>
                  <Link
                    href='/sign-up'
                    className='transition-colors hover:text-white'
                  >
                    {t('footer.getStarted')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className='mb-4 font-semibold'>{t('footer.support')}</h3>
              <ul className='space-y-2 text-sm text-gray-400'>
                <li>
                  <Link
                    href='/help'
                    className='transition-colors hover:text-white'
                  >
                    {t('footer.helpCenter')}
                  </Link>
                </li>
                <li>
                  <Link
                    href='/contact'
                    className='transition-colors hover:text-white'
                  >
                    {t('footer.contact')}
                  </Link>
                </li>
                <li>
                  <Link
                    href='/privacy'
                    className='transition-colors hover:text-white'
                  >
                    {t('footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link
                    href='/terms'
                    className='transition-colors hover:text-white'
                  >
                    {t('footer.terms')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className='mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400'>
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
