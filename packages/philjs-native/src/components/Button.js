/**
 * Button Component
 *
 * A basic button component that renders as a native button on each platform.
 * For more control over styling, use TouchableOpacity or Pressable.
 */
import { signal } from 'philjs-core';
import { detectPlatform, nativeBridge, platformSelect } from '../runtime.js';
// ============================================================================
// Button Component
// ============================================================================
/**
 * Create a Button component
 */
export function Button(props) {
    const platform = detectPlatform();
    const isPressed = signal(false);
    // Platform-specific default colors
    const defaultColor = platformSelect({
        ios: '#007AFF',
        android: '#2196F3',
        default: '#007AFF',
    });
    const color = props.color || defaultColor;
    if (platform === 'web') {
        const buttonStyle = {
            'background-color': props.disabled ? '#CCCCCC' : color,
            color: '#FFFFFF',
            border: 'none',
            'border-radius': '4px',
            padding: '10px 20px',
            'font-size': '16px',
            'font-weight': '600',
            cursor: props.disabled ? 'not-allowed' : 'pointer',
            opacity: isPressed() ? 0.8 : 1,
            transition: 'opacity 0.1s ease-in-out',
            'text-transform': 'uppercase',
            'letter-spacing': '0.5px',
        };
        // Platform-specific styling
        if (platform === 'web') {
            // iOS-like styling
            buttonStyle['border-radius'] = '8px';
            buttonStyle['text-transform'] = 'none';
        }
        const handleClick = (e) => {
            if (props.disabled)
                return;
            e.preventDefault();
            props.onPress();
        };
        const handleMouseDown = () => {
            if (!props.disabled) {
                isPressed.set(true);
            }
        };
        const handleMouseUp = () => {
            isPressed.set(false);
        };
        return {
            type: 'button',
            props: {
                style: buttonStyle,
                disabled: props.disabled,
                'data-testid': props.testID,
                'aria-label': props.accessibilityLabel || props.title,
                'aria-disabled': props.disabled,
                onClick: handleClick,
                onMouseDown: handleMouseDown,
                onMouseUp: handleMouseUp,
                onMouseLeave: handleMouseUp,
                onKeyDown: (e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !props.disabled) {
                        e.preventDefault();
                        props.onPress();
                    }
                },
            },
            children: props.title,
        };
    }
    // Return native element descriptor
    return {
        type: 'NativeButton',
        props: {
            ...props,
            color,
        },
        children: null,
    };
}
// ============================================================================
// Exports
// ============================================================================
export default Button;
//# sourceMappingURL=Button.js.map