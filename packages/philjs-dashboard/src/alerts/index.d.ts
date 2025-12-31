/**
 * Alerting System
 * Threshold alerts, anomaly detection, and notification channels
 */
import type { MetricsSnapshot, WebVitalsMetrics } from '../collector/metrics.js';
import type { CapturedError } from '../collector/errors.js';
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
export type AlertCondition = ThresholdCondition | AnomalyCondition | ErrorRateCondition | ErrorPatternCondition;
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
export type NotificationConfig = WebhookConfig | EmailConfig | SlackConfig | PagerDutyConfig | ConsoleConfig | CustomConfig;
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
export declare class AnomalyDetector {
    private dataPoints;
    private maxDataPoints;
    constructor(maxDataPoints?: number);
    addDataPoint(metric: string, value: number): void;
    isAnomaly(metric: string, value: number, sensitivity: number): boolean;
    getBaseline(metric: string): {
        mean: number;
        stdDev: number;
    } | null;
    private calculateStats;
    clear(metric?: string): void;
}
export declare class AlertManager {
    private config;
    private alerts;
    private activeAlerts;
    private lastAlertTime;
    private anomalyDetector;
    private errorBuffer;
    private evaluationTimer;
    private isDestroyed;
    constructor(config?: AlertManagerConfig);
    /**
     * Start the alert manager
     */
    start(): void;
    /**
     * Stop the alert manager
     */
    stop(): void;
    /**
     * Destroy the alert manager
     */
    destroy(): void;
    addRule(rule: AlertRule): void;
    removeRule(ruleId: string): void;
    updateRule(ruleId: string, updates: Partial<AlertRule>): void;
    getRules(): AlertRule[];
    addChannel(channel: NotificationChannel): void;
    removeChannel(channelId: string): void;
    getChannels(): NotificationChannel[];
    processMetrics(snapshot: MetricsSnapshot): void;
    processError(error: CapturedError): void;
    getAlerts(status?: AlertStatus): Alert[];
    getActiveAlerts(): Alert[];
    acknowledgeAlert(alertId: string, acknowledgedBy?: string): void;
    resolveAlert(alertId: string): void;
    clearAlerts(): void;
    private evaluateRule;
    private evaluateThreshold;
    private evaluateAnomaly;
    private evaluateErrorRule;
    private evaluateErrorRate;
    private evaluateErrorPattern;
    private getMetricValue;
    private calculateErrorRate;
    private compareValues;
    private triggerAlert;
    private triggerErrorAlert;
    private countPatternMatches;
    private createAlert;
    private formatAlertMessage;
    private isInCooldown;
    private checkResolveAlert;
    private checkForResolvedAlerts;
    private sendNotifications;
    private sendToChannel;
    private sendWebhook;
    private sendSlack;
    private sendPagerDuty;
    private sendConsole;
    private generateAlertId;
}
export declare function getAlertManager(config?: AlertManagerConfig): AlertManager;
export declare function resetAlertManager(): void;
export declare const PRESET_RULES: AlertRule[];
//# sourceMappingURL=index.d.ts.map