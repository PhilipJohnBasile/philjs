/**
 * Signal Inspection Utilities
 *
 * Provides tools for inspecting and debugging PhilJS signals:
 * - Signal value tracking and history
 * - Dependency graph visualization
 * - Signal subscription monitoring
 * - Signal performance metrics
 */
// ============================================================================
// Signal Inspector
// ============================================================================
export class SignalInspector {
    signals = new Map();
    updates = new Map();
    config;
    idCounter = 0;
    constructor(config = {}) {
        this.config = {
            maxHistorySize: config.maxHistorySize ?? 50,
            captureStackTraces: config.captureStackTraces ?? false,
            trackDependencies: config.trackDependencies ?? true,
        };
    }
    /**
     * Register a signal for inspection
     */
    register(sig, name, type = "signal") {
        const id = `signal-${this.idCounter++}`;
        this.signals.set(id, {
            id,
            name,
            value: sig(),
            type,
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            updateCount: 0,
            subscribers: 0,
            dependencies: [],
        });
        // Wrap the signal's set method to track updates
        this.wrapSignal(sig, id);
        return id;
    }
    /**
     * Unregister a signal
     */
    unregister(signalId) {
        this.signals.delete(signalId);
        this.updates.delete(signalId);
    }
    /**
     * Get metadata for a signal
     */
    getMetadata(signalId) {
        return this.signals.get(signalId);
    }
    /**
     * Get all registered signals
     */
    getAllSignals() {
        return Array.from(this.signals.values());
    }
    /**
     * Get update history for a signal
     */
    getUpdateHistory(signalId) {
        return this.updates.get(signalId) || [];
    }
    /**
     * Get current value of a signal
     */
    getValue(signalId) {
        const metadata = this.signals.get(signalId);
        return metadata?.value;
    }
    /**
     * Track a dependency relationship between signals
     */
    trackDependency(dependentId, dependencyId) {
        if (!this.config.trackDependencies)
            return;
        const dependent = this.signals.get(dependentId);
        if (dependent && !dependent.dependencies.includes(dependencyId)) {
            dependent.dependencies.push(dependencyId);
        }
    }
    /**
     * Get dependency graph for all signals
     */
    getDependencyGraph() {
        const nodes = Array.from(this.signals.values()).map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
        }));
        const edges = [];
        for (const signal of this.signals.values()) {
            for (const depId of signal.dependencies) {
                edges.push({
                    from: signal.id,
                    to: depId,
                });
            }
        }
        return { nodes, edges };
    }
    /**
     * Get signals that depend on a given signal
     */
    getDependents(signalId) {
        const dependents = [];
        for (const signal of this.signals.values()) {
            if (signal.dependencies.includes(signalId)) {
                dependents.push(signal);
            }
        }
        return dependents;
    }
    /**
     * Get signals that a given signal depends on
     */
    getDependencies(signalId) {
        const signal = this.signals.get(signalId);
        if (!signal)
            return [];
        return signal.dependencies
            .map((id) => this.signals.get(id))
            .filter((s) => s !== undefined);
    }
    /**
     * Get performance metrics for a signal
     */
    getMetrics(signalId) {
        const metadata = this.signals.get(signalId);
        const updates = this.updates.get(signalId) || [];
        if (!metadata)
            return null;
        const now = Date.now();
        const totalLifetime = now - metadata.createdAt;
        let averageUpdateInterval = 0;
        if (updates.length > 1) {
            const intervals = [];
            for (let i = 1; i < updates.length; i++) {
                const current = updates[i];
                const prev = updates[i - 1];
                if (current && prev) {
                    intervals.push(current.timestamp - prev.timestamp);
                }
            }
            averageUpdateInterval =
                intervals.reduce((a, b) => a + b, 0) / intervals.length;
        }
        return {
            updateCount: metadata.updateCount,
            averageUpdateInterval,
            lastUpdateTime: metadata.lastUpdated,
            totalLifetime,
        };
    }
    /**
     * Clear all tracked data
     */
    clear() {
        this.signals.clear();
        this.updates.clear();
        this.idCounter = 0;
    }
    /**
     * Export inspector state as JSON
     */
    export() {
        return JSON.stringify({
            signals: Array.from(this.signals.entries()),
            updates: Array.from(this.updates.entries()),
            exportedAt: new Date().toISOString(),
        });
    }
    /**
     * Import inspector state from JSON
     */
    import(json) {
        try {
            const data = JSON.parse(json);
            this.signals = new Map(data.signals);
            this.updates = new Map(data.updates);
        }
        catch (error) {
            console.error("Failed to import inspector state:", error);
        }
    }
    // Private methods
    wrapSignal(sig, id) {
        const originalSet = sig.set;
        const inspector = this;
        sig.set = function (next) {
            const oldValue = sig();
            originalSet.call(sig, next);
            const newValue = sig();
            inspector.recordUpdate(id, oldValue, newValue);
        };
    }
    recordUpdate(signalId, oldValue, newValue) {
        const metadata = this.signals.get(signalId);
        if (!metadata)
            return;
        // Update metadata
        metadata.value = newValue;
        metadata.lastUpdated = Date.now();
        metadata.updateCount++;
        // Record update
        const update = {
            signalId,
            timestamp: Date.now(),
            oldValue,
            newValue,
        };
        if (this.config.captureStackTraces) {
            try {
                throw new Error();
            }
            catch (e) {
                update.stackTrace = e.stack;
            }
        }
        const history = this.updates.get(signalId) || [];
        history.push(update);
        // Maintain max size
        if (history.length > this.config.maxHistorySize) {
            history.shift();
        }
        this.updates.set(signalId, history);
    }
}
// ============================================================================
// Global Instance & Utilities
// ============================================================================
let globalInspector = null;
export function initSignalInspector(config) {
    if (!globalInspector) {
        globalInspector = new SignalInspector(config);
    }
    return globalInspector;
}
export function getSignalInspector() {
    return globalInspector;
}
/**
 * Create an inspectable signal wrapper
 */
export function inspectSignal(sig, name, type = "signal") {
    const inspector = getSignalInspector();
    if (inspector) {
        inspector.register(sig, name, type);
    }
    return sig;
}
/**
 * Format signal value for display
 */
export function formatSignalValue(value, maxLength = 100) {
    if (value === null)
        return "null";
    if (value === undefined)
        return "undefined";
    if (typeof value === "function") {
        return "[Function]";
    }
    if (typeof value === "object") {
        const json = JSON.stringify(value, null, 2);
        if (json.length > maxLength) {
            return json.slice(0, maxLength) + "...";
        }
        return json;
    }
    const str = String(value);
    if (str.length > maxLength) {
        return str.slice(0, maxLength) + "...";
    }
    return str;
}
/**
 * Compare two signal values and determine if they are different
 */
export function signalValuesChanged(oldValue, newValue) {
    // Reference equality for objects
    if (typeof oldValue === "object" && typeof newValue === "object") {
        return oldValue !== newValue;
    }
    // Value equality for primitives
    return oldValue !== newValue;
}
//# sourceMappingURL=signal-inspector.js.map