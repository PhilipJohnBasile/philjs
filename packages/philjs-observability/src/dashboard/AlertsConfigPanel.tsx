/**
 * AlertsConfigPanel - Configurable threshold alerts
 *
 * Allows users to configure, manage, and view performance
 * threshold alerts with customizable conditions and notifications.
 */

import { signal, memo, effect } from 'philjs-core';
import type { Alert, AlertSeverity } from '../widgets/AlertBadge';

// ============================================================================
// Types
// ============================================================================

export type AlertCondition =
  | 'greater_than'
  | 'less_than'
  | 'equals'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'between'
  | 'outside';

export type AlertMetricType =
  | 'fcp'
  | 'lcp'
  | 'cls'
  | 'fid'
  | 'ttfb'
  | 'memory_usage'
  | 'error_rate'
  | 'response_time'
  | 'request_rate'
  | 'cpu_usage'
  | 'custom';

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  metric: AlertMetricType;
  customMetricName?: string;
  condition: AlertCondition;
  threshold: number;
  thresholdMax?: number;  // For 'between' and 'outside' conditions
  duration?: number;      // How long condition must be true (ms)
  cooldown?: number;      // Minimum time between alerts (ms)
  severity: AlertSeverity;
  channels: AlertChannel[];
  lastTriggered?: number;
  triggerCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'in_app' | 'pagerduty';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  triggeredAt: number;
  resolvedAt?: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
}

