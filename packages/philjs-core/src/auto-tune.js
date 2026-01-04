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
// =============================================================================
// Device Detection
// =============================================================================
/**
 * Detect device capabilities
 */
export function detectDeviceCapabilities() {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const win = typeof window !== 'undefined' ? window : null;
    // Core count
    const cores = nav?.hardwareConcurrency || 4;
    // Memory (Chrome only)
    const memory = nav?.deviceMemory || 4;
    // Device type
    const width = win?.innerWidth || 1024;
    const touch = (nav?.maxTouchPoints ?? 0) > 0;
    let deviceType = 'desktop';
    if (width < 768)
        deviceType = 'mobile';
    else if (width < 1024 && touch)
        deviceType = 'tablet';
    // GPU estimation based on renderer
    let gpu = 'medium';
    if (typeof document !== 'undefined') {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
                    if (/Mali|Adreno 3|PowerVR SGX/i.test(renderer))
                        gpu = 'low';
                    else if (/NVIDIA|AMD|GeForce|Radeon/i.test(renderer))
                        gpu = 'high';
                }
            }
        }
        catch { }
    }
    // Reduced motion preference
    const reducedMotion = win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    // Save data preference
    const connection = nav?.connection;
    const saveData = connection?.saveData || false;
    // Color scheme
    const colorScheme = win?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return {
        cores,
        memory,
        deviceType,
        gpu,
        touchCapable: touch,
        reducedMotion,
        saveData,
        colorScheme,
    };
}
/**
 * Detect network conditions
 */
export function detectNetworkCondition() {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const connection = nav?.connection;
    if (!connection) {
        return {
            effectiveType: '4g',
            downlink: 10,
            rtt: 50,
            saveData: false,
        };
    }
    return {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 50,
        saveData: connection.saveData || false,
    };
}
// =============================================================================
// Performance Monitoring
// =============================================================================
/**
 * Performance Monitor
 */
export class PerformanceMonitor {
    metrics = {
        fps: 60,
        longestTask: 0,
        memoryUsage: 0,
        domNodes: 0,
        layoutShifts: 0,
        inputLatency: 0,
    };
    observers = {};
    fpsHistory = [];
    lastFrameTime = 0;
    frameCount = 0;
    running = false;
    /**
     * Start monitoring
     */
    start() {
        if (this.running)
            return;
        this.running = true;
        // FPS monitoring
        this.measureFps();
        // Long task observer
        if (typeof PerformanceObserver !== 'undefined') {
            try {
                this.observers.longTask = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > this.metrics.longestTask) {
                            this.metrics.longestTask = entry.duration;
                        }
                    }
                });
                this.observers.longTask.observe({ entryTypes: ['longtask'] });
            }
            catch { }
            // Layout shift observer
            try {
                this.observers.layoutShift = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            this.metrics.layoutShifts += entry.value;
                        }
                    }
                });
                this.observers.layoutShift.observe({ entryTypes: ['layout-shift'] });
            }
            catch { }
            // First Input Delay
            try {
                this.observers.interaction = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.metrics.inputLatency = Math.max(this.metrics.inputLatency, entry.processingStart - entry.startTime);
                    }
                });
                this.observers.interaction.observe({ entryTypes: ['first-input'] });
            }
            catch { }
        }
    }
    /**
     * Stop monitoring
     */
    stop() {
        this.running = false;
        for (const observer of Object.values(this.observers)) {
            observer?.disconnect();
        }
        this.observers = {};
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        // Update DOM nodes count
        if (typeof document !== 'undefined') {
            this.metrics.domNodes = document.querySelectorAll('*').length;
        }
        // Update memory usage
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
        }
        return { ...this.metrics };
    }
    /**
     * Get average FPS
     */
    getAverageFps() {
        if (this.fpsHistory.length === 0)
            return 60;
        return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }
    measureFps() {
        if (!this.running)
            return;
        const now = performance.now();
        this.frameCount++;
        if (now - this.lastFrameTime >= 1000) {
            this.metrics.fps = this.frameCount;
            this.fpsHistory.push(this.frameCount);
            if (this.fpsHistory.length > 60)
                this.fpsHistory.shift();
            this.frameCount = 0;
            this.lastFrameTime = now;
        }
        requestAnimationFrame(() => this.measureFps());
    }
}
// =============================================================================
// Auto-Tuner
// =============================================================================
/**
 * Auto-Tuner for runtime optimization
 */
