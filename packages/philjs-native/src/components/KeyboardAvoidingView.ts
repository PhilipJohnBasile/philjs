/**
 * KeyboardAvoidingView Component
 *
 * A view that automatically adjusts its height or position
 * when the keyboard appears to keep content visible.
 */

import { signal, effect, batch, type Signal } from '@philjs/core';
import { detectPlatform, nativeBridge } from '../runtime.js';
import type { ViewStyle } from '../styles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Keyboard behavior modes
 */
export type KeyboardBehavior = 'height' | 'position' | 'padding';

/**
 * KeyboardAvoidingView props
 */
export interface KeyboardAvoidingViewProps {
  /**
   * Children elements
   */
  children?: any;

  /**
   * How the view should adjust
   * - 'height': Adjusts the height of the view
   * - 'position': Moves the view up
   * - 'padding': Adds padding to the bottom
   */
  behavior?: KeyboardBehavior;

  /**
   * Content container style
   */
  contentContainerStyle?: ViewStyle;

  /**
   * Whether keyboard avoiding is enabled
   */
  enabled?: boolean;

  /**
   * Extra offset to add to keyboard height
   */
  keyboardVerticalOffset?: number;

  /**
   * Style for the view
   */
  style?: ViewStyle;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Keyboard info
 */
export interface KeyboardInfo {
  isVisible: boolean;
  height: number;
  duration: number;
  easing: string;
}

// ============================================================================
// State
// ============================================================================

/**
 * Global keyboard state
 */
export const keyboardState: Signal<KeyboardInfo> = signal<KeyboardInfo>({
  isVisible: false,
  height: 0,
  duration: 250,
  easing: 'easeOut',
});

/**
 * Initialize keyboard listeners
 */
let keyboardListenersInitialized = false;

function initKeyboardListeners(): void {
  if (keyboardListenersInitialized) return;
  if (typeof window === 'undefined') return;

  keyboardListenersInitialized = true;

  // Use visualViewport API for better keyboard detection
  if (window.visualViewport) {
    const updateKeyboardHeight = () => {
      const viewport = window.visualViewport!;
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const keyboardHeight = windowHeight - viewportHeight;

      keyboardState.set({
        isVisible: keyboardHeight > 100,
        height: keyboardHeight > 100 ? keyboardHeight : 0,
        duration: 250,
        easing: 'easeOut',
      });
    };

    window.visualViewport.addEventListener('resize', updateKeyboardHeight);
    window.visualViewport.addEventListener('scroll', updateKeyboardHeight);
  } else {
    // Fallback for browsers without visualViewport
    let initialHeight = window.innerHeight;

    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const diff = initialHeight - currentHeight;

      if (diff > 100) {
        keyboardState.set({
          isVisible: true,
          height: diff,
          duration: 250,
          easing: 'easeOut',
        });
      } else {
        keyboardState.set({
          isVisible: false,
          height: 0,
          duration: 250,
          easing: 'easeOut',
        });
      }
    });

    // Detect focus on input elements
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Virtual keyboard will show - estimate height
        setTimeout(() => {
          const currentHeight = window.innerHeight;
          if (initialHeight - currentHeight > 100) {
            keyboardState.set({
              isVisible: true,
              height: initialHeight - currentHeight,
              duration: 250,
              easing: 'easeOut',
            });
          }
        }, 100);
      }
    });

    document.addEventListener('focusout', () => {
      setTimeout(() => {
        keyboardState.set({
          isVisible: false,
          height: 0,
          duration: 250,
          easing: 'easeOut',
        });
      }, 100);
    });
  }
}

// ============================================================================
// KeyboardAvoidingView Component
// ============================================================================

/**
 * Create a KeyboardAvoidingView component
 */
export function KeyboardAvoidingView(props: KeyboardAvoidingViewProps): any {
  const platform = detectPlatform();
  const enabled = props.enabled ?? true;
  const behavior = props.behavior ?? (platform === 'ios' ? 'padding' : 'height');
  const keyboardVerticalOffset = props.keyboardVerticalOffset ?? 0;

  // Initialize keyboard listeners
  if (platform === 'web') {
    initKeyboardListeners();
  }

  if (platform === 'web') {
    return renderWebKeyboardAvoidingView(props, behavior, keyboardVerticalOffset, enabled);
  }

  // Return native element descriptor
  return {
    type: 'NativeKeyboardAvoidingView',
    props: {
      behavior,
      enabled,
      keyboardVerticalOffset,
      style: props.style,
      contentContainerStyle: props.contentContainerStyle,
      testID: props.testID,
    },
    children: props.children,
  };
}

/**
 * Render KeyboardAvoidingView for web
 */
