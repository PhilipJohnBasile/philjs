/**
 * PhilJS Native - NavigationBar Component (TSX)
 *
 * A native-style navigation bar component with back button,
 * title, and action buttons support.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, platformSelect } from '../runtime.js';
import type { ViewStyle, TextStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Navigation bar button
 */
export interface NavBarButton {
  /** Unique identifier */
  id: string;
  /** Button title text */
  title?: string;
  /** Icon name or component */
  icon?: string | (() => any);
  /** Press handler */
  onPress: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Text style */
  textStyle?: TextStyle;
  /** Tint color */
  tintColor?: string;
}

/**
 * NavigationBar props
 */
export interface NavigationBarProps {
  /** Navigation bar title */
  title?: string;
  /** Custom title component */
  titleComponent?: () => any;
  /** Whether to show back button */
  showBackButton?: boolean;
  /** Back button title (iOS) */
  backTitle?: string;
  /** Back button press handler */
  onBackPress?: () => void;
  /** Left side buttons */
  leftButtons?: NavBarButton[];
  /** Right side buttons */
  rightButtons?: NavBarButton[];
  /** Custom left component */
  leftComponent?: () => any;
  /** Custom right component */
  rightComponent?: () => any;
  /** Whether navigation bar is hidden */
  hidden?: boolean;
  /** Background color */
  backgroundColor?: string;
  /** Tint color for buttons */
  tintColor?: string;
  /** Title text style */
  titleStyle?: TextStyle;
  /** Navigation bar style */
  style?: ViewStyle;
  /** Whether to use large title (iOS) */
  largeTitle?: boolean;
  /** Whether bar is translucent */
  translucent?: boolean;
  /** Border bottom width (0 to hide) */
  borderBottomWidth?: number;
  /** Border color */
  borderColor?: string;
  /** Shadow enabled */
  shadow?: boolean;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// Constants
// ============================================================================

const NAV_BAR_HEIGHT = 44;
const LARGE_TITLE_HEIGHT = 96;
const BUTTON_HIT_SLOP = 8;

// ============================================================================
// NavigationBar Component
// ============================================================================

/**
 * NavigationBar component
 */
export function NavigationBar(props: NavigationBarProps): any {
  const {
    title,
    titleComponent,
    showBackButton = false,
    backTitle,
    onBackPress,
    leftButtons = [],
    rightButtons = [],
    leftComponent,
    rightComponent,
    hidden = false,
    backgroundColor = '#FFFFFF',
    tintColor = '#007AFF',
    titleStyle,
    style,
    largeTitle = false,
    translucent = false,
    borderBottomWidth = 1,
    borderColor = 'rgba(0, 0, 0, 0.1)',
    shadow = true,
    testID,
  } = props;

  const platform = detectPlatform();

  if (hidden) {
    return null;
  }

  // Calculate height
  const height = largeTitle ? LARGE_TITLE_HEIGHT : NAV_BAR_HEIGHT;

  if (platform === 'web') {
    return {
      type: 'nav',
      props: {
        style: {
          display: 'flex',
          flexDirection: largeTitle ? 'column' : 'row',
          alignItems: largeTitle ? 'stretch' : 'center',
          height: `${height}px`,
          minHeight: `${height}px`,
          backgroundColor: translucent ? 'rgba(255, 255, 255, 0.8)' : backgroundColor,
          backdropFilter: translucent ? 'blur(10px)' : undefined,
          WebkitBackdropFilter: translucent ? 'blur(10px)' : undefined,
          borderBottom: borderBottomWidth > 0 ? `${borderBottomWidth}px solid ${borderColor}` : 'none',
          boxShadow: shadow ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
          paddingLeft: '8px',
          paddingRight: '8px',
          position: 'relative',
          zIndex: 100,
          ...style,
        },
        'data-testid': testID,
        role: 'navigation',
        'aria-label': 'Main navigation',
      },
      children: largeTitle
        ? [
            // Regular bar section
            renderBarSection({
              showBackButton,
              backTitle,
              onBackPress,
              leftButtons,
              rightButtons,
              leftComponent,
              rightComponent,
              tintColor,
              platform,
            }),
            // Large title section
            {
              type: 'div',
              props: {
                style: {
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-end',
                  paddingLeft: '16px',
                  paddingBottom: '8px',
                },
              },
              children: titleComponent?.() || {
                type: 'h1',
                props: {
                  style: {
                    margin: 0,
                    fontSize: '34px',
                    fontWeight: '700',
                    letterSpacing: '-0.5px',
                    ...titleStyle,
                  },
                },
                children: title,
              },
            },
          ]
        : [
            // Left section
            renderLeftSection({
              showBackButton,
              backTitle,
              onBackPress,
              leftButtons,
              leftComponent,
              tintColor,
              platform,
            }),
            // Title section
            {
              type: 'div',
              props: {
                style: {
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                },
              },
              children: titleComponent?.() || {
                type: 'h1',
                props: {
                  style: {
                    margin: 0,
                    fontSize: '17px',
                    fontWeight: '600',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    ...titleStyle,
                  },
                },
                children: title,
              },
            },
            // Right section
            renderRightSection({
              rightButtons,
              rightComponent,
              tintColor,
              platform,
            }),
          ],
    };
  }

  // Native
  return {
    type: 'NativeNavigationBar',
    props: {
      title,
      showBackButton,
      backTitle,
      onBackPress,
      leftButtons,
      rightButtons,
      backgroundColor,
      tintColor,
      titleStyle,
      largeTitle,
      translucent,
      borderBottomWidth,
      borderColor,
      shadow,
      testID,
      ...style,
    },
    children: [
      leftComponent && { type: 'slot', props: { name: 'left' }, children: leftComponent() },
      titleComponent && { type: 'slot', props: { name: 'title' }, children: titleComponent() },
      rightComponent && { type: 'slot', props: { name: 'right' }, children: rightComponent() },
    ].filter(Boolean),
  };
}

// ============================================================================
// Section Renderers
// ============================================================================

function renderBarSection(params: {
  showBackButton: boolean;
  backTitle?: string;
  onBackPress?: () => void;
  leftButtons: NavBarButton[];
  rightButtons: NavBarButton[];
  leftComponent?: () => any;
  rightComponent?: () => any;
  tintColor: string;
  platform: string;
}): any {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: `${NAV_BAR_HEIGHT}px`,
      },
    },
    children: [
      renderLeftSection(params),
      { type: 'div', props: { style: { flex: 1 } }, children: null },
      renderRightSection(params),
    ],
  };
}

