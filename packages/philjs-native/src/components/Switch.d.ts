/**
 * Switch Component
 *
 * A toggle switch component for boolean values.
 * Follows platform conventions for iOS and Android.
 */
import { type Signal } from 'philjs-core';
import type { ViewStyle } from '../styles.js';
/**
 * Switch props
 */
export interface SwitchProps {
    /**
     * Current value of the switch
     */
    value?: boolean;
    /**
     * Callback when value changes
     */
    onValueChange?: (value: boolean) => void;
    /**
     * Whether the switch is disabled
     */
    disabled?: boolean;
    /**
     * Color when switch is on (iOS)
     */
    onColor?: string;
    /**
     * Color when switch is off
     */
    offColor?: string;
    /**
     * Color of the thumb
     */
    thumbColor?: string;
    /**
     * Track color when on (Android)
     */
    trackColor?: {
        false?: string;
        true?: string;
    };
    /**
     * iOS-specific track color
     */
    ios_backgroundColor?: string;
    /**
     * Style for the switch container
     */
    style?: ViewStyle;
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
}
/**
 * Create a Switch component
 */
export declare function Switch(props: SwitchProps): any;
/**
 * Create a controlled switch state
 */
export declare function useSwitchState(initialValue?: boolean): {
    value: Signal<boolean>;
    toggle: () => void;
    setOn: () => void;
    setOff: () => void;
};
export default Switch;
//# sourceMappingURL=Switch.d.ts.map