function renderWebKeyboardAvoidingView(
  props: KeyboardAvoidingViewProps,
  behavior: KeyboardBehavior,
  keyboardVerticalOffset: number,
  enabled: boolean
): any {
  const keyboard = keyboardState();
  const offset = enabled && keyboard.isVisible
    ? keyboard.height + keyboardVerticalOffset
    : 0;

  let containerStyle: Record<string, any> = {
    flex: 1,
    ...convertStyle(props.style || {}),
    transition: `all ${keyboard.duration}ms ease-out`,
  };

  if (enabled && keyboard.isVisible) {
    switch (behavior) {
      case 'height':
        containerStyle['height'] = `calc(100% - ${offset}px)`;
        break;
      case 'position':
        containerStyle['transform'] = `translateY(-${offset}px)`;
        break;
      case 'padding':
        containerStyle['paddingBottom'] = `${offset}px`;
        break;
    }
  }

  return {
    type: 'div',
    props: {
      style: containerStyle,
      'data-testid': props.testID,
    },
    children: props.children,
  };
}

/**
 * Convert style to CSS format
 */
function convertStyle(style: ViewStyle): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    const cssKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

    if (typeof value === 'number' && !['flex', 'opacity', 'zIndex'].includes(key)) {
      result[cssKey] = `${value}px`;
    } else {
      result[cssKey] = String(value);
    }
  }

  return result;
}

// ============================================================================
// Keyboard Hooks
// ============================================================================

/**
 * Hook to listen for keyboard events
 */
export function useKeyboard(): {
  isVisible: boolean;
  height: number;
  dismiss: () => void;
} {
  const keyboard = keyboardState();

  const dismiss = () => {
    if (typeof document !== 'undefined') {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    }

    const platform = detectPlatform();
    if (platform !== 'web') {
      nativeBridge.call('Keyboard', 'dismiss');
    }
  };

  return {
    isVisible: keyboard.isVisible,
    height: keyboard.height,
    dismiss,
  };
}

/**
 * Hook to run effect when keyboard shows/hides
 */
export function useKeyboardEffect(
  onShow?: (height: number) => void,
  onHide?: () => void
): void {
  effect(() => {
    const keyboard = keyboardState();

    if (keyboard.isVisible && onShow) {
      onShow(keyboard.height);
    } else if (!keyboard.isVisible && onHide) {
      onHide();
    }
  });
}

// ============================================================================
// Keyboard API
// ============================================================================

/**
 * Keyboard API singleton
 */
export const Keyboard = {
  /**
   * Dismiss the keyboard
   */
  dismiss(): void {
    const platform = detectPlatform();

    if (platform === 'web') {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    } else {
      nativeBridge.call('Keyboard', 'dismiss');
    }
  },

  /**
   * Add keyboard show listener
   */
  addListener(
    event: 'keyboardWillShow' | 'keyboardDidShow' | 'keyboardWillHide' | 'keyboardDidHide',
    callback: (info: KeyboardInfo) => void
  ): { remove: () => void } {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Web uses effect on keyboardState
      const cleanup = effect(() => {
        const keyboard = keyboardState();

        if (event.includes('Show') && keyboard.isVisible) {
          callback(keyboard);
        } else if (event.includes('Hide') && !keyboard.isVisible) {
          callback(keyboard);
        }
      });

      return { remove: cleanup };
    }

    // Native event listener
    return {
      remove: () => {
        // Would remove native listener
      },
    };
  },

  /**
   * Schedule layout animation for keyboard
   */
  scheduleLayoutAnimation(duration: number): void {
    const platform = detectPlatform();

    if (platform !== 'web') {
      nativeBridge.call('Keyboard', 'scheduleLayoutAnimation', duration);
    }
  },

  /**
   * Get current keyboard state
   */
  getState(): KeyboardInfo {
    return keyboardState();
  },
};

// ============================================================================
// Dismiss Keyboard Wrapper
// ============================================================================

/**
 * DismissKeyboard props
 */
export interface DismissKeyboardProps {
  children: any;
  onDismiss?: () => void;
}

/**
 * Wrapper component that dismisses keyboard on tap
 */
export function DismissKeyboard(props: DismissKeyboardProps): any {
  const platform = detectPlatform();

  const handlePress = () => {
    Keyboard.dismiss();
    props.onDismiss?.();
  };

  if (platform === 'web') {
    return {
      type: 'div',
      props: {
        style: { flex: 1 },
        onClick: handlePress,
      },
      children: props.children,
    };
  }

  return {
    type: 'TouchableWithoutFeedback',
    props: {
      onPress: handlePress,
    },
    children: props.children,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default KeyboardAvoidingView;
