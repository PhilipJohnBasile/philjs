/**
 * Error Tracking Integration
 *
 * Comprehensive error tracking and monitoring:
 * - Automatic error capture
 * - Integration with Sentry, Bugsnag, Rollbar, etc.
 * - Custom error boundaries
 * - Source map support
 * - User context and breadcrumbs
 * - Performance impact tracking
 */
import { signal } from './signals.js';
// ============================================================================
// Error Tracker
// ============================================================================
export class ErrorTracker {
    options;
    breadcrumbs = [];
    user = null;
    tags = new Map();
    context = new Map();
    errors = [];
    errorCount = signal(0);
    lastError = signal(null);
    constructor(options = {}) {
        this.options = {
            enabled: true,
            breadcrumbs: true,
            maxBreadcrumbs: 100,
            sampleRate: 1.0,
            environment: 'production',
            ignoreErrors: [],
            ...options,
        };
        if (this.options.enabled) {
            this.init();
        }
    }
    /**
     * Initialize error tracking
     */
    init() {
        if (typeof window === 'undefined')
            return;
        // Global error handler
        window.addEventListener('error', (event) => {
            this.captureError(event.error, {
                type: 'uncaught',
                message: event.message,
                stack: event.error?.stack,
            });
        });
        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError(event.reason, {
                type: 'unhandledrejection',
                message: String(event.reason),
            });
        });
        // Initialize service integration
        this.initService();
    }
    /**
     * Initialize error tracking service
     */
    initService() {
        const { service, dsn } = this.options;
        if (!service || !dsn)
            return;
        switch (service) {
            case 'sentry':
                this.initSentry();
                break;
            case 'bugsnag':
                this.initBugsnag();
                break;
            case 'rollbar':
                this.initRollbar();
                break;
        }
    }
    /**
     * Initialize Sentry
     */
    initSentry() {
        if (typeof window === 'undefined')
            return;
        const win = window;
        if (!win.Sentry)
            return;
        win.Sentry.init({
            dsn: this.options.dsn,
            environment: this.options.environment,
            release: this.options.release,
            sampleRate: this.options.sampleRate,
            ignoreErrors: this.options.ignoreErrors,
            beforeSend: this.options.beforeSend,
        });
    }
    /**
     * Initialize Bugsnag
     */
    initBugsnag() {
        if (typeof window === 'undefined')
            return;
        const win = window;
        if (!win.Bugsnag)
            return;
        win.Bugsnag.start({
            apiKey: this.options.dsn,
            releaseStage: this.options.environment,
            appVersion: this.options.release,
        });
    }
    /**
     * Initialize Rollbar
     */
    initRollbar() {
        if (typeof window === 'undefined')
            return;
        const win = window;
        if (!win.Rollbar)
            return;
        win.Rollbar.init({
            accessToken: this.options.dsn,
            captureUncaught: true,
            captureUnhandledRejections: true,
            payload: {
                environment: this.options.environment,
                client: {
                    javascript: {
                        code_version: this.options.release,
                    },
                },
            },
        });
    }
    /**
     * Capture error
     */
    captureError(error, context) {
        // Sample check
        if (Math.random() > (this.options.sampleRate || 1)) {
            return;
        }
        const errorObj = error instanceof Error ? error : new Error(String(error));
        // Check ignore patterns
        if (this.shouldIgnore(errorObj.message)) {
            return;
        }
        const errorEvent = {
            message: errorObj.message,
            ...(errorObj.stack != null && { stack: errorObj.stack }),
            type: context?.type || 'Error',
            timestamp: Date.now(),
            tags: Object.fromEntries(this.tags),
            extra: Object.fromEntries(this.context),
            breadcrumbs: this.breadcrumbs.slice(-20),
            level: context?.level || 'error',
            ...(this.user != null && { user: this.user }),
            ...(context?.user != null && { user: context.user }),
            ...(context?.request != null && { request: context.request }),
            ...(context?.componentStack != null && { componentStack: context.componentStack }),
        };
        // Before send hook
        if (this.options.beforeSend) {
            const modified = this.options.beforeSend(errorEvent);
            if (!modified)
                return;
            Object.assign(errorEvent, modified);
        }
        // Store error
        this.errors.push(errorEvent);
        if (this.errors.length > 100) {
            this.errors.shift();
        }
        // Update signals
        this.errorCount.set(this.errorCount() + 1);
        this.lastError.set(errorEvent);
        // Send to service
        this.sendToService(errorEvent);
        // Call custom handler
        if (this.options.onError) {
            this.options.onError(errorEvent);
        }
    }
    /**
     * Capture exception
     */
    captureException(error, context) {
        this.captureError(error, { ...context, level: 'error' });
    }
    /**
     * Capture message
     */
    captureMessage(message, level = 'info', context) {
        this.captureError(message, { ...context, level });
    }
    /**
     * Add breadcrumb
     */
    addBreadcrumb(breadcrumb) {
        if (!this.options.breadcrumbs)
            return;
        const fullBreadcrumb = {
            ...breadcrumb,
            timestamp: Date.now(),
        };
        this.breadcrumbs.push(fullBreadcrumb);
        // Limit breadcrumbs
        if (this.breadcrumbs.length > (this.options.maxBreadcrumbs || 100)) {
            this.breadcrumbs.shift();
        }
        // Send to service
        if (typeof window !== 'undefined' && this.options.service === 'sentry') {
            const win = window;
            if (win.Sentry) {
                win.Sentry.addBreadcrumb(fullBreadcrumb);
            }
        }
    }
    /**
     * Set user context
     */
    setUser(user) {
        this.user = user;
        if (typeof window === 'undefined')
            return;
        const win = window;
        if (this.options.service === 'sentry' && win.Sentry) {
            win.Sentry.setUser(user);
        }
        if (this.options.service === 'bugsnag' && win.Bugsnag) {
            win.Bugsnag.setUser(user?.id, user?.email, user?.username);
        }
    }
    /**
     * Set tag
     */
    setTag(key, value) {
        this.tags.set(key, value);
        if (typeof window !== 'undefined' && this.options.service === 'sentry') {
            const win = window;
            if (win.Sentry) {
                win.Sentry.setTag(key, value);
            }
        }
    }
    /**
     * Set context
     */
    setContext(key, value) {
        this.context.set(key, value);
        if (typeof window !== 'undefined' && this.options.service === 'sentry') {
            const win = window;
            if (win.Sentry) {
                win.Sentry.setContext(key, value);
            }
        }
    }
    /**
     * Check if error should be ignored
     */
    shouldIgnore(message) {
        const { ignoreErrors = [] } = this.options;
        return ignoreErrors.some(pattern => {
            if (typeof pattern === 'string') {
                return message.includes(pattern);
            }
            return pattern.test(message);
        });
    }
    /**
     * Send error to service
     */
    sendToService(errorEvent) {
        const { service } = this.options;
        if (!service || typeof window === 'undefined')
            return;
        const win = window;
        try {
            switch (service) {
                case 'sentry':
                    if (win.Sentry) {
                        win.Sentry.captureException(new Error(errorEvent.message), {
                            level: errorEvent.level,
                            tags: errorEvent.tags,
                            extra: errorEvent.extra,
                        });
                    }
                    break;
                case 'bugsnag':
                    if (win.Bugsnag) {
                        win.Bugsnag.notify(new Error(errorEvent.message), (event) => {
                            event.severity = errorEvent.level;
                            event.addMetadata('custom', errorEvent.extra);
                        });
                    }
                    break;
                case 'rollbar':
                    if (win.Rollbar) {
                        const level = errorEvent.level;
                        win.Rollbar[level](errorEvent.message, {
                            ...errorEvent.extra,
                            tags: errorEvent.tags,
                        });
                    }
                    break;
            }
        }
        catch (error) {
            console.error('[Error Tracking] Failed to send error:', error);
        }
    }
    /**
     * Get error statistics
     */
    getStats() {
        const byType = {};
        const byLevel = {};
        for (const error of this.errors) {
            byType[error.type] = (byType[error.type] || 0) + 1;
            byLevel[error.level] = (byLevel[error.level] || 0) + 1;
        }
        return {
            total: this.errors.length,
            byType,
            byLevel,
            recent: this.errors.slice(-10),
        };
    }
    /**
     * Get all errors
     */
    getErrors() {
        return [...this.errors];
    }
    /**
     * Clear errors
     */
    clear() {
        this.errors.length = 0;
        this.breadcrumbs.length = 0;
        this.errorCount.set(0);
        this.lastError.set(null);
    }
}
// ============================================================================
// Global Instance
// ============================================================================
let globalTracker = null;
/**
 * Initialize error tracking
 */
