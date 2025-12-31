/**
 * Timing utilities - debounce, throttle, RAF
 */
/**
 * Debounce a function
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): T & {
    cancel: () => void;
    flush: () => void;
};
/**
 * Throttle a function
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, wait: number, options?: {
    leading?: boolean;
    trailing?: boolean;
}): T & {
    cancel: () => void;
};
/**
 * Throttle using requestAnimationFrame (ideal for visual updates)
 */
export declare function rafThrottle<T extends (...args: any[]) => any>(fn: T): T & {
    cancel: () => void;
};
/**
 * Schedule work during idle time
 */
export declare function scheduleIdle<T>(fn: () => T, options?: IdleRequestOptions): Promise<T>;
//# sourceMappingURL=timing.d.ts.map