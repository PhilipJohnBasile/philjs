/**
 * PhilJS Error Tracking
 *
 * Unified error tracking and monitoring for PhilJS applications.
 * Supports Sentry, LogRocket, Rollbar, and custom integrations.
 */
// Global error tracker instance
let globalTracker = null;
/**
 * Initialize error tracking
 */
export function initErrorTracking(tracker, options) {
    globalTracker = tracker;
    tracker.init(options);
    setupGlobalHandlers();
}
/**
 * Get the current error tracker
 */
export function getErrorTracker() {
    return globalTracker;
}
/**
 * Capture an error
 */
export function captureError(error, context) {
    if (globalTracker) {
        globalTracker.captureError(error, context);
    }
    else {
        console.error('[PhilJS Error]', error, context);
    }
}
/**
 * Capture a message
 */
export function captureMessage(message, level = 'info', context) {
    if (globalTracker) {
        globalTracker.captureMessage(message, level, context);
    }
    else {
        console.log(`[PhilJS ${level}]`, message, context);
    }
}
/**
 * Set user context
 */
export function setUser(user) {
    globalTracker?.setUser(user);
}
/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb) {
    globalTracker?.addBreadcrumb(breadcrumb);
}
/**
 * Create an error boundary wrapper
 */
export function createErrorBoundary(options) {
    return function ErrorBoundary(props) {
        // This would integrate with PhilJS's component system
        return {
            type: 'error-boundary',
            props: {
                ...options,
                children: props.children,
            },
        };
    };
}
/**
 * Setup global error handlers
 */
function setupGlobalHandlers() {
    if (typeof window === 'undefined')
        return;
    // Unhandled errors
    window.addEventListener('error', (event) => {
        captureError(event.error || new Error(event.message), {
            extra: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            },
        });
    });
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason));
        captureError(error, {
            tags: { type: 'unhandledrejection' },
        });
    });
}
/**
 * Performance monitoring
 */
export function startSpan(name, op) {
    if (globalTracker) {
        return globalTracker.startSpan(name, op);
    }
    // Fallback span
    const start = performance.now();
    return {
        name,
        op,
        finish() {
            const duration = performance.now() - start;
            console.log(`[PhilJS Span] ${name} (${op}): ${duration.toFixed(2)}ms`);
        },
        setTag() { },
        setData() { },
    };
}
/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking(fn, context) {
    return (async (...args) => {
        const span = startSpan(fn.name || 'anonymous', 'function');
        try {
            return await fn(...args);
        }
        catch (error) {
            captureError(error, context);
            throw error;
        }
        finally {
            span.finish();
        }
    });
}
/**
 * Signal error wrapper
 */
export function trackSignalErrors(signalName, getValue) {
    return () => {
        try {
            return getValue();
        }
        catch (error) {
            captureError(error, {
                signal: signalName,
                tags: { type: 'signal-error' },
            });
            throw error;
        }
    };
}
// Re-export integrations
export { createSentryTracker } from './sentry.js';
export { createLogRocketTracker } from './logrocket.js';
export { createRollbarTracker } from './rollbar.js';
//# sourceMappingURL=index.js.map