/**
 * ActivityIndicator Component
 *
 * A loading indicator component for showing pending operations.
 */

import { signal, type Signal } from '@philjs/core';
import { detectPlatform, nativeBridge } from '../runtime.js';
import type { ViewStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Activity indicator size
 */
export type ActivityIndicatorSize = 'small' | 'large' | number;

/**
 * ActivityIndicator props
 */
export interface ActivityIndicatorProps {
  /**
   * Whether the indicator is animating
   */
  animating?: boolean;

  /**
   * Color of the spinner
   */
  color?: string;

  /**
   * Size of the spinner
   */
  size?: ActivityIndicatorSize;

  /**
   * Style for the container
   */
  style?: ViewStyle | ViewStyle[];

  /**
   * Whether to hide when not animating
   */
  hidesWhenStopped?: boolean;

  /**
   * Test ID for testing
   */
  testID?: string;

  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
}

// ============================================================================
// Size Constants
// ============================================================================

const sizeMap = {
  small: 20,
  large: 36,
};

// ============================================================================
// ActivityIndicator Component
// ============================================================================

/**
 * Create an ActivityIndicator component
 */
export function ActivityIndicator(props: ActivityIndicatorProps): any {
  const {
    animating = true,
    color = '#999999',
    size = 'small',
    style,
    hidesWhenStopped = true,
    testID,
    accessibilityLabel = 'Loading',
  } = props;

  const platform = detectPlatform();

  // Calculate actual size
  const actualSize = typeof size === 'number' ? size : sizeMap[size];

  // Merge styles if array
  const mergedStyle = Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style || {};

  // Don't render if not animating and should hide
  if (!animating && hidesWhenStopped) {
    return null;
  }

  if (platform === 'web') {
    const containerStyle: Record<string, any> = {
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      ...convertStyle(mergedStyle),
    };

    const spinnerStyle: Record<string, any> = {
      width: `${actualSize}px`,
      height: `${actualSize}px`,
      border: `${Math.max(2, actualSize / 10)}px solid ${color}20`,
      'border-top-color': color,
      'border-radius': '50%',
      animation: animating ? 'philjs-spin 0.8s linear infinite' : 'none',
    };

    // Inject keyframes if not already present
    injectSpinnerStyles();

    return {
      type: 'div',
      props: {
        style: containerStyle,
        'data-testid': testID,
        role: 'progressbar',
        'aria-label': accessibilityLabel,
        'aria-busy': animating,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
      },
      children: [
        {
          type: 'div',
          props: { style: spinnerStyle },
          children: null,
        },
      ],
    };
  }

  // Native element descriptor
  return {
    type: 'NativeActivityIndicator',
    props: {
      animating,
      color,
      size: actualSize,
      style: mergedStyle,
      testID,
      accessibilityLabel,
    },
    children: null,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

let stylesInjected = false;

/**
 * Inject spinner CSS animation
 */
function injectSpinnerStyles(): void {
  if (stylesInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes philjs-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

/**
 * Convert style to web format
 */
function convertStyle(style: ViewStyle): Record<string, any> {
  const result: Record<string, any> = {};

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
// Exports
// ============================================================================

export default ActivityIndicator;
