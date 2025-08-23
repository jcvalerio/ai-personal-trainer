import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { locales } from '../../i18n';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  console.log('Layout - Locale received:', locale);

  // Validate that the incoming locale is valid
  if (!locales.includes(locale as any)) {
    console.log('Layout - Invalid locale, redirecting to not found');
    notFound();
  }

  // Use next-intl's getMessages to get the messages for this locale
  // This will use the i18n.ts config we set up
  const messages = await getMessages({ locale });
  console.log('Layout - Messages loaded for locale:', locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
