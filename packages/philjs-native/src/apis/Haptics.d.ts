/**
 * Haptics API
 *
 * Haptic feedback for tactile responses.
 */
/**
 * Impact feedback style
 */
export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
/**
 * Notification feedback type
 */
export type NotificationType = 'success' | 'warning' | 'error';
/**
 * Haptics API singleton
 */
export declare const Haptics: {
    /**
     * Check if haptics are supported
     */
    isSupported(): boolean;
    /**
     * Trigger impact feedback
     */
    impact(style?: ImpactStyle): Promise<void>;
    /**
     * Trigger notification feedback
     */
    notification(type?: NotificationType): Promise<void>;
    /**
     * Trigger selection feedback
     */
    selection(): Promise<void>;
    /**
     * Vibrate with custom pattern
     */
    vibrate(pattern: number | number[]): Promise<void>;
    /**
     * Cancel any ongoing vibration
     */
    cancel(): Promise<void>;
};
/**
 * Light impact
 */
export declare const impactLight: () => Promise<void>;
/**
 * Medium impact
 */
export declare const impactMedium: () => Promise<void>;
/**
 * Heavy impact
 */
export declare const impactHeavy: () => Promise<void>;
/**
 * Success notification
 */
export declare const notifySuccess: () => Promise<void>;
/**
 * Warning notification
 */
export declare const notifyWarning: () => Promise<void>;
/**
 * Error notification
 */
export declare const notifyError: () => Promise<void>;
/**
 * Selection feedback
 */
export declare const selectionFeedback: () => Promise<void>;
export default Haptics;
//# sourceMappingURL=Haptics.d.ts.map