/**
 * PWA install prompt utilities
 */
import type { Signal } from 'philjs-core';
import type { InstallPromptEvent } from './types.js';
/**
 * Whether install prompt is available
 */
export declare const canInstall: Signal<boolean>;
/**
 * Whether the app is installed
 */
export declare const isInstalled: Signal<boolean>;
/**
 * Initialize install prompt handling
 */
export declare function initInstallPrompt(): () => void;
/**
 * Show install prompt
 */
export declare function showInstallPrompt(): Promise<'accepted' | 'dismissed' | null>;
/**
 * Get install prompt event
 */
export declare function getInstallPrompt(): InstallPromptEvent | null;
/**
 * Check if app can be installed
 */
export declare function checkCanInstall(): boolean;
/**
 * Check if app is installed
 */
export declare function checkIsInstalled(): boolean;
//# sourceMappingURL=install.d.ts.map