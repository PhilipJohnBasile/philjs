/**
 * PhilJS Native - Performance Optimizations
 *
 * Performance utilities including virtualization, memoization,
 * lazy loading, and native performance monitoring.
 */
import { type Signal } from 'philjs-core';
/**
 * Performance mark
 */
export interface PerformanceMark {
    name: string;
    startTime: number;
    entryType: 'mark';
}
/**
 * Performance measure
 */
export interface PerformanceMeasure {
    name: string;
    startTime: number;
    duration: number;
    entryType: 'measure';
}
/**
 * Frame timing info
 */
export interface FrameTiming {
    timestamp: number;
    fps: number;
    frameTime: number;
    jank: boolean;
}
/**
 * Memory info
 */
export interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}
/**
 * Virtualization config
 */
export interface VirtualizationConfig {
    itemHeight: number | ((index: number) => number);
    itemCount: number;
    overscan?: number;
    containerHeight: number;
    getItemKey?: (index: number) => string;
}
/**
 * Virtualized range
 */
export interface VirtualizedRange {
    startIndex: number;
    endIndex: number;
    visibleItems: number[];
    offsetTop: number;
    totalHeight: number;
}
/**
 * Create a performance mark
 */
export declare function mark(name: string): PerformanceMark;
/**
 * Create a performance measure between two marks
 */
export declare function measure(name: string, startMark: string, endMark?: string): PerformanceMeasure | null;
/**
 * Get all measures
 */
export declare function getMeasures(): PerformanceMeasure[];
/**
 * Clear all marks and measures
 */
export declare function clearPerformanceData(): void;
/**
 * Start frame timing monitor
 */
export declare function startFrameMonitor(): () => void;
/**
 * Get frame statistics
 */
export declare function getFrameStats(): {
    averageFps: number;
    minFps: number;
    maxFps: number;
    jankFrames: number;
    totalFrames: number;
};
/**
 * Get memory info
 */
export declare function getMemoryInfo(): MemoryInfo | null;
/**
 * Memory pressure signal
 */
export declare const memoryPressure: Signal<'normal' | 'moderate' | 'critical'>;
/**
 * Start memory monitoring
 */
export declare function startMemoryMonitor(interval?: number): () => void;
/**
 * Calculate virtualized range for a list
 */
export declare function calculateVirtualizedRange(config: VirtualizationConfig, scrollTop: number): VirtualizedRange;
/**
 * Create a virtualized list helper
 */
export declare function createVirtualizedList(config: VirtualizationConfig): {
    range: Signal<VirtualizedRange>;
    updateScroll: (scrollTop: number) => void;
    getItemStyle: (index: number) => {
        position: string;
        top: number;
        height: number;
    };
};
/**
 * Create a memoized function with LRU cache
 */
export declare function memoize<T extends (...args: any[]) => any>(fn: T, options?: {
    maxSize?: number;
    keyFn?: (...args: Parameters<T>) => string;
    ttl?: number;
}): T;
/**
 * Create a debounced function
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T & {
    cancel: () => void;
};
/**
 * Create a throttled function
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T & {
    cancel: () => void;
};
/**
 * Lazy loaded module
 */
export interface LazyModule<T> {
    load: () => Promise<T>;
    isLoaded: () => boolean;
    get: () => T | undefined;
}
/**
 * Create a lazy-loaded module
 */
export declare function lazy<T>(loader: () => Promise<T>): LazyModule<T>;
/**
 * Create a preloaded module (starts loading immediately)
 */
export declare function preload<T>(loader: () => Promise<T>): LazyModule<T>;
/**
 * Start a batch of updates
 */
export declare function startBatch(): void;
/**
 * End a batch and execute all updates
 */
export declare function endBatch(): void;
/**
 * Schedule an update (batched if in batch mode)
 */
export declare function scheduleUpdate(update: () => void): void;
/**
 * Run updates in next animation frame
 */
export declare function scheduleAnimationFrame(callback: () => void): number;
/**
 * Run updates in next idle period
 */
export declare function scheduleIdleCallback(callback: () => void, options?: {
    timeout?: number;
}): number;
/**
 * Image loading priority
 */
export type ImagePriority = 'high' | 'low' | 'auto';
/**
 * Preload an image
 */
export declare function preloadImage(src: string, priority?: ImagePriority): Promise<HTMLImageElement>;
/**
 * Preload multiple images
 */
export declare function preloadImages(sources: string[], concurrency?: number): Promise<HTMLImageElement[]>;
/**
 * Run callback after current interaction is complete
 */
export declare function runAfterInteractions(callback: () => void): {
    cancel: () => void;
};
/**
 * Create an interaction handle
 */
export declare function createInteractionHandle(): {
    done: () => void;
};
export declare const Performance: {
    mark: typeof mark;
    measure: typeof measure;
    getMeasures: typeof getMeasures;
    clearPerformanceData: typeof clearPerformanceData;
    startFrameMonitor: typeof startFrameMonitor;
    getFrameStats: typeof getFrameStats;
    getMemoryInfo: typeof getMemoryInfo;
    memoryPressure: Signal<"normal" | "critical" | "moderate">;
    startMemoryMonitor: typeof startMemoryMonitor;
    calculateVirtualizedRange: typeof calculateVirtualizedRange;
    createVirtualizedList: typeof createVirtualizedList;
    memoize: typeof memoize;
    debounce: typeof debounce;
    throttle: typeof throttle;
    lazy: typeof lazy;
    preload: typeof preload;
    startBatch: typeof startBatch;
    endBatch: typeof endBatch;
    scheduleUpdate: typeof scheduleUpdate;
    scheduleAnimationFrame: typeof scheduleAnimationFrame;
    scheduleIdleCallback: typeof scheduleIdleCallback;
    preloadImage: typeof preloadImage;
    preloadImages: typeof preloadImages;
    runAfterInteractions: typeof runAfterInteractions;
    createInteractionHandle: typeof createInteractionHandle;
};
export default Performance;
//# sourceMappingURL=index.d.ts.map