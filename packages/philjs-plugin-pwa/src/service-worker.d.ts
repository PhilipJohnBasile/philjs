/**
 * Service Worker generation and registration
 */
import type { ServiceWorkerConfig } from './types.js';
/**
 * Generate service worker code
 */
export declare function generateServiceWorker(config?: ServiceWorkerConfig): string;
/**
 * Register service worker
 */
export declare function registerServiceWorker(scriptURL?: string, options?: RegistrationOptions): Promise<ServiceWorkerRegistration | null>;
/**
 * Unregister all service workers
 */
export declare function unregisterServiceWorker(): Promise<boolean>;
/**
 * Check if service worker is registered
 */
export declare function isServiceWorkerRegistered(): Promise<boolean>;
/**
 * Skip waiting and reload
 */
export declare function skipWaitingAndReload(): Promise<void>;
/**
 * Get service worker version
 */
export declare function getServiceWorkerVersion(): Promise<string | null>;
//# sourceMappingURL=service-worker.d.ts.map