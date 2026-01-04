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
import { type Signal } from './signals.js';
export interface ErrorTrackingOptions {
    /**
     * Enable error tracking
     */
    enabled?: boolean;
    /**
     * Error tracking service
     */
    service?: 'sentry' | 'bugsnag' | 'rollbar' | 'custom';
    /**
     * DSN/API key for the service
     */
    dsn?: string;
    /**
     * Environment (development, staging, production)
     */
    environment?: string;
    /**
     * Release/version
     */
    release?: string;
    /**
     * Sample rate (0-1)
     */
    sampleRate?: number;
    /**
     * Ignore errors matching these patterns
     */
    ignoreErrors?: (string | RegExp)[];
    /**
     * Allow URLs for source maps
     */
    allowUrls?: string[];
    /**
     * Before send hook
     */
    beforeSend?: (error: ErrorEvent) => ErrorEvent | null;
    /**
     * Custom error handler
     */
    onError?: (error: ErrorEvent) => void;
    /**
     * Enable breadcrumbs
     */
    breadcrumbs?: boolean;
    /**
     * Max breadcrumbs
     */
    maxBreadcrumbs?: number;
}
export interface ErrorEvent {
    /**
     * Error message
     */
    message: string;
    /**
     * Error stack trace
     */
    stack?: string;
    /**
     * Error type
     */
    type: string;
    /**
     * Timestamp
     */
    timestamp: number;
    /**
     * User context
     */
    user?: UserContext;
    /**
     * Tags
     */
    tags?: Record<string, string>;
    /**
     * Extra data
     */
    extra?: Record<string, unknown>;
    /**
     * Breadcrumbs
     */
    breadcrumbs?: Breadcrumb[];
    /**
     * Request context
     */
    request?: RequestContext;
    /**
     * Component stack
     */
    componentStack?: string;
    /**
     * Error level
     */
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}
export interface UserContext {
    id?: string;
    email?: string;
    username?: string;
    ipAddress?: string;
    [key: string]: string | undefined;
}
export interface Breadcrumb {
    type: 'navigation' | 'http' | 'console' | 'user' | 'error' | 'default';
    category: string;
    message: string;
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    timestamp: number;
    data?: Record<string, unknown>;
}
export interface RequestContext {
    url: string;
    method: string;
    headers?: Record<string, string>;
    data?: unknown;
}
export interface ErrorStats {
    total: number;
    byType: Record<string, number>;
    byLevel: Record<string, number>;
    recent: ErrorEvent[];
}
export declare class ErrorTracker {
    private options;
    private breadcrumbs;
    private user;
    private tags;
    private context;
    private errors;
    errorCount: Signal<number>;
    lastError: Signal<ErrorEvent | null>;
    constructor(options?: ErrorTrackingOptions);
    /**
     * Initialize error tracking
     */
    private init;
    /**
     * Initialize error tracking service
     */
    private initService;
    /**
     * Initialize Sentry
     */
    private initSentry;
    /**
     * Initialize Bugsnag
     */
    private initBugsnag;
    /**
     * Initialize Rollbar
     */
    private initRollbar;
    /**
     * Capture error
     */
    captureError(error: Error | string, context?: Partial<ErrorEvent>): void;
    /**
     * Capture exception
     */
    captureException(error: Error, context?: Partial<ErrorEvent>): void;
    /**
     * Capture message
     */
    captureMessage(message: string, level?: ErrorEvent['level'], context?: Partial<ErrorEvent>): void;
    /**
     * Add breadcrumb
     */
    addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
    /**
     * Set user context
     */
    setUser(user: UserContext | null): void;
    /**
     * Set tag
     */
    setTag(key: string, value: string): void;
    /**
     * Set context
     */
    setContext(key: string, value: unknown): void;
    /**
     * Check if error should be ignored
     */
    private shouldIgnore;
    /**
     * Send error to service
     */
    private sendToService;
    /**
     * Get error statistics
     */
    getStats(): ErrorStats;
    /**
     * Get all errors
     */
    getErrors(): ErrorEvent[];
    /**
     * Clear errors
     */
    clear(): void;
}
/**
 * Initialize error tracking
 */
export declare function initErrorTracking(options?: ErrorTrackingOptions): ErrorTracker;
/**
 * Get error tracker
 */
export declare function getErrorTracker(): ErrorTracker;
/**
 * Capture error
 */
export declare function captureError(error: Error | string, context?: Partial<ErrorEvent>): void;
/**
 * Capture exception
 */
export declare function captureException(error: Error, context?: Partial<ErrorEvent>): void;
/**
 * Capture message
 */
export declare function captureMessage(message: string, level?: ErrorEvent['level'], context?: Partial<ErrorEvent>): void;
/**
 * Add breadcrumb
 */
export declare function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
/**
 * Set user context
 */
export declare function setUser(user: UserContext | null): void;
/**
 * Set tag
 */
export declare function setTag(key: string, value: string): void;
/**
 * Set context
 */
export declare function setContext(key: string, value: unknown): void;
/**
 * Get error statistics
 */
export declare function getErrorStats(): ErrorStats;
/**
 * Wrap async function with error tracking
 */
export declare function withErrorTracking<T extends (...args: unknown[]) => unknown>(fn: T, context?: Partial<ErrorEvent>): T;
/** Error info from component error boundaries */
interface ErrorBoundaryInfo {
    componentStack?: string;
}
/**
 * Error boundary hook
 */
export declare function useErrorBoundary(componentName: string): {
    onError: (error: Error, errorInfo: ErrorBoundaryInfo) => void;
};
export {};
//# sourceMappingURL=error-tracking.d.ts.map