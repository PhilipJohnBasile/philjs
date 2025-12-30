/**
 * MetricCard Widget - Display metrics in a card format
 */

export type TrendDirection = 'up' | 'down' | 'stable';
export type MetricStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: TrendDirection;
  trendValue?: number;
  status?: MetricStatus;
  description?: string;
}

export interface CompactMetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  status?: MetricStatus;
}

export function MetricCard(_props: MetricCardProps): string {
  // Stub implementation
  return '';
}

export function CompactMetricCard(_props: CompactMetricCardProps): string {
  // Stub implementation
  return '';
}
