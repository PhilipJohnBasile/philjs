/**
 * Type definitions for the Visual Component Inspector
 */
export interface ComponentNode {
    id: string;
    name: string;
    type: 'component' | 'element' | 'island' | 'portal' | 'fragment';
    element: HTMLElement | null;
    props: Record<string, unknown>;
    state: Record<string, unknown>;
    signals: SignalInfo[];
    effects: EffectInfo[];
    children: ComponentNode[];
    parent: ComponentNode | null;
    source?: SourceLocation;
    renderCount: number;
    lastRenderTime: number;
    averageRenderTime: number;
    key?: string | number;
    ref?: unknown;
    isHydrated?: boolean;
    isLazy?: boolean;
}
export interface SignalInfo {
    name: string;
    value: unknown;
    subscribers: number;
    lastUpdate: number;
    updateCount: number;
}
export interface EffectInfo {
    name: string;
    dependencies: string[];
    runCount: number;
    lastRun: number;
    duration: number;
}
export interface SourceLocation {
    file: string;
    line: number;
    column: number;
}
export interface PropInfo {
    name: string;
    value: unknown;
    type: string;
    isRequired: boolean;
    defaultValue?: unknown;
    description?: string;
    isEditable: boolean;
}
export interface StateInfo {
    name: string;
    value: unknown;
    type: string;
    path: string[];
    isSignal: boolean;
    subscribers?: number;
    updateHistory?: StateUpdate[];
}
export interface StateUpdate {
    timestamp: number;
    oldValue: unknown;
    newValue: unknown;
    trigger?: string;
}
export interface StyleInfo {
    property: string;
    value: string;
    source: 'inline' | 'computed' | 'stylesheet' | 'inherited';
    selector?: string;
    specificity?: number;
    isOverridden: boolean;
    isEditable: boolean;
}
export interface ComputedBox {
    content: {
        width: number;
        height: number;
    };
    padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    border: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}
export interface PerformanceInfo {
    componentId: string;
    componentName: string;
    renderCount: number;
    totalRenderTime: number;
    averageRenderTime: number;
    lastRenderTime: number;
    mountTime: number;
    hydrationTime?: number;
    rerendersTriggeredBy: string[];
    memorizedProps: string[];
    memorizedValues: string[];
}
export interface RenderProfile {
    startTime: number;
    endTime: number;
    duration: number;
    phase: 'mount' | 'update' | 'unmount' | 'hydrate';
    reason?: string;
}
export type InspectorEventType = 'component-selected' | 'component-hovered' | 'props-changed' | 'state-changed' | 'tree-updated' | 'search-results' | 'error';
export interface InspectorEvent {
    type: InspectorEventType;
    data: unknown;
    timestamp: number;
}
export interface InspectorConfig {
    enabled: boolean;
    position: 'left' | 'right' | 'bottom' | 'floating';
    width: number;
    height: number;
    theme: 'light' | 'dark' | 'system';
    showPerformance: boolean;
    showNetwork: boolean;
    showStyles: boolean;
    showSource: boolean;
    highlightUpdates: boolean;
    trackRenderReasons: boolean;
    maxHistorySize: number;
    shortcuts: {
        toggle: string;
        selectElement: string;
        search: string;
    };
}
export interface FilterOptions {
    showComponents: boolean;
    showElements: boolean;
    showIslands: boolean;
    showFragments: boolean;
    hideEmpty: boolean;
    searchQuery: string;
    componentNameFilter: string[];
}
//# sourceMappingURL=types.d.ts.map