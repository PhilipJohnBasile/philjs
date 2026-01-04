/**
 * Compiler Error Detection and Enhancement
 *
 * Provides helpful error messages for:
 * - JSX syntax errors
 * - Unsupported features
 * - Optimization warnings
 * - Build-time errors
 */
import { type PhilJSError } from './error-codes.js';
/**
 * Compiler error context
 */
export interface CompilerErrorContext {
    code: string;
    filePath: string;
    line?: number;
    column?: number;
    originalError?: Error;
}
/**
 * JSX syntax error detection
 */
export declare function createJSXSyntaxError(details: string, context: CompilerErrorContext): PhilJSError;
/**
 * Unsupported feature error
 */
export declare function createUnsupportedFeatureError(feature: string, reason: string, context: CompilerErrorContext): PhilJSError;
/**
 * Optimization warning
 */
export declare function createOptimizationWarning(issue: string, context: CompilerErrorContext): PhilJSError;
/**
 * Extract code snippet with context
 */
export declare function extractCodeSnippet(code: string, line: number, column: number, contextLines?: number): string;
/**
 * Common JSX error patterns
 */
export interface JSXErrorPattern {
    pattern: RegExp;
    message: string;
    suggestion: string;
}
export declare const JSX_ERROR_PATTERNS: JSXErrorPattern[];
/**
 * Detect JSX error pattern
 */
export declare function detectJSXErrorPattern(errorMessage: string): JSXErrorPattern | null;
/**
 * Enhance compiler error with better message
 */
export declare function enhanceCompilerError(originalError: Error, context: CompilerErrorContext): PhilJSError;
/**
 * Check for deprecated JSX attributes
 */
export declare function checkDeprecatedAttributes(attributes: string[]): Array<{
    attribute: string;
    replacement: string;
}>;
/**
 * Compiler warning aggregation
 */
interface CompilerWarning {
    code: string;
    message: string;
    file: string;
    line?: number;
    column?: number;
    severity: 'warning' | 'info';
}
/**
 * Add compiler warning
 */
export declare function addCompilerWarning(warning: CompilerWarning): void;
/**
 * Get all compiler warnings
 */
export declare function getCompilerWarnings(): CompilerWarning[];
/**
 * Get warnings for a specific file
 */
export declare function getWarningsForFile(filePath: string): CompilerWarning[];
/**
 * Clear compiler warnings
 */
export declare function clearCompilerWarnings(): void;
/**
 * Format compiler error for display
 */
export declare function formatCompilerError(error: PhilJSError, code: string): string;
/**
 * Get compiler error statistics
 */
export declare function getCompilerErrorStats(): {
    totalWarnings: number;
    warningsByFile: Record<string, number>;
    warningsByCode: Record<string, number>;
};
export {};
//# sourceMappingURL=compiler-errors.d.ts.map