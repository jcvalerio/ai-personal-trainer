'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  currentLocale: string;
  className?: string;
}

export default function LanguageSelector({
  currentLocale,
  className = '',
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === currentLocale);

  const handleLanguageChange = (newLocale: string) => {
    // Save preference
    localStorage.setItem('ai-trainer-language', newLocale);
    document.cookie = `language=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}`;

    // Navigate to new locale
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));

    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-language-selector]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }

    return undefined;
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} data-language-selector>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => handleKeyDown(e, () => setIsOpen(!isOpen))}
        aria-label={`Current language: ${currentLanguage?.nativeName}. Click to change language`}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        className={`flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500`}
      >
        <Globe className='h-4 w-4' aria-hidden='true' />
        <span className='hidden sm:inline'>{currentLanguage?.nativeName}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='m19 9-7 7-7-7'
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg`}
          role='listbox'
          aria-label='Available languages'
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              onKeyDown={(e) =>
                handleKeyDown(e, () => handleLanguageChange(language.code))
              }
              role='option'
              aria-selected={currentLocale === language.code}
              className={`w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${currentLocale === language.code ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'} min-h-[44px]`}
            >
              <span className='flex items-center justify-between'>
                {language.nativeName}
                {currentLocale === language.code && (
                  <svg
                    className='h-4 w-4 text-blue-600'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                    aria-hidden='true'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
