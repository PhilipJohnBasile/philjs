/**
 * SSR and Hydration Error Detection
 *
 * Detects and provides helpful messages for:
 * - Hydration mismatches
 * - Browser API usage during SSR
 * - Missing SSR data
 * - Server/client state differences
 */
export interface HydrationMismatch {
    path: string;
    serverHTML?: string;
    clientHTML?: string;
    reason: string;
    timestamp: number;
}
/**
 * Mark start of hydration
 */
export declare function startHydration(): void;
/**
 * Mark end of hydration
 */
export declare function endHydration(): void;
/**
 * Record a hydration mismatch
 */
export declare function recordHydrationMismatch(path: string, serverHTML?: string, clientHTML?: string, reason?: string): void;
/**
 * Check if currently hydrating
 */
export declare function isCurrentlyHydrating(): boolean;
/**
 * Get all hydration mismatches
 */
export declare function getHydrationMismatches(): HydrationMismatch[];
/**
 * Clear hydration mismatches (useful for testing)
 */
export declare function clearHydrationMismatches(): void;
/**
 * Check if code is running on server
 */
export declare function isServer(): boolean;
/**
 * Wrap browser API access with error checking
 */
export declare function guardBrowserAPI<T>(apiName: string, accessor: () => T, fallback?: T): T;
/**
 * SSR data validation
 */
interface SSRData {
    [key: string]: any;
}
/**
 * Set SSR data (called during server rendering)
 */
export declare function setSSRData(data: SSRData): void;
/**
 * Get SSR data
 */
export declare function getSSRData(): SSRData;
/**
 * Require SSR data key
 */
export declare function requireSSRData(key: string): any;
/**
 * Detect common hydration issues
 */
export declare function detectHydrationIssues(serverHTML: string, clientHTML: string, path: string): string[];
/**
 * Create hydration-safe wrapper for values that may differ
 */
export declare function hydrationSafe<T>(serverValue: T, clientValue: () => T): T;
/**
 * Get SSR error statistics
 */
export declare function getSSRErrorStats(): {
    hydrationMismatches: number;
    isHydrating: boolean;
    ssrDataKeys: string[];
};
/**
 * Clear all SSR error tracking
 */
export declare function clearSSRErrorTracking(): void;
export {};
//# sourceMappingURL=ssr-errors.d.ts.map