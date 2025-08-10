'use client'

import { useRouter, usePathname } from 'next/navigation'
import { locales } from '../../i18n'

interface LocaleSwitchProps {
  locale: string
}

export function LocaleSwitch({ locale }: LocaleSwitchProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: string) => {
    // Remove current locale from pathname if present
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
    
    // Navigate to the same path with new locale
    const newPath = newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`
    router.push(newPath)
  }

  const getLocaleLabel = (loc: string) => {
    switch (loc) {
      case 'en':
        return '🇺🇸 English'
      case 'es':
        return '🇪🇸 Español'
      default:
        return loc.toUpperCase()
    }
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        aria-label="Select language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {getLocaleLabel(loc)}
          </option>
        ))}
      </select>
    </div>
  )
}