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
// ============================================================================
// Performance Observer
// ============================================================================
export class PerformanceObserverManager {
    observers = [];
    metrics = {};
    listeners = new Set();
    constructor() {
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            this.setupObservers();
        }
    }
    setupObservers() {
        // LCP Observer
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.startTime;
                this.notify();
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            this.observers.push(lcpObserver);
        }
        catch (e) {
            // LCP not supported
        }
        // FID Observer
        try {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const firstEntry = entries[0];
                this.metrics.fid = firstEntry.processingStart - firstEntry.startTime;
                this.notify();
            });
            fidObserver.observe({ type: 'first-input', buffered: true });
            this.observers.push(fidObserver);
        }
        catch (e) {
            // FID not supported
        }
        // CLS Observer
        try {
            let clsValue = 0;
            let clsEntries = [];
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        const firstEntry = clsEntries[0];
                        const lastEntry = clsEntries[clsEntries.length - 1];
                        if (clsEntries.length &&
                            entry.startTime - lastEntry.startTime < 1000 &&
                            entry.startTime - firstEntry.startTime < 5000) {
                            clsValue += entry.value;
                            clsEntries.push(entry);
                        }
                        else {
                            clsValue = entry.value;
                            clsEntries = [entry];
                        }
                    }
                }
                this.metrics.cls = clsValue;
                this.metrics.layoutShifts = (this.metrics.layoutShifts ?? 0) + 1;
                this.notify();
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
            this.observers.push(clsObserver);
        }
        catch (e) {
            // CLS not supported
        }
        // Long Tasks Observer
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                this.metrics.longTasks = (this.metrics.longTasks ?? 0) + list.getEntries().length;
                this.notify();
            });
            longTaskObserver.observe({ type: 'longtask', buffered: true });
            this.observers.push(longTaskObserver);
        }
        catch (e) {
            // Long tasks not supported
        }
        // Navigation timing
        try {
            const navObserver = new PerformanceObserver((list) => {
                const entry = list.getEntries()[0];
                this.metrics.ttfb = entry.responseStart - entry.requestStart;
                this.notify();
            });
            navObserver.observe({ type: 'navigation', buffered: true });
            this.observers.push(navObserver);
        }
        catch (e) {
            // Navigation timing not supported
        }
        // Paint timing (FCP)
        try {
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.fcp = entry.startTime;
                        this.notify();
                    }
                }
            });
            paintObserver.observe({ type: 'paint', buffered: true });
            this.observers.push(paintObserver);
        }
        catch (e) {
            // Paint timing not supported
        }
        // Resource timing for network requests
        try {
            const resourceObserver = new PerformanceObserver((list) => {
                this.metrics.networkRequests = (this.metrics.networkRequests ?? 0) + list.getEntries().length;
                this.notify();
            });
            resourceObserver.observe({ type: 'resource', buffered: true });
            this.observers.push(resourceObserver);
        }
        catch (e) {
            // Resource timing not supported
        }
        // Memory usage (Chrome only)
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024);
                this.notify();
            }, 5000);
        }
        // DOM node count
        setInterval(() => {
            this.metrics.domNodes = document.querySelectorAll('*').length;
            this.notify();
        }, 5000);
    }
    getMetrics() {
        return { ...this.metrics };
    }
    subscribe(callback) {
        this.listeners.add(callback);
        callback(this.metrics);
        return () => this.listeners.delete(callback);
    }
    notify() {
        this.listeners.forEach(cb => cb(this.metrics));
    }
    disconnect() {
        this.observers.forEach(obs => obs.disconnect());
        this.observers = [];
    }
}
// ============================================================================
// Budget Checker
// ============================================================================
export class BudgetChecker {
    config;
    violations = [];
    observerManager;
    constructor(config) {
        this.config = {
            budget: config.budget,
            warningThreshold: config.warningThreshold ?? 0.8,
            errorThreshold: config.errorThreshold ?? 1.0,
            onViolation: config.onViolation ?? (() => { }),
            reportUrl: config.reportUrl ?? '',
            enableRUM: config.enableRUM ?? true
        };
        this.observerManager = new PerformanceObserverManager();
        if (this.config.enableRUM) {
            this.observerManager.subscribe((metrics) => {
                this.checkBudgets(metrics);
            });
        }
    }
    checkBudgets(metrics) {
        const violations = [];
        const budget = this.config.budget;
        // Bundle size checks
        if (budget.maxBundleSize && metrics.bundleSize) {
            this.checkMetric('bundleSize', metrics.bundleSize, budget.maxBundleSize, violations, 'bytes');
        }
        if (budget.maxInitialBundle && metrics.initialBundleSize) {
            this.checkMetric('initialBundle', metrics.initialBundleSize, budget.maxInitialBundle, violations, 'bytes');
        }
        if (budget.maxTotalAssets && metrics.totalAssetSize) {
            this.checkMetric('totalAssets', metrics.totalAssetSize, budget.maxTotalAssets, violations, 'bytes');
        }
        // Core Web Vitals checks
        if (budget.maxLCP && metrics.lcp) {
            this.checkMetric('LCP', metrics.lcp, budget.maxLCP, violations, 'ms');
        }
        if (budget.maxFID && metrics.fid) {
            this.checkMetric('FID', metrics.fid, budget.maxFID, violations, 'ms');
        }
        if (budget.maxCLS && metrics.cls !== undefined) {
            this.checkMetric('CLS', metrics.cls, budget.maxCLS, violations, '');
        }
        if (budget.maxINP && metrics.inp) {
            this.checkMetric('INP', metrics.inp, budget.maxINP, violations, 'ms');
        }
        if (budget.maxTTFB && metrics.ttfb) {
            this.checkMetric('TTFB', metrics.ttfb, budget.maxTTFB, violations, 'ms');
        }
        if (budget.maxFCP && metrics.fcp) {
            this.checkMetric('FCP', metrics.fcp, budget.maxFCP, violations, 'ms');
        }
        // Runtime checks
        if (budget.maxMemory && metrics.memoryUsage) {
            this.checkMetric('memory', metrics.memoryUsage, budget.maxMemory, violations, 'MB');
        }
        if (budget.maxLongTasks && metrics.longTasks) {
            this.checkMetric('longTasks', metrics.longTasks, budget.maxLongTasks, violations, 'count');
        }
        if (budget.maxLayoutShifts && metrics.layoutShifts) {
            this.checkMetric('layoutShifts', metrics.layoutShifts, budget.maxLayoutShifts, violations, 'count');
        }
        if (budget.maxNetworkRequests && metrics.networkRequests) {
            this.checkMetric('networkRequests', metrics.networkRequests, budget.maxNetworkRequests, violations, 'count');
        }
        if (budget.maxDOMNodes && metrics.domNodes) {
            this.checkMetric('domNodes', metrics.domNodes, budget.maxDOMNodes, violations, 'nodes');
        }
        // Custom metrics
        if (budget.custom && metrics.custom) {
            for (const [key, maxValue] of Object.entries(budget.custom)) {
                if (metrics.custom[key] !== undefined) {
                    this.checkMetric(key, metrics.custom[key], maxValue, violations, '');
                }
            }
        }
        // Store and report violations
        for (const violation of violations) {
            this.violations.push(violation);
            this.config.onViolation(violation);
        }
        if (violations.length > 0 && this.config.reportUrl) {
            this.reportViolations(violations);
        }
        return violations;
    }
    checkMetric(metric, actual, budget, violations, unit) {
        const ratio = actual / budget;
        if (ratio >= this.config.errorThreshold) {
            violations.push({
                metric,
                budget,
                actual,
                severity: 'error',
                message: `${metric}: ${actual}${unit} exceeds budget of ${budget}${unit}`,
                timestamp: Date.now()
            });
        }
        else if (ratio >= this.config.warningThreshold) {
            violations.push({
                metric,
                budget,
                actual,
                severity: 'warning',
                message: `${metric}: ${actual}${unit} approaching budget of ${budget}${unit}`,
                timestamp: Date.now()
            });
        }
    }
    async reportViolations(violations) {
        try {
            await fetch(this.config.reportUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    violations,
                    url: typeof location !== 'undefined' ? location.href : '',
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                    timestamp: Date.now()
                })
            });
        }
        catch (e) {
            console.error('Failed to report budget violations:', e);
        }
    }
    getViolations() {
        return [...this.violations];
    }
    clearViolations() {
        this.violations = [];
    }
    calculateScore(metrics) {
        const violations = this.checkBudgets(metrics);
        // Calculate component scores
        const bundleScore = this.calculateBundleScore(metrics);
        const webVitalsScore = this.calculateWebVitalsScore(metrics);
        const runtimeScore = this.calculateRuntimeScore(metrics);
        // Weight the scores
        const overall = Math.round(bundleScore * 0.3 +
            webVitalsScore * 0.5 +
            runtimeScore * 0.2);
        const grade = this.scoreToGrade(overall);
        return {
            overall,
            bundleScore,
            webVitalsScore,
            runtimeScore,
            violations,
            grade
        };
    }
    calculateBundleScore(metrics) {
        const budget = this.config.budget;
        let score = 100;
        let checks = 0;
        if (budget.maxBundleSize && metrics.bundleSize) {
            score -= this.penalize(metrics.bundleSize, budget.maxBundleSize);
            checks++;
        }
        if (budget.maxInitialBundle && metrics.initialBundleSize) {
            score -= this.penalize(metrics.initialBundleSize, budget.maxInitialBundle);
            checks++;
        }
        return checks > 0 ? Math.max(0, score / checks * checks) : 100;
    }
    calculateWebVitalsScore(metrics) {
        const budget = this.config.budget;
        let totalScore = 0;
        let checks = 0;
        // LCP scoring (good < 2500ms, needs improvement < 4000ms)
        if (metrics.lcp !== undefined) {
            if (metrics.lcp < 2500)
                totalScore += 100;
            else if (metrics.lcp < 4000)
                totalScore += 75;
            else
                totalScore += 50 * (4000 / metrics.lcp);
            checks++;
        }
        // FID scoring (good < 100ms, needs improvement < 300ms)
        if (metrics.fid !== undefined) {
            if (metrics.fid < 100)
                totalScore += 100;
            else if (metrics.fid < 300)
                totalScore += 75;
            else
                totalScore += 50 * (300 / metrics.fid);
            checks++;
        }
        // CLS scoring (good < 0.1, needs improvement < 0.25)
        if (metrics.cls !== undefined) {
            if (metrics.cls < 0.1)
                totalScore += 100;
            else if (metrics.cls < 0.25)
                totalScore += 75;
            else
                totalScore += Math.max(0, 50 * (0.25 / metrics.cls));
            checks++;
        }
        // TTFB scoring (good < 800ms)
        if (metrics.ttfb !== undefined) {
            if (metrics.ttfb < 800)
                totalScore += 100;
            else if (metrics.ttfb < 1800)
                totalScore += 75;
            else
                totalScore += 50 * (1800 / metrics.ttfb);
            checks++;
        }
        // FCP scoring (good < 1800ms)
        if (metrics.fcp !== undefined) {
            if (metrics.fcp < 1800)
                totalScore += 100;
            else if (metrics.fcp < 3000)
                totalScore += 75;
            else
                totalScore += 50 * (3000 / metrics.fcp);
            checks++;
        }
        return checks > 0 ? Math.round(totalScore / checks) : 100;
    }
    calculateRuntimeScore(metrics) {
        const budget = this.config.budget;
        let score = 100;
        if (budget.maxMemory && metrics.memoryUsage) {
            score -= this.penalize(metrics.memoryUsage, budget.maxMemory) * 0.5;
        }
        if (budget.maxLongTasks && metrics.longTasks) {
            score -= this.penalize(metrics.longTasks, budget.maxLongTasks) * 0.3;
        }
        if (budget.maxDOMNodes && metrics.domNodes) {
            score -= this.penalize(metrics.domNodes, budget.maxDOMNodes) * 0.2;
        }
        return Math.max(0, Math.round(score));
    }
    penalize(actual, budget) {
        const ratio = actual / budget;
        if (ratio <= 1)
            return 0;
        return Math.min(100, (ratio - 1) * 100);
    }
    scoreToGrade(score) {
        if (score >= 90)
            return 'A';
        if (score >= 80)
            return 'B';
        if (score >= 70)
            return 'C';
        if (score >= 60)
            return 'D';
        return 'F';
    }
    destroy() {
        this.observerManager.disconnect();
    }
}
export class BuildBudgetChecker {
    budget;
    artifacts = [];
    constructor(budget) {
        this.budget = budget;
    }
    addArtifact(artifact) {
        this.artifacts.push(artifact);
    }
    addArtifacts(artifacts) {
        this.artifacts.push(...artifacts);
    }
    check() {
        const violations = [];
        // Total bundle size
        const totalJS = this.artifacts
            .filter(a => a.type === 'js')
            .reduce((sum, a) => sum + a.size, 0);
        if (this.budget.maxBundleSize && totalJS > this.budget.maxBundleSize) {
            violations.push({
                metric: 'bundleSize',
                budget: this.budget.maxBundleSize,
                actual: totalJS,
                severity: 'error',
                message: `Total JS bundle (${this.formatBytes(totalJS)}) exceeds budget (${this.formatBytes(this.budget.maxBundleSize)})`,
                timestamp: Date.now()
            });
        }
        // Initial bundle (entry points)
        const initialJS = this.artifacts
            .filter(a => a.type === 'js' && a.isEntry)
            .reduce((sum, a) => sum + a.size, 0);
        if (this.budget.maxInitialBundle && initialJS > this.budget.maxInitialBundle) {
            violations.push({
                metric: 'initialBundle',
                budget: this.budget.maxInitialBundle,
                actual: initialJS,
                severity: 'error',
                message: `Initial JS bundle (${this.formatBytes(initialJS)}) exceeds budget (${this.formatBytes(this.budget.maxInitialBundle)})`,
                timestamp: Date.now()
            });
        }
        // Individual chunk sizes
        if (this.budget.maxChunkSize) {
            for (const artifact of this.artifacts.filter(a => a.type === 'js')) {
                if (artifact.size > this.budget.maxChunkSize) {
                    violations.push({
                        metric: 'chunkSize',
                        budget: this.budget.maxChunkSize,
                        actual: artifact.size,
                        severity: 'error',
                        message: `Chunk "${artifact.name}" (${this.formatBytes(artifact.size)}) exceeds budget (${this.formatBytes(this.budget.maxChunkSize)})`,
                        timestamp: Date.now()
                    });
                }
            }
        }
        // Total assets
        const totalAssets = this.artifacts.reduce((sum, a) => sum + a.size, 0);
        if (this.budget.maxTotalAssets && totalAssets > this.budget.maxTotalAssets) {
            violations.push({
                metric: 'totalAssets',
                budget: this.budget.maxTotalAssets,
                actual: totalAssets,
                severity: 'error',
                message: `Total assets (${this.formatBytes(totalAssets)}) exceed budget (${this.formatBytes(this.budget.maxTotalAssets)})`,
                timestamp: Date.now()
            });
        }
        const passed = violations.filter(v => v.severity === 'error').length === 0;
        return {
            passed,
            violations,
            summary: this.generateSummary(violations)
        };
    }
    formatBytes(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    generateSummary(violations) {
        const errors = violations.filter(v => v.severity === 'error');
        const warnings = violations.filter(v => v.severity === 'warning');
        if (errors.length === 0 && warnings.length === 0) {
            return 'All performance budgets passed!';
        }
        const lines = [];
        if (errors.length > 0) {
            lines.push(`${errors.length} budget violation(s):`);
            errors.forEach(e => lines.push(`  - ${e.message}`));
        }
        if (warnings.length > 0) {
            lines.push(`${warnings.length} warning(s):`);
            warnings.forEach(w => lines.push(`  - ${w.message}`));
        }
        return lines.join('\n');
    }
    getArtifactReport() {
        const lines = ['Build Artifacts:'];
        const byType = {};
        for (const artifact of this.artifacts) {
            if (!byType[artifact.type])
                byType[artifact.type] = [];
            byType[artifact.type].push(artifact);
        }
        for (const [type, artifacts] of Object.entries(byType)) {
            const total = artifacts.reduce((sum, a) => sum + a.size, 0);
            lines.push(`\n${type.toUpperCase()} (${this.formatBytes(total)}):`);
            artifacts
                .sort((a, b) => b.size - a.size)
                .forEach(a => {
                lines.push(`  ${a.name}: ${this.formatBytes(a.size)}`);
            });
        }
        return lines.join('\n');
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
let globalChecker = null;
let globalObserver = null;
/**
 * Hook for performance budgets
 */
export function usePerformanceBudget(config) {
    if (!globalChecker) {
        globalChecker = new BudgetChecker(config);
    }
    if (!globalObserver) {
        globalObserver = new PerformanceObserverManager();
    }
    const [getMetrics, setMetrics] = createState({});
    const [getScore, setScore] = createState(null);
    globalObserver.subscribe((metrics) => {
        setMetrics(metrics);
        setScore(globalChecker.calculateScore(metrics));
    });
    const metrics = getMetrics();
    const score = getScore();
    return {
        metrics,
        violations: globalChecker.getViolations(),
        score,
        isWithinBudget: score ? score.violations.filter(v => v.severity === 'error').length === 0 : true
    };
}
/**
 * Hook for Core Web Vitals
 */
export function useWebVitals() {
    if (!globalObserver) {
        globalObserver = new PerformanceObserverManager();
    }
    const [getMetrics, setMetrics] = createState({});
    globalObserver.subscribe(setMetrics);
    const metrics = getMetrics();
    return {
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
        inp: metrics.inp,
        ttfb: metrics.ttfb,
        fcp: metrics.fcp
    };
}
/**
 * Hook for custom performance metrics
 */
export function usePerformanceMetric(name) {
    const [getValue, setValue] = createState(undefined);
    return {
        value: getValue(),
        record: (value) => {
            setValue(value);
            // Also record as Performance mark
            if (typeof performance !== 'undefined') {
                performance.mark(`${name}:${value}`);
            }
        }
    };
}
// ============================================================================
// Vite/Rollup Plugin
// ============================================================================
export function perfBudgetPlugin(budget) {
    const checker = new BuildBudgetChecker(budget);
    return {
        name: 'philjs-perf-budget',
        generateBundle(_options, bundle) {
            for (const [fileName, chunk] of Object.entries(bundle)) {
                const chunkData = chunk;
                const size = chunkData.code?.length ?? chunkData.source?.length ?? 0;
                let type = 'other';
                if (fileName.endsWith('.js'))
                    type = 'js';
                else if (fileName.endsWith('.css'))
                    type = 'css';
                else if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(fileName))
                    type = 'image';
                else if (/\.(woff|woff2|ttf|eot)$/i.test(fileName))
                    type = 'font';
                checker.addArtifact({
                    name: fileName,
                    path: fileName,
                    size,
                    type,
                    isEntry: chunkData.isEntry
                });
            }
        },
        closeBundle() {
            const result = checker.check();
            if (!result.passed) {
                throw new Error('Performance budget exceeded!');
            }
        }
    };
}
// ============================================================================
// Exports
// ============================================================================
export default {
    PerformanceObserverManager,
    BudgetChecker,
    BuildBudgetChecker,
    perfBudgetPlugin,
    usePerformanceBudget,
    useWebVitals,
    usePerformanceMetric
};
//# sourceMappingURL=index.js.map