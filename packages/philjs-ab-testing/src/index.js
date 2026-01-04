/**
 * @philjs/ab-testing - Native A/B Testing Framework
 *
 * Built-in experimentation and feature flags.
 * NO OTHER FRAMEWORK provides native A/B testing.
 *
 * Features:
 * - Experiment configuration
 * - Variant assignment
 * - Statistical analysis
 * - Feature flags
 * - Rollout percentages
 * - User segmentation
 * - Event tracking
 * - Results dashboard data
 * - Multi-armed bandit
 */
// ============================================================================
// Assignment Engine
// ============================================================================
export class AssignmentEngine {
    assignments = new Map();
    storageKey;
    constructor(storageKey = 'philjs_ab_assignments') {
        this.storageKey = storageKey;
        this.loadAssignments();
    }
    loadAssignments() {
        if (typeof localStorage === 'undefined')
            return;
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                data.forEach(a => this.assignments.set(a.experimentId, a));
            }
        }
        catch {
            // Ignore storage errors
        }
    }
    saveAssignments() {
        if (typeof localStorage === 'undefined')
            return;
        try {
            const data = Array.from(this.assignments.values());
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        }
        catch {
            // Ignore storage errors
        }
    }
    assign(experiment, userId, context) {
        // Check if already assigned
        const existing = this.assignments.get(experiment.id);
        if (existing && existing.userId === userId) {
            return experiment.variants.find(v => v.id === existing.variantId) ?? null;
        }
        // Check experiment status
        if (experiment.status !== 'running') {
            return null;
        }
        // Check date range
        const now = new Date();
        if (experiment.startDate && now < experiment.startDate)
            return null;
        if (experiment.endDate && now > experiment.endDate)
            return null;
        // Check audience targeting
        if (experiment.targetAudience && context) {
            if (!this.matchesAudience(context, experiment.targetAudience)) {
                return null;
            }
        }
        // Check if user is in experiment allocation
        if (!this.isInAllocation(userId, experiment.id, experiment.allocation)) {
            return null;
        }
        // Assign variant based on weights
        const variant = this.selectVariant(userId, experiment);
        if (!variant)
            return null;
        // Store assignment
        const assignment = {
            experimentId: experiment.id,
            variantId: variant.id,
            timestamp: Date.now(),
            userId
        };
        this.assignments.set(experiment.id, assignment);
        this.saveAssignments();
        return variant;
    }
    isInAllocation(userId, experimentId, allocation) {
        const hash = this.hash(`${userId}:${experimentId}:allocation`);
        return hash < allocation;
    }
    selectVariant(userId, experiment) {
        const hash = this.hash(`${userId}:${experiment.id}:variant`);
        let cumulative = 0;
        for (const variant of experiment.variants) {
            cumulative += variant.weight;
            if (hash < cumulative) {
                return variant;
            }
        }
        return experiment.variants[experiment.variants.length - 1] ?? null;
    }
    matchesAudience(context, rules) {
        return rules.every(rule => {
            const value = context.attributes?.[rule.attribute] ?? context.traits?.[rule.attribute];
            switch (rule.operator) {
                case 'equals': return value === rule.value;
                case 'not_equals': return value !== rule.value;
                case 'contains': return String(value).includes(rule.value);
                case 'not_contains': return !String(value).includes(rule.value);
                case 'gt': return Number(value) > Number(rule.value);
                case 'lt': return Number(value) < Number(rule.value);
                case 'gte': return Number(value) >= Number(rule.value);
                case 'lte': return Number(value) <= Number(rule.value);
                case 'in': return Array.isArray(rule.value) && rule.value.includes(value);
                case 'not_in': return Array.isArray(rule.value) && !rule.value.includes(value);
                default: return false;
            }
        });
    }
    hash(input) {
        // Simple hash to number between 0-100
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash % 100);
    }
    getAssignment(experimentId) {
        return this.assignments.get(experimentId);
    }
    clearAssignment(experimentId) {
        this.assignments.delete(experimentId);
        this.saveAssignments();
    }
    clearAll() {
        this.assignments.clear();
        this.saveAssignments();
    }
}
// ============================================================================
// Feature Flag Manager
// ============================================================================
export class FeatureFlagManager {
    flags = new Map();
    userId;
    context;
    overrides = new Map();
    constructor(userId, context) {
        this.userId = userId;
        if (context !== undefined)
            this.context = context;
        this.loadOverrides();
    }
    loadOverrides() {
        if (typeof localStorage === 'undefined')
            return;
        try {
            const stored = localStorage.getItem('philjs_flag_overrides');
            if (stored) {
                const data = JSON.parse(stored);
                Object.entries(data).forEach(([key, value]) => {
                    this.overrides.set(key, value);
                });
            }
        }
        catch {
            // Ignore errors
        }
    }
    registerFlags(flags) {
        flags.forEach(flag => this.flags.set(flag.id, flag));
    }
    isEnabled(flagId) {
        // Check overrides first
        const override = this.overrides.get(flagId);
        if (override !== undefined)
            return override;
        const flag = this.flags.get(flagId);
        if (!flag)
            return false;
        if (!flag.enabled)
            return false;
        // Check audience targeting
        if (flag.targetAudience && this.context) {
            if (!this.matchesAudience(flag.targetAudience)) {
                return false;
            }
        }
        // Check rollout percentage
        if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
            const hash = this.hash(`${this.userId}:${flagId}`);
            return hash < flag.rolloutPercentage;
        }
        return true;
    }
    getVariant(flagId) {
        if (!this.isEnabled(flagId))
            return undefined;
        const flag = this.flags.get(flagId);
        return flag?.variants;
    }
    override(flagId, enabled) {
        this.overrides.set(flagId, enabled);
        this.saveOverrides();
    }
    clearOverride(flagId) {
        this.overrides.delete(flagId);
        this.saveOverrides();
    }
    clearAllOverrides() {
        this.overrides.clear();
        this.saveOverrides();
    }
    matchesAudience(rules) {
        if (!this.context)
            return true;
        return rules.every(rule => {
            const value = this.context.attributes?.[rule.attribute] ??
                this.context.traits?.[rule.attribute];
            switch (rule.operator) {
                case 'equals': return value === rule.value;
                case 'not_equals': return value !== rule.value;
                case 'contains': return String(value).includes(rule.value);
                case 'not_contains': return !String(value).includes(rule.value);
                case 'in': return Array.isArray(rule.value) && rule.value.includes(value);
                case 'not_in': return Array.isArray(rule.value) && !rule.value.includes(value);
                default: return false;
            }
        });
    }
    hash(input) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash % 100);
    }
    saveOverrides() {
        if (typeof localStorage === 'undefined')
            return;
        try {
            const data = Object.fromEntries(this.overrides);
            localStorage.setItem('philjs_flag_overrides', JSON.stringify(data));
        }
        catch {
            // Ignore errors
        }
    }
    getAllFlags() {
        return Array.from(this.flags.values());
    }
}
// ============================================================================
// Event Tracker
// ============================================================================
export class EventTracker {
    events = [];
    trackingEndpoint;
    flushInterval = null;
    batchSize = 50;
    constructor(trackingEndpoint) {
        if (trackingEndpoint !== undefined)
            this.trackingEndpoint = trackingEndpoint;
        if (trackingEndpoint) {
            this.startAutoFlush();
        }
    }
    track(event) {
        this.events.push({
            ...event,
            timestamp: Date.now()
        });
        if (this.events.length >= this.batchSize) {
            this.flush();
        }
    }
    trackConversion(experimentId, variantId, userId, value, metadata) {
        const event = {
            experimentId,
            variantId,
            eventName: 'conversion',
            userId
        };
        if (value !== undefined)
            event.value = value;
        if (metadata !== undefined)
            event.metadata = metadata;
        this.track(event);
    }
    trackEvent(experimentId, variantId, eventName, userId, value, metadata) {
        const event = {
            experimentId,
            variantId,
            eventName,
            userId
        };
        if (value !== undefined)
            event.value = value;
        if (metadata !== undefined)
            event.metadata = metadata;
        this.track(event);
    }
    async flush() {
        if (this.events.length === 0)
            return;
        const toSend = [...this.events];
        this.events = [];
        if (this.trackingEndpoint) {
            try {
                await fetch(this.trackingEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ events: toSend })
                });
            }
            catch (error) {
                // Put events back if sending failed
                this.events = [...toSend, ...this.events];
                console.error('Failed to send experiment events:', error);
            }
        }
    }
    startAutoFlush() {
        this.flushInterval = setInterval(() => {
            this.flush();
        }, 30000); // Flush every 30 seconds
    }
    stop() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        this.flush();
    }
    getEvents() {
        return [...this.events];
    }
}
// ============================================================================
// Statistical Analysis
// ============================================================================
export class StatisticalAnalyzer {
    // Two-proportion z-test for conversion rate comparison
    zTest(control, variant) {
        const p1 = control.conversions / control.total;
        const p2 = variant.conversions / variant.total;
        const n1 = control.total;
        const n2 = variant.total;
        // Pooled proportion
        const p = (control.conversions + variant.conversions) / (n1 + n2);
        // Standard error
        const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
        if (se === 0) {
            return { zScore: 0, pValue: 1, significant: false };
        }
        // Z-score
        const z = (p2 - p1) / se;
        // Two-tailed p-value
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
        return {
            zScore: z,
            pValue,
            significant: pValue < 0.05
        };
    }
    // Two-sample t-test for continuous metrics
    tTest(control, variant) {
        const mean1 = this.mean(control.values);
        const mean2 = this.mean(variant.values);
        const var1 = this.variance(control.values);
        const var2 = this.variance(variant.values);
        const n1 = control.values.length;
        const n2 = variant.values.length;
        // Welch's t-test
        const se = Math.sqrt(var1 / n1 + var2 / n2);
        if (se === 0) {
            return { tScore: 0, pValue: 1, significant: false };
        }
        const t = (mean2 - mean1) / se;
        // Approximate degrees of freedom (Welch-Satterthwaite)
        const df = Math.pow(var1 / n1 + var2 / n2, 2) /
            (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));
        // Approximate p-value using normal distribution for large samples
        const pValue = 2 * (1 - this.normalCDF(Math.abs(t)));
        return {
            tScore: t,
            pValue,
            significant: pValue < 0.05
        };
    }
    // Calculate lift (relative improvement)
    calculateLift(control, variant) {
        if (control === 0)
            return 0;
        return ((variant - control) / control) * 100;
    }
    // Calculate confidence interval
    confidenceInterval(proportion, sampleSize, confidenceLevel = 0.95) {
        const z = this.zScoreForConfidence(confidenceLevel);
        const se = Math.sqrt((proportion * (1 - proportion)) / sampleSize);
        return {
            lower: Math.max(0, proportion - z * se),
            upper: Math.min(1, proportion + z * se)
        };
    }
    // Sample size calculator
    calculateSampleSize(baseline, // baseline conversion rate
    mde, // minimum detectable effect (relative)
    power = 0.8, // statistical power
    significance = 0.05 // significance level
    ) {
        const p1 = baseline;
        const p2 = baseline * (1 + mde);
        const zAlpha = this.zScoreForConfidence(1 - significance);
        const zBeta = this.zScoreForConfidence(power);
        const pooledP = (p1 + p2) / 2;
        const effect = Math.abs(p2 - p1);
        const n = 2 * Math.pow(zAlpha + zBeta, 2) * pooledP * (1 - pooledP) / Math.pow(effect, 2);
        return Math.ceil(n);
    }
    mean(values) {
        if (values.length === 0)
            return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
    variance(values) {
        if (values.length < 2)
            return 0;
        const m = this.mean(values);
        return values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (values.length - 1);
    }
    normalCDF(x) {
        // Approximation of normal CDF
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1.0 + sign * y);
    }
    zScoreForConfidence(confidence) {
        // Common z-scores
        if (confidence >= 0.99)
            return 2.576;
        if (confidence >= 0.95)
            return 1.96;
        if (confidence >= 0.90)
            return 1.645;
        if (confidence >= 0.80)
            return 1.28;
        return 1.96;
    }
}
// ============================================================================
// A/B Testing Manager
// ============================================================================
export class ABTestingManager {
    config;
    experiments = new Map();
    assignmentEngine;
    featureFlagManager;
    eventTracker;
    statisticalAnalyzer;
    userId;
    context;
    constructor(userId, config = {}, context) {
        this.userId = userId;
        if (context !== undefined)
            this.context = context;
        this.config = {
            storageKey: config.storageKey ?? 'philjs_ab',
            trackingEndpoint: config.trackingEndpoint ?? '',
            autoTrack: config.autoTrack ?? true,
            debug: config.debug ?? false
        };
        this.assignmentEngine = new AssignmentEngine(this.config.storageKey);
        this.featureFlagManager = new FeatureFlagManager(userId, context);
        this.eventTracker = new EventTracker(this.config.trackingEndpoint);
        this.statisticalAnalyzer = new StatisticalAnalyzer();
    }
    registerExperiments(experiments) {
        experiments.forEach(exp => this.experiments.set(exp.id, exp));
    }
    registerFlags(flags) {
        this.featureFlagManager.registerFlags(flags);
    }
    getVariant(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            this.log(`Experiment ${experimentId} not found`);
            return null;
        }
        const variant = this.assignmentEngine.assign(experiment, this.userId, this.context);
        if (variant && this.config.autoTrack) {
            this.eventTracker.track({
                experimentId,
                variantId: variant.id,
                eventName: 'exposure',
                userId: this.userId
            });
        }
        return variant;
    }
    isInVariant(experimentId, variantId) {
        const variant = this.getVariant(experimentId);
        return variant?.id === variantId;
    }
    isFeatureEnabled(flagId) {
        return this.featureFlagManager.isEnabled(flagId);
    }
    getFeatureVariant(flagId) {
        return this.featureFlagManager.getVariant(flagId);
    }
    trackConversion(experimentId, value, metadata) {
        const assignment = this.assignmentEngine.getAssignment(experimentId);
        if (!assignment) {
            this.log(`No assignment for experiment ${experimentId}`);
            return;
        }
        this.eventTracker.trackConversion(experimentId, assignment.variantId, this.userId, value, metadata);
    }
    trackEvent(experimentId, eventName, value, metadata) {
        const assignment = this.assignmentEngine.getAssignment(experimentId);
        if (!assignment)
            return;
        this.eventTracker.trackEvent(experimentId, assignment.variantId, eventName, this.userId, value, metadata);
    }
    analyzeExperiment(experimentId, controlData, variantData) {
        const controlRate = controlData.conversions / controlData.total;
        const variantRate = variantData.conversions / variantData.total;
        const lift = this.statisticalAnalyzer.calculateLift(controlRate, variantRate);
        const { pValue, significant } = this.statisticalAnalyzer.zTest(controlData, variantData);
        return { lift, pValue, significant };
    }
    calculateRequiredSampleSize(baseline, mde, power, significance) {
        return this.statisticalAnalyzer.calculateSampleSize(baseline, mde, power, significance);
    }
    setUserContext(context) {
        this.context = context;
    }
    flush() {
        return this.eventTracker.flush();
    }
    log(message) {
        if (this.config.debug) {
            console.log(`[@philjs/ab-testing] ${message}`);
        }
    }
}
// ============================================================================
// React-style Hooks
// ============================================================================
// State helper
function createState(initial) {
    let value = initial;
    return [() => value, (newValue) => { value = newValue; }];
}
let globalABManager = null;
/**
 * Hook for A/B testing
 */
