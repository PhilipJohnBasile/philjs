/**
 * Performance Auto-Tuning for PhilJS
 *
 * Automatic runtime optimization based on:
 * - Device capabilities detection
 * - Network conditions
 * - User interaction patterns
 * - Resource usage monitoring
 * - Adaptive rendering strategies
 */
export interface DeviceCapabilities {
    cores: number;
    memory: number;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    gpu: 'low' | 'medium' | 'high';
    touchCapable: boolean;
    reducedMotion: boolean;
    saveData: boolean;
    colorScheme: 'light' | 'dark';
}
export interface NetworkCondition {
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'offline';
    downlink: number;
    rtt: number;
    saveData: boolean;
}
export interface PerformanceMetrics {
    fps: number;
    longestTask: number;
    memoryUsage: number;
    domNodes: number;
    layoutShifts: number;
    inputLatency: number;
}
export interface TuningConfig {
    /** Target FPS */
    targetFps: number;
    /** Enable adaptive rendering */
    adaptiveRendering: boolean;
    /** Enable image optimization */
    imageOptimization: boolean;
    /** Enable animation reduction */
    animationOptimization: boolean;
    /** Enable lazy loading */
    lazyLoading: boolean;
    /** Batch update threshold */
    batchThreshold: number;
    /** Concurrent task limit */
    concurrentLimit: number;
    /** Memory warning threshold (MB) */
    memoryThreshold: number;
    /** Enable prefetching */
    prefetching: boolean;
}
export interface TuningRecommendation {
    type: 'reduce-animation' | 'defer-rendering' | 'simplify-ui' | 'reduce-images' | 'increase-caching' | 'reduce-dom';
    reason: string;
    impact: 'high' | 'medium' | 'low';
    autoApply: boolean;
}
/**
 * Detect device capabilities
 */
export declare function detectDeviceCapabilities(): DeviceCapabilities;
/**
 * Detect network conditions
 */
export declare function detectNetworkCondition(): NetworkCondition;
/**
 * Performance Monitor
 */
export declare class PerformanceMonitor {
    private metrics;
    private observers;
    private fpsHistory;
    private lastFrameTime;
    private frameCount;
    private running;
    /**
     * Start monitoring
     */
    start(): void;
    /**
     * Stop monitoring
     */
    stop(): void;
    /**
     * Get current metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get average FPS
     */
    getAverageFps(): number;
    private measureFps;
}
/**
 * Auto-Tuner for runtime optimization
 */
export declare class AutoTuner {
    private config;
    private device;
    private network;
    private monitor;
    private recommendations;
    private appliedOptimizations;
    private listeners;
    constructor(config?: Partial<TuningConfig>);
    /**
     * Start auto-tuning
     */
    start(): void;
    /**
     * Stop auto-tuning
     */
    stop(): void;
    /**
     * Get current configuration
     */
    getConfig(): TuningConfig;
    /**
     * Get recommendations
     */
    getRecommendations(): TuningRecommendation[];
    /**
     * Subscribe to config changes
     */
    subscribe(listener: (config: TuningConfig) => void): () => void;
    /**
     * Apply a specific optimization
     */
    applyOptimization(type: TuningRecommendation['type']): void;
    private applyInitialTuning;
    private adapt;
    private notifyListeners;
}
/**
 * Create an auto-tuner instance
 */
export declare function createAutoTuner(config?: Partial<TuningConfig>): AutoTuner;
/**
 * Get recommended image quality based on conditions
 */
export declare function getRecommendedImageQuality(): {
    quality: number;
    format: 'webp' | 'avif' | 'jpeg';
    maxWidth: number;
};
/**
 * Get recommended concurrent operations
 */
export declare function getRecommendedConcurrency(): number;
declare const _default: {
    createAutoTuner: typeof createAutoTuner;
    detectDeviceCapabilities: typeof detectDeviceCapabilities;
    detectNetworkCondition: typeof detectNetworkCondition;
    getRecommendedImageQuality: typeof getRecommendedImageQuality;
    getRecommendedConcurrency: typeof getRecommendedConcurrency;
    PerformanceMonitor: typeof PerformanceMonitor;
    AutoTuner: typeof AutoTuner;
};
export default _default;
//# sourceMappingURL=auto-tune.d.ts.map