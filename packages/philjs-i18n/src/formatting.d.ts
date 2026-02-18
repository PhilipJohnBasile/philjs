/**
 * Internationalization Formatting Utilities
 *
 * Number, currency, date, and time formatting using Intl API
 */
export interface NumberFormatOptions {
    locale?: string;
    style?: 'decimal' | 'currency' | 'percent' | 'unit';
    currency?: string;
    unit?: string;
    notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    minimumIntegerDigits?: number;
    minimumSignificantDigits?: number;
    maximumSignificantDigits?: number;
    useGrouping?: boolean;
    signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
}
/**
 * Format a number according to locale
 */
export declare function formatNumber(value: number, options?: NumberFormatOptions): string;
/**
 * Format a number as currency
 */
export declare function formatCurrency(value: number, currency: string, locale?: string): string;
/**
 * Format a number as percentage
 */
export declare function formatPercent(value: number, locale?: string, fractionDigits?: number): string;
/**
 * Format a number in compact notation (e.g., 1K, 1M, 1B)
 */
export declare function formatCompact(value: number, locale?: string, display?: 'short' | 'long'): string;
/**
 * Format bytes to human-readable size
 */
export declare function formatBytes(bytes: number, locale?: string, decimals?: number): string;
/**
 * Parse a localized number string back to number
 */
export declare function parseNumber(value: string, locale?: string): number;
/**
 * Get currency symbol for a currency code
 */
export declare function getCurrencySymbol(currency: string, locale?: string): string;
/**
 * Get all available currencies
 */
export declare function getAvailableCurrencies(): string[];
export interface DateFormatOptions {
    locale?: string;
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    weekday?: 'long' | 'short' | 'narrow';
    era?: 'long' | 'short' | 'narrow';
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    day?: 'numeric' | '2-digit';
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
    timeZone?: string;
    timeZoneName?: 'long' | 'short' | 'shortOffset' | 'longOffset';
    hour12?: boolean;
}
/**
 * Format a date according to locale
 */
export declare function formatDate(date: Date | number | string, options?: DateFormatOptions): string;
/**
 * Format date with preset styles
 */
export declare function formatDateStyle(date: Date | number | string, style?: 'full' | 'long' | 'medium' | 'short', locale?: string): string;
/**
 * Format time with preset styles
 */
export declare function formatTimeStyle(date: Date | number | string, style?: 'full' | 'long' | 'medium' | 'short', locale?: string): string;
/**
 * Format both date and time
 */
export declare function formatDateTime(date: Date | number | string, dateStyle?: 'full' | 'long' | 'medium' | 'short', timeStyle?: 'full' | 'long' | 'medium' | 'short', locale?: string): string;
export type RelativeTimeUnit = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';
/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export declare function formatRelativeTime(value: number, unit: RelativeTimeUnit, locale?: string, style?: 'long' | 'short' | 'narrow'): string;
/**
 * Get relative time from a date (auto-selects appropriate unit)
 */
export declare function formatTimeAgo(date: Date | number | string, locale?: string, style?: 'long' | 'short' | 'narrow'): string;
export type ListStyle = 'conjunction' | 'disjunction' | 'unit';
export type ListType = 'long' | 'short' | 'narrow';
/**
 * Format a list of items (e.g., "A, B, and C" or "A, B, or C")
 */
export declare function formatList(items: string[], locale?: string, style?: ListStyle, type?: ListType): string;
export type DisplayNameType = 'language' | 'region' | 'script' | 'currency' | 'calendar' | 'dateTimeField';
/**
 * Get display name for a code (language, region, currency, etc.)
 */
export declare function getDisplayName(code: string, type: DisplayNameType, locale?: string, style?: 'long' | 'short' | 'narrow'): string | undefined;
/**
 * Get language name in a locale
 */
export declare function getLanguageName(languageCode: string, locale?: string): string | undefined;
/**
 * Get region/country name in a locale
 */
export declare function getRegionName(regionCode: string, locale?: string): string | undefined;
/**
 * Get currency name in a locale
 */
export declare function getCurrencyName(currencyCode: string, locale?: string): string | undefined;
export interface CollatorOptions {
    locale?: string;
    sensitivity?: 'base' | 'accent' | 'case' | 'variant';
    ignorePunctuation?: boolean;
    numeric?: boolean;
    caseFirst?: 'upper' | 'lower' | 'false';
}
/**
 * Create a locale-aware string comparator
 */
export declare function createCollator(options?: CollatorOptions): (a: string, b: string) => number;
/**
 * Sort strings according to locale
 */
export declare function sortStrings(strings: string[], options?: CollatorOptions): string[];
/**
 * Sort objects by a string property according to locale
 */
export declare function sortByProperty<T>(items: T[], property: keyof T, options?: CollatorOptions): T[];
export type SegmentGranularity = 'grapheme' | 'word' | 'sentence';
/**
 * Segment text into graphemes, words, or sentences
 */
export declare function segmentText(text: string, granularity?: SegmentGranularity, locale?: string): string[];
/**
 * Count words in text (locale-aware)
 */
export declare function countWords(text: string, locale?: string): number;
/**
 * Get grapheme count (handles emoji and combining characters correctly)
 */
export declare function countGraphemes(text: string, locale?: string): number;
