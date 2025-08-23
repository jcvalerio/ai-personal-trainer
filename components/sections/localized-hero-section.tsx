'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface LocalizedHeroSectionProps {
  user?: any; // Clerk user type
  locale: string;
}

export function LocalizedHeroSection({
  user,
  locale,
}: LocalizedHeroSectionProps) {
  const router = useRouter();
  const t = useTranslations();

  const handleSmartCTA = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/sign-up');
    }
  };

  return (
    <section className='relative overflow-hidden bg-gradient-to-b from-blue-50 to-white'>
      <div className='container-safe py-16 sm:py-24'>
        <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-2'>
          {/* Content */}
          <div className='text-center lg:text-left'>
            <h1 className='mb-6 text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl'>
              {t('hero.title')}
              <span className='block text-primary-500'>
                {t('hero.subtitle')}
              </span>
            </h1>

            <p className='mx-auto mb-8 max-w-2xl text-lg text-gray-600 sm:text-xl lg:mx-0'>
              {t('hero.description')}
            </p>

            {/* Key Benefits */}
            <div className='mb-8 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2'>
              <div className='flex items-center justify-center space-x-2 lg:justify-start'>
                <svg
                  className='h-5 w-5 text-success-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                <span className='text-gray-700'>
                  {t('hero.benefits.aiPlans')}
                </span>
              </div>
              <div className='flex items-center justify-center space-x-2 lg:justify-start'>
                <svg
                  className='h-5 w-5 text-success-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                <span className='text-gray-700'>
                  {t('hero.benefits.equipment')}
                </span>
              </div>
              <div className='flex items-center justify-center space-x-2 lg:justify-start'>
                <svg
                  className='h-5 w-5 text-success-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                <span className='text-gray-700'>
                  {t('hero.benefits.familySharing')}
                </span>
              </div>
              <div className='flex items-center justify-center space-x-2 lg:justify-start'>
                <svg
                  className='h-5 w-5 text-success-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                <span className='text-gray-700'>
                  {t('hero.benefits.gymReady')}
                </span>
              </div>
            </div>

            {/* Smart CTA Buttons */}
            <div className='flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 lg:justify-start'>
              {user ? (
                <>
                  <button
                    onClick={handleSmartCTA}
                    className='btn-primary w-full px-8 py-4 text-base sm:w-auto'
                  >
                    {t('nav.dashboard')}
                  </button>
                  <Link
                    href='/workouts/generate'
                    className='btn-outline w-full px-8 py-4 text-base sm:w-auto'
                  >
                    {t('hero.buttons.generateWorkout')}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSmartCTA}
                    className='btn-primary w-full px-8 py-4 text-base sm:w-auto'
                  >
                    {t('hero.buttons.startTrial')}
                  </button>
                  <Link
                    href='#demo'
                    className='btn-outline w-full px-8 py-4 text-base sm:w-auto'
                  >
                    {t('hero.buttons.watchDemo')}
                  </Link>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className='mt-8 border-t border-gray-200 pt-8'>
              <p className='mb-4 text-sm text-gray-500'>
                {t('hero.socialProof.trusted')}
              </p>
              <div className='flex items-center justify-center space-x-8 opacity-60 lg:justify-start'>
                <div className='text-xs font-semibold text-gray-400'>
                  🏠 {t('hero.socialProof.families')}
                </div>
                <div className='text-xs font-semibold text-gray-400'>
                  🏋️ {t('hero.socialProof.gyms')}
                </div>
                <div className='text-xs font-semibold text-gray-400'>
                  ⭐ {t('hero.socialProof.rating')}
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className='relative'>
            <div className='relative mx-auto max-w-md lg:max-w-none'>
              {/* Phone mockup showing app interface */}
              <div className='relative mx-auto h-[600px] w-72 rounded-[3rem] bg-gray-900 p-2 shadow-2xl'>
                <div className='relative h-full w-full overflow-hidden rounded-[2.5rem] bg-white'>
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

                    {/* Today's workout card */}
                    <div className='rounded-2xl border border-primary-200 bg-primary-50 p-4'>
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
                        <button className='rounded-lg bg-primary-500 px-4 py-2 text-xs font-semibold text-white'>
                          {t('hero.mockup.start')}
                        </button>
                      </div>
                    </div>

                    {/* Progress streak */}
                    <div className='rounded-2xl border border-success-200 bg-success-50 p-4'>
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
              <div className='absolute -right-10 -top-10 h-20 w-20 animate-bounce-subtle rounded-full bg-primary-200 opacity-50'></div>
              <div className='animation-delay-300 absolute -bottom-10 -left-10 h-16 w-16 animate-bounce-subtle rounded-full bg-success-200 opacity-50'></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
