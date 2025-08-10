'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

interface LanguageSelectorProps {
  currentLocale: string
  className?: string
}

export default function LanguageSelector({ 
  currentLocale, 
  className = '' 
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' }
  ]

  const currentLanguage = languages.find(lang => lang.code === currentLocale)

  const handleLanguageChange = (newLocale: string) => {
    // Save preference
    localStorage.setItem('ai-trainer-language', newLocale)
    document.cookie = `language=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}`
    
    // Navigate to new locale
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
    
    setIsOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-language-selector]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`} data-language-selector>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => handleKeyDown(e, () => setIsOpen(!isOpen))}
        aria-label={`Current language: ${currentLanguage?.nativeName}. Click to change language`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`
          flex items-center gap-2 px-3 py-2 
          bg-white border border-gray-200 rounded-lg
          hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:outline-none
          transition-colors duration-200
          min-h-[44px] min-w-[44px]
          text-gray-700 font-medium
        `}
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{currentLanguage?.nativeName}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className={`
            absolute top-full mt-1 right-0 
            bg-white border border-gray-200 rounded-lg shadow-lg
            py-1 min-w-[140px] z-50
          `}
          role="listbox"
          aria-label="Available languages"
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              onKeyDown={(e) => handleKeyDown(e, () => handleLanguageChange(language.code))}
              role="option"
              aria-selected={currentLocale === language.code}
              className={`
                w-full px-4 py-3 text-left 
                hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                transition-colors duration-150
                ${currentLocale === language.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}
                min-h-[44px]
              `}
            >
              <span className="flex items-center justify-between">
                {language.nativeName}
                {currentLocale === language.code && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}