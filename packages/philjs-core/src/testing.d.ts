/**
 * PhilJS Testing Utilities
 * Makes it easy to test PhilJS components and applications
 */
import { type Signal } from './signals';
import { type VNode } from './jsx-runtime';
export interface RenderResult {
    /** The rendered HTML */
    html: string;
    /** Re-render the component */
    rerender: () => string;
    /** Cleanup function */
    cleanup: () => void;
    /** Query for elements by test ID */
    getByTestId: (testId: string) => string | null;
    /** Get all elements matching selector */
    queryAll: (selector: string) => string[];
    /** Check if HTML contains text */
    contains: (text: string) => boolean;
}
/**
 * Render a component for testing
 */
export declare function render(component: VNode): RenderResult;
/**
 * Create a test signal that tracks all updates
 */
export declare function createTestSignal<T>(initialValue: T): {
    signal: Signal<T>;
    updates: T[];
    reset: () => void;
};
/**
 * Wait for next tick (useful for async tests)
 */
export declare function nextTick(): Promise<void>;
/**
 * Wait for a specific amount of time
 */
export declare function wait(ms: number): Promise<void>;
/**
 * Create a spy function that tracks calls
 */
export declare function createSpy<T extends (...args: any[]) => any>(): T & {
    calls: Array<Parameters<T>>;
    results: Array<ReturnType<T>>;
    callCount: number;
    reset: () => void;
};
/**
 * Assert that a value is truthy
 */
export declare function assert(condition: unknown, message?: string): asserts condition;
/**
 * Test utilities for async operations
 */
export declare const async: {
    /** Wait for a condition to be true */
    waitFor: (condition: () => boolean, options?: {
        timeout?: number;
        interval?: number;
    }) => Promise<void>;
    /** Wait for a signal to have a specific value */
    waitForSignal: <T>(signal: Signal<T>, expectedValue: T, options?: {
        timeout?: number;
        interval?: number;
    }) => Promise<void>;
};
/**
 * Snapshot testing utility
 */
export declare class SnapshotTester {
    private snapshots;
    snapshot(name: string, value: string): void;
    update(name: string, value: string): void;
    clear(): void;
}
/**
 * Mock utilities
 */
export declare const mock: {
    /** Create a mock function */
    fn: <T extends (...args: any[]) => any>(implementation?: T) => T & {
        calls: Array<Parameters<T>>;
        returns: Array<ReturnType<T>>;
        mockReturnValue: (value: ReturnType<T>) => void;
        mockImplementation: (impl: T) => void;
    };
    /** Create a mock signal */
    signal: <T>(initialValue: T) => {
        signal: Signal<T>;
        setCalls: T[];
    };
};
/**
 * Create a test component wrapper
 */
export declare function createTestComponent<P extends Record<string, any> = Record<string, any>>(Component: (props: P) => VNode): {
    render: (props: P) => RenderResult;
    renderToString: (props: P) => string;
};
/**
 * Batch test assertions
 */
export declare function expectAll(...assertions: Array<() => void>): void;
/**
 * Performance testing utilities
 */
export declare const perf: {
    /** Measure execution time */
    measure: <T>(fn: () => T) => {
        result: T;
        duration: number;
    };
    /** Measure async execution time */
    measureAsync: <T>(fn: () => Promise<T>) => Promise<{
        result: T;
        duration: number;
    }>;
    /** Assert function executes within time limit */
    assertFast: <T>(fn: () => T, maxDuration: number) => T;
};
//# sourceMappingURL=testing.d.ts.map