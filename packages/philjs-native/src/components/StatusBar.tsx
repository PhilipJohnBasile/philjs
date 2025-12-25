/**
 * PhilJS Native - StatusBar Component (TSX)
 *
 * A React-style component to control the app status bar appearance,
 * including style, visibility, and background color.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge, platformInfo } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Status bar style
 */
export type StatusBarStyle = 'default' | 'light-content' | 'dark-content';

/**
 * Status bar animation
 */
export type StatusBarAnimation = 'none' | 'fade' | 'slide';

/**
 * StatusBar props
 */
export interface StatusBarProps {
  /** Whether the status bar is hidden */
  hidden?: boolean;
  /** Status bar style (light/dark content) */
  barStyle?: StatusBarStyle;
  /** Whether the status bar is translucent (Android) */
  translucent?: boolean;
  /** Background color (Android) */
  backgroundColor?: string;
  /** Whether to animate changes */
  animated?: boolean;
  /** Animation type for show/hide */
  showHideTransition?: StatusBarAnimation;
  /** Show network activity indicator (iOS) */
  networkActivityIndicatorVisible?: boolean;
}

/**
 * Internal status bar state
 */
interface StatusBarState {
  hidden: boolean;
  barStyle: StatusBarStyle;
  translucent: boolean;
  backgroundColor: string;
  networkActivityIndicatorVisible: boolean;
}

// ============================================================================
// State
// ============================================================================

const statusBarState = signal<StatusBarState>({
  hidden: false,
  barStyle: 'default',
  translucent: false,
  backgroundColor: '#000000',
  networkActivityIndicatorVisible: false,
});

const statusBarStack: StatusBarProps[] = [];

// ============================================================================
// StatusBar Component
// ============================================================================

/**
 * StatusBar component - renders nothing but controls status bar
 */
export function StatusBar(props: StatusBarProps): null {
  const platform = detectPlatform();

  // Update state when props change
  effect(() => {
    const updates: Partial<StatusBarState> = {};

    if (props.hidden !== undefined) {
      updates.hidden = props.hidden;
    }
    if (props.barStyle !== undefined) {
      updates.barStyle = props.barStyle;
    }
    if (props.translucent !== undefined) {
      updates.translucent = props.translucent;
    }
    if (props.backgroundColor !== undefined) {
      updates.backgroundColor = props.backgroundColor;
    }
    if (props.networkActivityIndicatorVisible !== undefined) {
      updates.networkActivityIndicatorVisible = props.networkActivityIndicatorVisible;
    }

    if (Object.keys(updates).length > 0) {
      statusBarState.set({ ...statusBarState(), ...updates });

      if (platform === 'web') {
        applyWebStatusBar(statusBarState());
      } else {
        nativeBridge.call('StatusBar', 'update', statusBarState());
      }
    }
  });

  // StatusBar renders nothing
  return null;
}

// ============================================================================
// Static Methods
// ============================================================================

/**
 * Set the status bar style
 */
StatusBar.setBarStyle = function(style: StatusBarStyle, animated = false): void {
  const platform = detectPlatform();
  statusBarState.set({ ...statusBarState(), barStyle: style });

  if (platform === 'web') {
    applyWebStatusBar(statusBarState());
  } else {
    nativeBridge.call('StatusBar', 'setBarStyle', { style, animated });
  }
};

/**
 * Set the status bar visibility
 */
StatusBar.setHidden = function(hidden: boolean, animation: StatusBarAnimation = 'none'): void {
  const platform = detectPlatform();
  statusBarState.set({ ...statusBarState(), hidden });

  if (platform === 'web') {
    applyWebStatusBar(statusBarState());
  } else {
    nativeBridge.call('StatusBar', 'setHidden', { hidden, animation });
  }
};

/**
 * Set the background color (Android)
 */
StatusBar.setBackgroundColor = function(color: string, animated = false): void {
  const platform = detectPlatform();
  statusBarState.set({ ...statusBarState(), backgroundColor: color });

  if (platform === 'web') {
    applyWebStatusBar(statusBarState());
  } else if (platform === 'android') {
    nativeBridge.call('StatusBar', 'setBackgroundColor', { color, animated });
  }
};

/**
 * Set translucent mode (Android)
 */
StatusBar.setTranslucent = function(translucent: boolean): void {
  const platform = detectPlatform();
  statusBarState.set({ ...statusBarState(), translucent });

  if (platform === 'android') {
    nativeBridge.call('StatusBar', 'setTranslucent', { translucent });
  }
};

/**
 * Set network activity indicator visibility (iOS)
 */
StatusBar.setNetworkActivityIndicatorVisible = function(visible: boolean): void {
  const platform = detectPlatform();
  statusBarState.set({ ...statusBarState(), networkActivityIndicatorVisible: visible });

  if (platform === 'ios') {
    nativeBridge.call('StatusBar', 'setNetworkActivityIndicatorVisible', { visible });
  }
};

