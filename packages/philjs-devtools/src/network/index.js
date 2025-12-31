/**
 * Network Monitor for PhilJS DevTools
 *
 * Tracks all network requests, provides waterfall visualization,
 * and helps identify performance bottlenecks.
 */
// ============================================================================
// Network Monitor
// ============================================================================
export class NetworkMonitor {
    requests = new Map();
    config;
    isRecording = true;
    requestCounter = 0;
    originalFetch = null;
    originalXHROpen = null;
    originalXHRSend = null;
    listeners = new Set();
    constructor(config = {}) {
        this.config = {
            maxRequests: config.maxRequests ?? 1000,
            captureHeaders: config.captureHeaders ?? true,
            captureTiming: config.captureTiming ?? true,
            ignorePatterns: config.ignorePatterns ?? [],
        };
    }
    /**
     * Start monitoring network requests
     */
    start() {
        if (typeof window === 'undefined')
            return;
        this.interceptFetch();
        this.interceptXHR();
        this.observePerformance();
        this.isRecording = true;
    }
    /**
     * Stop monitoring
     */
    stop() {
        this.restoreFetch();
        this.restoreXHR();
        this.isRecording = false;
    }
    /**
     * Clear recorded requests
     */
    clear() {
        this.requests.clear();
        this.requestCounter = 0;
    }
    /**
     * Get all requests
     */
    getRequests() {
        return Array.from(this.requests.values());
    }
    /**
     * Get request by ID
     */
    getRequest(id) {
        return this.requests.get(id);
    }
    /**
     * Get network statistics
     */
    getStats() {
        const requests = this.getRequests();
        const byType = {};
        let totalSize = 0;
        let totalTime = 0;
        let cachedRequests = 0;
        let totalCompressedSize = 0;
        for (const req of requests) {
            // Accumulate totals
            totalSize += req.size;
            totalTime += req.duration;
            if (req.cached)
                cachedRequests++;
            if (req.compressedSize)
                totalCompressedSize += req.compressedSize;
            // Group by type
            if (!byType[req.type]) {
                byType[req.type] = { count: 0, size: 0, time: 0 };
            }
            byType[req.type].count++;
            byType[req.type].size += req.size;
            byType[req.type].time += req.duration;
        }
        // Get slowest requests
        const slowestRequests = [...requests]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10);
        // Get largest requests
        const largestRequests = [...requests]
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);
        // Get failed requests
        const failedRequests = requests.filter(r => r.status >= 400 || r.error);
        return {
            totalRequests: requests.length,
            totalSize,
            totalTime,
            byType,
            slowestRequests,
            largestRequests,
            failedRequests,
            cachedRequests,
            compressionRatio: totalCompressedSize > 0 ? totalSize / totalCompressedSize : 1,
        };
    }
    /**
     * Add a listener for new requests
     */
    onRequest(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    /**
     * Filter requests
     */
    filterRequests(filter) {
        return this.getRequests().filter(req => {
            if (filter.type && req.type !== filter.type)
                return false;
            if (filter.status === 'success' && (req.status < 200 || req.status >= 400))
                return false;
            if (filter.status === 'error' && req.status < 400)
                return false;
            if (filter.search && !req.url.toLowerCase().includes(filter.search.toLowerCase()))
                return false;
            if (filter.minSize && req.size < filter.minSize)
                return false;
            if (filter.maxSize && req.size > filter.maxSize)
                return false;
            if (filter.minDuration && req.duration < filter.minDuration)
                return false;
            if (filter.maxDuration && req.duration > filter.maxDuration)
                return false;
            return true;
        });
    }
    /**
     * Export requests as HAR
     */
    exportAsHAR() {
        const requests = this.getRequests();
        return {
            log: {
                version: '1.2',
                creator: {
                    name: 'PhilJS DevTools',
                    version: '1.0.0',
                },
                entries: requests.map(req => ({
                    startedDateTime: new Date(req.startTime).toISOString(),
                    time: req.duration,
                    request: {
                        method: req.method,
                        url: req.url,
                        httpVersion: 'HTTP/1.1',
                        headers: Object.entries(req.headers).map(([name, value]) => ({ name, value })),
                    },
                    response: {
                        status: req.status,
                        statusText: req.statusText,
                        httpVersion: 'HTTP/1.1',
                        headers: Object.entries(req.responseHeaders).map(([name, value]) => ({ name, value })),
                        content: {
                            size: req.size,
                            compression: req.compressedSize ? req.size - req.compressedSize : 0,
                        },
                    },
                    cache: {
                        beforeRequest: null,
                        afterRequest: req.cached ? {} : null,
                    },
                    timings: req.timing ? {
                        dns: req.timing.dns,
                        connect: req.timing.connect,
                        ssl: req.timing.ssl,
                        send: 0,
                        wait: req.timing.ttfb,
                        receive: req.timing.download,
                    } : undefined,
                })),
            },
        };
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    interceptFetch() {
        if (typeof fetch === 'undefined')
            return;
        this.originalFetch = fetch;
        const monitor = this;
        window.fetch = async function (input, init) {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            // Check ignore patterns
            if (monitor.config.ignorePatterns.some(p => p.test(url))) {
                return monitor.originalFetch(input, init);
            }
            const id = `fetch-${++monitor.requestCounter}`;
            const startTime = performance.now();
            const request = {
                id,
                url,
                method: init?.method || 'GET',
                type: 'fetch',
                initiator: new Error().stack?.split('\n')[2] || 'unknown',
                startTime,
                headers: {},
                cached: false,
                priority: 'medium',
            };
            // Capture request headers
            if (monitor.config.captureHeaders && init?.headers) {
                const headers = new Headers(init.headers);
                headers.forEach((value, key) => {
                    request.headers[key] = value;
                });
            }
            try {
                const response = await monitor.originalFetch(input, init);
                const endTime = performance.now();
                request.endTime = endTime;
                request.duration = endTime - startTime;
                request.status = response.status;
                request.statusText = response.statusText;
                // Capture response headers
                if (monitor.config.captureHeaders) {
                    request.responseHeaders = {};
                    response.headers.forEach((value, key) => {
                        request.responseHeaders[key] = value;
                    });
                }
                // Get size from Content-Length or blob
                const contentLength = response.headers.get('content-length');
                if (contentLength) {
                    request.size = parseInt(contentLength);
                }
                // Check if cached
                request.cached = response.headers.get('x-cache')?.includes('HIT') || false;
                monitor.addRequest(request);
                return response;
            }
            catch (error) {
                const endTime = performance.now();
                request.endTime = endTime;
                request.duration = endTime - startTime;
                request.status = 0;
                request.statusText = 'Failed';
                request.error = error.message;
                request.size = 0;
                request.responseHeaders = {};
                monitor.addRequest(request);
                throw error;
            }
        };
    }
    restoreFetch() {
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
            this.originalFetch = null;
        }
    }
    interceptXHR() {
        if (typeof XMLHttpRequest === 'undefined')
            return;
        this.originalXHROpen = XMLHttpRequest.prototype.open;
        this.originalXHRSend = XMLHttpRequest.prototype.send;
        const monitor = this;
        XMLHttpRequest.prototype.open = function (method, url) {
            this.__philjs_request = {
                method,
                url: url.toString(),
                type: 'xhr',
            };
            return monitor.originalXHROpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function (body) {
            const xhr = this;
            const req = xhr.__philjs_request;
            if (!req || monitor.config.ignorePatterns.some(p => p.test(req.url))) {
                return monitor.originalXHRSend.apply(xhr, arguments);
            }
            const id = `xhr-${++monitor.requestCounter}`;
            const startTime = performance.now();
            const request = {
                id,
                url: req.url,
                method: req.method,
                type: 'xhr',
                initiator: 'XMLHttpRequest',
                startTime,
                headers: {},
                responseHeaders: {},
                cached: false,
                priority: 'medium',
            };
            xhr.addEventListener('loadend', () => {
                const endTime = performance.now();
                request.endTime = endTime;
                request.duration = endTime - startTime;
                request.status = xhr.status;
                request.statusText = xhr.statusText;
                request.size = parseInt(xhr.getResponseHeader('content-length') || '0');
                if (monitor.config.captureHeaders) {
                    const headers = xhr.getAllResponseHeaders();
                    headers.split('\r\n').forEach(line => {
                        const [key, value] = line.split(': ');
                        if (key && value) {
                            request.responseHeaders[key] = value;
                        }
                    });
                }
                monitor.addRequest(request);
            });
            xhr.addEventListener('error', () => {
                const endTime = performance.now();
                request.endTime = endTime;
                request.duration = endTime - startTime;
                request.status = 0;
                request.statusText = 'Failed';
                request.error = 'Network error';
                request.size = 0;
                monitor.addRequest(request);
            });
            return monitor.originalXHRSend.apply(xhr, arguments);
        };
    }
    restoreXHR() {
        if (this.originalXHROpen) {
            XMLHttpRequest.prototype.open = this.originalXHROpen;
            this.originalXHROpen = null;
        }
        if (this.originalXHRSend) {
            XMLHttpRequest.prototype.send = this.originalXHRSend;
            this.originalXHRSend = null;
        }
    }
    observePerformance() {
        if (typeof PerformanceObserver === 'undefined')
            return;
        const observer = new PerformanceObserver((list) => {
            if (!this.isRecording)
                return;
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'resource') {
                    const resource = entry;
                    // Skip if already captured by fetch/xhr
                    const existingRequest = Array.from(this.requests.values()).find(r => r.url === resource.name && Math.abs(r.startTime - resource.startTime) < 100);
                    if (existingRequest) {
                        // Add timing info
                        if (this.config.captureTiming) {
                            existingRequest.timing = {
                                dns: resource.domainLookupEnd - resource.domainLookupStart,
                                connect: resource.connectEnd - resource.connectStart,
                                ssl: resource.secureConnectionStart > 0
                                    ? resource.connectEnd - resource.secureConnectionStart
                                    : 0,
                                ttfb: resource.responseStart - resource.requestStart,
                                download: resource.responseEnd - resource.responseStart,
                                total: resource.duration,
                            };
                        }
                    }
                    else {
                        // Create new request for resources
                        this.addRequest({
                            id: `resource-${++this.requestCounter}`,
                            url: resource.name,
                            method: 'GET',
                            status: 200,
                            statusText: 'OK',
                            type: this.inferResourceType(resource),
                            initiator: resource.initiatorType,
                            startTime: resource.startTime,
                            endTime: resource.startTime + resource.duration,
                            duration: resource.duration,
                            size: resource.transferSize || resource.encodedBodySize || 0,
                            ...(resource.encodedBodySize ? { compressedSize: resource.encodedBodySize } : {}),
                            headers: {},
                            responseHeaders: {},
                            ...(this.config.captureTiming ? { timing: {
                                    dns: resource.domainLookupEnd - resource.domainLookupStart,
                                    connect: resource.connectEnd - resource.connectStart,
                                    ssl: resource.secureConnectionStart > 0
                                        ? resource.connectEnd - resource.secureConnectionStart
                                        : 0,
                                    ttfb: resource.responseStart - resource.requestStart,
                                    download: resource.responseEnd - resource.responseStart,
                                    total: resource.duration,
                                } } : {}),
                            cached: resource.transferSize === 0,
                            priority: 'medium',
                        });
                    }
                }
            }
        });
        observer.observe({ entryTypes: ['resource'] });
    }
    inferResourceType(resource) {
        const url = resource.name.toLowerCase();
        const initiator = resource.initiatorType;
        if (initiator === 'script' || url.endsWith('.js'))
            return 'script';
        if (initiator === 'link' || url.endsWith('.css'))
            return 'stylesheet';
        if (initiator === 'img' || /\.(png|jpg|jpeg|gif|webp|svg|ico)/.test(url))
            return 'image';
        if (/\.(woff2?|ttf|otf|eot)/.test(url))
            return 'font';
        if (initiator === 'xmlhttprequest')
            return 'xhr';
        if (initiator === 'fetch')
            return 'fetch';
        return 'other';
    }
    addRequest(request) {
        if (!this.isRecording)
            return;
        // Enforce max requests limit
        if (this.requests.size >= this.config.maxRequests) {
            const oldest = this.getRequests()[0];
            if (oldest) {
                this.requests.delete(oldest.id);
            }
        }
        this.requests.set(request.id, request);
        // Notify listeners
        for (const listener of this.listeners) {
            listener(request);
        }
    }
}
/**
 * Create a network monitor instance
 */
export function createNetworkMonitor(config) {
    return new NetworkMonitor(config);
}
//# sourceMappingURL=index.js.map