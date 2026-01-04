/**
 * Type definitions for AI prompts and providers.
 */
export type PromptSpec<I, O> = {
    in: I;
    out: O;
    policy?: {
        pii?: "block" | "allow";
        costBudgetCents?: number;
    };
};
export type Provider = {
    name: string;
    generate: (prompt: string, opts?: Record<string, any>) => Promise<string>;
};
/**
 * Extended types for code generation
 */
export interface AIProvider {
    name: string;
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
    generateStreamCompletion?(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
    /** Analyze images with vision capabilities */
    analyzeImage?(image: ImageInput, prompt: string, options?: VisionOptions): Promise<VisionResult>;
    /** Embed texts for vector search */
    embed?(texts: string[]): Promise<number[][]>;
}
export interface CompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    systemPrompt?: string;
}
/**
 * Image input for vision models
 */
export type ImageInput = {
    type: 'url';
    url: string;
} | {
    type: 'base64';
    data: string;
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
} | {
    type: 'file';
    path: string;
};
/**
 * Options for vision analysis
 */
export interface VisionOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    /** Detail level for image analysis */
    detail?: 'low' | 'high' | 'auto';
    /** Multiple images to analyze together */
    additionalImages?: ImageInput[];
}
/**
 * Result from vision analysis
 */
export interface VisionResult {
    content: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
    /** Detected objects or entities */
    detections?: VisionDetection[];
}
/**
 * Detected object or entity in an image
 */
export interface VisionDetection {
    label: string;
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export interface AIConfig {
    provider: 'openai' | 'anthropic' | 'local';
    apiKey?: string;
    baseURL?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface ComponentGenerationOptions {
    description: string;
    includeTests?: boolean;
    includeStyles?: boolean;
    useSignals?: boolean;
    framework?: 'philjs';
}
export interface RouteGenerationOptions {
    description: string;
    path: string;
    includeLoader?: boolean;
    includeAction?: boolean;
    includeMetadata?: boolean;
}
export interface TestGenerationOptions {
    code: string;
    componentName?: string;
    testFramework?: 'vitest' | 'jest';
    includeE2E?: boolean;
}
export interface RefactorOptions {
    code: string;
    focusAreas?: ('signals' | 'performance' | 'accessibility' | 'patterns')[];
    includeExplanations?: boolean;
}
export interface CodeReviewOptions {
    code: string;
    filePath?: string;
    reviewAspects?: ('bugs' | 'performance' | 'security' | 'style' | 'patterns')[];
    severity?: 'info' | 'warning' | 'error';
}
export interface GeneratedComponent {
    code: string;
    tests?: string;
    styles?: string;
    explanation: string;
}
export interface GeneratedRoute {
    code: string;
    path: string;
    imports: string[];
    explanation: string;
}
export interface GeneratedTests {
    code: string;
    framework: string;
    coverage: string[];
}
export interface RefactorSuggestion {
    type: 'signals' | 'performance' | 'accessibility' | 'patterns';
    description: string;
    before: string;
    after: string;
    explanation: string;
    impact: 'high' | 'medium' | 'low';
}
export interface CodeReviewResult {
    issues: CodeIssue[];
    suggestions: string[];
    overallScore: number;
    summary: string;
}
export interface CodeIssue {
    type: 'bug' | 'performance' | 'security' | 'style' | 'pattern';
    severity: 'info' | 'warning' | 'error';
    message: string;
    line?: number;
    column?: number;
    suggestion?: string;
}
export interface MigrationOptions {
    code: string;
    sourceFramework: 'react' | 'vue' | 'svelte';
    preserveComments?: boolean;
    convertHooks?: boolean;
}
export interface MigrationResult {
    code: string;
    changes: MigrationChange[];
    warnings: string[];
    manualSteps: string[];
}
export interface MigrationChange {
    type: 'hook' | 'component' | 'import' | 'prop';
    from: string;
    to: string;
    explanation: string;
}
export interface ErrorExplanation {
    error: string;
    explanation: string;
    possibleCauses: string[];
    solutions: string[];
    relatedDocs: string[];
}
export interface DocumentationOptions {
    code: string;
    includeExamples?: boolean;
    includeTypes?: boolean;
    style?: 'jsdoc' | 'tsdoc';
}
export interface GeneratedDocumentation {
    code: string;
    summary: string;
    examples?: string[];
}
/**
 * Tool definition for function calling
 */
export interface ToolDefinition {
    /** Tool name */
    name: string;
    /** Tool description */
    description: string;
    /** JSON Schema for parameters */
    parameters: Record<string, unknown>;
    /** Execute the tool */
    execute: (args: Record<string, unknown>) => Promise<unknown>;
}
/**
 * Tool call from AI
 */
export interface ToolCall {
    /** Unique call ID */
    id: string;
    /** Tool name */
    name: string;
    /** Tool arguments */
    arguments: Record<string, unknown>;
}
//# sourceMappingURL=types.d.ts.map