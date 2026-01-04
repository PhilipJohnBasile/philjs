/**
 * Code Block Extension with Syntax Highlighting
 *
 * Provides code blocks with syntax highlighting powered by lowlight/highlight.js
 */
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
// Create lowlight instance with common languages
const lowlight = createLowlight(common);
/**
 * Creates a configured code block extension with syntax highlighting
 */
export function createCodeBlockExtension(options = {}) {
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
export function getSupportedLanguages() {
    return lowlight.listLanguages();
}
/**
 * Register additional language for syntax highlighting
 */
export function registerLanguage(name, definition) {
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
//# sourceMappingURL=code-block.js.map