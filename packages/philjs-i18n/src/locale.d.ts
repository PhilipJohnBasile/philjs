/**
 * Locale Detection and Management
 *
 * Utilities for detecting, parsing, and managing locales
 */
export interface ParsedLocale {
    language: string;
    script?: string;
    region?: string;
    variants?: string[];
    extensions?: Map<string, string>;
    privateUse?: string;
    baseName: string;
}
/**
 * Parse a BCP 47 locale tag
 */
export declare function parseLocale(locale: string): ParsedLocale;
/**
 * Normalize a locale string to standard format
 */
export declare function normalizeLocale(locale: string): string;
/**
 * Check if a locale string is valid
 */
export declare function isValidLocale(locale: string): boolean;
/**
 * Get the language part of a locale
 */
export declare function getLanguage(locale: string): string;
/**
 * Get the region part of a locale
 */
export declare function getRegion(locale: string): string | undefined;
/**
 * Get browser's preferred locales
 */
export declare function getBrowserLocales(): string[];
/**
 * Get the primary browser locale
 */
export declare function getBrowserLocale(): string;
/**
 * Detect locale from URL (e.g., /en/page or ?lang=en)
 */
export declare function detectLocaleFromUrl(options?: {
    pathIndex?: number;
    paramName?: string;
}): string | null;
/**
 * Detect locale from cookie
 */
export declare function detectLocaleFromCookie(cookieName?: string): string | null;
/**
 * Detect locale from localStorage
 */
export declare function detectLocaleFromStorage(key?: string): string | null;
/**
 * Detect locale from HTML lang attribute
 */
export declare function detectLocaleFromDocument(): string | null;
export interface LocaleDetectionOptions {
    /** Order of detection sources */
    sources?: Array<'url' | 'cookie' | 'storage' | 'document' | 'browser'>;
    /** Available locales to match against */
    availableLocales?: string[];
    /** Fallback locale if none detected */
    fallback?: string;
    /** URL detection options */
    urlOptions?: {
        pathIndex?: number;
        paramName?: string;
    };
    /** Cookie name for detection */
    cookieName?: string;
    /** LocalStorage key for detection */
    storageKey?: string;
}
/**
 * Detect locale from multiple sources
 */
export declare function detectLocale(options?: LocaleDetectionOptions): string;
/**
 * Find the best matching locale from available options
 */
export declare function matchLocale(requested: string | string[], available: string[], fallback?: string): string | undefined;
/**
 * Find best matches using Intl.LocaleMatcher algorithm
 */
export declare function negotiateLocales(requested: string[], available: string[], defaultLocale: string): string[];
/**
 * Save locale to cookie
 */
export declare function saveLocaleToCookie(locale: string, cookieName?: string, options?: {
    maxAge?: number;
    path?: string;
    sameSite?: string;
}): void;
/**
 * Save locale to localStorage
 */
export declare function saveLocaleToStorage(locale: string, key?: string): void;
/**
 * Update HTML lang attribute
 */
export declare function updateDocumentLocale(locale: string): void;
export interface LocaleManagerOptions {
    defaultLocale: string;
    availableLocales: string[];
    persistTo?: Array<'cookie' | 'storage' | 'document'>;
    detectOnInit?: boolean;
    detectionOptions?: LocaleDetectionOptions;
}
export interface LocaleManager {
    locale: () => string;
    setLocale: (locale: string) => void;
    getAvailableLocales: () => string[];
    isAvailable: (locale: string) => boolean;
}
/**
 * Create a reactive locale manager
 */
export declare function createLocaleManager(options: LocaleManagerOptions): LocaleManager;
