/**
 * Alerting System
 * Threshold alerts, anomaly detection, and notification channels
 */

import type { MetricsSnapshot, WebVitalsMetrics } from '../collector/metrics';
import type { CapturedError } from '../collector/errors';

// ============================================================================
// Types
// ============================================================================

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'active' | 'resolved' | 'acknowledged';

export type MetricType = keyof WebVitalsMetrics | 'errorRate' | 'custom';

export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

export interface ThresholdCondition {
  type: 'threshold';
  metric: MetricType;
  customMetricName?: string;
  operator: ComparisonOperator;
  value: number;
  /** Duration in ms that condition must be true */
  duration?: number;
}

export interface AnomalyCondition {
  type: 'anomaly';
  metric: MetricType;
  customMetricName?: string;
  /** Standard deviations from mean */
  sensitivity: number;
  /** Window size for baseline calculation in ms */
  baselineWindow: number;
}

export interface ErrorRateCondition {
  type: 'errorRate';
  /** Errors per minute threshold */
  threshold: number;
  /** Window size in ms */
  window: number;
}

export interface ErrorPatternCondition {
  type: 'errorPattern';
  /** Regex pattern to match error messages */
  pattern: string;
  /** Minimum occurrences */
  minOccurrences: number;
  /** Time window in ms */
  window: number;
}

export type AlertCondition =
  | ThresholdCondition
  | AnomalyCondition
  | ErrorRateCondition
  | ErrorPatternCondition;

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  condition: AlertCondition;
  severity: AlertSeverity;
  /** Cooldown period before re-alerting in ms */
  cooldown: number;
  /** Tags to attach to alerts */
  tags?: Record<string, string>;
  /** Notification channels to use */
  channels: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  triggeredAt: number;
  resolvedAt?: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  value: number;
  threshold?: number;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface NotificationChannel {
  id: string;
  type: 'webhook' | 'email' | 'slack' | 'pagerduty' | 'console' | 'custom';
  name: string;
  config: NotificationConfig;
  enabled: boolean;
}

export type NotificationConfig =
  | WebhookConfig
  | EmailConfig
  | SlackConfig
  | PagerDutyConfig
  | ConsoleConfig
  | CustomConfig;

export interface WebhookConfig {
  type: 'webhook';
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  authToken?: string;
}

export interface EmailConfig {
  type: 'email';
  recipients: string[];
  smtpEndpoint?: string;
}

export interface SlackConfig {
  type: 'slack';
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface PagerDutyConfig {
  type: 'pagerduty';
  routingKey: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface ConsoleConfig {
  type: 'console';
}

export interface CustomConfig {
  type: 'custom';
  handler: (alert: Alert) => Promise<void>;
}

export interface AlertManagerConfig {
  /** Rules to evaluate */
  rules?: AlertRule[];
  /** Notification channels */
  channels?: NotificationChannel[];
  /** Evaluation interval in ms */
  evaluationInterval?: number;
  /** Maximum alerts to store */
  maxAlerts?: number;
  /** On alert triggered callback */
  onAlert?: (alert: Alert) => void;
  /** On alert resolved callback */
  onResolve?: (alert: Alert) => void;
}

// ============================================================================
// Anomaly Detection
// ============================================================================

export class AnomalyDetector {
  private dataPoints: Map<string, number[]> = new Map();
  private maxDataPoints: number;

  constructor(maxDataPoints = 1000) {
    this.maxDataPoints = maxDataPoints;
  }

  addDataPoint(metric: string, value: number): void {
    const points = this.dataPoints.get(metric) || [];
    points.push(value);

    if (points.length > this.maxDataPoints) {
      points.shift();
    }

    this.dataPoints.set(metric, points);
  }

  isAnomaly(metric: string, value: number, sensitivity: number): boolean {
    const points = this.dataPoints.get(metric);
    if (!points || points.length < 10) {
      return false; // Not enough data
    }

    const stats = this.calculateStats(points);
    const deviation = Math.abs(value - stats.mean) / stats.stdDev;

    return deviation > sensitivity;
  }

  getBaseline(metric: string): { mean: number; stdDev: number } | null {
    const points = this.dataPoints.get(metric);
    if (!points || points.length < 2) {
      return null;
    }

    return this.calculateStats(points);
  }

  private calculateStats(values: number[]): { mean: number; stdDev: number } {
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev: stdDev || 1 }; // Avoid division by zero
  }

  clear(metric?: string): void {
    if (metric) {
      this.dataPoints.delete(metric);
    } else {
      this.dataPoints.clear();
    }
  }
}

// ============================================================================
// Alert Manager
// ============================================================================

export class AlertManager {
  private config: Required<AlertManagerConfig>;
  private alerts: Alert[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private anomalyDetector: AnomalyDetector;
  private errorBuffer: CapturedError[] = [];
  private evaluationTimer: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;

  constructor(config: AlertManagerConfig = {}) {
    this.config = {
      rules: config.rules ?? [],
      channels: config.channels ?? [],
      evaluationInterval: config.evaluationInterval ?? 60000,
      maxAlerts: config.maxAlerts ?? 1000,
      onAlert: config.onAlert ?? (() => {}),
      onResolve: config.onResolve ?? (() => {}),
    };

    this.anomalyDetector = new AnomalyDetector();
  }

  /**
   * Start the alert manager
   */
  start(): void {
    if (this.evaluationTimer) return;

    this.evaluationTimer = setInterval(() => {
      this.checkForResolvedAlerts();
    }, this.config.evaluationInterval);
  }

  /**
   * Stop the alert manager
   */
  stop(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }
  }

