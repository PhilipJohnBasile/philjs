/**
 * Component usage analytics system.
 * Tracks which components are actually used in production,
 * suggests optimizations, and detects dead code.
 */
export type PropUsageStats = {
    value: any;
    count: number;
    percentage: number;
};
export type ComponentUsage = {
    /** Component name/path */
    component: string;
    /** Number of times imported */
    importCount: number;
    /** Number of times rendered */
    renderCount: number;
    /** Routes where it's used */
    usedInRoutes: Set<string>;
    /** Props passed (with frequency) - Map of prop name to Map of value to stats */
    propsUsage: Map<string, Map<any, PropUsageStats>>;
    /** Average render time in ms */
    avgRenderTime: number;
    /** Bundle size in bytes */
    bundleSize: number;
    /** Last used timestamp */
    lastUsed: number;
    /** Dependencies this component imports */
    dependencies: string[];
    /** Components that import this one */
    importedBy: string[];
    /** Whether it's been rendered in last 30 days */
    isActive: boolean;
};
export type DeadCodeReport = {
    component: string;
    reason: "never-rendered" | "not-used-recently" | "only-imported" | "circular-dependency";
    lastUsed?: number;
    importedBy: string[];
    suggestion: string;
    confidence: number;
};
export type OptimizationSuggestion = {
    component: string;
    type: "default-prop" | "split-component" | "memo" | "lazy-load" | "remove-dependency";
    description: string;
    impact: "high" | "medium" | "low";
    autoFixAvailable: boolean;
    codeChanges?: {
        file: string;
        before: string;
        after: string;
    }[];
};
/**
 * Usage analytics manager.
 */
export declare class UsageAnalytics {
    private usage;
    private renderTimes;
    private propPatterns;
    private productionMode;
    /**
     * Track component import.
     */
    trackImport(component: string, importedBy: string, route?: string): void;
    /**
     * Track component render.
     */
    trackRender(component: string, props: Record<string, any>, renderTime: number, route: string): void;
    /**
     * Track prop usage patterns.
     */
    private trackPropUsage;
    /**
     * Get or create usage entry.
     */
    private getOrCreateUsage;
    /**
     * Detect dead code.
     */
    detectDeadCode(options?: {
        inactivityThreshold?: number;
        minConfidence?: number;
    }): DeadCodeReport[];
    /**
     * Check for circular dependencies.
     */
    private hasCircularDependency;
    /**
     * Generate optimization suggestions.
     */
    generateOptimizations(): OptimizationSuggestion[];
    /**
     * Get component dependency graph.
     */
    getDependencyGraph(): {
        nodes: Array<{
            id: string;
            size: number;
            active: boolean;
        }>;
        edges: Array<{
            source: string;
            target: string;
            weight: number;
        }>;
    };
    /**
     * Export usage data.
     */
    exportUsageData(): Record<string, ComponentUsage>;
    /**
     * Generate automatic documentation from usage.
     */
    generateDocumentation(component: string): string;
}
/**
 * Global usage analytics instance.
 */
export declare const usageAnalytics: UsageAnalytics;
//# sourceMappingURL=usage-analytics.d.ts.map