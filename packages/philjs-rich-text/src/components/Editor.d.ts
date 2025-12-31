/**
 * @philjs/rich-text - Main Editor Class
 * Block-based rich text editor - framework agnostic
 */
import type { EditorConfig, Block } from '../types.js';
export interface EditorOptions extends EditorConfig {
    container: HTMLElement;
    initialContent?: Block[];
}
export declare class Editor {
    private container;
    private editorInstance;
    private state;
    private slashMenu;
    private floatingToolbar;
    private blockRenderer;
    private config;
    constructor(options: EditorOptions);
    private init;
    private handleKeyDown;
    private updateFloatingToolbar;
    private render;
    focus(): void;
    blur(): void;
    getContent(): Block[];
    setContent(blocks: Block[]): void;
    getHTML(): string;
    getText(): string;
    destroy(): void;
}
export declare function createRichTextEditor(options: EditorOptions): Editor;
export default Editor;
//# sourceMappingURL=Editor.d.ts.map