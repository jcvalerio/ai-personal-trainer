'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function CTASection() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  // Get current locale from pathname
  const locale = pathname.split('/')[1] || 'en';

  const handleSmartCTA = () => {
    if (user) {
      router.push(`/${locale}/dashboard`);
    } else {
      router.push('/sign-up');
    }
  };
  return (
    <section className='bg-gradient-to-r from-primary-600 to-blue-700 py-16 sm:py-24'>
      <div className='container-safe'>
        <div className='text-center'>
          {/* Main CTA Content */}
          <div className='mx-auto max-w-4xl'>
            <h2 className='mb-6 text-3xl font-bold text-white sm:text-4xl lg:text-5xl'>
              {t('cta.title')}
              <span className='block'>{t('cta.subtitle')}</span>
            </h2>
            <p className='mx-auto mb-8 max-w-2xl text-lg text-blue-100 sm:text-xl'>
              {t('cta.description')}
            </p>

            {/* Smart CTA Buttons */}
            <div className='mb-12 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0'>
              {user ? (
                <>
                  <button
                    onClick={handleSmartCTA}
                    className='touch-target w-full rounded-xl bg-white px-8 py-4 text-lg font-semibold text-primary-600 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl active:bg-gray-100 sm:w-auto'
                  >
                    {t('cta.buttons.dashboard')}
                  </button>
                  <Link
                    href={`/${locale}/workouts/generate`}
                    className='touch-target w-full rounded-xl border border-white/30 bg-primary-500/20 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:bg-primary-500/30 active:bg-primary-500/40 sm:w-auto'
                  >
                    {t('cta.buttons.generateWorkout')}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSmartCTA}
                    className='touch-target w-full rounded-xl bg-white px-8 py-4 text-lg font-semibold text-primary-600 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl active:bg-gray-100 sm:w-auto'
                  >
                    {t('cta.buttons.startTrial')}
                  </button>
                  <Link
                    href='/contact'
                    className='touch-target w-full rounded-xl border border-white/30 bg-primary-500/20 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:bg-primary-500/30 active:bg-primary-500/40 sm:w-auto'
                  >
                    {t('cta.buttons.contactSales')}
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className='grid grid-cols-1 gap-8 text-center sm:grid-cols-3'>
              <div className='flex flex-col items-center'>
                <div className='mb-2 text-3xl font-bold text-white sm:text-4xl'>
                  {t('cta.stats.families')}
                </div>
                <p className='text-sm text-blue-100'>
                  {t('cta.stats.familiesLabel')}
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='mb-2 text-3xl font-bold text-white sm:text-4xl'>
                  {t('cta.stats.gyms')}
                </div>
                <p className='text-sm text-blue-100'>
                  {t('cta.stats.gymsLabel')}
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='mb-2 text-3xl font-bold text-white sm:text-4xl'>
                  {t('cta.stats.rating')}
                </div>
                <p className='text-sm text-blue-100'>
                  {t('cta.stats.ratingLabel')}
                </p>
              </div>
            </div>
          </div>

          {/* Gym Partnership CTA */}
          <div className='mt-16 border-t border-white/20 pt-16'>
            <div className='mx-auto max-w-3xl'>
              <h3 className='mb-4 text-2xl font-bold text-white sm:text-3xl'>
                {t('cta.gym.title')}
              </h3>
              <p className='mb-8 text-lg text-blue-100'>
                {t('cta.gym.description')}
              </p>

              <div className='flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0'>
                <Link
                  href='/gym-partnership'
                  className='touch-target w-full rounded-xl bg-white px-6 py-3 font-semibold text-primary-600 transition-all duration-200 hover:bg-gray-50 sm:w-auto'
                >
                  {t('cta.gym.learnMore')}
                </Link>
                <Link
                  href='/demo'
                  className='w-full text-center font-medium text-white transition-colors hover:text-blue-100 sm:w-auto'
                >
                  {t('cta.gym.scheduleDemo')}
                </Link>
              </div>

              {/* Partnership Benefits */}
              <div className='mt-8 grid grid-cols-1 gap-6 text-sm sm:grid-cols-3'>
                <div className='flex items-center justify-center space-x-2 sm:justify-start'>
                  <svg
                    className='h-5 w-5 text-green-300'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-blue-100'>
                    {t('cta.gym.benefits.branding')}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-2 sm:justify-start'>
                  <svg
                    className='h-5 w-5 text-green-300'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-blue-100'>
                    {t('cta.gym.benefits.analytics')}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-2 sm:justify-start'>
                  <svg
                    className='h-5 w-5 text-green-300'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-blue-100'>
                    {t('cta.gym.benefits.revenue')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
