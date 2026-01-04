/**
 * PhilJS Error Tracking
 *
 * Unified error tracking and monitoring for PhilJS applications.
 * Supports Sentry, LogRocket, Rollbar, and custom integrations.
 */
export interface ErrorContext {
    /** Component name where error occurred */
    component?: string;
    /** Signal name if error is signal-related */
    signal?: string;
    /** Route path */
    route?: string;
    /** User ID */
    userId?: string;
    /** Additional tags */
    tags?: Record<string, string>;
    /** Extra data */
    extra?: Record<string, unknown>;
}
export interface ErrorTracker {
    /** Initialize the tracker */
    init(options: TrackerOptions): void;
    /** Capture an error */
    captureError(error: Error, context?: ErrorContext): void;
    /** Capture a message */
    captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext): void;
    /** Set user context */
    setUser(user: UserContext | null): void;
    /** Add breadcrumb */
    addBreadcrumb(breadcrumb: Breadcrumb): void;
    /** Start a transaction/span */
    startSpan(name: string, op: string): Span;
    /** Flush pending events */
    flush(timeout?: number): Promise<boolean>;
}
export interface TrackerOptions {
    /** DSN or API key */
    dsn: string;
    /** Environment name */
    environment?: string;
    /** Release version */
    release?: string;
    /** Sample rate (0-1) */
    sampleRate?: number;
    /** Enable debug mode */
    debug?: boolean;
    /** Ignored errors */
    ignoreErrors?: (string | RegExp)[];
    /** Before send hook */
    beforeSend?: (event: ErrorEvent) => ErrorEvent | null;
}
export interface UserContext {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: unknown;
}
export interface Breadcrumb {
    type?: 'navigation' | 'http' | 'ui' | 'user' | 'debug' | 'error';
    category?: string;
    message?: string;
    data?: Record<string, unknown>;
    level?: 'info' | 'warning' | 'error' | 'debug';
    timestamp?: number;
}
export interface Span {
    name: string;
    op: string;
    finish(): void;
    setTag(key: string, value: string): void;
    setData(key: string, value: unknown): void;
}
export interface ErrorEvent {
    message?: string;
    error?: Error;
    context?: ErrorContext;
    timestamp: number;
    level: 'info' | 'warning' | 'error' | 'fatal';
}
/**
 * Initialize error tracking
 */
export declare function initErrorTracking(tracker: ErrorTracker, options: TrackerOptions): void;
/**
 * Get the current error tracker
 */
export declare function getErrorTracker(): ErrorTracker | null;
/**
 * Capture an error
 */
export declare function captureError(error: Error, context?: ErrorContext): void;
/**
 * Capture a message
 */
export declare function captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext): void;
/**
 * Set user context
 */
export declare function setUser(user: UserContext | null): void;
/**
 * Add breadcrumb
 */
export declare function addBreadcrumb(breadcrumb: Breadcrumb): void;
/**
 * Create an error boundary wrapper
 */
export declare function createErrorBoundary(options: {
    fallback?: (error: Error) => any;
    onError?: (error: Error, context: ErrorContext) => void;
    componentName?: string;
}): (props: {
    children: any;
}) => {
    type: string;
    props: {
        children: any;
        fallback?: (error: Error) => any;
        onError?: (error: Error, context: ErrorContext) => void;
        componentName?: string;
    };
};
/**
 * Performance monitoring
 */
export declare function startSpan(name: string, op: string): Span;
/**
 * Wrap an async function with error tracking
 */
export declare function withErrorTracking<T extends (...args: any[]) => Promise<any>>(fn: T, context?: ErrorContext): T;
/**
 * Signal error wrapper
 */
export declare function trackSignalErrors<T>(signalName: string, getValue: () => T): () => T;
export { createSentryTracker } from './sentry.js';
export { createLogRocketTracker } from './logrocket.js';
export { createRollbarTracker } from './rollbar.js';
//# sourceMappingURL=index.d.ts.map