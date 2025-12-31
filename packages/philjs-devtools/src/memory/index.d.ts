/**
 * Memory Profiler for PhilJS DevTools
 *
 * Tracks memory usage, detects leaks, and helps optimize memory consumption.
 */
export interface MemorySnapshot {
    id: string;
    timestamp: number;
    label?: string;
    heapSize: number;
    heapUsed: number;
    heapLimit: number;
    external: number;
    arrayBuffers: number;
    domNodes: number;
    eventListeners: number;
    detachedNodes: number;
}
export interface MemoryLeak {
    type: 'detached-dom' | 'event-listener' | 'closure' | 'growing-array' | 'timer';
    description: string;
    severity: 'low' | 'medium' | 'high';
    location?: string;
    size?: number;
    suggestion: string;
}
export interface MemoryTrend {
    timestamp: number;
    heapUsed: number;
    trend: 'stable' | 'growing' | 'shrinking';
    rate: number;
}
export interface AllocationSite {
    stack: string;
    count: number;
    size: number;
    type: string;
}
export interface MemoryProfilerConfig {
    sampleInterval?: number;
    maxSnapshots?: number;
    detectLeaks?: boolean;
    trackAllocations?: boolean;
}
export declare class MemoryProfiler {
    private snapshots;
    private config;
    private intervalId;
    private snapshotCounter;
    private baseline;
    private listeners;
    private leakDetectionEnabled;
    private detectedLeaks;
    constructor(config?: MemoryProfilerConfig);
    /**
     * Start profiling
     */
    start(): void;
    /**
     * Stop profiling
     */
    stop(): void;
    /**
     * Take a memory snapshot
     */
    takeSnapshot(label?: string): MemorySnapshot;
    /**
     * Force garbage collection (if available)
     */
    forceGC(): boolean;
    /**
     * Get all snapshots
     */
    getSnapshots(): MemorySnapshot[];
    /**
     * Get memory trend
     */
    getTrend(): MemoryTrend[];
    /**
     * Compare two snapshots
     */
    compareSnapshots(snapshot1: MemorySnapshot, snapshot2: MemorySnapshot): {
        heapDiff: number;
        domNodesDiff: number;
        eventListenersDiff: number;
        detachedNodesDiff: number;
        percentChange: number;
    };
    /**
     * Get detected memory leaks
     */
    getLeaks(): MemoryLeak[];
    /**
     * Check for potential memory leaks
     */
    detectLeaks(): MemoryLeak[];
    /**
     * Get memory usage summary
     */
    getSummary(): {
        currentUsage: number;
        peakUsage: number;
        averageUsage: number;
        trend: 'stable' | 'growing' | 'shrinking';
        leakProbability: 'low' | 'medium' | 'high';
    };
    /**
     * Add snapshot listener
     */
    onSnapshot(callback: (snapshot: MemorySnapshot) => void): () => void;
    /**
     * Clear all data
     */
    clear(): void;
    private analyze;
    private countEventListeners;
    private countDetachedNodes;
}
/**
 * Create a memory profiler instance
 */
export declare function createMemoryProfiler(config?: MemoryProfilerConfig): MemoryProfiler;
/**
 * Quick memory check
 */
export declare function getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
};
//# sourceMappingURL=index.d.ts.map