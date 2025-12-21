/**
 * FlatList Component
 *
 * A performant interface for rendering simple, flat lists.
 * Supports virtualization, pull-to-refresh, and infinite scrolling.
 */

import { signal, effect, memo, type Signal } from 'philjs-core';
import { detectPlatform } from '../runtime.js';
import type { ViewStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * List render item info
 */
export interface ListRenderItemInfo<T> {
  item: T;
  index: number;
  separators: {
    highlight: () => void;
    unhighlight: () => void;
    updateProps: (select: 'leading' | 'trailing', props: any) => void;
  };
}

/**
 * Viewport info for visibility
 */
export interface ViewToken<T> {
  item: T;
  key: string;
  index: number | null;
  isViewable: boolean;
  section?: any;
}

/**
 * Viewability config
 */
export interface ViewabilityConfig {
  minimumViewTime?: number;
  viewAreaCoveragePercentThreshold?: number;
  itemVisiblePercentThreshold?: number;
  waitForInteraction?: boolean;
}

/**
 * FlatList props
 */
export interface FlatListProps<T> {
  /**
   * Data to render
   */
  data: T[] | null | undefined;

  /**
   * Render function for each item
   */
  renderItem: (info: ListRenderItemInfo<T>) => any;

  /**
   * Key extractor function
   */
  keyExtractor?: (item: T, index: number) => string;

  /**
   * Style for the list container
   */
  style?: ViewStyle | ViewStyle[];

  /**
   * Style for the content container
   */
  contentContainerStyle?: ViewStyle | ViewStyle[];

  /**
   * Header component
   */
  ListHeaderComponent?: any;

  /**
   * Header component style
   */
  ListHeaderComponentStyle?: ViewStyle;

  /**
   * Footer component
   */
  ListFooterComponent?: any;

  /**
   * Footer component style
   */
  ListFooterComponentStyle?: ViewStyle;

  /**
   * Empty list component
   */
  ListEmptyComponent?: any;

  /**
   * Item separator component
   */
  ItemSeparatorComponent?: any;

  /**
   * Whether list is horizontal
   */
  horizontal?: boolean;

  /**
   * Number of columns (grid mode)
   */
  numColumns?: number;

  /**
   * Column wrapper style
   */
  columnWrapperStyle?: ViewStyle;

  /**
   * Initial number of items to render
   */
  initialNumToRender?: number;

  /**
   * Maximum number to render per batch
   */
  maxToRenderPerBatch?: number;

  /**
   * Update cell batch period
   */
  updateCellsBatchingPeriod?: number;

  /**
   * Window size for rendering
   */
  windowSize?: number;

  /**
   * Remove clipped subviews (optimization)
   */
  removeClippedSubviews?: boolean;

  /**
   * Get item layout for optimization
   */
  getItemLayout?: (data: T[] | null | undefined, index: number) => {
    length: number;
    offset: number;
    index: number;
  };

  /**
   * Initial scroll index
   */
  initialScrollIndex?: number;

  /**
   * Inverted list (bottom to top)
   */
  inverted?: boolean;

  /**
   * Extra data to trigger re-render
   */
  extraData?: any;

  /**
   * Scroll enabled
   */
  scrollEnabled?: boolean;

  /**
   * Callback when scroll happens
   */
  onScroll?: (event: any) => void;

  /**
   * Scroll event throttle
   */
  scrollEventThrottle?: number;

  /**
   * Callback when end reached
   */
  onEndReached?: (info: { distanceFromEnd: number }) => void;

  /**
   * Threshold for end reached (0-1)
   */
  onEndReachedThreshold?: number;

  /**
   * Callback when refresh triggered
   */
  onRefresh?: () => void;

  /**
   * Whether currently refreshing
   */
  refreshing?: boolean;

  /**
   * Viewability config
   */
  viewabilityConfig?: ViewabilityConfig;

  /**
   * Callback when viewable items change
   */
  onViewableItemsChanged?: (info: {
    viewableItems: ViewToken<T>[];
    changed: ViewToken<T>[];
  }) => void;

  /**
   * Progress view offset (Android)
   */
  progressViewOffset?: number;

  /**
   * Test ID
   */
  testID?: string;

  /**
   * Debug mode
   */
  debug?: boolean;

  /**
   * Sticky header indices
   */
  stickyHeaderIndices?: number[];
}

/**
 * FlatList ref methods
 */
export interface FlatListRef<T> {
  scrollToEnd: (params?: { animated?: boolean }) => void;
  scrollToIndex: (params: { index: number; animated?: boolean; viewPosition?: number }) => void;
  scrollToItem: (params: { item: T; animated?: boolean; viewPosition?: number }) => void;
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
  flashScrollIndicators: () => void;
  getNativeScrollRef: () => any;
  getScrollResponder: () => any;
  getScrollableNode: () => any;
}

// ============================================================================
// FlatList Component
// ============================================================================

/**
 * Create a FlatList component
 */
export function FlatList<T>(props: FlatListProps<T>): any {
  const platform = detectPlatform();
  const data = props.data || [];

  // Virtualization state
  const scrollOffset = signal(0);
  const containerHeight = signal(0);
  const itemHeight = props.getItemLayout ? props.getItemLayout(data, 0)?.length || 50 : 50;
  const windowSize = props.windowSize || 21;
  const initialNumToRender = props.initialNumToRender || 10;

  // Calculate visible range
  const visibleRange = memo(() => {
    const offset = scrollOffset();
    const height = containerHeight() || 500;
    const startIndex = Math.max(0, Math.floor(offset / itemHeight) - Math.floor(windowSize / 2));
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((offset + height) / itemHeight) + Math.floor(windowSize / 2)
    );
    return { startIndex, endIndex };
  });

  // Key extractor
  const getKey = props.keyExtractor || ((item: T, index: number) => String(index));

  // Merge styles
  const mergedStyle = Array.isArray(props.style)
    ? Object.assign({}, ...props.style.filter(Boolean))
    : props.style || {};

  const mergedContentStyle = Array.isArray(props.contentContainerStyle)
    ? Object.assign({}, ...props.contentContainerStyle.filter(Boolean))
    : props.contentContainerStyle || {};

  // End reached detection
  let endReachedCalled = false;

  const checkEndReached = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
    const threshold = props.onEndReachedThreshold || 0.5;
    const distanceFromEnd = scrollHeight - scrollTop - clientHeight;
    const shouldTrigger = distanceFromEnd <= clientHeight * threshold;

    if (shouldTrigger && !endReachedCalled && props.onEndReached) {
      endReachedCalled = true;
      props.onEndReached({ distanceFromEnd });
    } else if (!shouldTrigger) {
      endReachedCalled = false;
    }
  };

  if (platform === 'web') {
    // Render items
    const renderItems = () => {
      if (data.length === 0 && props.ListEmptyComponent) {
        return props.ListEmptyComponent;
      }

      const { startIndex, endIndex } = visibleRange();
      const items: any[] = [];

      // Add header
      if (props.ListHeaderComponent) {
        items.push({
          type: 'div',
          props: {
            key: '__header__',
            style: props.ListHeaderComponentStyle || {},
          },
          children: props.ListHeaderComponent,
        });
      }

      // Add spacer for virtualization
      if (startIndex > 0 && props.getItemLayout) {
        const spacerHeight = startIndex * itemHeight;
        items.push({
          type: 'div',
          props: {
            key: '__spacer_start__',
            style: { height: `${spacerHeight}px`, flexShrink: 0 },
          },
          children: null,
        });
      }

      // Render visible items
      for (let i = startIndex; i <= endIndex && i < data.length; i++) {
        const item = data[i];
        const key = getKey(item, i);

        const separators = {
          highlight: () => {},
          unhighlight: () => {},
          updateProps: () => {},
        };

        const renderedItem = props.renderItem({
          item,
          index: i,
          separators,
        });

        items.push({
          type: 'div',
          props: {
            key,
            'data-index': i,
            style: props.numColumns
              ? { flex: `0 0 ${100 / props.numColumns}%` }
              : {},
          },
          children: renderedItem,
        });

        // Add separator
        if (props.ItemSeparatorComponent && i < data.length - 1) {
          items.push({
            type: 'div',
            props: { key: `${key}_separator` },
            children: props.ItemSeparatorComponent,
          });
        }
      }

      // Add end spacer
      if (endIndex < data.length - 1 && props.getItemLayout) {
        const spacerHeight = (data.length - endIndex - 1) * itemHeight;
        items.push({
          type: 'div',
          props: {
            key: '__spacer_end__',
            style: { height: `${spacerHeight}px`, flexShrink: 0 },
          },
          children: null,
        });
      }

      // Add footer
      if (props.ListFooterComponent) {
        items.push({
          type: 'div',
          props: {
            key: '__footer__',
            style: props.ListFooterComponentStyle || {},
          },
          children: props.ListFooterComponent,
        });
      }

      return items;
    };

    const handleScroll = (e: any) => {
      const target = e.target;
      scrollOffset.set(target.scrollTop);
      containerHeight.set(target.clientHeight);

      checkEndReached(target.scrollTop, target.scrollHeight, target.clientHeight);

      props.onScroll?.(e);
    };

    const containerStyle: Record<string, any> = {
      ...mergedStyle,
      overflow: 'auto',
      '-webkit-overflow-scrolling': 'touch',
    };

    if (props.horizontal) {
      containerStyle['overflow-x'] = 'auto';
      containerStyle['overflow-y'] = 'hidden';
    }

    const contentStyle: Record<string, any> = {
      ...mergedContentStyle,
      display: 'flex',
      'flex-direction': props.horizontal ? 'row' : 'column',
    };

    if (props.numColumns && props.numColumns > 1) {
      contentStyle['flex-wrap'] = 'wrap';
    }

    if (props.inverted) {
      contentStyle['flex-direction'] = props.horizontal ? 'row-reverse' : 'column-reverse';
    }

    return {
      type: 'div',
      props: {
        style: containerStyle,
        'data-testid': props.testID,
        onScroll: handleScroll,
      },
      children: {
        type: 'div',
        props: {
          style: contentStyle,
        },
        children: renderItems(),
      },
    };
  }

  // Return native element descriptor
  return {
    type: 'NativeFlatList',
    props: {
      ...props,
      style: mergedStyle,
      contentContainerStyle: mergedContentStyle,
    },
    children: null,
  };
}

