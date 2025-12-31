/**
 * Performance Profiler for PhilJS DevTools
 *
 * Advanced profiling capabilities:
 * - Component render profiling
 * - Memory usage tracking
 * - Network request analysis
 * - Bundle analysis
 * - Flame graph generation
 */
export interface RenderProfile {
    componentName: string;
    renderTime: number;
    commitTime: number;
    effectTime: number;
    memoHits: number;
    memoMisses: number;
    rerenderCount: number;
    props: Record<string, unknown>;
    children: RenderProfile[];
}
export interface MemoryProfile {
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    signals: number;
    effects: number;
    components: number;
}
export interface NetworkProfile {
    url: string;
    method: string;
    status: number;
    duration: number;
    size: number;
    type: 'fetch' | 'xhr' | 'websocket';
    timestamp: number;
    initiator: string;
    cached: boolean;
}
export interface BundleProfile {
    totalSize: number;
    gzipSize: number;
    modules: ModuleInfo[];
    chunks: ChunkInfo[];
    duplicates: DuplicateInfo[];
    treeshakeables: string[];
}
export interface ModuleInfo {
    name: string;
    size: number;
    gzipSize: number;
    path: string;
    imports: string[];
    importedBy: string[];
}
export interface ChunkInfo {
    name: string;
    size: number;
    modules: string[];
    isEntry: boolean;
    isAsync: boolean;
}
export interface DuplicateInfo {
    name: string;
    instances: number;
    totalSize: number;
    locations: string[];
}
export interface FlameNode {
    name: string;
    value: number;
    children: FlameNode[];
    self: number;
    color?: string;
}
export interface ProfilerConfig {
    sampleRate?: number;
    maxSamples?: number;
    includeProps?: boolean;
    trackMemory?: boolean;
    trackNetwork?: boolean;
}
/**
 * Start profiling renders
 */
export declare function startProfiling(config?: ProfilerConfig): void;
/**
 * Stop profiling and return results
 */
export declare function stopProfiling(): RenderProfile[];
/**
 * Record component render start
 */
export declare function recordRenderStart(componentName: string, props?: Record<string, unknown>): void;
/**
 * Record component render end
 */
export declare function recordRenderEnd(): void;
/**
 * Record memo cache hit/miss
 */
export declare function recordMemo(hit: boolean): void;
/**
 * Start memory profiling
 */
export declare function startMemoryProfiling(intervalMs?: number): void;
/**
 * Stop memory profiling
 */
export declare function stopMemoryProfiling(): MemoryProfile[];
/**
 * Capture current memory snapshot
 */
export declare function captureMemorySnapshot(): MemoryProfile;
/**
 * Start network profiling
 */
export declare function startNetworkProfiling(): void;
/**
 * Stop network profiling
 */
export declare function stopNetworkProfiling(): NetworkProfile[];
/**
 * Generate flame graph data from render profiles
 */
export declare function generateFlameGraph(profiles: RenderProfile[]): FlameNode;
/**
 * Analyze render performance
 */
export declare function analyzeRenderPerformance(profiles: RenderProfile[]): {
    totalRenderTime: number;
    averageRenderTime: number;
    slowestComponents: Array<{
        name: string;
        time: number;
    }>;
    memoEfficiency: number;
    recommendations: string[];
};
/**
 * Analyze memory usage
 */
export declare function analyzeMemoryUsage(profiles: MemoryProfile[]): {
    peakHeapUsed: number;
    averageHeapUsed: number;
    memoryGrowth: number;
    leakSuspects: string[];
    recommendations: string[];
};
/**
 * Analyze network requests
 */
export declare function analyzeNetworkRequests(profiles: NetworkProfile[]): {
    totalRequests: number;
    totalSize: number;
    averageDuration: number;
    slowestRequests: NetworkProfile[];
    failedRequests: NetworkProfile[];
    recommendations: string[];
};
/**
 * Export profile data as JSON
 */
export declare function exportProfileData(data: {
    renders?: RenderProfile[];
    memory?: MemoryProfile[];
    network?: NetworkProfile[];
}): string;
/**
 * Import profile data from JSON
 */
export declare function importProfileData(json: string): {
    renders?: RenderProfile[];
    memory?: MemoryProfile[];
    network?: NetworkProfile[];
};
//# sourceMappingURL=profiler.d.ts.map