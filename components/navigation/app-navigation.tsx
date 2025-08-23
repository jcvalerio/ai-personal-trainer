'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Dumbbell,
  Menu,
  X,
  Home,
  Activity,
  Users,
  BarChart3,
} from 'lucide-react';
import { ModernLocaleSwitch } from '../ui/modern-locale-switch';
import { useState } from 'react';

interface AppNavigationProps {
  locale: string;
  variant?: 'dashboard' | 'app' | 'workouts' | 'progress' | 'organizations';
  className?: string;
}

export function AppNavigation({
  locale,
  variant = 'app',
  className = '',
}: AppNavigationProps) {
  const tNav = useTranslations('nav');
  const tDashboard = useTranslations('dashboard');
  const tLocale = useTranslations('locale');
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigationLinks = [
    {
      href: `/${locale}/dashboard`,
      label: tNav('dashboard'),
      icon: Home,
      active: pathname === `/${locale}/dashboard`,
    },
    {
      href: `/${locale}/workouts`,
      label: tNav('myWorkouts'),
      icon: Dumbbell,
      active: pathname.startsWith(`/${locale}/workouts`),
    },
    {
      href: `/${locale}/progress`,
      label: tNav('progress'),
      icon: BarChart3,
      active: pathname === `/${locale}/progress`,
    },
    {
      href: `/${locale}/organizations`,
      label: tNav('community'),
      icon: Users,
      active: pathname === `/${locale}/organizations`,
    },
  ];

  const brandName =
    variant === 'dashboard' ? tDashboard('title') : tNav('brand');

  return (
    <header
      className={`sticky top-0 z-40 border-b border-gray-200 bg-white ${className}`}
    >
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Brand Logo */}
          <Link
            href={`/${locale}/dashboard`}
            className='flex items-center gap-3 transition-opacity hover:opacity-80'
          >
            <div className='rounded-xl bg-blue-100 p-2'>
              <Dumbbell className='h-6 w-6 text-blue-600' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>{brandName}</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden items-center gap-6 md:flex'>
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    link.active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className='h-4 w-4' />
                  <span className='hidden lg:inline'>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className='flex items-center gap-3'>
            {/* Language Switcher */}
            <ModernLocaleSwitch
              locale={locale}
              variant='compact'
              className='hidden sm:block'
            />

            {/* User Profile */}
            {user && (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                    userButtonPopoverCard: 'shadow-lg border border-gray-200',
                    userButtonPopoverActionButton: 'hover:bg-gray-50',
                  },
                }}
                showName={false}
              />
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 md:hidden'
              aria-label={tNav('toggleMenu')}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className='h-5 w-5' />
              ) : (
                <Menu className='h-5 w-5' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className='border-t border-gray-200 py-4 md:hidden'>
            <nav className='space-y-2'>
              {navigationLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                      link.active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className='h-5 w-5' />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Language Switcher */}
            <div className='mt-4 border-t border-gray-200 pt-4'>
              <div className='px-3 py-2'>
                <p className='mb-2 text-xs font-medium uppercase tracking-wide text-gray-500'>
                  {tLocale('select')}
                </p>
                <ModernLocaleSwitch
                  locale={locale}
                  variant='default'
                  className='w-full'
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