  /**
   * Destroy the alert manager
   */
  destroy(): void {
    this.isDestroyed = true;
    this.stop();
    this.alerts = [];
    this.activeAlerts.clear();
    this.lastAlertTime.clear();
    this.anomalyDetector.clear();
  }

  // ============================================================================
  // Rule Management
  // ============================================================================

  addRule(rule: AlertRule): void {
    const existingIndex = this.config.rules.findIndex((r) => r.id === rule.id);
    if (existingIndex >= 0) {
      this.config.rules[existingIndex] = rule;
    } else {
      this.config.rules.push(rule);
    }
  }

  removeRule(ruleId: string): void {
    this.config.rules = this.config.rules.filter((r) => r.id !== ruleId);
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.config.rules.find((r) => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  getRules(): AlertRule[] {
    return [...this.config.rules];
  }

  // ============================================================================
  // Channel Management
  // ============================================================================

  addChannel(channel: NotificationChannel): void {
    const existingIndex = this.config.channels.findIndex((c) => c.id === channel.id);
    if (existingIndex >= 0) {
      this.config.channels[existingIndex] = channel;
    } else {
      this.config.channels.push(channel);
    }
  }

  removeChannel(channelId: string): void {
    this.config.channels = this.config.channels.filter((c) => c.id !== channelId);
  }

  getChannels(): NotificationChannel[] {
    return [...this.config.channels];
  }

  // ============================================================================
  // Metrics Processing
  // ============================================================================

  processMetrics(snapshot: MetricsSnapshot): void {
    if (this.isDestroyed) return;

    const webVitals = snapshot.webVitals;

    // Add data points for anomaly detection
    for (const [metric, value] of Object.entries(webVitals)) {
      if (value !== null) {
        this.anomalyDetector.addDataPoint(metric, value);
      }
    }

    // Evaluate rules
    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;

      const triggered = this.evaluateRule(rule, snapshot);

      if (triggered) {
        this.triggerAlert(rule, snapshot);
      } else {
        this.checkResolveAlert(rule.id);
      }
    }
  }

  processError(error: CapturedError): void {
    if (this.isDestroyed) return;

    this.errorBuffer.push(error);

    // Keep buffer size reasonable
    if (this.errorBuffer.length > 1000) {
      this.errorBuffer.shift();
    }

    // Evaluate error-based rules
    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;
      if (rule.condition.type !== 'errorRate' && rule.condition.type !== 'errorPattern') {
        continue;
      }

      const triggered = this.evaluateErrorRule(rule);

      if (triggered) {
        this.triggerErrorAlert(rule);
      }
    }
  }

  // ============================================================================
  // Alert Management
  // ============================================================================

