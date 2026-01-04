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
import { signal, effect } from './signals.js';
// ============================================================================
// Performance Tracker
// ============================================================================
export class PerformanceTracker {
    marks = new Map();
    budgets = new Map();
    components = new Map();
    apiCalls = [];
    resources = [];
    isTracking = signal(false);
    /**
     * Start performance mark
     */
    mark(name, metadata) {
        const mark = {
            name,
            timestamp: performance.now(),
            ...(metadata !== undefined && { metadata }),
        };
        this.marks.set(name, mark);
        // Use native Performance API if available
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(name);
        }
    }
    /**
     * Measure duration between two marks
     */
    measure(name, startMark, endMark) {
        const start = this.marks.get(startMark);
        if (!start) {
            throw new Error(`Start mark "${startMark}" not found`);
        }
        const endTime = endMark
            ? this.marks.get(endMark)?.timestamp || performance.now()
            : performance.now();
        const duration = endTime - start.timestamp;
        // Store measurement
        this.marks.set(name, {
            name,
            timestamp: start.timestamp,
            duration,
        });
        // Use native Performance API
        if (typeof performance !== 'undefined' && performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
            }
            catch (error) {
                // Ignore errors from native API
            }
        }
        // Check budget
        const budget = this.budgets.get(name);
        if (budget && duration > budget.maxDuration) {
            const message = `Performance budget exceeded for "${name}": ${duration.toFixed(2)}ms > ${budget.maxDuration}ms`;
            if (budget.error) {
                console.error(message);
            }
            else if (budget.warn) {
                console.warn(message);
            }
        }
        return duration;
    }
    /**
     * Clear mark
     */
    clearMark(name) {
        this.marks.delete(name);
        if (typeof performance !== 'undefined' && performance.clearMarks) {
            performance.clearMarks(name);
        }
    }
    /**
     * Clear all marks
     */
    clearMarks() {
        this.marks.clear();
        if (typeof performance !== 'undefined' && performance.clearMarks) {
            performance.clearMarks();
        }
    }
    /**
     * Set performance budget
     */
    setBudget(name, maxDuration, options = {}) {
        this.budgets.set(name, {
            name,
            maxDuration,
            warn: options.warn ?? true,
            error: options.error ?? false,
        });
    }
    /**
     * Track component render
     */
    trackComponent(componentName, renderTime) {
        const existing = this.components.get(componentName);
        if (existing) {
            existing.updateTime = renderTime;
            existing.renderCount++;
            existing.lastRender = Date.now();
        }
        else {
            this.components.set(componentName, {
                componentName,
                renderTime,
                updateTime: renderTime,
                renderCount: 1,
                lastRender: Date.now(),
            });
        }
    }
    /**
     * Track API call
     */
    trackAPI(endpoint, method, duration, status, error) {
        this.apiCalls.push({
            endpoint,
            method,
            duration,
            status,
            timestamp: Date.now(),
            ...(error !== undefined ? { error } : {}),
        });
        // Keep only last 100 calls
        if (this.apiCalls.length > 100) {
            this.apiCalls.shift();
        }
    }
    /**
     * Track resource loading
     */
    trackResource(url, type, size, duration, cached) {
        this.resources.push({
            url,
            type,
            size,
            duration,
            cached,
        });
    }
    /**
     * Get component performance
     */
    getComponentPerformance(componentName) {
        return this.components.get(componentName);
    }
    /**
     * Get all component performance
     */
    getAllComponentPerformance() {
        return Array.from(this.components.values());
    }
    /**
     * Get API performance
     */
    getAPIPerformance() {
        return [...this.apiCalls];
    }
    /**
     * Get resource performance
     */
    getResourcePerformance() {
        return [...this.resources];
    }
    /**
     * Get performance snapshot
     */
    getSnapshot() {
        const snapshot = {
            timestamp: Date.now(),
            components: this.getAllComponentPerformance(),
            api: this.getAPIPerformance(),
            resources: this.getResourcePerformance(),
            marks: Array.from(this.marks.values()),
        };
        // Add memory info if available
        if (typeof performance !== 'undefined' && performance.memory) {
            const memory = performance.memory;
            snapshot.memory = {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
            };
        }
        return snapshot;
    }
    /**
     * Start tracking
     */
    start() {
        this.isTracking.set(true);
    }
    /**
     * Stop tracking
     */
    stop() {
        this.isTracking.set(false);
    }
    /**
     * Clear all data
     */
    clear() {
        this.marks.clear();
        this.components.clear();
        this.apiCalls.length = 0;
        this.resources.length = 0;
    }
}
// ============================================================================
// Hooks
// ============================================================================
let globalTracker = null;
/**
 * Get or create global performance tracker
 */
function getTracker() {
    if (!globalTracker) {
        globalTracker = new PerformanceTracker();
    }
    return globalTracker;
}
/**
 * Track component render performance
 */