/**
 * Push a status bar entry onto the stack
 */
StatusBar.pushStackEntry = function(props: StatusBarProps): StatusBarProps {
  const entry = { ...props };
  statusBarStack.push(entry);
  updateFromStack();
  return entry;
};

/**
 * Pop a status bar entry from the stack
 */
StatusBar.popStackEntry = function(entry: StatusBarProps): void {
  const index = statusBarStack.indexOf(entry);
  if (index !== -1) {
    statusBarStack.splice(index, 1);
    updateFromStack();
  }
};

/**
 * Replace a status bar entry
 */
StatusBar.replaceStackEntry = function(
  entry: StatusBarProps,
  props: StatusBarProps
): StatusBarProps {
  const index = statusBarStack.indexOf(entry);
  if (index !== -1) {
    const newEntry = { ...props };
    statusBarStack[index] = newEntry;
    updateFromStack();
    return newEntry;
  }
  return entry;
};

/**
 * Get current height
 */
StatusBar.currentHeight = (() => {
  if (typeof window === 'undefined') return 0;

  const platform = detectPlatform();
  const info = platformInfo();

  if (platform === 'android') {
    return 24;
  }

  if (platform === 'ios') {
    // Check for notch
    const isNotched = window.innerHeight >= 812 && window.innerWidth <= 428;
    return isNotched ? 47 : 20;
  }

  return 0;
})();

// ============================================================================
// Stack Management
// ============================================================================

function updateFromStack(): void {
  if (statusBarStack.length === 0) return;

  const current = statusBarStack[statusBarStack.length - 1];
  const platform = detectPlatform();

  if (current.hidden !== undefined) {
    StatusBar.setHidden(current.hidden, current.showHideTransition);
  }
  if (current.barStyle !== undefined) {
    StatusBar.setBarStyle(current.barStyle, current.animated);
  }
  if (current.backgroundColor !== undefined && platform === 'android') {
    StatusBar.setBackgroundColor(current.backgroundColor, current.animated);
  }
  if (current.translucent !== undefined && platform === 'android') {
    StatusBar.setTranslucent(current.translucent);
  }
  if (current.networkActivityIndicatorVisible !== undefined && platform === 'ios') {
    StatusBar.setNetworkActivityIndicatorVisible(current.networkActivityIndicatorVisible);
  }
}

// ============================================================================
// Web Implementation
// ============================================================================

function applyWebStatusBar(state: StatusBarState): void {
  if (typeof document === 'undefined') return;

  // Update meta theme-color
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', state.backgroundColor);

  // Update color scheme based on bar style
  const colorScheme = state.barStyle === 'dark-content' ? 'light' : 'dark';
  let metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  if (!metaColorScheme) {
    metaColorScheme = document.createElement('meta');
    metaColorScheme.setAttribute('name', 'color-scheme');
    document.head.appendChild(metaColorScheme);
  }
  metaColorScheme.setAttribute('content', colorScheme);

  // Update apple-mobile-web-app-status-bar-style
  let metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!metaApple) {
    metaApple = document.createElement('meta');
    metaApple.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(metaApple);
  }
  metaApple.setAttribute(
    'content',
    state.barStyle === 'light-content' ? 'black-translucent' : 'default'
  );

  // Apply CSS custom properties
  document.documentElement.style.setProperty(
    '--status-bar-height',
    `${StatusBar.currentHeight}px`
  );
  document.documentElement.style.setProperty(
    '--status-bar-background',
    state.backgroundColor
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get current status bar state
 */
export function useStatusBar(): StatusBarState {
  return statusBarState();
}

/**
 * Hook to control status bar within a screen
 */
export function useStatusBarEffect(props: StatusBarProps): void {
  effect(() => {
    const entry = StatusBar.pushStackEntry(props);

    return () => {
      StatusBar.popStackEntry(entry);
    };
  });
}

// ============================================================================
// Presets
// ============================================================================

/**
 * Preset configurations
 */
export const StatusBarPresets = {
  /**
   * Default light status bar
   */
  light: {
    barStyle: 'dark-content' as StatusBarStyle,
    backgroundColor: '#FFFFFF',
    translucent: false,
  },

  /**
   * Dark status bar
   */
  dark: {
    barStyle: 'light-content' as StatusBarStyle,
    backgroundColor: '#000000',
    translucent: false,
  },

  /**
   * Translucent status bar (for immersive content)
   */
  translucent: {
    barStyle: 'light-content' as StatusBarStyle,
    backgroundColor: 'transparent',
    translucent: true,
  },

  /**
   * Hidden status bar
   */
  hidden: {
    hidden: true,
  },

  /**
   * Primary color status bar
   */
  primary: (color: string): StatusBarProps => ({
    barStyle: 'light-content' as StatusBarStyle,
    backgroundColor: color,
    translucent: false,
  }),
};

// ============================================================================
// Exports
// ============================================================================

export default StatusBar;
