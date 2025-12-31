/**
 * PhilJS Native - DevTools & Hot Reloading
 *
 * Development tools including hot module reloading (HMR),
 * component inspection, and debugging utilities.
 */
import { type Signal } from 'philjs-core';
/**
 * Hot reload status
 */
export type HotReloadStatus = 'idle' | 'checking' | 'updating' | 'error' | 'applied';
/**
 * Module update info
 */
export interface ModuleUpdate {
    id: string;
    path: string;
    timestamp: number;
    accepted: boolean;
}
/**
 * HMR runtime config
 */
export interface HMRConfig {
    /** WebSocket URL for dev server */
    wsUrl?: string;
    /** Reconnect interval in ms */
    reconnectInterval?: number;
    /** Maximum reconnection attempts */
    maxRetries?: number;
    /** Whether to show overlay on errors */
    showErrorOverlay?: boolean;
    /** Custom error handler */
    onError?: (error: Error) => void;
    /** Custom update handler */
    onUpdate?: (modules: ModuleUpdate[]) => void;
}
/**
 * Development menu options
 */
export interface DevMenuOptions {
    enabled?: boolean;
    items?: DevMenuItem[];
}
/**
 * Development menu item
 */
export interface DevMenuItem {
    title: string;
    handler: () => void;
    icon?: string;
}
/**
 * Performance profile entry
 */
export interface PerformanceEntry {
    name: string;
    startTime: number;
    duration: number;
    type: 'measure' | 'navigation' | 'resource' | 'paint' | 'custom';
    metadata?: Record<string, any>;
}
/**
 * Hot reload status signal
 */
export declare const hotReloadStatus: Signal<HotReloadStatus>;
/**
 * Last updated modules
 */
export declare const lastUpdatedModules: Signal<ModuleUpdate[]>;
/**
 * Dev mode enabled
 */
export declare const devModeEnabled: Signal<boolean>;
/**
 * Performance entries
 */
export declare const performanceEntries: Signal<PerformanceEntry[]>;
/**
 * Initialize HMR
 */
export declare function initHMR(config?: HMRConfig): () => void;
/**
 * Hide error overlay
 */
export declare function hideErrorOverlay(): void;
/**
 * Register dev menu item
 */
export declare function registerDevMenuItem(item: DevMenuItem): () => void;
/**
 * Show development menu
 */
export declare function showDevMenu(): void;
/**
 * Hide development menu
 */
export declare function hideDevMenu(): void;
/**
 * Toggle component inspector
 */
export declare function toggleInspector(): void;
/**
 * Show performance monitor
 */
export declare function showPerformanceMonitor(): void;
/**
 * Hide performance monitor
 */
export declare function hidePerformanceMonitor(): void;
/**
 * Clear development cache
 */
export declare function clearDevCache(): Promise<void>;
/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
/**
 * Log with styling
 */
export declare function log(level: LogLevel, module: string, message: string, ...args: any[]): void;
/**
 * Set up dev keyboard shortcuts
 */
export declare function setupDevKeyboardShortcuts(): () => void;
export declare const DevTools: {
    initHMR: typeof initHMR;
    hotReloadStatus: Signal<HotReloadStatus>;
    lastUpdatedModules: Signal<ModuleUpdate[]>;
    hideErrorOverlay: typeof hideErrorOverlay;
    registerDevMenuItem: typeof registerDevMenuItem;
    showDevMenu: typeof showDevMenu;
    hideDevMenu: typeof hideDevMenu;
    toggleInspector: typeof toggleInspector;
    showPerformanceMonitor: typeof showPerformanceMonitor;
    hidePerformanceMonitor: typeof hidePerformanceMonitor;
    clearDevCache: typeof clearDevCache;
    log: typeof log;
    setupDevKeyboardShortcuts: typeof setupDevKeyboardShortcuts;
    devModeEnabled: Signal<boolean>;
};
export default DevTools;
//# sourceMappingURL=index.d.ts.map