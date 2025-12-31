/**
 * Documentation Generator - AI-powered documentation generation for PhilJS
 *
 * Features:
 * - JSDoc comments generation
 * - README generation
 * - API documentation
 * - Usage examples generation
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Documentation generation configuration
 */
export interface DocGenerationConfig {
    /** Code to document */
    code: string;
    /** File path for context */
    filePath?: string;
    /** Documentation style */
    style?: DocStyle;
    /** Include examples */
    includeExamples?: boolean;
    /** Include type information */
    includeTypes?: boolean;
    /** Documentation depth */
    depth?: 'minimal' | 'standard' | 'comprehensive';
    /** Target audience */
    audience?: 'developer' | 'user' | 'contributor';
}
/**
 * Documentation styles
 */
export type DocStyle = 'jsdoc' | 'tsdoc' | 'markdown' | 'api';
/**
 * Generated documentation result
 */
export interface GeneratedDocumentation {
    /** Documented code */
    code: string;
    /** Summary of the code */
    summary: string;
    /** Usage examples */
    examples?: string[];
    /** API reference */
    apiReference?: APIReference[];
    /** Changelog entries */
    changelog?: string;
}
/**
 * API reference entry
 */
export interface APIReference {
    /** Function/component name */
    name: string;
    /** Description */
    description: string;
    /** Parameters */
    parameters?: ParameterDoc[];
    /** Return type and description */
    returns?: {
        type: string;
        description: string;
    };
    /** Examples */
    examples?: string[];
    /** Since version */
    since?: string;
    /** Deprecation notice */
    deprecated?: string;
}
/**
 * Parameter documentation
 */
export interface ParameterDoc {
    /** Parameter name */
    name: string;
    /** Parameter type */
    type: string;
    /** Description */
    description: string;
    /** Is optional */
    optional?: boolean;
    /** Default value */
    defaultValue?: string;
}
/**
 * README generation configuration
 */
export interface ReadmeConfig {
    /** Project/package name */
    name: string;
    /** Project description */
    description: string;
    /** Source files to analyze */
    sourceFiles?: string[];
    /** Sections to include */
    sections?: ReadmeSection[];
    /** Badges to include */
    badges?: BadgeConfig[];
    /** Include table of contents */
    tableOfContents?: boolean;
}
/**
 * README sections
 */
export type ReadmeSection = 'installation' | 'usage' | 'api' | 'examples' | 'configuration' | 'contributing' | 'license' | 'changelog';
/**
 * Badge configuration
 */
export interface BadgeConfig {
    /** Badge type */
    type: 'npm' | 'license' | 'build' | 'coverage' | 'downloads' | 'custom';
    /** Custom URL (for custom badges) */
    url?: string;
    /** Custom label */
    label?: string;
}
/**
 * Generated README
 */
export interface GeneratedReadme {
    /** README content */
    content: string;
    /** Sections included */
    sections: string[];
    /** Suggestions for improvement */
    suggestions?: string[];
}
/**
 * API documentation configuration
 */
export interface APIDocConfig {
    /** Source files to document */
    sourceFiles: {
        path: string;
        content: string;
    }[];
    /** Output format */
    format?: 'markdown' | 'html' | 'json';
    /** Group by category */
    groupBy?: 'file' | 'category' | 'type';
    /** Include private members */
    includePrivate?: boolean;
    /** Include examples */
    includeExamples?: boolean;
}
/**
 * Generated API documentation
 */
export interface GeneratedAPIDoc {
    /** Documentation content */
    content: string;
    /** Format */
    format: 'markdown' | 'html' | 'json';
    /** Modules documented */
    modules: ModuleDoc[];
    /** Index/navigation */
    index: string;
}
/**
 * Module documentation
 */
export interface ModuleDoc {
    /** Module name */
    name: string;
    /** Module description */
    description: string;
    /** Exports */
    exports: ExportDoc[];
    /** File path */
    filePath: string;
}
/**
 * Export documentation
 */
export interface ExportDoc {
    /** Export name */
    name: string;
    /** Export type */
    type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'component';
    /** Description */
    description: string;
    /** Signature */
    signature?: string;
    /** API reference */
    api?: APIReference;
}
/**
 * Documentation Generator class
 */
export declare class DocGenerator {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate documentation for code
     */
    generateDocs(config: DocGenerationConfig): Promise<GeneratedDocumentation>;
    /**
     * Add JSDoc comments to code
     */
    addJSDoc(code: string, options?: {
        includeExamples?: boolean;
        includeTypes?: boolean;
    }): Promise<string>;
    /**
     * Generate README for a project/package
     */
    generateReadme(config: ReadmeConfig): Promise<GeneratedReadme>;
    /**
     * Generate API documentation
     */
    generateAPIDoc(config: APIDocConfig): Promise<GeneratedAPIDoc>;
    /**
     * Generate usage examples
     */
    generateExamples(code: string, count?: number): Promise<string[]>;
    /**
     * Generate changelog entry
     */
    generateChangelog(changes: {
        type: string;
        description: string;
        files?: string[];
    }[]): Promise<string>;
    /**
     * Generate component documentation
     */
    documentComponent(componentCode: string, componentName: string): Promise<{
        documentation: string;
        props: ParameterDoc[];
        examples: string[];
    }>;
    /**
     * Generate inline documentation comments
     */
    addInlineComments(code: string, density?: 'sparse' | 'normal' | 'dense'): Promise<string>;
    /**
     * Document a module
     */
    private documentModule;
    /**
     * Generate documentation index
     */
    private generateIndex;
    /**
     * Format API docs for output
     */
    private formatAPIDocs;
    /**
     * Build documentation prompt
     */
    private buildDocPrompt;
    /**
     * Get system prompt for documentation
     */
    private getSystemPrompt;
    /**
     * Parse documentation result
     */
    private parseDocResult;
    /**
     * Extract summary from response
     */
    private extractSummary;
    /**
     * Extract examples from response
     */
    private extractExamplesFromResponse;
    /**
     * Extract suggestions from response
     */
    private extractSuggestions;
    /**
     * Extract Markdown from response
     */
    private extractMarkdown;
    /**
     * Extract module name from path
     */
    private extractModuleName;
    /**
     * Basic Markdown to HTML conversion
     */
    private markdownToHTML;
}
/**
 * Create a documentation generator instance
 */
export declare function createDocGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): DocGenerator;
/**
 * Quick documentation generation helper
 */
export declare function generateDocs(provider: AIProvider, code: string, style?: DocStyle): Promise<GeneratedDocumentation>;
/**
 * Quick JSDoc addition helper
 */
export declare function addJSDoc(provider: AIProvider, code: string): Promise<string>;
/**
 * Quick README generation helper
 */
export declare function generateReadme(provider: AIProvider, name: string, description: string): Promise<GeneratedReadme>;
//# sourceMappingURL=doc-generator.d.ts.map