/**
 * FlatList Component
 *
 * A performant interface for rendering simple, flat lists.
 * Supports virtualization, pull-to-refresh, and infinite scrolling.
 */
import type { ViewStyle } from '../styles.js';
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
    onEndReached?: (info: {
        distanceFromEnd: number;
    }) => void;
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
    scrollToEnd: (params?: {
        animated?: boolean;
    }) => void;
    scrollToIndex: (params: {
        index: number;
        animated?: boolean;
        viewPosition?: number;
    }) => void;
    scrollToItem: (params: {
        item: T;
        animated?: boolean;
        viewPosition?: number;
    }) => void;
    scrollToOffset: (params: {
        offset: number;
        animated?: boolean;
    }) => void;
    flashScrollIndicators: () => void;
    getNativeScrollRef: () => any;
    getScrollResponder: () => any;
    getScrollableNode: () => any;
}
/**
 * Create a FlatList component
 */
export declare function FlatList<T>(props: FlatListProps<T>): any;
/**
 * Create a FlatList reference
 */
export declare function createFlatListRef<T>(): FlatListRef<T>;
export default FlatList;
//# sourceMappingURL=FlatList.d.ts.map