/**
 * AlertBadge Widget - Display alerts and notifications
 */

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  acknowledged?: boolean;
}

export interface AlertBadgeProps {
  count: number;
  severity?: AlertSeverity;
  onClick?: () => void;
}

export interface AlertListProps {
  alerts: Alert[];
  maxItems?: number;
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export interface AlertBannerProps {
  alert: Alert;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export interface AlertToastProps {
  alert: Alert;
  duration?: number;
  onClose?: () => void;
}

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  error: 'Error',
  critical: 'Critical',
};

export function AlertBadge(props: AlertBadgeProps): string {
  const severity = props.severity ?? (props.count > 0 ? 'warning' : 'info');
  const countLabel = props.count > 99 ? '99+' : String(props.count);
  return `
    <button
      class="philjs-alert-badge severity-${severity} ${props.count === 0 ? 'is-empty' : ''}"
      type="button"
      data-action="alert-badge"
      aria-label="${escapeHtml(`${countLabel} alerts`)}"
    >
      <span class="alert-badge-label">${escapeHtml(SEVERITY_LABELS[severity])}</span>
      <span class="alert-badge-count">${escapeHtml(countLabel)}</span>
    </button>
  `;
}

export function AlertList(props: AlertListProps): string {
  const maxItems = props.maxItems ?? 5;
  const items = props.alerts.slice(0, maxItems);

  if (items.length === 0) {
    return `<div class="philjs-alert-list empty">No alerts</div>`;
  }

  return `
    <ul class="philjs-alert-list">
      ${items.map((alert) => `
        <li class="alert-item severity-${alert.severity} ${alert.acknowledged ? 'acknowledged' : ''}">
          <div class="alert-item-header">
            <span class="alert-item-title">${escapeHtml(alert.title)}</span>
            <span class="alert-item-timestamp">${escapeHtml(formatTimestamp(alert.timestamp))}</span>
          </div>
          <div class="alert-item-message">${escapeHtml(alert.message)}</div>
          <div class="alert-item-actions">
            <button type="button" data-action="acknowledge" data-alert-id="${escapeHtml(alert.id)}">
              ${alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
            </button>
            <button type="button" data-action="dismiss" data-alert-id="${escapeHtml(alert.id)}">Dismiss</button>
          </div>
        </li>
      `).join('')}
    </ul>
  `;
}

export function AlertBanner(props: AlertBannerProps): string {
  const alert = props.alert;
  return `
    <div class="philjs-alert-banner severity-${alert.severity}" role="alert">
      <div class="alert-banner-content">
        <strong class="alert-banner-title">${escapeHtml(alert.title)}</strong>
        <span class="alert-banner-message">${escapeHtml(alert.message)}</span>
      </div>
      ${props.dismissible ? `<button type="button" data-action="dismiss" data-alert-id="${escapeHtml(alert.id)}">Dismiss</button>` : ''}
    </div>
  `;
}

export function AlertToast(props: AlertToastProps): string {
  const alert = props.alert;
  const duration = props.duration ?? 5000;
  return `
    <div class="philjs-alert-toast severity-${alert.severity}" role="status" data-duration="${duration}">
      <div class="alert-toast-content">
        <strong class="alert-toast-title">${escapeHtml(alert.title)}</strong>
        <span class="alert-toast-message">${escapeHtml(alert.message)}</span>
      </div>
      <button type="button" data-action="close" data-alert-id="${escapeHtml(alert.id)}">Close</button>
    </div>
  `;
}

function formatTimestamp(value: Date): string {
  return value.toLocaleTimeString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
