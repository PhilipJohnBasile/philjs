/**
 * Performance Tracking Hooks
 *
 * Comprehensive performance monitoring utilities:
 * - Component render timing
 * - API call performance
 * - Resource loading tracking
 * - Custom performance marks
 * - Performance budgets
 * - Real-time monitoring dashboard
 */
import { type Signal } from './signals.js';
export interface PerformanceMark {
    name: string;
    timestamp: number;
    duration?: number;
    metadata?: Record<string, any>;
}
export interface RuntimeBudget {
    name: string;
    maxDuration: number;
    warn?: boolean;
    error?: boolean;
}
export interface ComponentPerformance {
    componentName: string;
    renderTime: number;
    updateTime: number;
    renderCount: number;
    lastRender: number;
}
export interface APIPerformance {
    endpoint: string;
    method: string;
    duration: number;
    status: number;
    timestamp: number;
    error?: Error;
}
export interface ResourcePerformance {
    url: string;
    type: string;
    size: number;
    duration: number;
    cached: boolean;
}
export interface PerformanceSnapshot {
    timestamp: number;
    components: ComponentPerformance[];
    api: APIPerformance[];
    resources: ResourcePerformance[];
    marks: PerformanceMark[];
    memory?: {
        used: number;
        total: number;
        limit: number;
    };
}
export declare class PerformanceTracker {
    private marks;
    private budgets;
    private components;
    private apiCalls;
    private resources;
    isTracking: Signal<boolean>;
    /**
     * Start performance mark
     */
    mark(name: string, metadata?: Record<string, any>): void;
    /**
     * Measure duration between two marks
     */
    measure(name: string, startMark: string, endMark?: string): number;
    /**
     * Clear mark
     */
    clearMark(name: string): void;
    /**
     * Clear all marks
     */
    clearMarks(): void;
    /**
     * Set performance budget
     */
    setBudget(name: string, maxDuration: number, options?: {
        warn?: boolean;
        error?: boolean;
    }): void;
    /**
     * Track component render
     */
    trackComponent(componentName: string, renderTime: number): void;
    /**
     * Track API call
     */
    trackAPI(endpoint: string, method: string, duration: number, status: number, error?: Error): void;
    /**
     * Track resource loading
     */
    trackResource(url: string, type: string, size: number, duration: number, cached: boolean): void;
    /**
     * Get component performance
     */
    getComponentPerformance(componentName: string): ComponentPerformance | undefined;
    /**
     * Get all component performance
     */
    getAllComponentPerformance(): ComponentPerformance[];
    /**
     * Get API performance
     */
    getAPIPerformance(): APIPerformance[];
    /**
     * Get resource performance
     */
    getResourcePerformance(): ResourcePerformance[];
    /**
     * Get performance snapshot
     */
    getSnapshot(): PerformanceSnapshot;
    /**
     * Start tracking
     */
    start(): void;
    /**
     * Stop tracking
     */
    stop(): void;
    /**
     * Clear all data
     */
    clear(): void;
}
/**
 * Track component render performance
 */
export declare function usePerformance(componentName: string): {
    startRender: () => void;
    endRender: () => void;
    performance: Signal<ComponentPerformance | null>;
};
/**
 * Track API call performance
 */
export declare function useAPIPerformance(): {
    track: <T>(endpoint: string, fetchFn: () => Promise<T>, method?: string) => Promise<T>;
    getMetrics: () => APIPerformance[];
};
/**
 * Track custom performance
 */
export declare function useCustomPerformance(name: string): {
    start: (metadata?: Record<string, any>) => void;
    end: () => number;
    measure: (startMark: string, endMark?: string) => number;
};
/**
 * Set performance budget
 */
export declare function usePerformanceBudget(name: string, maxDuration: number, options?: {
    warn?: boolean;
    error?: boolean;
}): void;
/**
 * Get performance snapshot
 */
export declare function usePerformanceSnapshot(): Signal<PerformanceSnapshot>;
/**
 * Measure function execution time
 */
export declare function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<{
    result: T;
    duration: number;
}>;
/**
 * Measure synchronous function
 */
export declare function measureSync<T>(name: string, fn: () => T): {
    result: T;
    duration: number;
};
/**
 * Monitor resource loading
 */
export declare function monitorResources(): void;
/**
 * Export performance data
 */
export declare function exportPerformanceData(): string;
/**
 * Import performance data
 */
export declare function importPerformanceData(data: string): void;
/**
 * Get global performance tracker
 */
export declare function getPerformanceTracker(): PerformanceTracker;
/**
 * Create performance report
 */
export declare function createPerformanceReport(): {
    summary: {
        totalComponents: number;
        avgRenderTime: number;
        totalAPICalls: number;
        avgAPITime: number;
        totalResources: number;
        totalResourceSize: number;
    };
    slowestComponents: ComponentPerformance[];
    slowestAPIs: APIPerformance[];
    largestResources: ResourcePerformance[];
};
//# sourceMappingURL=performance-tracking.d.ts.map