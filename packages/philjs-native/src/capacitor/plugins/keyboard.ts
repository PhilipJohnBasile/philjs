/**
 * PhilJS Native - Capacitor Keyboard Plugin
 *
 * Provides keyboard management for mobile apps including
 * show/hide control, height tracking, and scroll behavior.
 */

import { signal, effect, type Signal } from '@philjs/core';
import {
  isNativePlatform,
  callPlugin,
  registerPlugin,
  addLifecycleListener,
} from '../index.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Keyboard info
 */
export interface KeyboardInfo {
  keyboardHeight: number;
}

/**
 * Keyboard style (iOS)
 */
export type KeyboardStyle = 'dark' | 'light' | 'default';

/**
 * Keyboard resize mode
 */
export type KeyboardResizeMode = 'none' | 'body' | 'ionic' | 'native';

/**
 * Keyboard event
 */
export interface KeyboardEvent {
  keyboardHeight: number;
}

/**
 * Keyboard config
 */
export interface KeyboardConfig {
  resize?: KeyboardResizeMode;
  style?: KeyboardStyle;
  resizeOnFullScreen?: boolean;
}

// ============================================================================
// State
// ============================================================================

/**
 * Keyboard visibility state
 */
export const keyboardVisible: Signal<boolean> = signal(false);

/**
 * Keyboard height
 */
export const keyboardHeight: Signal<number> = signal(0);

/**
 * Keyboard event listeners
 */
type KeyboardEventCallback = (info: KeyboardInfo) => void;
const keyboardShowListeners = new Set<KeyboardEventCallback>();
const keyboardHideListeners = new Set<KeyboardEventCallback>();

// ============================================================================
// Web Implementation
// ============================================================================

/**
 * Web keyboard implementation using visualViewport API
 */
const WebKeyboard = {
  initialized: false,
  lastViewportHeight: 0,

  init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Use visualViewport API for mobile web keyboard detection
    if ('visualViewport' in window && window.visualViewport) {
      this.lastViewportHeight = window.visualViewport.height;

      window.visualViewport.addEventListener('resize', () => {
        const currentHeight = window.visualViewport!.height;
        const heightDiff = this.lastViewportHeight - currentHeight;

        if (heightDiff > 100) {
          // Keyboard shown
          const kbHeight = heightDiff;
          keyboardVisible.set(true);
          keyboardHeight.set(kbHeight);
          this.emitShow({ keyboardHeight: kbHeight });
        } else if (heightDiff < -100 || currentHeight >= window.innerHeight - 50) {
          // Keyboard hidden
          keyboardVisible.set(false);
          keyboardHeight.set(0);
          this.emitHide({ keyboardHeight: 0 });
        }

        this.lastViewportHeight = currentHeight;
      });
    }

    // Fallback: detect focus on input elements
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (this.isInputElement(target)) {
        // Estimate keyboard height for web
        const estimatedHeight = this.estimateKeyboardHeight();
        keyboardVisible.set(true);
        keyboardHeight.set(estimatedHeight);
        this.emitShow({ keyboardHeight: estimatedHeight });
      }
    });

    document.addEventListener('focusout', (e) => {
      const target = e.target as HTMLElement;
      if (this.isInputElement(target)) {
        // Small delay to handle focus transitions
        setTimeout(() => {
          if (!document.activeElement || !this.isInputElement(document.activeElement as HTMLElement)) {
            keyboardVisible.set(false);
            keyboardHeight.set(0);
            this.emitHide({ keyboardHeight: 0 });
          }
        }, 100);
      }
    });
  },

  isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      element.contentEditable === 'true'
    );
  },

  estimateKeyboardHeight(): number {
    // Estimate based on device and orientation
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isMobile) return 0;

    if (/iPhone/i.test(navigator.userAgent)) {
      return isLandscape ? 200 : 260;
    } else if (/iPad/i.test(navigator.userAgent)) {
      return isLandscape ? 350 : 264;
    } else if (/Android/i.test(navigator.userAgent)) {
      return isLandscape ? 200 : 280;
    }

    return 250;
  },

  emitShow(info: KeyboardInfo): void {
    keyboardShowListeners.forEach((cb) => cb(info));
  },

  emitHide(info: KeyboardInfo): void {
    keyboardHideListeners.forEach((cb) => cb(info));
  },

  async show(): Promise<void> {
    // Focus the first input to trigger keyboard on web
    const input = document.querySelector<HTMLInputElement>('input, textarea, [contenteditable]');
    input?.focus();
  },

  async hide(): Promise<void> {
    // Blur active element to hide keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  },

  async setAccessoryBarVisible(_options: { isVisible: boolean }): Promise<void> {
    // Not applicable for web
  },

  async setScroll(_options: { isDisabled: boolean }): Promise<void> {
    // Not applicable for web
  },

  async setStyle(_options: { style: KeyboardStyle }): Promise<void> {
    // Not applicable for web
  },

  async setResizeMode(_options: { mode: KeyboardResizeMode }): Promise<void> {
    // Not applicable for web
  },

  async getResizeMode(): Promise<{ mode: KeyboardResizeMode }> {
    return { mode: 'none' };
  },
};

