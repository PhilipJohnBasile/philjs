/**
 * Error boundaries with intelligent recovery suggestions.
 * Catches errors, suggests fixes, and provides recovery options.
 */
import type { VNode } from "./jsx-runtime.js";
export type ErrorInfo = {
    /** The error that was caught */
    error: Error;
    /** Component stack trace */
    componentStack?: string;
    /** File and line where error occurred */
    source?: {
        file: string;
        line: number;
        column: number;
    };
    /** Error category */
    category: ErrorCategory;
    /** Suggested fixes */
    suggestions: ErrorSuggestion[];
    /** Similar errors from community */
    similarErrors?: SimilarError[];
};
export type ErrorCategory = "render" | "data-fetch" | "type" | "network" | "permission" | "unknown";
export type ErrorSuggestion = {
    /** Description of the fix */
    description: string;
    /** Code change to apply */
    codeChange?: {
        before: string;
        after: string;
    };
    /** Confidence level (0-1) */
    confidence: number;
    /** Can be auto-fixed */
    autoFixable: boolean;
};
export type SimilarError = {
    /** Error message */
    message: string;
    /** How it was resolved */
    resolution: string;
    /** Link to discussion/issue */
    link?: string;
    /** Similarity score (0-1) */
    similarity: number;
};
export type ErrorBoundaryProps = {
    /** Fallback UI when error occurs */
    fallback?: (error: ErrorInfo, retry: () => void) => VNode;
    /** Callback when error is caught */
    onError?: (error: ErrorInfo) => void;
    /** Callback when error is recovered */
    onRecover?: () => void;
    /** Children to render */
    children: VNode;
    /** Name for debugging */
    name?: string;
};
/**
 * Error boundary component.
 */
export declare function ErrorBoundary(props: ErrorBoundaryProps): VNode;
/**
 * Global error handler.
 */
export declare function setupGlobalErrorHandler(onError: (error: ErrorInfo) => void): () => void;
/**
 * Error recovery strategies.
 */
export declare class ErrorRecovery {
    private recoveryStrategies;
    constructor();
    private setupDefaultStrategies;
    addStrategy(category: ErrorCategory, strategy: RecoveryStrategy): void;
    recover(error: Error, category: ErrorCategory, context: RecoveryContext): Promise<any>;
}
type RecoveryStrategy = {
    name: string;
    execute: (error: Error, context: RecoveryContext) => Promise<any>;
    shouldApply: (error: Error) => boolean;
};
type RecoveryContext = {
    retry: () => Promise<any>;
    fallbackValue?: any;
    componentName?: string;
};
/**
 * Global error recovery instance.
 */
export declare const errorRecovery: ErrorRecovery;
export {};
//# sourceMappingURL=error-boundary.d.ts.map