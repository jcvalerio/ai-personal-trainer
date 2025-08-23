'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface HeroSectionProps {
  user?: any; // Clerk user type
}

export function HeroSection({ user }: HeroSectionProps) {
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
    <section className='relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-primary-50/30'>
      <div className='container-safe py-20 sm:py-28 lg:py-32'>
        <div className='grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20'>
          {/* Content */}
          <div className='space-y-8'>
            <div className='space-y-6'>
              <h1 className='text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl xl:text-7xl'>
                <span className='block text-balance'>{t('hero.title')}</span>
                <span className='block text-balance text-primary-600'>
                  {t('hero.subtitle')}
                </span>
              </h1>

              <p className='max-w-xl text-pretty text-lg leading-relaxed text-gray-600 sm:text-xl'>
                {t('hero.description')}
              </p>
            </div>

            {/* Key Benefits */}
            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div className='group flex items-center space-x-3'>
                  <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success-100 transition-colors duration-200 group-hover:bg-success-200'>
                    <svg
                      className='h-3.5 w-3.5 text-success-600'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <span className='text-sm font-medium text-gray-700'>
                    {t('hero.benefits.aiPlans')}
                  </span>
                </div>
                <div className='group flex items-center space-x-3'>
                  <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success-100 transition-colors duration-200 group-hover:bg-success-200'>
                    <svg
                      className='h-3.5 w-3.5 text-success-600'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <span className='text-sm font-medium text-gray-700'>
                    {t('hero.benefits.equipment')}
                  </span>
                </div>
                <div className='group flex items-center space-x-3'>
                  <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success-100 transition-colors duration-200 group-hover:bg-success-200'>
                    <svg
                      className='h-3.5 w-3.5 text-success-600'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <span className='text-sm font-medium text-gray-700'>
                    {t('hero.benefits.familySharing')}
                  </span>
                </div>
                <div className='group flex items-center space-x-3'>
                  <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success-100 transition-colors duration-200 group-hover:bg-success-200'>
                    <svg
                      className='h-3.5 w-3.5 text-success-600'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <span className='text-sm font-medium text-gray-700'>
                    {t('hero.benefits.gymReady')}
                  </span>
                </div>
              </div>
            </div>

            {/* Smart CTA Buttons */}
            <div className='flex flex-col gap-4 sm:flex-row'>
              {user ? (
                <>
                  <button
                    onClick={handleSmartCTA}
                    className='btn-primary w-full rounded-2xl px-8 py-4 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto'
                  >
                    {t('nav.dashboard')}
                    <svg
                      className='ml-2 h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 7l5 5m0 0l-5 5m5-5H6'
                      />
                    </svg>
                  </button>
                  <Link
                    href={`/${locale}/workouts/generate`}
                    className='btn-outline w-full rounded-2xl border-2 px-8 py-4 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 sm:w-auto'
                  >
                    {t('hero.buttons.generateWorkout')}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSmartCTA}
                    className='btn-primary group relative w-full overflow-hidden rounded-2xl px-8 py-4 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto'
                  >
                    <span className='relative z-10 flex items-center justify-center'>
                      {t('hero.buttons.startTrial')}
                      <svg
                        className='ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 7l5 5m0 0l-5 5m5-5H6'
                        />
                      </svg>
                    </span>
                    <div className='absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-200 group-hover:from-primary-500 group-hover:to-primary-600'></div>
                  </button>
                  <Link
                    href='#demo'
                    className='btn-outline flex w-full items-center justify-center rounded-2xl border-2 px-8 py-4 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 sm:w-auto'
                  >
                    <svg
                      className='mr-2 h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    {t('hero.buttons.watchDemo')}
                  </Link>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className='border-t border-gray-100 pt-8'>
              <p className='mb-4 text-sm font-medium text-gray-500'>
                {t('hero.socialProof.trusted')}
              </p>
              <div className='flex flex-wrap gap-6'>
                <div className='flex items-center space-x-2'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100'>
                    <span className='text-sm text-orange-600'>🏠</span>
                  </div>
                  <span className='text-sm font-semibold text-gray-700'>
                    {t('hero.socialProof.families')}
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100'>
                    <span className='text-sm text-purple-600'>🏋️</span>
                  </div>
                  <span className='text-sm font-semibold text-gray-700'>
                    {t('hero.socialProof.gyms')}
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100'>
                    <span className='text-sm text-yellow-600'>⭐</span>
                  </div>
                  <span className='text-sm font-semibold text-gray-700'>
                    {t('hero.socialProof.rating')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className='relative flex justify-center lg:justify-end'>
            <div className='relative'>
              {/* Phone mockup showing app interface */}
              <div className='relative mx-auto h-[600px] w-72 rounded-[3rem] bg-gradient-to-b from-gray-800 to-gray-900 p-2 shadow-2xl transition-shadow transition-transform duration-500 hover:-translate-y-2 hover:shadow-3xl'>
                <div className='relative h-full w-full overflow-hidden rounded-[2.5rem] bg-white shadow-inner'>
                  {/* Status bar */}
                  <div className='flex h-8 items-center justify-between bg-gray-50 px-6 text-xs font-medium text-gray-900'>
                    <span>9:41</span>
                    <div className='flex items-center space-x-1'>
                      <div className='h-2 w-4 rounded-sm bg-gray-900'></div>
                      <div className='h-2 w-6 rounded-sm bg-gray-300'></div>
                      <div className='h-2 w-6 rounded-sm bg-green-500'></div>
                    </div>
                  </div>

                  {/* App content mockup */}
                  <div className='space-y-4 p-4'>
                    {/* Header */}
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-semibold text-gray-900'>
                          {t('hero.mockup.greeting', {
                            name:
                              user?.firstName || t('hero.mockup.defaultName'),
                          })}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          {user
                            ? t('hero.mockup.readyQuestion')
                            : t('hero.mockup.readyStart')}
                        </p>
                      </div>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-500'>
                        <span className='text-sm font-semibold text-white'>
                          {user?.firstName?.[0] ||
                            user?.emailAddresses?.[0]?.emailAddress[0]?.toUpperCase() ||
                            'A'}
                        </span>
                      </div>
                    </div>

                    {/* Today&apos;s workout card */}
                    <div className='rounded-2xl border border-primary-200/50 bg-gradient-to-br from-primary-50 to-primary-100/50 p-4 shadow-sm'>
                      <h4 className='mb-2 font-semibold text-primary-900'>
                        {t('hero.mockup.todaySession')}
                      </h4>
                      <p className='mb-3 text-sm text-primary-700'>
                        {t('hero.mockup.upperBody')}
                      </p>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-primary-600'>
                          ⏱️ {t('hero.mockup.duration')} • 🏋️{' '}
                          {t('hero.mockup.exercises')}
                        </span>
                        <button className='rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:from-primary-600 hover:to-primary-700 hover:shadow-md'>
                          {t('hero.mockup.start')}
                        </button>
                      </div>
                    </div>

                    {/* Progress streak */}
                    <div className='rounded-2xl border border-success-200/50 bg-gradient-to-br from-success-50 to-success-100/50 p-4 shadow-sm'>
                      <h4 className='mb-2 font-semibold text-success-900'>
                        🔥 {t('hero.mockup.streak')}
                      </h4>
                      <p className='text-2xl font-bold text-success-700'>
                        {t('hero.mockup.streakDays')}
                      </p>
                      <p className='text-xs text-success-600'>
                        {t('hero.mockup.personalBest')}
                      </p>
                    </div>

                    {/* Recent activity */}
                    <div className='space-y-2'>
                      <h4 className='text-sm font-semibold text-gray-900'>
                        {t('hero.mockup.recentActivity')}
                      </h4>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between py-2'>
                          <span className='text-sm text-gray-700'>
                            {t('hero.mockup.pushUps')}
                          </span>
                          <span className='text-sm text-gray-500'>
                            3×15 {t('hero.mockup.reps')}
                          </span>
                        </div>
                        <div className='flex items-center justify-between py-2'>
                          <span className='text-sm text-gray-700'>
                            {t('hero.mockup.benchPress')}
                          </span>
                          <span className='text-sm text-gray-500'>
                            3×12 • 135 {t('hero.mockup.lbs')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className='absolute -right-10 -top-10 h-20 w-20 animate-bounce-subtle rounded-full bg-gradient-to-br from-primary-200 to-primary-300 opacity-60 blur-sm'></div>
              <div className='animation-delay-300 absolute -bottom-10 -left-10 h-16 w-16 animate-bounce-subtle rounded-full bg-gradient-to-br from-success-200 to-success-300 opacity-60 blur-sm'></div>
              <div className='absolute -left-16 top-20 h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-orange-200 to-orange-300 opacity-40 blur-sm'></div>
              <div className='animation-delay-700 absolute -right-8 bottom-32 h-8 w-8 animate-bounce-subtle rounded-full bg-gradient-to-br from-purple-200 to-purple-300 opacity-50 blur-sm'></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