export class AutoTuner {
    config;
    device;
    network;
    monitor;
    recommendations = [];
    appliedOptimizations = new Set();
    listeners = new Set();
    constructor(config = {}) {
        this.config = {
            targetFps: config.targetFps ?? 60,
            adaptiveRendering: config.adaptiveRendering ?? true,
            imageOptimization: config.imageOptimization ?? true,
            animationOptimization: config.animationOptimization ?? true,
            lazyLoading: config.lazyLoading ?? true,
            batchThreshold: config.batchThreshold ?? 16,
            concurrentLimit: config.concurrentLimit ?? 4,
            memoryThreshold: config.memoryThreshold ?? 100,
            prefetching: config.prefetching ?? true,
        };
        this.device = detectDeviceCapabilities();
        this.network = detectNetworkCondition();
        this.monitor = new PerformanceMonitor();
        // Initial tuning based on device
        this.applyInitialTuning();
    }
    /**
     * Start auto-tuning
     */
    start() {
        this.monitor.start();
        // Listen for network changes
        if (typeof navigator !== 'undefined' && navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.network = detectNetworkCondition();
                this.adapt();
            });
        }
        // Periodic tuning
        setInterval(() => this.adapt(), 5000);
    }
    /**
     * Stop auto-tuning
     */
    stop() {
        this.monitor.stop();
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get recommendations
     */
    getRecommendations() {
        return [...this.recommendations];
    }
    /**
     * Subscribe to config changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Apply a specific optimization
     */
    applyOptimization(type) {
        if (this.appliedOptimizations.has(type))
            return;
        switch (type) {
            case 'reduce-animation':
                this.config.animationOptimization = true;
                this.appliedOptimizations.add(type);
                break;
            case 'defer-rendering':
                this.config.batchThreshold = Math.min(this.config.batchThreshold * 2, 64);
                this.appliedOptimizations.add(type);
                break;
            case 'simplify-ui':
                this.config.adaptiveRendering = true;
                this.appliedOptimizations.add(type);
                break;
            case 'reduce-images':
                this.config.imageOptimization = true;
                this.appliedOptimizations.add(type);
                break;
            case 'increase-caching':
                this.config.prefetching = true;
                this.appliedOptimizations.add(type);
                break;
            case 'reduce-dom':
                this.config.lazyLoading = true;
                this.appliedOptimizations.add(type);
                break;
        }
        this.notifyListeners();
    }
    applyInitialTuning() {
        // Device-based tuning
        if (this.device.deviceType === 'mobile') {
            this.config.concurrentLimit = 2;
            this.config.batchThreshold = 32;
        }
        if (this.device.gpu === 'low') {
            this.config.animationOptimization = true;
            this.config.targetFps = 30;
        }
        if (this.device.reducedMotion) {
            this.config.animationOptimization = true;
        }
        if (this.device.memory < 4) {
            this.config.memoryThreshold = 50;
            this.config.lazyLoading = true;
        }
        // Network-based tuning
        if (this.network.saveData || this.network.effectiveType === 'slow-2g' || this.network.effectiveType === '2g') {
            this.config.imageOptimization = true;
            this.config.prefetching = false;
        }
    }
    adapt() {
        const metrics = this.monitor.getMetrics();
        const avgFps = this.monitor.getAverageFps();
        this.recommendations = [];
        // FPS-based recommendations
        if (avgFps < this.config.targetFps * 0.8) {
            if (!this.appliedOptimizations.has('reduce-animation')) {
                this.recommendations.push({
                    type: 'reduce-animation',
                    reason: `FPS dropped to ${avgFps.toFixed(0)} (target: ${this.config.targetFps})`,
                    impact: 'high',
                    autoApply: true,
                });
            }
            if (!this.appliedOptimizations.has('defer-rendering')) {
                this.recommendations.push({
                    type: 'defer-rendering',
                    reason: 'Rendering is causing frame drops',
                    impact: 'medium',
                    autoApply: true,
                });
            }
        }
        // Memory-based recommendations
        if (metrics.memoryUsage > this.config.memoryThreshold) {
            this.recommendations.push({
                type: 'reduce-dom',
                reason: `Memory usage (${metrics.memoryUsage.toFixed(0)}MB) exceeds threshold`,
                impact: 'high',
                autoApply: true,
            });
        }
        // DOM size recommendations
        if (metrics.domNodes > 5000) {
            this.recommendations.push({
                type: 'reduce-dom',
                reason: `DOM has ${metrics.domNodes} nodes (recommended: <5000)`,
                impact: 'medium',
                autoApply: false,
            });
        }
        // Long task recommendations
        if (metrics.longestTask > 100) {
            this.recommendations.push({
                type: 'defer-rendering',
                reason: `Long task detected: ${metrics.longestTask.toFixed(0)}ms`,
                impact: 'high',
                autoApply: true,
            });
        }
        // Input latency recommendations
        if (metrics.inputLatency > 100) {
            this.recommendations.push({
                type: 'simplify-ui',
                reason: `Input latency: ${metrics.inputLatency.toFixed(0)}ms`,
                impact: 'high',
                autoApply: false,
            });
        }
        // Auto-apply high-impact recommendations
        for (const rec of this.recommendations) {
            if (rec.autoApply && rec.impact === 'high') {
                this.applyOptimization(rec.type);
            }
        }
    }
    notifyListeners() {
        for (const listener of this.listeners) {
            listener(this.config);
        }
    }
}
// =============================================================================
// Utilities
// =============================================================================
/**
 * Create an auto-tuner instance
 */
