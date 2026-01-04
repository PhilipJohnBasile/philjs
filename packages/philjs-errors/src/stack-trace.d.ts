/**
 * Stack Trace Processing and Source Map Integration
 *
 * Improves stack traces to point to user code instead of framework internals.
 * Integrates with source maps for accurate error locations.
 */
import type { SourceLocation } from './error-codes.js';
export interface StackFrame {
    functionName?: string;
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
    source?: string;
    isFramework?: boolean;
    isUserCode?: boolean;
    isNodeModules?: boolean;
}
export interface ProcessedStack {
    frames: StackFrame[];
    userCodeFrames: StackFrame[];
    frameworkFrames: StackFrame[];
    rawStack: string;
}
/**
 * Parse error stack trace into structured frames
 */
export declare function parseStack(error: Error): StackFrame[];
/**
 * Process stack trace to highlight user code
 */
export declare function processStack(error: Error): ProcessedStack;
/**
 * Get the primary error location (first user code frame)
 */
export declare function getPrimaryLocation(error: Error): SourceLocation | null;
/**
 * Format stack trace for display, filtering framework internals
 */
export declare function formatStackTrace(error: Error, options?: {
    maxFrames?: number;
    showFramework?: boolean;
    showNodeModules?: boolean;
    highlightUserCode?: boolean;
}): string;
/**
 * Extract relevant code snippet around error location
 */
export declare function getCodeSnippet(location: SourceLocation, options?: {
    contextLines?: number;
}): Promise<string | null>;
/**
 * Load source map for a file
 */
export declare function loadSourceMap(fileName: string): Promise<any | null>;
/**
 * Apply source map to a location
 */
export declare function applySourceMap(location: SourceLocation): Promise<SourceLocation>;
/**
 * Clean stack trace by removing framework internals
 */
export declare function cleanStack(stack: string): string;
/**
 * Enhanced error with processed stack trace
 */
export declare function enhanceErrorStack(error: Error): Error;
/**
 * Create a development-friendly error display
 */
export declare function formatErrorForDev(error: Error): {
    message: string;
    stack: string;
    primaryLocation: SourceLocation | null;
    userFrames: StackFrame[];
};
//# sourceMappingURL=stack-trace.d.ts.map