export interface AlertsConfigPanelProps {
  rules: AlertRule[];
  history: AlertHistory[];
  activeAlerts: Alert[];
  onRuleCreate?: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>) => void;
  onRuleUpdate?: (id: string, updates: Partial<AlertRule>) => void;
  onRuleDelete?: (id: string) => void;
  onRuleToggle?: (id: string, enabled: boolean) => void;
  onAlertAcknowledge?: (alertId: string) => void;
  onAlertResolve?: (alertId: string) => void;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  panel: `
    background: #0f0f1a;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  header: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #1a1a2e;
  `,
  title: `
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
  `,
  controls: `
    display: flex;
    gap: 12px;
    align-items: center;
  `,
  button: `
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  `,
  buttonPrimary: `
    background: #6366f1;
    border-color: #6366f1;
  `,
  tabs: `
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #1a1a2e;
    border-radius: 8px;
  `,
  tab: `
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #8a8aaa;
    background: transparent;
    border: none;
    position: relative;
  `,
  tabActive: `
    background: #2a2a4e;
    color: #e0e0ff;
  `,
  tabBadge: `
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ef4444;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 16px;
    text-align: center;
  `,
  statsBar: `
    display: flex;
    gap: 24px;
    padding: 16px 24px;
    background: #1a1a2e;
    border-bottom: 1px solid #2a2a4a;
  `,
  stat: `
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  statValue: `
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
  `,
  statLabel: `
    font-size: 11px;
    color: #6a6a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  content: `
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  `,
  section: `
    margin-bottom: 24px;
  `,
  sectionTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  ruleList: `
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  ruleCard: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #2a2a4a;
    transition: border-color 0.2s ease;
  `,
  ruleCardHover: `
    border-color: #6366f1;
  `,
  ruleCardDisabled: `
    opacity: 0.5;
  `,
  ruleHeader: `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  `,
  ruleName: `
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
  `,
  ruleDescription: `
    color: #6a6a8a;
    font-size: 12px;
    margin-top: 4px;
  `,
  ruleActions: `
    display: flex;
    gap: 8px;
    align-items: center;
  `,
  ruleToggle: `
    position: relative;
    width: 40px;
    height: 22px;
    background: #2a2a4a;
    border-radius: 11px;
    cursor: pointer;
    transition: background 0.2s ease;
  `,
  ruleToggleActive: `
    background: #6366f1;
  `,
  ruleToggleKnob: `
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: #ffffff;
    border-radius: 50%;
    transition: transform 0.2s ease;
  `,
  ruleToggleKnobActive: `
    transform: translateX(18px);
  `,
  ruleIconButton: `
    background: transparent;
    border: none;
    color: #6a6a8a;
    cursor: pointer;
    padding: 4px;
    font-size: 14px;
    transition: color 0.2s ease;
  `,
  ruleBody: `
    display: flex;
    gap: 24px;
    align-items: center;
    flex-wrap: wrap;
  `,
  ruleCondition: `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #0f0f1a;
    border-radius: 6px;
  `,
  ruleMetric: `
    color: #6366f1;
    font-weight: 500;
    font-size: 13px;
  `,
  ruleOperator: `
    color: #8a8aaa;
    font-size: 12px;
  `,
  ruleThreshold: `
    color: #f59e0b;
    font-weight: 600;
    font-size: 13px;
    font-family: 'SF Mono', 'Monaco', monospace;
  `,
  ruleMeta: `
    display: flex;
    gap: 16px;
    margin-top: 12px;
    font-size: 12px;
    color: #6a6a8a;
  `,
  severityBadge: `
    display: inline-flex;
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  `,
  alertList: `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  alertItem: `
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: #1a1a2e;
    border-radius: 8px;
    border-left: 3px solid;
  `,
  alertIcon: `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
  `,
  alertContent: `
    flex: 1;
    min-width: 0;
  `,
  alertTitle: `
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
  `,
  alertMessage: `
    font-size: 12px;
    color: #8a8aaa;
    margin-bottom: 8px;
  `,
  alertMeta: `
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: #6a6a8a;
  `,
  alertActions: `
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  `,
  alertButton: `
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  `,
  historyItem: `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #1a1a2e;
    border-radius: 6px;
    margin-bottom: 8px;
  `,
  historyResolved: `
    opacity: 0.6;
  `,
  modal: `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `,
  modalContent: `
    background: #1a1a2e;
    border-radius: 16px;
    width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    border: 1px solid #2a2a4a;
  `,
  modalHeader: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #2a2a4a;
  `,
  modalTitle: `
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
  `,
  modalClose: `
    background: transparent;
    border: none;
    color: #6a6a8a;
    cursor: pointer;
    font-size: 20px;
    padding: 4px;
  `,
  modalBody: `
    padding: 24px;
  `,
  formGroup: `
    margin-bottom: 20px;
  `,
  formLabel: `
    display: block;
    color: #8a8aaa;
    font-size: 12px;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  formInput: `
    width: 100%;
    background: #0f0f1a;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 10px 12px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s ease;
  `,
  formSelect: `
    width: 100%;
    background: #0f0f1a;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 10px 12px;
    font-size: 14px;
    outline: none;
    cursor: pointer;
  `,
  formRow: `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  `,
  formHelp: `
    color: #6a6a8a;
    font-size: 11px;
    margin-top: 6px;
  `,
  modalFooter: `
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #2a2a4a;
  `,
  emptyState: `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #6a6a8a;
    text-align: center;
  `,
  channelBadge: `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #2a2a4e;
    border-radius: 4px;
    font-size: 11px;
    color: #a0a0c0;
  `,
};

// ============================================================================
// Colors
// ============================================================================

const severityColors: Record<AlertSeverity, { bg: string; text: string; border: string }> = {
  info: { bg: '#3b82f622', text: '#60a5fa', border: '#3b82f6' },
  warning: { bg: '#f59e0b22', text: '#fbbf24', border: '#f59e0b' },
  critical: { bg: '#ef444422', text: '#f87171', border: '#ef4444' },
};

const metricLabels: Record<AlertMetricType, string> = {
  fcp: 'First Contentful Paint',
  lcp: 'Largest Contentful Paint',
  cls: 'Cumulative Layout Shift',
  fid: 'First Input Delay',
  ttfb: 'Time to First Byte',
  memory_usage: 'Memory Usage',
  error_rate: 'Error Rate',
  response_time: 'Response Time',
  request_rate: 'Request Rate',
  cpu_usage: 'CPU Usage',
  custom: 'Custom Metric',
};

