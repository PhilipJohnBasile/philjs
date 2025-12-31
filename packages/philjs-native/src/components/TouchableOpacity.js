/**
 * TouchableOpacity Component
 *
 * A wrapper for making views respond properly to touches.
 * On press, the opacity of the wrapped view is decreased.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// TouchableOpacity Component
// ============================================================================
/**
 * Create a TouchableOpacity component
 */
export function TouchableOpacity(props) {
    const platform = detectPlatform();
    const isPressed = signal(false);
    // Merge styles if array
    const mergedStyle = Array.isArray(props.style)
        ? Object.assign({}, ...props.style.filter(Boolean))
        : props.style || {};
    const activeOpacity = props.activeOpacity ?? 0.2;
    const delayLongPress = props.delayLongPress ?? 500;
    let longPressTimer = null;
    let pressStartTime = 0;
    const handlePressIn = (event) => {
        if (props.disabled)
            return;
        isPressed.set(true);
        pressStartTime = Date.now();
        if (props.delayPressIn) {
            setTimeout(() => {
                if (isPressed()) {
                    props.onPressIn?.(createGestureEvent(event));
                }
            }, props.delayPressIn);
        }
        else {
            props.onPressIn?.(createGestureEvent(event));
        }
        // Set up long press timer
        if (props.onLongPress) {
            longPressTimer = setTimeout(() => {
                if (isPressed()) {
                    props.onLongPress?.(createGestureEvent(event));
                }
            }, delayLongPress);
        }
    };
    const handlePressOut = (event) => {
        if (props.disabled)
            return;
        const wasPressed = isPressed();
        isPressed.set(false);
        // Clear long press timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        if (props.delayPressOut) {
            setTimeout(() => {
                props.onPressOut?.(createGestureEvent(event));
            }, props.delayPressOut);
        }
        else {
            props.onPressOut?.(createGestureEvent(event));
        }
        // Trigger onPress if it was a quick press
        if (wasPressed && Date.now() - pressStartTime < delayLongPress) {
            props.onPress?.(createGestureEvent(event));
        }
    };
    const handleClick = (event) => {
        if (props.disabled)
            return;
        props.onPress?.(createGestureEvent(event));
    };
    if (platform === 'web') {
        const baseStyle = {
            ...convertStyle(mergedStyle),
            cursor: props.disabled ? 'default' : 'pointer',
            'user-select': 'none',
            '-webkit-tap-highlight-color': 'transparent',
            transition: 'opacity 0.1s ease-in-out',
        };
        // Apply opacity when pressed
        const dynamicStyle = () => ({
            ...baseStyle,
            opacity: isPressed() ? activeOpacity : (mergedStyle.opacity ?? 1),
        });
        // Handle hit slop with padding/margin
        if (props.hitSlop) {
            baseStyle['padding'] = `${props.hitSlop.top || 0}px ${props.hitSlop.right || 0}px ${props.hitSlop.bottom || 0}px ${props.hitSlop.left || 0}px`;
            baseStyle['margin'] = `-${props.hitSlop.top || 0}px -${props.hitSlop.right || 0}px -${props.hitSlop.bottom || 0}px -${props.hitSlop.left || 0}px`;
        }
        return {
            type: 'div',
            props: {
                style: dynamicStyle(),
                'data-testid': props.testID,
                role: props.accessibilityRole || 'button',
                'aria-label': props.accessibilityLabel,
                'aria-disabled': props.disabled,
                tabIndex: props.disabled ? -1 : 0,
                onMouseDown: handlePressIn,
                onMouseUp: handlePressOut,
                onMouseLeave: () => {
                    if (isPressed()) {
                        handlePressOut({});
                    }
                },
                onTouchStart: handlePressIn,
                onTouchEnd: handlePressOut,
                onKeyDown: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick(e);
                    }
                },
            },
            children: props.children,
        };
    }
    // Return native element descriptor
    return {
        type: 'NativeTouchableOpacity',
        props: {
            ...props,
            style: mergedStyle,
        },
        children: props.children,
    };
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Create a gesture event from a DOM event
 */
function createGestureEvent(event) {
    const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
    return {
        nativeEvent: {
            changedTouches: [],
            identifier: 0,
            locationX: touch.offsetX || touch.clientX || 0,
            locationY: touch.offsetY || touch.clientY || 0,
            pageX: touch.pageX || 0,
            pageY: touch.pageY || 0,
            target: 0,
            timestamp: Date.now(),
        },
    };
}
/**
 * Convert style to CSS format
 */
function convertStyle(style) {
    const result = {};
    for (const [key, value] of Object.entries(style)) {
        if (value === undefined || value === null)
            continue;
        const cssKey = camelToKebab(key);
        result[cssKey] = convertValue(key, value);
    }
    // Add default display flex
    if (!result['display']) {
        result['display'] = 'flex';
    }
    return result;
}
/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
/**
 * Convert value to CSS-compatible format
 */
function convertValue(key, value) {
    const unitlessProperties = [
        'flex',
        'flexGrow',
        'flexShrink',
        'opacity',
        'zIndex',
        'aspectRatio',
    ];
    if (typeof value === 'number' && !unitlessProperties.includes(key)) {
        return `${value}px`;
    }
    return String(value);
}
export function TouchableHighlight(props) {
    // Similar implementation to TouchableOpacity but with background color change
    return TouchableOpacity({
        ...props,
        activeOpacity: 1,
    });
}
/**
 * TouchableWithoutFeedback - no visual feedback
 */
export function TouchableWithoutFeedback(props) {
    return TouchableOpacity({
        ...props,
        activeOpacity: 1,
    });
}
export function Pressable(props) {
    return TouchableOpacity(props);
}
// ============================================================================
// Exports
// ============================================================================
export default TouchableOpacity;
//# sourceMappingURL=TouchableOpacity.js.map