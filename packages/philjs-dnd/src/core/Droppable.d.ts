/**
 * PhilJS Droppable Web Component
 * Pure Web Component - No React
 */
export declare class PhilDroppable extends HTMLElement {
    static observedAttributes: string[];
    private dropId;
    private disabled;
    private isOver;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, _oldValue: string, newValue: string): void;
    private registerWithManager;
    private unregisterFromManager;
    private handleStateChange;
    private updateDropState;
    private getDropData;
    private render;
}
//# sourceMappingURL=Droppable.d.ts.map