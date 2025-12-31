/**
 * SafeAreaView Component
 *
 * A component that renders content within the safe area boundaries of a device.
 * Handles notches, home indicators, and other device-specific UI elements.
 */
import { type Signal } from 'philjs-core';
import type { ViewStyle } from '../styles.js';
/**
 * Safe area insets
 */
export interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
/**
 * Edge modes for safe area
 */
export type SafeAreaEdge = 'top' | 'right' | 'bottom' | 'left';
/**
 * SafeAreaView props
 */
export interface SafeAreaViewProps {
    /**
     * Children elements
     */
    children?: any;
    /**
     * Style for the view
     */
    style?: ViewStyle | ViewStyle[];
    /**
     * Which edges to apply safe area insets
     */
    edges?: SafeAreaEdge[];
    /**
     * Mode for applying insets
     */
    mode?: 'padding' | 'margin';
    /**
     * Test ID for testing
     */
    testID?: string;
}
/**
 * Signal for current safe area insets
 */
export declare const safeAreaInsets: Signal<SafeAreaInsets>;
/**
 * Create a SafeAreaView component
 */
export declare function SafeAreaView(props: SafeAreaViewProps): any;
/**
 * Get current safe area insets
 */
export declare function useSafeAreaInsets(): SafeAreaInsets;
/**
 * Get frame including safe area
 */
export declare function useSafeAreaFrame(): {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * Props for SafeAreaProvider
 */
export interface SafeAreaProviderProps {
    children?: any;
    initialMetrics?: {
        insets: SafeAreaInsets;
        frame: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    };
}
/**
 * SafeAreaProvider component
 * Provides safe area context to child components
 */
export declare function SafeAreaProvider(props: SafeAreaProviderProps): any;
export default SafeAreaView;
//# sourceMappingURL=SafeAreaView.d.ts.map