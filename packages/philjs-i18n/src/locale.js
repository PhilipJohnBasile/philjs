/**
 * Locale Detection and Management
 *
 * Utilities for detecting, parsing, and managing locales
 */
import { signal } from '@philjs/core';
/**
 * Parse a BCP 47 locale tag
 */
export function parseLocale(locale) {
    const intlLocale = new Intl.Locale(locale);
    return {
        language: intlLocale.language,
        script: intlLocale.script,
        region: intlLocale.region,
        baseName: intlLocale.baseName,
    };
}
/**
 * Normalize a locale string to standard format
 */
export function normalizeLocale(locale) {
    try {
        return new Intl.Locale(locale).baseName;
    }
    catch {
        return locale;
    }
}
/**
 * Check if a locale string is valid
 */
export function isValidLocale(locale) {
    try {
        new Intl.Locale(locale);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Get the language part of a locale
 */
export function getLanguage(locale) {
    try {
        return new Intl.Locale(locale).language;
    }
    catch {
        return locale.split('-')[0]?.toLowerCase() || locale;
    }
}
/**
 * Get the region part of a locale
 */
export function getRegion(locale) {
    try {
        return new Intl.Locale(locale).region;
    }
    catch {
        const parts = locale.split('-');
        return parts.length > 1 ? parts[1]?.toUpperCase() : undefined;
    }
}
// ============================================================================
// Locale Detection
// ============================================================================
/**
 * Get browser's preferred locales
 */
export function getBrowserLocales() {
    if (typeof navigator === 'undefined')
        return ['en-US'];
    const languages = navigator.languages;
    if (languages && languages.length > 0) {
        return [...languages];
    }
    return [navigator.language || 'en-US'];
}
/**
 * Get the primary browser locale
 */
export function getBrowserLocale() {
    return getBrowserLocales()[0] || 'en-US';
}
/**
 * Detect locale from URL (e.g., /en/page or ?lang=en)
 */
export function detectLocaleFromUrl(options = {}) {
    if (typeof window === 'undefined')
        return null;
    const { pathIndex = 0, paramName = 'lang' } = options;
    // Try URL search params
    const params = new URLSearchParams(window.location.search);
    const paramLocale = params.get(paramName);
    if (paramLocale && isValidLocale(paramLocale)) {
        return normalizeLocale(paramLocale);
    }
    // Try path segments
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const pathLocale = pathParts[pathIndex];
    if (pathLocale && isValidLocale(pathLocale)) {
        return normalizeLocale(pathLocale);
    }
    return null;
}
/**
 * Detect locale from cookie
 */
export function detectLocaleFromCookie(cookieName = 'locale') {
    if (typeof document === 'undefined')
        return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === cookieName && value && isValidLocale(value)) {
            return normalizeLocale(value);
        }
    }
    return null;
}
/**
 * Detect locale from localStorage
 */
export function detectLocaleFromStorage(key = 'locale') {
    if (typeof localStorage === 'undefined')
        return null;
    const stored = localStorage.getItem(key);
    if (stored && isValidLocale(stored)) {
        return normalizeLocale(stored);
    }
    return null;
}
/**
 * Detect locale from HTML lang attribute
 */
export function detectLocaleFromDocument() {
    if (typeof document === 'undefined')
        return null;
    const lang = document.documentElement.lang;
    if (lang && isValidLocale(lang)) {
        return normalizeLocale(lang);
    }
    return null;
}
/**
 * Detect locale from multiple sources
 */
export function detectLocale(options = {}) {
    const { sources = ['url', 'cookie', 'storage', 'document', 'browser'], availableLocales, fallback = 'en-US', urlOptions, cookieName, storageKey, } = options;
    for (const source of sources) {
        let detected = null;
        switch (source) {
            case 'url':
                detected = detectLocaleFromUrl(urlOptions);
                break;
            case 'cookie':
                detected = detectLocaleFromCookie(cookieName);
                break;
            case 'storage':
                detected = detectLocaleFromStorage(storageKey);
                break;
            case 'document':
                detected = detectLocaleFromDocument();
                break;
            case 'browser':
                detected = getBrowserLocale();
                break;
        }
        if (detected) {
            // If we have available locales, try to match
            if (availableLocales) {
                const matched = matchLocale(detected, availableLocales);
                if (matched)
                    return matched;
            }
            else {
                return detected;
            }
        }
    }
    return fallback;
}
// ============================================================================
// Locale Matching
// ============================================================================
/**
 * Find the best matching locale from available options
 */
