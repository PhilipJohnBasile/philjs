/**
 * Client-side HMR helper for PhilJS
 *
 * This module provides client-side HMR state management that works
 * with the Vite plugin to preserve signal state across hot updates.
 *
 * It should be automatically injected by the Vite plugin during development.
 */
import { getHMRStats, type HMROptions } from '@philjs/core/signals';
/**
 * HMR client state
 */
interface HMRClientState {
    lastSnapshot: Map<string, any> | null;
    updateCount: number;
    failureCount: number;
    totalDuration: number;
    isActive: boolean;
}
/**
 * Setup HMR client handlers
 *
 * This should be called automatically when the module is imported in dev mode.
 */
export declare function setupHMRClient(options?: HMROptions): void;
/**
 * Get HMR client statistics
 */
export declare function getHMRClientStats(): HMRClientState & ReturnType<typeof getHMRStats>;
/**
 * Reset HMR client statistics
 */
export declare function resetHMRClientStats(): void;
export {};
//# sourceMappingURL=hmr-client.d.ts.map