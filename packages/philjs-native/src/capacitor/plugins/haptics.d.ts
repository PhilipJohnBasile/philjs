/**
 * PhilJS Native - Capacitor Haptics Plugin
 *
 * Provides haptic feedback for touch interactions with
 * support for impact, notification, and selection feedback.
 */
/**
 * Impact style for haptic feedback
 */
export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
/**
 * Notification type for haptic feedback
 */
export type NotificationType = 'success' | 'warning' | 'error';
/**
 * Haptic options
 */
export interface HapticImpactOptions {
    style: ImpactStyle;
}
export interface HapticNotificationOptions {
    type: NotificationType;
}
/**
 * Vibration pattern (for web fallback)
 */
export type VibrationPattern = number | number[];
/**
 * Haptics API
 */
export declare const CapacitorHaptics: {
    /**
     * Trigger impact haptic feedback
     */
    impact(options?: HapticImpactOptions): Promise<void>;
    /**
     * Trigger notification haptic feedback
     */
    notification(options?: HapticNotificationOptions): Promise<void>;
    /**
     * Start selection haptic feedback
     */
    selectionStart(): Promise<void>;
    /**
     * Trigger selection changed haptic feedback
     */
    selectionChanged(): Promise<void>;
    /**
     * End selection haptic feedback
     */
    selectionEnd(): Promise<void>;
    /**
     * Trigger vibration
     */
    vibrate(options?: {
        duration?: number;
    }): Promise<void>;
    /**
     * Check if haptics is supported
     */
    isSupported(): boolean;
};
/**
 * Light impact feedback
 */
export declare function impactLight(): Promise<void>;
/**
 * Medium impact feedback
 */
export declare function impactMedium(): Promise<void>;
/**
 * Heavy impact feedback
 */
export declare function impactHeavy(): Promise<void>;
/**
 * Soft impact feedback
 */
export declare function impactSoft(): Promise<void>;
/**
 * Rigid impact feedback
 */
export declare function impactRigid(): Promise<void>;
/**
 * Success notification feedback
 */
export declare function notifySuccess(): Promise<void>;
/**
 * Warning notification feedback
 */
export declare function notifyWarning(): Promise<void>;
/**
 * Error notification feedback
 */
export declare function notifyError(): Promise<void>;
/**
 * Selection feedback
 */
export declare function selectionFeedback(): Promise<void>;
/**
 * Predefined haptic patterns
 */
export declare const HapticPatterns: {
    /**
     * Tap pattern - single light tap
     */
    tap(): Promise<void>;
    /**
     * Double tap pattern
     */
    doubleTap(): Promise<void>;
    /**
     * Long press pattern
     */
    longPress(): Promise<void>;
    /**
     * Swipe pattern
     */
    swipe(): Promise<void>;
    /**
     * Pull to refresh pattern
     */
    pullToRefresh(): Promise<void>;
    /**
     * Toggle on pattern
     */
    toggleOn(): Promise<void>;
    /**
     * Toggle off pattern
     */
    toggleOff(): Promise<void>;
    /**
     * Slider change pattern
     */
    sliderChange(): Promise<void>;
    /**
     * Picker selection pattern
     */
    pickerSelect(): Promise<void>;
    /**
     * Keyboard tap pattern
     */
    keyboardTap(): Promise<void>;
    /**
     * Delete confirmation pattern
     */
    deleteConfirm(): Promise<void>;
    /**
     * Payment success pattern
     */
    paymentSuccess(): Promise<void>;
    /**
     * Custom pattern with sequence
     */
    custom(pattern: Array<{
        type: "impact" | "notification";
        style?: ImpactStyle;
        notificationType?: NotificationType;
        delay?: number;
    }>): Promise<void>;
};
export default CapacitorHaptics;
//# sourceMappingURL=haptics.d.ts.map