const conditionLabels: Record<AlertCondition, string> = {
  greater_than: '>',
  less_than: '<',
  equals: '=',
  greater_than_or_equal: '>=',
  less_than_or_equal: '<=',
  between: 'between',
  outside: 'outside',
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatThreshold(value: number, metric: AlertMetricType): string {
  switch (metric) {
    case 'cls':
      return value.toFixed(3);
    case 'memory_usage':
    case 'cpu_usage':
    case 'error_rate':
      return `${value}%`;
    case 'fcp':
    case 'lcp':
    case 'fid':
    case 'ttfb':
    case 'response_time':
      return `${value}ms`;
    default:
      return String(value);
  }
}

// ============================================================================
// Component
// ============================================================================

export function AlertsConfigPanel(props: AlertsConfigPanelProps) {
  const {
    rules,
    history,
    activeAlerts,
    onRuleCreate,
    onRuleUpdate,
    onRuleDelete,
    onRuleToggle,
    onAlertAcknowledge,
    onAlertResolve,
    className = '',
  } = props;

  const activeTab = signal<'active' | 'rules' | 'history'>('active');
  const showCreateModal = signal(false);
  const editingRule = signal<AlertRule | null>(null);
  const hoveredRuleId = signal<string | null>(null);

  // Form state for create/edit modal
  const formName = signal('');
  const formDescription = signal('');
  const formMetric = signal<AlertMetricType>('lcp');
  const formCustomMetric = signal('');
  const formCondition = signal<AlertCondition>('greater_than');
  const formThreshold = signal(2500);
  const formThresholdMax = signal(0);
  const formDuration = signal(0);
  const formCooldown = signal(300000);
  const formSeverity = signal<AlertSeverity>('warning');
  const formChannels = signal<AlertChannel[]>([{ type: 'in_app', config: {}, enabled: true }]);

  // Stats
  const stats = memo(() => ({
    activeCount: activeAlerts.length,
    criticalCount: activeAlerts.filter(a => a.severity === 'critical').length,
    rulesCount: rules.length,
    enabledCount: rules.filter(r => r.enabled).length,
    triggeredToday: history.filter(h => Date.now() - h.triggeredAt < 86400000).length,
  }));

  const resetForm = () => {
    formName.set('');
    formDescription.set('');
    formMetric.set('lcp');
    formCustomMetric.set('');
    formCondition.set('greater_than');
    formThreshold.set(2500);
    formThresholdMax.set(0);
    formDuration.set(0);
    formCooldown.set(300000);
    formSeverity.set('warning');
    formChannels.set([{ type: 'in_app', config: {}, enabled: true }]);
  };

  const openEditModal = (rule: AlertRule) => {
    editingRule.set(rule);
    formName.set(rule.name);
    formDescription.set(rule.description || '');
    formMetric.set(rule.metric);
    formCustomMetric.set(rule.customMetricName || '');
    formCondition.set(rule.condition);
    formThreshold.set(rule.threshold);
    formThresholdMax.set(rule.thresholdMax || 0);
    formDuration.set(rule.duration || 0);
    formCooldown.set(rule.cooldown || 300000);
    formSeverity.set(rule.severity);
    formChannels.set(rule.channels);
    showCreateModal.set(true);
  };

  const handleSubmit = () => {
    const ruleData = {
      name: formName(),
      description: formDescription() || undefined,
      enabled: true,
      metric: formMetric(),
      customMetricName: formMetric() === 'custom' ? formCustomMetric() : undefined,
      condition: formCondition(),
      threshold: formThreshold(),
      thresholdMax: formCondition() === 'between' || formCondition() === 'outside' ? formThresholdMax() : undefined,
      duration: formDuration() || undefined,
      cooldown: formCooldown() || undefined,
      severity: formSeverity(),
      channels: formChannels(),
    };

    if (editingRule()) {
      onRuleUpdate?.(editingRule()!.id, ruleData);
    } else {
      onRuleCreate?.(ruleData);
    }

    showCreateModal.set(false);
    editingRule.set(null);
    resetForm();
  };

  const renderActiveAlerts = () => (
    <div style={styles.alertList}>
      {activeAlerts.length === 0 ? (
        <div style={styles.emptyState}>
          <div style="font-size: 32px; margin-bottom: 16px; color: #22c55e;">*</div>
          <div style="font-size: 16px; margin-bottom: 8px; color: #22c55e;">All Clear</div>
          <div style="font-size: 13px;">No active alerts at this time</div>
        </div>
      ) : (
        activeAlerts.map(alert => {
          const colors = severityColors[alert.severity];

          return (
            <div
              style={styles.alertItem + `border-left-color: ${colors.border};`}
            >
              <div
                style={styles.alertIcon + `background: ${colors.bg}; color: ${colors.text};`}
              >
                !
              </div>
              <div style={styles.alertContent}>
                <div style={styles.alertTitle + `color: ${colors.text};`}>
                  {alert.title}
                </div>
                <div style={styles.alertMessage}>{alert.message}</div>
                <div style={styles.alertMeta}>
                  <span>{formatTimeAgo(alert.timestamp)}</span>
                  <span
                    style={styles.severityBadge + `background: ${colors.bg}; color: ${colors.text};`}
                  >
                    {alert.severity}
                  </span>
                </div>
              </div>
              <div style={styles.alertActions}>
                {onAlertAcknowledge && !alert.acknowledged && (
                  <button
                    style={styles.alertButton + 'background: #2a2a4e; color: #e0e0ff;'}
                    onClick={() => onAlertAcknowledge(alert.id)}
                  >
                    Acknowledge
                  </button>
                )}
                {onAlertResolve && (
                  <button
                    style={styles.alertButton + 'background: #22c55e33; color: #22c55e;'}
                    onClick={() => onAlertResolve(alert.id)}
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderRules = () => (
    <div style={styles.ruleList}>
      {rules.length === 0 ? (
        <div style={styles.emptyState}>
          <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">No alert rules configured</div>
          <div style="font-size: 13px; margin-bottom: 16px;">
            Create rules to get notified when metrics exceed thresholds
          </div>
          <button
            style={styles.button + styles.buttonPrimary}
            onClick={() => { resetForm(); showCreateModal.set(true); }}
          >
            Create First Rule
          </button>
        </div>
      ) : (
        rules.map(rule => {
          const colors = severityColors[rule.severity];
          const isHovered = hoveredRuleId() === rule.id;

          return (
            <div
              style={styles.ruleCard +
                (isHovered ? styles.ruleCardHover : '') +
                (!rule.enabled ? styles.ruleCardDisabled : '')}
              onMouseEnter={() => hoveredRuleId.set(rule.id)}
              onMouseLeave={() => hoveredRuleId.set(null)}
            >
              <div style={styles.ruleHeader}>
                <div>
                  <div style={styles.ruleName}>{rule.name}</div>
                  {rule.description && (
                    <div style={styles.ruleDescription}>{rule.description}</div>
                  )}
                </div>
                <div style={styles.ruleActions}>
                  <div
                    style={styles.ruleToggle + (rule.enabled ? styles.ruleToggleActive : '')}
                    onClick={() => onRuleToggle?.(rule.id, !rule.enabled)}
                  >
                    <div
                      style={styles.ruleToggleKnob + (rule.enabled ? styles.ruleToggleKnobActive : '')}
                    />
                  </div>
                  <button
                    style={styles.ruleIconButton}
                    onClick={() => openEditModal(rule)}
                    title="Edit rule"
                  >
                    E
                  </button>
                  <button
                    style={styles.ruleIconButton + 'color: #ef4444;'}
                    onClick={() => onRuleDelete?.(rule.id)}
                    title="Delete rule"
                  >
                    X
                  </button>
                </div>
              </div>

              <div style={styles.ruleBody}>
                <div style={styles.ruleCondition}>
                  <span style={styles.ruleMetric}>
                    {rule.metric === 'custom' ? rule.customMetricName : metricLabels[rule.metric]}
                  </span>
                  <span style={styles.ruleOperator}>{conditionLabels[rule.condition]}</span>
                  <span style={styles.ruleThreshold}>
                    {formatThreshold(rule.threshold, rule.metric)}
                    {rule.thresholdMax !== undefined && ` - ${formatThreshold(rule.thresholdMax, rule.metric)}`}
                  </span>
                </div>

                <span
                  style={styles.severityBadge + `background: ${colors.bg}; color: ${colors.text};`}
                >
                  {rule.severity}
                </span>

                {rule.channels.filter(c => c.enabled).map(channel => (
                  <span style={styles.channelBadge}>
                    {channel.type}
                  </span>
                ))}
              </div>

              <div style={styles.ruleMeta}>
                <span>Triggered {rule.triggerCount} times</span>
                {rule.lastTriggered && (
                  <span>Last: {formatTimeAgo(rule.lastTriggered)}</span>
                )}
                {rule.duration && <span>For {rule.duration / 1000}s</span>}
                {rule.cooldown && <span>Cooldown: {rule.cooldown / 60000}m</span>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderHistory = () => (
    <div>
      {history.length === 0 ? (
        <div style={styles.emptyState}>
          <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">No alert history</div>
          <div style="font-size: 13px;">Past alerts will appear here</div>
        </div>
      ) : (
        history.slice(0, 50).map(item => {
          const colors = severityColors[item.severity];

          return (
            <div
              style={styles.historyItem + (item.resolvedAt ? styles.historyResolved : '')}
            >
              <div style="display: flex; align-items: center; gap: 12px;">
                <span
                  style={styles.severityBadge + `background: ${colors.bg}; color: ${colors.text};`}
                >
                  {item.severity}
                </span>
                <div>
                  <div style="color: #e0e0ff; font-size: 13px; font-weight: 500;">
                    {item.ruleName}
                  </div>
                  <div style="color: #6a6a8a; font-size: 11px;">
                    {item.message}
                  </div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="color: #8a8aaa; font-size: 12px;">
                  {formatTimestamp(item.triggeredAt)}
                </div>
                {item.resolvedAt && (
                  <div style="color: #22c55e; font-size: 11px;">
                    Resolved {formatTimeAgo(item.resolvedAt)}
                  </div>
                )}
                {item.acknowledged && !item.resolvedAt && (
                  <div style="color: #6366f1; font-size: 11px;">
                    Acknowledged
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderModal = () => (
    <div style={styles.modal} onClick={() => { showCreateModal.set(false); editingRule.set(null); }}>
      <div style={styles.modalContent} onClick={(e: Event) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            {editingRule() ? 'Edit Alert Rule' : 'Create Alert Rule'}
          </h3>
          <button
            style={styles.modalClose}
            onClick={() => { showCreateModal.set(false); editingRule.set(null); }}
          >
            x
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Rule Name</label>
            <input
              type="text"
              style={styles.formInput}
              value={formName()}
              onInput={(e: InputEvent) => formName.set((e.target as HTMLInputElement).value)}
              placeholder="e.g., High LCP Alert"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Description (optional)</label>
            <input
              type="text"
              style={styles.formInput}
              value={formDescription()}
              onInput={(e: InputEvent) => formDescription.set((e.target as HTMLInputElement).value)}
              placeholder="Describe when this alert should trigger"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Metric</label>
              <select
                style={styles.formSelect}
                value={formMetric()}
                onChange={(e: Event) => formMetric.set((e.target as HTMLSelectElement).value as AlertMetricType)}
              >
                {Object.entries(metricLabels).map(([value, label]) => (
                  <option value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Severity</label>
              <select
                style={styles.formSelect}
                value={formSeverity()}
                onChange={(e: Event) => formSeverity.set((e.target as HTMLSelectElement).value as AlertSeverity)}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {formMetric() === 'custom' && (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Custom Metric Name</label>
              <input
                type="text"
                style={styles.formInput}
                value={formCustomMetric()}
                onInput={(e: InputEvent) => formCustomMetric.set((e.target as HTMLInputElement).value)}
                placeholder="e.g., custom_api_latency"
              />
            </div>
          )}

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Condition</label>
              <select
                style={styles.formSelect}
                value={formCondition()}
                onChange={(e: Event) => formCondition.set((e.target as HTMLSelectElement).value as AlertCondition)}
              >
                <option value="greater_than">Greater than ({'>'}) </option>
                <option value="less_than">Less than ({'<'})</option>
                <option value="equals">Equals (=)</option>
                <option value="greater_than_or_equal">Greater or equal ({'>'}=)</option>
                <option value="less_than_or_equal">Less or equal ({'<'}=)</option>
                <option value="between">Between</option>
                <option value="outside">Outside</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Threshold</label>
              <input
                type="number"
                style={styles.formInput}
                value={formThreshold()}
                onInput={(e: InputEvent) => formThreshold.set(Number((e.target as HTMLInputElement).value))}
              />
            </div>
          </div>

          {(formCondition() === 'between' || formCondition() === 'outside') && (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Maximum Threshold</label>
              <input
                type="number"
                style={styles.formInput}
                value={formThresholdMax()}
                onInput={(e: InputEvent) => formThresholdMax.set(Number((e.target as HTMLInputElement).value))}
              />
            </div>
          )}

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Duration (ms)</label>
              <input
                type="number"
                style={styles.formInput}
                value={formDuration()}
                onInput={(e: InputEvent) => formDuration.set(Number((e.target as HTMLInputElement).value))}
                placeholder="0"
              />
              <div style={styles.formHelp}>
                How long condition must be true before alerting
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Cooldown (ms)</label>
              <input
                type="number"
                style={styles.formInput}
                value={formCooldown()}
                onInput={(e: InputEvent) => formCooldown.set(Number((e.target as HTMLInputElement).value))}
                placeholder="300000"
              />
              <div style={styles.formHelp}>
                Minimum time between repeat alerts
              </div>
            </div>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button
            style={styles.button}
            onClick={() => { showCreateModal.set(false); editingRule.set(null); }}
          >
            Cancel
          </button>
          <button
            style={styles.button + styles.buttonPrimary}
            onClick={handleSubmit}
            disabled={!formName() || !formThreshold()}
          >
            {editingRule() ? 'Save Changes' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.panel} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Alerts</h2>
        <div style={styles.controls}>
          <div style={styles.tabs}>
            <button
              style={styles.tab + (activeTab() === 'active' ? styles.tabActive : '')}
              onClick={() => activeTab.set('active')}
            >
              Active
              {stats().activeCount > 0 && (
                <span style={styles.tabBadge}>{stats().activeCount}</span>
              )}
            </button>
            <button
              style={styles.tab + (activeTab() === 'rules' ? styles.tabActive : '')}
              onClick={() => activeTab.set('rules')}
            >
              Rules ({stats().rulesCount})
            </button>
            <button
              style={styles.tab + (activeTab() === 'history' ? styles.tabActive : '')}
              onClick={() => activeTab.set('history')}
            >
              History
            </button>
          </div>
          {onRuleCreate && (
            <button
              style={styles.button + styles.buttonPrimary}
              onClick={() => { resetForm(); showCreateModal.set(true); }}
            >
              Create Rule
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statValue + (stats().criticalCount > 0 ? 'color: #ef4444;' : 'color: #22c55e;')}>
            {stats().activeCount}
          </span>
          <span style={styles.statLabel}>Active Alerts</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue + (stats().criticalCount > 0 ? 'color: #ef4444;' : '')}>
            {stats().criticalCount}
          </span>
          <span style={styles.statLabel}>Critical</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{stats().enabledCount}</span>
          <span style={styles.statLabel}>Rules Enabled</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{stats().triggeredToday}</span>
          <span style={styles.statLabel}>Triggered Today</span>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab() === 'active' && renderActiveAlerts()}
        {activeTab() === 'rules' && renderRules()}
        {activeTab() === 'history' && renderHistory()}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal() && renderModal()}
    </div>
  );
}

export default AlertsConfigPanel;
