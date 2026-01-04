/**
 * Global Shortcut APIs
 */
export interface ShortcutHandler {
    /** Shortcut key combination */
    shortcut: string;
    /** Handler function */
    handler: () => void;
    /** Unique ID */
    id: string;
}
/**
 * Global Shortcut API
 */
export declare const GlobalShortcut: {
    /**
     * Register a global shortcut
     * @param shortcut - Key combination (e.g., 'CommandOrControl+Shift+S')
     * @param handler - Callback function
     * @returns Unregister function
     */
    register(shortcut: string, handler: () => void): Promise<() => void>;
    /**
     * Register multiple shortcuts
     */
    registerAll(shortcuts: Array<{
        shortcut: string;
        handler: () => void;
    }>): Promise<() => void>;
    /**
     * Unregister a shortcut
     */
    unregister(shortcut: string): Promise<void>;
    /**
     * Unregister all shortcuts
     */
    unregisterAll(): Promise<void>;
    /**
     * Check if a shortcut is registered
     */
    isRegistered(shortcut: string): Promise<boolean>;
    /**
     * Get all registered shortcuts
     */
    getRegistered(): string[];
};
export declare const registerShortcut: (shortcut: string, handler: () => void) => Promise<() => void>;
export declare const unregisterShortcut: (shortcut: string) => Promise<void>;
export declare const unregisterAllShortcuts: () => Promise<void>;
export declare const isShortcutRegistered: (shortcut: string) => Promise<boolean>;
//# sourceMappingURL=shortcut.d.ts.map