/**
 * PWA install prompt utilities
 */

import { signal } from '@philjs/core';
import type { Signal } from '@philjs/core';
import type { InstallPromptEvent } from './types.js';

let deferredPrompt: InstallPromptEvent | null = null;

/**
 * Whether install prompt is available
 */
export const canInstall: Signal<boolean> = signal(false);

/**
 * Whether the app is installed
 */
export const isInstalled: Signal<boolean> = signal(false);

/**
 * Initialize install prompt handling
 */
export function initInstallPrompt(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true) {
    isInstalled.set(true);
  }

  const handleBeforeInstallPrompt = (e: Event) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();

    // Save the event for later use
    deferredPrompt = e as InstallPromptEvent;
    canInstall.set(true);

    console.log('[Install] Install prompt available');
  };

  const handleAppInstalled = () => {
    deferredPrompt = null;
    canInstall.set(false);
    isInstalled.set(true);

    console.log('[Install] App installed');

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
  };
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | null> {
  if (!deferredPrompt) {
    console.warn('[Install] No install prompt available');
    return null;
  }

  // Show the prompt
  await deferredPrompt.prompt();

  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice;

  console.log('[Install] User choice:', outcome);

  // Clear the deferred prompt
  deferredPrompt = null;
  canInstall.set(false);

  return outcome;
}

/**
 * Get install prompt event
 */
export function getInstallPrompt(): InstallPromptEvent | null {
  return deferredPrompt;
}

/**
 * Check if app can be installed
 */
export function checkCanInstall(): boolean {
  return canInstall();
}

/**
 * Check if app is installed
 */
export function checkIsInstalled(): boolean {
  return isInstalled();
}
