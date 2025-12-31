/**
 * Service worker update notifications
 */
import type { Signal } from 'philjs-core';
import type { UpdateCheckResult } from './types.js';
/**
 * Whether an update is available
 */
export declare const hasUpdate: Signal<boolean>;
/**
 * Update version info
 */
export declare const updateInfo: Signal<UpdateCheckResult | null>;
/**
 * Initialize update checking
 */
export declare function initUpdateNotifications(options?: {
    checkInterval?: number;
    autoCheck?: boolean;
}): () => void;
/**
 * Check for service worker updates
 */
export declare function checkForUpdates(): Promise<boolean>;
/**
 * Apply update and reload
 */
export declare function applyUpdate(): Promise<void>;
/**
 * Dismiss update notification
 */
export declare function dismissUpdate(): void;
//# sourceMappingURL=updates.d.ts.map