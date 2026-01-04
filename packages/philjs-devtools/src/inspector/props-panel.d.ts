/**
 * Props Panel - Display and edit component props
 */
import type { ComponentNode } from './types.js';
export declare class PropsPanel {
    private container;
    private currentNode;
    private onPropChange?;
    constructor(container: HTMLElement);
    setNode(node: ComponentNode): void;
    onPropsChange(callback: (name: string, value: unknown) => void): void;
    private render;
    private analyzeProps;
    private getType;
    private isEditable;
    private renderProp;
    private formatValue;
    private escapeHtml;
}
//# sourceMappingURL=props-panel.d.ts.map