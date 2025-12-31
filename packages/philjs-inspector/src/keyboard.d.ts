/**
 * Keyboard shortcuts and navigation for inspector
 */
export type KeyboardHandler = (event: KeyboardEvent) => void | boolean;
export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    handler: KeyboardHandler;
    description: string;
}
/**
 * Register keyboard shortcut
 */
export declare function registerShortcut(shortcut: KeyboardShortcut): void;
/**
 * Unregister keyboard shortcut
 */
export declare function unregisterShortcut(key: string): void;
/**
 * Start listening for keyboard events
 */
export declare function startKeyboardListening(): void;
/**
 * Stop listening for keyboard events
 */
export declare function stopKeyboardListening(): void;
/**
 * Get all registered shortcuts
 */
export declare function getAllShortcuts(): KeyboardShortcut[];
/**
 * Clear all shortcuts
 */
export declare function clearAllShortcuts(): void;
/**
 * Format shortcut for display
 */
export declare function formatShortcut(shortcut: KeyboardShortcut): string;
/**
 * Check if keyboard event matches shortcut
 */
export declare function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean;
/**
 * Navigation helper for traversing component tree
 */
export declare class ComponentNavigator {
    private currentIndex;
    private elements;
    constructor();
    /**
     * Update elements list
     */
    setElements(elements: Element[]): void;
    /**
     * Navigate to next component
     */
    next(): Element | null;
    /**
     * Navigate to previous component
     */
    previous(): Element | null;
    /**
     * Navigate to parent component
     */
    parent(current: Element): Element | null;
    /**
     * Navigate to first child component
     */
    firstChild(current: Element): Element | null;
    /**
     * Navigate to next sibling
     */
    nextSibling(current: Element): Element | null;
    /**
     * Navigate to previous sibling
     */
    previousSibling(current: Element): Element | null;
    /**
     * Get current element
     */
    getCurrent(): Element | null;
    /**
     * Set current element
     */
    setCurrent(element: Element): void;
    /**
     * Get total count
     */
    getCount(): number;
    /**
     * Get current index
     */
    getCurrentIndex(): number;
}
//# sourceMappingURL=keyboard.d.ts.map