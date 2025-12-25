/**
 * PhilJS Native - SafeAreaView Component (TSX)
 *
 * A React-style component that renders content within the safe area
 * boundaries of a device, handling notches, home indicators, and
 * other device-specific UI elements.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, platformInfo } from '../runtime.js';
import type { ViewStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Safe area insets
 */
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Safe area edge options
 */
export type SafeAreaEdge = 'top' | 'right' | 'bottom' | 'left';

/**
 * Safe area mode
 */
export type SafeAreaMode = 'padding' | 'margin';

/**
 * SafeAreaView props
 */
export interface SafeAreaViewProps {
  /** Child elements */
  children?: any;
  /** View style */
  style?: ViewStyle | ViewStyle[];
  /** Which edges to apply safe area insets */
  edges?: SafeAreaEdge[];
  /** Mode for applying insets */
  mode?: SafeAreaMode;
  /** Minimum insets to ensure */
  minInsets?: Partial<SafeAreaInsets>;
  /** Test ID */
  testID?: string;
  /** Class name for web */
  className?: string;
  /** Callback when insets change */
  onInsetsChange?: (insets: SafeAreaInsets) => void;
}

/**
 * SafeAreaProvider props
 */
export interface SafeAreaProviderProps {
  children?: any;
  initialMetrics?: {
    insets: SafeAreaInsets;
    frame: { x: number; y: number; width: number; height: number };
  };
}

// ============================================================================
// Safe Area State
// ============================================================================

const defaultInsets: SafeAreaInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

/**
 * Current safe area insets signal
 */
export const safeAreaInsets: Signal<SafeAreaInsets> = signal(getInitialInsets());

/**
 * Safe area frame signal
 */
export const safeAreaFrame: Signal<{ x: number; y: number; width: number; height: number }> = signal({
  x: 0,
  y: 0,
  width: typeof window !== 'undefined' ? window.innerWidth : 375,
  height: typeof window !== 'undefined' ? window.innerHeight : 812,
});

/**
 * Get initial insets based on platform and device
 */
function getInitialInsets(): SafeAreaInsets {
  if (typeof window === 'undefined') {
    return defaultInsets;
  }

  // Try CSS environment variables first
  const computedStyle = getComputedStyle(document.documentElement);
  const parseEnv = (name: string): number => {
    const value = computedStyle.getPropertyValue(name);
    return parseInt(value, 10) || 0;
  };

  const envInsets = {
    top: parseEnv('--safe-area-inset-top'),
    right: parseEnv('--safe-area-inset-right'),
    bottom: parseEnv('--safe-area-inset-bottom'),
    left: parseEnv('--safe-area-inset-left'),
  };

  // If env values are set, use them
  if (envInsets.top || envInsets.bottom || envInsets.right || envInsets.left) {
    return envInsets;
  }

  // Otherwise, estimate based on device
  return {
    top: getEstimatedTopInset(),
    right: 0,
    bottom: getEstimatedBottomInset(),
    left: 0,
  };
}

/**
 * Estimate top inset based on device
 */
function getEstimatedTopInset(): number {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 0;

  const platform = detectPlatform();
  const ua = navigator.userAgent;

  // iPhone with notch detection
  if (platform === 'ios' || /iPhone/.test(ua)) {
    const isNotched = window.innerHeight >= 812 && window.innerWidth <= 428;
    return isNotched ? 47 : 20; // 47px for notch, 20px for status bar
  }

  // iPad
  if (/iPad/.test(ua)) {
    return 20;
  }

  // Android
  if (platform === 'android' || /Android/.test(ua)) {
    return 24; // Standard status bar
  }

  return 0;
}

/**
 * Estimate bottom inset based on device
 */
function getEstimatedBottomInset(): number {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 0;

  const platform = detectPlatform();
  const ua = navigator.userAgent;

  // iPhone with home indicator
  if (platform === 'ios' || /iPhone/.test(ua)) {
    const hasHomeIndicator = window.innerHeight >= 812 && window.innerWidth <= 428;
    return hasHomeIndicator ? 34 : 0;
  }

  // Android with gesture navigation
  if (platform === 'android' || /Android/.test(ua)) {
    // Modern Android devices with gesture nav
    return 0; // Usually handled by system
  }

  return 0;
}

// ============================================================================
// SafeAreaView Component
// ============================================================================

/**
 * SafeAreaView component
 */
