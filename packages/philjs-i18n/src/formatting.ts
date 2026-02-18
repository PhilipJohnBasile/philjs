/**
 * Internationalization Formatting Utilities
 *
 * Number, currency, date, and time formatting using Intl API
 */

// ============================================================================
// Number Formatting
// ============================================================================

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
export function formatNumber(
  value: number,
  options: NumberFormatOptions = {}
): string {
  const { locale = 'en-US', ...formatOptions } = options;
  return new Intl.NumberFormat(locale, formatOptions).format(value);
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  value: number,
  currency: string,
  locale?: string
): string {
  return formatNumber(value, {
    locale: locale ?? getCurrencyLocale(currency),
    style: 'currency',
    currency,
  });
}

/**
 * Format a number as percentage
 */
export function formatPercent(
  value: number,
  locale = 'en-US',
  fractionDigits = 0
): string {
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
export function formatCompact(
  value: number,
  locale = 'en-US',
  display: 'short' | 'long' = 'short'
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: display,
  }).format(value);
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(
  bytes: number,
  locale = 'en-US',
  decimals = 2
): string {
  if (bytes === 0) return '0 Bytes';

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
export function parseNumber(value: string, locale = 'en-US'): number {
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

const currencyLocales: Record<string, string> = {
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

function getCurrencyLocale(currency: string): string {
  return currencyLocales[currency] || 'en-US';
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string, locale?: string): string {
  const parts = new Intl.NumberFormat(locale ?? getCurrencyLocale(currency), {
    style: 'currency',
    currency,
  }).formatToParts(0);

  return parts.find((p) => p.type === 'currency')?.value || currency;
}

/**
 * Get all available currencies
 */
export function getAvailableCurrencies(): string[] {
  return Object.keys(currencyLocales);
}

// ============================================================================
// Date and Time Formatting
// ============================================================================

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
export function formatDate(
  date: Date | number | string,
  options: DateFormatOptions = {}
): string {
  const { locale = 'en-US', ...formatOptions } = options;
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
}

/**
 * Format date with preset styles
 */
export function formatDateStyle(
  date: Date | number | string,
  style: 'full' | 'long' | 'medium' | 'short' = 'medium',
  locale = 'en-US'
): string {
  return formatDate(date, { locale, dateStyle: style });
}

/**
 * Format time with preset styles
 */
export function formatTimeStyle(
  date: Date | number | string,
  style: 'full' | 'long' | 'medium' | 'short' = 'medium',
  locale = 'en-US'
): string {
  return formatDate(date, { locale, timeStyle: style });
}

/**
 * Format both date and time
 */
export function formatDateTime(
  date: Date | number | string,
  dateStyle: 'full' | 'long' | 'medium' | 'short' = 'medium',
  timeStyle: 'full' | 'long' | 'medium' | 'short' = 'short',
  locale = 'en-US'
): string {
  return formatDate(date, { locale, dateStyle, timeStyle });
}

// ============================================================================
// Relative Time Formatting
// ============================================================================

export type RelativeTimeUnit =
  | 'year'
  | 'quarter'
  | 'month'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second';

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(
  value: number,
  unit: RelativeTimeUnit,
  locale = 'en-US',
  style: 'long' | 'short' | 'narrow' = 'long'
): string {
  return new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style,
  }).format(value, unit);
}

/**
 * Get relative time from a date (auto-selects appropriate unit)
 */
export function formatTimeAgo(
  date: Date | number | string,
  locale = 'en-US',
  style: 'long' | 'short' | 'narrow' = 'long'
): string {
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

// ============================================================================
// List Formatting
// ============================================================================

export type ListStyle = 'conjunction' | 'disjunction' | 'unit';
export type ListType = 'long' | 'short' | 'narrow';

/**
 * Format a list of items (e.g., "A, B, and C" or "A, B, or C")
 */
export function formatList(
  items: string[],
  locale = 'en-US',
  style: ListStyle = 'conjunction',
  type: ListType = 'long'
): string {
  return new Intl.ListFormat(locale, { style: type, type: style }).format(items);
}

// ============================================================================
// Display Names
// ============================================================================

export type DisplayNameType =
  | 'language'
  | 'region'
  | 'script'
  | 'currency'
  | 'calendar'
  | 'dateTimeField';

/**
 * Get display name for a code (language, region, currency, etc.)
 */
export function getDisplayName(
  code: string,
  type: DisplayNameType,
  locale = 'en-US',
  style: 'long' | 'short' | 'narrow' = 'long'
): string | undefined {
  const dn = new Intl.DisplayNames(locale, { type, style });
  return dn.of(code);
}

/**
 * Get language name in a locale
 */
export function getLanguageName(
  languageCode: string,
  locale = 'en-US'
): string | undefined {
  return getDisplayName(languageCode, 'language', locale);
}

/**
 * Get region/country name in a locale
 */
export function getRegionName(
  regionCode: string,
  locale = 'en-US'
): string | undefined {
  return getDisplayName(regionCode, 'region', locale);
}

/**
 * Get currency name in a locale
 */
export function getCurrencyName(
  currencyCode: string,
  locale = 'en-US'
): string | undefined {
  return getDisplayName(currencyCode, 'currency', locale);
}

// ============================================================================
// Collation and Sorting
// ============================================================================

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
export function createCollator(
  options: CollatorOptions = {}
): (a: string, b: string) => number {
  const { locale = 'en-US', ...collatorOptions } = options;
  const collator = new Intl.Collator(locale, collatorOptions);
  return collator.compare.bind(collator);
}

/**
 * Sort strings according to locale
 */
export function sortStrings(
  strings: string[],
  options: CollatorOptions = {}
): string[] {
  const compare = createCollator(options);
  return [...strings].sort(compare);
}

/**
 * Sort objects by a string property according to locale
 */
export function sortByProperty<T>(
  items: T[],
  property: keyof T,
  options: CollatorOptions = {}
): T[] {
  const compare = createCollator(options);
  return [...items].sort((a, b) => {
    const aVal = String(a[property]);
    const bVal = String(b[property]);
    return compare(aVal, bVal);
  });
}

// ============================================================================
// Segmentation
// ============================================================================

export type SegmentGranularity = 'grapheme' | 'word' | 'sentence';

/**
 * Segment text into graphemes, words, or sentences
 */
export function segmentText(
  text: string,
  granularity: SegmentGranularity = 'word',
  locale = 'en-US'
): string[] {
  const segmenter = new Intl.Segmenter(locale, { granularity });
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

/**
 * Count words in text (locale-aware)
 */
export function countWords(text: string, locale = 'en-US'): number {
  const words = segmentText(text, 'word', locale);
  // Filter out whitespace-only segments
  return words.filter((w) => w.trim().length > 0).length;
}

/**
 * Get grapheme count (handles emoji and combining characters correctly)
 */
export function countGraphemes(text: string, locale = 'en-US'): number {
  return segmentText(text, 'grapheme', locale).length;
}