// ============================================================================
// FlatList Utilities
// ============================================================================

/**
 * Create a FlatList reference
 */
export function createFlatListRef<T>(): FlatListRef<T> {
  let scrollElement: HTMLElement | null = null;
  let data: T[] = [];
  let getItemLayout: FlatListProps<T>['getItemLayout'];

  return {
    scrollToEnd(params) {
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: params?.animated ? 'smooth' : 'auto',
        });
      }
    },

    scrollToIndex(params) {
      if (scrollElement && getItemLayout && data) {
        const layout = getItemLayout(data, params.index);
        scrollElement.scrollTo({
          top: layout.offset,
          behavior: params.animated ? 'smooth' : 'auto',
        });
      }
    },

    scrollToItem(params) {
      const index = data.indexOf(params.item);
      if (index >= 0) {
        this.scrollToIndex({ index, animated: params.animated });
      }
    },

    scrollToOffset(params) {
      if (scrollElement) {
        scrollElement.scrollTo({
          top: params.offset,
          behavior: params.animated ? 'smooth' : 'auto',
        });
      }
    },

    flashScrollIndicators() {
      // Web doesn't have native scroll indicator flashing
    },

    getNativeScrollRef() {
      return scrollElement;
    },

    getScrollResponder() {
      return scrollElement;
    },

    getScrollableNode() {
      return scrollElement;
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

export default FlatList;
