/**
 * Alerting Engine for PhilJS Observability
 *
 * Real-time alerting based on metrics and events:
 * - Alert rule definitions
 * - Threshold evaluation
 * - Notification channels
 * - Alert history & acknowledgment
 */
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
    for?: number;
    cooldown?: number;
    notificationChannels?: string[];
}
export interface AlertCondition {
    operator: ComparisonOperator;
    threshold: number;
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'last';
    window?: number;
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
export declare class AlertManager {
    private rules;
    private alerts;
    private channels;
    private pendingAlerts;
    private cooldowns;
    private evaluationInterval;
    private metrics;
    private listeners;
    private config;
    constructor(config?: AlertManagerConfig);
    addRule(rule: AlertRule): void;
    removeRule(ruleId: string): void;
    updateRule(ruleId: string, updates: Partial<AlertRule>): void;
    getRule(ruleId: string): AlertRule | undefined;
    getRules(): AlertRule[];
    enableRule(ruleId: string): void;
    disableRule(ruleId: string): void;
    addChannel(channel: NotificationChannel): void;
    removeChannel(channelId: string): void;
    getChannel(channelId: string): NotificationChannel | undefined;
    getChannels(): NotificationChannel[];
    recordMetric(name: string, value: number): void;
    start(): void;
    stop(): void;
    private evaluate;
    private getValuesInWindow;
    private aggregate;
    private evaluateCondition;
    private handleTriggered;
    private handleResolved;
    private getActiveAlertForRule;
    private createAlert;
    private formatMessage;
    private notify;
    private sendNotification;
    private sendConsoleNotification;
    private sendWebhookNotification;
    private sendSlackNotification;
    private sendEmailNotification;
    private escapeHtml;
    private sendPagerDutyNotification;
    private cleanup;
    getAlert(alertId: string): Alert | undefined;
    getAlerts(filter?: {
        state?: AlertState;
        severity?: AlertSeverity;
        ruleId?: string;
        since?: number;
    }): Alert[];
    getActiveAlerts(): Alert[];
    acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean;
    resolveAlert(alertId: string): boolean;
    onAlert(listener: (alert: Alert) => void): () => void;
    getStats(): {
        totalRules: number;
        enabledRules: number;
        activeAlerts: number;
        totalAlerts: number;
        alertsBySeverity: Record<AlertSeverity, number>;
        alertsByState: Record<AlertState, number>;
    };
}
export declare function initAlertManager(config?: AlertManagerConfig): AlertManager;
export declare function getAlertManager(): AlertManager;
export declare const presetRules: {
    highCpuUsage: {
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        metric: string;
        condition: {
            operator: "gt";
            threshold: number;
            aggregation: "avg";
            window: number;
        };
        severity: "warning";
        for: number;
    };
    highMemoryUsage: {
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        metric: string;
        condition: {
            operator: "gt";
            threshold: number;
            aggregation: "avg";
            window: number;
        };
        severity: "critical";
        for: number;
    };
    highErrorRate: {
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        metric: string;
        condition: {
            operator: "gt";
            threshold: number;
            aggregation: "avg";
            window: number;
        };
        severity: "critical";
        for: number;
    };
    slowResponseTime: {
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        metric: string;
        condition: {
            operator: "gt";
            threshold: number;
            aggregation: "avg";
            window: number;
        };
        severity: "warning";
        for: number;
    };
    lowDiskSpace: {
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        metric: string;
        condition: {
            operator: "gt";
            threshold: number;
            aggregation: "last";
        };
        severity: "warning";
    };
};
export declare function useAlerts(filter?: {
    state?: AlertState;
    severity?: AlertSeverity;
}): {
    alerts: Alert[];
    stats: ReturnType<AlertManager['getStats']>;
    acknowledge: (alertId: string) => void;
    resolve: (alertId: string) => void;
};
//# sourceMappingURL=alerting.d.ts.map