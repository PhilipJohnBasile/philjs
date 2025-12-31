/**
 * PhilJS Native - Performance Optimizations
 *
 * Performance utilities including virtualization, memoization,
 * lazy loading, and native performance monitoring.
 */
import { signal, effect, batch, memo } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Performance Marks & Measures
// ============================================================================
const marks = new Map();
const measures = [];
/**
 * Create a performance mark
 */
export function mark(name) {
    const entry = {
        name,
        startTime: performance.now(),
        entryType: 'mark',
    };
    marks.set(name, entry);
    // Also use native Performance API if available
    if (typeof performance.mark === 'function') {
        try {
            performance.mark(name);
        }
        catch (e) {
            // Ignore - some environments don't support custom marks
        }
    }
    return entry;
}
/**
 * Create a performance measure between two marks
 */
export function measure(name, startMark, endMark) {
    const start = marks.get(startMark);
    if (!start)
        return null;
    const endTime = endMark ? marks.get(endMark)?.startTime : performance.now();
    if (endTime === undefined)
        return null;
    const entry = {
        name,
        startTime: start.startTime,
        duration: endTime - start.startTime,
        entryType: 'measure',
    };
    measures.push(entry);
    // Also use native Performance API if available
    if (typeof performance.measure === 'function') {
        try {
            performance.measure(name, startMark, endMark);
        }
        catch (e) {
            // Ignore
        }
    }
    return entry;
}
/**
 * Get all measures
 */
export function getMeasures() {
    return [...measures];
}
/**
 * Clear all marks and measures
 */
export function clearPerformanceData() {
    marks.clear();
    measures.length = 0;
    if (typeof performance.clearMarks === 'function') {
        performance.clearMarks();
    }
    if (typeof performance.clearMeasures === 'function') {
        performance.clearMeasures();
    }
}
// ============================================================================
// Frame Timing Monitor
// ============================================================================
const frameTimings = [];
let frameMonitorActive = false;
let lastFrameTime = 0;
let frameCount = 0;
/**
 * Start frame timing monitor
 */
export function startFrameMonitor() {
    if (frameMonitorActive)
        return () => { };
    frameMonitorActive = true;
    lastFrameTime = performance.now();
    frameCount = 0;
    const measureFrame = (timestamp) => {
        if (!frameMonitorActive)
            return;
        const frameTime = timestamp - lastFrameTime;
        const fps = 1000 / frameTime;
        const jank = frameTime > 16.67 * 2; // More than 2 frames dropped
        frameTimings.push({
            timestamp,
            fps,
            frameTime,
            jank,
        });
        // Keep only last 60 frames
        if (frameTimings.length > 60) {
            frameTimings.shift();
        }
        lastFrameTime = timestamp;
        frameCount++;
        requestAnimationFrame(measureFrame);
    };
    requestAnimationFrame(measureFrame);
    return () => {
        frameMonitorActive = false;
    };
}
/**
 * Get frame statistics
 */
export function getFrameStats() {
    if (frameTimings.length === 0) {
        return { averageFps: 0, minFps: 0, maxFps: 0, jankFrames: 0, totalFrames: 0 };
    }
    const fps = frameTimings.map(f => f.fps);
    const jankFrames = frameTimings.filter(f => f.jank).length;
    return {
        averageFps: fps.reduce((a, b) => a + b, 0) / fps.length,
        minFps: Math.min(...fps),
        maxFps: Math.max(...fps),
        jankFrames,
        totalFrames: frameTimings.length,
    };
}
// ============================================================================
// Memory Monitoring
// ============================================================================
/**
 * Get memory info
 */
export function getMemoryInfo() {
    if (typeof performance !== 'undefined' && performance.memory) {
        const memory = performance.memory;
        return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
    }
    return null;
}
/**
 * Memory pressure signal
 */
export const memoryPressure = signal('normal');
/**
 * Start memory monitoring
 */
