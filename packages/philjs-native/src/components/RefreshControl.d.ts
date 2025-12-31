/**
 * RefreshControl Component
 *
 * Pull-to-refresh component for ScrollView and FlatList.
 * Provides native pull-to-refresh functionality with customizable appearance.
 */
import { type Signal } from 'philjs-core';
/**
 * RefreshControl props
 */
export interface RefreshControlProps {
    /**
     * Whether the view is refreshing
     */
    refreshing: boolean;
    /**
     * Called when user pulls to refresh
     */
    onRefresh: () => void;
    /**
     * Color of the refresh indicator (Android)
     */
    colors?: string[];
    /**
     * Progress background color (Android)
     */
    progressBackgroundColor?: string;
    /**
     * Progress view offset (Android)
     */
    progressViewOffset?: number;
    /**
     * Size of the refresh indicator (Android)
     */
    size?: 'default' | 'large';
    /**
     * Tint color of the refresh indicator (iOS)
     */
    tintColor?: string;
    /**
     * Title displayed below the refresh indicator (iOS)
     */
    title?: string;
    /**
     * Title color (iOS)
     */
    titleColor?: string;
    /**
     * Whether refresh control is enabled
     */
    enabled?: boolean;
}
/**
 * Pull-to-refresh state
 */
export type RefreshState = 'idle' | 'pulling' | 'refreshing' | 'completing';
/**
 * Create a RefreshControl component
 */
export declare function RefreshControl(props: RefreshControlProps): any;
/**
 * Configuration for usePullToRefresh hook
 */
export interface PullToRefreshConfig {
    /** Threshold to trigger refresh (pixels) */
    threshold?: number;
    /** Resistance factor when pulling past threshold */
    resistance?: number;
    /** Refresh spinner color */
    spinnerColor?: string;
    /** Background color while pulling */
    backgroundColor?: string;
    /** Callback when refresh starts */
    onRefresh: () => Promise<void>;
}
/**
 * Create a pull-to-refresh hook for web
 */
export declare function usePullToRefresh(config: PullToRefreshConfig): {
    refreshState: Signal<RefreshState>;
    pullDistance: Signal<number>;
    handlers: {
        onTouchStart: (e: TouchEvent) => void;
        onTouchMove: (e: TouchEvent) => void;
        onTouchEnd: () => void;
    };
    isRefreshing: () => boolean;
    indicatorStyle: () => Record<string, any>;
};
/**
 * Refresh indicator props
 */
export interface RefreshIndicatorProps {
    /** Whether currently refreshing */
    isRefreshing: boolean;
    /** Current pull distance */
    pullDistance: number;
    /** Threshold distance */
    threshold?: number;
    /** Spinner color */
    color?: string;
    /** Size in pixels */
    size?: number;
}
/**
 * Refresh indicator component for web
 */
export declare function RefreshIndicator(props: RefreshIndicatorProps): any;
/**
 * Simple refresh state hook
 */
export declare function useRefresh(onRefresh: () => Promise<void>): {
    isRefreshing: Signal<boolean>;
    refresh: () => Promise<void>;
};
export default RefreshControl;
//# sourceMappingURL=RefreshControl.d.ts.map