/**
 * Switch Component
 *
 * A toggle switch component for boolean values.
 * Follows platform conventions for iOS and Android.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Default Colors
// ============================================================================
const DEFAULT_COLORS = {
    ios: {
        on: '#34C759',
        off: '#E5E5EA',
        thumb: '#FFFFFF',
    },
    android: {
        on: '#6200EE',
        onTrack: 'rgba(98, 0, 238, 0.5)',
        off: '#FFFFFF',
        offTrack: 'rgba(0, 0, 0, 0.26)',
        thumb: '#FFFFFF',
        thumbOn: '#6200EE',
    },
};
// ============================================================================
// Switch Component
// ============================================================================
/**
 * Create a Switch component
 */
export function Switch(props) {
    const platform = detectPlatform();
    const isOn = signal(props.value ?? false);
    // Update internal state when prop changes
    effect(() => {
        if (props.value !== undefined) {
            isOn.set(props.value);
        }
    });
    const handleToggle = () => {
        if (props.disabled)
            return;
        const newValue = !isOn();
        isOn.set(newValue);
        props.onValueChange?.(newValue);
    };
    if (platform === 'web') {
        return renderWebSwitch(props, isOn, handleToggle, platform);
    }
    // Return native element descriptor
    return {
        type: 'NativeSwitch',
        props: {
            value: isOn(),
            onValueChange: (value) => {
                isOn.set(value);
                props.onValueChange?.(value);
            },
            disabled: props.disabled,
            trackColor: props.trackColor,
            thumbColor: props.thumbColor,
            ios_backgroundColor: props.ios_backgroundColor,
            style: props.style,
            testID: props.testID,
            accessibilityLabel: props.accessibilityLabel,
            accessibilityHint: props.accessibilityHint,
        },
        children: null,
    };
}
/**
 * Render switch for web
 */
function renderWebSwitch(props, isOn, handleToggle, platform) {
    const on = isOn();
    const colors = DEFAULT_COLORS.ios;
    const onColor = props.onColor || props.trackColor?.true || colors.on;
    const offColor = props.offColor || props.trackColor?.false || colors.off;
    const thumbColor = props.thumbColor || colors.thumb;
    const trackStyle = {
        position: 'relative',
        width: '51px',
        height: '31px',
        'border-radius': '15.5px',
        'background-color': on ? onColor : offColor,
        transition: 'background-color 0.2s ease',
        cursor: props.disabled ? 'default' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
    };
    const thumbStyle = {
        position: 'absolute',
        top: '2px',
        left: on ? '22px' : '2px',
        width: '27px',
        height: '27px',
        'border-radius': '13.5px',
        'background-color': thumbColor,
        'box-shadow': '0 2px 4px rgba(0, 0, 0, 0.2)',
        transition: 'left 0.2s ease',
    };
    return {
        type: 'button',
        props: {
            style: {
                display: 'inline-flex',
                border: 'none',
                background: 'none',
                padding: 0,
                margin: 0,
                'vertical-align': 'middle',
                ...props.style,
            },
            onClick: handleToggle,
            role: 'switch',
            'aria-checked': on,
            'aria-label': props.accessibilityLabel,
            'aria-disabled': props.disabled,
            'data-testid': props.testID,
            disabled: props.disabled,
        },
        children: [
            {
                type: 'div',
                props: { style: trackStyle },
                children: [
                    {
                        type: 'div',
                        props: { style: thumbStyle },
                        children: null,
                    },
                ],
            },
        ],
    };
}
// ============================================================================
// Controlled Switch Hook
// ============================================================================
/**
 * Create a controlled switch state
 */
export function useSwitchState(initialValue = false) {
    const value = signal(initialValue);
    return {
        value,
        toggle: () => value.set(!value()),
        setOn: () => value.set(true),
        setOff: () => value.set(false),
    };
}
// ============================================================================
// Export
// ============================================================================
export default Switch;
//# sourceMappingURL=Switch.js.map