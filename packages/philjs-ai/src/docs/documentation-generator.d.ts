/**
 * Documentation Generator
 *
 * Generates JSDoc/TSDoc documentation from code including:
 * - Function documentation
 * - Component documentation
 * - Type documentation
 * - README generation
 * - API documentation
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Documentation style
 */
export type DocumentationStyle = 'jsdoc' | 'tsdoc' | 'markdown' | 'inline';
/**
 * Documentation generation options
 */
export interface DocGenerationOptions extends Partial<CompletionOptions> {
    /** Documentation style */
    style?: DocumentationStyle;
    /** Include examples */
    includeExamples?: boolean;
    /** Include type information */
    includeTypes?: boolean;
    /** Include @since tags */
    includeSince?: string;
    /** Include @deprecated tags where applicable */
    markDeprecated?: boolean;
    /** Include @internal for private members */
    markInternal?: boolean;
    /** Verbosity level */
    verbosity?: 'minimal' | 'standard' | 'detailed';
    /** Custom tags to include */
    customTags?: Array<{
        name: string;
        content: string;
    }>;
}
/**
 * Generated documentation result
 */
export interface GeneratedDocumentation {
    /** Original code */
    originalCode: string;
    /** Code with documentation added */
    documentedCode: string;
    /** Extracted documentation blocks */
    docBlocks: DocBlock[];
    /** Summary of the documented code */
    summary: string;
    /** Coverage statistics */
    coverage: DocCoverage;
    /** Suggested improvements */
    suggestions: string[];
}
/**
 * Documentation block
 */
export interface DocBlock {
    /** Block type */
    type: 'function' | 'component' | 'type' | 'interface' | 'class' | 'variable' | 'constant';
    /** Name of documented item */
    name: string;
    /** Generated documentation */
    documentation: string;
    /** Line where to insert */
    insertLine: number;
    /** Brief description */
    description: string;
    /** Parameters if applicable */
    params?: DocParam[];
    /** Return type documentation */
    returns?: DocReturn;
    /** Examples */
    examples?: string[];
    /** Tags */
    tags?: DocTag[];
}
/**
 * Parameter documentation
 */
export interface DocParam {
    /** Parameter name */
    name: string;
    /** Parameter type */
    type: string;
    /** Description */
    description: string;
    /** Is optional */
    optional: boolean;
    /** Default value */
    defaultValue?: string;
}
/**
 * Return type documentation
 */
export interface DocReturn {
    /** Return type */
    type: string;
    /** Description */
    description: string;
}
/**
 * Documentation tag
 */
export interface DocTag {
    /** Tag name (without @) */
    name: string;
    /** Tag content */
    content: string;
}
/**
 * Documentation coverage statistics
 */
export interface DocCoverage {
    /** Total items that could be documented */
    total: number;
    /** Items with documentation */
    documented: number;
    /** Coverage percentage */
    percentage: number;
    /** Items missing documentation */
    missing: string[];
}
/**
 * Component documentation
 */
export interface ComponentDoc {
    /** Component name */
    name: string;
    /** Description */
    description: string;
    /** Props documentation */
    props: PropDoc[];
    /** State documentation */
    state: StateDoc[];
    /** Events/callbacks */
    events: EventDoc[];
    /** Slots/children */
    slots: SlotDoc[];
    /** Examples */
    examples: ComponentExample[];
    /** Accessibility notes */
    accessibility: string[];
    /** Related components */
    related: string[];
}
/**
 * Prop documentation
 */
export interface PropDoc {
    /** Prop name */
    name: string;
    /** Prop type */
    type: string;
    /** Description */
    description: string;
    /** Is required */
    required: boolean;
    /** Default value */
    default?: string;
    /** Deprecated */
    deprecated?: string;
}
/**
 * State documentation
 */
export interface StateDoc {
    /** State name */
    name: string;
    /** State type */
    type: string;
    /** Description */
    description: string;
    /** Initial value */
    initial: string;
}
/**
 * Event documentation
 */
export interface EventDoc {
    /** Event name (e.g., onChange) */
    name: string;
    /** Event type */
    type: string;
    /** Description */
    description: string;
    /** Example usage */
    example?: string;
}
/**
 * Slot documentation
 */
export interface SlotDoc {
    /** Slot name (default for children) */
    name: string;
    /** Description */
    description: string;
    /** Expected content */
    expectedContent?: string;
}
/**
 * Component example
 */
