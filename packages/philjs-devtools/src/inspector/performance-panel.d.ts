/**
 * Performance Panel - Display component render performance metrics
 */
import type { ComponentNode, PerformanceInfo, RenderProfile } from './types.js';
export declare class PerformancePanel {
    private container;
    private currentNode;
    private renderProfiles;
    private maxProfilesPerComponent;
    private isRecording;
    constructor(container: HTMLElement);
    setNode(node: ComponentNode): void;
    startRecording(): void;
    stopRecording(): void;
    recordRender(componentId: string, profile: RenderProfile): void;
    private render;
    private renderComponentMetrics;
    private renderProfilesChart;
    private renderPerformanceTips;
    getComponentStats(): Map<string, PerformanceInfo>;
}
//# sourceMappingURL=performance-panel.d.ts.map