/**
 * PhilJS Error Codes and Catalog
 *
 * Comprehensive error catalog with codes, messages, and actionable suggestions.
 */
export interface PhilJSError extends Error {
    code: string;
    category: ErrorCategory;
    suggestions: ErrorSuggestion[];
    documentationUrl?: string;
    sourceLocation?: SourceLocation;
    relatedErrors?: string[];
}
export interface ErrorSuggestion {
    description: string;
    codeExample?: {
        before: string;
        after: string;
    };
    autoFixable?: boolean;
    confidence?: number;
    links?: string[];
}
export interface SourceLocation {
    file: string;
    line: number;
    column: number;
    source?: string;
}
export type ErrorCategory = 'signal' | 'ssr' | 'hydration' | 'router' | 'compiler' | 'component' | 'lifecycle' | 'type' | 'runtime';
export interface ErrorDefinition {
    code: string;
    category: ErrorCategory;
    title: string;
    message: (context?: Record<string, any>) => string;
    suggestions: ErrorSuggestion[];
    severity: 'error' | 'warning' | 'info';
    documentationPath: string;
}
/**
 * Error catalog with all defined PhilJS errors
 */
export declare const ERROR_CATALOG: Record<string, ErrorDefinition>;
/**
 * Get error definition by code
 */
export declare function getErrorDefinition(code: string): ErrorDefinition | undefined;
/**
 * Get all errors in a category
 */
export declare function getErrorsByCategory(category: ErrorCategory): ErrorDefinition[];
/**
 * Create a PhilJS error with code
 */
export declare function createPhilJSError(code: string, context?: Record<string, any>, originalError?: Error): PhilJSError;
/**
 * Format error for display
 */
export declare function formatError(error: PhilJSError, options?: {
    includeStack?: boolean;
    includeSuggestions?: boolean;
    includeDocLink?: boolean;
}): string;
//# sourceMappingURL=error-codes.d.ts.map