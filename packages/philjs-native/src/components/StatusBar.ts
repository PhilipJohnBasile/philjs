/**
 * StatusBar Component
 *
 * Component to control the app status bar.
 * Controls appearance, visibility, and network activity indicator.
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
  /**
   * Whether status bar is hidden
   */
  hidden?: boolean;

  /**
   * Status bar style
   */
  barStyle?: StatusBarStyle;

  /**
   * Whether translucent (Android)
   */
  translucent?: boolean;

  /**
   * Background color (Android)
   */
  backgroundColor?: string;

  /**
   * Show/hide animation
   */
  animated?: boolean;

  /**
   * Show network activity indicator (iOS)
   */
  networkActivityIndicatorVisible?: boolean;

  /**
   * Hide animation type
   */
  showHideTransition?: StatusBarAnimation;
}

/**
 * Current status bar state
 */
interface StatusBarState {
  hidden: boolean;
  barStyle: StatusBarStyle;
  translucent: boolean;
  backgroundColor: string;
  networkActivityIndicatorVisible: boolean;
}

// ============================================================================
// Status Bar State
// ============================================================================

const statusBarState = signal<StatusBarState>({
  hidden: false,
  barStyle: 'default',
  translucent: false,
  backgroundColor: '#000000',
  networkActivityIndicatorVisible: false,
});

// ============================================================================
// StatusBar Component
// ============================================================================

/**
 * Create a StatusBar component
 */
export function StatusBar(props: StatusBarProps): any {
  const platform = detectPlatform();

  // Update state based on props
  effect(() => {
    const newState: Partial<StatusBarState> = {};

    if (props.hidden !== undefined) {
      newState.hidden = props.hidden;
    }
    if (props.barStyle !== undefined) {
      newState.barStyle = props.barStyle;
    }
    if (props.translucent !== undefined) {
      newState.translucent = props.translucent;
    }
    if (props.backgroundColor !== undefined) {
      newState.backgroundColor = props.backgroundColor;
    }
    if (props.networkActivityIndicatorVisible !== undefined) {
      newState.networkActivityIndicatorVisible = props.networkActivityIndicatorVisible;
    }

    statusBarState.set({ ...statusBarState(), ...newState });

    // Apply to web
    if (platform === 'web') {
      applyWebStatusBar(statusBarState());
    } else {
      // Apply to native
      nativeBridge.call('StatusBar', 'update', statusBarState());
    }
  });

  // StatusBar renders nothing visible
  return null;
}

// ============================================================================
// Static Methods
// ============================================================================

/**
 * Set the status bar style
 */
StatusBar.setBarStyle = function setBarStyle(
  style: StatusBarStyle,
  animated?: boolean
): void {
  const platform = detectPlatform();

  statusBarState.set({ ...statusBarState(), barStyle: style });

  if (platform === 'web') {
    applyWebStatusBar(statusBarState());
  } else {
    nativeBridge.call('StatusBar', 'setBarStyle', style, animated);
  }
};

/**
 * Set the status bar hidden state
 */
StatusBar.setHidden = function setHidden(
  hidden: boolean,
  animation?: StatusBarAnimation
): void {
  const platform = detectPlatform();

  statusBarState.set({ ...statusBarState(), hidden });

  if (platform === 'web') {
    applyWebStatusBar(statusBarState());
  } else {
    nativeBridge.call('StatusBar', 'setHidden', hidden, animation);
  }
};

/**
 * Set the background color (Android)
 */
StatusBar.setBackgroundColor = function setBackgroundColor(
  color: string,
  animated?: boolean
): void {
  const platform = detectPlatform();

  statusBarState.set({ ...statusBarState(), backgroundColor: color });

  if (platform === 'web') {
    applyWebStatusBar(statusBarState());
  } else if (platform === 'android') {
    nativeBridge.call('StatusBar', 'setBackgroundColor', color, animated);
  }
};

/**
 * Set translucent state (Android)
 */
StatusBar.setTranslucent = function setTranslucent(translucent: boolean): void {
  const platform = detectPlatform();

  statusBarState.set({ ...statusBarState(), translucent });

  if (platform === 'android') {
    nativeBridge.call('StatusBar', 'setTranslucent', translucent);
  }
};

/**
 * Set network activity indicator (iOS)
 */
StatusBar.setNetworkActivityIndicatorVisible = function setNetworkActivityIndicatorVisible(
  visible: boolean
): void {
  const platform = detectPlatform();

  statusBarState.set({ ...statusBarState(), networkActivityIndicatorVisible: visible });

  if (platform === 'ios') {
    nativeBridge.call('StatusBar', 'setNetworkActivityIndicatorVisible', visible);
  }
};

/**
 * Push a status bar entry onto the stack
 */
StatusBar.pushStackEntry = function pushStackEntry(props: StatusBarProps): any {
  const entry = { ...props };
  statusBarStack.push(entry);
  updateFromStack();
  return entry;
};

/**
 * Pop a status bar entry from the stack
 */
StatusBar.popStackEntry = function popStackEntry(entry: any): void {
  const index = statusBarStack.indexOf(entry);
  if (index !== -1) {
    statusBarStack.splice(index, 1);
    updateFromStack();
  }
};

/**
 * Replace a status bar entry
 */
StatusBar.replaceStackEntry = function replaceStackEntry(
  entry: any,
  props: StatusBarProps
): any {
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
  const platform = detectPlatform();
  const info = platformInfo();

  if (platform === 'android') {
    return 24;
  }

  if (platform === 'ios') {
    // Check for notch
    if (typeof window !== 'undefined' && window.innerHeight >= 812) {
      return 44;
    }
    return 20;
  }

  return 0;
})();

// ============================================================================
// Stack Management
// ============================================================================

const statusBarStack: StatusBarProps[] = [];

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

/**
 * Apply status bar settings to web
 */
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

  // Apply to body for PWA
  document.body.style.setProperty('--status-bar-height', `${StatusBar.currentHeight}px`);
}

// ============================================================================
// Exports
// ============================================================================

export default StatusBar;
