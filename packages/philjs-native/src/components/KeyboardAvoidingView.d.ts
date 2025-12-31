/**
 * KeyboardAvoidingView Component
 *
 * A view that automatically adjusts its height or position
 * when the keyboard appears to keep content visible.
 */
import { type Signal } from 'philjs-core';
import type { ViewStyle } from '../styles.js';
/**
 * Keyboard behavior modes
 */
export type KeyboardBehavior = 'height' | 'position' | 'padding';
/**
 * KeyboardAvoidingView props
 */
export interface KeyboardAvoidingViewProps {
    /**
     * Children elements
     */
    children?: any;
    /**
     * How the view should adjust
     * - 'height': Adjusts the height of the view
     * - 'position': Moves the view up
     * - 'padding': Adds padding to the bottom
     */
    behavior?: KeyboardBehavior;
    /**
     * Content container style
     */
    contentContainerStyle?: ViewStyle;
    /**
     * Whether keyboard avoiding is enabled
     */
    enabled?: boolean;
    /**
     * Extra offset to add to keyboard height
     */
    keyboardVerticalOffset?: number;
    /**
     * Style for the view
     */
    style?: ViewStyle;
    /**
     * Test ID for testing
     */
    testID?: string;
}
/**
 * Keyboard info
 */
export interface KeyboardInfo {
    isVisible: boolean;
    height: number;
    duration: number;
    easing: string;
}
/**
 * Global keyboard state
 */
export declare const keyboardState: Signal<KeyboardInfo>;
/**
 * Create a KeyboardAvoidingView component
 */
export declare function KeyboardAvoidingView(props: KeyboardAvoidingViewProps): any;
/**
 * Hook to listen for keyboard events
 */
export declare function useKeyboard(): {
    isVisible: boolean;
    height: number;
    dismiss: () => void;
};
/**
 * Hook to run effect when keyboard shows/hides
 */
export declare function useKeyboardEffect(onShow?: (height: number) => void, onHide?: () => void): void;
/**
 * Keyboard API singleton
 */
export declare const Keyboard: {
    /**
     * Dismiss the keyboard
     */
    dismiss(): void;
    /**
     * Add keyboard show listener
     */
    addListener(event: "keyboardWillShow" | "keyboardDidShow" | "keyboardWillHide" | "keyboardDidHide", callback: (info: KeyboardInfo) => void): {
        remove: () => void;
    };
    /**
     * Schedule layout animation for keyboard
     */
    scheduleLayoutAnimation(duration: number): void;
    /**
     * Get current keyboard state
     */
    getState(): KeyboardInfo;
};
/**
 * DismissKeyboard props
 */
export interface DismissKeyboardProps {
    children: any;
    onDismiss?: () => void;
}
/**
 * Wrapper component that dismisses keyboard on tap
 */
export declare function DismissKeyboard(props: DismissKeyboardProps): any;
export default KeyboardAvoidingView;
//# sourceMappingURL=KeyboardAvoidingView.d.ts.map