// Initialize web keyboard on load
if (typeof window !== 'undefined') {
  WebKeyboard.init();
}

// ============================================================================
// Keyboard API
// ============================================================================

registerPlugin('Keyboard', { web: WebKeyboard });

/**
 * Keyboard API
 */
export const CapacitorKeyboard = {
  /**
   * Show the keyboard
   */
  async show(): Promise<void> {
    if (!isNativePlatform()) {
      return WebKeyboard.show();
    }

    try {
      await callPlugin('Keyboard', 'show');
    } catch {
      // Ignore if keyboard plugin not available
    }
  },

  /**
   * Hide the keyboard
   */
  async hide(): Promise<void> {
    if (!isNativePlatform()) {
      return WebKeyboard.hide();
    }

    try {
      await callPlugin('Keyboard', 'hide');
    } catch {
      // Ignore if keyboard plugin not available
    }
  },

  /**
   * Set accessory bar visibility (iOS)
   */
  async setAccessoryBarVisible(options: { isVisible: boolean }): Promise<void> {
    if (!isNativePlatform()) return;

    try {
      await callPlugin('Keyboard', 'setAccessoryBarVisible', options);
    } catch {
      // Ignore if not available
    }
  },

  /**
   * Set scroll behavior when keyboard appears
   */
  async setScroll(options: { isDisabled: boolean }): Promise<void> {
    if (!isNativePlatform()) return;

    try {
      await callPlugin('Keyboard', 'setScroll', options);
    } catch {
      // Ignore if not available
    }
  },

  /**
   * Set keyboard style (iOS)
   */
  async setStyle(options: { style: KeyboardStyle }): Promise<void> {
    if (!isNativePlatform()) return;

    try {
      await callPlugin('Keyboard', 'setStyle', options);
    } catch {
      // Ignore if not available
    }
  },

  /**
   * Set resize mode
   */
  async setResizeMode(options: { mode: KeyboardResizeMode }): Promise<void> {
    if (!isNativePlatform()) return;

    try {
      await callPlugin('Keyboard', 'setResizeMode', options);
    } catch {
      // Ignore if not available
    }
  },

  /**
   * Get current resize mode
   */
  async getResizeMode(): Promise<{ mode: KeyboardResizeMode }> {
    if (!isNativePlatform()) {
      return { mode: 'none' };
    }

    try {
      return await callPlugin('Keyboard', 'getResizeMode');
    } catch {
      return { mode: 'none' };
    }
  },

  /**
   * Add keyboard will show listener
   */
  addWillShowListener(callback: KeyboardEventCallback): () => void {
    if (isNativePlatform()) {
      const capacitor = (window as any).Capacitor;
      if (capacitor?.Plugins?.Keyboard) {
        const handle = capacitor.Plugins.Keyboard.addListener(
          'keyboardWillShow',
          callback
        );
        return () => handle.remove();
      }
    }

    keyboardShowListeners.add(callback);
    return () => keyboardShowListeners.delete(callback);
  },

  /**
   * Add keyboard did show listener
   */
  addDidShowListener(callback: KeyboardEventCallback): () => void {
    if (isNativePlatform()) {
      const capacitor = (window as any).Capacitor;
      if (capacitor?.Plugins?.Keyboard) {
        const handle = capacitor.Plugins.Keyboard.addListener(
          'keyboardDidShow',
          (info: KeyboardInfo) => {
            keyboardVisible.set(true);
            keyboardHeight.set(info.keyboardHeight);
            callback(info);
          }
        );
        return () => handle.remove();
      }
    }

    keyboardShowListeners.add(callback);
    return () => keyboardShowListeners.delete(callback);
  },

  /**
   * Add keyboard will hide listener
   */
  addWillHideListener(callback: KeyboardEventCallback): () => void {
    if (isNativePlatform()) {
      const capacitor = (window as any).Capacitor;
      if (capacitor?.Plugins?.Keyboard) {
        const handle = capacitor.Plugins.Keyboard.addListener(
          'keyboardWillHide',
          callback
        );
        return () => handle.remove();
      }
    }

    keyboardHideListeners.add(callback);
    return () => keyboardHideListeners.delete(callback);
  },

  /**
   * Add keyboard did hide listener
   */
  addDidHideListener(callback: KeyboardEventCallback): () => void {
    if (isNativePlatform()) {
      const capacitor = (window as any).Capacitor;
      if (capacitor?.Plugins?.Keyboard) {
        const handle = capacitor.Plugins.Keyboard.addListener(
          'keyboardDidHide',
          (info: KeyboardInfo) => {
            keyboardVisible.set(false);
            keyboardHeight.set(0);
            callback(info);
          }
        );
        return () => handle.remove();
      }
    }

    keyboardHideListeners.add(callback);
    return () => keyboardHideListeners.delete(callback);
  },

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    keyboardShowListeners.clear();
    keyboardHideListeners.clear();

    if (isNativePlatform()) {
      const capacitor = (window as any).Capacitor;
      capacitor?.Plugins?.Keyboard?.removeAllListeners?.();
    }
  },
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get keyboard visibility
 */