  getAlerts(status?: AlertStatus): Alert[] {
    if (status) {
      return this.alerts.filter((a) => a.status === status);
    }
    return [...this.alerts];
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  acknowledgeAlert(alertId: string, acknowledgedBy?: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = Date.now();
      alert.acknowledgedBy = acknowledgedBy;
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && alert.status !== 'resolved') {
      alert.status = 'resolved';
      alert.resolvedAt = Date.now();
      this.activeAlerts.delete(alert.ruleId);
      this.config.onResolve(alert);
    }
  }

  clearAlerts(): void {
    this.alerts = [];
    this.activeAlerts.clear();
    this.lastAlertTime.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private evaluateRule(rule: AlertRule, snapshot: MetricsSnapshot): boolean {
    const condition = rule.condition;

    if (condition.type === 'threshold') {
      return this.evaluateThreshold(condition, snapshot);
    }

    if (condition.type === 'anomaly') {
      return this.evaluateAnomaly(condition, snapshot);
    }

    return false;
  }

  private evaluateThreshold(
    condition: ThresholdCondition,
    snapshot: MetricsSnapshot
  ): boolean {
    const value = this.getMetricValue(condition.metric, snapshot, condition.customMetricName);
    if (value === null) return false;

    return this.compareValues(value, condition.operator, condition.value);
  }

  private evaluateAnomaly(
    condition: AnomalyCondition,
    snapshot: MetricsSnapshot
  ): boolean {
    const value = this.getMetricValue(condition.metric, snapshot, condition.customMetricName);
    if (value === null) return false;

    const metricKey = condition.customMetricName || condition.metric;
    return this.anomalyDetector.isAnomaly(metricKey, value, condition.sensitivity);
  }

  private evaluateErrorRule(rule: AlertRule): boolean {
    const condition = rule.condition;

    if (condition.type === 'errorRate') {
      return this.evaluateErrorRate(condition);
    }

    if (condition.type === 'errorPattern') {
      return this.evaluateErrorPattern(condition);
    }

    return false;
  }

  private evaluateErrorRate(condition: ErrorRateCondition): boolean {
    const windowStart = Date.now() - condition.window;
    const recentErrors = this.errorBuffer.filter(
      (e) => e.timestamp >= windowStart
    );

    const errorsPerMinute = (recentErrors.length / condition.window) * 60000;
    return errorsPerMinute >= condition.threshold;
  }

  private evaluateErrorPattern(condition: ErrorPatternCondition): boolean {
    const windowStart = Date.now() - condition.window;
    const pattern = new RegExp(condition.pattern, 'i');

    const matchingErrors = this.errorBuffer.filter(
      (e) => e.timestamp >= windowStart && pattern.test(e.error.message)
    );

    return matchingErrors.length >= condition.minOccurrences;
  }

  private getMetricValue(
    metric: MetricType,
    snapshot: MetricsSnapshot,
    customMetricName?: string
  ): number | null {
    if (metric === 'custom' && customMetricName) {
      const customMetric = snapshot.customMetrics.find(
        (m) => m.name === customMetricName
      );
      return customMetric?.value ?? null;
    }

    if (metric === 'errorRate') {
      return this.calculateErrorRate();
    }

    return snapshot.webVitals[metric as keyof WebVitalsMetrics] ?? null;
  }

  private calculateErrorRate(): number {
    const windowStart = Date.now() - 60000; // Last minute
    const recentErrors = this.errorBuffer.filter(
      (e) => e.timestamp >= windowStart
    );
    return recentErrors.length;
  }

  private compareValues(
    actual: number,
    operator: ComparisonOperator,
    threshold: number
  ): boolean {
    switch (operator) {
      case 'gt':
        return actual > threshold;
      case 'gte':
        return actual >= threshold;
      case 'lt':
        return actual < threshold;
      case 'lte':
        return actual <= threshold;
      case 'eq':
        return actual === threshold;
      case 'neq':
        return actual !== threshold;
      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule, snapshot: MetricsSnapshot): void {
    if (this.isInCooldown(rule.id)) return;
    if (this.activeAlerts.has(rule.id)) return;

    const condition = rule.condition as ThresholdCondition | AnomalyCondition;
    const value = this.getMetricValue(
      condition.metric,
      snapshot,
      condition.customMetricName
    );

    const alert = this.createAlert(rule, value ?? 0);
    this.alerts.push(alert);
    this.activeAlerts.set(rule.id, alert);
    this.lastAlertTime.set(rule.id, Date.now());

    // Trim old alerts
    if (this.alerts.length > this.config.maxAlerts) {
      this.alerts = this.alerts.slice(-this.config.maxAlerts);
    }

    this.config.onAlert(alert);
    this.sendNotifications(alert, rule.channels);
  }

  private triggerErrorAlert(rule: AlertRule): void {
    if (this.isInCooldown(rule.id)) return;
    if (this.activeAlerts.has(rule.id)) return;

    const condition = rule.condition as ErrorRateCondition | ErrorPatternCondition;
    const value = condition.type === 'errorRate'
      ? this.calculateErrorRate()
      : this.countPatternMatches(condition);

    const alert = this.createAlert(rule, value);
    this.alerts.push(alert);
    this.activeAlerts.set(rule.id, alert);
    this.lastAlertTime.set(rule.id, Date.now());

    this.config.onAlert(alert);
    this.sendNotifications(alert, rule.channels);
  }

  private countPatternMatches(condition: ErrorPatternCondition): number {
    const windowStart = Date.now() - condition.window;
    const pattern = new RegExp(condition.pattern, 'i');

    return this.errorBuffer.filter(
      (e) => e.timestamp >= windowStart && pattern.test(e.error.message)
    ).length;
  }

  private createAlert(rule: AlertRule, value: number): Alert {
    const condition = rule.condition;
    const threshold = 'value' in condition ? condition.value : undefined;

    return {
      id: this.generateAlertId(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: 'active',
      message: this.formatAlertMessage(rule, value),
      triggeredAt: Date.now(),
      value,
      threshold,
      tags: rule.tags,
    };
  }

  private formatAlertMessage(rule: AlertRule, value: number): string {
    const condition = rule.condition;

    if (condition.type === 'threshold') {
      return `${condition.metric} is ${value.toFixed(2)} (threshold: ${condition.operator} ${condition.value})`;
    }

    if (condition.type === 'anomaly') {
      return `Anomaly detected in ${condition.metric}: ${value.toFixed(2)}`;
    }

    if (condition.type === 'errorRate') {
      return `Error rate exceeded: ${value.toFixed(2)} errors/minute (threshold: ${condition.threshold})`;
    }

    if (condition.type === 'errorPattern') {
      return `Error pattern "${condition.pattern}" detected ${value} times`;
    }

    return `Alert triggered: ${rule.name}`;
  }

  private isInCooldown(ruleId: string): boolean {
    const lastTime = this.lastAlertTime.get(ruleId);
    if (!lastTime) return false;

    const rule = this.config.rules.find((r) => r.id === ruleId);
    if (!rule) return false;

    return Date.now() - lastTime < rule.cooldown;
  }

  private checkResolveAlert(ruleId: string): void {
    const alert = this.activeAlerts.get(ruleId);
    if (alert) {
      this.resolveAlert(alert.id);
    }
  }

  private checkForResolvedAlerts(): void {
    // Auto-resolve alerts that have been active for too long without re-triggering
    const now = Date.now();
    for (const [ruleId, alert] of this.activeAlerts) {
      const timeSinceLastTrigger = now - (this.lastAlertTime.get(ruleId) || 0);
      const rule = this.config.rules.find((r) => r.id === ruleId);

      if (rule && timeSinceLastTrigger > rule.cooldown * 2) {
        this.resolveAlert(alert.id);
      }
    }
  }

  private async sendNotifications(alert: Alert, channelIds: string[]): Promise<void> {
    const channels = this.config.channels.filter(
      (c) => c.enabled && channelIds.includes(c.id)
    );

    for (const channel of channels) {
      try {
        await this.sendToChannel(channel, alert);
      } catch (error) {
        console.error(`Failed to send notification to ${channel.name}:`, error);
      }
    }
  }

  private async sendToChannel(
    channel: NotificationChannel,
    alert: Alert
  ): Promise<void> {
    const config = channel.config;

    switch (config.type) {
      case 'webhook':
        await this.sendWebhook(config, alert);
        break;
      case 'slack':
        await this.sendSlack(config, alert);
        break;
      case 'pagerduty':
        await this.sendPagerDuty(config, alert);
        break;
      case 'console':
        this.sendConsole(alert);
        break;
      case 'custom':
        await config.handler(alert);
        break;
      case 'email':
        // Email requires server-side implementation
        console.warn('Email notifications require server-side implementation');
        break;
    }
  }

  private async sendWebhook(config: WebhookConfig, alert: Alert): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }

    await fetch(config.url, {
      method: config.method || 'POST',
      headers,
      body: JSON.stringify({
        alert,
        timestamp: Date.now(),
      }),
    });
  }

  private async sendSlack(config: SlackConfig, alert: Alert): Promise<void> {
    const color = alert.severity === 'critical'
      ? '#ef4444'
      : alert.severity === 'warning'
        ? '#f59e0b'
        : '#3b82f6';

    const payload = {
      channel: config.channel,
      username: config.username || 'PhilJS Dashboard',
      icon_emoji: config.iconEmoji || ':warning:',
      attachments: [
        {
          color,
          title: alert.ruleName,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Value',
              value: alert.value.toFixed(2),
              short: true,
            },
          ],
          ts: Math.floor(alert.triggeredAt / 1000),
        },
      ],
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private async sendPagerDuty(config: PagerDutyConfig, alert: Alert): Promise<void> {
    const severity = config.severity || (
      alert.severity === 'critical' ? 'critical' :
      alert.severity === 'warning' ? 'warning' : 'info'
    );

    const payload = {
      routing_key: config.routingKey,
      event_action: 'trigger',
      dedup_key: alert.ruleId,
      payload: {
        summary: alert.message,
        severity,
        source: 'philjs-dashboard',
        timestamp: new Date(alert.triggeredAt).toISOString(),
        custom_details: {
          rule_name: alert.ruleName,
          value: alert.value,
          threshold: alert.threshold,
          tags: alert.tags,
        },
      },
    };

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private sendConsole(alert: Alert): void {
    const prefix = alert.severity === 'critical' ? '[CRITICAL]' :
                   alert.severity === 'warning' ? '[WARNING]' : '[INFO]';
    console.log(`${prefix} ${alert.ruleName}: ${alert.message}`);
  }

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultAlertManager: AlertManager | null = null;

export function getAlertManager(config?: AlertManagerConfig): AlertManager {
  if (!defaultAlertManager) {
    defaultAlertManager = new AlertManager(config);
    defaultAlertManager.start();
  }
  return defaultAlertManager;
}

export function resetAlertManager(): void {
  if (defaultAlertManager) {
    defaultAlertManager.destroy();
    defaultAlertManager = null;
  }
}

// ============================================================================
// Preset Rules
// ============================================================================

export const PRESET_RULES: AlertRule[] = [
  {
    id: 'lcp-poor',
    name: 'Poor LCP',
    description: 'Largest Contentful Paint exceeds 4 seconds',
    enabled: true,
    condition: {
      type: 'threshold',
      metric: 'lcp',
      operator: 'gt',
      value: 4000,
    },
    severity: 'warning',
    cooldown: 300000, // 5 minutes
    channels: [],
  },
  {
    id: 'lcp-critical',
    name: 'Critical LCP',
    description: 'Largest Contentful Paint exceeds 10 seconds',
    enabled: true,
    condition: {
      type: 'threshold',
      metric: 'lcp',
      operator: 'gt',
      value: 10000,
    },
    severity: 'critical',
    cooldown: 60000, // 1 minute
    channels: [],
  },
  {
    id: 'cls-poor',
    name: 'Poor CLS',
    description: 'Cumulative Layout Shift exceeds 0.25',
    enabled: true,
    condition: {
      type: 'threshold',
      metric: 'cls',
      operator: 'gt',
      value: 0.25,
    },
    severity: 'warning',
    cooldown: 300000,
    channels: [],
  },
  {
    id: 'fid-poor',
    name: 'Poor FID',
    description: 'First Input Delay exceeds 300ms',
    enabled: true,
    condition: {
      type: 'threshold',
      metric: 'fid',
      operator: 'gt',
      value: 300,
    },
    severity: 'warning',
    cooldown: 300000,
    channels: [],
  },
  {
    id: 'error-spike',
    name: 'Error Spike',
    description: 'More than 10 errors per minute',
    enabled: true,
    condition: {
      type: 'errorRate',
      threshold: 10,
      window: 60000,
    },
    severity: 'warning',
    cooldown: 300000,
    channels: [],
  },
];
