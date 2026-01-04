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
export type EffectMetadata = {
    id: string;
    name?: string;
    componentId?: string;
    createdAt: number;
    lastRun: number;
    runCount: number;
    cleanupCount: number;
    dependencies: string[];
    status: "active" | "disposed" | "pending";
    averageRunTime: number;
    totalRunTime: number;
};
export type EffectEvent = {
    id: string;
    effectId: string;
    type: "run" | "cleanup" | "create" | "dispose";
    timestamp: number;
    duration?: number;
    error?: string;
};
export declare class EffectTracker {
    private effects;
    private events;
    private idCounter;
    private maxEvents;
    /**
     * Register a new effect for tracking
     */
    register(name?: string, componentId?: string, dependencies?: string[]): string;
    /**
     * Record effect run
     */
    recordRun(effectId: string, duration: number, error?: string): void;
    /**
     * Record effect cleanup
     */
    recordCleanup(effectId: string, duration?: number): void;
    /**
     * Dispose an effect
     */
    dispose(effectId: string): void;
    /**
     * Get effect metadata
     */
    getEffect(effectId: string): EffectMetadata | undefined;
    /**
     * Get all effects
     */
    getAllEffects(): EffectMetadata[];
    /**
     * Get effects by component ID
     */
    getEffectsByComponent(componentId: string): EffectMetadata[];
    /**
     * Get active effects
     */
    getActiveEffects(): EffectMetadata[];
    /**
     * Get effect events
     */
    getEvents(effectId?: string): EffectEvent[];
    /**
     * Get recent events
     */
    getRecentEvents(count?: number): EffectEvent[];
    /**
     * Get effect statistics
     */
    getStatistics(): {
        totalEffects: number;
        activeEffects: number;
        totalRuns: number;
        totalCleanups: number;
        averageRunTime: number;
        slowestEffects: EffectMetadata[];
    };
    /**
     * Clear all tracking data
     */
    clear(): void;
    /**
     * Export data as JSON
     */
    export(): string;
    private recordEvent;
}
export declare function initEffectTracker(): EffectTracker;
export declare function getEffectTracker(): EffectTracker | null;
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