export function useKeyboardVisible(): boolean {
  return keyboardVisible();
}

/**
 * Hook to get keyboard height
 */
export function useKeyboardHeight(): number {
  return keyboardHeight();
}

/**
 * Hook for keyboard state with auto-cleanup
 */
export function useKeyboard(): {
  visible: boolean;
  height: number;
  show: () => Promise<void>;
  hide: () => Promise<void>;
} {
  effect(() => {
    const unsubscribeShow = CapacitorKeyboard.addDidShowListener(() => {});
    const unsubscribeHide = CapacitorKeyboard.addDidHideListener(() => {});

    return () => {
      unsubscribeShow();
      unsubscribeHide();
    };
  });

  return {
    visible: keyboardVisible(),
    height: keyboardHeight(),
    show: CapacitorKeyboard.show,
    hide: CapacitorKeyboard.hide,
  };
}

/**
 * Hook to handle keyboard events
 */
export function useKeyboardEvents(options: {
  onShow?: (info: KeyboardInfo) => void;
  onHide?: (info: KeyboardInfo) => void;
}): void {
  effect(() => {
    const cleanups: Array<() => void> = [];

    if (options.onShow) {
      cleanups.push(CapacitorKeyboard.addDidShowListener(options.onShow));
    }

    if (options.onHide) {
      cleanups.push(CapacitorKeyboard.addDidHideListener(options.onHide));
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  });
}

// ============================================================================
// Keyboard Avoiding Utilities
// ============================================================================

/**
 * Get keyboard offset for a given element
 */
export function getKeyboardOffset(element: HTMLElement): number {
  if (!keyboardVisible()) return 0;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const kbHeight = keyboardHeight();
  const bottomOfElement = rect.bottom;
  const visibleHeight = windowHeight - kbHeight;

  if (bottomOfElement > visibleHeight) {
    return bottomOfElement - visibleHeight + 20; // 20px padding
  }

  return 0;
}

/**
 * Scroll element into view above keyboard
 */
export function scrollAboveKeyboard(
  element: HTMLElement,
  options?: { animated?: boolean; offset?: number }
): void {
  const offset = getKeyboardOffset(element) + (options?.offset || 0);

  if (offset > 0) {
    window.scrollBy({
      top: offset,
      behavior: options?.animated !== false ? 'smooth' : 'auto',
    });
  }
}

// ============================================================================
// Exports
// ============================================================================

export default CapacitorKeyboard;
