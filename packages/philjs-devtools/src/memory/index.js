/**
 * Memory Profiler for PhilJS DevTools
 *
 * Tracks memory usage, detects leaks, and helps optimize memory consumption.
 */
// ============================================================================
// Memory Profiler
// ============================================================================
export class MemoryProfiler {
    snapshots = [];
    config;
    intervalId = null;
    snapshotCounter = 0;
    baseline = null;
    listeners = new Set();
    leakDetectionEnabled = false;
    detectedLeaks = [];
    constructor(config = {}) {
        this.config = {
            sampleInterval: config.sampleInterval ?? 5000,
            maxSnapshots: config.maxSnapshots ?? 100,
            detectLeaks: config.detectLeaks ?? true,
            trackAllocations: config.trackAllocations ?? false,
        };
    }
    /**
     * Start profiling
     */
    start() {
        if (typeof window === 'undefined')
            return;
        // Take baseline snapshot
        this.baseline = this.takeSnapshot('baseline');
        // Start periodic sampling
        this.intervalId = setInterval(() => {
            const snapshot = this.takeSnapshot();
            this.analyze(snapshot);
        }, this.config.sampleInterval);
        this.leakDetectionEnabled = this.config.detectLeaks;
    }
    /**
     * Stop profiling
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.leakDetectionEnabled = false;
    }
    /**
     * Take a memory snapshot
     */
    takeSnapshot(label) {
        const memory = performance.memory || {};
        const snapshot = {
            id: `snapshot-${++this.snapshotCounter}`,
            timestamp: Date.now(),
            heapSize: memory.totalJSHeapSize || 0,
            heapUsed: memory.usedJSHeapSize || 0,
            heapLimit: memory.jsHeapSizeLimit || 0,
            external: 0,
            arrayBuffers: 0,
            domNodes: document.getElementsByTagName('*').length,
            eventListeners: this.countEventListeners(),
            detachedNodes: this.countDetachedNodes(),
        };
        if (label !== undefined)
            snapshot.label = label;
        // Add to snapshots
        this.snapshots.push(snapshot);
        // Enforce max snapshots
        if (this.snapshots.length > this.config.maxSnapshots) {
            this.snapshots.shift();
        }
        // Notify listeners
        for (const listener of this.listeners) {
            listener(snapshot);
        }
        return snapshot;
    }
    /**
     * Force garbage collection (if available)
     */
    forceGC() {
        if (typeof window.gc === 'function') {
            window.gc();
            return true;
        }
        return false;
    }
    /**
     * Get all snapshots
     */
    getSnapshots() {
        return [...this.snapshots];
    }
    /**
     * Get memory trend
     */
    getTrend() {
        if (this.snapshots.length < 2) {
            return [];
        }
        const trends = [];
        for (let i = 1; i < this.snapshots.length; i++) {
            const prev = this.snapshots[i - 1];
            const curr = this.snapshots[i];
            const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
            const memDiff = curr.heapUsed - prev.heapUsed;
            const rate = memDiff / timeDiff;
            let trend = 'stable';
            if (rate > 10000)
                trend = 'growing'; // > 10KB/s
            if (rate < -10000)
                trend = 'shrinking'; // < -10KB/s
            trends.push({
                timestamp: curr.timestamp,
                heapUsed: curr.heapUsed,
                trend,
                rate,
            });
        }
        return trends;
    }
    /**
     * Compare two snapshots
     */
    compareSnapshots(snapshot1, snapshot2) {
        return {
            heapDiff: snapshot2.heapUsed - snapshot1.heapUsed,
            domNodesDiff: snapshot2.domNodes - snapshot1.domNodes,
            eventListenersDiff: snapshot2.eventListeners - snapshot1.eventListeners,
            detachedNodesDiff: snapshot2.detachedNodes - snapshot1.detachedNodes,
            percentChange: ((snapshot2.heapUsed - snapshot1.heapUsed) / snapshot1.heapUsed) * 100,
        };
    }
    /**
     * Get detected memory leaks
     */
    getLeaks() {
        return [...this.detectedLeaks];
    }
    /**
     * Check for potential memory leaks
     */
    detectLeaks() {
        const leaks = [];
        // Check for detached DOM nodes
        const detachedCount = this.countDetachedNodes();
        if (detachedCount > 10) {
            leaks.push({
                type: 'detached-dom',
                description: `${detachedCount} detached DOM nodes found`,
                severity: detachedCount > 100 ? 'high' : detachedCount > 50 ? 'medium' : 'low',
                size: detachedCount * 1000, // Estimate
                suggestion: 'Remove references to DOM nodes that have been removed from the document',
            });
        }
        // Check for growing heap
        if (this.snapshots.length >= 5) {
            const recent = this.snapshots.slice(-5);
            let growing = true;
            for (let i = 1; i < recent.length; i++) {
                if (recent[i].heapUsed <= recent[i - 1].heapUsed) {
                    growing = false;
                    break;
                }
            }
            if (growing) {
                const growthRate = (recent[recent.length - 1].heapUsed - recent[0].heapUsed) /
                    ((recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000);
                leaks.push({
                    type: 'growing-array',
                    description: `Heap is consistently growing at ${formatBytes(growthRate)}/s`,
                    severity: growthRate > 100000 ? 'high' : growthRate > 10000 ? 'medium' : 'low',
                    suggestion: 'Check for arrays or objects that grow without cleanup',
                });
            }
        }
        // Check for too many event listeners
        const eventListeners = this.countEventListeners();
        if (eventListeners > 500) {
            leaks.push({
                type: 'event-listener',
                description: `${eventListeners} event listeners attached`,
                severity: eventListeners > 2000 ? 'high' : eventListeners > 1000 ? 'medium' : 'low',
                suggestion: 'Ensure event listeners are removed when components unmount',
            });
        }
        this.detectedLeaks = leaks;
        return leaks;
    }
    /**
     * Get memory usage summary
     */
    getSummary() {
        const snapshots = this.snapshots;
        if (snapshots.length === 0) {
            return {
                currentUsage: 0,
                peakUsage: 0,
                averageUsage: 0,
                trend: 'stable',
                leakProbability: 'low',
            };
        }
        const currentUsage = snapshots[snapshots.length - 1].heapUsed;
        const peakUsage = Math.max(...snapshots.map(s => s.heapUsed));
        const averageUsage = snapshots.reduce((sum, s) => sum + s.heapUsed, 0) / snapshots.length;
        // Calculate trend
        const trends = this.getTrend();
        const recentTrends = trends.slice(-5);
        const avgRate = recentTrends.reduce((sum, t) => sum + t.rate, 0) / recentTrends.length;
        let trend = 'stable';
        if (avgRate > 5000)
            trend = 'growing';
        if (avgRate < -5000)
            trend = 'shrinking';
        // Estimate leak probability
        const leaks = this.detectLeaks();
        const highLeaks = leaks.filter(l => l.severity === 'high').length;
        const mediumLeaks = leaks.filter(l => l.severity === 'medium').length;
        let leakProbability = 'low';
        if (highLeaks > 0)
            leakProbability = 'high';
        else if (mediumLeaks > 0 || trend === 'growing')
            leakProbability = 'medium';
        return {
            currentUsage,
            peakUsage,
            averageUsage,
            trend,
            leakProbability,
        };
    }
    /**
     * Add snapshot listener
     */
    onSnapshot(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    /**
     * Clear all data
     */
    clear() {
        this.snapshots = [];
        this.detectedLeaks = [];
        this.baseline = null;
        this.snapshotCounter = 0;
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    analyze(snapshot) {
        if (!this.leakDetectionEnabled)
            return;
        // Periodically check for leaks
        if (this.snapshots.length % 5 === 0) {
            this.detectLeaks();
        }
    }
    countEventListeners() {
        // This is an approximation - actual count requires browser DevTools
        let count = 0;
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            // Check for common event handlers
            const events = ['click', 'mousedown', 'mouseup', 'mousemove', 'keydown', 'keyup', 'scroll', 'resize'];
            events.forEach(event => {
                if (el[`on${event}`])
                    count++;
            });
        });
        // Add window listeners estimate
        count += 20; // Base estimate for window listeners
        return count;
    }
    countDetachedNodes() {
        // This requires a more sophisticated approach in real implementation
        // For now, we provide an approximation
        return 0;
    }
}
// ============================================================================
// Utilities
// ============================================================================
function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = Math.abs(bytes);
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${bytes < 0 ? '-' : ''}${value.toFixed(2)} ${units[unitIndex]}`;
}
/**
 * Create a memory profiler instance
 */
export function createMemoryProfiler(config) {
    return new MemoryProfiler(config);
}
/**
 * Quick memory check
 */
export function getMemoryUsage() {
    const memory = performance.memory || {};
    return {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
        percentage: memory.totalJSHeapSize
            ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
            : 0,
    };
}
//# sourceMappingURL=index.js.map