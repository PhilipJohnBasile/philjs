/**
 * ScrollView Component
 *
 * A scrollable container component.
 * Supports both vertical and horizontal scrolling.
 */
import type { ViewStyle } from '../styles.js';
/**
 * Scroll event
 */
export interface ScrollEvent {
    nativeEvent: {
        contentInset: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
        contentOffset: {
            x: number;
            y: number;
        };
        contentSize: {
            width: number;
            height: number;
        };
        layoutMeasurement: {
            width: number;
            height: number;
        };
        zoomScale: number;
    };
}
/**
 * Keyboard dismiss mode
 */
export type KeyboardDismissMode = 'none' | 'on-drag' | 'interactive';
/**
 * Scroll indicator insets
 */
export interface ScrollIndicatorInsets {
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
}
/**
 * ScrollView props
 */
export interface ScrollViewProps {
    /**
     * Children elements
     */
    children?: any;
    /**
     * Style for the scroll view
     */
    style?: ViewStyle | ViewStyle[];
    /**
     * Style for the content container
     */
    contentContainerStyle?: ViewStyle | ViewStyle[];
    /**
     * Whether scrolling is horizontal
     */
    horizontal?: boolean;
    /**
     * Whether to show horizontal scroll indicator
     */
    showsHorizontalScrollIndicator?: boolean;
    /**
     * Whether to show vertical scroll indicator
     */
    showsVerticalScrollIndicator?: boolean;
    /**
     * Whether scroll is enabled
     */
    scrollEnabled?: boolean;
    /**
     * Whether to bounce at edges
     */
    bounces?: boolean;
    /**
     * Bounce at start even if not scrollable
     */
    alwaysBounceVertical?: boolean;
    /**
     * Bounce at end even if not scrollable
     */
    alwaysBounceHorizontal?: boolean;
    /**
     * Whether paging is enabled
     */
    pagingEnabled?: boolean;
    /**
     * Snap to offsets
     */
    snapToOffsets?: number[];
    /**
     * Snap to interval
     */
    snapToInterval?: number;
    /**
     * Snap to alignment
     */
    snapToAlignment?: 'start' | 'center' | 'end';
    /**
     * Snap to start
     */
    snapToStart?: boolean;
    /**
     * Snap to end
     */
    snapToEnd?: boolean;
    /**
     * Deceleration rate
     */
    decelerationRate?: 'normal' | 'fast' | number;
    /**
     * Keyboard dismiss mode
     */
    keyboardDismissMode?: KeyboardDismissMode;
    /**
     * Keyboard should persist taps
     */
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
    /**
     * Content inset
     */
    contentInset?: {
        top?: number;
        left?: number;
        bottom?: number;
        right?: number;
    };
    /**
     * Content offset
     */
    contentOffset?: {
        x: number;
        y: number;
    };
    /**
     * Scroll indicator insets
     */
    scrollIndicatorInsets?: ScrollIndicatorInsets;
    /**
     * Scroll event throttle (ms)
     */
    scrollEventThrottle?: number;
    /**
     * Callback when scroll starts
     */
    onScrollBeginDrag?: (event: ScrollEvent) => void;
    /**
     * Callback when scroll ends drag
     */
    onScrollEndDrag?: (event: ScrollEvent) => void;
    /**
     * Callback when momentum scroll starts
     */
    onMomentumScrollBegin?: (event: ScrollEvent) => void;
    /**
     * Callback when momentum scroll ends
     */
    onMomentumScrollEnd?: (event: ScrollEvent) => void;
    /**
     * Callback when scrolling
     */
    onScroll?: (event: ScrollEvent) => void;
    /**
     * Callback when content size changes
     */
    onContentSizeChange?: (width: number, height: number) => void;
    /**
     * Refresh control component
     */
    refreshControl?: any;
    /**
     * Sticky header indices
     */
    stickyHeaderIndices?: number[];
    /**
     * Test ID for testing
     */
    testID?: string;
    /**
     * Invert sticky headers
     */
    invertStickyHeaders?: boolean;
    /**
     * Scroll to overflow enabled
     */
    scrollToOverflowEnabled?: boolean;
    /**
     * Nested scroll enabled (Android)
     */
    nestedScrollEnabled?: boolean;
    /**
     * Persist scroll position for navigation
     */
    persistentScrollbar?: boolean;
    /**
     * Disable scrollview from auto-adjusting for keyboard
     */
    automaticallyAdjustKeyboardInsets?: boolean;
    /**
     * Automatically adjusts content insets
     */
    automaticallyAdjustsScrollIndicatorInsets?: boolean;
}
/**
 * ScrollView ref methods
 */
export interface ScrollViewRef {
    scrollTo: (options: {
        x?: number;
        y?: number;
        animated?: boolean;
    }) => void;
    scrollToEnd: (options?: {
        animated?: boolean;
    }) => void;
    flashScrollIndicators: () => void;
    getScrollOffset: () => {
        x: number;
        y: number;
    };
}
/**
 * Create a ScrollView component
 */
export declare function ScrollView(props: ScrollViewProps): any;
/**
 * Create a ScrollView reference
 */
export declare function createScrollViewRef(): ScrollViewRef;
export default ScrollView;
//# sourceMappingURL=ScrollView.d.ts.map