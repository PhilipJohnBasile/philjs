/**
 * Signal Mocking Utilities
 *
 * Create mock signals for testing
 */
import { signal, memo } from 'philjs-core';
/**
 * Create a mock signal with initial value
 */
export function createMockSignal(initialValue) {
    const sig = signal(initialValue);
    const calls = [];
    // Track signal access
    const mockSig = (() => {
        calls.push({ type: 'get' });
        return sig();
    });
    // Track signal updates
    mockSig.set = (value) => {
        calls.push({ type: 'set', value });
        sig.set(value);
    };
    // Add helper methods
    mockSig.getCalls = () => calls;
    mockSig.getSetCount = () => calls.filter((c) => c.type === 'set').length;
    mockSig.getGetCount = () => calls.filter((c) => c.type === 'get').length;
    mockSig.reset = () => {
        calls.length = 0;
        sig.set(initialValue);
    };
    return mockSig;
}
/**
 * Create a mock computed signal
 */
export function createMockComputed(fn) {
    const comp = memo(fn);
    const calls = [];
    // Track computed access
    const mockComp = (() => {
        calls.push({ type: 'get' });
        return comp();
    });
    // Add helper methods
    mockComp.getCalls = () => calls;
    mockComp.getCallCount = () => calls.length;
    mockComp.reset = () => {
        calls.length = 0;
    };
    return mockComp;
}
/**
 * Spy on signal access
 */
export function spyOnSignal(sig) {
    const originalGet = sig;
    const originalSet = sig.set;
    const calls = [];
    const spy = (() => {
        calls.push({ type: 'get', timestamp: Date.now() });
        return originalGet();
    });
    spy.set = (value) => {
        calls.push({ type: 'set', value, timestamp: Date.now() });
        originalSet(value);
    };
    spy.getCalls = () => calls;
    spy.clearCalls = () => {
        calls.length = 0;
    };
    return spy;
}
//# sourceMappingURL=signal-mocks.js.map