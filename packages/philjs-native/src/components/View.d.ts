/**
 * View Component
 *
 * The most fundamental component for building UI.
 * A container that supports flexbox layout, styling, and touch handling.
 */
import type { ViewStyle } from '../styles.js';
/**
 * Accessibility role for View
 */
export type AccessibilityRole = 'none' | 'button' | 'link' | 'search' | 'image' | 'header' | 'summary' | 'alert' | 'checkbox' | 'combobox' | 'menu' | 'menubar' | 'menuitem' | 'progressbar' | 'radio' | 'scrollbar' | 'spinbutton' | 'switch' | 'tab' | 'tablist' | 'timer' | 'toolbar';
/**
 * Pointer events configuration
 */
export type PointerEvents = 'auto' | 'none' | 'box-none' | 'box-only';
/**
 * View props
 */
export interface ViewProps {
    /**
     * Style for the view
     */
    style?: ViewStyle | ViewStyle[];
    /**
     * Children elements
     */
    children?: any;
    /**
     * Test ID for testing
     */
    testID?: string;
    /**
     * Native ID for native reference
     */
    nativeID?: string;
    /**
     * Accessibility label
     */
    accessibilityLabel?: string;
    /**
     * Accessibility hint
     */
    accessibilityHint?: string;
    /**
     * Accessibility role
     */
    accessibilityRole?: AccessibilityRole;
    /**
     * Pointer events behavior
     */
    pointerEvents?: PointerEvents;
    /**
     * Whether view should be focusable
     */
    focusable?: boolean;
    /**
     * Callback when layout changes
     */
    onLayout?: (event: LayoutEvent) => void;
    /**
     * Callback when touch starts
     */
    onTouchStart?: (event: TouchEvent) => void;
    /**
     * Callback when touch ends
     */
    onTouchEnd?: (event: TouchEvent) => void;
    /**
     * Callback when touch moves
     */
    onTouchMove?: (event: TouchEvent) => void;
    /**
     * Hit slop - extends the touch area
     */
    hitSlop?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    /**
     * Remove from accessibility tree
     */
    accessibilityElementsHidden?: boolean;
    /**
     * Import accessibility elements from native
     */
    importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
    /**
     * Collapsible - for optimization
     */
    collapsable?: boolean;
    /**
     * Render to hardware texture (Android)
     */
    renderToHardwareTextureAndroid?: boolean;
    /**
     * Should rasterize (iOS)
     */
    shouldRasterizeIOS?: boolean;
}
/**
 * Layout event
 */
export interface LayoutEvent {
    nativeEvent: {
        layout: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    };
}
/**
 * Touch event
 */
export interface TouchEvent {
    nativeEvent: {
        changedTouches: Touch[];
        identifier: number;
        locationX: number;
        locationY: number;
        pageX: number;
        pageY: number;
        target: number;
        timestamp: number;
    };
}
/**
 * Touch point
 */
export interface Touch {
    identifier: number;
    locationX: number;
    locationY: number;
    pageX: number;
    pageY: number;
    target: number;
    timestamp: number;
}
/**
 * Create a View component
 */
export declare function View(props: ViewProps): any;
export default View;
//# sourceMappingURL=View.d.ts.map