/**
 * StatusIndicator Widget - Display system health status
 */
const STATUS_LABELS = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    unhealthy: 'Unhealthy',
    unknown: 'Unknown',
};
export function StatusIndicator(props) {
    const label = props.label ?? STATUS_LABELS[props.status];
    const sizeClass = props.size ? `size-${props.size}` : 'size-md';
    return `
    <span class="philjs-status-indicator ${sizeClass} status-${props.status}" role="status" aria-label="${escapeHtml(label)}">
      <span class="status-dot" aria-hidden="true"></span>
      <span class="status-label">${escapeHtml(label)}</span>
    </span>
  `;
}
export function StatusCard(props) {
    const lastChecked = props.lastChecked ? formatDateTime(props.lastChecked) : null;
    return `
    <div class="philjs-status-card status-${props.status}">
      <div class="status-card-header">
        <div class="status-card-title">${escapeHtml(props.title)}</div>
        ${StatusIndicator({ status: props.status, size: 'sm' })}
      </div>
      ${props.description ? `<p class="status-card-description">${escapeHtml(props.description)}</p>` : ''}
      ${lastChecked ? `<div class="status-card-meta">Last checked: ${escapeHtml(lastChecked)}</div>` : ''}
    </div>
  `;
}
export function UptimeBar(props) {
    const percent = normalizeUptime(props.uptime);
    const days = props.days ?? 30;
    const label = props.showPercentage ? `${percent.toFixed(2)}% uptime` : `${days}-day uptime`;
    return `
    <div class="philjs-uptime-bar" role="img" aria-label="${escapeHtml(label)}">
      <div class="uptime-bar-track">
        <div class="uptime-bar-fill" style="width: ${percent}%;"></div>
      </div>
      <div class="uptime-bar-meta">
        <span class="uptime-bar-label">${escapeHtml(label)}</span>
      </div>
    </div>
  `;
}
function normalizeUptime(uptime) {
    if (Number.isNaN(uptime) || !Number.isFinite(uptime))
        return 0;
    const value = uptime <= 1 ? uptime * 100 : uptime;
    return Math.max(0, Math.min(100, value));
}
function formatDateTime(value) {
    return value.toLocaleString();
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
//# sourceMappingURL=StatusIndicator.js.map