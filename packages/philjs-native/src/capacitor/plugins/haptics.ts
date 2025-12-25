/**
 * PhilJS Native - Capacitor Haptics Plugin
 *
 * Provides haptic feedback for touch interactions with
 * support for impact, notification, and selection feedback.
 */

import {
  isNativePlatform,
  callPlugin,
  registerPlugin,
} from '../index.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Web Implementation
// ============================================================================

/**
 * Web haptics using Vibration API
 */
const WebHaptics = {
  async impact(options: HapticImpactOptions): Promise<void> {
    if (!this.isSupported()) return;

    const patterns: Record<ImpactStyle, number> = {
      light: 10,
      medium: 20,
      heavy: 30,
      soft: 5,
      rigid: 40,
    };

    navigator.vibrate(patterns[options.style] || 20);
  },

  async notification(options: HapticNotificationOptions): Promise<void> {
    if (!this.isSupported()) return;

    const patterns: Record<NotificationType, number[]> = {
      success: [10, 50, 10],
      warning: [10, 50, 10, 50, 10],
      error: [50, 100, 50],
    };

    navigator.vibrate(patterns[options.type] || [20]);
  },

  async selectionStart(): Promise<void> {
    if (!this.isSupported()) return;
    navigator.vibrate(5);
  },

  async selectionChanged(): Promise<void> {
    if (!this.isSupported()) return;
    navigator.vibrate(3);
  },

  async selectionEnd(): Promise<void> {
    if (!this.isSupported()) return;
    navigator.vibrate(5);
  },

  async vibrate(options?: { duration?: number }): Promise<void> {
    if (!this.isSupported()) return;
    navigator.vibrate(options?.duration || 300);
  },

  isSupported(): boolean {
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
  async impact(options: HapticImpactOptions = { style: 'medium' }): Promise<void> {
    if (!isNativePlatform()) {
      return WebHaptics.impact(options);
    }

    try {
      await callPlugin<HapticImpactOptions, void>('Haptics', 'impact', options);
    } catch {
      // Ignore if haptics not available
    }
  },

  /**
   * Trigger notification haptic feedback
   */
  async notification(options: HapticNotificationOptions = { type: 'success' }): Promise<void> {
    if (!isNativePlatform()) {
      return WebHaptics.notification(options);
    }

    try {
      await callPlugin<HapticNotificationOptions, void>('Haptics', 'notification', options);
    } catch {
      // Ignore if haptics not available
    }
  },

  /**
   * Start selection haptic feedback
   */
  async selectionStart(): Promise<void> {
    if (!isNativePlatform()) {
      return WebHaptics.selectionStart();
    }

    try {
      await callPlugin('Haptics', 'selectionStart');
    } catch {
      // Ignore if haptics not available
    }
  },

  /**
   * Trigger selection changed haptic feedback
   */
  async selectionChanged(): Promise<void> {
    if (!isNativePlatform()) {
      return WebHaptics.selectionChanged();
    }

    try {
      await callPlugin('Haptics', 'selectionChanged');
    } catch {
      // Ignore if haptics not available
    }
  },

  /**
   * End selection haptic feedback
   */
  async selectionEnd(): Promise<void> {
    if (!isNativePlatform()) {
      return WebHaptics.selectionEnd();
    }

    try {
      await callPlugin('Haptics', 'selectionEnd');
    } catch {
      // Ignore if haptics not available
    }
  },

  /**
   * Trigger vibration
   */
  async vibrate(options?: { duration?: number }): Promise<void> {
    if (!isNativePlatform()) {
      return WebHaptics.vibrate(options);
    }

    try {
      await callPlugin('Haptics', 'vibrate', options);
    } catch {
      // Ignore if haptics not available
    }
  },

  /**
   * Check if haptics is supported
   */
  isSupported(): boolean {
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
export async function impactLight(): Promise<void> {
  return CapacitorHaptics.impact({ style: 'light' });
}

/**
 * Medium impact feedback
 */
export async function impactMedium(): Promise<void> {
  return CapacitorHaptics.impact({ style: 'medium' });
}

/**
 * Heavy impact feedback
 */
export async function impactHeavy(): Promise<void> {
  return CapacitorHaptics.impact({ style: 'heavy' });
}

/**
 * Soft impact feedback
 */
export async function impactSoft(): Promise<void> {
  return CapacitorHaptics.impact({ style: 'soft' });
}

/**
 * Rigid impact feedback
 */
export async function impactRigid(): Promise<void> {
  return CapacitorHaptics.impact({ style: 'rigid' });
}

/**
 * Success notification feedback
 */
export async function notifySuccess(): Promise<void> {
  return CapacitorHaptics.notification({ type: 'success' });
}

/**
 * Warning notification feedback
 */
export async function notifyWarning(): Promise<void> {
  return CapacitorHaptics.notification({ type: 'warning' });
}

/**
 * Error notification feedback
 */
export async function notifyError(): Promise<void> {
  return CapacitorHaptics.notification({ type: 'error' });
}

/**
 * Selection feedback
 */
export async function selectionFeedback(): Promise<void> {
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
  async tap(): Promise<void> {
    await impactLight();
  },

  /**
   * Double tap pattern
   */
  async doubleTap(): Promise<void> {
    await impactLight();
    await new Promise((resolve) => setTimeout(resolve, 100));
    await impactLight();
  },

  /**
   * Long press pattern
   */
  async longPress(): Promise<void> {
    await impactMedium();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await impactLight();
  },

  /**
   * Swipe pattern
   */
  async swipe(): Promise<void> {
    await impactLight();
  },

  /**
   * Pull to refresh pattern
   */
  async pullToRefresh(): Promise<void> {
    await impactMedium();
  },

  /**
   * Toggle on pattern
   */
  async toggleOn(): Promise<void> {
    await impactMedium();
  },

  /**
   * Toggle off pattern
   */
  async toggleOff(): Promise<void> {
    await impactLight();
  },

  /**
   * Slider change pattern
   */
  async sliderChange(): Promise<void> {
    await CapacitorHaptics.selectionChanged();
  },

  /**
   * Picker selection pattern
   */
  async pickerSelect(): Promise<void> {
    await CapacitorHaptics.selectionChanged();
  },

  /**
   * Keyboard tap pattern
   */
  async keyboardTap(): Promise<void> {
    await impactLight();
  },

  /**
   * Delete confirmation pattern
   */
  async deleteConfirm(): Promise<void> {
    await notifyWarning();
  },

  /**
   * Payment success pattern
   */
  async paymentSuccess(): Promise<void> {
    await notifySuccess();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await impactMedium();
  },

  /**
   * Custom pattern with sequence
   */
  async custom(
    pattern: Array<{ type: 'impact' | 'notification'; style?: ImpactStyle; notificationType?: NotificationType; delay?: number }>
  ): Promise<void> {
    for (const step of pattern) {
      if (step.type === 'impact') {
        await CapacitorHaptics.impact({ style: step.style || 'medium' });
      } else if (step.type === 'notification') {
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
