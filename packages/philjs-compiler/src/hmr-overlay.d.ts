/**
 * Enhanced error overlay for HMR-specific errors
 *
 * Provides a better developer experience by showing HMR-specific errors
 * with context, suggestions, and the ability to retry or rollback.
 */
interface ImportMetaHot {
    invalidate: () => void;
    accept: (callback?: () => void) => void;
}
interface ImportMetaEnv {
    DEV?: boolean;
    PROD?: boolean;
    MODE?: string;
}
declare global {
    interface ImportMeta {
        hot?: ImportMetaHot;
        env?: ImportMetaEnv;
    }
}
/**
 * HMR error types
 */
export type HMRErrorType = 'snapshot-failed' | 'restore-failed' | 'update-failed' | 'boundary-error' | 'state-corruption' | 'timeout';
/**
 * HMR error information
 */
export interface HMRError {
    type: HMRErrorType;
    message: string;
    file?: string;
    stack?: string;
    suggestion?: string;
    canRetry?: boolean;
    canRollback?: boolean;
    timestamp: number;
}
/**
 * Show the error overlay
 */
export declare function showHMRErrorOverlay(error: HMRError): void;
/**
 * Hide the error overlay
 */
export declare function hideHMRErrorOverlay(): void;
/**
 * Setup global handlers for overlay actions
 */
export declare function setupOverlayHandlers(): void;
/**
 * Get error history
 */
export declare function getHMRErrorHistory(): HMRError[];
/**
 * Clear error history
 */
export declare function clearHMRErrorHistory(): void;
export {};
//# sourceMappingURL=hmr-overlay.d.ts.map