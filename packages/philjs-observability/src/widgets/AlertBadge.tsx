/**
 * AlertBadge - Alert notification widget
 *
 * Displays alert notifications with severity levels,
 * counts, and interactive dismiss functionality.
 */

import { signal, memo } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface Alert {
  id: string;
  title: string;
  message?: string;
  severity: AlertSeverity;
  timestamp: Date;
  source?: string;
  acknowledged?: boolean;
  metadata?: Record<string, any>;
}

export interface AlertBadgeProps {
  count: number;
  severity?: AlertSeverity;
  showZero?: boolean;
  animate?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface AlertListProps {
  alerts: Alert[];
  maxVisible?: number;
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onDismissAll?: () => void;
  className?: string;
}

export interface AlertBannerProps {
  alert: Alert;
  onDismiss?: () => void;
  className?: string;
}

export interface AlertToastProps {
  alert: Alert;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  badge: `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
  `,
  badgeAnimate: `
    animation: alertPulse 1.5s ease-in-out infinite;
  `,
  list: `
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 12px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  listHeader: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #1e1e3f;
    border-bottom: 1px solid #2a2a4a;
  `,
  listTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
  `,
  listAction: `
    color: #6366f1;
    font-size: 12px;
    cursor: pointer;
    transition: color 0.2s ease;
  `,
  listEmpty: `
    padding: 40px 20px;
    text-align: center;
    color: #6a6a8a;
    font-size: 13px;
  `,
  alertItem: `
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid #2a2a4a;
    transition: background 0.2s ease;
  `,
  alertItemLast: `
    border-bottom: none;
  `,
  alertItemHover: `
    background: rgba(99, 102, 241, 0.05);
  `,
  alertIndicator: `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 6px;
  `,
  alertContent: `
    flex: 1;
    min-width: 0;
  `,
  alertTitle: `
    color: #e0e0ff;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
  `,
  alertMessage: `
    color: #8a8aaa;
    font-size: 12px;
    line-height: 1.4;
    margin-bottom: 8px;
  `,
  alertMeta: `
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: #6a6a8a;
  `,
  alertActions: `
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  `,
  alertButton: `
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  `,
  banner: `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  bannerIcon: `
    font-size: 18px;
    flex-shrink: 0;
  `,
  bannerContent: `
    flex: 1;
  `,
  bannerTitle: `
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
  `,
  bannerMessage: `
    font-size: 12px;
    opacity: 0.8;
  `,
  bannerClose: `
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s ease;
  `,
  toast: `
    position: fixed;
    right: 20px;
    top: 20px;
    max-width: 360px;
    padding: 16px 20px;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideIn 0.3s ease-out;
    z-index: 1000;
  `,
  toastHeader: `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  `,
  toastTitle: `
    font-size: 14px;
    font-weight: 600;
  `,
  toastClose: `
    padding: 2px;
    cursor: pointer;
    opacity: 0.6;
    font-size: 16px;
    line-height: 1;
  `,
  toastMessage: `
    font-size: 13px;
    opacity: 0.9;
    line-height: 1.4;
  `,
  toastProgress: `
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    border-radius: 0 0 10px 10px;
    animation: toastProgress linear forwards;
  `,
};

// ============================================================================
// Severity Colors
// ============================================================================

const severityColors: Record<AlertSeverity, { bg: string; text: string; light: string }> = {
  critical: { bg: '#ef4444', text: '#ffffff', light: 'rgba(239, 68, 68, 0.15)' },
  warning: { bg: '#f59e0b', text: '#ffffff', light: 'rgba(245, 158, 11, 0.15)' },
  info: { bg: '#6366f1', text: '#ffffff', light: 'rgba(99, 102, 241, 0.15)' },
  success: { bg: '#22c55e', text: '#ffffff', light: 'rgba(34, 197, 94, 0.15)' },
};

const severityIcons: Record<AlertSeverity, string> = {
  critical: '!',
  warning: '!',
  info: 'i',
  success: 'ok',
};

// ============================================================================
// Alert Badge Component
// ============================================================================

export function AlertBadge(props: AlertBadgeProps) {
  const {
    count,
    severity = 'warning',
    showZero = false,
    animate = true,
    onClick,
    className = '',
  } = props;

  if (count === 0 && !showZero) {
    return null;
  }

  const colors = severityColors[severity];
  const shouldAnimate = animate && count > 0 && severity === 'critical';

  return (
    <span
      style={styles.badge + `
        background: ${colors.bg};
        color: ${colors.text};
        ${shouldAnimate ? styles.badgeAnimate : ''}
      `}
      class={className}
      onClick={onClick}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ============================================================================
// Alert List Component
// ============================================================================

export function AlertList(props: AlertListProps) {
  const {
    alerts,
    maxVisible = 10,
    onAcknowledge,
    onDismiss,
    onDismissAll,
    className = '',
  } = props;

  const hoveredId = signal<string | null>(null);
  const visibleAlerts = alerts.slice(0, maxVisible);
  const hasMore = alerts.length > maxVisible;

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.list} class={className}>
      <div style={styles.listHeader}>
        <span style={styles.listTitle}>
          Alerts {alerts.length > 0 && `(${alerts.length})`}
        </span>
        {alerts.length > 0 && onDismissAll && (
          <span style={styles.listAction} onClick={onDismissAll}>
            Dismiss all
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div style={styles.listEmpty}>
          No active alerts
        </div>
      ) : (
        <>
          {visibleAlerts.map((alert, i) => {
            const colors = severityColors[alert.severity];
            const isHovered = hoveredId() === alert.id;
            const isLast = i === visibleAlerts.length - 1 && !hasMore;

            return (
              <div
                style={styles.alertItem +
                  (isLast ? styles.alertItemLast : '') +
                  (isHovered ? styles.alertItemHover : '')}
                onMouseEnter={() => hoveredId.set(alert.id)}
                onMouseLeave={() => hoveredId.set(null)}
              >
                <span
                  style={styles.alertIndicator + `background: ${colors.bg};`}
                />
                <div style={styles.alertContent}>
                  <div style={styles.alertTitle}>{alert.title}</div>
                  {alert.message && (
                    <div style={styles.alertMessage}>{alert.message}</div>
                  )}
                  <div style={styles.alertMeta}>
                    <span>{formatTime(alert.timestamp)}</span>
                    {alert.source && <span>{alert.source}</span>}
                  </div>
                </div>
                <div style={styles.alertActions}>
                  {onAcknowledge && !alert.acknowledged && (
                    <button
                      style={styles.alertButton + `
                        background: ${colors.light};
                        color: ${colors.bg};
                      `}
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      Ack
                    </button>
                  )}
                  {onDismiss && (
                    <button
                      style={styles.alertButton + `
                        background: rgba(255, 255, 255, 0.05);
                        color: #8a8aaa;
                      `}
                      onClick={() => onDismiss(alert.id)}
                    >
                      x
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div style="padding: 12px 20px; text-align: center; color: #6a6a8a; font-size: 12px;">
              +{alerts.length - maxVisible} more alerts
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Alert Banner Component
// ============================================================================

export function AlertBanner(props: AlertBannerProps) {
  const { alert, onDismiss, className = '' } = props;
  const colors = severityColors[alert.severity];

  return (
    <div
      style={styles.banner + `
        background: ${colors.light};
        border: 1px solid ${colors.bg}33;
      `}
      class={className}
    >
      <span style={styles.bannerIcon + `color: ${colors.bg};`}>
        {severityIcons[alert.severity]}
      </span>
      <div style={styles.bannerContent}>
        <div style={styles.bannerTitle + `color: ${colors.bg};`}>
          {alert.title}
        </div>
        {alert.message && (
          <div style={styles.bannerMessage + `color: ${colors.bg};`}>
            {alert.message}
          </div>
        )}
      </div>
      {onDismiss && (
        <span
          style={styles.bannerClose + `color: ${colors.bg};`}
          onClick={onDismiss}
        >
          x
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Alert Toast Component
// ============================================================================

export function AlertToast(props: AlertToastProps) {
  const {
    alert,
    duration = 5000,
    onClose,
    className = '',
  } = props;

  const colors = severityColors[alert.severity];

  // Auto-dismiss after duration
  if (duration > 0 && onClose) {
    setTimeout(onClose, duration);
  }

  return (
    <div
      style={styles.toast + `
        background: linear-gradient(135deg, ${colors.bg}ee, ${colors.bg}dd);
        color: ${colors.text};
      `}
      class={className}
    >
      <div style={styles.toastHeader}>
        <span style={styles.toastTitle}>{alert.title}</span>
        {onClose && (
          <span style={styles.toastClose} onClick={onClose}>
            x
          </span>
        )}
      </div>
      {alert.message && (
        <div style={styles.toastMessage}>{alert.message}</div>
      )}
      {duration > 0 && (
        <div
          style={styles.toastProgress + `
            background: ${colors.text}44;
            animation-duration: ${duration}ms;
          `}
        />
      )}
    </div>
  );
}

export default AlertBadge;
