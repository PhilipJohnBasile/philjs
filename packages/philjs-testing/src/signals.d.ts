/**
 * PhilJS Testing - Signal Testing Utilities
 */
export interface MockSignal<T> {
    get(): T;
    set(value: T): void;
    update(fn: (prev: T) => T): void;
    subscribe(fn: (value: T) => void): () => void;
    getHistory(): T[];
    getCallCount(): number;
    reset(): void;
}
/**
 * Create a mock signal for testing
 */
export declare function createMockSignal<T>(initialValue: T): MockSignal<T>;
/**
 * Get the current value of a signal (utility for tests)
 */
export declare function signalValue<T>(signal: {
    get(): T;
}): T;
/**
 * Wait for a signal to have a specific value
 */
export declare function waitForSignal<T>(signal: {
    get(): T;
    subscribe?: (fn: (v: T) => void) => () => void;
}, predicate: (value: T) => boolean, options?: {
    timeout?: number;
    interval?: number;
}): Promise<T>;
/**
 * Wait for a signal to equal a specific value
 */
export declare function waitForSignalValue<T>(signal: {
    get(): T;
    subscribe?: (fn: (v: T) => void) => () => void;
}, expectedValue: T, options?: {
    timeout?: number;
    interval?: number;
}): Promise<void>;
/**
 * Assert signal was called with specific values
 */
export declare function assertSignalHistory<T>(signal: MockSignal<T>, expectedHistory: T[]): void;
/**
 * Create a computed signal mock
 */
export declare function createMockComputed<T>(computeFn: () => T): MockSignal<T>;
//# sourceMappingURL=signals.d.ts.map