/**
 * Button Component
 *
 * A basic button component that renders as a native button on each platform.
 * For more control over styling, use TouchableOpacity or Pressable.
 */
/**
 * Button props
 */
export interface ButtonProps {
    /**
     * Button title text
     */
    title: string;
    /**
     * Callback when pressed
     */
    onPress: () => void;
    /**
     * Button color
     */
    color?: string;
    /**
     * Whether button is disabled
     */
    disabled?: boolean;
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
     * Accessibility state
     */
    accessibilityState?: {
        disabled?: boolean;
        selected?: boolean;
        busy?: boolean;
    };
    /**
     * TV preferred focus
     */
    hasTVPreferredFocus?: boolean;
    /**
     * Next focus direction (TV)
     */
    nextFocusDown?: number;
    nextFocusForward?: number;
    nextFocusLeft?: number;
    nextFocusRight?: number;
    nextFocusUp?: number;
    /**
     * Touch sound (Android)
     */
    touchSoundDisabled?: boolean;
}
/**
 * Create a Button component
 */
export declare function Button(props: ButtonProps): any;
export default Button;
//# sourceMappingURL=Button.d.ts.map