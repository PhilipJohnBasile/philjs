/**
 * AccessibilityInfo API
 *
 * Query and monitor accessibility settings and screen reader status.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { Platform } from '../platform/Platform.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Accessibility info state
 */
export interface AccessibilityState {
  /**
   * Whether a screen reader is enabled
   */
  screenReaderEnabled: boolean;

  /**
   * Whether reduce motion is enabled
   */
  reduceMotionEnabled: boolean;

  /**
   * Whether reduce transparency is enabled
   */
  reduceTransparencyEnabled: boolean;

  /**
   * Whether bold text is enabled (iOS)
   */
  boldTextEnabled: boolean;

  /**
   * Whether grayscale is enabled
   */
  grayscaleEnabled: boolean;

  /**
   * Whether invert colors is enabled
   */
  invertColorsEnabled: boolean;

  /**
   * Whether high contrast is enabled
   */
  highContrastEnabled: boolean;

  /**
   * Whether closed captioning is enabled
   */
  closedCaptioningEnabled: boolean;

  /**
   * Whether audio descriptions are enabled
   */
  audioDescriptionEnabled: boolean;
}

/**
 * Accessibility event type
 */
export type AccessibilityEventType =
  | 'screenReaderChanged'
  | 'reduceMotionChanged'
  | 'reduceTransparencyChanged'
  | 'boldTextChanged'
  | 'grayscaleChanged'
  | 'invertColorsChanged'
  | 'announcementFinished';

/**
 * Announcement options
 */
export interface AnnouncementOptions {
  /**
   * Whether the announcement should interrupt current speech
   */
  queue?: boolean;

  /**
   * Callback when announcement finishes
   */
  onComplete?: (success: boolean) => void;
}

/**
 * Accessibility event handler
 */
export type AccessibilityEventHandler = (enabled: boolean) => void;

// ============================================================================
// Initial State
// ============================================================================

/**
 * Get initial accessibility state
 */
function getInitialState(): AccessibilityState {
  if (typeof window === 'undefined') {
    return {
      screenReaderEnabled: false,
      reduceMotionEnabled: false,
      reduceTransparencyEnabled: false,
      boldTextEnabled: false,
      grayscaleEnabled: false,
      invertColorsEnabled: false,
      highContrastEnabled: false,
      closedCaptioningEnabled: false,
      audioDescriptionEnabled: false,
    };
  }

  return {
    screenReaderEnabled: detectScreenReader(),
    reduceMotionEnabled: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    reduceTransparencyEnabled: window.matchMedia('(prefers-reduced-transparency: reduce)').matches,
    boldTextEnabled: false, // Cannot detect on web
    grayscaleEnabled: false, // Cannot detect on web
    invertColorsEnabled: window.matchMedia('(inverted-colors: inverted)').matches,
    highContrastEnabled:
      window.matchMedia('(forced-colors: active)').matches ||
      window.matchMedia('(prefers-contrast: more)').matches,
    closedCaptioningEnabled: false, // Cannot detect on web
    audioDescriptionEnabled: false, // Cannot detect on web
  };
}

/**
 * Detect if a screen reader is likely running
 */
function detectScreenReader(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for common screen reader indicators
  // Note: This is not 100% reliable but provides a reasonable heuristic

  // Check for touch exploration (TalkBack, VoiceOver)
  if ('ontouchstart' in window && window.navigator.maxTouchPoints > 0) {
    // Check for accessibility events
    const testElement = document.createElement('div');
    testElement.setAttribute('role', 'button');
    testElement.setAttribute('tabindex', '0');

    // NVDA/JAWS add specific attributes
    if (document.body.hasAttribute('data-at-shortcutkeys')) {
      return true;
    }
  }

  // Check for forced colors mode (often used with screen readers)
  if (window.matchMedia('(forced-colors: active)').matches) {
    return true;
  }

  // Check for native bridge info
  if ((globalThis as any).__PHILJS_SCREEN_READER_ENABLED__) {
    return true;
  }

  return false;
}

// ============================================================================
// State
// ============================================================================

/**
 * Accessibility state signal
 */
const accessibilityState: Signal<AccessibilityState> = signal(getInitialState());

/**
 * Event subscribers
 */
const eventSubscribers = new Map<AccessibilityEventType, Set<AccessibilityEventHandler>>();

// ============================================================================
// Event Handling
// ============================================================================

/**
 * Notify subscribers of an event
 */
