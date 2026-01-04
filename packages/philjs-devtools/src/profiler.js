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
// =============================================================================
// Render Profiler
// =============================================================================
let isProfilerActive = false;
let renderProfiles = [];
let currentProfile = null;
let profileStack = [];
/**
 * Start profiling renders
 */
export function startProfiling(config = {}) {
    isProfilerActive = true;
    renderProfiles = [];
    profileStack = [];
    console.log('[PhilJS Profiler] Started render profiling');
}
/**
 * Stop profiling and return results
 */
export function stopProfiling() {
    isProfilerActive = false;
    const profiles = [...renderProfiles];
    renderProfiles = [];
    profileStack = [];
    console.log(`[PhilJS Profiler] Stopped. Captured ${profiles.length} render profiles`);
    return profiles;
}
/**
 * Record component render start
 */
export function recordRenderStart(componentName, props = {}) {
    if (!isProfilerActive)
        return;
    const profile = {
        componentName,
        renderTime: 0,
        commitTime: 0,
        effectTime: 0,
        memoHits: 0,
        memoMisses: 0,
        rerenderCount: 0,
        props,
        children: [],
    };
    if (profileStack.length > 0) {
        profileStack[profileStack.length - 1].children.push(profile);
    }
    else {
        renderProfiles.push(profile);
    }
    profileStack.push(profile);
    profile._startTime = performance.now();
}
/**
 * Record component render end
 */
export function recordRenderEnd() {
    if (!isProfilerActive || profileStack.length === 0)
        return;
    const profile = profileStack.pop();
    profile.renderTime = performance.now() - profile._startTime;
    delete profile._startTime;
}
/**
 * Record memo cache hit/miss
 */
export function recordMemo(hit) {
    if (!isProfilerActive || profileStack.length === 0)
        return;
    const profile = profileStack[profileStack.length - 1];
    if (hit) {
        profile.memoHits++;
    }
    else {
        profile.memoMisses++;
    }
}
// =============================================================================
// Memory Profiler
// =============================================================================
let memoryProfiles = [];
let memoryInterval = null;
/**
 * Start memory profiling
 */
export function startMemoryProfiling(intervalMs = 1000) {
    memoryProfiles = [];
    memoryInterval = setInterval(() => {
        const profile = captureMemorySnapshot();
        memoryProfiles.push(profile);
        // Keep only last 1000 samples
        if (memoryProfiles.length > 1000) {
            memoryProfiles.shift();
        }
    }, intervalMs);
    console.log('[PhilJS Profiler] Started memory profiling');
}
/**
 * Stop memory profiling
 */
export function stopMemoryProfiling() {
    if (memoryInterval) {
        clearInterval(memoryInterval);
        memoryInterval = null;
    }
    const profiles = [...memoryProfiles];
    memoryProfiles = [];
    console.log(`[PhilJS Profiler] Stopped. Captured ${profiles.length} memory samples`);
    return profiles;
}
/**
 * Capture current memory snapshot
 */
export function captureMemorySnapshot() {
    const performance = globalThis.performance;
    const memory = performance?.memory || {};
    return {
        timestamp: Date.now(),
        heapUsed: memory.usedJSHeapSize || 0,
        heapTotal: memory.totalJSHeapSize || 0,
        external: 0,
        arrayBuffers: 0,
        signals: countSignals(),
        effects: countEffects(),
        components: countComponents(),
    };
}
function countSignals() {
    return globalThis.__PHILJS_SIGNAL_COUNT__ || 0;
}
function countEffects() {
    return globalThis.__PHILJS_EFFECT_COUNT__ || 0;
}
function countComponents() {
    return globalThis.__PHILJS_COMPONENT_COUNT__ || 0;
}
// =============================================================================
// Network Profiler
// =============================================================================
let networkProfiles = [];
let originalFetch = null;
let isNetworkProfilingActive = false;
/**
 * Start network profiling
 */
