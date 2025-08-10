'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function CTASection() {
  const { user } = useUser()
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
    <section className='py-16 sm:py-24 bg-gradient-to-r from-primary-600 to-blue-700'>
      <div className='container-safe'>
        <div className='text-center'>
          {/* Main CTA Content */}
          <div className='max-w-4xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6'>
              {t('cta.title')}
              <span className='block'>{t('cta.subtitle')}</span>
            </h2>
            <p className='text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto'>
              {t('cta.description')}
            </p>

            {/* Smart CTA Buttons */}
            <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12'>
              {user ? (
                <>
                  <button
                    onClick={handleSmartCTA}
                    className='bg-white text-primary-600 hover:bg-gray-50 active:bg-gray-100 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 w-full sm:w-auto touch-target shadow-lg hover:shadow-xl'
                  >
                    {t('cta.buttons.dashboard')}
                  </button>
                  <Link 
                    href={`/${locale}/workouts/generate`}
                    className='bg-primary-500/20 text-white border border-white/30 hover:bg-primary-500/30 active:bg-primary-500/40 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 w-full sm:w-auto touch-target'
                  >
                    {t('cta.buttons.generateWorkout')}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSmartCTA}
                    className='bg-white text-primary-600 hover:bg-gray-50 active:bg-gray-100 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 w-full sm:w-auto touch-target shadow-lg hover:shadow-xl'
                  >
                    {t('cta.buttons.startTrial')}
                  </button>
                  <Link 
                    href='/contact' 
                    className='bg-primary-500/20 text-white border border-white/30 hover:bg-primary-500/30 active:bg-primary-500/40 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 w-full sm:w-auto touch-target'
                  >
                    {t('cta.buttons.contactSales')}
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 text-center'>
              <div className='flex flex-col items-center'>
                <div className='text-3xl sm:text-4xl font-bold text-white mb-2'>
                  {t('cta.stats.families')}
                </div>
                <p className='text-blue-100 text-sm'>
                  {t('cta.stats.familiesLabel')}
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='text-3xl sm:text-4xl font-bold text-white mb-2'>
                  {t('cta.stats.gyms')}
                </div>
                <p className='text-blue-100 text-sm'>
                  {t('cta.stats.gymsLabel')}
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='text-3xl sm:text-4xl font-bold text-white mb-2'>
                  {t('cta.stats.rating')}
                </div>
                <p className='text-blue-100 text-sm'>
                  {t('cta.stats.ratingLabel')}
                </p>
              </div>
            </div>
          </div>

          {/* Gym Partnership CTA */}
          <div className='mt-16 pt-16 border-t border-white/20'>
            <div className='max-w-3xl mx-auto'>
              <h3 className='text-2xl sm:text-3xl font-bold text-white mb-4'>
                {t('cta.gym.title')}
              </h3>
              <p className='text-lg text-blue-100 mb-8'>
                {t('cta.gym.description')}
              </p>
              
              <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
                <Link 
                  href='/gym-partnership' 
                  className='bg-white text-primary-600 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl transition-all duration-200 w-full sm:w-auto touch-target'
                >
                  {t('cta.gym.learnMore')}
                </Link>
                <Link 
                  href='/demo' 
                  className='text-white hover:text-blue-100 font-medium transition-colors w-full sm:w-auto text-center'
                >
                  {t('cta.gym.scheduleDemo')}
                </Link>
              </div>

              {/* Partnership Benefits */}
              <div className='mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm'>
                <div className='flex items-center justify-center sm:justify-start space-x-2'>
                  <svg className='h-5 w-5 text-green-300' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                  </svg>
                  <span className='text-blue-100'>{t('cta.gym.benefits.branding')}</span>
                </div>
                <div className='flex items-center justify-center sm:justify-start space-x-2'>
                  <svg className='h-5 w-5 text-green-300' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                  </svg>
                  <span className='text-blue-100'>{t('cta.gym.benefits.analytics')}</span>
                </div>
                <div className='flex items-center justify-center sm:justify-start space-x-2'>
                  <svg className='h-5 w-5 text-green-300' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                  </svg>
                  <span className='text-blue-100'>{t('cta.gym.benefits.revenue')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}