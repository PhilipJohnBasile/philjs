/**
 * ScrollView Component
 *
 * A scrollable container component.
 * Supports both vertical and horizontal scrolling.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// ScrollView Component
// ============================================================================
/**
 * Create a ScrollView component
 */
export function ScrollView(props) {
    const platform = detectPlatform();
    // Merge styles if array
    const mergedStyle = Array.isArray(props.style)
        ? Object.assign({}, ...props.style.filter(Boolean))
        : props.style || {};
    const mergedContentStyle = Array.isArray(props.contentContainerStyle)
        ? Object.assign({}, ...props.contentContainerStyle.filter(Boolean))
        : props.contentContainerStyle || {};
    // Convert style to platform-specific format
    const platformStyle = convertScrollViewStyle(mergedStyle, props, platform);
    const contentStyle = convertContentStyle(mergedContentStyle, props, platform);
    if (platform === 'web') {
        // Create scroll handler with throttling
        let lastScrollTime = 0;
        const throttle = props.scrollEventThrottle || 16;
        const handleScroll = (e) => {
            const now = Date.now();
            if (now - lastScrollTime < throttle)
                return;
            lastScrollTime = now;
            const target = e.target;
            const scrollEvent = {
                nativeEvent: {
                    contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
                    contentOffset: { x: target.scrollLeft, y: target.scrollTop },
                    contentSize: { width: target.scrollWidth, height: target.scrollHeight },
                    layoutMeasurement: { width: target.clientWidth, height: target.clientHeight },
                    zoomScale: 1,
                },
            };
            props.onScroll?.(scrollEvent);
        };
        return {
            type: 'div',
            props: {
                style: platformStyle,
                'data-testid': props.testID,
                onScroll: handleScroll,
                onTouchStart: props.onScrollBeginDrag ? () => {
                    // Create synthetic event
                } : undefined,
            },
            children: {
                type: 'div',
                props: {
                    style: contentStyle,
                },
                children: props.children,
            },
        };
    }
    // Return native element descriptor
    return {
        type: 'NativeScrollView',
        props: {
            ...props,
            style: platformStyle,
            contentContainerStyle: contentStyle,
        },
        children: props.children,
    };
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Convert scroll view style to platform-specific format
 */
function convertScrollViewStyle(style, props, platform) {
    const result = {};
    for (const [key, value] of Object.entries(style)) {
        if (value === undefined || value === null)
            continue;
        if (platform === 'web') {
            const cssKey = camelToKebab(key);
            result[cssKey] = convertValue(key, value);
        }
        else {
            result[key] = value;
        }
    }
    if (platform === 'web') {
        // Add scroll behavior
        result['overflow-x'] = props.horizontal ? 'auto' : 'hidden';
        result['overflow-y'] = props.horizontal ? 'hidden' : 'auto';
        result['-webkit-overflow-scrolling'] = 'touch';
        // Handle scroll indicators
        if (!props.showsHorizontalScrollIndicator || !props.showsVerticalScrollIndicator) {
            result['scrollbar-width'] = 'none';
            result['-ms-overflow-style'] = 'none';
        }
        // Handle snap
        if (props.pagingEnabled || props.snapToInterval) {
            result['scroll-snap-type'] = props.horizontal ? 'x mandatory' : 'y mandatory';
        }
        // Disable scrolling if needed
        if (props.scrollEnabled === false) {
            result['overflow'] = 'hidden';
        }
    }
    return result;
}
/**
 * Convert content container style
 */
function convertContentStyle(style, props, platform) {
    const result = {};
    for (const [key, value] of Object.entries(style)) {
        if (value === undefined || value === null)
            continue;
        if (platform === 'web') {
            const cssKey = camelToKebab(key);
            result[cssKey] = convertValue(key, value);
        }
        else {
            result[key] = value;
        }
    }
    if (platform === 'web') {
        // Set flex direction based on horizontal prop
        if (!result['flex-direction']) {
            result['flex-direction'] = props.horizontal ? 'row' : 'column';
        }
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
// ScrollView Utilities
// ============================================================================
/**
 * Create a ScrollView reference
 */
export function createScrollViewRef() {
    const state = { scrollElement: null };
    return {
        scrollTo(options) {
            if (state.scrollElement) {
                state.scrollElement.scrollTo({
                    left: options.x || 0,
                    top: options.y || 0,
                    behavior: options.animated ? 'smooth' : 'auto',
                });
            }
        },
        scrollToEnd(options) {
            if (state.scrollElement) {
                state.scrollElement.scrollTo({
                    top: state.scrollElement.scrollHeight,
                    behavior: options?.animated ? 'smooth' : 'auto',
                });
            }
        },
        flashScrollIndicators() {
            // Web doesn't have a native way to flash scroll indicators
            // Could implement with CSS animation
        },
        getScrollOffset() {
            if (state.scrollElement) {
                return {
                    x: state.scrollElement.scrollLeft,
                    y: state.scrollElement.scrollTop,
                };
            }
            return { x: 0, y: 0 };
        },
    };
}
// ============================================================================
// Exports
// ============================================================================
export default ScrollView;
//# sourceMappingURL=ScrollView.js.map