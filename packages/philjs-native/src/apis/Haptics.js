/**
 * Haptics API
 *
 * Haptic feedback for tactile responses.
 */
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Haptics API
// ============================================================================
/**
 * Haptics API singleton
 */
export const Haptics = {
    /**
     * Check if haptics are supported
     */
    isSupported() {
        const platform = detectPlatform();
        if (platform === 'web') {
            return 'vibrate' in navigator;
        }
        return true; // Assume native supports haptics
    },
    /**
     * Trigger impact feedback
     */
    async impact(style = 'medium') {
        const platform = detectPlatform();
        if (platform === 'web') {
            if (!navigator.vibrate)
                return;
            const durations = {
                light: 10,
                medium: 20,
                heavy: 30,
                soft: 15,
                rigid: 25,
            };
            navigator.vibrate(durations[style]);
            return;
        }
        return nativeBridge.call('Haptics', 'impact', style);
    },
    /**
     * Trigger notification feedback
     */
    async notification(type = 'success') {
        const platform = detectPlatform();
        if (platform === 'web') {
            if (!navigator.vibrate)
                return;
            const patterns = {
                success: [10, 50, 10],
                warning: [20, 100, 20, 100, 20],
                error: [30, 100, 30],
            };
            navigator.vibrate(patterns[type]);
            return;
        }
        return nativeBridge.call('Haptics', 'notification', type);
    },
    /**
     * Trigger selection feedback
     */
    async selection() {
        const platform = detectPlatform();
        if (platform === 'web') {
            if (!navigator.vibrate)
                return;
            navigator.vibrate(5);
            return;
        }
        return nativeBridge.call('Haptics', 'selection');
    },
    /**
     * Vibrate with custom pattern
     */
    async vibrate(pattern) {
        const platform = detectPlatform();
        if (platform === 'web') {
            if (!navigator.vibrate)
                return;
            navigator.vibrate(pattern);
            return;
        }
        return nativeBridge.call('Haptics', 'vibrate', pattern);
    },
    /**
     * Cancel any ongoing vibration
     */
    async cancel() {
        const platform = detectPlatform();
        if (platform === 'web') {
            if (!navigator.vibrate)
                return;
            navigator.vibrate(0);
            return;
        }
        return nativeBridge.call('Haptics', 'cancel');
    },
};
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Light impact
 */
export const impactLight = () => Haptics.impact('light');
/**
 * Medium impact
 */
export const impactMedium = () => Haptics.impact('medium');
/**
 * Heavy impact
 */
export const impactHeavy = () => Haptics.impact('heavy');
/**
 * Success notification
 */
export const notifySuccess = () => Haptics.notification('success');
/**
 * Warning notification
 */
export const notifyWarning = () => Haptics.notification('warning');
/**
 * Error notification
 */
export const notifyError = () => Haptics.notification('error');
/**
 * Selection feedback
 */
export const selectionFeedback = () => Haptics.selection();
// ============================================================================
// Export
// ============================================================================
export default Haptics;
//# sourceMappingURL=Haptics.js.map