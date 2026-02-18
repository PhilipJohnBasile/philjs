export type TranslationMap = Record<string, any>;
export interface I18nConfig {
    defaultLocale: string;
    translations: Record<string, TranslationMap>;
    fallbackLocale?: string;
    debug?: boolean;
}
export interface I18n {
    locale: () => string;
    setLocale: (newLocale: string) => void;
    getAvailableLocales: () => string[];
    t: (key: string, params?: Record<string, any>) => string;
}
export declare function createI18n(config: I18nConfig): I18n;
export declare const pluralRules: Record<string, (count: number) => string>;
export declare function createPlural(rules: typeof pluralRules): (locale: string, count: number, forms: string[]) => string;
