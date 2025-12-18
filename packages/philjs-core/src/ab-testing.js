/**
 * Built-in A/B Testing - PhilJS 2026 Innovation
 * Run A/B tests directly in your app with zero external dependencies
 */
import { signal } from './signals';
class MemoryStorage {
    data = new Map();
    get(key) {
        return this.data.get(key) || null;
    }
    set(key, value) {
        this.data.set(key, value);
    }
    remove(key) {
        this.data.delete(key);
    }
}
class LocalStorageAdapter {
    get(key) {
        if (typeof localStorage === 'undefined' || !localStorage.getItem)
            return null;
        try {
            return localStorage.getItem(key);
        }
        catch (e) {
            return null;
        }
    }
    set(key, value) {
        if (typeof localStorage === 'undefined' || !localStorage.setItem)
            return;
        try {
            localStorage.setItem(key, value);
        }
        catch (e) {
            // Ignore
        }
    }
    remove(key) {
        if (typeof localStorage === 'undefined' || !localStorage.removeItem)
            return;
        try {
            localStorage.removeItem(key);
        }
        catch (e) {
            // Ignore
        }
    }
}
class SessionStorageAdapter {
    get(key) {
        if (typeof sessionStorage === 'undefined')
            return null;
        return sessionStorage.getItem(key);
    }
    set(key, value) {
        if (typeof sessionStorage === 'undefined')
            return;
        sessionStorage.setItem(key, value);
    }
    remove(key) {
        if (typeof sessionStorage === 'undefined')
            return;
        sessionStorage.removeItem(key);
    }
}
// ============================================================================
// A/B Testing Engine
// ============================================================================
export class ABTestEngine {
    experiments = new Map();
    assignments = new Map();
    events = [];
    storage;
    config;
    constructor(config = {}) {
        this.config = {
            enabled: true,
            storage: 'localStorage',
            onAssignment: () => { },
            onEvent: () => { },
            forceVariants: {},
            ...config,
        };
        // Initialize storage
        switch (this.config.storage) {
            case 'localStorage':
                this.storage = new LocalStorageAdapter();
                break;
            case 'sessionStorage':
                this.storage = new SessionStorageAdapter();
                break;
            default:
                this.storage = new MemoryStorage();
        }
        this.loadAssignments();
    }
    /**
     * Register an experiment
     */
    register(experiment) {
        this.experiments.set(experiment.id, experiment);
    }
    /**
     * Get variant for a user
     */
    getVariant(experimentId, user) {
        if (!this.config.enabled)
            return null;
        const experiment = this.experiments.get(experimentId);
        if (!experiment)
            return null;
        // Check if experiment is within schedule
        if (!this.isExperimentActive(experiment)) {
            return null;
        }
        // Check if user matches targeting
        if (!this.matchesTargeting(experiment, user)) {
            return null;
        }
        // Check for forced variant (QA override)
        const forcedVariantId = this.config.forceVariants[experimentId];
        if (forcedVariantId) {
            const variant = experiment.variants.find(v => v.id === forcedVariantId);
            if (variant)
                return variant;
        }
        // Check for existing assignment
        const existingAssignment = this.assignments.get(this.getAssignmentKey(experimentId, user.id));
        if (existingAssignment) {
            const variant = experiment.variants.find(v => v.id === existingAssignment.variantId);
            if (variant)
                return variant;
        }
        // Check traffic allocation
        const traffic = experiment.traffic ?? 1;
        if (Math.random() > traffic) {
            return null; // Not in experiment traffic
        }
        // Assign variant based on weights
        const variant = this.assignVariant(experiment, user);
        // Handle null variant (e.g., empty variants array)
        if (!variant) {
            return null;
        }
        // Store assignment
        const assignment = {
            experimentId,
            variantId: variant.id,
            timestamp: Date.now(),
        };
        this.assignments.set(this.getAssignmentKey(experimentId, user.id), assignment);
        this.saveAssignments();
        // Trigger callback
        this.config.onAssignment(assignment);
        return variant;
    }
    /**
     * Track an event (conversion, click, etc.)
     */
    track(experimentId, variantId, eventName, options = {}) {
        const event = {
            experimentId,
            variantId,
            eventName,
            value: options.value,
            userId: options.userId,
            timestamp: Date.now(),
        };
        this.events.push(event);
        this.config.onEvent(event);
    }
    /**
     * Get experiment results
     */
    getResults(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment)
            return null;
        const variantResults = experiment.variants.map(variant => {
            const impressions = Array.from(this.assignments.values()).filter(a => a.experimentId === experimentId && a.variantId === variant.id).length;
            const variantEvents = this.events.filter(e => e.experimentId === experimentId && e.variantId === variant.id);
            const conversions = variantEvents.filter(e => e.eventName === 'conversion').length;
            const conversionRate = impressions > 0 ? conversions / impressions : 0;
            const totalValue = variantEvents.reduce((sum, e) => sum + (e.value || 0), 0);
            const averageValue = conversions > 0 ? totalValue / conversions : undefined;
            return {
                variantId: variant.id,
                impressions,
                conversions,
                conversionRate,
                averageValue,
                revenue: totalValue,
            };
        });
        // Calculate winner (highest conversion rate with enough sample size)
        const minSampleSize = 100;
        const eligibleVariants = variantResults.filter(v => v.impressions >= minSampleSize);
        let winner;
        let confidence;
        if (eligibleVariants.length >= 2) {
            const sorted = [...eligibleVariants].sort((a, b) => b.conversionRate - a.conversionRate);
            winner = sorted[0].variantId;
            // Simple confidence calculation (would use proper stats in production)
            const bestRate = sorted[0].conversionRate;
            const secondRate = sorted[1].conversionRate;
            const difference = bestRate - secondRate;
            confidence = Math.min(0.99, difference * 10); // Simplified
        }
        const totalImpressions = variantResults.reduce((sum, v) => sum + v.impressions, 0);
        return {
            experimentId,
            variants: variantResults,
            winner,
            confidence,
            sampleSize: totalImpressions,
        };
    }
    /**
     * Clear all experiment data
     */
    clear() {
        this.assignments.clear();
        this.events = [];
        this.storage.remove('philjs_ab_assignments');
    }
    /**
     * Get all active experiments
     */
    getActiveExperiments() {
        return Array.from(this.experiments.values()).filter(exp => this.isExperimentActive(exp));
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    assignVariant(experiment, user) {
        // Handle empty variants
        if (!experiment.variants || experiment.variants.length === 0) {
            return null;
        }
        // Calculate total weight
        const totalWeight = experiment.variants.reduce((sum, v) => sum + (v.weight ?? 1), 0);
        // Deterministic assignment based on user ID (consistent assignments)
        const hash = this.hashString(`${user.id}:${experiment.id}`);
        const threshold = (hash % 10000) / 10000; // 0-1
        let cumulative = 0;
        for (const variant of experiment.variants) {
            const weight = (variant.weight ?? 1) / totalWeight;
            cumulative += weight;
            if (threshold <= cumulative) {
                return variant;
            }
        }
        return experiment.variants[0];
    }
    matchesTargeting(experiment, user) {
        if (!experiment.targeting)
            return true;
        const { segments, custom, countries, devices } = experiment.targeting;
        // Check segments
        if (segments && segments.length > 0) {
            if (!user.segments || !segments.some(s => user.segments.includes(s))) {
                return false;
            }
        }
        // Check custom targeting
        if (custom && !custom(user)) {
            return false;
        }
        // Check countries
        if (countries && countries.length > 0 && user.country) {
            if (!countries.includes(user.country)) {
                return false;
            }
        }
        // Check devices
        if (devices && devices.length > 0 && user.device) {
            if (!devices.includes(user.device)) {
                return false;
            }
        }
        return true;
    }
    isExperimentActive(experiment) {
        if (experiment.winner)
            return false; // Concluded
        const now = Date.now();
        if (experiment.schedule?.start) {
            if (now < experiment.schedule.start.getTime()) {
                return false; // Not started
            }
        }
        if (experiment.schedule?.end) {
            if (now > experiment.schedule.end.getTime()) {
                return false; // Ended
            }
        }
        return true;
    }
    getAssignmentKey(experimentId, userId) {
        return `${experimentId}:${userId}`;
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    loadAssignments() {
        const stored = this.storage.get('philjs_ab_assignments');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.assignments = new Map(Object.entries(data));
            }
            catch (e) {
                // Ignore parse errors
            }
        }
    }
    saveAssignments() {
        const data = Object.fromEntries(this.assignments.entries());
        this.storage.set('philjs_ab_assignments', JSON.stringify(data));
    }
}
// ============================================================================
// Global Instance
// ============================================================================
let globalEngine = null;
export function initABTesting(config = {}) {
    globalEngine = new ABTestEngine(config);
    return globalEngine;
}
export function getABTestEngine() {
    if (!globalEngine) {
        globalEngine = new ABTestEngine();
    }
    return globalEngine;
}
// ============================================================================
// React-Style Hooks
// ============================================================================
/**
 * Use A/B test variant (reactive)
 */
