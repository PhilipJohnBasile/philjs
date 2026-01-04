/**
 * Signal Mocking Utilities
 *
 * Create mock signals for testing
 */
import { signal } from '@philjs/core';
/**
 * Create a mock signal with initial value
 */
export declare function createMockSignal<T>(initialValue: T): import("@philjs/core").Signal<T>;
/**
 * Create a mock computed signal
 */
export declare function createMockComputed<T>(fn: () => T): import("@philjs/core").Memo<T>;
/**
 * Spy on signal access
 */
export declare function spyOnSignal<T>(sig: ReturnType<typeof signal<T>>): import("@philjs/core").Signal<T>;
//# sourceMappingURL=signal-mocks.d.ts.map