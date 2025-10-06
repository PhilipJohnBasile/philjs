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
export class PerformanceBudgetManager {
  private budgets = new Map<string, PerformanceBudget>();
  private history = new Map<string, RouteMetrics[]>();
  private baseline: Map<string, RouteMetrics> | null = null;

  /**
   * Set budget for a route.
   */
  setBudget(route: string, budget: PerformanceBudget): void {
    this.budgets.set(route, budget);
  }

  /**
   * Set global default budget.
   */
  setDefaultBudget(budget: PerformanceBudget): void {
    this.budgets.set("*", budget);
  }

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
  } {
    const budget = this.budgets.get(metrics.route) || this.budgets.get("*");
    if (!budget) {
      return { passed: true, violations: [] };
    }

    const violations: Array<{
      metric: string;
      budget: number;
      actual: number;
      excess: number;
    }> = [];

    // Check each metric
    for (const [key, limit] of Object.entries(budget)) {
      const actual = metrics.metrics[key as keyof typeof metrics.metrics];
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
  detectRegressions(current: RouteMetrics): RegressionReport[] {
    const history = this.history.get(current.route) || [];
    if (history.length === 0) return [];

    const previous = history[history.length - 1];
    const reports: RegressionReport[] = [];

    for (const [key, currentValue] of Object.entries(current.metrics)) {
      if (typeof currentValue !== "number") continue;

      const previousValue = previous.metrics[key as keyof typeof previous.metrics];
      if (typeof previousValue !== "number") continue;

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
  private calculateSeverity(
    metric: string,
    percentChange: number
  ): "low" | "medium" | "high" | "critical" {
    const thresholds = {
      bundleSize: { low: 5, medium: 10, high: 20 },
      lcp: { low: 10, medium: 20, high: 50 },
      cls: { low: 20, medium: 50, high: 100 },
      renderTime: { low: 15, medium: 30, high: 50 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds] || {
      low: 10,
      medium: 25,
      high: 50,
    };

    if (percentChange >= threshold.high) return "critical";
    if (percentChange >= threshold.medium) return "high";
    if (percentChange >= threshold.low) return "medium";
    return "low";
  }

  /**
   * Generate improvement suggestions.
   */
  private generateSuggestions(
    metric: string,
    current: RouteMetrics,
    previous: RouteMetrics
  ): string[] {
    const suggestions: string[] = [];

    // Analyze what changed
    const newDeps = current.dependencies.filter(
      (d) => !previous.dependencies.includes(d)
    );
    const removedDeps = previous.dependencies.filter(
      (d) => !current.dependencies.includes(d)
    );

    if (metric === "bundleSize" && newDeps.length > 0) {
      suggestions.push(
        `New dependencies added: ${newDeps.join(", ")}. Consider lazy loading or using lighter alternatives.`
      );
    }

    if (metric === "lcp") {
      suggestions.push(
        "Consider optimizing critical rendering path",
        "Preload critical resources",
        "Reduce server response time"
      );
    }

    if (metric === "cls") {
      suggestions.push(
        "Add size attributes to images and videos",
        "Avoid inserting content above existing content",
        "Use CSS transform instead of position changes"
      );
    }

    if (metric === "renderTime") {
      suggestions.push(
        "Optimize component rendering with memoization",
        "Reduce unnecessary re-renders",
        "Consider virtualization for large lists"
      );
    }

    return suggestions;
  }

  /**
   * Record metrics for a route.
   */
  recordMetrics(metrics: RouteMetrics): void {
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
  getTrends(route: string, days: number = 30): {
    metric: string;
    trend: "improving" | "stable" | "degrading";
    change: number;
    dataPoints: Array<{ timestamp: number; value: number }>;
  }[] {
    const history = this.history.get(route) || [];
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recent = history.filter((h) => h.timestamp > cutoff);

    if (recent.length < 2) return [];

    const trends: ReturnType<typeof this.getTrends> = [];

    // Analyze each metric
    for (const metric of Object.keys(recent[0].metrics)) {
      const dataPoints = recent.map((h) => ({
        timestamp: h.timestamp,
        value: h.metrics[metric as keyof typeof h.metrics] as number,
      })).filter((d) => typeof d.value === "number");

      if (dataPoints.length < 2) continue;

      // Simple linear regression for trend
      const n = dataPoints.length;
      const sumX = dataPoints.reduce((sum, d) => sum + d.timestamp, 0);
      const sumY = dataPoints.reduce((sum, d) => sum + d.value, 0);
      const sumXY = dataPoints.reduce((sum, d) => sum + d.timestamp * d.value, 0);
      const sumX2 = dataPoints.reduce((sum, d) => sum + d.timestamp * d.timestamp, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const change = slope * days * 24 * 60 * 60 * 1000;

      let trend: "improving" | "stable" | "degrading";
      if (Math.abs(change) < 0.01) {
        trend = "stable";
      } else if (change > 0) {
        trend = metric === "cls" ? "degrading" : "degrading";
      } else {
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
  exportMetrics(): {
    budgets: Record<string, PerformanceBudget>;
    history: Record<string, RouteMetrics[]>;
  } {
    return {
      budgets: Object.fromEntries(this.budgets),
      history: Object.fromEntries(this.history),
    };
  }

  /**
   * Import metrics data.
   */
  importMetrics(data: {
    budgets: Record<string, PerformanceBudget>;
    history: Record<string, RouteMetrics[]>;
  }): void {
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
export function performanceBudgetPlugin(options: {
  budgets: Record<string, PerformanceBudget>;
  failOnViolation?: boolean;
  warnOnly?: boolean;
}) {
  return {
    name: "performance-budget",

    generateBundle(_, bundle: any) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        const metrics: RouteMetrics = {
          route: fileName,
          timestamp: Date.now(),
          metrics: {
            bundleSize: (chunk as any).code?.length || 0,
            compressedSize: 0, // Would need actual compression
            requestCount: 1,
            totalRequestSize: (chunk as any).code?.length || 0,
          },
          dependencies: (chunk as any).imports || [],
          criticalPath: [],
        };

        const result = performanceBudgets.checkBudget(metrics);

        if (!result.passed) {
          const message = `Performance budget violations in ${fileName}:\n${result.violations
            .map(
              (v) =>
                `  - ${v.metric}: ${v.actual} (budget: ${v.budget}, excess: ${v.excess})`
            )
            .join("\n")}`;

          if (options.failOnViolation && !options.warnOnly) {
            throw new Error(message);
          } else {
            console.warn(message);
          }
        }

        performanceBudgets.recordMetrics(metrics);
      }
    },
  };
}