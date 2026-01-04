/**
 * Prompt templates for AI code generation
 */
export declare const SYSTEM_PROMPTS: {
    philjs: string;
    typescript: string;
    testing: string;
};
export declare function buildComponentPrompt(description: string, options: {
    includeTests?: boolean;
    includeStyles?: boolean;
    useSignals?: boolean;
}): string;
export declare function buildRoutePrompt(description: string, path: string, options: {
    includeLoader?: boolean;
    includeAction?: boolean;
    includeMetadata?: boolean;
}): string;
export declare function buildTestPrompt(code: string, options: {
    componentName?: string;
    testFramework?: string;
    includeE2E?: boolean;
}): string;
export declare function buildRefactorPrompt(code: string, focusAreas: string[]): string;
export declare function buildReviewPrompt(code: string, filePath: string | undefined, aspects: string[]): string;
export declare function buildMigrationPrompt(code: string, sourceFramework: string): string;
export declare function buildErrorExplanationPrompt(error: string): string;
export declare function buildDocumentationPrompt(code: string, options: {
    includeExamples?: boolean;
    includeTypes?: boolean;
    style?: string;
}): string;
//# sourceMappingURL=prompts.d.ts.map