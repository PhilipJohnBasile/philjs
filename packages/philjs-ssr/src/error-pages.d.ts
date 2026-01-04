/**
 * Enhanced error pages with beautiful UI and diagnostics.
 * Provides development overlay and production error tracking.
 */
import type { JSXElement } from '@philjs/core/jsx-runtime';
export interface ErrorPageProps {
    error: Error;
    statusCode: number;
    url?: string;
    timestamp?: Date;
    requestId?: string;
}
export interface ErrorDiagnostic {
    type: 'error' | 'warning' | 'info';
    message: string;
    file?: string;
    line?: number;
    column?: number;
    stack?: string;
    suggestions?: string[];
}
export interface ErrorPageConfig {
    /**
     * Whether to show detailed error information (dev mode)
     */
    showDetails?: boolean;
    /**
     * Custom logo URL
     */
    logo?: string;
    /**
     * Support email or link
     */
    supportLink?: string;
    /**
     * Custom CSS
     */
    customCSS?: string;
    /**
     * Error tracking service endpoint
     */
    trackingEndpoint?: string;
    /**
     * App name
     */
    appName?: string;
}
/**
 * Configure error tracking
 */
export declare function configureErrorTracking(tracker: (error: Error, context: any) => void): void;
/**
 * Track an error
 */
export declare function trackError(error: Error, context?: any): void;
/**
 * Parse error stack trace to extract diagnostics
 */
export declare function parseErrorStack(error: Error): ErrorDiagnostic[];
/**
 * Generate error suggestions based on error type
 */
export declare function generateErrorSuggestions(error: Error): string[];
/**
 * Beautiful 404 Not Found page
 */
export declare function NotFoundPage(props: {
    url?: string;
    config?: ErrorPageConfig;
}): string;
/**
 * 500 Internal Server Error page with diagnostics
 */
export declare function InternalErrorPage(props: {
    error: Error;
    config?: ErrorPageConfig;
    requestId?: string;
    timestamp?: Date;
}): string;
/**
 * Development error overlay (injected into page)
 */
export declare function DevErrorOverlay(props: {
    error: Error;
    componentStack?: string;
}): string;
/**
 * Generate error response
 */
export declare function generateErrorResponse(error: Error, statusCode: number, config?: ErrorPageConfig, context?: {
    url?: string;
    requestId?: string;
    timestamp?: Date;
}): Response;
/**
 * Custom error component (for use in JSX)
 */
export declare function ErrorPage(props: {
    statusCode: number;
    error?: Error;
    title?: string;
    message?: string;
    children?: any;
}): JSXElement;
//# sourceMappingURL=error-pages.d.ts.map