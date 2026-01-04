/**
 * PhilJS Runtime Detection
 *
 * Utilities for detecting the current JavaScript runtime environment
 */
/**
 * Detect the current JavaScript runtime
 */
export function detectRuntime() {
    // Check for Bun
    if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
        return 'bun';
    }
    // Check for Deno
    if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
        return 'deno';
    }
    // Check for Edge runtimes (Vercel Edge, Cloudflare Workers)
    if (typeof globalThis !== 'undefined' &&
        typeof globalThis.EdgeRuntime !== 'undefined') {
        return 'edge';
    }
    // Check for Cloudflare Workers
    if (typeof globalThis !== 'undefined' &&
        typeof globalThis.caches !== 'undefined' &&
        typeof globalThis.navigator === 'undefined' &&
        typeof globalThis.process === 'undefined') {
        return 'edge';
    }
    // Check for browser
    if (typeof window !== 'undefined' &&
        typeof document !== 'undefined') {
        return 'browser';
    }
    // Check for Node.js
    if (typeof process !== 'undefined' &&
        process.versions &&
        process.versions.node) {
        return 'node';
    }
    return 'unknown';
}
/**
 * Get detailed runtime information
 */
export function getRuntimeInfo() {
    const runtime = detectRuntime();
    switch (runtime) {
        case 'bun':
            return {
                runtime: 'bun',
                version: getBunVersion(),
                features: {
                    fetch: true,
                    webSocket: true,
                    crypto: true,
                    fileSystem: true,
                    sqlite: true,
                    kvStorage: false,
                    hotReload: true,
                    httpServer: true,
                },
            };
        case 'deno':
            return {
                runtime: 'deno',
                version: getDenoVersion(),
                features: {
                    fetch: true,
                    webSocket: true,
                    crypto: true,
                    fileSystem: true,
                    sqlite: false, // Deno has sqlite via npm
                    kvStorage: true, // Deno KV
                    hotReload: true,
                    httpServer: true,
                },
            };
        case 'node':
            return {
                runtime: 'node',
                version: getNodeVersion(),
                features: {
                    fetch: parseFloat(getNodeVersion()) >= 18,
                    webSocket: false, // Requires external package
                    crypto: true,
                    fileSystem: true,
                    sqlite: false,
                    kvStorage: false,
                    hotReload: false,
                    httpServer: true,
                },
            };
        case 'edge':
            return {
                runtime: 'edge',
                version: 'unknown',
                features: {
                    fetch: true,
                    webSocket: true,
                    crypto: true,
                    fileSystem: false,
                    sqlite: false,
                    kvStorage: true,
                    hotReload: false,
                    httpServer: false,
                },
            };
        case 'browser':
            return {
                runtime: 'browser',
                version: 'unknown',
                features: {
                    fetch: true,
                    webSocket: true,
                    crypto: true,
                    fileSystem: false,
                    sqlite: false,
                    kvStorage: true, // localStorage, IndexedDB
                    hotReload: false,
                    httpServer: false,
                },
            };
        default:
            return {
                runtime: 'unknown',
                version: 'unknown',
                features: {
                    fetch: false,
                    webSocket: false,
                    crypto: false,
                    fileSystem: false,
                    sqlite: false,
                    kvStorage: false,
                    hotReload: false,
                    httpServer: false,
                },
            };
    }
}
function getBunVersion() {
    try {
        return globalThis.Bun?.version || 'unknown';
    }
    catch {
        return 'unknown';
    }
}
function getDenoVersion() {
    try {
        return globalThis.Deno?.version?.deno || 'unknown';
    }
    catch {
        return 'unknown';
    }
}
function getNodeVersion() {
    try {
        return process.versions?.node || 'unknown';
    }
    catch {
        return 'unknown';
    }
}
/**
 * Check if current runtime supports a specific feature
 */
export function hasFeature(feature) {
    return getRuntimeInfo().features[feature];
}
/**
 * Assert that the current runtime is one of the expected runtimes
 */
export function assertRuntime(...expected) {
    const current = detectRuntime();
    if (!expected.includes(current)) {
        throw new Error(`This code requires one of [${expected.join(', ')}] runtime, but running in ${current}`);
    }
}
/**
 * Check if running in Bun
 */
export function isBun() {
    return detectRuntime() === 'bun';
}
/**
 * Check if running in Deno
 */
export function isDeno() {
    return detectRuntime() === 'deno';
}
/**
 * Check if running in Node.js
 */
export function isNode() {
    return detectRuntime() === 'node';
}
/**
 * Check if running in an edge runtime
 */
export function isEdge() {
    return detectRuntime() === 'edge';
}
/**
 * Check if running in a browser
 */
export function isBrowser() {
    return detectRuntime() === 'browser';
}
/**
 * Check if running in a server environment (not browser)
 */
export function isServer() {
    const runtime = detectRuntime();
    return runtime !== 'browser' && runtime !== 'unknown';
}
//# sourceMappingURL=runtime-detect.js.map