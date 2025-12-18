/**
 * Performance Timing Utilities
 *
 * Provides performance measurement and monitoring tools:
 * - Render timing and profiling
 * - Component update tracking
 * - Memory usage monitoring
 * - Performance marks and measures
 * - FPS and frame timing
 */
// ============================================================================
// Performance Monitor
// ============================================================================
export class PerformanceMonitor {
    marks = [];
    measures = [];
    renderMetrics = new Map();
    frameMetrics = [];
    memoryMetrics = [];
    warnings = [];
    thresholds;
    maxHistorySize = 100;
    isMonitoring = false;
    frameStartTime = 0;
    frameCount = 0;
    lastFPSCheck = 0;
    constructor(thresholds = {}) {
        this.thresholds = {
            slowRender: thresholds.slowRender ?? 16, // 60fps
            slowMeasure: thresholds.slowMeasure ?? 50,
            lowFPS: thresholds.lowFPS ?? 30,
            highMemory: thresholds.highMemory ?? 50 * 1024 * 1024, // 50MB
        };
    }
    /**
     * Create a performance mark
     */
    mark(name, metadata) {
        const mark = {
            name,
            timestamp: performance.now(),
            metadata,
        };
        this.marks.push(mark);
        // Use native Performance API
        if (typeof performance !== "undefined" && performance.mark) {
            performance.mark(name);
        }
        this.maintainHistorySize();
    }
    /**
     * Create a performance measure between two marks
     */
    measure(name, startMark, endMark, metadata) {
        const start = this.marks.find((m) => m.name === startMark);
        if (!start) {
            console.warn(`Start mark "${startMark}" not found`);
            return null;
        }
        let end;
        if (endMark) {
            end = this.marks.find((m) => m.name === endMark);
            if (!end) {
                console.warn(`End mark "${endMark}" not found`);
                return null;
            }
        }
        else {
            // Use current time as end
            end = {
                name: "__current__",
                timestamp: performance.now(),
            };
        }
        const measure = {
            name,
            startMark,
            endMark: end.name,
            duration: end.timestamp - start.timestamp,
            timestamp: Date.now(),
            metadata,
        };
        this.measures.push(measure);
        // Use native Performance API
        if (typeof performance !== "undefined" && performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
            }
            catch (e) {
                // Silently fail if marks not found in native API
            }
        }
        // Check threshold
        if (measure.duration > this.thresholds.slowMeasure) {
            this.addWarning({
                type: "slow-measure",
                message: `Slow measure: ${name} took ${measure.duration.toFixed(2)}ms`,
                value: measure.duration,
                threshold: this.thresholds.slowMeasure,
                timestamp: Date.now(),
                metadata: { measure },
            });
        }
        this.maintainHistorySize();
        return measure;
    }
    /**
     * Record a component render
     */
    recordRender(componentName, duration) {
        let metrics = this.renderMetrics.get(componentName);
        if (!metrics) {
            metrics = {
                componentName,
                renderCount: 0,
                totalTime: 0,
                averageTime: 0,
                minTime: Infinity,
                maxTime: -Infinity,
                lastRenderTime: 0,
                timestamp: Date.now(),
            };
            this.renderMetrics.set(componentName, metrics);
        }
        metrics.renderCount++;
        metrics.totalTime += duration;
        metrics.averageTime = metrics.totalTime / metrics.renderCount;
        metrics.minTime = Math.min(metrics.minTime, duration);
        metrics.maxTime = Math.max(metrics.maxTime, duration);
        metrics.lastRenderTime = duration;
        metrics.timestamp = Date.now();
        // Check threshold
        if (duration > this.thresholds.slowRender) {
            this.addWarning({
                type: "slow-render",
                message: `Slow render: ${componentName} took ${duration.toFixed(2)}ms`,
                value: duration,
                threshold: this.thresholds.slowRender,
                timestamp: Date.now(),
                metadata: { componentName },
            });
        }
    }
    /**
     * Start monitoring performance
     */
    startMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.frameStartTime = performance.now();
        this.lastFPSCheck = Date.now();
        // Monitor frames
        this.monitorFrames();
        // Monitor memory (if available)
        if (this.isMemoryAPIAvailable()) {
            this.monitorMemory();
        }
    }
    /**
     * Stop monitoring performance
     */
    stopMonitoring() {
        this.isMonitoring = false;
    }
    /**
     * Get all performance marks
     */
    getMarks() {
        return this.marks.slice();
    }
    /**
     * Get all performance measures
     */
    getMeasures() {
        return this.measures.slice();
    }
    /**
     * Get render metrics for all components
     */
    getRenderMetrics() {
        return Array.from(this.renderMetrics.values());
    }
    /**
     * Get render metrics for a specific component
     */
    getComponentMetrics(componentName) {
        return this.renderMetrics.get(componentName);
    }
    /**
     * Get frame metrics
     */
    getFrameMetrics() {
        return this.frameMetrics.slice();
    }
    /**
     * Get memory metrics
     */
    getMemoryMetrics() {
        return this.memoryMetrics.slice();
    }
    /**
     * Get performance warnings
     */
    getWarnings() {
        return this.warnings.slice();
    }
    /**
     * Clear all performance data
     */
    clear() {
        this.marks = [];
        this.measures = [];
        this.renderMetrics.clear();
        this.frameMetrics = [];
        this.memoryMetrics = [];
        this.warnings = [];
        this.frameCount = 0;
        // Clear native Performance API
        if (typeof performance !== "undefined") {
            if (performance.clearMarks)
                performance.clearMarks();
            if (performance.clearMeasures)
                performance.clearMeasures();
        }
    }
    /**
     * Generate performance report
     */
    generateReport() {
        const renders = this.getRenderMetrics();
        const measures = this.getMeasures();
        const frames = this.getFrameMetrics();
        const slowestRender = renders.length > 0
            ? renders.reduce((prev, curr) => curr.maxTime > prev.maxTime ? curr : prev)
            : null;
        const slowestMeasure = measures.length > 0
            ? measures.reduce((prev, curr) => curr.duration > prev.duration ? curr : prev)
            : null;
        const averageFPS = frames.length > 0
            ? frames.reduce((sum, f) => sum + f.fps, 0) / frames.length
            : 0;
        return {
            marks: this.getMarks(),
            measures,
            renders,
            frames,
            memory: this.getMemoryMetrics(),
            summary: {
                totalMarks: this.marks.length,
                totalMeasures: measures.length,
                totalRenders: renders.reduce((sum, r) => sum + r.renderCount, 0),
                averageFPS,
                slowestRender,
                slowestMeasure,
            },
        };
    }
    /**
     * Export performance data as JSON
     */
    export() {
        return JSON.stringify({
            report: this.generateReport(),
            warnings: this.getWarnings(),
            thresholds: this.thresholds,
            exportedAt: new Date().toISOString(),
        });
    }
    // Private methods
    monitorFrames() {
        if (!this.isMonitoring)
            return;
        requestAnimationFrame(() => {
            const now = performance.now();
            const frameTime = now - this.frameStartTime;
            this.frameStartTime = now;
            this.frameCount++;
            // Calculate FPS every second
            const timeSinceLastCheck = Date.now() - this.lastFPSCheck;
            if (timeSinceLastCheck >= 1000) {
                const fps = Math.round((this.frameCount * 1000) / timeSinceLastCheck);
                const metrics = {
                    fps,
                    frameTime,
                    droppedFrames: Math.max(0, 60 - fps),
                    timestamp: Date.now(),
                };
                this.frameMetrics.push(metrics);
                this.maintainHistorySize();
                // Check threshold
                if (fps < this.thresholds.lowFPS) {
                    this.addWarning({
                        type: "low-fps",
                        message: `Low FPS detected: ${fps} fps`,
                        value: fps,
                        threshold: this.thresholds.lowFPS,
                        timestamp: Date.now(),
                    });
                }
                this.frameCount = 0;
                this.lastFPSCheck = Date.now();
            }
            this.monitorFrames();
        });
    }
    monitorMemory() {
        if (!this.isMonitoring)
            return;
        const checkMemory = () => {
            if (!this.isMonitoring)
                return;
            const memory = performance.memory;
            if (memory) {
                const metrics = {
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize,
                    jsHeapSizeLimit: memory.jsHeapSizeLimit,
                    timestamp: Date.now(),
                };
                this.memoryMetrics.push(metrics);
                this.maintainHistorySize();
                // Check threshold
                if (memory.usedJSHeapSize > this.thresholds.highMemory) {
                    this.addWarning({
                        type: "high-memory",
                        message: `High memory usage: ${this.formatBytes(memory.usedJSHeapSize)}`,
                        value: memory.usedJSHeapSize,
                        threshold: this.thresholds.highMemory,
                        timestamp: Date.now(),
                    });
                }
            }
            setTimeout(checkMemory, 5000); // Check every 5 seconds
        };
        checkMemory();
    }
    isMemoryAPIAvailable() {
        return (typeof performance !== "undefined" &&
            performance.memory !== undefined);
    }
    maintainHistorySize() {
        if (this.marks.length > this.maxHistorySize) {
            this.marks = this.marks.slice(-this.maxHistorySize);
        }
        if (this.measures.length > this.maxHistorySize) {
            this.measures = this.measures.slice(-this.maxHistorySize);
        }
        if (this.frameMetrics.length > this.maxHistorySize) {
            this.frameMetrics = this.frameMetrics.slice(-this.maxHistorySize);
        }
        if (this.memoryMetrics.length > this.maxHistorySize) {
            this.memoryMetrics = this.memoryMetrics.slice(-this.maxHistorySize);
        }
        if (this.warnings.length > this.maxHistorySize) {
            this.warnings = this.warnings.slice(-this.maxHistorySize);
        }
    }
    addWarning(warning) {
        this.warnings.push(warning);
        this.maintainHistorySize();
    }
    formatBytes(bytes) {
        const units = ["B", "KB", "MB", "GB"];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}