export function useABTesting(userId, config, context) {
    if (!globalABManager) {
        globalABManager = new ABTestingManager(userId, config, context);
    }
    return {
        getVariant: (id) => globalABManager.getVariant(id),
        isInVariant: (expId, varId) => globalABManager.isInVariant(expId, varId),
        trackConversion: (id, value, meta) => globalABManager.trackConversion(id, value, meta),
        trackEvent: (id, name, value, meta) => globalABManager.trackEvent(id, name, value, meta),
        registerExperiments: (exps) => globalABManager.registerExperiments(exps)
    };
}
/**
 * Hook for experiment variant
 */
export function useExperiment(experimentId) {
    if (!globalABManager) {
        throw new Error('A/B Testing not initialized');
    }
    const variant = globalABManager.getVariant(experimentId);
    return {
        variant,
        isControl: variant?.isControl ?? true,
        config: variant?.config ?? {},
        trackConversion: (value) => globalABManager.trackConversion(experimentId, value)
    };
}
/**
 * Hook for feature flags
 */
export function useFeatureFlag(flagId) {
    if (!globalABManager) {
        throw new Error('A/B Testing not initialized');
    }
    return {
        enabled: globalABManager.isFeatureEnabled(flagId),
        variant: globalABManager.getFeatureVariant(flagId)
    };
}
//# sourceMappingURL=index.js.map