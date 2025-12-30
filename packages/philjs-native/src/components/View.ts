/**
 * View Component
 *
 * The most fundamental component for building UI.
 * A container that supports flexbox layout, styling, and touch handling.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
import type { ViewStyle, NativeStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Accessibility role for View
 */
export type AccessibilityRole =
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
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'timer'
  | 'toolbar';

/**
 * Pointer events configuration
 */
export type PointerEvents = 'auto' | 'none' | 'box-none' | 'box-only';

/**
 * View props
 */
export interface ViewProps {
  /**
   * Style for the view
   */
  style?: ViewStyle | ViewStyle[];

  /**
   * Children elements
   */
  children?: any;

  /**
   * Test ID for testing
   */
  testID?: string;

  /**
   * Native ID for native reference
   */
  nativeID?: string;

  /**
   * Accessibility label
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint
   */
  accessibilityHint?: string;

  /**
   * Accessibility role
   */
  accessibilityRole?: AccessibilityRole;

  /**
   * Pointer events behavior
   */
  pointerEvents?: PointerEvents;

  /**
   * Whether view should be focusable
   */
  focusable?: boolean;

  /**
   * Callback when layout changes
   */
  onLayout?: (event: LayoutEvent) => void;

  /**
   * Callback when touch starts
   */
  onTouchStart?: (event: TouchEvent) => void;

  /**
   * Callback when touch ends
   */
  onTouchEnd?: (event: TouchEvent) => void;

  /**
   * Callback when touch moves
   */
  onTouchMove?: (event: TouchEvent) => void;

  /**
   * Hit slop - extends the touch area
   */
  hitSlop?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };

  /**
   * Remove from accessibility tree
   */
  accessibilityElementsHidden?: boolean;

  /**
   * Import accessibility elements from native
   */
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';

  /**
   * Collapsible - for optimization
   */
  collapsable?: boolean;

  /**
   * Render to hardware texture (Android)
   */
  renderToHardwareTextureAndroid?: boolean;

  /**
   * Should rasterize (iOS)
   */
  shouldRasterizeIOS?: boolean;
}

/**
 * Layout event
 */
export interface LayoutEvent {
  nativeEvent: {
    layout: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

/**
 * Touch event
 */
export interface TouchEvent {
  nativeEvent: {
    changedTouches: Touch[];
    identifier: number;
    locationX: number;
    locationY: number;
    pageX: number;
    pageY: number;
    target: number;
    timestamp: number;
  };
}

/**
 * Touch point
 */
export interface Touch {
  identifier: number;
  locationX: number;
  locationY: number;
  pageX: number;
  pageY: number;
  target: number;
  timestamp: number;
}

// ============================================================================
// View Component
// ============================================================================

/**
 * Create a View component
 */
export function View(props: ViewProps): any {
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
function convertToPlatformStyle(style: ViewStyle, platform: string): NativeStyle {
  const result: NativeStyle = {};

  // Copy basic styles
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    // Convert camelCase to kebab-case for web
    if (platform === 'web') {
      const cssKey = camelToKebab(key);
      result[cssKey] = convertValue(key, value);
    } else {
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
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Convert value to CSS-compatible format
 */
function convertValue(key: string, value: any): string {
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
function mapAccessibilityRole(role?: AccessibilityRole): string | undefined {
  if (!role || role === 'none') return undefined;

  const roleMap: Record<string, string> = {
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
