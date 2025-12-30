/**
 * Alerting Engine for PhilJS Observability
 *
 * Real-time alerting based on metrics and events:
 * - Alert rule definitions
 * - Threshold evaluation
 * - Notification channels
 * - Alert history & acknowledgment
 */

// =============================================================================
// Types
// =============================================================================

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertState = 'pending' | 'firing' | 'resolved' | 'acknowledged';
export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  metric: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  for?: number; // Duration in ms before firing
  cooldown?: number; // Duration in ms before re-firing
  notificationChannels?: string[];
}

export interface AlertCondition {
  operator: ComparisonOperator;
  threshold: number;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'last';
  window?: number; // Time window in ms
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  state: AlertState;
  severity: AlertSeverity;
  value: number;
  threshold: number;
  message: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: number;
  endsAt?: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'webhook' | 'email' | 'slack' | 'pagerduty' | 'console';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface AlertManagerConfig {
  evaluationInterval?: number;
  retentionPeriod?: number;
  maxAlerts?: number;
  defaultNotificationChannels?: string[];
}

// =============================================================================
// Alert Manager Implementation
// =============================================================================

export class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private pendingAlerts: Map<string, { startTime: number; value: number }> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private evaluationInterval: ReturnType<typeof setInterval> | null = null;
  private metrics: Map<string, number[]> = new Map();
  private listeners: Set<(alert: Alert) => void> = new Set();

  private config: Required<AlertManagerConfig> = {
    evaluationInterval: 10000, // 10 seconds
    retentionPeriod: 86400000, // 24 hours
    maxAlerts: 1000,
    defaultNotificationChannels: [],
  };

