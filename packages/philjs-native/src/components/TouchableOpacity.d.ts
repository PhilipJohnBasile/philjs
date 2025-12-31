/**
 * TouchableOpacity Component
 *
 * A wrapper for making views respond properly to touches.
 * On press, the opacity of the wrapped view is decreased.
 */
import type { ViewStyle } from '../styles.js';
/**
 * Press event
 */
export interface GestureResponderEvent {
    nativeEvent: {
        changedTouches: any[];
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
 * TouchableOpacity props
 */
export interface TouchableOpacityProps {
    /**
     * Children elements
     */
    children?: any;
    /**
     * Style for the touchable
     */
    style?: ViewStyle | ViewStyle[];
    /**
     * Opacity when pressed
     */
    activeOpacity?: number;
    /**
     * Whether the touchable is disabled
     */
    disabled?: boolean;
    /**
     * Callback when pressed
     */
    onPress?: (event: GestureResponderEvent) => void;
    /**
     * Callback when pressed in
     */
    onPressIn?: (event: GestureResponderEvent) => void;
    /**
     * Callback when pressed out
     */
    onPressOut?: (event: GestureResponderEvent) => void;
    /**
     * Callback when long pressed
     */
    onLongPress?: (event: GestureResponderEvent) => void;
    /**
     * Delay before onPressIn is called (ms)
     */
    delayPressIn?: number;
    /**
     * Delay before onPressOut is called (ms)
     */
    delayPressOut?: number;
    /**
     * Delay before onLongPress is called (ms)
     */
    delayLongPress?: number;
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
     * Press retention offset
     */
    pressRetentionOffset?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    /**
     * Test ID for testing
     */
    testID?: string;
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
    accessibilityRole?: 'button' | 'link' | 'none';
    /**
     * Accessibility state
     */
    accessibilityState?: {
        disabled?: boolean;
        selected?: boolean;
        checked?: boolean | 'mixed';
        busy?: boolean;
        expanded?: boolean;
    };
    /**
     * TV parallax properties (tvOS)
     */
    tvParallaxProperties?: any;
    /**
     * Has TV preferred focus
     */
    hasTVPreferredFocus?: boolean;
    /**
     * Next focus down (Android TV)
     */
    nextFocusDown?: number;
    /**
     * Next focus forward (Android TV)
     */
    nextFocusForward?: number;
    /**
     * Next focus left (Android TV)
     */
    nextFocusLeft?: number;
    /**
     * Next focus right (Android TV)
     */
    nextFocusRight?: number;
    /**
     * Next focus up (Android TV)
     */
    nextFocusUp?: number;
}
/**
 * Create a TouchableOpacity component
 */
export declare function TouchableOpacity(props: TouchableOpacityProps): any;
/**
 * TouchableHighlight - highlights on press
 */
export interface TouchableHighlightProps extends TouchableOpacityProps {
    underlayColor?: string;
    onShowUnderlay?: () => void;
    onHideUnderlay?: () => void;
}
export declare function TouchableHighlight(props: TouchableHighlightProps): any;
/**
 * TouchableWithoutFeedback - no visual feedback
 */
export declare function TouchableWithoutFeedback(props: TouchableOpacityProps): any;
/**
 * Pressable - modern touch handling component
 */
export interface PressableProps extends TouchableOpacityProps {
    android_ripple?: {
        color?: string;
        borderless?: boolean;
        radius?: number;
        foreground?: boolean;
    };
    unstable_pressDelay?: number;
}
export declare function Pressable(props: PressableProps): any;
export default TouchableOpacity;
//# sourceMappingURL=TouchableOpacity.d.ts.map