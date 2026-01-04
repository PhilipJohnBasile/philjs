/**
 * PhilJS i18n Plugin - Client-side utilities
 *
 * Provides client-side i18n functionality including locale detection,
 * storage, and reactive translation helpers.
 */
import type { TranslationMap, I18nContextValue, LocaleConfig } from './types.js';
/**
 * Current locale signal
 */
export declare const currentLocale: import("@philjs/core/signals").Signal<string>;
/**
 * Initialize i18n on the client
 */
export declare function initI18n(config: {
    defaultLocale: string;
    locales: (string | LocaleConfig)[];
    translations?: Record<string, TranslationMap>;
    detectBrowserLocale?: boolean;
    persistLocale?: boolean;
    storageKey?: string;
}): void;
/**
 * Set the current locale
 */
export declare function setLocale(locale: string, options?: {
    persist?: boolean;
    storageKey?: string;
}): void;
/**
 * Load translations for a locale
 */
export declare function loadTranslations(locale: string, loader: () => Promise<TranslationMap>): Promise<void>;
/**
 * Translate a key
 */
export declare function t(key: string, params?: Record<string, string | number>, options?: {
    locale?: string;
    count?: number;
}): string;
/**
 * Check if a translation exists
 */
export declare function hasTranslation(key: string, locale?: string): boolean;
/**
 * Create a reactive translation
 */
export declare function useTranslation(key: string, params?: Record<string, string | number>): () => string;
/**
 * Format a number according to locale
 */
export declare function formatNumber(value: number, options?: Intl.NumberFormatOptions, locale?: string): string;
/**
 * Format a date according to locale
 */
export declare function formatDate(date: Date | number | string, options?: Intl.DateTimeFormatOptions, locale?: string): string;
/**
 * Format currency according to locale
 */
export declare function formatCurrency(value: number, currency?: string, locale?: string): string;
/**
 * Format relative time
 */
export declare function formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, locale?: string): string;
/**
 * Get i18n context value for use with Context API
 */
export declare function getI18nContext(): I18nContextValue;
/**
 * Language switcher helper - get all available locales with their configs
 */
export declare function getAvailableLocales(): LocaleConfig[];
/**
 * Check if locale is RTL
 */
export declare function isRTL(locale?: string): boolean;
//# sourceMappingURL=client.d.ts.map