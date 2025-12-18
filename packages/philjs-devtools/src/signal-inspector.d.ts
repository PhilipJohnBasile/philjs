/**
 * Signal Inspection Utilities
 *
 * Provides tools for inspecting and debugging PhilJS signals:
 * - Signal value tracking and history
 * - Dependency graph visualization
 * - Signal subscription monitoring
 * - Signal performance metrics
 */
import type { Signal } from "philjs-core";
export type SignalMetadata = {
    id: string;
    name: string;
    value: any;
    type: "signal" | "memo" | "linkedSignal" | "resource";
    createdAt: number;
    lastUpdated: number;
    updateCount: number;
    subscribers: number;
    dependencies: string[];
};
export type SignalUpdate = {
    signalId: string;
    timestamp: number;
    oldValue: any;
    newValue: any;
    stackTrace?: string;
};
export type SignalDependencyGraph = {
    nodes: Array<{
        id: string;
        name: string;
        type: string;
    }>;
    edges: Array<{
        from: string;
        to: string;
    }>;
};
export type SignalInspectorConfig = {
    maxHistorySize?: number;
    captureStackTraces?: boolean;
    trackDependencies?: boolean;
};
export declare class SignalInspector {
    private signals;
    private updates;
    private config;
    private idCounter;
    constructor(config?: SignalInspectorConfig);
    /**
     * Register a signal for inspection
     */
    register<T>(sig: Signal<T>, name: string, type?: SignalMetadata["type"]): string;
    /**
     * Unregister a signal
     */
    unregister(signalId: string): void;
    /**
     * Get metadata for a signal
     */
    getMetadata(signalId: string): SignalMetadata | undefined;
    /**
     * Get all registered signals
     */
    getAllSignals(): SignalMetadata[];
    /**
     * Get update history for a signal
     */
    getUpdateHistory(signalId: string): SignalUpdate[];
    /**
     * Get current value of a signal
     */
    getValue(signalId: string): any;
    /**
     * Track a dependency relationship between signals
     */
    trackDependency(dependentId: string, dependencyId: string): void;
    /**
     * Get dependency graph for all signals
     */
    getDependencyGraph(): SignalDependencyGraph;
    /**
     * Get signals that depend on a given signal
     */
    getDependents(signalId: string): SignalMetadata[];
    /**
     * Get signals that a given signal depends on
     */
    getDependencies(signalId: string): SignalMetadata[];
    /**
     * Get performance metrics for a signal
     */
    getMetrics(signalId: string): {
        updateCount: number;
        averageUpdateInterval: number;
        lastUpdateTime: number;
        totalLifetime: number;
    } | null;
    /**
     * Clear all tracked data
     */
    clear(): void;
    /**
     * Export inspector state as JSON
     */
    export(): string;
    /**
     * Import inspector state from JSON
     */
    import(json: string): void;
    private wrapSignal;
    private recordUpdate;
}
export declare function initSignalInspector(config?: SignalInspectorConfig): SignalInspector;
export declare function getSignalInspector(): SignalInspector | null;
/**
 * Create an inspectable signal wrapper
 */
export declare function inspectSignal<T>(sig: Signal<T>, name: string, type?: SignalMetadata["type"]): Signal<T>;
/**
 * Format signal value for display
 */
export declare function formatSignalValue(value: any, maxLength?: number): string;
/**
 * Compare two signal values and determine if they are different
 */
export declare function signalValuesChanged(oldValue: any, newValue: any): boolean;
//# sourceMappingURL=signal-inspector.d.ts.map