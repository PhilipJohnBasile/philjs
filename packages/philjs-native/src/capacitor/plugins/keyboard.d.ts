/**
 * PhilJS Native - Capacitor Keyboard Plugin
 *
 * Provides keyboard management for mobile apps including
 * show/hide control, height tracking, and scroll behavior.
 */
import { type Signal } from 'philjs-core';
/**
 * Keyboard info
 */
export interface KeyboardInfo {
    keyboardHeight: number;
}
/**
 * Keyboard style (iOS)
 */
export type KeyboardStyle = 'dark' | 'light' | 'default';
/**
 * Keyboard resize mode
 */
export type KeyboardResizeMode = 'none' | 'body' | 'ionic' | 'native';
/**
 * Keyboard event
 */
export interface KeyboardEvent {
    keyboardHeight: number;
}
/**
 * Keyboard config
 */
export interface KeyboardConfig {
    resize?: KeyboardResizeMode;
    style?: KeyboardStyle;
    resizeOnFullScreen?: boolean;
}
/**
 * Keyboard visibility state
 */
export declare const keyboardVisible: Signal<boolean>;
/**
 * Keyboard height
 */
export declare const keyboardHeight: Signal<number>;
/**
 * Keyboard event listeners
 */
type KeyboardEventCallback = (info: KeyboardInfo) => void;
/**
 * Keyboard API
 */
export declare const CapacitorKeyboard: {
    /**
     * Show the keyboard
     */
    show(): Promise<void>;
    /**
     * Hide the keyboard
     */
    hide(): Promise<void>;
    /**
     * Set accessory bar visibility (iOS)
     */
    setAccessoryBarVisible(options: {
        isVisible: boolean;
    }): Promise<void>;
    /**
     * Set scroll behavior when keyboard appears
     */
    setScroll(options: {
        isDisabled: boolean;
    }): Promise<void>;
    /**
     * Set keyboard style (iOS)
     */
    setStyle(options: {
        style: KeyboardStyle;
    }): Promise<void>;
    /**
     * Set resize mode
     */
    setResizeMode(options: {
        mode: KeyboardResizeMode;
    }): Promise<void>;
    /**
     * Get current resize mode
     */
    getResizeMode(): Promise<{
        mode: KeyboardResizeMode;
    }>;
    /**
     * Add keyboard will show listener
     */
    addWillShowListener(callback: KeyboardEventCallback): () => void;
    /**
     * Add keyboard did show listener
     */
    addDidShowListener(callback: KeyboardEventCallback): () => void;
    /**
     * Add keyboard will hide listener
     */
    addWillHideListener(callback: KeyboardEventCallback): () => void;
    /**
     * Add keyboard did hide listener
     */
    addDidHideListener(callback: KeyboardEventCallback): () => void;
    /**
     * Remove all listeners
     */
    removeAllListeners(): void;
};
/**
 * Hook to get keyboard visibility
 */
export declare function useKeyboardVisible(): boolean;
/**
 * Hook to get keyboard height
 */
export declare function useKeyboardHeight(): number;
/**
 * Hook for keyboard state with auto-cleanup
 */
export declare function useKeyboard(): {
    visible: boolean;
    height: number;
    show: () => Promise<void>;
    hide: () => Promise<void>;
};
/**
 * Hook to handle keyboard events
 */
export declare function useKeyboardEvents(options: {
    onShow?: (info: KeyboardInfo) => void;
    onHide?: (info: KeyboardInfo) => void;
}): void;
/**
 * Get keyboard offset for a given element
 */
export declare function getKeyboardOffset(element: HTMLElement): number;
/**
 * Scroll element into view above keyboard
 */
export declare function scrollAboveKeyboard(element: HTMLElement, options?: {
    animated?: boolean;
    offset?: number;
}): void;
export default CapacitorKeyboard;
//# sourceMappingURL=keyboard.d.ts.map