export function usePerformance(componentName) {
    const tracker = getTracker();
    const perfSignal = signal(null);
    let startTime = 0;
    const startRender = () => {
        startTime = globalThis.performance.now();
    };
    const endRender = () => {
        const duration = globalThis.performance.now() - startTime;
        tracker.trackComponent(componentName, duration);
        perfSignal.set(tracker.getComponentPerformance(componentName) || null);
    };
    return {
        startRender,
        endRender,
        performance: perfSignal,
    };
}
/**
 * Track API call performance
 */
export function useAPIPerformance() {
    const tracker = getTracker();
    return {
        track: async (endpoint, fetchFn, method = 'GET') => {
            const startTime = performance.now();
            try {
                const result = await fetchFn();
                const duration = performance.now() - startTime;
                tracker.trackAPI(endpoint, method, duration, 200);
                return result;
            }
            catch (error) {
                const duration = performance.now() - startTime;
                tracker.trackAPI(endpoint, method, duration, 500, error);
                throw error;
            }
        },
        getMetrics: () => tracker.getAPIPerformance(),
    };
}
/**
 * Track custom performance
 */
export function useCustomPerformance(name) {
    const tracker = getTracker();
    return {
        start: (metadata) => {
            tracker.mark(`${name}:start`, metadata);
        },
        end: () => {
            tracker.mark(`${name}:end`);
            return tracker.measure(name, `${name}:start`, `${name}:end`);
        },
        measure: (startMark, endMark) => {
            return tracker.measure(name, startMark, endMark);
        },
    };
}
/**
 * Set performance budget
 */
export function usePerformanceBudget(name, maxDuration, options) {
    const tracker = getTracker();
    tracker.setBudget(name, maxDuration, options);
}
/**
 * Get performance snapshot
 */
export function usePerformanceSnapshot() {
    const tracker = getTracker();
    const snapshot = signal(tracker.getSnapshot());
    // Update snapshot every second
    if (typeof window !== 'undefined') {
        setInterval(() => {
            snapshot.set(tracker.getSnapshot());
        }, 1000);
    }
    return snapshot;
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Measure function execution time
 */
export async function measureAsync(name, fn) {
    const tracker = getTracker();
    tracker.mark(`${name}:start`);
    try {
        const result = await fn();
        const duration = tracker.measure(name, `${name}:start`);
        return { result, duration };
    }
    catch (error) {
        tracker.measure(name, `${name}:start`);
        throw error;
    }
}
/**
 * Measure synchronous function
 */
export function measureSync(name, fn) {
    const tracker = getTracker();
    tracker.mark(`${name}:start`);
    try {
        const result = fn();
        const duration = tracker.measure(name, `${name}:start`);
        return { result, duration };
    }
    catch (error) {
        tracker.measure(name, `${name}:start`);
        throw error;
    }
}
/**
 * Monitor resource loading
 */
export function monitorResources() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
        return;
    }
    const tracker = getTracker();
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            const resourceEntry = entry;
            tracker.trackResource(resourceEntry.name, resourceEntry.initiatorType, resourceEntry.transferSize, resourceEntry.duration, resourceEntry.transferSize === 0);
        }
    });
    observer.observe({ entryTypes: ['resource'] });
}
/**
 * Export performance data
 */
export function exportPerformanceData() {
    const tracker = getTracker();
    const snapshot = tracker.getSnapshot();
    return JSON.stringify(snapshot, null, 2);
}
/**
 * Import performance data
 */
export function importPerformanceData(data) {
    const snapshot = JSON.parse(data);
    const tracker = getTracker();
    // This is a simplified version - in production would restore full state
    console.log('Imported performance snapshot:', snapshot);
}
/**
 * Get global performance tracker
 */
export function getPerformanceTracker() {
    return getTracker();
}
/**
 * Create performance report
 */
export function createPerformanceReport() {
    const tracker = getTracker();
    const components = tracker.getAllComponentPerformance();
    const apis = tracker.getAPIPerformance();
    const resources = tracker.getResourcePerformance();
    const avgRenderTime = components.length > 0
        ? components.reduce((sum, c) => sum + c.renderTime, 0) / components.length
        : 0;
    const avgAPITime = apis.length > 0
        ? apis.reduce((sum, a) => sum + a.duration, 0) / apis.length
        : 0;
    const totalResourceSize = resources.reduce((sum, r) => sum + r.size, 0);
    return {
        summary: {
            totalComponents: components.length,
            avgRenderTime,
            totalAPICalls: apis.length,
            avgAPITime,
            totalResources: resources.length,
            totalResourceSize,
        },
        slowestComponents: components
            .sort((a, b) => b.renderTime - a.renderTime)
            .slice(0, 10),
        slowestAPIs: apis
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10),
        largestResources: resources
            .sort((a, b) => b.size - a.size)
            .slice(0, 10),
    };
}
//# sourceMappingURL=performance-tracking.js.map