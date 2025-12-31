/**
 * View Component
 *
 * The most fundamental component for building UI.
 * A container that supports flexbox layout, styling, and touch handling.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// View Component
// ============================================================================
/**
 * Create a View component
 */
export function View(props) {
    const platform = detectPlatform();
    // Merge styles if array
    const mergedStyle = Array.isArray(props.style)
        ? Object.assign({}, ...props.style.filter(Boolean))
        : props.style || {};
    // Convert style to platform-specific format
    const platformStyle = convertToPlatformStyle(mergedStyle, platform);
    if (platform === 'web') {
        // Return web-compatible element
        return {
            type: 'div',
            props: {
                style: platformStyle,
                'data-testid': props.testID,
                id: props.nativeID,
                'aria-label': props.accessibilityLabel,
                'aria-hidden': props.accessibilityElementsHidden,
                role: mapAccessibilityRole(props.accessibilityRole),
                tabIndex: props.focusable ? 0 : undefined,
                onTouchStart: props.onTouchStart,
                onTouchEnd: props.onTouchEnd,
                onTouchMove: props.onTouchMove,
            },
            children: props.children,
        };
    }
    // Return native element descriptor
    return {
        type: 'NativeView',
        props: {
            ...props,
            style: platformStyle,
        },
        children: props.children,
    };
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Convert style to platform-specific format
 */
function convertToPlatformStyle(style, platform) {
    const result = {};
    // Copy basic styles
    for (const [key, value] of Object.entries(style)) {
        if (value === undefined || value === null)
            continue;
        // Convert camelCase to kebab-case for web
        if (platform === 'web') {
            const cssKey = camelToKebab(key);
            result[cssKey] = convertValue(key, value);
        }
        else {
            result[key] = value;
        }
    }
    // Add default flexbox behavior
    if (platform === 'web' && !result['display']) {
        result['display'] = 'flex';
        result['flex-direction'] = result['flex-direction'] || 'column';
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
    // Add px to numeric values (except for certain properties)
    const unitlessProperties = [
        'flex',
        'flexGrow',
        'flexShrink',
        'fontWeight',
        'lineHeight',
        'opacity',
        'zIndex',
        'aspectRatio',
    ];
    if (typeof value === 'number' && !unitlessProperties.includes(key)) {
        return `${value}px`;
    }
    return String(value);
}
/**
 * Map accessibility role to ARIA role
 */
function mapAccessibilityRole(role) {
    if (!role || role === 'none')
        return undefined;
    const roleMap = {
        button: 'button',
        link: 'link',
        search: 'search',
        image: 'img',
        header: 'heading',
        summary: 'region',
        alert: 'alert',
        checkbox: 'checkbox',
        combobox: 'combobox',
        menu: 'menu',
        menubar: 'menubar',
        menuitem: 'menuitem',
        progressbar: 'progressbar',
        radio: 'radio',
        scrollbar: 'scrollbar',
        spinbutton: 'spinbutton',
        switch: 'switch',
        tab: 'tab',
        tablist: 'tablist',
        timer: 'timer',
        toolbar: 'toolbar',
    };
    return roleMap[role];
}
// ============================================================================
// Exports
// ============================================================================
export default View;
//# sourceMappingURL=View.js.map