function notifySubscribers(event: AccessibilityEventType, value: boolean): void {
  const handlers = eventSubscribers.get(event);
  handlers?.forEach(handler => {
    try {
      handler(value);
    } catch (error) {
      console.error(`Error in accessibility event handler for ${event}:`, error);
    }
  });
}

/**
 * Update state and notify
 */
function updateState(updates: Partial<AccessibilityState>): void {
  const current = accessibilityState();
  accessibilityState.set({ ...current, ...updates });

  // Notify specific event handlers
  for (const [key, value] of Object.entries(updates)) {
    const eventMap: Record<string, AccessibilityEventType> = {
      screenReaderEnabled: 'screenReaderChanged',
      reduceMotionEnabled: 'reduceMotionChanged',
      reduceTransparencyEnabled: 'reduceTransparencyChanged',
      boldTextEnabled: 'boldTextChanged',
      grayscaleEnabled: 'grayscaleChanged',
      invertColorsEnabled: 'invertColorsChanged',
    };

    const eventType = eventMap[key];
    if (eventType && value !== current[key as keyof AccessibilityState]) {
      notifySubscribers(eventType, value as boolean);
    }
  }
}

// Set up web listeners
if (typeof window !== 'undefined') {
  // Reduce motion
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    updateState({ reduceMotionEnabled: e.matches });
  });

  // Reduce transparency
  window.matchMedia('(prefers-reduced-transparency: reduce)').addEventListener('change', (e) => {
    updateState({ reduceTransparencyEnabled: e.matches });
  });

  // Invert colors
  window.matchMedia('(inverted-colors: inverted)').addEventListener('change', (e) => {
    updateState({ invertColorsEnabled: e.matches });
  });

  // High contrast
  window.matchMedia('(forced-colors: active)').addEventListener('change', (e) => {
    updateState({ highContrastEnabled: e.matches });
  });

  window.matchMedia('(prefers-contrast: more)').addEventListener('change', (e) => {
    if (!window.matchMedia('(forced-colors: active)').matches) {
      updateState({ highContrastEnabled: e.matches });
    }
  });
}

// ============================================================================
// AccessibilityInfo API
// ============================================================================

/**
 * AccessibilityInfo API
 */