export function startMemoryMonitor(interval = 5000) {
    let timer = null;
    const checkMemory = () => {
        const info = getMemoryInfo();
        if (!info)
            return;
        const usage = info.usedJSHeapSize / info.jsHeapSizeLimit;
        if (usage > 0.9) {
            memoryPressure.set('critical');
        }
        else if (usage > 0.7) {
            memoryPressure.set('moderate');
        }
        else {
            memoryPressure.set('normal');
        }
    };
    timer = setInterval(checkMemory, interval);
    checkMemory();
    return () => {
        if (timer) {
            clearInterval(timer);
        }
    };
}
// ============================================================================
// Virtualization
// ============================================================================
/**
 * Calculate virtualized range for a list
 */
export function calculateVirtualizedRange(config, scrollTop) {
    const { itemCount, containerHeight, overscan = 3 } = config;
    let currentOffset = 0;
    let startIndex = 0;
    let endIndex = 0;
    let totalHeight = 0;
    // Calculate total height and find visible range
    const heights = [];
    for (let i = 0; i < itemCount; i++) {
        const height = typeof config.itemHeight === 'function'
            ? config.itemHeight(i)
            : config.itemHeight;
        heights.push(height);
        totalHeight += height;
        if (currentOffset + height < scrollTop && startIndex === 0) {
            startIndex = i + 1;
        }
        if (currentOffset < scrollTop + containerHeight) {
            endIndex = i;
        }
        currentOffset += height;
    }
    // Apply overscan
    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(itemCount - 1, endIndex + overscan);
    // Calculate offset for first visible item
    let offsetTop = 0;
    for (let i = 0; i < startIndex; i++) {
        offsetTop += heights[i] ?? 0;
    }
    // Build visible items array
    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
        visibleItems.push(i);
    }
    return {
        startIndex,
        endIndex,
        visibleItems,
        offsetTop,
        totalHeight,
    };
}
/**
 * Create a virtualized list helper
 */
export function createVirtualizedList(config) {
    const range = signal(calculateVirtualizedRange(config, 0));
    const updateScroll = (scrollTop) => {
        range.set(calculateVirtualizedRange(config, scrollTop));
    };
    const getItemStyle = (index) => {
        let top = 0;
        for (let i = 0; i < index; i++) {
            top += typeof config.itemHeight === 'function'
                ? config.itemHeight(i)
                : config.itemHeight;
        }
        const height = typeof config.itemHeight === 'function'
            ? config.itemHeight(index)
            : config.itemHeight;
        return {
            position: 'absolute',
            top,
            height,
        };
    };
    return { range, updateScroll, getItemStyle };
}
// ============================================================================
// Memoization & Caching
// ============================================================================
/**
 * Create a memoized function with LRU cache
 */
export function memoize(fn, options = {}) {
    const { maxSize = 100, keyFn, ttl } = options;
    const cache = new Map();
    const keys = [];
    return ((...args) => {
        const key = keyFn ? keyFn(...args) : JSON.stringify(args);
        const cached = cache.get(key);
        // Check if cached and not expired
        if (cached) {
            if (!ttl || Date.now() - cached.timestamp < ttl) {
                return cached.value;
            }
            cache.delete(key);
        }
        // Calculate new value
        const value = fn(...args);
        // Add to cache
        cache.set(key, { value, timestamp: Date.now() });
        keys.push(key);
        // Evict if over max size
        if (keys.length > maxSize) {
            const oldKey = keys.shift();
            cache.delete(oldKey);
        }
        return value;
    });
}
/**
 * Create a debounced function
 */
export function debounce(fn, delay) {
    let timer = null;
    const debounced = ((...args) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn(...args);
            timer = null;
        }, delay);
    });
    debounced.cancel = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };
    return debounced;
}
/**
 * Create a throttled function
 */
export function throttle(fn, limit) {
    let lastCall = 0;
    let timer = null;
    const throttled = ((...args) => {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            fn(...args);
        }
        else {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                lastCall = Date.now();
                fn(...args);
                timer = null;
            }, limit - (now - lastCall));
        }
    });
    throttled.cancel = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };
    return throttled;
}
/**
 * Create a lazy-loaded module
 */
