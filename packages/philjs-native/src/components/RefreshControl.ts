/**
 * RefreshControl Component
 *
 * Pull-to-refresh component for ScrollView and FlatList.
 * Provides native pull-to-refresh functionality with customizable appearance.
 */

import { signal, effect, type Signal } from '@philjs/core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// RefreshControl Component
// ============================================================================

/**
 * Create a RefreshControl component
 */
export function RefreshControl(props: RefreshControlProps): any {
  const platform = detectPlatform();

  if (platform === 'web') {
    // For web, return null - the parent ScrollView handles the UI
    return null;
  }

  // Return native element descriptor
  return {
    type: 'NativeRefreshControl',
    props: {
      refreshing: props.refreshing,
      onRefresh: props.onRefresh,
      colors: props.colors,
      progressBackgroundColor: props.progressBackgroundColor,
      progressViewOffset: props.progressViewOffset,
      size: props.size,
      tintColor: props.tintColor,
      title: props.title,
      titleColor: props.titleColor,
      enabled: props.enabled ?? true,
    },
    children: null,
  };
}

// ============================================================================
// Pull-to-Refresh Hook
// ============================================================================

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
export function usePullToRefresh(config: PullToRefreshConfig): {
  refreshState: Signal<RefreshState>;
  pullDistance: Signal<number>;
  handlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
  };
  isRefreshing: () => boolean;
  indicatorStyle: () => Record<string, any>;
} {
  const threshold = config.threshold ?? 80;
  const resistance = config.resistance ?? 2.5;

  const refreshState = signal<RefreshState>('idle');
  const pullDistance = signal(0);
  let startY = 0;
  let scrollTop = 0;

  const onTouchStart = (e: TouchEvent) => {
    if (refreshState() !== 'idle') return;

    const touch = e.touches[0];
    if (touch) {
      startY = touch.clientY;
    }
    scrollTop = (e.currentTarget as HTMLElement)?.scrollTop ?? 0;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (refreshState() === 'refreshing' || refreshState() === 'completing') return;

    // Only allow pull-to-refresh when at top of scroll
    if (scrollTop > 0) return;

    const touch = e.touches[0];
    if (!touch) return;
    const currentY = touch.clientY;
    const diff = currentY - startY;

    if (diff > 0) {
      // Apply resistance
      const distance = diff / resistance;
      pullDistance.set(Math.min(distance, threshold * 1.5));
      refreshState.set('pulling');
    }
  };

  const onTouchEnd = async () => {
    if (refreshState() !== 'pulling') return;

    if (pullDistance() >= threshold) {
      refreshState.set('refreshing');

      try {
        await config.onRefresh();
      } finally {
        refreshState.set('completing');

        // Animate back to idle
        setTimeout(() => {
          pullDistance.set(0);
          refreshState.set('idle');
        }, 300);
      }
    } else {
      pullDistance.set(0);
      refreshState.set('idle');
    }
  };

  const isRefreshing = () => refreshState() === 'refreshing';

  const indicatorStyle = () => {
    const distance = pullDistance();
    const state = refreshState();

    return {
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: `translateX(-50%) translateY(${distance - 40}px)`,
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: config.backgroundColor ?? '#f5f5f5',
      display: state !== 'idle' || distance > 0 ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      transition: state === 'completing' ? 'transform 0.3s ease' : 'none',
      zIndex: 1000,
    };
  };

  return {
    refreshState,
    pullDistance,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    isRefreshing,
    indicatorStyle,
  };
}

// ============================================================================
// Refresh Indicator Component
// ============================================================================

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
export function RefreshIndicator(props: RefreshIndicatorProps): any {
  const platform = detectPlatform();

  if (platform !== 'web') {
    return null;
  }

  const threshold = props.threshold ?? 80;
  const size = props.size ?? 32;
  const color = props.color ?? '#007AFF';

  const progress = Math.min(props.pullDistance / threshold, 1);
  const rotation = props.isRefreshing ? 'rotate(360deg)' : `rotate(${progress * 360}deg)`;

  return {
    type: 'div',
    props: {
      style: {
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    children: [
      {
        type: 'svg',
        props: {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          style: {
            transform: rotation,
            transition: props.isRefreshing ? 'transform 1s linear infinite' : 'none',
            animation: props.isRefreshing ? 'spin 1s linear infinite' : 'none',
          },
        },
        children: [
          {
            type: 'circle',
            props: {
              cx: 12,
              cy: 12,
              r: 10,
              fill: 'none',
              stroke: color,
              strokeWidth: 2,
              strokeDasharray: `${progress * 62.8} 62.8`,
              strokeLinecap: 'round',
              transform: 'rotate(-90 12 12)',
            },
          },
        ],
      },
    ],
  };
}

// ============================================================================
// useRefresh Hook
// ============================================================================

/**
 * Simple refresh state hook
 */
export function useRefresh(
  onRefresh: () => Promise<void>
): {
  isRefreshing: Signal<boolean>;
  refresh: () => Promise<void>;
} {
  const isRefreshing = signal(false);

  const refresh = async () => {
    if (isRefreshing()) return;

    isRefreshing.set(true);

    try {
      await onRefresh();
    } finally {
      isRefreshing.set(false);
    }
  };

  return { isRefreshing, refresh };
}

// ============================================================================
// Export
// ============================================================================

export default RefreshControl;
