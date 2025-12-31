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

const STATUS_LABELS: Record<MetricStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  unknown: 'Unknown',
};

const TREND_SYMBOLS: Record<TrendDirection, string> = {
  up: '▲',
  down: '▼',
  stable: '■',
};

export function MetricCard(props: MetricCardProps): string {
  const status = props.status ?? 'unknown';
  const trend = props.trend ?? 'stable';
  const trendValue = props.trendValue !== undefined ? formatTrendValue(props.trendValue) : null;

  return `
    <div class="philjs-metric-card status-${status}">
      <div class="metric-card-header">
        <div class="metric-card-title">${escapeHtml(props.title)}</div>
        <span class="metric-card-status">${escapeHtml(STATUS_LABELS[status])}</span>
      </div>
      <div class="metric-card-value">
        <span class="metric-value">${escapeHtml(String(props.value))}</span>
        ${props.unit ? `<span class="metric-unit">${escapeHtml(props.unit)}</span>` : ''}
      </div>
      <div class="metric-card-footer">
        <span class="metric-trend trend-${trend}">
          <span class="trend-icon" aria-hidden="true">${TREND_SYMBOLS[trend]}</span>
          ${trendValue ? `<span class="trend-value">${escapeHtml(trendValue)}</span>` : ''}
        </span>
        ${props.description ? `<span class="metric-description">${escapeHtml(props.description)}</span>` : ''}
      </div>
    </div>
  `;
}

export function CompactMetricCard(props: CompactMetricCardProps): string {
  const status = props.status ?? 'unknown';
  return `
    <div class="philjs-metric-card compact status-${status}">
      <div class="metric-card-title">${escapeHtml(props.title)}</div>
      <div class="metric-card-value">
        <span class="metric-value">${escapeHtml(String(props.value))}</span>
        ${props.unit ? `<span class="metric-unit">${escapeHtml(props.unit)}</span>` : ''}
      </div>
    </div>
  `;
}

function formatTrendValue(value: number): string {
  const formatted = Math.abs(value).toFixed(2);
  return `${value >= 0 ? '+' : '-'}${formatted}%`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
