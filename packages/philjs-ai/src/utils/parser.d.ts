/**
 * Utilities for parsing AI responses
 */
/**
 * Extract code blocks from markdown
 */
export declare function extractCodeBlocks(text: string): Array<{
    language: string;
    code: string;
}>;
/**
 * Extract JSON from text (handles both markdown and plain JSON)
 */
export declare function extractJSON<T = any>(text: string): T | null;
/**
 * Extract first TypeScript/JavaScript code block
 */
export declare function extractCode(text: string): string | null;
/**
 * Clean up code: remove markdown artifacts, normalize whitespace
 */
export declare function cleanCode(code: string): string;
/**
 * Extract imports from code
 */
export declare function extractImports(code: string): string[];
/**
 * Extract component name from code
 */
export declare function extractComponentName(code: string): string | null;
/**
 * Parse generated component response
 */
export declare function parseGeneratedComponent(response: string): {
    code: string;
    componentName: string | null;
    imports: string[];
};
/**
 * Parse multiple sections from response
 */
export declare function parseSections(text: string): Record<string, string>;
/**
 * Extract metadata from response (explanations, warnings, etc.)
 */
export declare function extractMetadata(text: string): {
    explanation?: string;
    warnings?: string[];
    notes?: string[];
};
/**
 * Validate that code is syntactically correct (basic check)
 */
export declare function validateCode(code: string): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=parser.d.ts.map