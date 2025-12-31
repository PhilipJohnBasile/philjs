/**
 * PhilJS Internationalization (i18n) Package
 *
 * A type-safe i18n solution for PhilJS applications
 */
import type { Signal } from 'philjs-core';
export interface TranslationMap {
    [key: string]: string | TranslationMap;
}
export interface I18nOptions<T extends TranslationMap = TranslationMap> {
    defaultLocale: string;
    translations: Record<string, T>;
    fallbackLocale?: string;
}
export interface I18n<T extends TranslationMap = TranslationMap> {
    locale: Signal<string>;
    t: (key: string, params?: Record<string, string | number>) => string;
    setLocale: (locale: string) => void;
    getAvailableLocales: () => string[];
}
/**
 * Creates an i18n instance for managing translations
 */
export declare function createI18n<T extends TranslationMap>(options: I18nOptions<T>): I18n<T>;
/**
 * Creates a pluralization function
 */
export declare function createPlural(rules: Record<string, (n: number) => string>): (locale: string, n: number, forms: string[]) => string;
/**
 * Common pluralization rules
 */
export declare const pluralRules: Record<string, (n: number) => string>;
export default createI18n;
//# sourceMappingURL=index.d.ts.map