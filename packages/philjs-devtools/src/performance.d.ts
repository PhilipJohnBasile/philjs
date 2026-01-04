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
export type PerformanceMark = {
    name: string;
    timestamp: number;
    metadata?: Record<string, any>;
};
export type PerformanceMeasure = {
    name: string;
    startMark: string;
    endMark: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, any>;
};
export type RenderMetrics = {
    componentName: string;
    renderCount: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    lastRenderTime: number;
    timestamp: number;
};
export type FrameMetrics = {
    fps: number;
    frameTime: number;
    droppedFrames: number;
    timestamp: number;
};
export type MemoryMetrics = {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    timestamp: number;
};
export type PerformanceReport = {
    marks: PerformanceMark[];
    measures: PerformanceMeasure[];
    renders: RenderMetrics[];
    frames: FrameMetrics[];
    memory: MemoryMetrics[];
    summary: {
        totalMarks: number;
        totalMeasures: number;
        totalRenders: number;
        averageFPS: number;
        slowestRender: RenderMetrics | null;
        slowestMeasure: PerformanceMeasure | null;
    };
};
export type PerformanceThresholds = {
    slowRender?: number;
    slowMeasure?: number;
    lowFPS?: number;
    highMemory?: number;
};
export type PerformanceWarning = {
    type: "slow-render" | "slow-measure" | "low-fps" | "high-memory";
    message: string;
    value: number;
    threshold: number;
    timestamp: number;
    metadata?: Record<string, any>;
};
export declare class PerformanceMonitor {
    private marks;
    private measures;
    private renderMetrics;
    private frameMetrics;
    private memoryMetrics;
    private warnings;
    private thresholds;
    private maxHistorySize;
    private isMonitoring;
    private frameStartTime;
    private frameCount;
    private lastFPSCheck;
    constructor(thresholds?: PerformanceThresholds);
    /**
     * Create a performance mark
     */
    mark(name: string, metadata?: Record<string, any>): void;
    /**
     * Create a performance measure between two marks
     */
    measure(name: string, startMark: string, endMark?: string, metadata?: Record<string, any>): PerformanceMeasure | null;
    /**
     * Record a component render
     */
    recordRender(componentName: string, duration: number): void;
    /**
     * Start monitoring performance
     */
    startMonitoring(): void;
    /**
     * Stop monitoring performance
     */
    stopMonitoring(): void;
    /**
     * Get all performance marks
     */
    getMarks(): PerformanceMark[];
    /**
     * Get all performance measures
     */
    getMeasures(): PerformanceMeasure[];
    /**
     * Get render metrics for all components
     */
    getRenderMetrics(): RenderMetrics[];
    /**
     * Get render metrics for a specific component
     */
    getComponentMetrics(componentName: string): RenderMetrics | undefined;
    /**
     * Get frame metrics
     */
    getFrameMetrics(): FrameMetrics[];
    /**
     * Get memory metrics
     */
    getMemoryMetrics(): MemoryMetrics[];
    /**
     * Get performance warnings
     */
    getWarnings(): PerformanceWarning[];
    /**
     * Clear all performance data
     */
    clear(): void;
    /**
     * Generate performance report
     */
    generateReport(): PerformanceReport;
    /**
     * Export performance data as JSON
     */
    export(): string;
    private monitorFrames;
    private monitorMemory;
    private isMemoryAPIAvailable;
    private maintainHistorySize;
    private addWarning;
    private formatBytes;
}
export declare function initPerformanceMonitor(thresholds?: PerformanceThresholds): PerformanceMonitor;
export declare function getPerformanceMonitor(): PerformanceMonitor | null;
/**
 * Measure execution time of a function
 */
export declare function measureExecution<T>(name: string, fn: () => T | Promise<T>): Promise<T>;
/**
 * Create a render profiler for a component
 */
export declare function profileRender(componentName: string): {
    start: () => string;
    end: (startMark: string) => void;
};
/**
 * Format duration for display
 */
export declare function formatDuration(ms: number): string;
/**
 * Get performance insights
 */
export declare function getPerformanceInsights(): string[];
//# sourceMappingURL=performance.d.ts.map