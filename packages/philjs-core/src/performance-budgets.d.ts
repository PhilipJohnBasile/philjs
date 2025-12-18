/**
 * Performance budgets as first-class constraints.
 * Blocks builds that exceed budgets and tracks metrics over time.
 */
export type PerformanceBudget = {
    /** Maximum bundle size in KB */
    bundleSize?: number;
    /** Maximum compressed size in KB */
    compressedSize?: number;
    /** Maximum Largest Contentful Paint in ms */
    lcp?: number;
    /** Maximum Cumulative Layout Shift score */
    cls?: number;
    /** Maximum First Input Delay in ms */
    fid?: number;
    /** Maximum Time to Interactive in ms */
    tti?: number;
    /** Maximum JavaScript execution time in ms */
    jsExecutionTime?: number;
    /** Maximum number of requests */
    requestCount?: number;
    /** Maximum total request size in KB */
    totalRequestSize?: number;
    /** Maximum memory usage in MB */
    memoryUsage?: number;
    /** Maximum render time in ms */
    renderTime?: number;
};
export type RouteMetrics = {
    route: string;
    timestamp: number;
    metrics: {
        bundleSize: number;
        compressedSize: number;
        lcp?: number;
        cls?: number;
        fid?: number;
        tti?: number;
        jsExecutionTime?: number;
        requestCount?: number;
        totalRequestSize?: number;
        memoryUsage?: number;
        renderTime?: number;
    };
    dependencies: string[];
    criticalPath: string[];
};
export type RegressionReport = {
    route: string;
    metric: string;
    previousValue: number;
    currentValue: number;
    change: number;
    percentChange: number;
    severity: "low" | "medium" | "high" | "critical";
    suggestions: string[];
};
/**
 * Performance budget manager.
 */
export declare class PerformanceBudgetManager {
    private budgets;
    private history;
    private baseline;
    /**
     * Set budget for a route.
     */
    setBudget(route: string, budget: PerformanceBudget): void;
    /**
     * Set global default budget.
     */
    setDefaultBudget(budget: PerformanceBudget): void;
    /**
     * Check if metrics exceed budget.
     */
    checkBudget(metrics: RouteMetrics): {
        passed: boolean;
        violations: Array<{
            metric: string;
            budget: number;
            actual: number;
            excess: number;
        }>;
    };
    /**
     * Detect performance regressions.
     */
    detectRegressions(current: RouteMetrics): RegressionReport[];
    /**
     * Calculate regression severity.
     */
    private calculateSeverity;
    /**
     * Generate improvement suggestions.
     */
    private generateSuggestions;
    /**
     * Record metrics for a route.
     */
    recordMetrics(metrics: RouteMetrics): void;
    /**
     * Get performance trends for a route.
     */
    getTrends(route: string, days?: number): {
        metric: string;
        trend: "improving" | "stable" | "degrading";
        change: number;
        dataPoints: Array<{
            timestamp: number;
            value: number;
        }>;
    }[];
    /**
     * Export metrics data for visualization.
     */
    exportMetrics(): {
        budgets: Record<string, PerformanceBudget>;
        history: Record<string, RouteMetrics[]>;
    };
    /**
     * Import metrics data.
     */
    importMetrics(data: {
        budgets: Record<string, PerformanceBudget>;
        history: Record<string, RouteMetrics[]>;
    }): void;
}
/**
 * Global performance budget manager instance.
 */
export declare const performanceBudgets: PerformanceBudgetManager;
/**
 * Webpack/Rollup plugin to enforce budgets at build time.
 */
export declare function performanceBudgetPlugin(options: {
    budgets: Record<string, PerformanceBudget>;
    failOnViolation?: boolean;
    warnOnly?: boolean;
}): {
    name: string;
    generateBundle(_options: any, bundle: any): void;
};
//# sourceMappingURL=performance-budgets.d.ts.map