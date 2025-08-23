'use client';

import { useTranslations } from 'next-intl';

interface SimpleHomeClientProps {
  locale: string;
}

export default function SimpleHomeClient({ locale }: SimpleHomeClientProps) {
  try {
    const t = useTranslations();

    return (
      <div className='min-h-screen bg-white p-8'>
        <h1 className='text-4xl font-bold text-gray-900'>{t('hero.title')}</h1>
        <h2 className='mt-2 text-2xl text-blue-600'>{t('hero.subtitle')}</h2>
        <p className='mt-4 max-w-2xl text-gray-600'>{t('hero.description')}</p>

        <div className='mt-8 rounded-lg bg-gray-100 p-4'>
          <h3 className='mb-4 text-xl font-bold'>
            I18n Test - Current locale: {locale}
          </h3>
          <p className='mb-2'>✅ I18n routing is working!</p>
          <p className='text-sm text-gray-600'>
            Navigation:
            <a href='/en' className='ml-1 text-blue-600 underline'>
              English (/en)
            </a>{' '}
            |
            <a href='/es' className='ml-1 text-blue-600 underline'>
              Español (/es)
            </a>
          </p>
        </div>

        <div className='mt-8'>
          <h3 className='mb-4 text-xl font-bold'>Translation Test:</h3>
          <ul className='space-y-2'>
            <li>Brand: {t('nav.brand')}</li>
            <li>Features: {t('nav.features')}</li>
            <li>Get Started: {t('nav.getStarted')}</li>
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className='min-h-screen bg-white p-8'>
        <h1 className='text-4xl font-bold text-red-600'>Translation Error</h1>
        <p className='mt-4 text-gray-600'>Current locale: {locale}</p>
        <p className='mt-2 text-red-500'>Error: {String(error)}</p>
        <div className='mt-8'>
          <h3 className='mb-4 text-xl font-bold'>Debug Info:</h3>
          <ul className='space-y-2 text-sm'>
            <li>Locale: {locale}</li>
            <li>Component: SimpleHomeClient</li>
            <li>Error occurred while using translations</li>
          </ul>
        </div>
      </div>
    );
  }
}