export function useExperiment(experimentId, user) {
    const variant = signal(null);
    const engine = getABTestEngine();
    variant.set(engine.getVariant(experimentId, user));
    return variant;
}
/**
 * Simple A/B test component helper
 */
export function ABTest(props) {
    const engine = getABTestEngine();
    const variant = engine.getVariant(props.experimentId, props.user);
    if (!variant) {
        return props.fallback ? props.fallback() : null;
    }
    const renderFn = props.variants[variant.id];
    return renderFn ? renderFn() : null;
}
/**
 * Feature flag (simple A/B test)
 */
export function useFeatureFlag(flagName, user, defaultValue = false) {
    const enabled = signal(defaultValue);
    const engine = getABTestEngine();
    // Create a simple experiment with two variants: on/off
    if (!engine['experiments'].has(flagName)) {
        engine.register({
            id: flagName,
            name: flagName,
            variants: [
                { id: 'off', name: 'Off' },
                { id: 'on', name: 'On' },
            ],
        });
    }
    const variant = engine.getVariant(flagName, user);
    enabled.set(variant?.id === 'on');
    return enabled;
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Create a multivariate test (more than 2 variants)
 */
export function createMultivariateTest(id, name, variants) {
    return {
        id,
        name,
        variants: variants.map(v => ({ id: v, name: v })),
    };
}
/**
 * Calculate statistical significance (Chi-squared test)
 */
export function calculateSignificance(controlConversions, controlImpressions, variantConversions, variantImpressions) {
    const controlRate = controlConversions / controlImpressions;
    const variantRate = variantConversions / variantImpressions;
    const pooledRate = (controlConversions + variantConversions) /
        (controlImpressions + variantImpressions);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlImpressions + 1 / variantImpressions));
    const z = Math.abs(controlRate - variantRate) / se;
    // Convert z-score to confidence (simplified)
    // z > 1.96 = 95% confidence, z > 2.58 = 99% confidence
    if (z > 2.58)
        return 0.99;
    if (z > 1.96)
        return 0.95;
    if (z > 1.65)
        return 0.90;
    return z / 2.58; // Approximate
}
//# sourceMappingURL=ab-testing.js.map