export function createAutoTuner(config) {
    return new AutoTuner(config);
}
/**
 * Get recommended image quality based on conditions
 */
export function getRecommendedImageQuality() {
    const device = detectDeviceCapabilities();
    const network = detectNetworkCondition();
    let quality = 80;
    let format = 'webp';
    let maxWidth = 1920;
    // Reduce quality for slow networks
    if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
        quality = 40;
        maxWidth = 640;
    }
    else if (network.effectiveType === '3g') {
        quality = 60;
        maxWidth = 1024;
    }
    // Reduce for mobile
    if (device.deviceType === 'mobile') {
        maxWidth = Math.min(maxWidth, 750);
    }
    // Use AVIF for high-end devices
    if (device.gpu === 'high' && network.effectiveType === '4g') {
        format = 'avif';
    }
    // Respect save data
    if (network.saveData || device.saveData) {
        quality = Math.min(quality, 50);
        maxWidth = Math.min(maxWidth, 640);
    }
    return { quality, format, maxWidth };
}
/**
 * Get recommended concurrent operations
 */
export function getRecommendedConcurrency() {
    const device = detectDeviceCapabilities();
    const network = detectNetworkCondition();
    let concurrency = device.cores;
    if (device.deviceType === 'mobile') {
        concurrency = Math.min(concurrency, 2);
    }
    if (network.effectiveType !== '4g') {
        concurrency = Math.min(concurrency, 2);
    }
    return Math.max(1, concurrency);
}
// =============================================================================
// Exports
// =============================================================================
export default {
    createAutoTuner,
    detectDeviceCapabilities,
    detectNetworkCondition,
    getRecommendedImageQuality,
    getRecommendedConcurrency,
    PerformanceMonitor,
    AutoTuner,
};
//# sourceMappingURL=auto-tune.js.map