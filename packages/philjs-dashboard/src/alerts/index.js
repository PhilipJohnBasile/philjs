/**
 * Alerting System
 * Threshold alerts, anomaly detection, and notification channels
 */
// ============================================================================
// Anomaly Detection
// ============================================================================
export class AnomalyDetector {
    dataPoints = new Map();
    maxDataPoints;
    constructor(maxDataPoints = 1000) {
        this.maxDataPoints = maxDataPoints;
    }
    addDataPoint(metric, value) {
        const points = this.dataPoints.get(metric) || [];
        points.push(value);
        if (points.length > this.maxDataPoints) {
            points.shift();
        }
        this.dataPoints.set(metric, points);
    }
    isAnomaly(metric, value, sensitivity) {
        const points = this.dataPoints.get(metric);
        if (!points || points.length < 10) {
            return false; // Not enough data
        }
        const stats = this.calculateStats(points);
        const deviation = Math.abs(value - stats.mean) / stats.stdDev;
        return deviation > sensitivity;
    }
    getBaseline(metric) {
        const points = this.dataPoints.get(metric);
        if (!points || points.length < 2) {
            return null;
        }
        return this.calculateStats(points);
    }
    calculateStats(values) {
        const n = values.length;
        const mean = values.reduce((sum, v) => sum + v, 0) / n;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        return { mean, stdDev: stdDev || 1 }; // Avoid division by zero
    }
    clear(metric) {
        if (metric) {
            this.dataPoints.delete(metric);
        }
        else {
            this.dataPoints.clear();
        }
    }
}
// ============================================================================
// Alert Manager
// ============================================================================
export class AlertManager {
    config;
    alerts = [];
    activeAlerts = new Map();
    lastAlertTime = new Map();
    anomalyDetector;
    errorBuffer = [];
    evaluationTimer = null;
    isDestroyed = false;
    constructor(config = {}) {
        this.config = {
            rules: config.rules ?? [],
            channels: config.channels ?? [],
            evaluationInterval: config.evaluationInterval ?? 60000,
            maxAlerts: config.maxAlerts ?? 1000,
            onAlert: config.onAlert ?? (() => { }),
            onResolve: config.onResolve ?? (() => { }),
        };
        this.anomalyDetector = new AnomalyDetector();
    }
    /**
     * Start the alert manager
     */
    start() {
        if (this.evaluationTimer)
            return;
        this.evaluationTimer = setInterval(() => {
            this.checkForResolvedAlerts();
        }, this.config.evaluationInterval);
    }
    /**
     * Stop the alert manager
     */
    stop() {
        if (this.evaluationTimer) {
            clearInterval(this.evaluationTimer);
            this.evaluationTimer = null;
        }
    }
    /**
     * Destroy the alert manager
     */
    destroy() {
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
    addRule(rule) {
        const existingIndex = this.config.rules.findIndex((r) => r.id === rule.id);
        if (existingIndex >= 0) {
            this.config.rules[existingIndex] = rule;
        }
        else {
            this.config.rules.push(rule);
        }
    }
    removeRule(ruleId) {
        this.config.rules = this.config.rules.filter((r) => r.id !== ruleId);
    }
    updateRule(ruleId, updates) {
        const rule = this.config.rules.find((r) => r.id === ruleId);
        if (rule) {
            Object.assign(rule, updates);
        }
    }
    getRules() {
        return [...this.config.rules];
    }
    // ============================================================================
    // Channel Management
    // ============================================================================
    addChannel(channel) {
        const existingIndex = this.config.channels.findIndex((c) => c.id === channel.id);
        if (existingIndex >= 0) {
            this.config.channels[existingIndex] = channel;
        }
        else {
            this.config.channels.push(channel);
        }
    }
    removeChannel(channelId) {
        this.config.channels = this.config.channels.filter((c) => c.id !== channelId);
    }
    getChannels() {
        return [...this.config.channels];
    }
    // ============================================================================
    // Metrics Processing
    // ============================================================================
    processMetrics(snapshot) {
        if (this.isDestroyed)
            return;
        const webVitals = snapshot.webVitals;
        // Add data points for anomaly detection
        for (const [metric, value] of Object.entries(webVitals)) {
            if (value !== null) {
                this.anomalyDetector.addDataPoint(metric, value);
            }
        }
        // Evaluate rules
        for (const rule of this.config.rules) {
            if (!rule.enabled)
                continue;
            const triggered = this.evaluateRule(rule, snapshot);
            if (triggered) {
                this.triggerAlert(rule, snapshot);
            }
            else {
                this.checkResolveAlert(rule.id);
            }
        }
    }
    processError(error) {
        if (this.isDestroyed)
            return;
        this.errorBuffer.push(error);
        // Keep buffer size reasonable
        if (this.errorBuffer.length > 1000) {
            this.errorBuffer.shift();
        }
        // Evaluate error-based rules
        for (const rule of this.config.rules) {
            if (!rule.enabled)
                continue;
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
    getAlerts(status) {
        if (status) {
            return this.alerts.filter((a) => a.status === status);
        }
        return [...this.alerts];
    }
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    acknowledgeAlert(alertId, acknowledgedBy) {
        const alert = this.alerts.find((a) => a.id === alertId);
        if (alert && alert.status === 'active') {
            alert.status = 'acknowledged';
            alert.acknowledgedAt = Date.now();
            if (acknowledgedBy !== undefined) {
                alert.acknowledgedBy = acknowledgedBy;
            }
        }
    }
    resolveAlert(alertId) {
        const alert = this.alerts.find((a) => a.id === alertId);
        if (alert && alert.status !== 'resolved') {
            alert.status = 'resolved';
            alert.resolvedAt = Date.now();
            this.activeAlerts.delete(alert.ruleId);
            this.config.onResolve(alert);
        }
    }
    clearAlerts() {
        this.alerts = [];
        this.activeAlerts.clear();
        this.lastAlertTime.clear();
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    evaluateRule(rule, snapshot) {
        const condition = rule.condition;
        if (condition.type === 'threshold') {
            return this.evaluateThreshold(condition, snapshot);
        }
        if (condition.type === 'anomaly') {
            return this.evaluateAnomaly(condition, snapshot);
        }
        return false;
    }
    evaluateThreshold(condition, snapshot) {
        const value = this.getMetricValue(condition.metric, snapshot, condition.customMetricName);
        if (value === null)
            return false;
        return this.compareValues(value, condition.operator, condition.value);
    }
    evaluateAnomaly(condition, snapshot) {
        const value = this.getMetricValue(condition.metric, snapshot, condition.customMetricName);
        if (value === null)
            return false;
        const metricKey = condition.customMetricName || condition.metric;
        return this.anomalyDetector.isAnomaly(metricKey, value, condition.sensitivity);
    }
    evaluateErrorRule(rule) {
        const condition = rule.condition;
        if (condition.type === 'errorRate') {
            return this.evaluateErrorRate(condition);
        }
        if (condition.type === 'errorPattern') {
            return this.evaluateErrorPattern(condition);
        }
        return false;
    }
    evaluateErrorRate(condition) {
        const windowStart = Date.now() - condition.window;
        const recentErrors = this.errorBuffer.filter((e) => e.timestamp >= windowStart);
        const errorsPerMinute = (recentErrors.length / condition.window) * 60000;
        return errorsPerMinute >= condition.threshold;
    }
    evaluateErrorPattern(condition) {
        const windowStart = Date.now() - condition.window;
        const pattern = new RegExp(condition.pattern, 'i');
        const matchingErrors = this.errorBuffer.filter((e) => e.timestamp >= windowStart && pattern.test(e.error.message));
        return matchingErrors.length >= condition.minOccurrences;
    }
    getMetricValue(metric, snapshot, customMetricName) {
        if (metric === 'custom' && customMetricName) {
            const customMetric = snapshot.customMetrics.find((m) => m.name === customMetricName);
            return customMetric?.value ?? null;
        }
        if (metric === 'errorRate') {
            return this.calculateErrorRate();
        }
        return snapshot.webVitals[metric] ?? null;
    }
    calculateErrorRate() {
        const windowStart = Date.now() - 60000; // Last minute
        const recentErrors = this.errorBuffer.filter((e) => e.timestamp >= windowStart);
        return recentErrors.length;
    }
    compareValues(actual, operator, threshold) {
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
    triggerAlert(rule, snapshot) {
        if (this.isInCooldown(rule.id))
            return;
        if (this.activeAlerts.has(rule.id))
            return;
        const condition = rule.condition;
        const value = this.getMetricValue(condition.metric, snapshot, condition.customMetricName);
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
    triggerErrorAlert(rule) {
        if (this.isInCooldown(rule.id))
            return;
        if (this.activeAlerts.has(rule.id))
            return;
        const condition = rule.condition;
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
    countPatternMatches(condition) {
        const windowStart = Date.now() - condition.window;
        const pattern = new RegExp(condition.pattern, 'i');
        return this.errorBuffer.filter((e) => e.timestamp >= windowStart && pattern.test(e.error.message)).length;
    }
    createAlert(rule, value) {
        const condition = rule.condition;
        const threshold = 'value' in condition ? condition.value : undefined;
        const alert = {
            id: this.generateAlertId(),
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'active',
            message: this.formatAlertMessage(rule, value),
            triggeredAt: Date.now(),
            value,
        };
        if (threshold !== undefined) {
            alert.threshold = threshold;
        }
        if (rule.tags !== undefined) {
            alert.tags = rule.tags;
        }
        return alert;
    }
    formatAlertMessage(rule, value) {
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
    isInCooldown(ruleId) {
        const lastTime = this.lastAlertTime.get(ruleId);
        if (!lastTime)
            return false;
        const rule = this.config.rules.find((r) => r.id === ruleId);
        if (!rule)
            return false;
        return Date.now() - lastTime < rule.cooldown;
    }
    checkResolveAlert(ruleId) {
        const alert = this.activeAlerts.get(ruleId);
        if (alert) {
            this.resolveAlert(alert.id);
        }
    }
    checkForResolvedAlerts() {
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
    async sendNotifications(alert, channelIds) {
        const channels = this.config.channels.filter((c) => c.enabled && channelIds.includes(c.id));
        for (const channel of channels) {
            try {
                await this.sendToChannel(channel, alert);
            }
            catch (error) {
                console.error(`Failed to send notification to ${channel.name}:`, error);
            }
        }
    }
    async sendToChannel(channel, alert) {
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
    async sendWebhook(config, alert) {
        const headers = {
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
    async sendSlack(config, alert) {
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
    async sendPagerDuty(config, alert) {
        const severity = config.severity || (alert.severity === 'critical' ? 'critical' :
            alert.severity === 'warning' ? 'warning' : 'info');
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
    sendConsole(alert) {
        const prefix = alert.severity === 'critical' ? '[CRITICAL]' :
            alert.severity === 'warning' ? '[WARNING]' : '[INFO]';
        console.log(`${prefix} ${alert.ruleName}: ${alert.message}`);
    }
    generateAlertId() {
        return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
let defaultAlertManager = null;
export function getAlertManager(config) {
    if (!defaultAlertManager) {
        defaultAlertManager = new AlertManager(config);
        defaultAlertManager.start();
    }
    return defaultAlertManager;
}
export function resetAlertManager() {
    if (defaultAlertManager) {
        defaultAlertManager.destroy();
        defaultAlertManager = null;
    }
}
// ============================================================================
// Preset Rules
// ============================================================================
export const PRESET_RULES = [
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
//# sourceMappingURL=index.js.map