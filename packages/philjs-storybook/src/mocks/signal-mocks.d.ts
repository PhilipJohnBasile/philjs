/**
 * Signal Mocking Utilities
 *
 * Create mock signals for testing
 */
import { signal } from 'philjs-core';
/**
 * Create a mock signal with initial value
 */
export declare function createMockSignal<T>(initialValue: T): any;
/**
 * Create a mock computed signal
 */
export declare function createMockComputed<T>(fn: () => T): any;
/**
 * Spy on signal access
 */
export declare function spyOnSignal<T>(sig: ReturnType<typeof signal<T>>): any;
//# sourceMappingURL=signal-mocks.d.ts.map