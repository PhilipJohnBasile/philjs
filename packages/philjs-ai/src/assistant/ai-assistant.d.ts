/**
 * AI Development Assistant
 *
 * A comprehensive AI-powered development assistant that provides:
 * - Natural language code generation
 * - Context-aware completions
 * - Intelligent refactoring
 * - Automated testing
 * - Documentation generation
 * - Multi-provider support
 */
import type { AIProvider, CompletionOptions } from '../types.js';
import { type ComponentGenerationConfig } from '../codegen/component-generator.js';
import { type AutocompleteContext } from '../autocomplete/index.js';
import { type RefactoringSuggestion } from '../refactor/refactoring-engine.js';
import { type GeneratedTestSuite } from '../testing/advanced-test-generator.js';
/**
 * Project context for AI assistance
 */
export interface ProjectContext {
    /** Project name */
    name: string;
    /** Project root path */
    rootPath: string;
    /** Files in the project (path -> content) */
    files: Map<string, string>;
    /** Dependencies */
    dependencies: string[];
    /** Project type */
    type: 'philjs' | 'react' | 'vue' | 'svelte' | 'generic';
    /** Framework version */
    version?: string;
    /** TypeScript config */
    tsConfig?: Record<string, unknown>;
}
/**
 * Code generation request
 */
export interface CodeGenRequest {
    /** Natural language description */
    description: string;
    /** Type of code to generate */
    type: 'component' | 'hook' | 'function' | 'test' | 'api' | 'page' | 'utility';
    /** Additional context */
    context?: {
        /** Related files content */
        relatedFiles?: Map<string, string>;
        /** Existing types to use */
        existingTypes?: string;
        /** Style preferences */
        style?: 'functional' | 'class-based';
        /** Include tests */
        includeTests?: boolean;
        /** Include documentation */
        includeDocs?: boolean;
    };
}
/**
 * Code generation result
 */
export interface CodeGenResult {
    /** Generated code */
    code: string;
    /** File name suggestion */
    fileName: string;
    /** Related files (e.g., tests, types) */
    relatedFiles?: Map<string, string>;
    /** Explanation of what was generated */
    explanation: string;
    /** Suggestions for improvement */
    suggestions: string[];
    /** Dependencies needed */
    dependencies?: string[];
}
/**
 * Refactoring request
 */
export interface RefactorRequest {
    /** Code to refactor */
    code: string;
    /** File path */
    filePath?: string;
    /** Specific instruction */
    instruction?: string;
    /** Focus areas */
    focus?: ('performance' | 'readability' | 'accessibility' | 'patterns' | 'signals')[];
    /** Maximum suggestions */
    maxSuggestions?: number;
}
/**
 * AI assistant configuration
 */
export interface AssistantConfig {
    /** AI provider */
    provider: AIProvider;
    /** Project context */
    projectContext?: ProjectContext;
    /** Default completion options */
    defaultOptions?: Partial<CompletionOptions>;
    /** Enable caching */
    enableCache?: boolean;
    /** Debug mode */
    debug?: boolean;
}
/**
 * Conversation message
 */
export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Chat response
 */
export interface ChatResponse {
    /** Response text */
    message: string;
    /** Generated code if any */
    code?: string;
    /** Actions taken */
    actions?: Array<{
        type: 'generate' | 'refactor' | 'test' | 'document' | 'explain';
        description: string;
        result?: unknown;
    }>;
    /** Suggestions */
    suggestions?: string[];
}
/**
 * AI Development Assistant
 *
 * Provides a unified interface for AI-powered development assistance.
 *
 * @example
 * ```typescript
 * const assistant = new AIAssistant({
 *   provider: createOpenAIProvider({ apiKey: 'sk-...' }),
 *   projectContext: {
 *     name: 'my-app',
 *     rootPath: '/path/to/project',
 *     files: new Map(),
 *     dependencies: ['philjs-core'],
 *     type: 'philjs',
 *   },
 * });
 *
 * // Generate code from description
 * const result = await assistant.generateCode({
 *   description: 'Create a user profile card with avatar, name, and bio',
 *   type: 'component',
 * });
 *
 * // Chat with the assistant
 * const response = await assistant.chat('How can I optimize this component for performance?');
 *
 * // Get refactoring suggestions
 * const suggestions = await assistant.refactor({
 *   code: myCode,
 *   focus: ['performance', 'signals'],
 * });
 * ```
 */
