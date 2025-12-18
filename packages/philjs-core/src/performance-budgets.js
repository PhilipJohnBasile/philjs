/**
 * Performance budgets as first-class constraints.
 * Blocks builds that exceed budgets and tracks metrics over time.
 */
/**
 * Performance budget manager.
 */
export class PerformanceBudgetManager {
    budgets = new Map();
    history = new Map();
    baseline = null;
    /**
     * Set budget for a route.
     */
    setBudget(route, budget) {
        this.budgets.set(route, budget);
    }
    /**
     * Set global default budget.
     */
    setDefaultBudget(budget) {
        this.budgets.set("*", budget);
    }
    /**
     * Check if metrics exceed budget.
     */
    checkBudget(metrics) {
        const budget = this.budgets.get(metrics.route) || this.budgets.get("*");
        if (!budget) {
            return { passed: true, violations: [] };
        }
        const violations = [];
        // Check each metric
        for (const [key, limit] of Object.entries(budget)) {
            const actual = metrics.metrics[key];
            if (actual && typeof actual === "number" && actual > limit) {
                violations.push({
                    metric: key,
                    budget: limit,
                    actual,
                    excess: actual - limit,
                });
            }
        }
        return {
            passed: violations.length === 0,
            violations,
        };
    }
    /**
     * Detect performance regressions.
     */
    detectRegressions(current) {
        const history = this.history.get(current.route) || [];
        if (history.length === 0)
            return [];
        const previous = history[history.length - 1];
        const reports = [];
        for (const [key, currentValue] of Object.entries(current.metrics)) {
            if (typeof currentValue !== "number")
                continue;
            const previousValue = previous.metrics[key];
            if (typeof previousValue !== "number")
                continue;
            const change = currentValue - previousValue;
            const percentChange = (change / previousValue) * 100;
            // Only report regressions (worse performance)
            if (change > 0) {
                const severity = this.calculateSeverity(key, percentChange);
                const suggestions = this.generateSuggestions(key, current, previous);
                reports.push({
                    route: current.route,
                    metric: key,
                    previousValue,
                    currentValue,
                    change,
                    percentChange,
                    severity,
                    suggestions,
                });
            }
        }
        return reports;
    }
    /**
     * Calculate regression severity.
     */
    calculateSeverity(metric, percentChange) {
        const thresholds = {
            bundleSize: { low: 5, medium: 10, high: 20 },
            lcp: { low: 10, medium: 20, high: 50 },
            cls: { low: 20, medium: 50, high: 100 },
            renderTime: { low: 15, medium: 30, high: 50 },
        };
        const threshold = thresholds[metric] || {
            low: 10,
            medium: 25,
            high: 50,
        };
        if (percentChange >= threshold.high)
            return "critical";
        if (percentChange >= threshold.medium)
            return "high";
        if (percentChange >= threshold.low)
            return "medium";
        return "low";
    }
    /**
     * Generate improvement suggestions.
     */
    generateSuggestions(metric, current, previous) {
        const suggestions = [];
        // Analyze what changed
        const newDeps = current.dependencies.filter((d) => !previous.dependencies.includes(d));
        const removedDeps = previous.dependencies.filter((d) => !current.dependencies.includes(d));
        if (metric === "bundleSize" && newDeps.length > 0) {
            suggestions.push(`New dependencies added: ${newDeps.join(", ")}. Consider lazy loading or using lighter alternatives.`);
        }
        if (metric === "lcp") {
            suggestions.push("Consider optimizing critical rendering path", "Preload critical resources", "Reduce server response time");
        }
        if (metric === "cls") {
            suggestions.push("Add size attributes to images and videos", "Avoid inserting content above existing content", "Use CSS transform instead of position changes");
        }
        if (metric === "renderTime") {
            suggestions.push("Optimize component rendering with memoization", "Reduce unnecessary re-renders", "Consider virtualization for large lists");
        }
        return suggestions;
    }
    /**
     * Record metrics for a route.
     */
    recordMetrics(metrics) {
        const history = this.history.get(metrics.route) || [];
        history.push(metrics);
        // Keep last 100 entries
        if (history.length > 100) {
            history.shift();
        }
        this.history.set(metrics.route, history);
    }
    /**
     * Get performance trends for a route.
     */
    getTrends(route, days = 30) {
        const history = this.history.get(route) || [];
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        const recent = history.filter((h) => h.timestamp > cutoff);
        if (recent.length < 2)
            return [];
        const trends = [];
        // Analyze each metric
        for (const metric of Object.keys(recent[0].metrics)) {
            const dataPoints = recent.map((h) => ({
                timestamp: h.timestamp,
                value: h.metrics[metric],
            })).filter((d) => typeof d.value === "number");
            if (dataPoints.length < 2)
                continue;
            // Simple linear regression for trend
            const n = dataPoints.length;
            const sumX = dataPoints.reduce((sum, d) => sum + d.timestamp, 0);
            const sumY = dataPoints.reduce((sum, d) => sum + d.value, 0);
            const sumXY = dataPoints.reduce((sum, d) => sum + d.timestamp * d.value, 0);
            const sumX2 = dataPoints.reduce((sum, d) => sum + d.timestamp * d.timestamp, 0);
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const change = slope * days * 24 * 60 * 60 * 1000;
            let trend;
            if (Math.abs(change) < 0.01) {
                trend = "stable";
            }
            else if (change > 0) {
                trend = metric === "cls" ? "degrading" : "degrading";
            }
            else {
                trend = "improving";
            }
            trends.push({
                metric,
                trend,
                change,
                dataPoints,
            });
        }
        return trends;
    }
    /**
     * Export metrics data for visualization.
     */
    exportMetrics() {
        return {
            budgets: Object.fromEntries(this.budgets),
            history: Object.fromEntries(this.history),
        };
    }
    /**
     * Import metrics data.
     */
    importMetrics(data) {
        this.budgets = new Map(Object.entries(data.budgets));
        this.history = new Map(Object.entries(data.history));
    }
}
/**
 * Global performance budget manager instance.
 */
export const performanceBudgets = new PerformanceBudgetManager();
/**
 * Webpack/Rollup plugin to enforce budgets at build time.
 */
export function performanceBudgetPlugin(options) {
    return {
        name: "performance-budget",
        generateBundle(_options, bundle) {
            for (const [fileName, chunk] of Object.entries(bundle)) {
                const metrics = {
                    route: fileName,
                    timestamp: Date.now(),
                    metrics: {
                        bundleSize: chunk.code?.length || 0,
                        compressedSize: 0, // Would need actual compression
                        requestCount: 1,
                        totalRequestSize: chunk.code?.length || 0,
                    },
                    dependencies: chunk.imports || [],
                    criticalPath: [],
                };
                const result = performanceBudgets.checkBudget(metrics);
                if (!result.passed) {
                    const message = `Performance budget violations in ${fileName}:\n${result.violations
                        .map((v) => `  - ${v.metric}: ${v.actual} (budget: ${v.budget}, excess: ${v.excess})`)
                        .join("\n")}`;
                    if (options.failOnViolation && !options.warnOnly) {
                        throw new Error(message);
                    }
                    else {
                        console.warn(message);
                    }
                }
                performanceBudgets.recordMetrics(metrics);
            }
        },
    };
}
//# sourceMappingURL=performance-budgets.js.map