export function initErrorTracking(options = {}) {
    if (!globalTracker) {
        globalTracker = new ErrorTracker(options);
    }
    return globalTracker;
}
/**
 * Get error tracker
 */
export function getErrorTracker() {
    if (!globalTracker) {
        globalTracker = initErrorTracking();
    }
    return globalTracker;
}
// ============================================================================
// High-Level API
// ============================================================================
/**
 * Capture error
 */
export function captureError(error, context) {
    getErrorTracker().captureError(error, context);
}
/**
 * Capture exception
 */
export function captureException(error, context) {
    getErrorTracker().captureException(error, context);
}
/**
 * Capture message
 */
export function captureMessage(message, level, context) {
    getErrorTracker().captureMessage(message, level, context);
}
/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb) {
    getErrorTracker().addBreadcrumb(breadcrumb);
}
/**
 * Set user context
 */
export function setUser(user) {
    getErrorTracker().setUser(user);
}
/**
 * Set tag
 */
export function setTag(key, value) {
    getErrorTracker().setTag(key, value);
}
/**
 * Set context
 */
export function setContext(key, value) {
    getErrorTracker().setContext(key, value);
}
/**
 * Get error statistics
 */
export function getErrorStats() {
    return getErrorTracker().getStats();
}
/**
 * Wrap async function with error tracking
 */
export function withErrorTracking(fn, context) {
    return (async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            captureException(error, context);
            throw error;
        }
    });
}
/**
 * Error boundary hook
 */
export function useErrorBoundary(componentName) {
    return {
        onError: (error, errorInfo) => {
            captureException(error, {
                componentStack: errorInfo.componentStack,
                tags: { component: componentName },
            });
        },
    };
}
//# sourceMappingURL=error-tracking.js.map