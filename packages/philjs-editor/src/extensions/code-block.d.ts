/**
 * Code Block Extension with Syntax Highlighting
 *
 * Provides code blocks with syntax highlighting powered by lowlight/highlight.js
 */
import { createLowlight } from 'lowlight';
declare const lowlight: any;
export interface CodeBlockOptions {
    /**
     * Languages to support in the code block
     */
    languages?: string[];
    /**
     * Default language for new code blocks
     */
    defaultLanguage?: string;
    /**
     * Whether to show line numbers
     */
    lineNumbers?: boolean;
    /**
     * Custom lowlight instance
     */
    lowlight?: ReturnType<typeof createLowlight>;
}
/**
 * Creates a configured code block extension with syntax highlighting
 */
export declare function createCodeBlockExtension(options?: CodeBlockOptions): any;
/**
 * Get list of supported languages
 */
export declare function getSupportedLanguages(): string[];
/**
 * Register additional language for syntax highlighting
 */
export declare function registerLanguage(name: string, definition: any): void;
/**
 * Code block keyboard shortcuts
 */
export declare const codeBlockShortcuts: {
    toggleCodeBlock: string;
    exitCodeBlock: string;
};
/**
 * Default code block extension with common languages
 */
export declare const CodeBlock: any;
export { lowlight };
export default CodeBlock;
//# sourceMappingURL=code-block.d.ts.map