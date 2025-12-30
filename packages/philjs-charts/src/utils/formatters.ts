/**
 * Axis and value formatters for PhilJS Charts
 */

export type FormatterFunction = (value: number | string | Date) => string;

// Number formatters
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCompact(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e12) {
    return `${sign}${(absValue / 1e12).toFixed(1)}T`;
  }
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(1)}B`;
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(1)}M`;
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(1)}K`;
  }
  return formatNumber(value, 0);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// Date formatters
export function formatDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString();
}

export function formatTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString();
}

export function formatDateTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

export function formatRelativeTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

// Axis-specific formatters
export interface AxisFormatterOptions {
  type?: 'number' | 'currency' | 'percent' | 'date' | 'time' | 'compact';
  currency?: string;
  locale?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function createAxisFormatter(
  options: AxisFormatterOptions = {}
): FormatterFunction {
  const { type = 'number', prefix = '', suffix = '' } = options;

  return (value: number | string | Date): string => {
    let formatted: string;

    if (value instanceof Date) {
      formatted = type === 'time' ? formatTime(value) : formatDate(value);
    } else if (typeof value === 'string') {
      formatted = value;
    } else {
      switch (type) {
        case 'currency':
          formatted = formatCurrency(value, options.currency, options.locale);
          break;
        case 'percent':
          formatted = formatPercent(value, options.decimals);
          break;
        case 'compact':
          formatted = formatCompact(value);
          break;
        case 'date':
          formatted = formatDate(value);
          break;
        case 'time':
          formatted = formatTime(value);
          break;
        default:
          formatted = formatNumber(value, options.decimals);
      }
    }

    return `${prefix}${formatted}${suffix}`;
  };
}

// Tooltip formatters
export interface TooltipFormatterOptions extends AxisFormatterOptions {
  labelFormat?: (label: string) => string;
  valueFormat?: (value: number) => string;
}

export function createTooltipFormatter(
  options: TooltipFormatterOptions = {}
): (label: string, value: number) => string {
  const valueFormatter = createAxisFormatter(options);
  const labelFormatter = options.labelFormat || ((l) => l);

  return (label: string, value: number): string => {
    return `${labelFormatter(label)}: ${valueFormatter(value)}`;
  };
}

// Duration formatters
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  if (seconds > 0) return `${seconds}s`;
  return `${ms}ms`;
}

// Scientific notation
export function formatScientific(value: number, decimals = 2): string {
  return value.toExponential(decimals);
}

// Ordinal formatter
export function formatOrdinal(value: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = value % 100;
  return value + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0] ?? 'th');
}
