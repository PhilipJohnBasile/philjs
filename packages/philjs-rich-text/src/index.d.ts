/**
 * @philjs/rich-text
 * Rich text block editor for PhilJS
 *
 * Features:
 * - Notion-style block-based editing
 * - Slash commands for quick block insertion
 * - Floating toolbar for text formatting
 * - Multiple block types (headings, lists, code, etc.)
 * - Drag and drop block reordering
 * - Collaborative editing support
 * - Export to JSON, HTML, Markdown
 */
export type { BlockType, Block, TextMark, TextNode, EditorState, Selection, Position, EditorConfig, Extension, KeyBinding, NodeViewFactory, NodeView, SlashCommand, CollaborationConfig, CollaborationUser, Cursor, EditorInstance, EditorCommands, EditorView, ToolbarItem, ToolbarConfig, ExportOptions, ImportOptions, } from './types.js';
export { Editor, createRichTextEditor, type EditorOptions, BlockRenderer, SlashCommandMenu, type SlashCommandMenuOptions, FloatingToolbar, type FloatingToolbarOptions, } from './components/index.js';
export { createEditor } from './core/editor.js';
export { defaultSlashCommands } from './extensions/defaultCommands.js';
export declare function createBlock(type: import('./types.js').BlockType, content?: import('./types.js').TextNode[], attrs?: Record<string, unknown>): import('./types.js').Block;
export declare function createTextNode(text: string, marks?: import('./types.js').TextMark[]): import('./types.js').TextNode;
/**
 * Parse HTML string to blocks
 */
export declare function parseHTML(html: string): import('./types.js').Block[];
/**
 * Serialize blocks to HTML
 */
export declare function serializeToHTML(blocks: import('./types.js').Block[]): string;
/**
 * Serialize blocks to Markdown
 */
export declare function serializeToMarkdown(blocks: import('./types.js').Block[]): string;
//# sourceMappingURL=index.d.ts.map