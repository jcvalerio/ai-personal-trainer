'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface LocalizedHeroSectionProps {
  user?: any // Clerk user type
  locale: string
}

export function LocalizedHeroSection({ user, locale }: LocalizedHeroSectionProps) {
  const router = useRouter()
  const t = useTranslations()

  const handleSmartCTA = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/sign-up')
    }
  }

  return (
    <section className='relative overflow-hidden bg-gradient-to-b from-blue-50 to-white'>
      <div className='container-safe py-16 sm:py-24'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Content */}
          <div className='text-center lg:text-left'>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6'>
              {t('hero.title')}
              <span className='text-primary-500 block'>
                {t('hero.subtitle')}
              </span>
            </h1>
            
            <p className='text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0'>
              {t('hero.description')}
            </p>

            {/* Key Benefits */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-sm'>
              <div className='flex items-center justify-center lg:justify-start space-x-2'>
                <svg className='h-5 w-5 text-success-500' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                </svg>
                <span className='text-gray-700'>{t('hero.benefits.aiPlans')}</span>
              </div>
              <div className='flex items-center justify-center lg:justify-start space-x-2'>
                <svg className='h-5 w-5 text-success-500' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                </svg>
                <span className='text-gray-700'>{t('hero.benefits.equipment')}</span>
              </div>
              <div className='flex items-center justify-center lg:justify-start space-x-2'>
                <svg className='h-5 w-5 text-success-500' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                </svg>
                <span className='text-gray-700'>{t('hero.benefits.familySharing')}</span>
              </div>
              <div className='flex items-center justify-center lg:justify-start space-x-2'>
                <svg className='h-5 w-5 text-success-500' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                </svg>
                <span className='text-gray-700'>{t('hero.benefits.gymReady')}</span>
              </div>
            </div>

            {/* Smart CTA Buttons */}
            <div className='flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4'>
              {user ? (
                <>
                  <button 
                    onClick={handleSmartCTA}
                    className='btn-primary text-base px-8 py-4 w-full sm:w-auto'
                  >
                    {t('nav.dashboard')}
                  </button>
                  <Link href='/workouts/generate' className='btn-outline text-base px-8 py-4 w-full sm:w-auto'>
                    {t('hero.buttons.generateWorkout')}
                  </Link>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleSmartCTA}
                    className='btn-primary text-base px-8 py-4 w-full sm:w-auto'
                  >
                    {t('hero.buttons.startTrial')}
                  </button>
                  <Link href='#demo' className='btn-outline text-base px-8 py-4 w-full sm:w-auto'>
                    {t('hero.buttons.watchDemo')}
                  </Link>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className='mt-8 pt-8 border-t border-gray-200'>
              <p className='text-sm text-gray-500 mb-4'>{t('hero.socialProof.trusted')}</p>
              <div className='flex items-center justify-center lg:justify-start space-x-8 opacity-60'>
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
              <div className='relative mx-auto w-72 h-[600px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl'>
                <div className='w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative'>
                  {/* Status bar */}
                  <div className='h-8 bg-gray-50 flex items-center justify-between px-6 text-xs font-medium text-gray-900'>
                    <span>9:41</span>
                    <div className='flex items-center space-x-1'>
                      <div className='w-4 h-2 bg-gray-900 rounded-sm'></div>
                      <div className='w-6 h-2 bg-gray-300 rounded-sm'></div>
                      <div className='w-6 h-2 bg-green-500 rounded-sm'></div>
                    </div>
                  </div>
                  
                  {/* App content mockup */}
                  <div className='p-4 space-y-4'>
                    {/* Header */}
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-semibold text-gray-900'>
                          {t('hero.mockup.greeting', { name: user?.firstName || t('hero.mockup.defaultName') })}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          {user ? t('hero.mockup.readyQuestion') : t('hero.mockup.readyStart')}
                        </p>
                      </div>
                      <div className='w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center'>
                        <span className='text-white font-semibold text-sm'>
                          {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress[0]?.toUpperCase() || 'A'}
                        </span>
                      </div>
                    </div>

                    {/* Today's workout card */}
                    <div className='bg-primary-50 rounded-2xl p-4 border border-primary-200'>
                      <h4 className='font-semibold text-primary-900 mb-2'>{t('hero.mockup.todaySession')}</h4>
                      <p className='text-primary-700 text-sm mb-3'>{t('hero.mockup.upperBody')}</p>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-primary-600'>
                          ⏱️ {t('hero.mockup.duration')} • 🏋️ {t('hero.mockup.exercises')}
                        </span>
                        <button className='bg-primary-500 text-white px-4 py-2 rounded-lg text-xs font-semibold'>
                          {t('hero.mockup.start')}
                        </button>
                      </div>
                    </div>

                    {/* Progress streak */}
                    <div className='bg-success-50 rounded-2xl p-4 border border-success-200'>
                      <h4 className='font-semibold text-success-900 mb-2'>🔥 {t('hero.mockup.streak')}</h4>
                      <p className='text-2xl font-bold text-success-700'>{t('hero.mockup.streakDays')}</p>
                      <p className='text-xs text-success-600'>{t('hero.mockup.personalBest')}</p>
                    </div>

                    {/* Recent activity */}
                    <div className='space-y-2'>
                      <h4 className='font-semibold text-gray-900 text-sm'>{t('hero.mockup.recentActivity')}</h4>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between py-2'>
                          <span className='text-sm text-gray-700'>{t('hero.mockup.pushUps')}</span>
                          <span className='text-sm text-gray-500'>3×15 {t('hero.mockup.reps')}</span>
                        </div>
                        <div className='flex items-center justify-between py-2'>
                          <span className='text-sm text-gray-700'>{t('hero.mockup.benchPress')}</span>
                          <span className='text-sm text-gray-500'>3×12 • 135 {t('hero.mockup.lbs')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className='absolute -top-10 -right-10 w-20 h-20 bg-primary-200 rounded-full opacity-50 animate-bounce-subtle'></div>
              <div className='absolute -bottom-10 -left-10 w-16 h-16 bg-success-200 rounded-full opacity-50 animate-bounce-subtle animation-delay-300'></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}