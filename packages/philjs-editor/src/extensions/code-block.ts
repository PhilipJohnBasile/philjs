/**
 * Code Block Extension with Syntax Highlighting
 *
 * Provides code blocks with syntax highlighting powered by lowlight/highlight.js
 */

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Additional language imports can be added here
// import javascript from 'highlight.js/lib/languages/javascript';
// import typescript from 'highlight.js/lib/languages/typescript';
// lowlight.register('javascript', javascript);
// lowlight.register('typescript', typescript);

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
export function createCodeBlockExtension(options: CodeBlockOptions = {}) {
  const { defaultLanguage = 'plaintext', lowlight: customLowlight } = options;

  return CodeBlockLowlight.configure({
    lowlight: customLowlight || lowlight,
    defaultLanguage,
    HTMLAttributes: {
      class: 'philjs-code-block',
      spellcheck: 'false',
    },
  });
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): string[] {
  return lowlight.listLanguages();
}

/**
 * Register additional language for syntax highlighting
 */
export function registerLanguage(name: string, definition: any): void {
  lowlight.register(name, definition);
}

/**
 * Code block keyboard shortcuts
 */
export const codeBlockShortcuts = {
  toggleCodeBlock: 'Mod-Alt-c',
  exitCodeBlock: 'Mod-Enter',
};

/**
 * Default code block extension with common languages
 */
export const CodeBlock = createCodeBlockExtension();

export { lowlight };
export default CodeBlock;