function renderLeftSection(params: {
  showBackButton: boolean;
  backTitle?: string;
  onBackPress?: () => void;
  leftButtons: NavBarButton[];
  leftComponent?: () => any;
  tintColor: string;
  platform: string;
}): any {
  const { showBackButton, backTitle, onBackPress, leftButtons, leftComponent, tintColor, platform } = params;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        minWidth: '80px',
      },
    },
    children: leftComponent?.() || [
      showBackButton && renderBackButton(backTitle, onBackPress, tintColor, platform),
      ...leftButtons.map((btn) => renderButton(btn, tintColor)),
    ].filter(Boolean),
  };
}

function renderRightSection(params: {
  rightButtons: NavBarButton[];
  rightComponent?: () => any;
  tintColor: string;
  platform: string;
}): any {
  const { rightButtons, rightComponent, tintColor } = params;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: '80px',
      },
    },
    children: rightComponent?.() || rightButtons.map((btn) => renderButton(btn, tintColor)),
  };
}

function renderBackButton(
  backTitle: string | undefined,
  onBackPress: (() => void) | undefined,
  tintColor: string,
  platform: string
): any {
  return {
    type: 'button',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        marginLeft: '-8px',
        color: tintColor,
        fontSize: '17px',
      },
      onClick: onBackPress,
      'aria-label': backTitle || 'Go back',
    },
    children: [
      // Back arrow
      {
        type: 'span',
        props: {
          style: {
            marginRight: platform === 'ios' ? '4px' : '8px',
            fontSize: '20px',
          },
        },
        children: platform === 'ios' ? '\u2039' : '\u2190', // ‹ or ←
      },
      // Back title (iOS style)
      platform === 'ios' && backTitle && {
        type: 'span',
        props: {},
        children: backTitle,
      },
    ].filter(Boolean),
  };
}

function renderButton(button: NavBarButton, defaultTintColor: string): any {
  const tintColor = button.tintColor || defaultTintColor;

  return {
    type: 'button',
    props: {
      key: button.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: button.disabled ? 'not-allowed' : 'pointer',
        padding: '8px',
        color: button.disabled ? '#999999' : tintColor,
        opacity: button.disabled ? 0.5 : 1,
        fontSize: '17px',
        ...button.style,
      },
      onClick: button.disabled ? undefined : button.onPress,
      disabled: button.disabled,
      'aria-label': button.accessibilityLabel || button.title,
    },
    children: [
      typeof button.icon === 'function' && button.icon(),
      typeof button.icon === 'string' && {
        type: 'span',
        props: { style: { marginRight: button.title ? '4px' : 0 } },
        children: button.icon,
      },
      button.title && {
        type: 'span',
        props: { style: button.textStyle },
        children: button.title,
      },
    ].filter(Boolean),
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to control navigation bar from a screen
 */
export function useNavigationBar(options: Partial<NavigationBarProps>): void {
  effect(() => {
    // Set navigation options
    // In a real implementation, this would update a context
  });
}

// ============================================================================
// Preset Styles
// ============================================================================

export const NavigationBarStyles = {
  /**
   * iOS style navigation bar
   */
  ios: {
    backgroundColor: '#F8F8F8',
    tintColor: '#007AFF',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    translucent: true,
    shadow: false,
  },

  /**
   * Android Material style
   */
  material: {
    backgroundColor: '#6200EE',
    tintColor: '#FFFFFF',
    borderBottomWidth: 0,
    shadow: true,
    titleStyle: {
      color: '#FFFFFF',
      fontWeight: '500' as const,
    },
  },

  /**
   * Dark mode
   */
  dark: {
    backgroundColor: '#1C1C1E',
    tintColor: '#0A84FF',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    titleStyle: {
      color: '#FFFFFF',
    },
  },

  /**
   * Transparent (for hero images)
   */
  transparent: {
    backgroundColor: 'transparent',
    tintColor: '#FFFFFF',
    borderBottomWidth: 0,
    shadow: false,
    translucent: true,
    titleStyle: {
      color: '#FFFFFF',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
    },
  },
};

// ============================================================================
// Exports
// ============================================================================

export default NavigationBar;
