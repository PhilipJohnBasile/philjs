/**
 * Error Tracking Module
 * Captures errors, parses stack traces, supports source maps, and groups errors
 */
import type { SourceMapConsumer } from 'source-map';
export interface StackFrame {
    /** Function name */
    functionName: string | null;
    /** File name/URL */
    fileName: string | null;
    /** Line number */
    lineNumber: number | null;
    /** Column number */
    columnNumber: number | null;
    /** Source code context (if available) */
    context?: {
        pre: string[];
        line: string;
        post: string[];
    };
    /** Whether this frame is in-app code */
    inApp: boolean;
}
export interface ParsedError {
    /** Error type/name */
    name: string;
    /** Error message */
    message: string;
    /** Parsed stack frames */
    stack: StackFrame[];
    /** Raw stack trace string */
    rawStack: string;
    /** Original error object */
    originalError: Error;
}
export interface CapturedError {
    /** Unique error ID */
    id: string;
    /** Error fingerprint for grouping */
    fingerprint: string;
    /** Timestamp when captured */
    timestamp: number;
    /** Parsed error information */
    error: ParsedError;
    /** URL where error occurred */
    url: string;
    /** User agent */
    userAgent: string;
    /** Breadcrumbs leading up to the error */
    breadcrumbs: Breadcrumb[];
    /** Additional context */
    context: ErrorContext;
    /** Tags for filtering */
    tags: Record<string, string>;
    /** User information */
    user?: UserInfo;
    /** Release/version information */
    release?: string;
    /** Environment */
    environment?: string;
    /** Trace ID (if part of a trace) */
    traceId?: string;
    /** Span ID (if part of a span) */
    spanId?: string;
}
export interface Breadcrumb {
    /** Breadcrumb type */
    type: 'navigation' | 'click' | 'console' | 'xhr' | 'fetch' | 'dom' | 'custom';
    /** Category */
    category: string;
    /** Message */
    message: string;
    /** Timestamp */
    timestamp: number;
    /** Level */
    level: 'debug' | 'info' | 'warning' | 'error';
    /** Additional data */
    data?: Record<string, unknown>;
}
export interface ErrorContext {
    /** DOM element that triggered the error */
    element?: string;
    /** Component name (for React/framework errors) */
    componentName?: string;
    /** Component stack (for React errors) */
    componentStack?: string;
    /** Additional metadata */
    extra?: Record<string, unknown>;
}
export interface UserInfo {
    /** User ID */
    id?: string;
    /** Username */
    username?: string;
    /** Email */
    email?: string;
    /** IP address */
    ipAddress?: string;
}
export interface ErrorTrackerConfig {
    /** Maximum breadcrumbs to keep */
    maxBreadcrumbs?: number;
    /** Maximum errors to store */
    maxErrors?: number;
    /** Patterns to ignore (regex or string) */
    ignorePatterns?: (string | RegExp)[];
    /** Patterns to consider as in-app code */
    inAppPatterns?: (string | RegExp)[];
    /** Sample rate (0-1) */
    sampleRate?: number;
    /** Attach source maps */
    attachSourceMaps?: boolean;
    /** Source map URLs */
    sourceMapUrls?: Record<string, string>;
    /** Callback when an error is captured */
    onError?: (error: CapturedError) => void;
    /** Automatic global error handling */
    captureGlobalErrors?: boolean;
    /** Capture unhandled promise rejections */
    captureUnhandledRejections?: boolean;
    /** Capture console errors */
    captureConsoleErrors?: boolean;
}
export interface ErrorGroup {
    /** Group fingerprint */
    fingerprint: string;
    /** Error name */
    name: string;
    /** Error message (first occurrence) */
    message: string;
    /** Number of occurrences */
    count: number;
    /** First occurrence timestamp */
    firstSeen: number;
    /** Last occurrence timestamp */
    lastSeen: number;
    /** Sample of error IDs in this group */
    errorIds: string[];
    /** Affected users count */
    usersAffected: number;
    /** User IDs affected */
    affectedUserIds: Set<string>;
}
export declare function parseStackTrace(error: Error, inAppPatterns?: (string | RegExp)[]): StackFrame[];
export declare function parseError(error: Error, inAppPatterns?: (string | RegExp)[]): ParsedError;
export declare class SourceMapResolver {
    private sourceMapCache;
    private sourceMapUrls;
    constructor(sourceMapUrls?: Record<string, string>);
    loadSourceMap(fileUrl: string): Promise<SourceMapConsumer | null>;
    resolveFrame(frame: StackFrame): Promise<StackFrame>;
    resolveStackTrace(frames: StackFrame[]): Promise<StackFrame[]>;
    destroy(): void;
}
export declare function generateErrorFingerprint(error: ParsedError): string;
export declare class ErrorTracker {
    private config;
    private errors;
    private breadcrumbs;
    private errorGroups;
    private sourceMapResolver;
    private user;
    private release;
    private environment;
    private traceId;
    private spanId;
    constructor(config?: ErrorTrackerConfig);
    /**
     * Set user information
     */
    setUser(user: UserInfo | undefined): void;
    /**
     * Set release version
     */
    setRelease(release: string | undefined): void;
    /**
     * Set environment
     */
    setEnvironment(environment: string | undefined): void;
    /**
     * Set trace context
     */
    setTraceContext(traceId: string | undefined, spanId: string | undefined): void;
    /**
     * Add a breadcrumb
     */
    addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
    /**
     * Capture an error
     */
    captureError(error: Error, context?: ErrorContext, tags?: Record<string, string>): Promise<CapturedError | null>;
    /**
     * Capture a message as an error
     */
    captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext, tags?: Record<string, string>): Promise<CapturedError | null>;
    /**
     * Get all captured errors
     */
    getErrors(): CapturedError[];
    /**
     * Get error by ID
     */
    getError(id: string): CapturedError | undefined;
    /**
     * Get all error groups
     */
    getErrorGroups(): ErrorGroup[];
    /**
     * Get errors in a group
     */
    getGroupErrors(fingerprint: string): CapturedError[];
    /**
     * Clear all errors
     */
    clear(): void;
    /**
     * Destroy the tracker
     */
    destroy(): void;
    private generateId;
    private shouldCapture;
    private updateErrorGroup;
    private setupGlobalHandlers;
    private getElementSelector;
}
export declare function getErrorTracker(config?: ErrorTrackerConfig): ErrorTracker;
export declare function initErrorTracking(config: ErrorTrackerConfig): ErrorTracker;
export declare function resetErrorTracking(): void;
export interface ErrorBoundaryInfo {
    componentStack: string;
}
export declare function captureReactError(error: Error, errorInfo: ErrorBoundaryInfo, componentName?: string): Promise<CapturedError | null>;
//# sourceMappingURL=errors.d.ts.map