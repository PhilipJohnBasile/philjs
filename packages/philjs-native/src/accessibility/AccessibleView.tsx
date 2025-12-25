/**
 * AccessibleView Component
 *
 * A wrapper component that provides enhanced accessibility features.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform } from '../runtime.js';
import { AccessibilityInfo, useAccessibilityState } from './AccessibilityInfo.js';
import type { ViewStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Accessibility role for the view
 */
export type A11yRole =
  | 'none'
  | 'button'
  | 'link'
  | 'search'
  | 'image'
  | 'header'
  | 'summary'
  | 'alert'
  | 'checkbox'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'scrollbar'
  | 'slider'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'timer'
  | 'toolbar'
  | 'list'
  | 'listitem'
  | 'grid'
  | 'text'
  | 'adjustable'
  | 'imagebutton';

/**
 * Accessibility state
 */
export interface A11yState {
  /**
   * Whether the element is disabled
   */
  disabled?: boolean;

  /**
   * Whether the element is selected
   */
  selected?: boolean;

  /**
   * Whether the element is checked (for checkboxes/switches)
   */
  checked?: boolean | 'mixed';

  /**
   * Whether the element is busy (loading)
   */
  busy?: boolean;

  /**
   * Whether the element is expanded
   */
  expanded?: boolean;
}

/**
 * Accessibility value for adjustable elements
 */
export interface A11yValue {
  /**
   * Minimum value
   */
  min?: number;

  /**
   * Maximum value
   */
  max?: number;

  /**
   * Current value
   */
  now?: number;

  /**
   * Text representation of value
   */
  text?: string;
}

/**
 * Accessibility actions
 */
export interface A11yAction {
  /**
   * Action name
   */
  name: string;

  /**
   * Action label for screen reader
   */
  label?: string;
}

/**
 * AccessibleView props
 */
export interface AccessibleViewProps {
  /**
   * Children elements
   */
  children?: any;

  /**
   * Style for the view
   */
  style?: ViewStyle | ViewStyle[];

  /**
   * Test ID for testing
   */
  testID?: string;

  // ============================================
  // Accessibility Props
  // ============================================

  /**
   * Whether this view is an accessibility element
   */
  accessible?: boolean;

  /**
   * Accessibility label (screen reader text)
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint (additional context)
   */
  accessibilityHint?: string;

  /**
   * Accessibility role
   */
  accessibilityRole?: A11yRole;

  /**
   * Accessibility state
   */
  accessibilityState?: A11yState;

  /**
   * Accessibility value (for adjustable elements)
   */
  accessibilityValue?: A11yValue;

  /**
   * Available accessibility actions
   */
  accessibilityActions?: A11yAction[];

  /**
   * Callback for accessibility actions
   */
  onAccessibilityAction?: (event: { actionName: string }) => void;

  /**
   * Whether to hide from accessibility tree
   */
  accessibilityElementsHidden?: boolean;

  /**
   * Importance for accessibility (Android)
   */
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';

  /**
   * Whether element is a modal (traps focus)
   */
  accessibilityViewIsModal?: boolean;

  /**
   * Elements that label this view (by ID)
   */
  accessibilityLabelledBy?: string | string[];

  /**
   * Live region mode for dynamic updates
   */
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';

  /**
   * Language for accessibility
   */
  accessibilityLanguage?: string;

  // ============================================
  // Interaction Props
  // ============================================

  /**
   * Callback when pressed
   */
  onPress?: () => void;

  /**
   * Callback when long pressed
   */
  onLongPress?: () => void;

  /**
   * Callback for escape gesture
   */
  onAccessibilityEscape?: () => boolean;

  /**
   * Callback for magic tap (iOS)
   */
  onMagicTap?: () => boolean;

  /**
   * Whether focusable
   */
  focusable?: boolean;

  /**
   * Callback when focused
   */
  onFocus?: () => void;

  /**
   * Callback when blurred
   */
  onBlur?: () => void;

  // ============================================
  // Enhanced A11y Props
  // ============================================

  /**
   * Auto-focus on mount
   */
  autoFocus?: boolean;

  /**
   * Announce when content changes
   */
  announceChanges?: boolean;

  /**
   * Custom announcement message
   */
  announcement?: string;

