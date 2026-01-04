/**
 * First-class internationalization (i18n) system.
 * Route-based locales, automatic extraction, AI-powered translations.
 */
export type Locale = string;
export type TranslationKey = string;
export type Translations = {
    [key: string]: string | Translations;
};
export type PluralRules = {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
};
export type I18nConfig = {
    /** Default locale */
    defaultLocale: Locale;
    /** Supported locales */
    locales: Locale[];
    /** Translation messages */
    messages: Record<Locale, Translations>;
    /** Fallback locale when translation missing */
    fallbackLocale?: Locale;
    /** Auto-detect locale from browser/headers */
    autoDetect?: boolean;
    /** Route-based locale detection pattern */
    routePattern?: string;
};
export type FormatOptions = {
    /** Variables to interpolate */
    vars?: Record<string, string | number>;
    /** Plural count for plural forms */
    count?: number;
    /** Date/number formatting options */
    format?: Intl.DateTimeFormatOptions | Intl.NumberFormatOptions;
};
/**
 * I18n provider component.
 */
export declare function I18nProvider(props: {
    config: I18nConfig;
    children: any;
}): import("./jsx-runtime.js").JSXElement;
/**
 * Hook to use i18n in components.
 */
export declare function useI18n(): {
    locale: () => Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey, options?: FormatOptions) => string;
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
    formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
    formatCurrency: (amount: number, currency: string) => string;
    getAvailableLocales: () => Locale[];
};
/**
 * Hook for simple translation.
 */
export declare function useTranslation(): (key: TranslationKey, options?: FormatOptions) => string;
/**
 * Automatic translation extraction tool.
 */
export declare class TranslationExtractor {
    private keys;
    private usage;
    /**
     * Extract translation keys from source code.
     */
    extractFromCode(code: string, filePath: string): void;
    /**
     * Generate translation file template.
     */
    generateTemplate(locale: Locale): Translations;
    /**
     * Get all extracted keys.
     */
    getKeys(): string[];
    /**
     * Get usage information for a key.
     */
    getUsage(key: string): {
        file: string;
        line: number;
    }[];
    /**
     * Find missing translations.
     */
    findMissing(translations: Translations): string[];
    /**
     * Find unused translations.
     */
    findUnused(translations: Translations): string[];
}
/**
 * AI-powered translation service.
 */
export declare class AITranslationService {
    private apiKey;
    constructor(apiKey?: string);
    /**
     * Translate text using AI.
     */
    translate(text: string, sourceLocale: Locale, targetLocale: Locale): Promise<string>;
    /**
     * Batch translate all missing keys.
     */
    translateBatch(keys: string[], sourceTranslations: Translations, sourceLocale: Locale, targetLocale: Locale): Promise<Translations>;
    /**
     * Suggest improvements for existing translations.
     */
    suggestImprovements(translation: string, context: string, locale: Locale): Promise<string[]>;
}
/**
 * Route-based locale detection middleware.
 */
export declare function createLocaleMiddleware(config: I18nConfig): (request: Request) => Locale;
//# sourceMappingURL=i18n.d.ts.map