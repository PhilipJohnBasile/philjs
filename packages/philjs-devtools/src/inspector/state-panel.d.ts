/**
 * State Panel - Display component state and signals
 */
import type { ComponentNode } from './types.js';
export declare class StatePanel {
    private container;
    private currentNode;
    private stateHistory;
    private maxHistorySize;
    constructor(container: HTMLElement, maxHistorySize?: number);
    setNode(node: ComponentNode): void;
    recordStateChange(path: string, value: unknown): void;
    private render;
    private renderSignal;
    private renderStateTree;
    private formatValue;
    private getValueColor;
    private formatTime;
}
//# sourceMappingURL=state-panel.d.ts.map