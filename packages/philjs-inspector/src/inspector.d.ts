/**
 * Main inspector controller - activation, deactivation, and coordination
 */
import { type ComponentInfo } from './component-info.js';
import { type KeyboardShortcut } from './keyboard.js';
export interface InspectorConfig {
    enabled?: boolean;
    showMetrics?: boolean;
    enableKeyboard?: boolean;
    shortcuts?: Partial<InspectorShortcuts>;
}
export interface InspectorShortcuts {
    toggle: KeyboardShortcut;
    search: KeyboardShortcut;
    nextComponent: KeyboardShortcut;
    prevComponent: KeyboardShortcut;
    parentComponent: KeyboardShortcut;
    childComponent: KeyboardShortcut;
    escape: KeyboardShortcut;
}
export interface InspectorState {
    enabled: boolean;
    hoveredElement: Element | null;
    selectedElement: Element | null;
    mode: 'inspect' | 'select';
}
declare class PhilJSInspector {
    private config;
    private state;
    private navigator;
    private statusBar;
    private breadcrumb;
    constructor();
    /**
     * Enable inspector
     */
    enable(config?: Partial<InspectorConfig>): void;
    /**
     * Disable inspector
     */
    disable(): void;
    /**
     * Toggle inspector
     */
    toggle(): void;
    /**
     * Check if inspector is enabled
     */
    isEnabled(): boolean;
    /**
     * Get current state
     */
    getState(): InspectorState;
    /**
     * Get all components
     */
    getComponents(): ComponentInfo[];
    /**
     * Setup event listeners
     */
    private setupEventListeners;
    /**
     * Cleanup event listeners
     */
    private cleanupEventListeners;
    /**
     * Handle mouse over
     */
    private handleMouseOver;
    /**
     * Handle mouse out
     */
    private handleMouseOut;
    /**
     * Handle click
     */
    private handleClick;
    /**
     * Handle scroll
     */
    private handleScroll;
    /**
     * Handle resize
     */
    private handleResize;
    /**
     * Select element
     */
    private selectElement;
    /**
     * Setup keyboard shortcuts
     */
    private setupKeyboardShortcuts;
    /**
     * Get default shortcuts
     */
    private getDefaultShortcuts;
    /**
     * Show status bar
     */
    private showStatusBar;
    /**
     * Hide status bar
     */
    private hideStatusBar;
    /**
     * Update breadcrumb
     */
    private updateBreadcrumb;
    /**
     * Hide breadcrumb
     */
    private hideBreadcrumb;
    /**
     * Build component registry
     */
    private buildComponentRegistry;
    /**
     * Check if element is part of inspector UI
     */
    private isInspectorElement;
}
/**
 * Get or create inspector instance
 */
export declare function getInspector(): PhilJSInspector;
/**
 * Initialize inspector and attach to window
 */
export declare function initInspector(): void;
export {};
//# sourceMappingURL=inspector.d.ts.map