export interface ComponentExample {
    /** Example title */
    title: string;
    /** Example code */
    code: string;
    /** Description */
    description?: string;
}
/**
 * README generation options
 */
export interface ReadmeOptions {
    /** Project name */
    projectName: string;
    /** Include installation */
    includeInstallation?: boolean;
    /** Include usage examples */
    includeUsage?: boolean;
    /** Include API reference */
    includeAPI?: boolean;
    /** Include contributing guide */
    includeContributing?: boolean;
    /** Include license */
    license?: string;
    /** Badge configurations */
    badges?: Array<{
        name: string;
        url: string;
    }>;
}
/**
 * Generated README
 */
export interface GeneratedReadme {
    /** README content */
    content: string;
    /** Sections included */
    sections: string[];
    /** Table of contents */
    toc: string;
}
/**
 * Documentation Generator Engine
 *
 * Generates comprehensive documentation for code.
 *
 * @example
 * ```typescript
 * const generator = new DocumentationGenerator(provider);
 *
 * // Generate JSDoc for code
 * const result = await generator.generateDocs(code, {
 *   style: 'jsdoc',
 *   includeExamples: true,
 * });
 * console.log(result.documentedCode);
 *
 * // Generate component documentation
 * const compDoc = await generator.documentComponent(componentCode);
 * console.log(compDoc.props);
 *
 * // Generate README
 * const readme = await generator.generateReadme(projectFiles, {
 *   projectName: 'My Project',
 * });
 * console.log(readme.content);
 * ```
 */
export declare class DocumentationGenerator {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate documentation for code
     *
     * @param code - Code to document
     * @param options - Generation options
     * @returns Generated documentation
     */
    generateDocs(code: string, options?: DocGenerationOptions): Promise<GeneratedDocumentation>;
    /**
     * Document a component specifically
     *
     * @param componentCode - Component code
     * @param options - Generation options
     * @returns Component documentation
     */
    documentComponent(componentCode: string, options?: DocGenerationOptions): Promise<ComponentDoc>;
    /**
     * Add JSDoc to undocumented functions
     *
     * @param code - Code with functions
     * @param options - Options
     * @returns Code with JSDoc added
     */
    addJSDoc(code: string, options?: DocGenerationOptions): Promise<string>;
    /**
     * Generate README from project files
     *
     * @param files - Map of file paths to contents
     * @param options - README options
     * @returns Generated README
     */
    generateReadme(files: Map<string, string>, options: ReadmeOptions): Promise<GeneratedReadme>;
    /**
     * Generate API documentation
     *
     * @param code - Code to document
     * @param options - Options
     * @returns API documentation in Markdown
     */
    generateAPIDoc(code: string, options?: {
        format?: 'markdown' | 'html';
        includePrivate?: boolean;
    }): Promise<string>;
    /**
     * Update existing documentation
     *
     * @param code - Code with outdated docs
     * @param changes - Description of changes made
     * @returns Code with updated documentation
     */
    updateDocs(code: string, changes: string): Promise<GeneratedDocumentation>;
    /**
     * Check documentation quality
     *
     * @param code - Code to check
     * @returns Quality report
     */
    checkDocQuality(code: string): Promise<{
        score: number;
        issues: Array<{
            type: string;
            message: string;
            line?: number;
        }>;
        suggestions: string[];
    }>;
    private buildDocPrompt;
    private getDocSystemPrompt;
    private extractDocBlocks;
    private calculateCoverage;
    private generateSummary;
    private getSuggestions;
    private extractBasicComponentDoc;
    private extractReadmeSections;
    private generateTableOfContents;
}
/**
 * Create a documentation generator instance
 */
export declare function createDocumentationGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): DocumentationGenerator;
/**
 * Quick documentation generation helper
 */
export declare function generateDocumentation(provider: AIProvider, code: string, options?: DocGenerationOptions): Promise<GeneratedDocumentation>;
/**
 * Quick JSDoc addition helper
 */
export declare function addJSDocToCode(provider: AIProvider, code: string, options?: DocGenerationOptions): Promise<string>;
/**
 * Quick component documentation helper
 */
export declare function documentPhilJSComponent(provider: AIProvider, componentCode: string): Promise<ComponentDoc>;
//# sourceMappingURL=documentation-generator.d.ts.map