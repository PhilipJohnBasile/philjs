/**
 * FlatList Component
 *
 * A performant interface for rendering simple, flat lists.
 * Supports virtualization, pull-to-refresh, and infinite scrolling.
 */
import { signal, effect, memo } from 'philjs-core';
import { detectPlatform } from '../runtime.js';
// ============================================================================
// FlatList Component
// ============================================================================
/**
 * Create a FlatList component
 */
export function FlatList(props) {
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
        const endIndex = Math.min(data.length - 1, Math.ceil((offset + height) / itemHeight) + Math.floor(windowSize / 2));
        return { startIndex, endIndex };
    });
    // Key extractor
    const getKey = props.keyExtractor || ((item, index) => String(index));
    // Merge styles
    const mergedStyle = Array.isArray(props.style)
        ? Object.assign({}, ...props.style.filter(Boolean))
        : props.style || {};
    const mergedContentStyle = Array.isArray(props.contentContainerStyle)
        ? Object.assign({}, ...props.contentContainerStyle.filter(Boolean))
        : props.contentContainerStyle || {};
    // End reached detection
    let endReachedCalled = false;
    const checkEndReached = (scrollTop, scrollHeight, clientHeight) => {
        const threshold = props.onEndReachedThreshold || 0.5;
        const distanceFromEnd = scrollHeight - scrollTop - clientHeight;
        const shouldTrigger = distanceFromEnd <= clientHeight * threshold;
        if (shouldTrigger && !endReachedCalled && props.onEndReached) {
            endReachedCalled = true;
            props.onEndReached({ distanceFromEnd });
        }
        else if (!shouldTrigger) {
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
            const items = [];
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
                    highlight: () => { },
                    unhighlight: () => { },
                    updateProps: () => { },
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
        const handleScroll = (e) => {
            const target = e.target;
            scrollOffset.set(target.scrollTop);
            containerHeight.set(target.clientHeight);
            checkEndReached(target.scrollTop, target.scrollHeight, target.clientHeight);
            props.onScroll?.(e);
        };
        const containerStyle = {
            ...mergedStyle,
            overflow: 'auto',
            '-webkit-overflow-scrolling': 'touch',
        };
        if (props.horizontal) {
            containerStyle['overflow-x'] = 'auto';
            containerStyle['overflow-y'] = 'hidden';
        }
        const contentStyle = {
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
export function createFlatListRef() {
    const state = {
        scrollElement: null,
        data: [],
        getItemLayout: undefined,
    };
    return {
        scrollToEnd(params) {
            if (state.scrollElement) {
                state.scrollElement.scrollTo({
                    top: state.scrollElement.scrollHeight,
                    behavior: params?.animated ? 'smooth' : 'auto',
                });
            }
        },
        scrollToIndex(params) {
            if (state.scrollElement && state.getItemLayout && state.data) {
                const layout = state.getItemLayout(state.data, params.index);
                state.scrollElement.scrollTo({
                    top: layout.offset,
                    behavior: params.animated ? 'smooth' : 'auto',
                });
            }
        },
        scrollToItem(params) {
            const index = state.data.indexOf(params.item);
            if (index >= 0) {
                this.scrollToIndex({ index, ...(params.animated !== undefined ? { animated: params.animated } : {}) });
            }
        },
        scrollToOffset(params) {
            if (state.scrollElement) {
                state.scrollElement.scrollTo({
                    top: params.offset,
                    behavior: params.animated ? 'smooth' : 'auto',
                });
            }
        },
        flashScrollIndicators() {
            // Web doesn't have native scroll indicator flashing
        },
        getNativeScrollRef() {
            return state.scrollElement;
        },
        getScrollResponder() {
            return state.scrollElement;
        },
        getScrollableNode() {
            return state.scrollElement;
        },
    };
}
// ============================================================================
// Exports
// ============================================================================
export default FlatList;
//# sourceMappingURL=FlatList.js.map