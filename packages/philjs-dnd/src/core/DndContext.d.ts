/**
 * PhilJS Drag and Drop Context
 * Pure Web Component - No React
 */
import type { DndConfig, DragState, DragItem, Position } from '../types.js';
export declare class DndManager {
    private config;
    private state;
    private activeNode;
    private droppables;
    private activeSensors;
    private lastOverId;
    private announcements;
    private liveRegion;
    constructor(config?: DndConfig);
    private initializeSensors;
    private createLiveRegion;
    private announce;
    getState(): DragState;
    registerDroppable(id: string, node: HTMLElement, data?: Record<string, unknown>): void;
    unregisterDroppable(id: string): void;
    private updateDroppableRects;
    private applyModifiers;
    startDrag(item: DragItem, node: HTMLElement, position: Position): void;
    updateDrag(position: Position): void;
    endDrag(): void;
    cancelDrag(): void;
    private dispatchStateChange;
    destroy(): void;
}
export declare class PhilDndContext extends HTMLElement {
    private manager;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    configure(config: DndConfig): void;
    getManager(): DndManager | null;
    private render;
}
export declare function createDndManager(config?: DndConfig): DndManager;
export declare function getDndManager(): DndManager | null;
//# sourceMappingURL=DndContext.d.ts.map