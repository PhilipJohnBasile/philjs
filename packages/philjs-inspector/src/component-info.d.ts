/**
 * Component metadata extraction for inspector
 */
export interface ComponentInfo {
    id: string;
    name: string;
    element: Element;
    props: Record<string, any>;
    signals: SignalInfo[];
    isIsland: boolean;
    isHydrated: boolean;
    renderCount: number;
    renderTime: number;
    updateCount: number;
    path: string[];
    source?: SourceLocation;
}
export interface SignalInfo {
    name: string;
    value: any;
    type: 'signal' | 'memo' | 'linkedSignal';
}
export interface SourceLocation {
    file: string;
    line: number;
    column: number;
}
/**
 * Extract component information from DOM element
 */
export declare function extractComponentInfo(element: Element): ComponentInfo;
/**
 * Get component by ID
 */
export declare function getComponentById(id: string): ComponentInfo | undefined;
/**
 * Get component by element
 */
export declare function getComponentByElement(element: Element): ComponentInfo | undefined;
/**
 * Update component metrics
 */
export declare function updateComponentMetrics(element: Element, renderTime: number): void;
/**
 * Get all registered components
 */
export declare function getAllComponents(): ComponentInfo[];
/**
 * Search components by name
 */
export declare function searchComponents(query: string): ComponentInfo[];
/**
 * Clear component registry
 */
export declare function clearComponentRegistry(): void;
/**
 * Register signal for tracking
 */
export declare function registerSignal(signal: any, name: string, type: 'signal' | 'memo' | 'linkedSignal'): void;
/**
 * Get signal info
 */
export declare function getSignalInfo(signal: any): SignalInfo | undefined;
/**
 * Format prop value for display
 */
export declare function formatPropValue(value: any): string;
/**
 * Get component ancestors
 */
export declare function getComponentAncestors(element: Element): ComponentInfo[];
/**
 * Get component children
 */
export declare function getComponentChildren(element: Element): ComponentInfo[];
//# sourceMappingURL=component-info.d.ts.map