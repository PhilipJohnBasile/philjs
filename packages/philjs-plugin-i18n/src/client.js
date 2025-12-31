/**
 * PhilJS i18n Plugin - Client-side utilities
 *
 * Provides client-side i18n functionality including locale detection,
 * storage, and reactive translation helpers.
 */
import { signal, memo } from 'philjs-core/signals';
/**
 * Current locale signal
 */
export const currentLocale = signal('en');
/**
 * Translations store
 */
const translations = signal({});
/**
 * Locale configs store
 */
const localeConfigs = signal(new Map());
/**
 * Initialize i18n on the client
 */
export function initI18n(config) {
    const { defaultLocale, locales, translations: initialTranslations = {}, detectBrowserLocale = true, persistLocale = true, storageKey = 'philjs-locale', } = config;
    // Set up locale configs
    const configs = new Map();
    for (const locale of locales) {
        if (typeof locale === 'string') {
            configs.set(locale, { code: locale, name: locale });
        }
        else {
            configs.set(locale.code, locale);
        }
    }
    localeConfigs.set(configs);
    // Set translations
    translations.set(initialTranslations);
    // Determine initial locale
    let initialLocale = defaultLocale;
    // Check localStorage first
    if (persistLocale && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(storageKey);
        if (stored && configs.has(stored)) {
            initialLocale = stored;
        }
    }
    // Detect browser locale if enabled and no stored preference
    if (detectBrowserLocale && initialLocale === defaultLocale && typeof navigator !== 'undefined') {
        const browserLocale = navigator.language;
        const browserLang = browserLocale.split('-')[0];
        if (browserLocale && configs.has(browserLocale)) {
            initialLocale = browserLocale;
        }
        else if (browserLang && configs.has(browserLang)) {
            initialLocale = browserLang;
        }
    }
    currentLocale.set(initialLocale);
}
/**
 * Set the current locale
 */
export function setLocale(locale, options) {
    const { persist = true, storageKey = 'philjs-locale' } = options ?? {};
    if (!localeConfigs().has(locale)) {
        console.warn(`[philjs-i18n] Locale "${locale}" is not configured`);
        return;
    }
    currentLocale.set(locale);
    // Persist to localStorage
    if (persist && typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, locale);
    }
    // Update document lang attribute
    if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
        const config = localeConfigs().get(locale);
        if (config?.dir) {
            document.documentElement.dir = config.dir;
        }
    }
}
/**
 * Load translations for a locale
 */
export async function loadTranslations(locale, loader) {
    try {
        const loaded = await loader();
        translations.set({
            ...translations(),
            [locale]: loaded,
        });
    }
    catch (error) {
        console.error(`[philjs-i18n] Failed to load translations for "${locale}":`, error);
        throw error;
    }
}
/**
 * Translate a key
 */
export function t(key, params, options) {
    const locale = options?.locale ?? currentLocale();
    const localeTranslations = translations()[locale];
    if (!localeTranslations) {
        console.warn(`[philjs-i18n] No translations loaded for "${locale}"`);
        return key;
    }
    // Resolve nested key (e.g., "common.buttons.submit")
    const keys = key.split('.');
    let value = localeTranslations;
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        }
        else {
            console.warn(`[philjs-i18n] Missing translation: "${key}" for locale "${locale}"`);
            return key;
        }
    }
    if (typeof value !== 'string') {
        // Handle plural forms
        if (typeof value === 'object' && options?.count !== undefined) {
            const pluralValue = resolvePlural(value, options.count, locale);
            if (pluralValue) {
                value = pluralValue;
            }
            else {
                return key;
            }
        }
        else {
            console.warn(`[philjs-i18n] Translation "${key}" is not a string`);
            return key;
        }
    }
    // Interpolate parameters
    if (params) {
        return interpolate(value, { ...params, count: options?.count });
    }
    return value;
}
/**
 * Check if a translation exists
 */
export function hasTranslation(key, locale) {
    const targetLocale = locale ?? currentLocale();
    const localeTranslations = translations()[targetLocale];
    if (!localeTranslations)
        return false;
    const keys = key.split('.');
    let value = localeTranslations;
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        }
        else {
            return false;
        }
    }
    return true;
}
/**
 * Create a reactive translation
 */
export function useTranslation(key, params) {
    return memo(() => t(key, params));
}
/**
 * Resolve plural form based on count
 */
function resolvePlural(forms, count, locale) {
    const pluralRules = new Intl.PluralRules(locale);
    const category = pluralRules.select(count);
    switch (category) {
        case 'zero':
            return forms.zero ?? forms.other;
        case 'one':
            return forms.one;
        case 'two':
            return forms.two ?? forms.other;
        case 'few':
            return forms.few ?? forms.other;
        case 'many':
            return forms.many ?? forms.other;
        default:
            return forms.other;
    }
}
/**
 * Interpolate variables in a string
 */
function interpolate(template, params) {
    if (!params)
        return template;
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = params[key];
        return value !== undefined ? String(value) : `{{${key}}}`;
    });
}
/**
 * Format a number according to locale
 */
export function formatNumber(value, options, locale) {
    const targetLocale = locale ?? currentLocale();
    return new Intl.NumberFormat(targetLocale, options).format(value);
}
/**
 * Format a date according to locale
 */
export function formatDate(date, options, locale) {
    const targetLocale = locale ?? currentLocale();
    const dateObj = typeof date === 'string' || typeof date === 'number'
        ? new Date(date)
        : date;
    return new Intl.DateTimeFormat(targetLocale, options).format(dateObj);
}
/**
 * Format currency according to locale
 */
export function formatCurrency(value, currency, locale) {
    const targetLocale = locale ?? currentLocale();
    const config = localeConfigs().get(targetLocale);
    const currencyCode = currency ?? config?.currency ?? 'USD';
    return new Intl.NumberFormat(targetLocale, {
        style: 'currency',
        currency: currencyCode,
    }).format(value);
}
/**
 * Format relative time
 */
export function formatRelativeTime(value, unit, locale) {
    const targetLocale = locale ?? currentLocale();
    return new Intl.RelativeTimeFormat(targetLocale, { numeric: 'auto' }).format(value, unit);
}
/**
 * Get i18n context value for use with Context API
 */
export function getI18nContext() {
    return {
        get locale() {
            return currentLocale();
        },
        get locales() {
            return Array.from(localeConfigs().keys());
        },
        setLocale,
        t,
        hasTranslation,
        getLocaleConfig: (locale) => {
            return localeConfigs().get(locale ?? currentLocale());
        },
        formatNumber,
        formatDate,
        formatCurrency,
        formatRelativeTime,
    };
}
/**
 * Language switcher helper - get all available locales with their configs
 */
export function getAvailableLocales() {
    return Array.from(localeConfigs().values());
}
/**
 * Check if locale is RTL
 */
export function isRTL(locale) {
    const targetLocale = locale ?? currentLocale();
    const config = localeConfigs().get(targetLocale);
    return config?.dir === 'rtl';
}
//# sourceMappingURL=client.js.map