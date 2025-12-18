/**
 * Component Tree Visualization Helpers
 *
 * Provides utilities for visualizing and inspecting the component hierarchy:
 * - Component tree traversal and inspection
 * - Props and state visualization
 * - Component relationship mapping
 * - DOM-to-component mapping
 */
export type ComponentNode = {
    id: string;
    name: string;
    type: "component" | "element" | "text" | "fragment";
    props: Record<string, any>;
    children: ComponentNode[];
    parent?: ComponentNode;
    domNode?: Element | Text;
    isIsland?: boolean;
    isHydrated?: boolean;
    renderTime?: number;
    updateCount?: number;
};
export type ComponentTreeSnapshot = {
    root: ComponentNode;
    timestamp: number;
    totalComponents: number;
    totalElements: number;
    totalIslands: number;
};
export type ComponentInspectionData = {
    node: ComponentNode;
    path: string[];
    depth: number;
    siblings: number;
    descendants: number;
    signals: string[];
    effects: string[];
};
export type TreeDiff = {
    type: "added" | "removed" | "modified" | "moved";
    path: string[];
    oldNode?: ComponentNode;
    newNode?: ComponentNode;
};
export declare class ComponentTreeInspector {
    private nodeMap;
    private domNodeMap;
    private idCounter;
    private snapshots;
    private maxSnapshots;
    /**
     * Build component tree from DOM
     */
    buildTreeFromDOM(rootElement?: Element): ComponentNode;
    /**
     * Get component node by ID
     */
    getNode(nodeId: string): ComponentNode | undefined;
    /**
     * Get component node by DOM element
     */
    getNodeByDOM(element: Element | Text): ComponentNode | undefined;
    /**
     * Find component nodes by name
     */
    findByName(name: string): ComponentNode[];
    /**
     * Find component nodes by prop
     */
    findByProp(propName: string, propValue?: any): ComponentNode[];
    /**
     * Get path from root to node
     */
    getPath(nodeId: string): string[];
    /**
     * Get detailed inspection data for a node
     */
    inspect(nodeId: string): ComponentInspectionData | null;
    /**
     * Get all islands in the tree
     */
    getIslands(): ComponentNode[];
    /**
     * Get all hydrated components
     */
    getHydratedComponents(): ComponentNode[];
    /**
     * Serialize tree to JSON (for display/export)
     */
    serializeTree(node: ComponentNode, depth?: number): any;
    /**
     * Create a snapshot of current tree state
     */
    createSnapshot(root: ComponentNode): void;
    /**
     * Get all snapshots
     */
    getSnapshots(): ComponentTreeSnapshot[];
    /**
     * Compare two trees and generate diff
     */
    diff(oldRoot: ComponentNode, newRoot: ComponentNode): TreeDiff[];
    /**
     * Print tree as ASCII art
     */
    printTree(node: ComponentNode, prefix?: string, isLast?: boolean): string;
    /**
     * Get tree statistics
     */
    getStatistics(root: ComponentNode): {
        totalNodes: number;
        byType: Record<string, number>;
        maxDepth: number;
        averageChildren: number;
        islands: number;
        hydrated: number;
    };
    private traverseDOM;
    private extractProps;
    private serializeProps;
    private countDescendants;
    private countByType;
    private countIslands;
    private extractSignals;
    private extractEffects;
    private cloneNode;
    private compareNodes;
    private formatNodeName;
}
export declare function initComponentTreeInspector(): ComponentTreeInspector;
export declare function getComponentTreeInspector(): ComponentTreeInspector | null;
/**
 * Highlight a component in the DOM
 */
export declare function highlightComponent(nodeId: string): void;
/**
 * Remove component highlight
 */
export declare function removeHighlight(): void;
/**
 * Log component tree to console
 */
export declare function logComponentTree(rootElement?: Element): void;
//# sourceMappingURL=component-tree.d.ts.map