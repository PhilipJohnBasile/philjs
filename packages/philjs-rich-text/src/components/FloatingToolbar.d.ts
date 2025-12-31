/**
 * @philjs/rich-text - Floating Toolbar
 * Context-aware formatting toolbar - vanilla JS
 */
import type { EditorInstance } from '../types.js';
export interface FloatingToolbarOptions {
    editor: EditorInstance | null;
}
export declare class FloatingToolbar {
    private editor;
    private element;
    private isVisible;
    constructor(options: FloatingToolbarOptions);
    show(): void;
    hide(): void;
    destroy(): void;
    private handleSelectionChange;
    private updatePosition;
    private render;
    private createButton;
    private createLinkButton;
}
export default FloatingToolbar;
//# sourceMappingURL=FloatingToolbar.d.ts.map