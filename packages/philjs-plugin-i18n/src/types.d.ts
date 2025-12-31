/**
 * PhilJS i18n Plugin Types
 */
/**
 * Translation value - string or nested translations
 */
export type TranslationValue = string | TranslationMap;
/**
 * Translation map - nested key-value structure
 */
export interface TranslationMap {
    [key: string]: TranslationValue;
}
/**
 * Locale configuration
 */
export interface LocaleConfig {
    /** Locale code (e.g., 'en', 'en-US') */
    code: string;
    /** Display name */
    name: string;
    /** Text direction */
    dir?: 'ltr' | 'rtl';
    /** Date format */
    dateFormat?: string;
    /** Number format */
    numberFormat?: Intl.NumberFormatOptions;
    /** Currency */
    currency?: string;
}
/**
 * i18n plugin configuration
 */
export interface I18nPluginConfig {
    /** Default locale */
    defaultLocale: string;
    /** Supported locales */
    locales: string[] | LocaleConfig[];
    /** Fallback locale */
    fallbackLocale?: string;
    /** Translations directory */
    translationsDir?: string;
    /** Translation file format */
    format?: 'json' | 'yaml' | 'js' | 'ts';
    /** Enable auto-detection of browser locale */
    detectBrowserLocale?: boolean;
    /** Persist locale to localStorage */
    persistLocale?: boolean;
    /** localStorage key for persisting locale */
    storageKey?: string;
    /** Enable debug mode */
    debug?: boolean;
    /** Missing translation handler */
    onMissingTranslation?: 'warn' | 'error' | 'ignore' | ((key: string, locale: string) => string);
    /** URL strategy for locales */
    urlStrategy?: 'prefix' | 'subdomain' | 'query' | 'none';
    /** Route prefix format (for 'prefix' strategy) */
    routePrefix?: string;
    /** SEO meta tags integration */
    seo?: boolean;
}
/**
 * Loaded translations
 */
export interface LoadedTranslations {
    [locale: string]: TranslationMap;
}
/**
 * Interpolation options
 */
export interface InterpolationOptions {
    /** Interpolation prefix (default: '{{') */
    prefix?: string;
    /** Interpolation suffix (default: '}}') */
    suffix?: string;
    /** Escape HTML by default */
    escapeHtml?: boolean;
}
/**
 * Plural rules
 */
export interface PluralRules {
    zero?: string;
    one: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
}
/**
 * i18n context value
 */
export interface I18nContextValue {
    /** Current locale */
    locale: string;
    /** All supported locales */
    locales: string[];
    /** Set current locale */
    setLocale: (locale: string) => void;
    /** Translate a key */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Check if a translation exists */
    hasTranslation: (key: string) => boolean;
    /** Get locale config */
    getLocaleConfig: (locale?: string) => LocaleConfig | undefined;
    /** Format a number */
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
    /** Format a date */
    formatDate: (date: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
    /** Format currency */
    formatCurrency: (value: number, currency?: string) => string;
    /** Format relative time */
    formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => string;
}
/**
 * Vite plugin options
 */
export interface ViteI18nPluginOptions {
    /** Source directory for translations */
    translationsDir: string;
    /** Output virtual module ID */
    virtualModuleId?: string;
    /** Watch for changes */
    watch?: boolean;
    /** Generate TypeScript types */
    generateTypes?: boolean;
    /** Type output path */
    typesOutputPath?: string;
}
//# sourceMappingURL=types.d.ts.map