/**
 * @philjs/perf-budget - Performance Budget Enforcement
 *
 * Hard limits on bundle size, LCP, CLS, and more.
 * NO OTHER FRAMEWORK provides enforced performance budgets.
 *
 * Features:
 * - Bundle size limits
 * - Core Web Vitals budgets
 * - Runtime performance monitoring
 * - Build-time budget checks
 * - Budget violation alerts
 * - Historical trend tracking
 * - CI/CD integration
 * - Performance scoring
 */
export interface PerformanceBudget {
    maxBundleSize?: number;
    maxInitialBundle?: number;
    maxChunkSize?: number;
    maxTotalAssets?: number;
    maxLCP?: number;
    maxFID?: number;
    maxCLS?: number;
    maxINP?: number;
    maxTTFB?: number;
    maxFCP?: number;
    maxMemory?: number;
    maxLongTasks?: number;
    maxLayoutShifts?: number;
    maxNetworkRequests?: number;
    maxDOMNodes?: number;
    custom?: Record<string, number>;
}
export interface BudgetViolation {
    metric: string;
    budget: number;
    actual: number;
    severity: 'warning' | 'error';
    message: string;
    timestamp: number;
}
export interface PerformanceMetrics {
    bundleSize?: number;
    initialBundleSize?: number;
    chunkSizes?: Record<string, number>;
    totalAssetSize?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    inp?: number;
    ttfb?: number;
    fcp?: number;
    memoryUsage?: number;
    longTasks?: number;
    layoutShifts?: number;
    networkRequests?: number;
    domNodes?: number;
    custom?: Record<string, number>;
}
export interface BudgetConfig {
    budget: PerformanceBudget;
    warningThreshold?: number;
    errorThreshold?: number;
    onViolation?: (violation: BudgetViolation) => void;
    reportUrl?: string;
    enableRUM?: boolean;
}
export interface PerformanceScore {
    overall: number;
    bundleScore: number;
    webVitalsScore: number;
    runtimeScore: number;
    violations: BudgetViolation[];
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
export declare class PerformanceObserverManager {
    private observers;
    private metrics;
    private listeners;
    constructor();
    private setupObservers;
    getMetrics(): PerformanceMetrics;
    subscribe(callback: (metrics: PerformanceMetrics) => void): () => void;
    private notify;
    disconnect(): void;
}
export declare class BudgetChecker {
    private config;
    private violations;
    private observerManager;
    constructor(config: BudgetConfig);
    checkBudgets(metrics: PerformanceMetrics): BudgetViolation[];
    private checkMetric;
    private reportViolations;
    getViolations(): BudgetViolation[];
    clearViolations(): void;
    calculateScore(metrics: PerformanceMetrics): PerformanceScore;
    private calculateBundleScore;
    private calculateWebVitalsScore;
    private calculateRuntimeScore;
    private penalize;
    private scoreToGrade;
    destroy(): void;
}
export interface BuildArtifact {
    name: string;
    path: string;
    size: number;
    gzipSize?: number;
    brotliSize?: number;
    type: 'js' | 'css' | 'image' | 'font' | 'other';
    isEntry?: boolean;
}
export declare class BuildBudgetChecker {
    private budget;
    private artifacts;
    constructor(budget: PerformanceBudget);
    addArtifact(artifact: BuildArtifact): void;
    addArtifacts(artifacts: BuildArtifact[]): void;
    check(): {
        passed: boolean;
        violations: BudgetViolation[];
        summary: string;
    };
    private formatBytes;
    private generateSummary;
    getArtifactReport(): string;
}
/**
 * Hook for performance budgets
 */
export declare function usePerformanceBudget(config: BudgetConfig): {
    metrics: PerformanceMetrics;
    violations: BudgetViolation[];
    score: PerformanceScore | null;
    isWithinBudget: boolean;
};
/**
 * Hook for Core Web Vitals
 */
export declare function useWebVitals(): {
    lcp: number | undefined;
    fid: number | undefined;
    cls: number | undefined;
    inp: number | undefined;
    ttfb: number | undefined;
    fcp: number | undefined;
};
/**
 * Hook for custom performance metrics
 */
export declare function usePerformanceMetric(name: string): {
    value: number | undefined;
    record: (value: number) => void;
};
export declare function perfBudgetPlugin(budget: PerformanceBudget): any;
declare const _default: {
    PerformanceObserverManager: typeof PerformanceObserverManager;
    BudgetChecker: typeof BudgetChecker;
    BuildBudgetChecker: typeof BuildBudgetChecker;
    perfBudgetPlugin: typeof perfBudgetPlugin;
    usePerformanceBudget: typeof usePerformanceBudget;
    useWebVitals: typeof useWebVitals;
    usePerformanceMetric: typeof usePerformanceMetric;
};
export default _default;
//# sourceMappingURL=index.d.ts.map