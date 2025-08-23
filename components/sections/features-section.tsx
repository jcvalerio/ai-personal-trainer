'use client';

import { useTranslations } from 'next-intl';

export function FeaturesSection() {
  const t = useTranslations();

  const features = [
    {
      icon: '🤖',
      title: t('features.items.aiWorkout.title'),
      description: t('features.items.aiWorkout.description'),
      benefits: [
        t('features.items.aiWorkout.benefits.tailored'),
        t('features.items.aiWorkout.benefits.adapts'),
        t('features.items.aiWorkout.benefits.equipment'),
      ],
    },
    {
      icon: '📱',
      title: t('features.items.tracking.title'),
      description: t('features.items.tracking.description'),
      benefits: [
        t('features.items.tracking.benefits.realtime'),
        t('features.items.tracking.benefits.timer'),
        t('features.items.tracking.benefits.tips'),
      ],
    },
    {
      icon: '🏋️',
      title: t('features.items.equipment.title'),
      description: t('features.items.equipment.description'),
      benefits: [
        t('features.items.equipment.benefits.qr'),
        t('features.items.equipment.benefits.alternatives'),
        t('features.items.equipment.benefits.shared'),
      ],
    },
    {
      icon: '👨‍👩‍👧‍👦',
      title: t('features.items.family.title'),
      description: t('features.items.family.description'),
      benefits: [
        t('features.items.family.benefits.sharing'),
        t('features.items.family.benefits.leaderboards'),
        t('features.items.family.benefits.motivation'),
      ],
    },
    {
      icon: '🏢',
      title: t('features.items.gym.title'),
      description: t('features.items.gym.description'),
      benefits: [
        t('features.items.gym.benefits.branding'),
        t('features.items.gym.benefits.analytics'),
        t('features.items.gym.benefits.management'),
      ],
    },
    {
      icon: '📊',
      title: t('features.items.analytics.title'),
      description: t('features.items.analytics.description'),
      benefits: [
        t('features.items.analytics.benefits.tracking'),
        t('features.items.analytics.benefits.achievements'),
        t('features.items.analytics.benefits.insights'),
      ],
    },
  ];

  return (
    <section id='features' className='bg-white py-16 sm:py-24'>
      <div className='container-safe'>
        {/* Section Header */}
        <div className='mb-16 text-center'>
          <h2 className='mb-6 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl'>
            {t('features.title')}
            <span className='block text-primary-500'>
              {t('features.subtitle')}
            </span>
          </h2>
          <p className='mx-auto max-w-3xl text-lg text-gray-600 sm:text-xl'>
            {t('features.description')}
          </p>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='group relative rounded-2xl border border-gray-200 bg-gray-50 p-8 transition-all duration-300 hover:border-primary-300 hover:bg-primary-50/50'
            >
              {/* Icon */}
              <div className='mb-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-2xl transition-all duration-300 group-hover:border-primary-300'>
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className='mb-3 text-xl font-semibold text-gray-900 transition-colors group-hover:text-primary-900'>
                {feature.title}
              </h3>
              <p className='mb-4 text-gray-600 transition-colors group-hover:text-gray-700'>
                {feature.description}
              </p>

              {/* Benefits */}
              <ul className='space-y-2'>
                {feature.benefits.map((benefit, benefitIndex) => (
                  <li
                    key={benefitIndex}
                    className='flex items-center text-sm text-gray-500 transition-colors group-hover:text-gray-600'
                  >
                    <svg
                      className='mr-2 h-4 w-4 flex-shrink-0 text-success-500'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>

              {/* Hover effect */}
              <div className='pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/5 to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className='mt-16 text-center'>
          <div className='mb-6 inline-flex items-center justify-center rounded-full border border-primary-200 bg-primary-50 p-1'>
            <div className='mr-3 rounded-full bg-primary-500 px-3 py-1 text-sm font-semibold text-white'>
              {t('features.cta.free')}
            </div>
            <span className='pr-4 text-sm font-medium text-primary-700'>
              {t('features.cta.freeDescription')}
            </span>
          </div>
          <p className='mb-8 text-lg text-gray-600'>
            {t('features.cta.ready')}
          </p>
          <div className='flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0'>
            <a
              href='/sign-up'
              className='btn-primary w-full px-8 py-4 text-base sm:w-auto'
            >
              {t('features.cta.getStarted')}
            </a>
            <a
              href='#demo'
              className='btn-outline w-full px-8 py-4 text-base sm:w-auto'
            >
              {t('features.cta.scheduleDemo')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
