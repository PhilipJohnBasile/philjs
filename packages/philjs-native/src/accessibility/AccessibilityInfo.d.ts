/**
 * AccessibilityInfo API
 *
 * Query and monitor accessibility settings and screen reader status.
 */
import { type Signal } from 'philjs-core';
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
export type AccessibilityEventType = 'screenReaderChanged' | 'reduceMotionChanged' | 'reduceTransparencyChanged' | 'boldTextChanged' | 'grayscaleChanged' | 'invertColorsChanged' | 'announcementFinished';
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
/**
 * AccessibilityInfo API
 */
export declare const AccessibilityInfo: {
    /**
     * Query if a screen reader is enabled
     */
    isScreenReaderEnabled(): Promise<boolean>;
    /**
     * Query if reduce motion is enabled
     */
    isReduceMotionEnabled(): Promise<boolean>;
    /**
     * Query if reduce transparency is enabled
     */
    isReduceTransparencyEnabled(): Promise<boolean>;
    /**
     * Query if bold text is enabled (iOS only)
     */
    isBoldTextEnabled(): Promise<boolean>;
    /**
     * Query if grayscale is enabled
     */
    isGrayscaleEnabled(): Promise<boolean>;
    /**
     * Query if invert colors is enabled
     */
    isInvertColorsEnabled(): Promise<boolean>;
    /**
     * Query if closed captioning is enabled
     */
    isClosedCaptioningEnabled(): Promise<boolean>;
    /**
     * Add an event listener
     */
    addEventListener(eventType: AccessibilityEventType, handler: AccessibilityEventHandler): {
        remove: () => void;
    };
    /**
     * Remove an event listener
     */
    removeEventListener(eventType: AccessibilityEventType, handler: AccessibilityEventHandler): void;
    /**
     * Announce a message to the screen reader
     */
    announceForAccessibility(message: string, options?: AnnouncementOptions): void;
    /**
     * Set the accessibility focus to an element
     */
    setAccessibilityFocus(element: HTMLElement | null): void;
    /**
     * Get recommended timeout multiplier for accessibility
     */
    getRecommendedTimeoutMillis(timeout: number): Promise<number>;
    /**
     * Send an accessibility event (native only)
     */
    sendAccessibilityEvent(eventType: string): void;
    /**
     * Post notification (iOS) or send event (Android)
     */
    postNotification(notification: "screen" | "layout" | "announcement" | "pageScrolled", params?: any): void;
};
/**
 * Hook to get accessibility state
 */
export declare function useAccessibilityState(): AccessibilityState;
/**
 * Hook to check if screen reader is enabled
 */
export declare function useScreenReader(): boolean;
/**
 * Hook to check if reduce motion is enabled
 */
export declare function useReduceMotion(): boolean;
/**
 * Hook to check if high contrast is enabled
 */
export declare function useHighContrast(): boolean;
/**
 * Screen reader enabled signal
 */
export declare const screenReaderEnabled: Signal<boolean>;
/**
 * Reduce motion enabled signal
 */
export declare const reduceMotionEnabled: Signal<boolean>;
/**
 * High contrast enabled signal
 */
export declare const highContrastEnabled: Signal<boolean>;
/**
 * Get accessible duration based on reduce motion preference
 */
export declare function getAccessibleDuration(normalDuration: number): number;
/**
 * Get accessible animation based on reduce motion preference
 */
export declare function getAccessibleAnimation<T>(normal: T, reduced: T): T;
/**
 * Create an accessibility-aware timeout
 */
export declare function accessibleTimeout(callback: () => void, normalDelay: number): Promise<void>;
export default AccessibilityInfo;
//# sourceMappingURL=AccessibilityInfo.d.ts.map