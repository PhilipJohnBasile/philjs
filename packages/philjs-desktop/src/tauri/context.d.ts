/**
 * Tauri Context and Hook
 */
import type { TauriContext } from './types.js';
/**
 * Initialize and get Tauri context
 */
export declare function initTauriContext(): Promise<TauriContext>;
/**
 * Get the current Tauri context
 * Must be called after initTauriContext()
 */
export declare function getTauriContext(): TauriContext;
/**
 * Hook to access Tauri APIs
 * Returns the Tauri context with invoke, listen, emit, etc.
 */
export declare function useTauri(): TauriContext;
/**
 * Check if running in Tauri environment
 */
export declare function isTauri(): boolean;
/**
 * Reset context (for testing)
 */
export declare function resetTauriContext(): void;
//# sourceMappingURL=context.d.ts.map