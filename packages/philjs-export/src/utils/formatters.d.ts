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
export declare function formatDate(value: Date | string | number, format?: string, options?: FormatterOptions): string;
/**
 * Format a number value
 */
export declare function formatNumber(value: number, format?: string, options?: FormatterOptions & {
    decimals?: number;
    currency?: string;
}): string;
/**
 * Format a boolean value
 */
export declare function formatBoolean(value: boolean, format?: 'yes/no' | 'true/false' | '1/0' | 'y/n' | 'on/off'): string;
/**
 * Format a string value
 */
export declare function formatString(value: string, format?: 'uppercase' | 'lowercase' | 'capitalize' | 'title' | 'trim' | 'none'): string;
/**
 * Format an array value
 */
export declare function formatArray(value: unknown[], separator?: string, format?: (item: unknown, index: number) => string): string;
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
export declare function applyFormatters(row: Record<string, unknown>, formatters: ColumnFormatter[]): Record<string, unknown>;
/**
 * Create a data transformer with formatters
 */
export declare function createTransformer(formatters: ColumnFormatter[]): (row: Record<string, unknown>) => Record<string, unknown>;
/**
 * Sanitize a value for safe export (remove formulas, etc.)
 */
export declare function sanitizeForExport(value: unknown): unknown;
/**
 * Sanitize all values in a row
 */
export declare function sanitizeRow(row: Record<string, unknown>): Record<string, unknown>;
//# sourceMappingURL=formatters.d.ts.map