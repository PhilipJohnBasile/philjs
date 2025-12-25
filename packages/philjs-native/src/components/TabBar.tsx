/**
 * PhilJS Native - TabBar Component (TSX)
 *
 * A native-style tab bar component for bottom navigation
 * with support for icons, badges, and haptic feedback.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, platformSelect } from '../runtime.js';
import type { ViewStyle, TextStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Tab item definition
 */
export interface TabItem {
  /** Unique key for the tab */
  key: string;
  /** Tab label */
  label: string;
  /** Icon component or name */
  icon: string | ((props: { focused: boolean; color: string; size: number }) => any);
  /** Focused icon (optional, uses icon if not provided) */
  focusedIcon?: string | ((props: { focused: boolean; color: string; size: number }) => any);
  /** Badge text or number */
  badge?: string | number;
  /** Badge color */
  badgeColor?: string;
  /** Whether tab is disabled */
  disabled?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
}

/**
 * TabBar props
 */
export interface TabBarProps {
  /** Tab items */
  items: TabItem[];
  /** Currently active tab key */
  activeKey: string;
  /** Tab change handler */
  onTabChange: (key: string) => void;
  /** Background color */
  backgroundColor?: string;
  /** Active tint color */
  activeTintColor?: string;
  /** Inactive tint color */
  inactiveTintColor?: string;
  /** Whether to show labels */
  showLabels?: boolean;
  /** Icon size */
  iconSize?: number;
  /** Label style */
  labelStyle?: TextStyle;
  /** Tab bar style */
  style?: ViewStyle;
  /** Whether tab bar is hidden */
  hidden?: boolean;
  /** Position (top or bottom) */
  position?: 'top' | 'bottom';
  /** Tab bar height */
  height?: number;
  /** Enable haptic feedback */
  hapticFeedback?: boolean;
  /** Border settings */
  borderTopWidth?: number;
  borderColor?: string;
  /** Shadow settings */
  shadow?: boolean;
  /** Safe area handling */
  safeAreaBottom?: boolean;
  /** Translucent bar */
  translucent?: boolean;
  /** Blur effect (iOS) */
  blurEffect?: boolean;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// Constants
// ============================================================================

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_HEIGHT_WITH_LABELS = 56;
const ICON_SIZE = 24;
const BADGE_SIZE = 18;

// ============================================================================
// TabBar Component
// ============================================================================

/**
 * TabBar component
 */
export function TabBar(props: TabBarProps): any {
  const {
    items,
    activeKey,
    onTabChange,
    backgroundColor = '#FFFFFF',
    activeTintColor = '#007AFF',
    inactiveTintColor = '#8E8E93',
    showLabels = true,
    iconSize = ICON_SIZE,
    labelStyle,
    style,
    hidden = false,
    position = 'bottom',
    height,
    hapticFeedback = true,
    borderTopWidth = 1,
    borderColor = 'rgba(0, 0, 0, 0.1)',
    shadow = true,
    safeAreaBottom = true,
    translucent = false,
    blurEffect = false,
    testID,
  } = props;

  const platform = detectPlatform();

  if (hidden) {
    return null;
  }

  const barHeight = height || (showLabels ? TAB_BAR_HEIGHT_WITH_LABELS : TAB_BAR_HEIGHT);

  if (platform === 'web') {
    return {
      type: 'nav',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'space-around',
          height: `${barHeight}px`,
          minHeight: `${barHeight}px`,
          backgroundColor: translucent ? 'rgba(255, 255, 255, 0.9)' : backgroundColor,
          backdropFilter: blurEffect ? 'blur(10px)' : undefined,
          WebkitBackdropFilter: blurEffect ? 'blur(10px)' : undefined,
          borderTop: position === 'bottom' && borderTopWidth > 0
            ? `${borderTopWidth}px solid ${borderColor}`
            : 'none',
          borderBottom: position === 'top' && borderTopWidth > 0
            ? `${borderTopWidth}px solid ${borderColor}`
            : 'none',
          boxShadow: shadow
            ? position === 'bottom'
              ? '0 -1px 3px rgba(0, 0, 0, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)'
            : 'none',
          paddingBottom: safeAreaBottom && position === 'bottom'
            ? 'env(safe-area-inset-bottom, 0px)'
            : undefined,
          position: 'relative',
          zIndex: 100,
          ...style,
        },
        'data-testid': testID,
        role: 'tablist',
        'aria-label': 'Tab navigation',
      },
      children: items.map((item) =>
        renderTabItem(item, {
          isActive: item.key === activeKey,
          activeTintColor,
          inactiveTintColor,
          showLabels,
          iconSize,
          labelStyle,
          hapticFeedback,
          platform,
          onPress: () => {
            if (!item.disabled) {
              if (hapticFeedback) {
                triggerHaptic();
              }
              item.onPress?.();
              onTabChange(item.key);
            }
          },
        })
      ),
    };
  }

  // Native
  return {
    type: 'NativeTabBar',
    props: {
      items,
      activeKey,
      onTabChange,
      backgroundColor,
      activeTintColor,
      inactiveTintColor,
      showLabels,
      iconSize,
      height: barHeight,
      position,
      hapticFeedback,
      borderTopWidth,
      borderColor,
      shadow,
      safeAreaBottom,
      translucent,
      blurEffect,
      testID,
      ...style,
    },
  };
}

// ============================================================================
// Tab Item Renderer
// ============================================================================

