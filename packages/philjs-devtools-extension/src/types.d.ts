/**
 * PhilJS DevTools - Type Definitions
 */
export interface DevToolsState {
    connected: boolean;
    signals: Map<string, SignalData>;
    componentTree: ComponentNode | null;
    selectedNode: string | null;
    performance: PerformanceMetrics;
    networkRequests: NetworkRequest[];
    consoleMessages: ConsoleMessage[];
}
export interface SignalData {
    id: string;
    name: string;
    value: unknown;
    subscribers: number;
    lastUpdated: number;
    updateCount: number;
    source: string;
    history: SignalHistoryEntry[];
}
export interface SignalHistoryEntry {
    timestamp: number;
    value: unknown;
    trigger: string;
}
export interface ComponentNode {
    id: string;
    name: string;
    type: 'component' | 'element' | 'fragment' | 'text';
    props: Record<string, unknown>;
    state: Record<string, unknown>;
    signals: string[];
    children: ComponentNode[];
    element?: HTMLElement;
    renderTime?: number;
    renderCount: number;
    warnings: string[];
}
export interface PerformanceMetrics {
    fps: number;
    memory: MemoryMetrics;
    timing: TimingMetrics;
    renders: RenderMetrics[];
    hydration: HydrationMetrics | null;
}
export interface MemoryMetrics {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}
export interface TimingMetrics {
    ttfb: number;
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    inp: number;
}
export interface RenderMetrics {
    componentId: string;
    componentName: string;
    duration: number;
    timestamp: number;
    cause: string;
}
export interface HydrationMetrics {
    totalTime: number;
    componentCount: number;
    mismatchCount: number;
    mismatches: HydrationMismatch[];
}
export interface HydrationMismatch {
    componentId: string;
    componentName: string;
    type: 'text' | 'attribute' | 'missing' | 'extra';
    expected: string;
    actual: string;
}
export interface NetworkRequest {
    id: string;
    url: string;
    method: string;
    status: number;
    statusText: string;
    type: 'fetch' | 'xhr' | 'loader' | 'action';
    startTime: number;
    endTime: number;
    duration: number;
    size: number;
    headers: Record<string, string>;
    body?: unknown;
    response?: unknown;
    error?: string;
}
export interface ConsoleMessage {
    id: string;
    type: 'log' | 'warn' | 'error' | 'info' | 'debug';
    message: string;
    timestamp: number;
    source: string;
    stack?: string;
}
export type DevToolsMessage = {
    type: 'INIT';
    payload: DevToolsState;
} | {
    type: 'SIGNAL_UPDATE';
    payload: SignalData;
} | {
    type: 'COMPONENT_TREE_UPDATE';
    payload: ComponentNode;
} | {
    type: 'PERFORMANCE_UPDATE';
    payload: PerformanceMetrics;
} | {
    type: 'NETWORK_REQUEST';
    payload: NetworkRequest;
} | {
    type: 'CONSOLE_MESSAGE';
    payload: ConsoleMessage;
} | {
    type: 'SELECT_COMPONENT';
    payload: string;
} | {
    type: 'HIGHLIGHT_COMPONENT';
    payload: string | null;
} | {
    type: 'INSPECT_SIGNAL';
    payload: string;
} | {
    type: 'MODIFY_SIGNAL';
    payload: {
        id: string;
        value: unknown;
    };
};
//# sourceMappingURL=types.d.ts.map