/**
 * AccessibleView Component
 *
 * Components for building accessible interfaces.
 */
import { detectPlatform } from '../runtime.js';
// ============================================================================
// AccessibleView Component
// ============================================================================
/**
 * AccessibleView component with full accessibility support
 */
export function AccessibleView(props) {
    const platform = detectPlatform();
    const { accessible = true, accessibilityLabel, accessibilityHint, accessibilityRole, accessibilityState, accessibilityValue, accessibilityActions, onAccessibilityAction, accessibilityLiveRegion, accessibilityElementsHidden, importantForAccessibility, accessibilityViewIsModal, children, style, testID, } = props;
    // Build accessibility attributes for web
    const a11yProps = {};
    if (accessible) {
        a11yProps['role'] = mapRole(accessibilityRole);
        if (accessibilityLabel)
            a11yProps['aria-label'] = accessibilityLabel;
        if (accessibilityHint)
            a11yProps['aria-describedby'] = accessibilityHint;
        // State
        if (accessibilityState) {
            if (accessibilityState.disabled !== undefined) {
                a11yProps['aria-disabled'] = accessibilityState.disabled;
            }
            if (accessibilityState.selected !== undefined) {
                a11yProps['aria-selected'] = accessibilityState.selected;
            }
            if (accessibilityState.checked !== undefined) {
                a11yProps['aria-checked'] = accessibilityState.checked;
            }
            if (accessibilityState.busy !== undefined) {
                a11yProps['aria-busy'] = accessibilityState.busy;
            }
            if (accessibilityState.expanded !== undefined) {
                a11yProps['aria-expanded'] = accessibilityState.expanded;
            }
        }
        // Value
        if (accessibilityValue) {
            if (accessibilityValue.min !== undefined) {
                a11yProps['aria-valuemin'] = accessibilityValue.min;
            }
            if (accessibilityValue.max !== undefined) {
                a11yProps['aria-valuemax'] = accessibilityValue.max;
            }
            if (accessibilityValue.now !== undefined) {
                a11yProps['aria-valuenow'] = accessibilityValue.now;
            }
            if (accessibilityValue.text !== undefined) {
                a11yProps['aria-valuetext'] = accessibilityValue.text;
            }
        }
        // Live region
        if (accessibilityLiveRegion && accessibilityLiveRegion !== 'none') {
            a11yProps['aria-live'] = accessibilityLiveRegion;
        }
        // Hidden
        if (accessibilityElementsHidden) {
            a11yProps['aria-hidden'] = true;
        }
        // Modal
        if (accessibilityViewIsModal) {
            a11yProps['aria-modal'] = true;
        }
        // Important for accessibility
        if (importantForAccessibility === 'no' || importantForAccessibility === 'no-hide-descendants') {
            a11yProps['aria-hidden'] = true;
        }
    }
    if (platform === 'web') {
        return {
            type: 'div',
            props: {
                ...a11yProps,
                style,
                'data-testid': testID,
                tabIndex: accessible ? 0 : undefined,
            },
            children,
        };
    }
    // Native
    return {
        type: 'AccessibleView',
        props: {
            accessible,
            accessibilityLabel,
            accessibilityHint,
            accessibilityRole,
            accessibilityState,
            accessibilityValue,
            accessibilityActions,
            onAccessibilityAction,
            accessibilityLiveRegion,
            accessibilityElementsHidden,
            importantForAccessibility,
            accessibilityViewIsModal,
            style,
            testID,
        },
        children,
    };
}
/**
 * Map RN accessibility role to ARIA role
 */
function mapRole(role) {
    if (!role || role === 'none')
        return undefined;
    const roleMap = {
        none: '',
        button: 'button',
        link: 'link',
        search: 'search',
        image: 'img',
        keyboardkey: 'button',
        text: 'text',
        adjustable: 'slider',
        imagebutton: 'button',
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
        radiogroup: 'radiogroup',
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
// ScreenReaderOnly Component
// ============================================================================
/**
 * Component visible only to screen readers
 */
export function ScreenReaderOnly(props) {
    const { children, style } = props;
    const platform = detectPlatform();
    const hiddenStyle = {
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        // Additional clipping would be applied via CSS
        ...style,
    };
    if (platform === 'web') {
        return {
            type: 'div',
            props: {
                style: {
                    ...hiddenStyle,
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                },
            },
            children,
        };
    }
    return {
        type: 'ScreenReaderOnly',
        props: { style: hiddenStyle },
        children,
    };
}
// ============================================================================
// FocusTrap Component
// ============================================================================
/**
 * Traps keyboard focus within a container
 */
export function FocusTrap(props) {
    const { active = true, children, style, initialFocus, returnFocus = true, onEscape, } = props;
    const platform = detectPlatform();
    if (platform === 'web') {
        // Focus trap implementation for web
        const handleKeyDown = (event) => {
            if (!active)
                return;
            if (event.key === 'Escape' && onEscape) {
                onEscape();
                return;
            }
            if (event.key === 'Tab') {
                // Focus trapping logic would be implemented here
                // This is a simplified version
            }
        };
        return {
            type: 'div',
            props: {
                style,
                onKeyDown: handleKeyDown,
                'data-focus-trap': active,
                'data-initial-focus': initialFocus,
                'data-return-focus': returnFocus,
            },
            children,
        };
    }
    return {
        type: 'FocusTrap',
        props: {
            active,
            style,
            initialFocus,
            returnFocus,
            onEscape,
        },
        children,
    };
}
// ============================================================================
// SkipLink Component
// ============================================================================
/**
 * Skip link for keyboard navigation
 */
export function SkipLink(props) {
    const { targetId, label = 'Skip to main content', style } = props;
    const platform = detectPlatform();
    const handleClick = () => {
        if (typeof document === 'undefined')
            return;
        const target = document.getElementById(targetId);
        if (target) {
            target.tabIndex = -1;
            target.focus();
        }
    };
    const skipLinkStyle = {
        position: 'absolute',
        top: -40,
        left: 0,
        backgroundColor: '#000',
        padding: 8,
        zIndex: 100,
        ...style,
    };
    if (platform === 'web') {
        return {
            type: 'a',
            props: {
                href: `#${targetId}`,
                style: {
                    ...skipLinkStyle,
                    color: '#fff',
                    textDecoration: 'none',
                    ':focus': {
                        top: 0,
                    },
                },
                onClick: (e) => {
                    e.preventDefault();
                    handleClick();
                },
            },
            children: label,
        };
    }
    return {
        type: 'SkipLink',
        props: {
            targetId,
            label,
            style: skipLinkStyle,
            onPress: handleClick,
        },
        children: label,
    };
}
export default AccessibleView;
//# sourceMappingURL=AccessibleView.js.map