export declare class AIAssistant {
    private provider;
    private projectContext?;
    private defaultOptions;
    private enableCache;
    private debug;
    private componentGenerator;
    private autocompleteEngine;
    private refactoringEngine;
    private documentationGenerator;
    private testGenerator;
    private conversationHistory;
    private cache;
    private cacheMaxAge;
    constructor(config: AssistantConfig);
    /**
     * Generate code from natural language description
     */
    generateCode(request: CodeGenRequest): Promise<CodeGenResult>;
    /**
     * Generate a component from description
     */
    generateComponent(description: string, options?: ComponentGenerationConfig): Promise<CodeGenResult>;
    /**
     * Generate a hook/utility from description
     */
    generateHook(description: string): Promise<CodeGenResult>;
    /**
     * Generate tests for code
     */
    generateTests(code: string, options?: {
        framework?: 'vitest' | 'jest';
        types?: ('unit' | 'integration' | 'e2e')[];
    }): Promise<GeneratedTestSuite>;
    /**
     * Get context-aware code completions
     */
    getCompletions(context: AutocompleteContext): Promise<string[]>;
    /**
     * Get inline completion (ghost text)
     */
    getInlineCompletion(prefix: string, suffix: string, options?: {
        language?: string;
    }): Promise<string | null>;
    /**
     * Get refactoring suggestions for code
     */
    refactor(request: RefactorRequest): Promise<RefactoringSuggestion[]>;
    /**
     * Apply a refactoring suggestion
     */
    applyRefactoring(code: string, suggestion: RefactoringSuggestion): Promise<string>;
    /**
     * Auto-refactor code with AI-selected improvements
     */
    autoRefactor(code: string, options?: {
        maxChanges?: number;
    }): Promise<{
        code: string;
        changes: RefactoringSuggestion[];
    }>;
    /**
     * Generate documentation for code
     */
    generateDocs(code: string, options?: {
        style?: 'jsdoc' | 'tsdoc';
        includeExamples?: boolean;
    }): Promise<string>;
    /**
     * Add JSDoc to undocumented code
     */
    addJSDoc(code: string): Promise<string>;
    /**
     * Chat with the AI assistant
     */
    chat(message: string): Promise<ChatResponse>;
    /**
     * Clear conversation history
     */
    clearHistory(): void;
    /**
     * Get conversation history
     */
    getHistory(): ConversationMessage[];
    /**
     * Explain code in natural language
     */
    explainCode(code: string): Promise<string>;
    /**
     * Explain an error and suggest fixes
     */
    explainError(error: string, code?: string): Promise<{
        explanation: string;
        causes: string[];
        solutions: string[];
        fixedCode?: string;
    }>;
    /**
     * Review code and provide feedback
     */
    reviewCode(code: string, options?: {
        focus?: ('bugs' | 'performance' | 'security' | 'style' | 'accessibility')[];
    }): Promise<{
        score: number;
        issues: Array<{
            type: string;
            severity: 'error' | 'warning' | 'info';
            message: string;
            line?: number;
            suggestion?: string;
        }>;
        summary: string;
    }>;
    /**
     * Analyze project and suggest improvements
     */
    analyzeProject(): Promise<{
        health: number;
        suggestions: string[];
        issues: string[];
        architecture: string;
    }>;
    /**
     * Set project context
     */
    setProjectContext(context: ProjectContext): void;
    /**
     * Get project context
     */
    getProjectContext(): ProjectContext | undefined;
    /**
     * Switch AI provider
     */
    setProvider(provider: AIProvider): void;
    /**
     * Clear cache
     */
    clearCache(): void;
    private buildCodeGenPrompt;
    private getCodeGenSystemPrompt;
    private parseCodeGenResponse;
    private buildChatContext;
    private getChatSystemPrompt;
    private getFromCache;
    private setInCache;
}
/**
 * Create an AI assistant instance
 */
export declare function createAIAssistant(config: AssistantConfig): AIAssistant;
/**
 * Create an AI assistant with auto-detected provider
 */
export declare function createAutoAssistant(projectContext?: ProjectContext): AIAssistant;
//# sourceMappingURL=ai-assistant.d.ts.map