  constructor(config?: AlertManagerConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // =========================================================================
  // Rule Management
  // =========================================================================

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.pendingAlerts.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
    }
  }

  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  enableRule(ruleId: string): void {
    this.updateRule(ruleId, { enabled: true });
  }

  disableRule(ruleId: string): void {
    this.updateRule(ruleId, { enabled: false });
  }

  // =========================================================================
  // Channel Management
  // =========================================================================

  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
  }

  removeChannel(channelId: string): void {
    this.channels.delete(channelId);
  }

  getChannel(channelId: string): NotificationChannel | undefined {
    return this.channels.get(channelId);
  }

  getChannels(): NotificationChannel[] {
    return Array.from(this.channels.values());
  }

  // =========================================================================
  // Metric Recording
  // =========================================================================

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only recent values
    const maxValues = 1000;
    if (values.length > maxValues) {
      this.metrics.set(name, values.slice(-maxValues));
    }
  }

  // =========================================================================
  // Alert Evaluation
  // =========================================================================

  start(): void {
    if (this.evaluationInterval) return;

    this.evaluationInterval = setInterval(() => {
      this.evaluate();
    }, this.config.evaluationInterval);

    // Run immediately
    this.evaluate();
  }

  stop(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
  }

  private evaluate(): void {
    const now = Date.now();

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown
      const cooldownEnd = this.cooldowns.get(rule.id);
      if (cooldownEnd && now < cooldownEnd) continue;

      // Get metric values
      const values = this.metrics.get(rule.metric) || [];
      if (values.length === 0) continue;

      // Filter by window if specified
      const windowValues = rule.condition.window
        ? this.getValuesInWindow(values, rule.condition.window)
        : values;

      // Aggregate values
      const aggregatedValue = this.aggregate(windowValues, rule.condition.aggregation || 'last');

      // Evaluate condition
      const isTriggered = this.evaluateCondition(aggregatedValue, rule.condition);

      if (isTriggered) {
        this.handleTriggered(rule, aggregatedValue, now);
      } else {
        this.handleResolved(rule, now);
      }
    }

    // Clean up old alerts
    this.cleanup();
  }

  private getValuesInWindow(values: number[], windowMs: number): number[] {
    // In a real implementation, values would have timestamps
    // For simplicity, we assume each value represents one evaluation interval
    const numValues = Math.ceil(windowMs / this.config.evaluationInterval);
    return values.slice(-numValues);
  }

  private aggregate(values: number[], aggregation: string): number {
    if (values.length === 0) return 0;

    switch (aggregation) {
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      case 'last':
      default:
        return values[values.length - 1]!;
    }
  }

  private evaluateCondition(value: number, condition: AlertCondition): boolean {
    const { operator, threshold } = condition;

    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'neq': return value !== threshold;
      default: return false;
    }
  }

  private handleTriggered(rule: AlertRule, value: number, now: number): void {
    const pending = this.pendingAlerts.get(rule.id);

    if (!pending) {
      // Start pending period
      this.pendingAlerts.set(rule.id, { startTime: now, value });
      return;
    }

    // Check if pending period has elapsed
    const forDuration = rule.for || 0;
    if (now - pending.startTime < forDuration) {
      return;
    }

    // Check if alert already firing
    const existingAlert = this.getActiveAlertForRule(rule.id);
    if (existingAlert && existingAlert.state === 'firing') {
      return;
    }

    // Fire alert
    const alert = this.createAlert(rule, value);
    this.alerts.set(alert.id, alert);
    this.pendingAlerts.delete(rule.id);

    // Set cooldown
    if (rule.cooldown) {
      this.cooldowns.set(rule.id, now + rule.cooldown);
    }

    // Notify
    this.notify(alert);
  }

  private handleResolved(rule: AlertRule, now: number): void {
    // Clear pending
    this.pendingAlerts.delete(rule.id);

    // Resolve active alert
    const activeAlert = this.getActiveAlertForRule(rule.id);
    if (activeAlert && activeAlert.state === 'firing') {
      activeAlert.state = 'resolved';
      activeAlert.resolvedAt = now;
      activeAlert.endsAt = now;

      // Notify resolution
      this.notify(activeAlert);
    }
  }

  private getActiveAlertForRule(ruleId: string): Alert | undefined {
    for (const alert of this.alerts.values()) {
      if (alert.ruleId === ruleId && (alert.state === 'firing' || alert.state === 'pending')) {
        return alert;
      }
    }
    return undefined;
  }

  private createAlert(rule: AlertRule, value: number): Alert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      state: 'firing',
      severity: rule.severity,
      value,
      threshold: rule.condition.threshold,
      message: this.formatMessage(rule, value),
      labels: { ...rule.labels },
      annotations: { ...rule.annotations },
      startsAt: Date.now(),
    };
  }

  private formatMessage(rule: AlertRule, value: number): string {
    const operatorText = {
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      eq: '==',
      neq: '!=',
    }[rule.condition.operator];

    return `${rule.name}: ${rule.metric} ${operatorText} ${rule.condition.threshold} (current: ${value.toFixed(2)})`;
  }

  private notify(alert: Alert): void {
    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(alert);
      } catch (error) {
        console.error('Alert listener error:', error);
      }
    }

    // Get notification channels
    const rule = this.rules.get(alert.ruleId);
    const channelIds = rule?.notificationChannels || this.config.defaultNotificationChannels;

    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (channel && channel.enabled) {
        this.sendNotification(channel, alert);
      }
    }
  }

  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    try {
      switch (channel.type) {
        case 'console':
          this.sendConsoleNotification(alert);
          break;
        case 'webhook':
          await this.sendWebhookNotification(channel, alert);
          break;
        case 'slack':
          await this.sendSlackNotification(channel, alert);
          break;
        case 'email':
          await this.sendEmailNotification(channel, alert);
          break;
        case 'pagerduty':
          await this.sendPagerDutyNotification(channel, alert);
          break;
      }
    } catch (error) {
      console.error(`Failed to send notification to ${channel.name}:`, error);
    }
  }

  private sendConsoleNotification(alert: Alert): void {
    const prefix = alert.state === 'resolved' ? '✅ RESOLVED' : `🚨 ${alert.severity.toUpperCase()}`;
    console.log(`${prefix}: ${alert.message}`);
  }

  private async sendWebhookNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const url = channel.config['url'] as string;
    if (!url) return;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(channel.config['headers'] as Record<string, string> || {}),
      },
      body: JSON.stringify({
        alert,
        timestamp: Date.now(),
      }),
    });
  }

  private async sendSlackNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const webhookUrl = channel.config['webhookUrl'] as string;
    if (!webhookUrl) return;

    const color = {
      critical: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
    }[alert.severity];

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: alert.state === 'resolved' ? `✅ Resolved: ${alert.ruleName}` : `🚨 ${alert.ruleName}`,
          text: alert.message,
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'State', value: alert.state, short: true },
            { title: 'Value', value: alert.value.toFixed(2), short: true },
            { title: 'Threshold', value: alert.threshold.toString(), short: true },
          ],
          ts: Math.floor(alert.startsAt / 1000),
        }],
      }),
    });
  }

  private async sendEmailNotification(_channel: NotificationChannel, _alert: Alert): Promise<void> {
    // Email sending would require a backend service
    console.log('Email notification not implemented (requires backend)');
  }

  private async sendPagerDutyNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const routingKey = channel.config['routingKey'] as string;
    if (!routingKey) return;

    const eventAction = alert.state === 'resolved' ? 'resolve' : 'trigger';

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: routingKey,
        event_action: eventAction,
        dedup_key: alert.ruleId,
        payload: {
          summary: alert.message,
          severity: alert.severity === 'critical' ? 'critical' : 'warning',
          source: 'philjs-observability',
          custom_details: {
            value: alert.value,
            threshold: alert.threshold,
            labels: alert.labels,
          },
        },
      }),
    });
  }

  private cleanup(): void {
    const now = Date.now();
    const retentionThreshold = now - this.config.retentionPeriod;

    // Remove old resolved alerts
    for (const [id, alert] of this.alerts) {
      if (alert.state === 'resolved' && alert.resolvedAt && alert.resolvedAt < retentionThreshold) {
        this.alerts.delete(id);
      }
    }

    // Limit total alerts
    if (this.alerts.size > this.config.maxAlerts) {
      const sorted = Array.from(this.alerts.entries())
        .sort((a, b) => a[1].startsAt - b[1].startsAt);

      const toRemove = sorted.slice(0, this.alerts.size - this.config.maxAlerts);
      for (const [id] of toRemove) {
        this.alerts.delete(id);
      }
    }
  }

  // =========================================================================
  // Alert Management
  // =========================================================================

  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  getAlerts(filter?: {
    state?: AlertState;
    severity?: AlertSeverity;
    ruleId?: string;
    since?: number;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filter) {
      if (filter.state) {
        alerts = alerts.filter((a) => a.state === filter.state);
      }
      if (filter.severity) {
        alerts = alerts.filter((a) => a.severity === filter.severity);
      }
      if (filter.ruleId) {
        alerts = alerts.filter((a) => a.ruleId === filter.ruleId);
      }
      if (filter.since) {
        const since = filter.since;
        alerts = alerts.filter((a) => a.startsAt >= since);
      }
    }

    return alerts.sort((a, b) => b.startsAt - a.startsAt);
  }

  getActiveAlerts(): Alert[] {
    return this.getAlerts({ state: 'firing' });
  }

  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.state !== 'firing') return false;

    alert.state = 'acknowledged';
    alert.acknowledgedAt = Date.now();
    if (acknowledgedBy !== undefined) {
      alert.acknowledgedBy = acknowledgedBy;
    }

    return true;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.state === 'resolved') return false;

    alert.state = 'resolved';
    alert.resolvedAt = Date.now();
    alert.endsAt = Date.now();

    return true;
  }

  // =========================================================================
  // Event Listeners
  // =========================================================================

  onAlert(listener: (alert: Alert) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // =========================================================================
  // Statistics
  // =========================================================================

  getStats(): {
    totalRules: number;
    enabledRules: number;
    activeAlerts: number;
    totalAlerts: number;
    alertsBySeverity: Record<AlertSeverity, number>;
    alertsByState: Record<AlertState, number>;
  } {
    const alerts = Array.from(this.alerts.values());

    const alertsBySeverity: Record<AlertSeverity, number> = {
      critical: 0,
      warning: 0,
      info: 0,
    };

    const alertsByState: Record<AlertState, number> = {
      pending: 0,
      firing: 0,
      resolved: 0,
      acknowledged: 0,
    };

    for (const alert of alerts) {
      alertsBySeverity[alert.severity]++;
      alertsByState[alert.state]++;
    }

    return {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter((r) => r.enabled).length,
      activeAlerts: alertsByState.firing,
      totalAlerts: alerts.length,
      alertsBySeverity,
      alertsByState,
    };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let alertManagerInstance: AlertManager | null = null;

export function initAlertManager(config?: AlertManagerConfig): AlertManager {
  alertManagerInstance = new AlertManager(config);
  return alertManagerInstance;
}

export function getAlertManager(): AlertManager {
  if (!alertManagerInstance) {
    alertManagerInstance = new AlertManager();
  }
  return alertManagerInstance;
}

// =============================================================================
// Preset Rules
// =============================================================================

export const presetRules = {
  highCpuUsage: {
    id: 'high-cpu-usage',
    name: 'High CPU Usage',
    description: 'Alert when CPU usage exceeds 80%',
    enabled: true,
    metric: 'cpu.usage',
    condition: { operator: 'gt' as const, threshold: 80, aggregation: 'avg' as const, window: 60000 },
    severity: 'warning' as const,
    for: 30000,
  },

  highMemoryUsage: {
    id: 'high-memory-usage',
    name: 'High Memory Usage',
    description: 'Alert when memory usage exceeds 90%',
    enabled: true,
    metric: 'memory.usage',
    condition: { operator: 'gt' as const, threshold: 90, aggregation: 'avg' as const, window: 60000 },
    severity: 'critical' as const,
    for: 30000,
  },

  highErrorRate: {
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds 5%',
    enabled: true,
    metric: 'errors.rate',
    condition: { operator: 'gt' as const, threshold: 5, aggregation: 'avg' as const, window: 300000 },
    severity: 'critical' as const,
    for: 60000,
  },

  slowResponseTime: {
    id: 'slow-response-time',
    name: 'Slow Response Time',
    description: 'Alert when p95 response time exceeds 2s',
    enabled: true,
    metric: 'response.time.p95',
    condition: { operator: 'gt' as const, threshold: 2000, aggregation: 'avg' as const, window: 60000 },
    severity: 'warning' as const,
    for: 60000,
  },

  lowDiskSpace: {
    id: 'low-disk-space',
    name: 'Low Disk Space',
    description: 'Alert when disk usage exceeds 85%',
    enabled: true,
    metric: 'disk.usage',
    condition: { operator: 'gt' as const, threshold: 85, aggregation: 'last' as const },
    severity: 'warning' as const,
  },
};

// =============================================================================
// React Hook
// =============================================================================

export function useAlerts(filter?: {
  state?: AlertState;
  severity?: AlertSeverity;
}): {
  alerts: Alert[];
  stats: ReturnType<AlertManager['getStats']>;
  acknowledge: (alertId: string) => void;
  resolve: (alertId: string) => void;
} {
  const manager = getAlertManager();

  return {
    alerts: manager.getAlerts(filter),
    stats: manager.getStats(),
    acknowledge: (alertId) => manager.acknowledgeAlert(alertId),
    resolve: (alertId) => manager.resolveAlert(alertId),
  };
}
