/**
 * PhilJS Draggable Web Component
 * Pure Web Component - No React
 */
export declare class PhilDraggable extends HTMLElement {
    static observedAttributes: string[];
    private dragId;
    private disabled;
    private isDragging;
    private startPosition;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, _oldValue: string, newValue: string): void;
    private handleStateChange;
    private updateDragState;
    private setupEventListeners;
    private handleMouseDown;
    private handleMouseMove;
    private handleMouseUp;
    private handleTouchStart;
    private handleTouchMove;
    private handleTouchEnd;
    private handleKeyDown;
    private getItemData;
    private render;
}
//# sourceMappingURL=Draggable.d.ts.map