export function startNetworkProfiling() {
    if (isNetworkProfilingActive)
        return;
    isNetworkProfilingActive = true;
    networkProfiles = [];
    // Intercept fetch
    if (typeof fetch !== 'undefined') {
        originalFetch = fetch;
        globalThis.fetch = async function (input, init) {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            const method = init?.method || 'GET';
            const startTime = performance.now();
            try {
                const response = await originalFetch(input, init);
                const duration = performance.now() - startTime;
                const size = parseInt(response.headers.get('content-length') || '0', 10);
                networkProfiles.push({
                    url,
                    method,
                    status: response.status,
                    duration,
                    size,
                    type: 'fetch',
                    timestamp: Date.now(),
                    initiator: getInitiator(),
                    cached: response.headers.get('x-cache') === 'HIT',
                });
                return response;
            }
            catch (error) {
                const duration = performance.now() - startTime;
                networkProfiles.push({
                    url,
                    method,
                    status: 0,
                    duration,
                    size: 0,
                    type: 'fetch',
                    timestamp: Date.now(),
                    initiator: getInitiator(),
                    cached: false,
                });
                throw error;
            }
        };
    }
    console.log('[PhilJS Profiler] Started network profiling');
}
/**
 * Stop network profiling
 */
export function stopNetworkProfiling() {
    if (!isNetworkProfilingActive)
        return [];
    isNetworkProfilingActive = false;
    if (originalFetch) {
        globalThis.fetch = originalFetch;
        originalFetch = null;
    }
    const profiles = [...networkProfiles];
    networkProfiles = [];
    console.log(`[PhilJS Profiler] Stopped. Captured ${profiles.length} network requests`);
    return profiles;
}
function getInitiator() {
    const stack = new Error().stack || '';
    const lines = stack.split('\n').slice(3);
    return lines[0]?.trim() || 'unknown';
}
// =============================================================================
// Flame Graph Generator
// =============================================================================
/**
 * Generate flame graph data from render profiles
 */
export function generateFlameGraph(profiles) {
    const root = {
        name: 'root',
        value: 0,
        children: [],
        self: 0,
    };
    for (const profile of profiles) {
        const node = profileToFlameNode(profile);
        root.children.push(node);
        root.value += node.value;
    }
    return root;
}
function profileToFlameNode(profile) {
    const children = profile.children.map(profileToFlameNode);
    const childrenTime = children.reduce((sum, c) => sum + c.value, 0);
    return {
        name: profile.componentName,
        value: profile.renderTime,
        children,
        self: profile.renderTime - childrenTime,
        color: getHeatColor(profile.renderTime),
    };
}
function getHeatColor(time) {
    if (time < 1)
        return '#4ade80'; // green
    if (time < 5)
        return '#fbbf24'; // yellow
    if (time < 16)
        return '#f97316'; // orange
    return '#ef4444'; // red
}
// =============================================================================
// Analysis Functions
// =============================================================================
/**
 * Analyze render performance
 */
export function analyzeRenderPerformance(profiles) {
    const allProfiles = flattenProfiles(profiles);
    const totalRenderTime = allProfiles.reduce((sum, p) => sum + p.renderTime, 0);
    const averageRenderTime = allProfiles.length > 0 ? totalRenderTime / allProfiles.length : 0;
    const componentTimes = new Map();
    for (const profile of allProfiles) {
        const current = componentTimes.get(profile.componentName) || 0;
        componentTimes.set(profile.componentName, current + profile.renderTime);
    }
    const slowestComponents = Array.from(componentTimes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, time]) => ({ name, time }));
    const totalMemoOps = allProfiles.reduce((sum, p) => sum + p.memoHits + p.memoMisses, 0);
    const totalMemoHits = allProfiles.reduce((sum, p) => sum + p.memoHits, 0);
    const memoEfficiency = totalMemoOps > 0 ? totalMemoHits / totalMemoOps : 1;
    const recommendations = [];
    if (averageRenderTime > 16) {
        recommendations.push('Average render time exceeds 16ms frame budget. Consider code splitting.');
    }
    if (memoEfficiency < 0.5) {
        recommendations.push('Memo efficiency is low. Check memoization dependencies.');
    }
    for (const { name, time } of slowestComponents.slice(0, 3)) {
        if (time > 50) {
            recommendations.push(`${name} is taking ${time.toFixed(2)}ms. Consider lazy loading or optimization.`);
        }
    }
    return {
        totalRenderTime,
        averageRenderTime,
        slowestComponents,
        memoEfficiency,
        recommendations,
    };
}
/**
 * Analyze memory usage
 */