function renderTabItem(
  item: TabItem,
  options: {
    isActive: boolean;
    activeTintColor: string;
    inactiveTintColor: string;
    showLabels: boolean;
    iconSize: number;
    labelStyle?: TextStyle;
    hapticFeedback: boolean;
    platform: string;
    onPress: () => void;
  }
): any {
  const {
    isActive,
    activeTintColor,
    inactiveTintColor,
    showLabels,
    iconSize,
    labelStyle,
    onPress,
  } = options;

  const color = isActive ? activeTintColor : inactiveTintColor;
  const iconToUse = isActive && item.focusedIcon ? item.focusedIcon : item.icon;

  return {
    type: 'button',
    props: {
      key: item.key,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: item.disabled ? 'not-allowed' : 'pointer',
        opacity: item.disabled ? 0.5 : 1,
        padding: '4px',
        minWidth: '64px',
        position: 'relative',
        transition: 'transform 0.1s ease',
      },
      onClick: onPress,
      onMouseDown: (e: any) => {
        if (!item.disabled) {
          e.currentTarget.style.transform = 'scale(0.95)';
        }
      },
      onMouseUp: (e: any) => {
        e.currentTarget.style.transform = 'scale(1)';
      },
      onMouseLeave: (e: any) => {
        e.currentTarget.style.transform = 'scale(1)';
      },
      onContextMenu: item.onLongPress
        ? (e: any) => {
            e.preventDefault();
            item.onLongPress?.();
          }
        : undefined,
      disabled: item.disabled,
      role: 'tab',
      'aria-selected': isActive,
      'aria-label': item.accessibilityLabel || item.label,
      tabIndex: 0,
    },
    children: [
      // Icon container with badge
      {
        type: 'div',
        props: {
          style: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${iconSize + 8}px`,
            height: `${iconSize + 4}px`,
          },
        },
        children: [
          // Icon
          typeof iconToUse === 'function'
            ? iconToUse({ focused: isActive, color, size: iconSize })
            : {
                type: 'span',
                props: {
                  style: {
                    fontSize: `${iconSize}px`,
                    color,
                    lineHeight: 1,
                  },
                },
                children: iconToUse,
              },
          // Badge
          item.badge !== undefined && renderBadge(item.badge, item.badgeColor),
        ],
      },
      // Label
      showLabels && {
        type: 'span',
        props: {
          style: {
            fontSize: '10px',
            fontWeight: isActive ? '600' : '400',
            color,
            marginTop: '2px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            ...labelStyle,
          },
        },
        children: item.label,
      },
    ].filter(Boolean),
  };
}

function renderBadge(badge: string | number, badgeColor = '#FF3B30'): any {
  const text = typeof badge === 'number' && badge > 99 ? '99+' : String(badge);
  const isSmall = text.length === 0;

  return {
    type: 'span',
    props: {
      style: {
        position: 'absolute',
        top: '-2px',
        right: '-4px',
        minWidth: isSmall ? '8px' : `${BADGE_SIZE}px`,
        height: isSmall ? '8px' : `${BADGE_SIZE}px`,
        backgroundColor: badgeColor,
        borderRadius: `${BADGE_SIZE / 2}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isSmall ? 0 : '0 5px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#FFFFFF',
        lineHeight: 1,
      },
    },
    children: isSmall ? null : text,
  };
}

// ============================================================================
// Haptic Feedback
// ============================================================================

function triggerHaptic(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(5);
  }
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for tab bar state
 */
export function useTabBar(
  items: TabItem[],
  initialKey?: string
): {
  activeKey: string;
  setActiveKey: (key: string) => void;
  items: TabItem[];
} {
  const activeKeySignal = signal(initialKey || items[0]?.key || '');

  return {
    activeKey: activeKeySignal(),
    setActiveKey: (key: string) => activeKeySignal.set(key),
    items,
  };
}

/**
 * Hook for tab bar visibility
 */
export function useTabBarVisibility(): {
  hidden: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
} {
  const hiddenSignal = signal(false);

  return {
    hidden: hiddenSignal(),
    show: () => hiddenSignal.set(false),
    hide: () => hiddenSignal.set(true),
    toggle: () => hiddenSignal.set(!hiddenSignal()),
  };
}

// ============================================================================
// Preset Styles
// ============================================================================

export const TabBarStyles = {
  /**
   * iOS style tab bar
   */
  ios: {
    backgroundColor: '#F8F8F8',
    activeTintColor: '#007AFF',
    inactiveTintColor: '#8E8E93',
    translucent: true,
    blurEffect: true,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    shadow: false,
  },

  /**
   * Android Material style
   */
  material: {
    backgroundColor: '#FFFFFF',
    activeTintColor: '#6200EE',
    inactiveTintColor: '#757575',
    translucent: false,
    borderTopWidth: 0,
    shadow: true,
    showLabels: true,
  },

  /**
   * Dark mode
   */
  dark: {
    backgroundColor: '#1C1C1E',
    activeTintColor: '#0A84FF',
    inactiveTintColor: '#8E8E93',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  /**
   * Minimal (icons only)
   */
  minimal: {
    backgroundColor: '#FFFFFF',
    activeTintColor: '#000000',
    inactiveTintColor: '#CCCCCC',
    showLabels: false,
    height: 44,
    borderTopWidth: 0,
    shadow: false,
  },

  /**
   * Floating style
   */
  floating: {
    backgroundColor: '#FFFFFF',
    activeTintColor: '#007AFF',
    inactiveTintColor: '#8E8E93',
    style: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      borderRadius: 24,
    },
    shadow: true,
    safeAreaBottom: false,
  },
};

// ============================================================================
// Exports
// ============================================================================

export default TabBar;
