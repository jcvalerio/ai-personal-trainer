'use client'

import { useTranslations } from 'next-intl'

interface SimpleHomeClientProps {
  locale: string
}

export default function SimpleHomeClient({ locale }: SimpleHomeClientProps) {
  try {
    const t = useTranslations()

    return (
      <div className="min-h-screen bg-white p-8">
        <h1 className="text-4xl font-bold text-gray-900">{t('hero.title')}</h1>
        <h2 className="text-2xl text-blue-600 mt-2">{t('hero.subtitle')}</h2>
        <p className="mt-4 text-gray-600 max-w-2xl">{t('hero.description')}</p>
        
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-bold mb-4">I18n Test - Current locale: {locale}</h3>
          <p className="mb-2">✅ I18n routing is working!</p>
          <p className="text-sm text-gray-600">
            Navigation: 
            <a href="/en" className="text-blue-600 underline ml-1">English (/en)</a> | 
            <a href="/es" className="text-blue-600 underline ml-1">Español (/es)</a>
          </p>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Translation Test:</h3>
          <ul className="space-y-2">
            <li>Brand: {t('nav.brand')}</li>
            <li>Features: {t('nav.features')}</li>
            <li>Get Started: {t('nav.getStarted')}</li>
          </ul>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <h1 className="text-4xl font-bold text-red-600">Translation Error</h1>
        <p className="text-gray-600 mt-4">Current locale: {locale}</p>
        <p className="text-red-500 mt-2">Error: {String(error)}</p>
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Debug Info:</h3>
          <ul className="space-y-2 text-sm">
            <li>Locale: {locale}</li>
            <li>Component: SimpleHomeClient</li>
            <li>Error occurred while using translations</li>
          </ul>
        </div>
      </div>
    )
  }
}