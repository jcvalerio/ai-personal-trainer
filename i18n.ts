import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['en', 'es'] as const
export const defaultLocale = 'en'

export default getRequestConfig(async ({ locale }) => {
  console.log('i18n.ts - Parameter locale received:', locale)
  
  // Validate locale is supported
  const validLocale = locale && locales.includes(locale as any) ? locale : defaultLocale
  
  if (validLocale !== locale) {
    console.log(`i18n.ts - Invalid locale "${locale}", using default:`, validLocale)
  }
  
  console.log('i18n.ts - Loading messages for locale:', validLocale)
  
  try {
    // Dynamic import with better error handling
    const messages = (await import(`./messages/${validLocale}.json`)).default
    
    // Validate that messages object is not empty
    if (!messages || typeof messages !== 'object' || Object.keys(messages).length === 0) {
      throw new Error(`Empty or invalid messages object for locale: ${validLocale}`)
    }
    
    console.log('i18n.ts - Successfully loaded messages for:', validLocale, 'Keys:', Object.keys(messages).join(', '))
    
    return {
      locale: validLocale,
      messages,
      // Add timeZone for better internationalization
      timeZone: validLocale === 'es' ? 'Europe/Madrid' : 'America/New_York'
    }
  } catch (error) {
    console.error('i18n.ts - Failed to load messages for locale:', validLocale, error)
    
    // If we're already trying the default locale, return empty messages
    if (validLocale === defaultLocale) {
      console.error('i18n.ts - Critical: Default locale failed to load!')
      return {
        locale: defaultLocale,
        messages: {},
        timeZone: 'America/New_York'
      }
    }
    
    // Fallback to default locale
    console.log('i18n.ts - Falling back to default locale:', defaultLocale)
    try {
      const messages = (await import(`./messages/${defaultLocale}.json`)).default
      return {
        locale: defaultLocale,
        messages,
        timeZone: 'America/New_York'
      }
    } catch (fallbackError) {
      console.error('i18n.ts - Critical: Even fallback failed:', fallbackError)
      return {
        locale: defaultLocale,
        messages: {},
        timeZone: 'America/New_York'
      }
    }
  }
})