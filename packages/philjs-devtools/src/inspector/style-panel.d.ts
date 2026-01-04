/**
 * Style Panel - Display and edit element styles
 */
import type { ComponentNode, ComputedBox } from './types.js';
export declare class StylePanel {
    private container;
    private currentNode;
    constructor(container: HTMLElement);
    setNode(node: ComponentNode): void;
    private render;
    private renderBoxModel;
    private renderInlineStyles;
    private renderComputedStyles;
    getComputedBox(element: HTMLElement): ComputedBox;
}
//# sourceMappingURL=style-panel.d.ts.map