export function SafeAreaView(props: SafeAreaViewProps): any {
  const {
    children,
    style,
    edges = ['top', 'right', 'bottom', 'left'],
    mode = 'padding',
    minInsets,
    testID,
    className,
    onInsetsChange,
  } = props;

  const platform = detectPlatform();
  const insets = safeAreaInsets();

  // Apply minimum insets
  const effectiveInsets: SafeAreaInsets = {
    top: Math.max(insets.top, minInsets?.top || 0),
    right: Math.max(insets.right, minInsets?.right || 0),
    bottom: Math.max(insets.bottom, minInsets?.bottom || 0),
    left: Math.max(insets.left, minInsets?.left || 0),
  };

  // Notify on insets change
  if (onInsetsChange) {
    effect(() => {
      onInsetsChange(effectiveInsets);
    });
  }

  // Merge styles
  const mergedStyle = Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style || {};

  if (platform === 'web') {
    const safeAreaStyle: Record<string, any> = {
      ...convertToCSSStyle(mergedStyle),
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
    };

    // Apply safe area insets
    const prefix = mode === 'margin' ? 'margin' : 'padding';

    if (edges.includes('top')) {
      safeAreaStyle[`${prefix}Top`] = `max(${effectiveInsets.top}px, env(safe-area-inset-top, 0px))`;
    }
    if (edges.includes('right')) {
      safeAreaStyle[`${prefix}Right`] = `max(${effectiveInsets.right}px, env(safe-area-inset-right, 0px))`;
    }
    if (edges.includes('bottom')) {
      safeAreaStyle[`${prefix}Bottom`] = `max(${effectiveInsets.bottom}px, env(safe-area-inset-bottom, 0px))`;
    }
    if (edges.includes('left')) {
      safeAreaStyle[`${prefix}Left`] = `max(${effectiveInsets.left}px, env(safe-area-inset-left, 0px))`;
    }

    return {
      type: 'div',
      props: {
        style: safeAreaStyle,
        'data-testid': testID,
        className: `philjs-safe-area-view ${className || ''}`.trim(),
      },
      children,
    };
  }

  // Native
  return {
    type: 'NativeSafeAreaView',
    props: {
      style: mergedStyle,
      edges,
      mode,
      testID,
    },
    children,
  };
}

// ============================================================================
// SafeAreaProvider Component
// ============================================================================

/**
 * SafeAreaProvider component
 */
export function SafeAreaProvider(props: SafeAreaProviderProps): any {
  const { children, initialMetrics } = props;
  const platform = detectPlatform();

  // Initialize with provided metrics
  if (initialMetrics) {
    safeAreaInsets.set(initialMetrics.insets);
    safeAreaFrame.set(initialMetrics.frame);
  }

  // Set up resize listener
  if (typeof window !== 'undefined') {
    effect(() => {
      const updateInsets = () => {
        safeAreaInsets.set(getInitialInsets());
        safeAreaFrame.set({
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener('resize', updateInsets);
      window.addEventListener('orientationchange', updateInsets);

      // Visual viewport for keyboard handling
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateInsets);
      }

      return () => {
        window.removeEventListener('resize', updateInsets);
        window.removeEventListener('orientationchange', updateInsets);
        window.visualViewport?.removeEventListener('resize', updateInsets);
      };
    });
  }

  if (platform === 'web') {
    return {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: '100vh',
          position: 'relative',
        },
        className: 'philjs-safe-area-provider',
      },
      children,
    };
  }

  return {
    type: 'NativeSafeAreaProvider',
    props: { initialMetrics },
    children,
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get current safe area insets
 */
export function useSafeAreaInsets(): SafeAreaInsets {
  return safeAreaInsets();
}

/**
 * Get safe area frame
 */
export function useSafeAreaFrame(): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return safeAreaFrame();
}

/**
 * Get initial window metrics (for SSR)
 */
export function useInitialWindowMetrics(): {
  insets: SafeAreaInsets;
  frame: { x: number; y: number; width: number; height: number };
} | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return {
    insets: safeAreaInsets(),
    frame: safeAreaFrame(),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert ViewStyle to CSS style object
 */
function convertToCSSStyle(style: ViewStyle): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    // Convert camelCase to CSS format
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    result[key] = convertValue(key, value);
  }

  return result;
}

/**
 * Convert style value
 */
function convertValue(key: string, value: any): string | number {
  const unitlessProps = ['flex', 'flexGrow', 'flexShrink', 'opacity', 'zIndex', 'aspectRatio'];

  if (typeof value === 'number' && !unitlessProps.includes(key)) {
    return value; // React handles px conversion
  }

  return value;
}

/**
 * Edge set helper
 */
export function edgeSet(
  include: SafeAreaEdge[],
  exclude?: SafeAreaEdge[]
): SafeAreaEdge[] {
  const allEdges: SafeAreaEdge[] = ['top', 'right', 'bottom', 'left'];

  if (include.length === 0) {
    return allEdges.filter((edge) => !exclude?.includes(edge));
  }

  return include.filter((edge) => !exclude?.includes(edge));
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get insets for specific edges
 */
export function getInsetsForEdges(
  edges: SafeAreaEdge[],
  insets: SafeAreaInsets = safeAreaInsets()
): SafeAreaInsets {
  return {
    top: edges.includes('top') ? insets.top : 0,
    right: edges.includes('right') ? insets.right : 0,
    bottom: edges.includes('bottom') ? insets.bottom : 0,
    left: edges.includes('left') ? insets.left : 0,
  };
}

/**
 * Apply insets to style
 */
export function withSafeArea(
  style: ViewStyle,
  edges: SafeAreaEdge[] = ['top', 'right', 'bottom', 'left'],
  mode: SafeAreaMode = 'padding'
): ViewStyle {
  const insets = safeAreaInsets();
  const prefix = mode === 'margin' ? 'margin' : 'padding';

  return {
    ...style,
    [`${prefix}Top`]: edges.includes('top') ? insets.top : style[`${prefix}Top` as keyof ViewStyle],
    [`${prefix}Right`]: edges.includes('right') ? insets.right : style[`${prefix}Right` as keyof ViewStyle],
    [`${prefix}Bottom`]: edges.includes('bottom') ? insets.bottom : style[`${prefix}Bottom` as keyof ViewStyle],
    [`${prefix}Left`]: edges.includes('left') ? insets.left : style[`${prefix}Left` as keyof ViewStyle],
  } as ViewStyle;
}

// ============================================================================
// Exports
// ============================================================================

export default SafeAreaView;