  /**
   * Skip in tab order
   */
  skipTabOrder?: boolean;

  /**
   * Tab index override
   */
  tabIndex?: number;
}

// ============================================================================
// AccessibleView Component
// ============================================================================

/**
 * Create an AccessibleView component
 */
export function AccessibleView(props: AccessibleViewProps): any {
  const platform = detectPlatform();
  const a11yState = useAccessibilityState();

  // Merge styles if array
  const mergedStyle = Array.isArray(props.style)
    ? Object.assign({}, ...props.style.filter(Boolean))
    : props.style || {};

  // Build accessibility props
  const a11yProps = buildA11yProps(props, a11yState.screenReaderEnabled);

  // Handle auto-announce
  if (props.announceChanges && props.announcement) {
    effect(() => {
      AccessibilityInfo.announceForAccessibility(props.announcement!);
    });
  }

  // Handle auto-focus
  if (props.autoFocus && typeof document !== 'undefined') {
    effect(() => {
      // Focus after render
      requestAnimationFrame(() => {
        const element = document.querySelector(`[data-testid="${props.testID}"]`);
        if (element instanceof HTMLElement) {
          AccessibilityInfo.setAccessibilityFocus(element);
        }
      });
    });
  }

  if (platform === 'web') {
    const webStyle = convertToWebStyle(mergedStyle);

    return {
      type: 'div',
      props: {
        style: webStyle,
        'data-testid': props.testID,
        ...a11yProps,
        onClick: props.onPress,
        onFocus: props.onFocus,
        onBlur: props.onBlur,
        onKeyDown: (e: KeyboardEvent) => handleKeyDown(e, props),
      },
      children: props.children,
    };
  }

  // Native element descriptor
  return {
    type: 'NativeAccessibleView',
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
 * Build accessibility props for web
 */
function buildA11yProps(
  props: AccessibleViewProps,
  screenReaderEnabled: boolean
): Record<string, any> {
  const a11y: Record<string, any> = {};

  // Role
  if (props.accessibilityRole && props.accessibilityRole !== 'none') {
    a11y.role = mapRole(props.accessibilityRole);
  }

  // Label
  if (props.accessibilityLabel) {
    a11y['aria-label'] = props.accessibilityLabel;
  }

  // Hint (as description)
  if (props.accessibilityHint) {
    a11y['aria-description'] = props.accessibilityHint;
  }

  // State
  if (props.accessibilityState) {
    const state = props.accessibilityState;

    if (state.disabled !== undefined) {
      a11y['aria-disabled'] = state.disabled;
    }
    if (state.selected !== undefined) {
      a11y['aria-selected'] = state.selected;
    }
    if (state.checked !== undefined) {
      a11y['aria-checked'] = state.checked;
    }
    if (state.busy !== undefined) {
      a11y['aria-busy'] = state.busy;
    }
    if (state.expanded !== undefined) {
      a11y['aria-expanded'] = state.expanded;
    }
  }

  // Value
  if (props.accessibilityValue) {
    const value = props.accessibilityValue;

    if (value.min !== undefined) {
      a11y['aria-valuemin'] = value.min;
    }
    if (value.max !== undefined) {
      a11y['aria-valuemax'] = value.max;
    }
    if (value.now !== undefined) {
      a11y['aria-valuenow'] = value.now;
    }
    if (value.text !== undefined) {
      a11y['aria-valuetext'] = value.text;
    }
  }

  // Hidden
  if (props.accessibilityElementsHidden) {
    a11y['aria-hidden'] = true;
  }

  // Modal
  if (props.accessibilityViewIsModal) {
    a11y['aria-modal'] = true;
  }

  // Labelled by
  if (props.accessibilityLabelledBy) {
    a11y['aria-labelledby'] = Array.isArray(props.accessibilityLabelledBy)
      ? props.accessibilityLabelledBy.join(' ')
      : props.accessibilityLabelledBy;
  }

  // Live region
  if (props.accessibilityLiveRegion && props.accessibilityLiveRegion !== 'none') {
    a11y['aria-live'] = props.accessibilityLiveRegion;
  }

  // Language
  if (props.accessibilityLanguage) {
    a11y.lang = props.accessibilityLanguage;
  }

  // Focus
  if (props.focusable !== false) {
    if (props.skipTabOrder) {
      a11y.tabIndex = -1;
    } else if (props.tabIndex !== undefined) {
      a11y.tabIndex = props.tabIndex;
    } else if (props.onPress || props.accessibilityRole === 'button') {
      a11y.tabIndex = 0;
    }
  }

  return a11y;
}

/**
 * Map accessibility role to ARIA role
 */
function mapRole(role: A11yRole): string {
  const roleMap: Record<A11yRole, string> = {
    none: 'presentation',
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
    slider: 'slider',
    spinbutton: 'spinbutton',
    switch: 'switch',
    tab: 'tab',
    tablist: 'tablist',
    timer: 'timer',
    toolbar: 'toolbar',
    list: 'list',
    listitem: 'listitem',
    grid: 'grid',
    text: 'text',
    adjustable: 'slider',
    imagebutton: 'button',
  };

  return roleMap[role] || role;
}

/**
 * Handle keyboard events
 */
function handleKeyDown(event: KeyboardEvent, props: AccessibleViewProps): void {
  // Enter/Space for activation
  if ((event.key === 'Enter' || event.key === ' ') && props.onPress) {
    event.preventDefault();
    props.onPress();
  }

  // Escape for accessibility escape
  if (event.key === 'Escape' && props.onAccessibilityEscape) {
    if (props.onAccessibilityEscape()) {
      event.preventDefault();
    }
  }

  // Handle custom accessibility actions
  if (props.accessibilityActions && props.onAccessibilityAction) {
    // Custom key bindings for actions could be implemented here
  }
}

/**
 * Convert style to web format
 */
function convertToWebStyle(style: ViewStyle): Record<string, any> {
  const result: Record<string, any> = {
    display: 'flex',
    flexDirection: 'column',
  };

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    const cssKey = camelToKebab(key);
    result[cssKey] = convertValue(key, value);
  }

  return result;
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Convert value to CSS format
 */
function convertValue(key: string, value: any): string {
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
// Utility Components
// ============================================================================

/**
 * Props for ScreenReaderOnly
 */
export interface ScreenReaderOnlyProps {
  children?: any;
}

/**
 * Component that's only visible to screen readers
 */
export function ScreenReaderOnly(props: ScreenReaderOnlyProps): any {
  const platform = detectPlatform();

  if (platform === 'web') {
    return {
      type: 'span',
      props: {
        style: {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
      },
      children: props.children,
    };
  }

  return {
    type: 'NativeScreenReaderOnly',
    props: {},
    children: props.children,
  };
}

/**
 * Props for FocusTrap
 */
export interface FocusTrapProps {
  children?: any;
  active?: boolean;
  onEscape?: () => void;
}

/**
 * Component that traps focus within it
 */
export function FocusTrap(props: FocusTrapProps): any {
  const { children, active = true, onEscape } = props;
  const platform = detectPlatform();

  if (platform === 'web' && typeof document !== 'undefined') {
    effect(() => {
      if (!active) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onEscape) {
          onEscape();
        }

        if (e.key === 'Tab') {
          // Focus trap logic would go here
          // This is a simplified version
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    });
  }

  return {
    type: 'div',
    props: {
      role: 'dialog',
      'aria-modal': active,
      style: { display: 'contents' },
    },
    children,
  };
}

/**
 * Props for SkipLink
 */
export interface SkipLinkProps {
  targetId: string;
  children?: any;
}

/**
 * Skip link for keyboard navigation
 */
export function SkipLink(props: SkipLinkProps): any {
  const { targetId, children = 'Skip to main content' } = props;

  return {
    type: 'a',
    props: {
      href: `#${targetId}`,
      style: {
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      },
      onFocus: (e: FocusEvent) => {
        const target = e.target as HTMLElement;
        target.style.position = 'static';
        target.style.width = 'auto';
        target.style.height = 'auto';
      },
      onBlur: (e: FocusEvent) => {
        const target = e.target as HTMLElement;
        target.style.position = 'absolute';
        target.style.left = '-10000px';
        target.style.width = '1px';
        target.style.height = '1px';
      },
    },
    children,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default AccessibleView;
