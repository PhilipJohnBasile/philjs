/**
 * Error Tracking Module
 * Captures errors, parses stack traces, supports source maps, and groups errors
 */
// ============================================================================
// Stack Trace Parser
// ============================================================================
const CHROME_STACK_REGEX = /^\s*at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|([^)]+))\)?$/;
const FIREFOX_STACK_REGEX = /^(.*)@(.+?):(\d+):(\d+)$/;
const SAFARI_STACK_REGEX = /^(.*)@(.+?):(\d+):(\d+)$/;
export function parseStackTrace(error, inAppPatterns = []) {
    const stack = error.stack || '';
    const lines = stack.split('\n');
    const frames = [];
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === `${error.name}: ${error.message}`) {
            continue;
        }
        let match = null;
        let functionName = null;
        let fileName = null;
        let lineNumber = null;
        let columnNumber = null;
        // Try Chrome format
        match = trimmedLine.match(CHROME_STACK_REGEX);
        if (match) {
            functionName = match[1] || null;
            fileName = match[2] || match[5] || null;
            lineNumber = match[3] ? parseInt(match[3], 10) : null;
            columnNumber = match[4] ? parseInt(match[4], 10) : null;
        }
        // Try Firefox/Safari format
        if (!match) {
            match = trimmedLine.match(FIREFOX_STACK_REGEX) || trimmedLine.match(SAFARI_STACK_REGEX);
            if (match) {
                functionName = match[1] || null;
                fileName = match[2] || null;
                lineNumber = match[3] ? parseInt(match[3], 10) : null;
                columnNumber = match[4] ? parseInt(match[4], 10) : null;
            }
        }
        if (fileName) {
            const isInApp = inAppPatterns.length === 0 || inAppPatterns.some((pattern) => {
                if (typeof pattern === 'string') {
                    return fileName?.includes(pattern);
                }
                return pattern.test(fileName || '');
            });
            frames.push({
                functionName,
                fileName,
                lineNumber,
                columnNumber,
                inApp: isInApp,
            });
        }
    }
    return frames;
}
export function parseError(error, inAppPatterns = []) {
    return {
        name: error.name || 'Error',
        message: error.message || 'Unknown error',
        stack: parseStackTrace(error, inAppPatterns),
        rawStack: error.stack || '',
        originalError: error,
    };
}
// ============================================================================
// Source Map Support
// ============================================================================
export class SourceMapResolver {
    sourceMapCache = new Map();
    sourceMapUrls;
    constructor(sourceMapUrls = {}) {
        this.sourceMapUrls = sourceMapUrls;
    }
    async loadSourceMap(fileUrl) {
        if (this.sourceMapCache.has(fileUrl)) {
            return this.sourceMapCache.get(fileUrl) || null;
        }
        const sourceMapUrl = this.sourceMapUrls[fileUrl] || `${fileUrl}.map`;
        try {
            const response = await fetch(sourceMapUrl);
            if (!response.ok) {
                return null;
            }
            const rawSourceMap = await response.json();
            const { SourceMapConsumer: SMC } = await import('source-map');
            const consumer = await new SMC(rawSourceMap);
            this.sourceMapCache.set(fileUrl, consumer);
            return consumer;
        }
        catch {
            return null;
        }
    }
    async resolveFrame(frame) {
        if (!frame.fileName || frame.lineNumber === null) {
            return frame;
        }
        const consumer = await this.loadSourceMap(frame.fileName);
        if (!consumer) {
            return frame;
        }
        const position = consumer.originalPositionFor({
            line: frame.lineNumber,
            column: frame.columnNumber || 0,
        });
        if (!position.source) {
            return frame;
        }
        return {
            ...frame,
            functionName: position.name || frame.functionName,
            fileName: position.source,
            lineNumber: position.line,
            columnNumber: position.column,
        };
    }
    async resolveStackTrace(frames) {
        return Promise.all(frames.map((frame) => this.resolveFrame(frame)));
    }
    destroy() {
        this.sourceMapCache.forEach((consumer) => {
            if ('destroy' in consumer && typeof consumer.destroy === 'function') {
                consumer.destroy();
            }
        });
        this.sourceMapCache.clear();
    }
}
// ============================================================================
// Error Fingerprinting
// ============================================================================
export function generateErrorFingerprint(error) {
    const parts = [error.name];
    // Use the first in-app frame for fingerprinting
    const inAppFrame = error.stack.find((frame) => frame.inApp);
    if (inAppFrame) {
        if (inAppFrame.fileName) {
            parts.push(inAppFrame.fileName);
        }
        if (inAppFrame.functionName) {
            parts.push(inAppFrame.functionName);
        }
        if (inAppFrame.lineNumber !== null) {
            parts.push(String(inAppFrame.lineNumber));
        }
    }
    else if (error.stack.length > 0) {
        // Fallback to first frame
        const firstFrame = error.stack[0];
        if (firstFrame.fileName) {
            parts.push(firstFrame.fileName);
        }
        if (firstFrame.lineNumber !== null) {
            parts.push(String(firstFrame.lineNumber));
        }
    }
    // Normalize message (remove variable parts)
    const normalizedMessage = error.message
        .replace(/\d+/g, '<number>')
        .replace(/'[^']*'/g, '<string>')
        .replace(/"[^"]*"/g, '<string>')
        .substring(0, 100);
    parts.push(normalizedMessage);
    // Create hash
    const str = parts.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
// ============================================================================
// Error Tracker
// ============================================================================
export class ErrorTracker {
    config;
    errors = [];
    breadcrumbs = [];
    errorGroups = new Map();
    sourceMapResolver = null;
    user;
    release;
    environment;
    traceId;
    spanId;
    constructor(config = {}) {
        this.config = {
            maxBreadcrumbs: config.maxBreadcrumbs ?? 50,
            maxErrors: config.maxErrors ?? 100,
            ignorePatterns: config.ignorePatterns ?? [],
            inAppPatterns: config.inAppPatterns ?? [],
            sampleRate: config.sampleRate ?? 1,
            attachSourceMaps: config.attachSourceMaps ?? false,
            sourceMapUrls: config.sourceMapUrls ?? {},
            onError: config.onError ?? (() => { }),
            captureGlobalErrors: config.captureGlobalErrors ?? true,
            captureUnhandledRejections: config.captureUnhandledRejections ?? true,
            captureConsoleErrors: config.captureConsoleErrors ?? false,
        };
        if (this.config.attachSourceMaps) {
            this.sourceMapResolver = new SourceMapResolver(this.config.sourceMapUrls);
        }
        if (typeof window !== 'undefined') {
            this.setupGlobalHandlers();
        }
    }
    /**
     * Set user information
     */
    setUser(user) {
        this.user = user;
    }
    /**
     * Set release version
     */
    setRelease(release) {
        this.release = release;
    }
    /**
     * Set environment
     */
    setEnvironment(environment) {
        this.environment = environment;
    }
    /**
     * Set trace context
     */
    setTraceContext(traceId, spanId) {
        this.traceId = traceId;
        this.spanId = spanId;
    }
    /**
     * Add a breadcrumb
     */
    addBreadcrumb(breadcrumb) {
        const crumb = {
            ...breadcrumb,
            timestamp: Date.now(),
        };
        this.breadcrumbs.push(crumb);
        if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
            this.breadcrumbs.shift();
        }
    }
    /**
     * Capture an error
     */
    async captureError(error, context = {}, tags = {}) {
        if (!this.shouldCapture(error)) {
            return null;
        }
        let parsedError = parseError(error, this.config.inAppPatterns);
        // Resolve source maps if configured
        if (this.sourceMapResolver) {
            parsedError = {
                ...parsedError,
                stack: await this.sourceMapResolver.resolveStackTrace(parsedError.stack),
            };
        }
        const fingerprint = generateErrorFingerprint(parsedError);
        const capturedError = {
            id: this.generateId(),
            fingerprint,
            timestamp: Date.now(),
            error: parsedError,
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            breadcrumbs: [...this.breadcrumbs],
            context,
            tags,
        };
        if (this.user !== undefined)
            capturedError.user = this.user;
        if (this.release !== undefined)
            capturedError.release = this.release;
        if (this.environment !== undefined)
            capturedError.environment = this.environment;
        if (this.traceId !== undefined)
            capturedError.traceId = this.traceId;
        if (this.spanId !== undefined)
            capturedError.spanId = this.spanId;
        this.errors.push(capturedError);
        this.updateErrorGroup(capturedError);
        if (this.errors.length > this.config.maxErrors) {
            this.errors.shift();
        }
        this.config.onError(capturedError);
        return capturedError;
    }
    /**
     * Capture a message as an error
     */
    async captureMessage(message, level = 'info', context = {}, tags = {}) {
        const error = new Error(message);
        error.name = level.charAt(0).toUpperCase() + level.slice(1);
        return this.captureError(error, context, tags);
    }
    /**
     * Get all captured errors
     */
    getErrors() {
        return [...this.errors];
    }
    /**
     * Get error by ID
     */
    getError(id) {
        return this.errors.find((e) => e.id === id);
    }
    /**
     * Get all error groups
     */
    getErrorGroups() {
        return Array.from(this.errorGroups.values());
    }
    /**
     * Get errors in a group
     */
    getGroupErrors(fingerprint) {
        return this.errors.filter((e) => e.fingerprint === fingerprint);
    }
    /**
     * Clear all errors
     */
    clear() {
        this.errors = [];
        this.breadcrumbs = [];
        this.errorGroups.clear();
    }
    /**
     * Destroy the tracker
     */
    destroy() {
        this.clear();
        if (this.sourceMapResolver) {
            this.sourceMapResolver.destroy();
        }
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    shouldCapture(error) {
        if (Math.random() >= this.config.sampleRate) {
            return false;
        }
        const message = error.message || '';
        for (const pattern of this.config.ignorePatterns) {
            if (typeof pattern === 'string') {
                if (message.includes(pattern)) {
                    return false;
                }
            }
            else if (pattern.test(message)) {
                return false;
            }
        }
        return true;
    }
    updateErrorGroup(error) {
        const existing = this.errorGroups.get(error.fingerprint);
        if (existing) {
            existing.count++;
            existing.lastSeen = error.timestamp;
            existing.errorIds.push(error.id);
            if (error.user?.id && !existing.affectedUserIds.has(error.user.id)) {
                existing.affectedUserIds.add(error.user.id);
                existing.usersAffected = existing.affectedUserIds.size;
            }
            // Keep only recent error IDs
            if (existing.errorIds.length > 10) {
                existing.errorIds.shift();
            }
        }
        else {
            const affectedUserIds = new Set();
            if (error.user?.id) {
                affectedUserIds.add(error.user.id);
            }
            this.errorGroups.set(error.fingerprint, {
                fingerprint: error.fingerprint,
                name: error.error.name,
                message: error.error.message,
                count: 1,
                firstSeen: error.timestamp,
                lastSeen: error.timestamp,
                errorIds: [error.id],
                usersAffected: affectedUserIds.size,
                affectedUserIds,
            });
        }
    }
    setupGlobalHandlers() {
        if (this.config.captureGlobalErrors) {
            window.addEventListener('error', (event) => {
                if (event.error) {
                    const errorContext = {};
                    if (event.target instanceof Element) {
                        errorContext.element = event.target.outerHTML.substring(0, 200);
                    }
                    this.captureError(event.error, errorContext);
                }
            });
        }
        if (this.config.captureUnhandledRejections) {
            window.addEventListener('unhandledrejection', (event) => {
                const error = event.reason instanceof Error
                    ? event.reason
                    : new Error(String(event.reason));
                error.name = 'UnhandledPromiseRejection';
                this.captureError(error);
            });
        }
        if (this.config.captureConsoleErrors) {
            const originalConsoleError = console.error;
            console.error = (...args) => {
                const error = args.find((arg) => arg instanceof Error);
                if (error) {
                    this.captureError(error);
                }
                else {
                    this.captureMessage(args.map(String).join(' '), 'error');
                }
                originalConsoleError.apply(console, args);
            };
        }
        // Auto-breadcrumbs for navigation
        window.addEventListener('popstate', () => {
            this.addBreadcrumb({
                type: 'navigation',
                category: 'navigation',
                message: `Navigated to ${window.location.href}`,
                level: 'info',
            });
        });
        // Auto-breadcrumbs for clicks
        document.addEventListener('click', (event) => {
            const target = event.target;
            const selector = this.getElementSelector(target);
            this.addBreadcrumb({
                type: 'click',
                category: 'ui',
                message: `Clicked on ${selector}`,
                level: 'info',
                data: {
                    selector,
                    innerText: target.textContent?.substring(0, 50),
                },
            });
        }, { capture: true });
    }
    getElementSelector(element) {
        const parts = [];
        if (element.id) {
            return `#${element.id}`;
        }
        const tagName = element.tagName.toLowerCase();
        parts.push(tagName);
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(/\s+/).filter(Boolean).slice(0, 2);
            if (classes.length > 0) {
                parts.push(`.${classes.join('.')}`);
            }
        }
        return parts.join('');
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
let defaultTracker = null;
export function getErrorTracker(config) {
    if (!defaultTracker) {
        defaultTracker = new ErrorTracker(config);
    }
    return defaultTracker;
}
export function initErrorTracking(config) {
    if (defaultTracker) {
        console.warn('[ErrorTracker] Already initialized, returning existing instance');
        return defaultTracker;
    }
    defaultTracker = new ErrorTracker(config);
    return defaultTracker;
}
export function resetErrorTracking() {
    if (defaultTracker) {
        defaultTracker.destroy();
        defaultTracker = null;
    }
}
export function captureReactError(error, errorInfo, componentName) {
    const tracker = getErrorTracker();
    const errorContext = {
        componentStack: errorInfo.componentStack,
    };
    if (componentName !== undefined) {
        errorContext.componentName = componentName;
    }
    return tracker.captureError(error, errorContext);
}
//# sourceMappingURL=errors.js.map