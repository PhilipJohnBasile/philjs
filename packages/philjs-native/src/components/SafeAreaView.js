/**
 * SafeAreaView Component
 *
 * A component that renders content within the safe area boundaries of a device.
 * Handles notches, home indicators, and other device-specific UI elements.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge, platformInfo } from '../runtime.js';
// ============================================================================
// Safe Area Context
// ============================================================================
/**
 * Default safe area insets
 */
const defaultInsets = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
};
/**
 * Signal for current safe area insets
 */
export const safeAreaInsets = signal(getInitialInsets());
/**
 * Get initial insets based on platform
 */
function getInitialInsets() {
    if (typeof window === 'undefined') {
        return defaultInsets;
    }
    // Use CSS environment variables for web
    const computedStyle = getComputedStyle(document.documentElement);
    const parseEnv = (name) => {
        const value = computedStyle.getPropertyValue(name);
        return parseInt(value, 10) || 0;
    };
    // Modern browsers support env() for safe areas
    return {
        top: parseEnv('--safe-area-inset-top') || getEstimatedTopInset(),
        right: parseEnv('--safe-area-inset-right') || 0,
        bottom: parseEnv('--safe-area-inset-bottom') || getEstimatedBottomInset(),
        left: parseEnv('--safe-area-inset-left') || 0,
    };
}
/**
 * Estimate top inset based on device
 */
function getEstimatedTopInset() {
    if (typeof window === 'undefined')
        return 0;
    const platform = detectPlatform();
    const info = platformInfo();
    // iPhone with notch detection (simplified)
    if (platform === 'ios' || (info.isWeb && /iPhone/.test(navigator.userAgent))) {
        const isIPhoneX = window.innerHeight >= 812 && window.innerWidth <= 428;
        if (isIPhoneX) {
            return 44; // iPhone X and later notch height
        }
        return 20; // Status bar height for older iPhones
    }
    // Android status bar
    if (platform === 'android') {
        return 24;
    }
    return 0;
}
/**
 * Estimate bottom inset based on device
 */
function getEstimatedBottomInset() {
    if (typeof window === 'undefined')
        return 0;
    const platform = detectPlatform();
    const info = platformInfo();
    // iPhone with home indicator
    if (platform === 'ios' || (info.isWeb && /iPhone/.test(navigator.userAgent))) {
        const hasHomeIndicator = window.innerHeight >= 812 && window.innerWidth <= 428;
        if (hasHomeIndicator) {
            return 34; // Home indicator height
        }
    }
    return 0;
}
// ============================================================================
// SafeAreaView Component
// ============================================================================
/**
 * Create a SafeAreaView component
 */
export function SafeAreaView(props) {
    const platform = detectPlatform();
    const edges = props.edges || ['top', 'right', 'bottom', 'left'];
    const mode = props.mode || 'padding';
    // Merge styles if array
    const mergedStyle = Array.isArray(props.style)
        ? Object.assign({}, ...props.style.filter(Boolean))
        : props.style || {};
    if (platform === 'web') {
        const insets = safeAreaInsets();
        const safeAreaStyle = {
            ...convertStyle(mergedStyle),
            display: 'flex',
            'flex-direction': 'column',
            flex: 1,
        };
        // Apply insets based on mode and edges
        const prefix = mode === 'margin' ? 'margin' : 'padding';
        if (edges.includes('top')) {
            safeAreaStyle[`${prefix}-top`] = `max(${insets.top}px, env(safe-area-inset-top, 0px))`;
        }
        if (edges.includes('right')) {
            safeAreaStyle[`${prefix}-right`] = `max(${insets.right}px, env(safe-area-inset-right, 0px))`;
        }
        if (edges.includes('bottom')) {
            safeAreaStyle[`${prefix}-bottom`] = `max(${insets.bottom}px, env(safe-area-inset-bottom, 0px))`;
        }
        if (edges.includes('left')) {
            safeAreaStyle[`${prefix}-left`] = `max(${insets.left}px, env(safe-area-inset-left, 0px))`;
        }
        return {
            type: 'div',
            props: {
                style: safeAreaStyle,
                'data-testid': props.testID,
            },
            children: props.children,
        };
    }
    // Return native element descriptor
    return {
        type: 'NativeSafeAreaView',
        props: {
            ...props,
            style: mergedStyle,
            edges,
        },
        children: props.children,
    };
}
// ============================================================================
// Safe Area Hooks
// ============================================================================
/**
 * Get current safe area insets
 */
export function useSafeAreaInsets() {
    return safeAreaInsets();
}
/**
 * Get frame including safe area
 */
export function useSafeAreaFrame() {
    const insets = safeAreaInsets();
    if (typeof window === 'undefined') {
        return { x: 0, y: 0, width: 375, height: 812 };
    }
    return {
        x: insets.left,
        y: insets.top,
        width: window.innerWidth - insets.left - insets.right,
        height: window.innerHeight - insets.top - insets.bottom,
    };
}
/**
 * SafeAreaProvider component
 * Provides safe area context to child components
 */
export function SafeAreaProvider(props) {
    const platform = detectPlatform();
    // Set up listener for safe area changes
    if (typeof window !== 'undefined') {
        // Update on resize/orientation change
        const updateInsets = () => {
            safeAreaInsets.set(getInitialInsets());
        };
        window.addEventListener('resize', updateInsets);
        window.addEventListener('orientationchange', updateInsets);
        // Also check for viewport-fit changes
        if ('visualViewport' in window) {
            window.visualViewport?.addEventListener('resize', updateInsets);
        }
    }
    // Set initial metrics if provided
    if (props.initialMetrics) {
        safeAreaInsets.set(props.initialMetrics.insets);
    }
    if (platform === 'web') {
        return {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    'flex-direction': 'column',
                    flex: 1,
                    'min-height': '100vh',
                },
            },
            children: props.children,
        };
    }
    return {
        type: 'NativeSafeAreaProvider',
        props: props,
        children: props.children,
    };
}
// ============================================================================
// Helper Functions
// ============================================================================
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
// ============================================================================
// Exports
// ============================================================================
export default SafeAreaView;
//# sourceMappingURL=SafeAreaView.js.map