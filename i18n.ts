import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['en', 'es'] as const
export const defaultLocale = 'en'

export default getRequestConfig(async ({ locale }) => {
  console.log('i18n.ts - Parameter locale received:', locale)
  
  // For Next.js 15 + next-intl v4, locale should be properly passed by the routing
  // If not, we'll rely on the layout to handle message loading
  if (!locale) {
    console.log('i18n.ts - No locale provided, using default:', defaultLocale)
    locale = defaultLocale
  }
  
  console.log('i18n.ts - Loading messages for locale:', locale)
  
  try {
    const messages = (await import(`./messages/${locale}.json`)).default
    console.log('i18n.ts - Successfully loaded messages for:', locale)
    return {
      locale,
      messages
    }
  } catch (error) {
    console.error('i18n.ts - Failed to load messages for locale:', locale, error)
    console.log('i18n.ts - Falling back to default locale:', defaultLocale)
    
    // Fallback to default locale
    try {
      const messages = (await import(`./messages/${defaultLocale}.json`)).default
      return {
        locale: defaultLocale,
        messages
      }
    } catch (fallbackError) {
      console.error('i18n.ts - Even fallback failed:', fallbackError)
      // Return empty messages as last resort
      return {
        locale: defaultLocale,
        messages: {}
      }
    }
  }
})