// ============================================================================
// Global Instance & Utilities
// ============================================================================
let globalMonitor = null;
export function initPerformanceMonitor(thresholds) {
    if (!globalMonitor) {
        globalMonitor = new PerformanceMonitor(thresholds);
    }
    return globalMonitor;
}
export function getPerformanceMonitor() {
    return globalMonitor;
}
/**
 * Measure execution time of a function
 */
export async function measureExecution(name, fn) {
    const monitor = getPerformanceMonitor() || initPerformanceMonitor();
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    monitor.mark(startMark);
    try {
        const result = await Promise.resolve(fn());
        monitor.mark(endMark);
        monitor.measure(name, startMark, endMark);
        return result;
    }
    catch (error) {
        monitor.mark(endMark);
        monitor.measure(name, startMark, endMark, { error: true });
        throw error;
    }
}
/**
 * Create a render profiler for a component
 */
export function profileRender(componentName) {
    const monitor = getPerformanceMonitor() || initPerformanceMonitor();
    return {
        start: () => {
            const mark = `render-${componentName}-${Date.now()}`;
            monitor.mark(mark);
            return mark;
        },
        end: (startMark) => {
            const endMark = `${startMark}-end`;
            monitor.mark(endMark);
            const measure = monitor.measure(`render-${componentName}`, startMark, endMark);
            if (measure) {
                monitor.recordRender(componentName, measure.duration);
            }
        },
    };
}
/**
 * Format duration for display
 */
export function formatDuration(ms) {
    if (ms < 1) {
        return `${(ms * 1000).toFixed(2)}μs`;
    }
    else if (ms < 1000) {
        return `${ms.toFixed(2)}ms`;
    }
    else {
        return `${(ms / 1000).toFixed(2)}s`;
    }
}
/**
 * Get performance insights
 */
export function getPerformanceInsights() {
    const monitor = getPerformanceMonitor();
    if (!monitor)
        return [];
    const insights = [];
    const report = monitor.generateReport();
    // FPS insights
    if (report.summary.averageFPS < 30) {
        insights.push(`Low average FPS: ${report.summary.averageFPS.toFixed(1)}`);
    }
    // Render insights
    if (report.summary.slowestRender) {
        const r = report.summary.slowestRender;
        insights.push(`Slowest component: ${r.componentName} (${r.maxTime.toFixed(2)}ms)`);
    }
    // Measure insights
    if (report.summary.slowestMeasure) {
        const m = report.summary.slowestMeasure;
        insights.push(`Slowest operation: ${m.name} (${m.duration.toFixed(2)}ms)`);
    }
    return insights;
}
//# sourceMappingURL=performance.js.map