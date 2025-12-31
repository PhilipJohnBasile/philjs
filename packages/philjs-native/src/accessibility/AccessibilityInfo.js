/**
 * AccessibilityInfo API
 *
 * Query and monitor accessibility settings and screen reader status.
 */
import { signal, effect } from 'philjs-core';
import { Platform } from '../platform/Platform.js';
// ============================================================================
// Initial State
// ============================================================================
/**
 * Get initial accessibility state
 */
function getInitialState() {
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
        highContrastEnabled: window.matchMedia('(forced-colors: active)').matches ||
            window.matchMedia('(prefers-contrast: more)').matches,
        closedCaptioningEnabled: false, // Cannot detect on web
        audioDescriptionEnabled: false, // Cannot detect on web
    };
}
/**
 * Detect if a screen reader is likely running
 */
function detectScreenReader() {
    if (typeof window === 'undefined')
        return false;
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
    if (globalThis.__PHILJS_SCREEN_READER_ENABLED__) {
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
const accessibilityState = signal(getInitialState());
/**
 * Event subscribers
 */
const eventSubscribers = new Map();
// ============================================================================
// Event Handling
// ============================================================================
/**
 * Notify subscribers of an event
 */
function notifySubscribers(event, value) {
    const handlers = eventSubscribers.get(event);
    handlers?.forEach(handler => {
        try {
            handler(value);
        }
        catch (error) {
            console.error(`Error in accessibility event handler for ${event}:`, error);
        }
    });
}
/**
 * Update state and notify
 */
function updateState(updates) {
    const current = accessibilityState();
    accessibilityState.set({ ...current, ...updates });
    // Notify specific event handlers
    for (const [key, value] of Object.entries(updates)) {
        const eventMap = {
            screenReaderEnabled: 'screenReaderChanged',
            reduceMotionEnabled: 'reduceMotionChanged',
            reduceTransparencyEnabled: 'reduceTransparencyChanged',
            boldTextEnabled: 'boldTextChanged',
            grayscaleEnabled: 'grayscaleChanged',
            invertColorsEnabled: 'invertColorsChanged',
        };
        const eventType = eventMap[key];
        if (eventType && value !== current[key]) {
            notifySubscribers(eventType, value);
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
    isScreenReaderEnabled() {
        return Promise.resolve(accessibilityState().screenReaderEnabled);
    },
    /**
     * Query if reduce motion is enabled
     */
    isReduceMotionEnabled() {
        return Promise.resolve(accessibilityState().reduceMotionEnabled);
    },
    /**
     * Query if reduce transparency is enabled
     */
    isReduceTransparencyEnabled() {
        return Promise.resolve(accessibilityState().reduceTransparencyEnabled);
    },
    /**
     * Query if bold text is enabled (iOS only)
     */
    isBoldTextEnabled() {
        return Promise.resolve(accessibilityState().boldTextEnabled);
    },
    /**
     * Query if grayscale is enabled
     */
    isGrayscaleEnabled() {
        return Promise.resolve(accessibilityState().grayscaleEnabled);
    },
    /**
     * Query if invert colors is enabled
     */
    isInvertColorsEnabled() {
        return Promise.resolve(accessibilityState().invertColorsEnabled);
    },
    /**
     * Query if closed captioning is enabled
     */
    isClosedCaptioningEnabled() {
        return Promise.resolve(accessibilityState().closedCaptioningEnabled);
    },
    /**
     * Add an event listener
     */
    addEventListener(eventType, handler) {
        if (!eventSubscribers.has(eventType)) {
            eventSubscribers.set(eventType, new Set());
        }
        eventSubscribers.get(eventType).add(handler);
        return {
            remove: () => {
                eventSubscribers.get(eventType)?.delete(handler);
            },
        };
    },
    /**
     * Remove an event listener
     */
    removeEventListener(eventType, handler) {
        eventSubscribers.get(eventType)?.delete(handler);
    },
    /**
     * Announce a message to the screen reader
     */
    announceForAccessibility(message, options) {
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
            announcer.textContent = message;
            // Callback after a reasonable time for announcement
            setTimeout(() => {
                options?.onComplete?.(true);
            }, message.length * 50 + 500);
        });
    },
    /**
     * Set the accessibility focus to an element
     */
    setAccessibilityFocus(element) {
        if (!element)
            return;
        // Ensure the element is focusable
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex === null) {
            element.setAttribute('tabindex', '-1');
        }
        element.focus();
        // Announce the element if it has an accessible name
        const accessibleName = element.getAttribute('aria-label') ||
            element.getAttribute('aria-labelledby') ||
            element.textContent;
        if (accessibleName) {
            this.announceForAccessibility(accessibleName, { queue: true });
        }
    },
    /**
     * Get recommended timeout multiplier for accessibility
     */
    getRecommendedTimeoutMillis(timeout) {
        const state = accessibilityState();
        // Increase timeouts when screen reader or reduce motion is enabled
        let multiplier = 1;
        if (state.screenReaderEnabled) {
            multiplier = 3;
        }
        else if (state.reduceMotionEnabled) {
            multiplier = 2;
        }
        return Promise.resolve(timeout * multiplier);
    },
    /**
     * Send an accessibility event (native only)
     */
    sendAccessibilityEvent(eventType) {
        // On native, this would trigger platform-specific events
        if (Platform.isNative) {
            // Would call native bridge
            console.log('[AccessibilityInfo] sendAccessibilityEvent:', eventType);
        }
    },
    /**
     * Post notification (iOS) or send event (Android)
     */
    postNotification(notification, params) {
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
export function useAccessibilityState() {
    return accessibilityState();
}
/**
 * Hook to check if screen reader is enabled
 */
export function useScreenReader() {
    return accessibilityState().screenReaderEnabled;
}
/**
 * Hook to check if reduce motion is enabled
 */
export function useReduceMotion() {
    return accessibilityState().reduceMotionEnabled;
}
/**
 * Hook to check if high contrast is enabled
 */
export function useHighContrast() {
    return accessibilityState().highContrastEnabled;
}
// ============================================================================
// Signals
// ============================================================================
/**
 * Screen reader enabled signal
 */
export const screenReaderEnabled = signal(accessibilityState().screenReaderEnabled);
/**
 * Reduce motion enabled signal
 */
export const reduceMotionEnabled = signal(accessibilityState().reduceMotionEnabled);
/**
 * High contrast enabled signal
 */
export const highContrastEnabled = signal(accessibilityState().highContrastEnabled);
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
export function getAccessibleDuration(normalDuration) {
    return accessibilityState().reduceMotionEnabled ? 0 : normalDuration;
}
/**
 * Get accessible animation based on reduce motion preference
 */
export function getAccessibleAnimation(normal, reduced) {
    return accessibilityState().reduceMotionEnabled ? reduced : normal;
}
/**
 * Create an accessibility-aware timeout
 */
export async function accessibleTimeout(callback, normalDelay) {
    const delay = await AccessibilityInfo.getRecommendedTimeoutMillis(normalDelay);
    return new Promise(resolve => {
        setTimeout(() => {
            callback();
            resolve();
        }, delay);
    });
}
export default AccessibilityInfo;
//# sourceMappingURL=AccessibilityInfo.js.map