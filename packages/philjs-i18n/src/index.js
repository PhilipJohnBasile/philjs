/**
 * PhilJS Internationalization (i18n) Package
 *
 * A type-safe i18n solution for PhilJS applications
 */
import { signal } from '@philjs/core';
/**
 * Creates an i18n instance for managing translations
 */
export function createI18n(options) {
    const { defaultLocale, translations, fallbackLocale } = options;
    const locale = signal(defaultLocale);
    function getNestedValue(obj, path) {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (typeof current !== 'object' || current === null) {
                return undefined;
            }
            current = current[key];
        }
        return typeof current === 'string' ? current : undefined;
    }
    function interpolate(template, params) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key]?.toString() ?? match;
        });
    }
    function t(key, params) {
        const currentLocale = locale();
        const currentTranslations = translations[currentLocale];
        let value = currentTranslations ? getNestedValue(currentTranslations, key) : undefined;
        if (!value && fallbackLocale && fallbackLocale !== currentLocale) {
            const fallbackTranslations = translations[fallbackLocale];
            value = fallbackTranslations ? getNestedValue(fallbackTranslations, key) : undefined;
        }
        if (!value) {
            console.warn(`Missing translation for key: ${key}`);
            return key;
        }
        return params ? interpolate(value, params) : value;
    }
    function setLocale(newLocale) {
        if (!translations[newLocale]) {
            console.warn(`Locale ${newLocale} not found in translations`);
            return;
        }
        locale.set(newLocale);
    }
    function getAvailableLocales() {
        return Object.keys(translations);
    }
    return {
        locale,
        t,
        setLocale,
        getAvailableLocales
    };
}
/**
 * Creates a pluralization function
 */
export function createPlural(rules) {
    return (locale, n, forms) => {
        const rule = rules[locale];
        if (!rule) {
            // Default to simple singular/plural
            return n === 1 ? (forms[0] ?? '') : (forms[1] ?? forms[0] ?? '');
        }
        const key = rule(n);
        if (forms.length === 0)
            return '';
        if (forms.length === 1)
            return forms[0] ?? '';
        if (forms.length === 2) {
            return key === 'one' ? (forms[0] ?? '') : (forms[1] ?? forms[0] ?? '');
        }
        const order = ['zero', 'one', 'two', 'few', 'many', 'other'];
        const index = order.indexOf(key);
        return forms[index] ?? forms[forms.length - 1] ?? '';
    };
}
/**
 * Common pluralization rules
 */
export const pluralRules = {
    en: (n) => n === 1 ? 'one' : 'other',
    fr: (n) => n === 0 || n === 1 ? 'one' : 'other',
    de: (n) => n === 1 ? 'one' : 'other',
    es: (n) => n === 1 ? 'one' : 'other',
    ru: (n) => {
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11)
            return 'one';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
            return 'few';
        return 'many';
    }
};
export default createI18n;
//# sourceMappingURL=index.js.map