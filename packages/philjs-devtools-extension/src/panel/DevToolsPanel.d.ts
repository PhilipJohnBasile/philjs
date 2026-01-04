/**
 * PhilJS DevTools - Main Panel Component
 */
export declare class DevToolsPanel {
    private state;
    private container;
    private tabs;
    private activeTab;
    constructor(container: HTMLElement);
    private setupMessageListener;
    private handleMessage;
    private sendMessage;
    private render;
    private renderTab;
    private renderActiveTab;
    private renderComponentsTab;
    private renderComponentNode;
    private renderComponentInspector;
    private renderSignalsTab;
    private renderPerformanceTab;
    private renderNetworkTab;
    private findComponentById;
    private attachEventListeners;
}
export { SignalInspector } from './SignalInspector.js';
export { ComponentTree } from './ComponentTree.js';
export { PerformanceProfiler } from './PerformanceProfiler.js';
export { NetworkInspector } from './NetworkInspector.js';
//# sourceMappingURL=DevToolsPanel.d.ts.map