export function lazy(loader) {
    let loaded = false;
    let value;
    let promise = null;
    return {
        load: () => {
            if (!promise) {
                promise = loader().then(v => {
                    value = v;
                    loaded = true;
                    return v;
                });
            }
            return promise;
        },
        isLoaded: () => loaded,
        get: () => value,
    };
}
/**
 * Create a preloaded module (starts loading immediately)
 */
export function preload(loader) {
    const lazyModule = lazy(loader);
    lazyModule.load();
    return lazyModule;
}
// ============================================================================
// Batch Updates
// ============================================================================
let pendingUpdates = [];
let isBatching = false;
/**
 * Start a batch of updates
 */
export function startBatch() {
    isBatching = true;
}
/**
 * End a batch and execute all updates
 */
export function endBatch() {
    isBatching = false;
    const updates = [...pendingUpdates];
    pendingUpdates = [];
    batch(() => {
        updates.forEach(update => update());
    });
}
/**
 * Schedule an update (batched if in batch mode)
 */
export function scheduleUpdate(update) {
    if (isBatching) {
        pendingUpdates.push(update);
    }
    else {
        update();
    }
}
/**
 * Run updates in next animation frame
 */
export function scheduleAnimationFrame(callback) {
    if (typeof requestAnimationFrame !== 'undefined') {
        return requestAnimationFrame(callback);
    }
    return setTimeout(callback, 16);
}
/**
 * Run updates in next idle period
 */
export function scheduleIdleCallback(callback, options) {
    if (typeof requestIdleCallback !== 'undefined') {
        return requestIdleCallback(callback, options);
    }
    return setTimeout(callback, 1);
}
/**
 * Preload an image
 */
export function preloadImage(src, priority = 'auto') {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (priority === 'high' && 'fetchPriority' in img) {
            img.fetchPriority = 'high';
        }
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
/**
 * Preload multiple images
 */
export function preloadImages(sources, concurrency = 3) {
    const results = [];
    let index = 0;
    const loadNext = () => {
        if (index >= sources.length)
            return Promise.resolve();
        const currentIndex = index++;
        const src = sources[currentIndex];
        if (src === undefined)
            return loadNext();
        return preloadImage(src)
            .then(img => {
            results[currentIndex] = img;
            return loadNext();
        })
            .catch(() => loadNext());
    };
    const workers = Array(Math.min(concurrency, sources.length))
        .fill(null)
        .map(() => loadNext());
    return Promise.all(workers).then(() => results);
}
// ============================================================================
// InteractionManager
// ============================================================================
const interactionQueue = [];
let isInteracting = false;
/**
 * Run callback after current interaction is complete
 */
export function runAfterInteractions(callback) {
    if (!isInteracting) {
        scheduleIdleCallback(callback);
        return { cancel: () => { } };
    }
    const index = interactionQueue.push(callback) - 1;
    return {
        cancel: () => {
            interactionQueue[index] = () => { };
        },
    };
}
/**
 * Create an interaction handle
 */
export function createInteractionHandle() {
    isInteracting = true;
    return {
        done: () => {
            isInteracting = false;
            // Run queued callbacks
            const callbacks = [...interactionQueue];
            interactionQueue.length = 0;
            scheduleIdleCallback(() => {
                callbacks.forEach(cb => cb());
            });
        },
    };
}
// ============================================================================
// Exports
// ============================================================================
export const Performance = {
    // Marks & Measures
    mark,
    measure,
    getMeasures,
    clearPerformanceData,
    // Frame Timing
    startFrameMonitor,
    getFrameStats,
    // Memory
    getMemoryInfo,
    memoryPressure,
    startMemoryMonitor,
    // Virtualization
    calculateVirtualizedRange,
    createVirtualizedList,
    // Memoization
    memoize,
    debounce,
    throttle,
    // Lazy Loading
    lazy,
    preload,
    // Batch Updates
    startBatch,
    endBatch,
    scheduleUpdate,
    scheduleAnimationFrame,
    scheduleIdleCallback,
    // Image Optimization
    preloadImage,
    preloadImages,
    // Interaction Manager
    runAfterInteractions,
    createInteractionHandle,
};
export default Performance;
//# sourceMappingURL=index.js.map