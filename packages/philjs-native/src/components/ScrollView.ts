/**
 * ScrollView Component
 *
 * A scrollable container component.
 * Supports both vertical and horizontal scrolling.
 */

import { signal, effect, type Signal } from '@philjs/core';
import { detectPlatform, nativeBridge } from '../runtime.js';
import type { ViewStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Scroll event
 */
export interface ScrollEvent {
  nativeEvent: {
    contentInset: { top: number; left: number; bottom: number; right: number };
    contentOffset: { x: number; y: number };
    contentSize: { width: number; height: number };
    layoutMeasurement: { width: number; height: number };
    zoomScale: number;
  };
}

/**
 * Keyboard dismiss mode
 */
export type KeyboardDismissMode = 'none' | 'on-drag' | 'interactive';

/**
 * Scroll indicator insets
 */
export interface ScrollIndicatorInsets {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

/**
 * ScrollView props
 */
export interface ScrollViewProps {
  /**
   * Children elements
   */
  children?: any;

  /**
   * Style for the scroll view
   */
  style?: ViewStyle | ViewStyle[];

  /**
   * Style for the content container
   */
  contentContainerStyle?: ViewStyle | ViewStyle[];

  /**
   * Whether scrolling is horizontal
   */
  horizontal?: boolean;

  /**
   * Whether to show horizontal scroll indicator
   */
  showsHorizontalScrollIndicator?: boolean;

  /**
   * Whether to show vertical scroll indicator
   */
  showsVerticalScrollIndicator?: boolean;

  /**
   * Whether scroll is enabled
   */
  scrollEnabled?: boolean;

  /**
   * Whether to bounce at edges
   */
  bounces?: boolean;

  /**
   * Bounce at start even if not scrollable
   */
  alwaysBounceVertical?: boolean;

  /**
   * Bounce at end even if not scrollable
   */
  alwaysBounceHorizontal?: boolean;

  /**
   * Whether paging is enabled
   */
  pagingEnabled?: boolean;

  /**
   * Snap to offsets
   */
  snapToOffsets?: number[];

  /**
   * Snap to interval
   */
  snapToInterval?: number;

  /**
   * Snap to alignment
   */
  snapToAlignment?: 'start' | 'center' | 'end';

  /**
   * Snap to start
   */
  snapToStart?: boolean;

  /**
   * Snap to end
   */
  snapToEnd?: boolean;

  /**
   * Deceleration rate
   */
  decelerationRate?: 'normal' | 'fast' | number;

  /**
   * Keyboard dismiss mode
   */
  keyboardDismissMode?: KeyboardDismissMode;

  /**
   * Keyboard should persist taps
   */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';

  /**
   * Content inset
   */
  contentInset?: { top?: number; left?: number; bottom?: number; right?: number };

  /**
   * Content offset
   */
  contentOffset?: { x: number; y: number };

  /**
   * Scroll indicator insets
   */
  scrollIndicatorInsets?: ScrollIndicatorInsets;

  /**
   * Scroll event throttle (ms)
   */
  scrollEventThrottle?: number;

  /**
   * Callback when scroll starts
   */
  onScrollBeginDrag?: (event: ScrollEvent) => void;

  /**
   * Callback when scroll ends drag
   */
  onScrollEndDrag?: (event: ScrollEvent) => void;

  /**
   * Callback when momentum scroll starts
   */
  onMomentumScrollBegin?: (event: ScrollEvent) => void;

  /**
   * Callback when momentum scroll ends
   */
  onMomentumScrollEnd?: (event: ScrollEvent) => void;

  /**
   * Callback when scrolling
   */
  onScroll?: (event: ScrollEvent) => void;

  /**
   * Callback when content size changes
   */
  onContentSizeChange?: (width: number, height: number) => void;

  /**
   * Refresh control component
   */
  refreshControl?: any;

  /**
   * Sticky header indices
   */
  stickyHeaderIndices?: number[];

  /**
   * Test ID for testing
   */
  testID?: string;

  /**
   * Invert sticky headers
   */
  invertStickyHeaders?: boolean;

  /**
   * Scroll to overflow enabled
   */
  scrollToOverflowEnabled?: boolean;

  /**
   * Nested scroll enabled (Android)
   */
  nestedScrollEnabled?: boolean;

  /**
   * Persist scroll position for navigation
   */
  persistentScrollbar?: boolean;

  /**
   * Disable scrollview from auto-adjusting for keyboard
   */
  automaticallyAdjustKeyboardInsets?: boolean;

  /**
   * Automatically adjusts content insets
   */
  automaticallyAdjustsScrollIndicatorInsets?: boolean;
}

/**
 * ScrollView ref methods
 */
export interface ScrollViewRef {
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToEnd: (options?: { animated?: boolean }) => void;
  flashScrollIndicators: () => void;
  getScrollOffset: () => { x: number; y: number };
}

// ============================================================================
// ScrollView Component
// ============================================================================

/**
 * Create a ScrollView component
 */
export function ScrollView(props: ScrollViewProps): any {
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

    const handleScroll = (e: any) => {
      const now = Date.now();
      if (now - lastScrollTime < throttle) return;
      lastScrollTime = now;

      const target = e.target;
      const scrollEvent: ScrollEvent = {
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
function convertScrollViewStyle(
  style: ViewStyle,
  props: ScrollViewProps,
  platform: string
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    if (platform === 'web') {
      const cssKey = camelToKebab(key);
      result[cssKey] = convertValue(key, value);
    } else {
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
function convertContentStyle(
  style: ViewStyle,
  props: ScrollViewProps,
  platform: string
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    if (platform === 'web') {
      const cssKey = camelToKebab(key);
      result[cssKey] = convertValue(key, value);
    } else {
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
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Convert value to CSS-compatible format
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
// ScrollView Utilities
// ============================================================================

/**
 * Create a ScrollView reference
 */
export function createScrollViewRef(): ScrollViewRef {
  const state: { scrollElement: HTMLElement | null } = { scrollElement: null };

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
