/**
 * KeyboardAvoidingView Component
 *
 * A view that automatically adjusts its height or position
 * when the keyboard appears to keep content visible.
 */
import { signal, effect, batch } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// State
// ============================================================================
/**
 * Global keyboard state
 */
export const keyboardState = signal({
    isVisible: false,
    height: 0,
    duration: 250,
    easing: 'easeOut',
});
/**
 * Initialize keyboard listeners
 */
let keyboardListenersInitialized = false;
function initKeyboardListeners() {
    if (keyboardListenersInitialized)
        return;
    if (typeof window === 'undefined')
        return;
    keyboardListenersInitialized = true;
    // Use visualViewport API for better keyboard detection
    if (window.visualViewport) {
        const updateKeyboardHeight = () => {
            const viewport = window.visualViewport;
            const windowHeight = window.innerHeight;
            const viewportHeight = viewport.height;
            const keyboardHeight = windowHeight - viewportHeight;
            keyboardState.set({
                isVisible: keyboardHeight > 100,
                height: keyboardHeight > 100 ? keyboardHeight : 0,
                duration: 250,
                easing: 'easeOut',
            });
        };
        window.visualViewport.addEventListener('resize', updateKeyboardHeight);
        window.visualViewport.addEventListener('scroll', updateKeyboardHeight);
    }
    else {
        // Fallback for browsers without visualViewport
        let initialHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const diff = initialHeight - currentHeight;
            if (diff > 100) {
                keyboardState.set({
                    isVisible: true,
                    height: diff,
                    duration: 250,
                    easing: 'easeOut',
                });
            }
            else {
                keyboardState.set({
                    isVisible: false,
                    height: 0,
                    duration: 250,
                    easing: 'easeOut',
                });
            }
        });
        // Detect focus on input elements
        document.addEventListener('focusin', (e) => {
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                // Virtual keyboard will show - estimate height
                setTimeout(() => {
                    const currentHeight = window.innerHeight;
                    if (initialHeight - currentHeight > 100) {
                        keyboardState.set({
                            isVisible: true,
                            height: initialHeight - currentHeight,
                            duration: 250,
                            easing: 'easeOut',
                        });
                    }
                }, 100);
            }
        });
        document.addEventListener('focusout', () => {
            setTimeout(() => {
                keyboardState.set({
                    isVisible: false,
                    height: 0,
                    duration: 250,
                    easing: 'easeOut',
                });
            }, 100);
        });
    }
}
// ============================================================================
// KeyboardAvoidingView Component
// ============================================================================
/**
 * Create a KeyboardAvoidingView component
 */
export function KeyboardAvoidingView(props) {
    const platform = detectPlatform();
    const enabled = props.enabled ?? true;
    const behavior = props.behavior ?? (platform === 'ios' ? 'padding' : 'height');
    const keyboardVerticalOffset = props.keyboardVerticalOffset ?? 0;
    // Initialize keyboard listeners
    if (platform === 'web') {
        initKeyboardListeners();
    }
    if (platform === 'web') {
        return renderWebKeyboardAvoidingView(props, behavior, keyboardVerticalOffset, enabled);
    }
    // Return native element descriptor
    return {
        type: 'NativeKeyboardAvoidingView',
        props: {
            behavior,
            enabled,
            keyboardVerticalOffset,
            style: props.style,
            contentContainerStyle: props.contentContainerStyle,
            testID: props.testID,
        },
        children: props.children,
    };
}
/**
 * Render KeyboardAvoidingView for web
 */
function renderWebKeyboardAvoidingView(props, behavior, keyboardVerticalOffset, enabled) {
    const keyboard = keyboardState();
    const offset = enabled && keyboard.isVisible
        ? keyboard.height + keyboardVerticalOffset
        : 0;
    let containerStyle = {
        flex: 1,
        ...convertStyle(props.style || {}),
        transition: `all ${keyboard.duration}ms ease-out`,
    };
    if (enabled && keyboard.isVisible) {
        switch (behavior) {
            case 'height':
                containerStyle['height'] = `calc(100% - ${offset}px)`;
                break;
            case 'position':
                containerStyle['transform'] = `translateY(-${offset}px)`;
                break;
            case 'padding':
                containerStyle['paddingBottom'] = `${offset}px`;
                break;
        }
    }
    return {
        type: 'div',
        props: {
            style: containerStyle,
            'data-testid': props.testID,
        },
        children: props.children,
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
        const cssKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        if (typeof value === 'number' && !['flex', 'opacity', 'zIndex'].includes(key)) {
            result[cssKey] = `${value}px`;
        }
        else {
            result[cssKey] = String(value);
        }
    }
    return result;
}
// ============================================================================
// Keyboard Hooks
// ============================================================================
/**
 * Hook to listen for keyboard events
 */
export function useKeyboard() {
    const keyboard = keyboardState();
    const dismiss = () => {
        if (typeof document !== 'undefined') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.blur) {
                activeElement.blur();
            }
        }
        const platform = detectPlatform();
        if (platform !== 'web') {
            nativeBridge.call('Keyboard', 'dismiss');
        }
    };
    return {
        isVisible: keyboard.isVisible,
        height: keyboard.height,
        dismiss,
    };
}
/**
 * Hook to run effect when keyboard shows/hides
 */
export function useKeyboardEffect(onShow, onHide) {
    effect(() => {
        const keyboard = keyboardState();
        if (keyboard.isVisible && onShow) {
            onShow(keyboard.height);
        }
        else if (!keyboard.isVisible && onHide) {
            onHide();
        }
    });
}
// ============================================================================
// Keyboard API
// ============================================================================
/**
 * Keyboard API singleton
 */
export const Keyboard = {
    /**
     * Dismiss the keyboard
     */
    dismiss() {
        const platform = detectPlatform();
        if (platform === 'web') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.blur) {
                activeElement.blur();
            }
        }
        else {
            nativeBridge.call('Keyboard', 'dismiss');
        }
    },
    /**
     * Add keyboard show listener
     */
    addListener(event, callback) {
        const platform = detectPlatform();
        if (platform === 'web') {
            // Web uses effect on keyboardState
            const cleanup = effect(() => {
                const keyboard = keyboardState();
                if (event.includes('Show') && keyboard.isVisible) {
                    callback(keyboard);
                }
                else if (event.includes('Hide') && !keyboard.isVisible) {
                    callback(keyboard);
                }
            });
            return { remove: cleanup };
        }
        // Native event listener
        return {
            remove: () => {
                // Would remove native listener
            },
        };
    },
    /**
     * Schedule layout animation for keyboard
     */
    scheduleLayoutAnimation(duration) {
        const platform = detectPlatform();
        if (platform !== 'web') {
            nativeBridge.call('Keyboard', 'scheduleLayoutAnimation', duration);
        }
    },
    /**
     * Get current keyboard state
     */
    getState() {
        return keyboardState();
    },
};
/**
 * Wrapper component that dismisses keyboard on tap
 */
export function DismissKeyboard(props) {
    const platform = detectPlatform();
    const handlePress = () => {
        Keyboard.dismiss();
        props.onDismiss?.();
    };
    if (platform === 'web') {
        return {
            type: 'div',
            props: {
                style: { flex: 1 },
                onClick: handlePress,
            },
            children: props.children,
        };
    }
    return {
        type: 'TouchableWithoutFeedback',
        props: {
            onPress: handlePress,
        },
        children: props.children,
    };
}
// ============================================================================
// Exports
// ============================================================================
export default KeyboardAvoidingView;
//# sourceMappingURL=KeyboardAvoidingView.js.map