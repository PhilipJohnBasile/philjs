/**
 * Axis and value formatters for PhilJS Charts
 */
export type FormatterFunction = (value: number | string | Date) => string;
export declare function formatNumber(value: number, decimals?: number): string;
export declare function formatCompact(value: number): string;
export declare function formatPercent(value: number, decimals?: number): string;
export declare function formatCurrency(value: number, currency?: string, locale?: string): string;
export declare function formatBytes(bytes: number, decimals?: number): string;
export declare function formatDate(date: Date | string | number): string;
export declare function formatTime(date: Date | string | number): string;
export declare function formatDateTime(date: Date | string | number): string;
export declare function formatRelativeTime(date: Date | string | number): string;
export interface AxisFormatterOptions {
    type?: 'number' | 'currency' | 'percent' | 'date' | 'time' | 'compact';
    currency?: string;
    locale?: string;
    decimals?: number;
    prefix?: string;
    suffix?: string;
}
export declare function createAxisFormatter(options?: AxisFormatterOptions): FormatterFunction;
export interface TooltipFormatterOptions extends AxisFormatterOptions {
    labelFormat?: (label: string) => string;
    valueFormat?: (value: number) => string;
}
export declare function createTooltipFormatter(options?: TooltipFormatterOptions): (label: string, value: number) => string;
export declare function formatDuration(ms: number): string;
export declare function formatScientific(value: number, decimals?: number): string;
export declare function formatOrdinal(value: number): string;
//# sourceMappingURL=formatters.d.ts.map