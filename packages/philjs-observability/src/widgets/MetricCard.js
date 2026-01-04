/**
 * MetricCard Widget - Display metrics in a card format
 */
const STATUS_LABELS = {
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
    unknown: 'Unknown',
};
const TREND_SYMBOLS = {
    up: '▲',
    down: '▼',
    stable: '■',
};
export function MetricCard(props) {
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
export function CompactMetricCard(props) {
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
function formatTrendValue(value) {
    const formatted = Math.abs(value).toFixed(2);
    return `${value >= 0 ? '+' : '-'}${formatted}%`;
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
//# sourceMappingURL=MetricCard.js.map