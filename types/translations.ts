/**
 * TypeScript definitions for translation keys
 * Provides type safety for translation usage
 */

// Import the English messages as the base type
import type messages from '../messages/en.json';

// Export the messages type for use in other files
export type Messages = typeof messages;

// Declare module augmentation for next-intl
declare module 'next-intl' {
  interface IntlMessages extends Messages {}
}

// Utility types for nested translation keys
export type TranslationKeys = keyof Messages;
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type AllTranslationKeys = NestedKeyOf<Messages>;

// Specific type unions for common translation namespaces
export type NavKeys = keyof Messages['nav'];
export type HeroKeys = keyof Messages['hero'];
export type FeaturesKeys = keyof Messages['features'];
export type DashboardKeys = keyof Messages['dashboard'];

// Helper type for translation parameters
export type TranslationValues = Record<
  string,
  string | number | boolean | Date
>;

// Custom hook type for typed translations
export interface TypedTranslations {
  t: (key: AllTranslationKeys, values?: TranslationValues) => string;
}
