'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { locales } from '../../i18n';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';

interface ModernLocaleSwitchProps {
  locale: string;
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

export function ModernLocaleSwitch({
  locale,
  variant = 'default',
  className = '',
}: ModernLocaleSwitchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('locale');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleLocaleChange = (newLocale: string) => {
    // Remove current locale from pathname if present
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';

    // Navigate to the same path with new locale
    // Since localePrefix is set to 'always', all locales including 'en' need a prefix
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
    setIsOpen(false);
  };

  const getLocaleInfo = (loc: string) => {
    switch (loc) {
      case 'en':
        return {
          flag: '🇺🇸',
          name: t('english'),
          nativeName: 'English',
        };
      case 'es':
        return {
          flag: '🇪🇸',
          name: t('spanish'),
          nativeName: 'Español',
        };
      default:
        return {
          flag: '🌐',
          name: loc.toUpperCase(),
          nativeName: loc.toUpperCase(),
        };
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const currentLocale = getLocaleInfo(locale);

  if (variant === 'icon-only') {
    return (
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className='flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          aria-label={t('current', { language: currentLocale.nativeName })}
          aria-expanded={isOpen}
          aria-haspopup='listbox'
        >
          <Globe className='h-5 w-5' />
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className='animate-in fade-in-0 zoom-in-95 absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg duration-200'
            role='listbox'
          >
            {locales.map((loc) => {
              const localeInfo = getLocaleInfo(loc);
              const isSelected = loc === locale;

              return (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                  role='option'
                  aria-selected={isSelected}
                >
                  <span className='flex-shrink-0 text-lg'>
                    {localeInfo.flag}
                  </span>
                  <span className='flex-1 font-medium'>
                    {localeInfo.nativeName}
                  </span>
                  {isSelected && <Check className='h-4 w-4 text-blue-600' />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          aria-label={t('current', { language: currentLocale.nativeName })}
          aria-expanded={isOpen}
          aria-haspopup='listbox'
        >
          <span className='text-base'>{currentLocale.flag}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className='animate-in fade-in-0 zoom-in-95 absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg duration-200'
            role='listbox'
          >
            {locales.map((loc) => {
              const localeInfo = getLocaleInfo(loc);
              const isSelected = loc === locale;

              return (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                  role='option'
                  aria-selected={isSelected}
                >
                  <span className='flex-shrink-0 text-lg'>
                    {localeInfo.flag}
                  </span>
                  <span className='flex-1 font-medium'>
                    {localeInfo.nativeName}
                  </span>
                  {isSelected && <Check className='h-4 w-4 text-blue-600' />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className='flex min-w-[140px] items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
        aria-label={t('current', { language: currentLocale.nativeName })}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
      >
        <span className='flex-shrink-0 text-lg'>{currentLocale.flag}</span>
        <span className='flex-1 text-left'>{currentLocale.nativeName}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className='animate-in fade-in-0 zoom-in-95 absolute right-0 top-full z-50 mt-2 w-full min-w-[180px] rounded-lg border border-gray-200 bg-white py-2 shadow-lg duration-200'
          role='listbox'
        >
          {locales.map((loc) => {
            const localeInfo = getLocaleInfo(loc);
            const isSelected = loc === locale;

            return (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
                role='option'
                aria-selected={isSelected}
              >
                <span className='flex-shrink-0 text-lg'>{localeInfo.flag}</span>
                <div className='flex-1'>
                  <div className='font-medium'>{localeInfo.nativeName}</div>
                  <div className='text-xs text-gray-500'>{localeInfo.name}</div>
                </div>
                {isSelected && <Check className='h-4 w-4 text-blue-600' />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
