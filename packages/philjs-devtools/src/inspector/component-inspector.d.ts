/**
 * Main Component Inspector Class
 *
 * Provides a visual interface for inspecting PhilJS component trees
 */
import type { ComponentNode, InspectorConfig, InspectorEvent } from './types.js';
/**
 * Component Inspector - Main class for the visual inspector
 */
export declare class ComponentInspector {
    private config;
    private rootElement;
    private selectedNode;
    private hoveredNode;
    private componentTree;
    private eventListeners;
    private isVisible;
    private filter;
    private highlightOverlay;
    private panelElement;
    private updateScheduled;
    constructor(config?: Partial<InspectorConfig>);
    private initialize;
    private createHighlightOverlay;
    private createInspectorPanel;
    private renderPanelContent;
    private attachPanelEventListeners;
    private switchTab;
    private setupKeyboardShortcuts;
    private getShortcutString;
    private hookComponentLifecycle;
    private scheduleUpdate;
    private rebuildTree;
    private buildNodeFromElement;
    private generateNodeId;
    private extractProps;
    private extractState;
    private shouldIncludeNode;
    private renderTree;
    private renderNode;
    private countNodes;
    private findNodeById;
    selectNode(node: ComponentNode): void;
    private hoverNode;
    private unhoverNode;
    private highlightElement;
    private hideHighlight;
    private flashHighlight;
    private updatePropsPanel;
    private updateStatePanel;
    private updateStylesPanel;
    private enableSelectMode;
    private findNodeByElement;
    show(): void;
    hide(): void;
    toggle(): void;
    on(event: string, callback: (event: InspectorEvent) => void): () => void;
    off(event: string, callback: (event: InspectorEvent) => void): void;
    private emit;
    destroy(): void;
    getSelectedComponent(): ComponentNode | null;
    getComponentTree(): ComponentNode | null;
}
/**
 * Create a new inspector instance
 */
export declare function createInspector(config?: Partial<InspectorConfig>): ComponentInspector;
/**
 * Get the current inspector instance
 */
export declare function getInspector(): ComponentInspector | null;
//# sourceMappingURL=component-inspector.d.ts.map