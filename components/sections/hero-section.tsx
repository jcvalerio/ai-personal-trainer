'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface HeroSectionProps {
  user?: any // Clerk user type
}

export function HeroSection({ user }: HeroSectionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  
  // Get current locale from pathname
  const locale = pathname.split('/')[1] || 'en'

  const handleSmartCTA = () => {
    if (user) {
      router.push(`/${locale}/dashboard`)
    } else {
      router.push('/sign-up')
    }
  }
  return (
    <section className='relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-primary-50/30'>
      <div className='container-safe py-20 sm:py-28 lg:py-32'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center'>
          {/* Content */}
          <div className='space-y-8'>
            <div className='space-y-6'>
              <h1 className='text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight'>
                <span className='block text-balance'>{t('hero.title')}</span>
                <span className='text-primary-600 block text-balance'>
                  {t('hero.subtitle')}
                </span>
              </h1>
              
              <p className='text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl text-pretty'>
                {t('hero.description')}
              </p>
            </div>

            {/* Key Benefits */}
            <div className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='flex items-center space-x-3 group'>
                  <div className='flex-shrink-0 w-6 h-6 bg-success-100 rounded-full flex items-center justify-center group-hover:bg-success-200 transition-colors duration-200'>
                    <svg className='h-3.5 w-3.5 text-success-600' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <span className='text-gray-700 font-medium text-sm'>{t('hero.benefits.aiPlans')}</span>
                </div>
                <div className='flex items-center space-x-3 group'>
                  <div className='flex-shrink-0 w-6 h-6 bg-success-100 rounded-full flex items-center justify-center group-hover:bg-success-200 transition-colors duration-200'>
                    <svg className='h-3.5 w-3.5 text-success-600' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <span className='text-gray-700 font-medium text-sm'>{t('hero.benefits.equipment')}</span>
                </div>
                <div className='flex items-center space-x-3 group'>
                  <div className='flex-shrink-0 w-6 h-6 bg-success-100 rounded-full flex items-center justify-center group-hover:bg-success-200 transition-colors duration-200'>
                    <svg className='h-3.5 w-3.5 text-success-600' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <span className='text-gray-700 font-medium text-sm'>{t('hero.benefits.familySharing')}</span>
                </div>
                <div className='flex items-center space-x-3 group'>
                  <div className='flex-shrink-0 w-6 h-6 bg-success-100 rounded-full flex items-center justify-center group-hover:bg-success-200 transition-colors duration-200'>
                    <svg className='h-3.5 w-3.5 text-success-600' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <span className='text-gray-700 font-medium text-sm'>{t('hero.benefits.gymReady')}</span>
                </div>
              </div>
            </div>

            {/* Smart CTA Buttons */}
            <div className='flex flex-col sm:flex-row gap-4'>
              {user ? (
                <>
                  <button 
                    onClick={handleSmartCTA}
                    className='btn-primary text-base font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto'
                  >
                    {t('nav.dashboard')}
                    <svg className='ml-2 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                    </svg>
                  </button>
                  <Link href={`/${locale}/workouts/generate`} className='btn-outline text-base font-semibold px-8 py-4 rounded-2xl border-2 hover:bg-gray-50 transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto'>
                    {t('hero.buttons.generateWorkout')}
                  </Link>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleSmartCTA}
                    className='group relative btn-primary text-base font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto overflow-hidden'
                  >
                    <span className='relative z-10 flex items-center justify-center'>
                      {t('hero.buttons.startTrial')}
                      <svg className='ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                      </svg>
                    </span>
                    <div className='absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 group-hover:from-primary-500 group-hover:to-primary-600 transition-all duration-200'></div>
                  </button>
                  <Link href='#demo' className='btn-outline text-base font-semibold px-8 py-4 rounded-2xl border-2 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto flex items-center justify-center'>
                    <svg className='mr-2 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    {t('hero.buttons.watchDemo')}
                  </Link>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className='pt-8 border-t border-gray-100'>
              <p className='text-sm text-gray-500 mb-4 font-medium'>{t('hero.socialProof.trusted')}</p>
              <div className='flex flex-wrap gap-6'>
                <div className='flex items-center space-x-2'>
                  <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'>
                    <span className='text-orange-600 text-sm'>🏠</span>
                  </div>
                  <span className='text-sm font-semibold text-gray-700'>{t('hero.socialProof.families')}</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                    <span className='text-purple-600 text-sm'>🏋️</span>
                  </div>
                  <span className='text-sm font-semibold text-gray-700'>{t('hero.socialProof.gyms')}</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center'>
                    <span className='text-yellow-600 text-sm'>⭐</span>
                  </div>
                  <span className='text-sm font-semibold text-gray-700'>{t('hero.socialProof.rating')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className='relative flex justify-center lg:justify-end'>
            <div className='relative'>
              {/* Phone mockup showing app interface */}
              <div className='relative mx-auto w-72 h-[600px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl hover:shadow-3xl transition-shadow duration-500 hover:-translate-y-2 transition-transform'>
                <div className='w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative shadow-inner'>
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

                    {/* Today&apos;s workout card */}
                    <div className='bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-4 border border-primary-200/50 shadow-sm'>
                      <h4 className='font-semibold text-primary-900 mb-2'>{t('hero.mockup.todaySession')}</h4>
                      <p className='text-primary-700 text-sm mb-3'>{t('hero.mockup.upperBody')}</p>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-primary-600'>⏱️ {t('hero.mockup.duration')} • 🏋️ {t('hero.mockup.exercises')}</span>
                        <button className='bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200'>
                          {t('hero.mockup.start')}
                        </button>
                      </div>
                    </div>

                    {/* Progress streak */}
                    <div className='bg-gradient-to-br from-success-50 to-success-100/50 rounded-2xl p-4 border border-success-200/50 shadow-sm'>
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
              <div className='absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-60 animate-bounce-subtle blur-sm'></div>
              <div className='absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-br from-success-200 to-success-300 rounded-full opacity-60 animate-bounce-subtle animation-delay-300 blur-sm'></div>
              <div className='absolute top-20 -left-16 w-12 h-12 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full opacity-40 animate-pulse blur-sm'></div>
              <div className='absolute bottom-32 -right-8 w-8 h-8 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full opacity-50 animate-bounce-subtle animation-delay-700 blur-sm'></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}