export function analyzeMemoryUsage(profiles) {
    if (profiles.length === 0) {
        return {
            peakHeapUsed: 0,
            averageHeapUsed: 0,
            memoryGrowth: 0,
            leakSuspects: [],
            recommendations: [],
        };
    }
    const peakHeapUsed = Math.max(...profiles.map(p => p.heapUsed));
    const averageHeapUsed = profiles.reduce((sum, p) => sum + p.heapUsed, 0) / profiles.length;
    const firstQuarter = profiles.slice(0, Math.floor(profiles.length / 4));
    const lastQuarter = profiles.slice(-Math.floor(profiles.length / 4));
    const firstAvg = firstQuarter.reduce((sum, p) => sum + p.heapUsed, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, p) => sum + p.heapUsed, 0) / lastQuarter.length;
    const memoryGrowth = ((lastAvg - firstAvg) / firstAvg) * 100;
    const leakSuspects = [];
    const recommendations = [];
    // Check signal growth
    const signalGrowth = profiles[profiles.length - 1].signals - profiles[0].signals;
    if (signalGrowth > 100) {
        leakSuspects.push('Signals appear to be leaking');
        recommendations.push('Check for signals created in loops or not properly disposed');
    }
    // Check effect growth
    const effectGrowth = profiles[profiles.length - 1].effects - profiles[0].effects;
    if (effectGrowth > 50) {
        leakSuspects.push('Effects appear to be leaking');
        recommendations.push('Ensure effects are properly cleaned up');
    }
    if (memoryGrowth > 20) {
        recommendations.push('Memory is growing over time. Check for potential leaks.');
    }
    if (peakHeapUsed > 100 * 1024 * 1024) {
        recommendations.push('Peak heap usage exceeds 100MB. Consider memory optimization.');
    }
    return {
        peakHeapUsed,
        averageHeapUsed,
        memoryGrowth,
        leakSuspects,
        recommendations,
    };
}
/**
 * Analyze network requests
 */
export function analyzeNetworkRequests(profiles) {
    if (profiles.length === 0) {
        return {
            totalRequests: 0,
            totalSize: 0,
            averageDuration: 0,
            slowestRequests: [],
            failedRequests: [],
            recommendations: [],
        };
    }
    const totalRequests = profiles.length;
    const totalSize = profiles.reduce((sum, p) => sum + p.size, 0);
    const averageDuration = profiles.reduce((sum, p) => sum + p.duration, 0) / profiles.length;
    const slowestRequests = [...profiles]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);
    const failedRequests = profiles.filter(p => p.status >= 400 || p.status === 0);
    const recommendations = [];
    if (averageDuration > 500) {
        recommendations.push('Average request duration is high. Consider caching or CDN.');
    }
    const cachedCount = profiles.filter(p => p.cached).length;
    if (cachedCount / totalRequests < 0.3) {
        recommendations.push('Low cache hit rate. Review caching strategy.');
    }
    if (failedRequests.length > totalRequests * 0.05) {
        recommendations.push('High failure rate detected. Check error handling.');
    }
    return {
        totalRequests,
        totalSize,
        averageDuration,
        slowestRequests,
        failedRequests,
        recommendations,
    };
}
// =============================================================================
// Utility Functions
// =============================================================================
function flattenProfiles(profiles) {
    const result = [];
    function traverse(profile) {
        result.push(profile);
        for (const child of profile.children) {
            traverse(child);
        }
    }
    for (const profile of profiles) {
        traverse(profile);
    }
    return result;
}
/**
 * Export profile data as JSON
 */
export function exportProfileData(data) {
    return JSON.stringify({
        timestamp: Date.now(),
        version: '1.0',
        ...data,
    }, null, 2);
}
/**
 * Import profile data from JSON
 */
export function importProfileData(json) {
    const data = JSON.parse(json);
    return {
        renders: data.renders,
        memory: data.memory,
        network: data.network,
    };
}
//# sourceMappingURL=profiler.js.map