export const AccessibilityInfo = {
  /**
   * Query if a screen reader is enabled
   */
  isScreenReaderEnabled(): Promise<boolean> {
    return Promise.resolve(accessibilityState().screenReaderEnabled);
  },

  /**
   * Query if reduce motion is enabled
   */
  isReduceMotionEnabled(): Promise<boolean> {
    return Promise.resolve(accessibilityState().reduceMotionEnabled);
  },

  /**
   * Query if reduce transparency is enabled
   */
  isReduceTransparencyEnabled(): Promise<boolean> {
    return Promise.resolve(accessibilityState().reduceTransparencyEnabled);
  },

  /**
   * Query if bold text is enabled (iOS only)
   */
  isBoldTextEnabled(): Promise<boolean> {
    return Promise.resolve(accessibilityState().boldTextEnabled);
  },

  /**
   * Query if grayscale is enabled
   */
  isGrayscaleEnabled(): Promise<boolean> {
    return Promise.resolve(accessibilityState().grayscaleEnabled);
  },

  /**
   * Query if invert colors is enabled
   */
  isInvertColorsEnabled(): Promise<boolean> {
    return Promise.resolve(accessibilityState().invertColorsEnabled);
  },

  /**
   * Query if closed captioning is enabled
   */
  isClosedCaptioningEnabled(): Promise<boolean> {
    return Promise.resolve(accessibilityState().closedCaptioningEnabled);
  },

  /**
   * Add an event listener
   */
  addEventListener(
    eventType: AccessibilityEventType,
    handler: AccessibilityEventHandler
  ): { remove: () => void } {
    if (!eventSubscribers.has(eventType)) {
      eventSubscribers.set(eventType, new Set());
    }
    eventSubscribers.get(eventType)!.add(handler);

    return {
      remove: () => {
        eventSubscribers.get(eventType)?.delete(handler);
      },
    };
  },

  /**
   * Remove an event listener
   */
  removeEventListener(
    eventType: AccessibilityEventType,
    handler: AccessibilityEventHandler
  ): void {
    eventSubscribers.get(eventType)?.delete(handler);
  },

  /**
   * Announce a message to the screen reader
   */
  announceForAccessibility(message: string, options?: AnnouncementOptions): void {
    if (typeof document === 'undefined') {
      options?.onComplete?.(false);
      return;
    }

    // Create or get the announcer element
    let announcer = document.getElementById('philjs-a11y-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'philjs-a11y-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', options?.queue ? 'polite' : 'assertive');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(announcer);
    }

    // Clear and set the message
    announcer.textContent = '';

    // Small delay to ensure the change is detected
    requestAnimationFrame(() => {
      announcer!.textContent = message;

      // Callback after a reasonable time for announcement
      setTimeout(() => {
        options?.onComplete?.(true);
      }, message.length * 50 + 500);
    });
  },

  /**
   * Set the accessibility focus to an element
   */
  setAccessibilityFocus(element: HTMLElement | null): void {
    if (!element) return;

    // Ensure the element is focusable
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex === null) {
      element.setAttribute('tabindex', '-1');
    }

    element.focus();

    // Announce the element if it has an accessible name
    const accessibleName =
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent;

    if (accessibleName) {
      this.announceForAccessibility(accessibleName, { queue: true });
    }
  },

  /**
   * Get recommended timeout multiplier for accessibility
   */
  getRecommendedTimeoutMillis(timeout: number): Promise<number> {
    const state = accessibilityState();

    // Increase timeouts when screen reader or reduce motion is enabled
    let multiplier = 1;

    if (state.screenReaderEnabled) {
      multiplier = 3;
    } else if (state.reduceMotionEnabled) {
      multiplier = 2;
    }

    return Promise.resolve(timeout * multiplier);
  },

  /**
   * Send an accessibility event (native only)
   */
  sendAccessibilityEvent(eventType: string): void {
    // On native, this would trigger platform-specific events
    if (Platform.isNative) {
      // Would call native bridge
      console.log('[AccessibilityInfo] sendAccessibilityEvent:', eventType);
    }
  },

  /**
   * Post notification (iOS) or send event (Android)
   */
  postNotification(
    notification: 'screen' | 'layout' | 'announcement' | 'pageScrolled',
    params?: any
  ): void {
    // On native, this would trigger platform-specific notifications
    if (Platform.isNative) {
      console.log('[AccessibilityInfo] postNotification:', notification, params);
    }
  },
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get accessibility state
 */
export function useAccessibilityState(): AccessibilityState {
  return accessibilityState();
}

/**
 * Hook to check if screen reader is enabled
 */
export function useScreenReader(): boolean {
  return accessibilityState().screenReaderEnabled;
}

/**
 * Hook to check if reduce motion is enabled
 */
export function useReduceMotion(): boolean {
  return accessibilityState().reduceMotionEnabled;
}

/**
 * Hook to check if high contrast is enabled
 */
export function useHighContrast(): boolean {
  return accessibilityState().highContrastEnabled;
}

// ============================================================================
// Signals
// ============================================================================

/**
 * Screen reader enabled signal
 */
export const screenReaderEnabled: Signal<boolean> = signal(
  accessibilityState().screenReaderEnabled
);

/**
 * Reduce motion enabled signal
 */
export const reduceMotionEnabled: Signal<boolean> = signal(
  accessibilityState().reduceMotionEnabled
);

/**
 * High contrast enabled signal
 */
export const highContrastEnabled: Signal<boolean> = signal(
  accessibilityState().highContrastEnabled
);

// Keep signals in sync
effect(() => {
  const state = accessibilityState();
  screenReaderEnabled.set(state.screenReaderEnabled);
  reduceMotionEnabled.set(state.reduceMotionEnabled);
  highContrastEnabled.set(state.highContrastEnabled);
});

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get accessible duration based on reduce motion preference
 */
export function getAccessibleDuration(normalDuration: number): number {
  return accessibilityState().reduceMotionEnabled ? 0 : normalDuration;
}

/**
 * Get accessible animation based on reduce motion preference
 */
export function getAccessibleAnimation<T>(
  normal: T,
  reduced: T
): T {
  return accessibilityState().reduceMotionEnabled ? reduced : normal;
}

/**
 * Create an accessibility-aware timeout
 */
export async function accessibleTimeout(
  callback: () => void,
  normalDelay: number
): Promise<void> {
  const delay = await AccessibilityInfo.getRecommendedTimeoutMillis(normalDelay);
  return new Promise(resolve => {
    setTimeout(() => {
      callback();
      resolve();
    }, delay);
  });
}

export default AccessibilityInfo;
