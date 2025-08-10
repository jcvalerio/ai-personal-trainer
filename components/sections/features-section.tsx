'use client'

import { useTranslations } from 'next-intl'

export function FeaturesSection() {
  const t = useTranslations()
  
  const features = [
    {
      icon: '🤖',
      title: t('features.items.aiWorkout.title'),
      description: t('features.items.aiWorkout.description'),
      benefits: [
        t('features.items.aiWorkout.benefits.tailored'),
        t('features.items.aiWorkout.benefits.adapts'),
        t('features.items.aiWorkout.benefits.equipment')
      ]
    },
    {
      icon: '📱',
      title: t('features.items.tracking.title'),
      description: t('features.items.tracking.description'),
      benefits: [
        t('features.items.tracking.benefits.realtime'),
        t('features.items.tracking.benefits.timer'),
        t('features.items.tracking.benefits.tips')
      ]
    },
    {
      icon: '🏋️',
      title: t('features.items.equipment.title'),
      description: t('features.items.equipment.description'),
      benefits: [
        t('features.items.equipment.benefits.qr'),
        t('features.items.equipment.benefits.alternatives'),
        t('features.items.equipment.benefits.shared')
      ]
    },
    {
      icon: '👨‍👩‍👧‍👦',
      title: t('features.items.family.title'),
      description: t('features.items.family.description'),
      benefits: [
        t('features.items.family.benefits.sharing'),
        t('features.items.family.benefits.leaderboards'),
        t('features.items.family.benefits.motivation')
      ]
    },
    {
      icon: '🏢',
      title: t('features.items.gym.title'),
      description: t('features.items.gym.description'),
      benefits: [
        t('features.items.gym.benefits.branding'),
        t('features.items.gym.benefits.analytics'),
        t('features.items.gym.benefits.management')
      ]
    },
    {
      icon: '📊',
      title: t('features.items.analytics.title'),
      description: t('features.items.analytics.description'),
      benefits: [
        t('features.items.analytics.benefits.tracking'),
        t('features.items.analytics.benefits.achievements'),
        t('features.items.analytics.benefits.insights')
      ]
    }
  ]

  return (
    <section id='features' className='py-16 sm:py-24 bg-white'>
      <div className='container-safe'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6'>
            {t('features.title')}
            <span className='text-primary-500 block'>{t('features.subtitle')}</span>
          </h2>
          <p className='text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto'>
            {t('features.description')}
          </p>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <div 
              key={index}
              className='group relative p-8 bg-gray-50 rounded-2xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-300'
            >
              {/* Icon */}
              <div className='mb-4'>
                <div className='w-12 h-12 bg-white rounded-xl border border-gray-200 group-hover:border-primary-300 flex items-center justify-center text-2xl transition-all duration-300'>
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className='text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-900 transition-colors'>
                {feature.title}
              </h3>
              <p className='text-gray-600 group-hover:text-gray-700 mb-4 transition-colors'>
                {feature.description}
              </p>

              {/* Benefits */}
              <ul className='space-y-2'>
                {feature.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className='flex items-center text-sm text-gray-500 group-hover:text-gray-600 transition-colors'>
                    <svg className='h-4 w-4 text-success-500 mr-2 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>

              {/* Hover effect */}
              <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className='text-center mt-16'>
          <div className='inline-flex items-center justify-center p-1 bg-primary-50 rounded-full border border-primary-200 mb-6'>
            <div className='bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold mr-3'>
              {t('features.cta.free')}
            </div>
            <span className='text-primary-700 text-sm font-medium pr-4'>
              {t('features.cta.freeDescription')}
            </span>
          </div>
          <p className='text-gray-600 text-lg mb-8'>
            {t('features.cta.ready')}
          </p>
          <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
            <a href='/sign-up' className='btn-primary text-base px-8 py-4 w-full sm:w-auto'>
              {t('features.cta.getStarted')}
            </a>
            <a href='#demo' className='btn-outline text-base px-8 py-4 w-full sm:w-auto'>
              {t('features.cta.scheduleDemo')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}