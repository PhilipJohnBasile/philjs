/**
 * PhilJS Native - Capacitor Haptics Plugin
 *
 * Provides haptic feedback for touch interactions with
 * support for impact, notification, and selection feedback.
 */
import { isNativePlatform, callPlugin, registerPlugin, } from '../index.js';
// ============================================================================
// Web Implementation
// ============================================================================
/**
 * Web haptics using Vibration API
 */
const WebHaptics = {
    async impact(options) {
        if (!this.isSupported())
            return;
        const patterns = {
            light: 10,
            medium: 20,
            heavy: 30,
            soft: 5,
            rigid: 40,
        };
        navigator.vibrate(patterns[options.style] || 20);
    },
    async notification(options) {
        if (!this.isSupported())
            return;
        const patterns = {
            success: [10, 50, 10],
            warning: [10, 50, 10, 50, 10],
            error: [50, 100, 50],
        };
        navigator.vibrate(patterns[options.type] || [20]);
    },
    async selectionStart() {
        if (!this.isSupported())
            return;
        navigator.vibrate(5);
    },
    async selectionChanged() {
        if (!this.isSupported())
            return;
        navigator.vibrate(3);
    },
    async selectionEnd() {
        if (!this.isSupported())
            return;
        navigator.vibrate(5);
    },
    async vibrate(options) {
        if (!this.isSupported())
            return;
        navigator.vibrate(options?.duration || 300);
    },
    isSupported() {
        return typeof navigator !== 'undefined' && 'vibrate' in navigator;
    },
};
// ============================================================================
// Haptics API
// ============================================================================
registerPlugin('Haptics', { web: WebHaptics });
/**
 * Haptics API
 */
export const CapacitorHaptics = {
    /**
     * Trigger impact haptic feedback
     */
    async impact(options = { style: 'medium' }) {
        if (!isNativePlatform()) {
            return WebHaptics.impact(options);
        }
        try {
            await callPlugin('Haptics', 'impact', options);
        }
        catch {
            // Ignore if haptics not available
        }
    },
    /**
     * Trigger notification haptic feedback
     */
    async notification(options = { type: 'success' }) {
        if (!isNativePlatform()) {
            return WebHaptics.notification(options);
        }
        try {
            await callPlugin('Haptics', 'notification', options);
        }
        catch {
            // Ignore if haptics not available
        }
    },
    /**
     * Start selection haptic feedback
     */
    async selectionStart() {
        if (!isNativePlatform()) {
            return WebHaptics.selectionStart();
        }
        try {
            await callPlugin('Haptics', 'selectionStart');
        }
        catch {
            // Ignore if haptics not available
        }
    },
    /**
     * Trigger selection changed haptic feedback
     */
    async selectionChanged() {
        if (!isNativePlatform()) {
            return WebHaptics.selectionChanged();
        }
        try {
            await callPlugin('Haptics', 'selectionChanged');
        }
        catch {
            // Ignore if haptics not available
        }
    },
    /**
     * End selection haptic feedback
     */
    async selectionEnd() {
        if (!isNativePlatform()) {
            return WebHaptics.selectionEnd();
        }
        try {
            await callPlugin('Haptics', 'selectionEnd');
        }
        catch {
            // Ignore if haptics not available
        }
    },
    /**
     * Trigger vibration
     */
    async vibrate(options) {
        if (!isNativePlatform()) {
            return WebHaptics.vibrate(options);
        }
        try {
            await callPlugin('Haptics', 'vibrate', options);
        }
        catch {
            // Ignore if haptics not available
        }
    },
    /**
     * Check if haptics is supported
     */
    isSupported() {
        if (!isNativePlatform()) {
            return WebHaptics.isSupported();
        }
        return true; // Native platforms always support haptics
    },
};
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Light impact feedback
 */
export async function impactLight() {
    return CapacitorHaptics.impact({ style: 'light' });
}
/**
 * Medium impact feedback
 */
export async function impactMedium() {
    return CapacitorHaptics.impact({ style: 'medium' });
}
/**
 * Heavy impact feedback
 */
export async function impactHeavy() {
    return CapacitorHaptics.impact({ style: 'heavy' });
}
/**
 * Soft impact feedback
 */
export async function impactSoft() {
    return CapacitorHaptics.impact({ style: 'soft' });
}
/**
 * Rigid impact feedback
 */
export async function impactRigid() {
    return CapacitorHaptics.impact({ style: 'rigid' });
}
/**
 * Success notification feedback
 */
export async function notifySuccess() {
    return CapacitorHaptics.notification({ type: 'success' });
}
/**
 * Warning notification feedback
 */
export async function notifyWarning() {
    return CapacitorHaptics.notification({ type: 'warning' });
}
/**
 * Error notification feedback
 */
export async function notifyError() {
    return CapacitorHaptics.notification({ type: 'error' });
}
/**
 * Selection feedback
 */
export async function selectionFeedback() {
    return CapacitorHaptics.selectionChanged();
}
// ============================================================================
// Haptic Patterns
// ============================================================================
/**
 * Predefined haptic patterns
 */
export const HapticPatterns = {
    /**
     * Tap pattern - single light tap
     */
    async tap() {
        await impactLight();
    },
    /**
     * Double tap pattern
     */
    async doubleTap() {
        await impactLight();
        await new Promise((resolve) => setTimeout(resolve, 100));
        await impactLight();
    },
    /**
     * Long press pattern
     */
    async longPress() {
        await impactMedium();
        await new Promise((resolve) => setTimeout(resolve, 50));
        await impactLight();
    },
    /**
     * Swipe pattern
     */
    async swipe() {
        await impactLight();
    },
    /**
     * Pull to refresh pattern
     */
    async pullToRefresh() {
        await impactMedium();
    },
    /**
     * Toggle on pattern
     */
    async toggleOn() {
        await impactMedium();
    },
    /**
     * Toggle off pattern
     */
    async toggleOff() {
        await impactLight();
    },
    /**
     * Slider change pattern
     */
    async sliderChange() {
        await CapacitorHaptics.selectionChanged();
    },
    /**
     * Picker selection pattern
     */
    async pickerSelect() {
        await CapacitorHaptics.selectionChanged();
    },
    /**
     * Keyboard tap pattern
     */
    async keyboardTap() {
        await impactLight();
    },
    /**
     * Delete confirmation pattern
     */
    async deleteConfirm() {
        await notifyWarning();
    },
    /**
     * Payment success pattern
     */
    async paymentSuccess() {
        await notifySuccess();
        await new Promise((resolve) => setTimeout(resolve, 150));
        await impactMedium();
    },
    /**
     * Custom pattern with sequence
     */
    async custom(pattern) {
        for (const step of pattern) {
            if (step.type === 'impact') {
                await CapacitorHaptics.impact({ style: step.style || 'medium' });
            }
            else if (step.type === 'notification') {
                await CapacitorHaptics.notification({ type: step.notificationType || 'success' });
            }
            if (step.delay) {
                await new Promise((resolve) => setTimeout(resolve, step.delay));
            }
        }
    },
};
// ============================================================================
// Exports
// ============================================================================
export default CapacitorHaptics;
//# sourceMappingURL=haptics.js.map