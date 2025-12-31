/**
 * Component Suggestion System
 *
 * Provides context-aware component suggestions based on:
 * - Current code context
 * - Project structure
 * - Common patterns
 * - User behavior
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Component suggestion
 */
export interface ComponentSuggestion {
    /** Component name */
    name: string;
    /** Description of the component */
    description: string;
    /** Category/type */
    category: ComponentCategory;
    /** Relevance score 0-100 */
    relevance: number;
    /** Props required */
    props: SuggestedProp[];
    /** Import statement */
    importStatement: string;
    /** Usage snippet */
    snippet: string;
    /** Why this component is suggested */
    reason: string;
    /** Component source */
    source: 'built-in' | 'project' | 'library' | 'ai-generated';
    /** Tags for filtering */
    tags: string[];
}
/**
 * Component categories
 */
export type ComponentCategory = 'layout' | 'navigation' | 'form' | 'data-display' | 'feedback' | 'overlay' | 'media' | 'utility' | 'custom';
/**
 * Suggested prop
 */
export interface SuggestedProp {
    /** Prop name */
    name: string;
    /** Prop type */
    type: string;
    /** Is required */
    required: boolean;
    /** Default value */
    defaultValue?: string;
    /** Description */
    description?: string;
}
/**
 * Suggestion context
 */
export interface SuggestionContext {
    /** Current file content */
    fileContent: string;
    /** Cursor position */
    cursorPosition: {
        line: number;
        column: number;
    };
    /** File path */
    filePath: string;
    /** Text before cursor on current line */
    linePrefix?: string;
    /** Available imports in project */
    availableImports?: AvailableImport[];
    /** Project components */
    projectComponents?: ProjectComponent[];
    /** Recent user selections */
    recentSelections?: string[];
    /** User preferences */
    preferences?: SuggestionPreferences;
}
/**
 * Available import in project
 */
export interface AvailableImport {
    /** Module path */
    path: string;
    /** Exported names */
    exports: string[];
    /** Is component library */
    isComponentLibrary?: boolean;
}
/**
 * Project component
 */
export interface ProjectComponent {
    /** Component name */
    name: string;
    /** File path */
    path: string;
    /** Props interface */
    props?: SuggestedProp[];
    /** Usage count in project */
    usageCount?: number;
}
/**
 * Suggestion preferences
 */
export interface SuggestionPreferences {
    /** Preferred libraries */
    preferredLibraries?: string[];
    /** Component style preference */
    stylePreference?: 'tailwind' | 'css-modules' | 'styled-components' | 'none';
    /** Include AI-generated suggestions */
    includeAISuggestions?: boolean;
    /** Maximum suggestions */
    maxSuggestions?: number;
}
/**
 * Suggestion result
 */
export interface SuggestionResult {
    /** Suggested components */
    suggestions: ComponentSuggestion[];
    /** Context analysis */
    context: ContextAnalysis;
    /** Timing info */
    timing: {
        parseMs: number;
        aiMs: number;
        totalMs: number;
    };
}
/**
 * Context analysis
 */
export interface ContextAnalysis {
    /** Detected context type */
    contextType: 'jsx-element' | 'jsx-attribute' | 'jsx-child' | 'import' | 'function-body' | 'unknown';
    /** Parent component if in JSX */
    parentComponent?: string;
    /** Sibling components */
    siblingComponents?: string[];
    /** Detected patterns */
    patterns?: string[];
    /** Missing common components */
    missingCommon?: string[];
}
/**
 * Pattern detection result
 */
export interface PatternDetection {
    /** Detected UI pattern */
    pattern: string;
    /** Confidence 0-1 */
    confidence: number;
    /** Suggested components for this pattern */
    suggestedComponents: string[];
}
/**
 * Component Suggestion Engine
 *
 * Provides intelligent component suggestions based on context.
 *
 * @example
 * ```typescript
 * const suggester = new ComponentSuggester(provider);
 *
 * const result = await suggester.suggest({
 *   fileContent: code,
 *   cursorPosition: { line: 10, column: 5 },
 *   filePath: 'src/components/MyComponent.tsx',
 * });
 *
 * result.suggestions.forEach(s => {
 *   console.log(`${s.name}: ${s.description} (relevance: ${s.relevance})`);
 * });
 * ```
 */
export declare class ComponentSuggester {
    private provider;
    private defaultOptions;
    private componentCache;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Get component suggestions for the current context
     *
     * @param context - Current code context
     * @returns Suggestion result with components and analysis
     */
    suggest(context: SuggestionContext): Promise<SuggestionResult>;
    /**
     * Get suggestions for a specific pattern
     *
     * @param pattern - UI pattern name (e.g., "form", "list-detail", "dashboard")
     * @param context - Optional context
     * @returns Component suggestions for the pattern
     */
    suggestForPattern(pattern: string, context?: Partial<SuggestionContext>): Promise<ComponentSuggestion[]>;
    /**
     * Detect patterns in code and suggest improvements
     *
     * @param code - Code to analyze
     * @returns Pattern detections with suggestions
     */
    detectPatterns(code: string): Promise<PatternDetection[]>;
    /**
     * Get component completion for partial component name
     *
     * @param partial - Partial component name
     * @param context - Current context
     * @returns Matching component suggestions
     */
    completeComponent(partial: string, context: SuggestionContext): Promise<ComponentSuggestion[]>;
    /**
     * Suggest child components for a parent
     *
     * @param parentComponent - Parent component name
     * @param context - Current context
     * @returns Suggested child components
     */
    suggestChildren(parentComponent: string, context: SuggestionContext): Promise<ComponentSuggestion[]>;
    private analyzeContext;
    private isInsideJSX;
    private findParentComponent;
    private detectCodePatterns;
    private findMissingCommon;
    private getBuiltInSuggestions;
    private getProjectSuggestions;
    private getAISuggestions;
    private getCodeAroundCursor;
}
/**
 * Create a component suggester instance
 */
export declare function createComponentSuggester(provider: AIProvider, options?: Partial<CompletionOptions>): ComponentSuggester;
/**
 * Quick suggestion helper
 */
export declare function suggestComponents(provider: AIProvider, context: SuggestionContext): Promise<SuggestionResult>;
/**
 * Quick pattern detection helper
 */
export declare function detectUIPatterns(provider: AIProvider, code: string): Promise<PatternDetection[]>;
//# sourceMappingURL=component-suggester.d.ts.map