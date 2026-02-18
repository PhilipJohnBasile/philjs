/**
 * Internationalization Formatting Utilities
 *
 * Number, currency, date, and time formatting using Intl API
 */
/**
 * Format a number according to locale
 */
export function formatNumber(value, options = {}) {
    const { locale = 'en-US', ...formatOptions } = options;
    return new Intl.NumberFormat(locale, formatOptions).format(value);
}
/**
 * Format a number as currency
 */
export function formatCurrency(value, currency, locale) {
    return formatNumber(value, {
        locale: locale ?? getCurrencyLocale(currency),
        style: 'currency',
        currency,
    });
}
/**
 * Format a number as percentage
 */
export function formatPercent(value, locale = 'en-US', fractionDigits = 0) {
    return formatNumber(value, {
        locale,
        style: 'percent',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}
/**
 * Format a number in compact notation (e.g., 1K, 1M, 1B)
 */
export function formatCompact(value, locale = 'en-US', display = 'short') {
    return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: display,
    }).format(value);
}
/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes, locale = 'en-US', decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    const formatted = formatNumber(value, {
        locale,
        maximumFractionDigits: decimals,
    });
    return `${formatted} ${sizes[i]}`;
}
/**
 * Parse a localized number string back to number
 */
export function parseNumber(value, locale = 'en-US') {
    // Get the decimal separator for this locale
    const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
    const decimal = parts.find((p) => p.type === 'decimal')?.value || '.';
    const group = parts.find((p) => p.type === 'group')?.value || ',';
    // Remove grouping separators and normalize decimal
    const normalized = value
        .replace(new RegExp(`\\${group}`, 'g'), '')
        .replace(new RegExp(`\\${decimal}`), '.');
    return parseFloat(normalized);
}
// ============================================================================
// Currency Utilities
// ============================================================================
const currencyLocales = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    KRW: 'ko-KR',
    INR: 'en-IN',
    BRL: 'pt-BR',
    RUB: 'ru-RU',
    AUD: 'en-AU',
    CAD: 'en-CA',
    CHF: 'de-CH',
    MXN: 'es-MX',
};
function getCurrencyLocale(currency) {
    return currencyLocales[currency] || 'en-US';
}
/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency, locale) {
    const parts = new Intl.NumberFormat(locale ?? getCurrencyLocale(currency), {
        style: 'currency',
        currency,
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value || currency;
}
/**
 * Get all available currencies
 */
export function getAvailableCurrencies() {
    return Object.keys(currencyLocales);
}
/**
 * Format a date according to locale
 */
export function formatDate(date, options = {}) {
    const { locale = 'en-US', ...formatOptions } = options;
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
}
/**
 * Format date with preset styles
 */
export function formatDateStyle(date, style = 'medium', locale = 'en-US') {
    return formatDate(date, { locale, dateStyle: style });
}
/**
 * Format time with preset styles
 */
export function formatTimeStyle(date, style = 'medium', locale = 'en-US') {
    return formatDate(date, { locale, timeStyle: style });
}
/**
 * Format both date and time
 */
export function formatDateTime(date, dateStyle = 'medium', timeStyle = 'short', locale = 'en-US') {
    return formatDate(date, { locale, dateStyle, timeStyle });
}
/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(value, unit, locale = 'en-US', style = 'long') {
    return new Intl.RelativeTimeFormat(locale, {
        numeric: 'auto',
        style,
    }).format(value, unit);
}
/**
 * Get relative time from a date (auto-selects appropriate unit)
 */
export function formatTimeAgo(date, locale = 'en-US', style = 'long') {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = Date.now();
    const diff = dateObj.getTime() - now;
    const absDiff = Math.abs(diff);
    const seconds = absDiff / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;
    const weeks = days / 7;
    const months = days / 30;
    const years = days / 365;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style });
    if (years >= 1) {
        return rtf.format(Math.round(diff / (365 * 24 * 60 * 60 * 1000)), 'year');
    }
    if (months >= 1) {
        return rtf.format(Math.round(diff / (30 * 24 * 60 * 60 * 1000)), 'month');
    }
    if (weeks >= 1) {
        return rtf.format(Math.round(diff / (7 * 24 * 60 * 60 * 1000)), 'week');
    }
    if (days >= 1) {
        return rtf.format(Math.round(diff / (24 * 60 * 60 * 1000)), 'day');
    }
    if (hours >= 1) {
        return rtf.format(Math.round(diff / (60 * 60 * 1000)), 'hour');
    }
    if (minutes >= 1) {
        return rtf.format(Math.round(diff / (60 * 1000)), 'minute');
    }
    return rtf.format(Math.round(diff / 1000), 'second');
}
/**
 * Format a list of items (e.g., "A, B, and C" or "A, B, or C")
 */
export function formatList(items, locale = 'en-US', style = 'conjunction', type = 'long') {
    return new Intl.ListFormat(locale, { style: type, type: style }).format(items);
}
/**
 * Get display name for a code (language, region, currency, etc.)
 */
export function getDisplayName(code, type, locale = 'en-US', style = 'long') {
    const dn = new Intl.DisplayNames(locale, { type, style });
    return dn.of(code);
}
/**
 * Get language name in a locale
 */
export function getLanguageName(languageCode, locale = 'en-US') {
    return getDisplayName(languageCode, 'language', locale);
}
/**
 * Get region/country name in a locale
 */
export function getRegionName(regionCode, locale = 'en-US') {
    return getDisplayName(regionCode, 'region', locale);
}
/**
 * Get currency name in a locale
 */
export function getCurrencyName(currencyCode, locale = 'en-US') {
    return getDisplayName(currencyCode, 'currency', locale);
}
/**
 * Create a locale-aware string comparator
 */
export function createCollator(options = {}) {
    const { locale = 'en-US', ...collatorOptions } = options;
    const collator = new Intl.Collator(locale, collatorOptions);
    return collator.compare.bind(collator);
}
/**
 * Sort strings according to locale
 */
export function sortStrings(strings, options = {}) {
    const compare = createCollator(options);
    return [...strings].sort(compare);
}
/**
 * Sort objects by a string property according to locale
 */
export function sortByProperty(items, property, options = {}) {
    const compare = createCollator(options);
    return [...items].sort((a, b) => {
        const aVal = String(a[property]);
        const bVal = String(b[property]);
        return compare(aVal, bVal);
    });
}
/**
 * Segment text into graphemes, words, or sentences
 */
export function segmentText(text, granularity = 'word', locale = 'en-US') {
    const segmenter = new Intl.Segmenter(locale, { granularity });
    return Array.from(segmenter.segment(text), (s) => s.segment);
}
/**
 * Count words in text (locale-aware)
 */
export function countWords(text, locale = 'en-US') {
    const words = segmentText(text, 'word', locale);
    // Filter out whitespace-only segments
    return words.filter((w) => w.trim().length > 0).length;
}
/**
 * Get grapheme count (handles emoji and combining characters correctly)
 */
export function countGraphemes(text, locale = 'en-US') {
    return segmentText(text, 'grapheme', locale).length;
}
//# sourceMappingURL=formatting.js.map