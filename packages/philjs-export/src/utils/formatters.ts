/**
 * Data Formatters
 * Utilities for formatting data before export
 */

export interface FormatterOptions {
  /** Locale for formatting */
  locale?: string;
  /** Timezone for dates */
  timezone?: string;
}

/**
 * Format a date value
 */
export function formatDate(
  value: Date | string | number,
  format: string = 'iso',
  options: FormatterOptions = {}
): string {
  const date = value instanceof Date ? value : new Date(value);
  const { locale = 'en-US', timezone } = options;

  if (isNaN(date.getTime())) {
    return '';
  }

  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'date':
      return date.toLocaleDateString(locale, { timeZone: timezone });
    case 'time':
      return date.toLocaleTimeString(locale, { timeZone: timezone });
    case 'datetime':
      return date.toLocaleString(locale, { timeZone: timezone });
    case 'short':
      return date.toLocaleDateString(locale, {
        timeZone: timezone,
        year: '2-digit',
        month: 'numeric',
        day: 'numeric',
      });
    case 'long':
      return date.toLocaleDateString(locale, {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'timestamp':
      return String(date.getTime());
    default:
      // Custom format
      return formatDateCustom(date, format, options);
  }
}

/**
 * Format date with custom pattern
 */
function formatDateCustom(date: Date, format: string, options: FormatterOptions): string {
  const { timezone } = options;

  // Get date parts in the specified timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const partsMap: Record<string, string> = {};
  for (const part of parts) {
    partsMap[part.type] = part.value;
  }

  return format
    .replace(/YYYY/g, partsMap.year || '')
    .replace(/MM/g, partsMap.month || '')
    .replace(/DD/g, partsMap.day || '')
    .replace(/HH/g, partsMap.hour || '')
    .replace(/mm/g, partsMap.minute || '')
    .replace(/ss/g, partsMap.second || '');
}

/**
 * Format a number value
 */
export function formatNumber(
  value: number,
  format: string = 'decimal',
  options: FormatterOptions & {
    decimals?: number;
    currency?: string;
  } = {}
): string {
  const { locale = 'en-US', decimals = 2, currency = 'USD' } = options;

  if (typeof value !== 'number' || isNaN(value)) {
    return '';
  }

  switch (format) {
    case 'integer':
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(value);

    case 'decimal':
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);

    case 'percent':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);

    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);

    case 'compact':
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(value);

    case 'scientific':
      return new Intl.NumberFormat(locale, {
        notation: 'scientific',
      }).format(value);

    case 'plain':
      return String(value);

    default:
      return new Intl.NumberFormat(locale).format(value);
  }
}

/**
 * Format a boolean value
 */
export function formatBoolean(
  value: boolean,
  format: 'yes/no' | 'true/false' | '1/0' | 'y/n' | 'on/off' = 'true/false'
): string {
  switch (format) {
    case 'yes/no':
      return value ? 'Yes' : 'No';
    case '1/0':
      return value ? '1' : '0';
    case 'y/n':
      return value ? 'Y' : 'N';
    case 'on/off':
      return value ? 'On' : 'Off';
    case 'true/false':
    default:
      return value ? 'true' : 'false';
  }
}

/**
 * Format a string value
 */
export function formatString(
  value: string,
  format: 'uppercase' | 'lowercase' | 'capitalize' | 'title' | 'trim' | 'none' = 'none'
): string {
  if (typeof value !== 'string') {
    return String(value ?? '');
  }

  switch (format) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'capitalize':
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    case 'title':
      return value
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    case 'trim':
      return value.trim();
    case 'none':
    default:
      return value;
  }
}

/**
 * Format an array value
 */
export function formatArray(
  value: unknown[],
  separator: string = ', ',
  format?: (item: unknown, index: number) => string
): string {
  if (!Array.isArray(value)) {
    return '';
  }

  if (format) {
    return value.map(format).join(separator);
  }

  return value.map(item => String(item ?? '')).join(separator);
}

/**
 * Create a column formatter configuration
 */
export interface ColumnFormatter {
  key: string;
  type: 'date' | 'number' | 'boolean' | 'string' | 'array' | 'custom';
  format?: string;
  options?: FormatterOptions & Record<string, unknown>;
  custom?: (value: unknown) => string;
}

/**
 * Apply formatters to a data row
 */
export function applyFormatters(
  row: Record<string, unknown>,
  formatters: ColumnFormatter[]
): Record<string, unknown> {
  const result = { ...row };

  for (const formatter of formatters) {
    const value = row[formatter.key];

    if (value === null || value === undefined) {
      continue;
    }

    switch (formatter.type) {
      case 'date':
        result[formatter.key] = formatDate(value as Date, formatter.format, formatter.options);
        break;
      case 'number':
        result[formatter.key] = formatNumber(value as number, formatter.format, formatter.options);
        break;
      case 'boolean':
        result[formatter.key] = formatBoolean(
          value as boolean,
          formatter.format as 'yes/no' | 'true/false' | '1/0' | 'y/n' | 'on/off'
        );
        break;
      case 'string':
        result[formatter.key] = formatString(
          value as string,
          formatter.format as 'uppercase' | 'lowercase' | 'capitalize' | 'title' | 'trim' | 'none'
        );
        break;
      case 'array':
        result[formatter.key] = formatArray(value as unknown[], formatter.format || ', ');
        break;
      case 'custom':
        if (formatter.custom) {
          result[formatter.key] = formatter.custom(value);
        }
        break;
    }
  }

  return result;
}

/**
 * Create a data transformer with formatters
 */
export function createTransformer(
  formatters: ColumnFormatter[]
): (row: Record<string, unknown>) => Record<string, unknown> {
  return (row: Record<string, unknown>) => applyFormatters(row, formatters);
}

/**
 * Sanitize a value for safe export (remove formulas, etc.)
 */
export function sanitizeForExport(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  // Remove potential formula injection
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r', '\n'];

  for (const prefix of dangerousPrefixes) {
    if (value.startsWith(prefix)) {
      return "'" + value; // Prefix with single quote to prevent formula execution
    }
  }

  return value;
}

/**
 * Sanitize all values in a row
 */
export function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    result[key] = sanitizeForExport(value);
  }

  return result;
}