export function matchLocale(requested, available, fallback) {
    const requests = Array.isArray(requested) ? requested : [requested];
    for (const req of requests) {
        // Exact match
        if (available.includes(req)) {
            return req;
        }
        // Try base name match
        const baseName = normalizeLocale(req);
        if (available.includes(baseName)) {
            return baseName;
        }
        // Try language-only match
        const language = getLanguage(req);
        const languageMatch = available.find((a) => getLanguage(a) === language);
        if (languageMatch) {
            return languageMatch;
        }
    }
    return fallback;
}
/**
 * Find best matches using Intl.LocaleMatcher algorithm
 */
export function negotiateLocales(requested, available, defaultLocale) {
    // Use the lookup algorithm for best compatibility
    const matched = [];
    const seen = new Set();
    for (const req of requested) {
        const match = matchLocale(req, available);
        if (match && !seen.has(match)) {
            matched.push(match);
            seen.add(match);
        }
    }
    // Add default if not already included
    if (!seen.has(defaultLocale)) {
        matched.push(defaultLocale);
    }
    return matched;
}
// ============================================================================
// Locale Persistence
// ============================================================================
/**
 * Save locale to cookie
 */
export function saveLocaleToCookie(locale, cookieName = 'locale', options = {}) {
    if (typeof document === 'undefined')
        return;
    const { maxAge = 365 * 24 * 60 * 60, path = '/', sameSite = 'Lax' } = options;
    document.cookie = `${cookieName}=${locale}; max-age=${maxAge}; path=${path}; SameSite=${sameSite}`;
}
/**
 * Save locale to localStorage
 */
export function saveLocaleToStorage(locale, key = 'locale') {
    if (typeof localStorage === 'undefined')
        return;
    localStorage.setItem(key, locale);
}
/**
 * Update HTML lang attribute
 */
export function updateDocumentLocale(locale) {
    if (typeof document === 'undefined')
        return;
    document.documentElement.lang = locale;
}
/**
 * Create a reactive locale manager
 */
export function createLocaleManager(options) {
    const { defaultLocale, availableLocales, persistTo = ['storage', 'document'], detectOnInit = true, detectionOptions, } = options;
    // Initial detection
    let initialLocale = defaultLocale;
    if (detectOnInit) {
        const detected = detectLocale({
            ...detectionOptions,
            availableLocales,
            fallback: defaultLocale,
        });
        initialLocale = detected;
    }
    const _locale = signal(initialLocale);
    function setLocale(locale) {
        const normalized = normalizeLocale(locale);
        if (!availableLocales.includes(normalized)) {
            const matched = matchLocale(normalized, availableLocales);
            if (!matched) {
                console.warn(`[LocaleManager] Locale "${locale}" is not available`);
                return;
            }
            _locale.set(matched);
        }
        else {
            _locale.set(normalized);
        }
        // Persist
        const current = _locale();
        if (persistTo.includes('cookie')) {
            saveLocaleToCookie(current);
        }
        if (persistTo.includes('storage')) {
            saveLocaleToStorage(current);
        }
        if (persistTo.includes('document')) {
            updateDocumentLocale(current);
        }
    }
    // Initial persistence
    if (detectOnInit) {
        const current = _locale();
        if (persistTo.includes('document')) {
            updateDocumentLocale(current);
        }
    }
    return {
        locale: _locale,
        setLocale,
        getAvailableLocales: () => [...availableLocales],
        isAvailable: (locale) => availableLocales.includes(normalizeLocale(locale)),
    };
}
//# sourceMappingURL=locale.js.map