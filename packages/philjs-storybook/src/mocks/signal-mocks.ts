/**
 * Signal Mocking Utilities
 *
 * Create mock signals for testing
 */

import { signal, memo } from 'philjs-core';

/**
 * Create a mock signal with initial value
 */
export function createMockSignal<T>(initialValue: T) {
  const sig = signal<T>(initialValue);
  const calls: Array<{ type: 'get' | 'set'; value?: T }> = [];

  // Track signal access
  const mockSig = (() => {
    calls.push({ type: 'get' });
    return sig();
  }) as typeof sig;

  // Track signal updates
  (mockSig as any).set = (value: T) => {
    calls.push({ type: 'set', value });
    sig.set(value);
  };

  // Add helper methods
  (mockSig as any).getCalls = () => calls;
  (mockSig as any).getSetCount = () => calls.filter((c) => c.type === 'set').length;
  (mockSig as any).getGetCount = () => calls.filter((c) => c.type === 'get').length;
  (mockSig as any).reset = () => {
    calls.length = 0;
    sig.set(initialValue);
  };

  return mockSig;
}

/**
 * Create a mock computed signal
 */
export function createMockComputed<T>(fn: () => T) {
  const comp = memo(fn);
  const calls: Array<{ type: 'get' }> = [];

  // Track computed access
  const mockComp = (() => {
    calls.push({ type: 'get' });
    return comp();
  }) as typeof comp;

  // Add helper methods
  (mockComp as any).getCalls = () => calls;
  (mockComp as any).getCallCount = () => calls.length;
  (mockComp as any).reset = () => {
    calls.length = 0;
  };

  return mockComp;
}

/**
 * Spy on signal access
 */
export function spyOnSignal<T>(sig: ReturnType<typeof signal<T>>) {
  const originalGet = sig;
  const originalSet = sig.set;
  const calls: Array<{ type: 'get' | 'set'; value?: T; timestamp: number }> = [];

  const spy = (() => {
    calls.push({ type: 'get', timestamp: Date.now() });
    return originalGet();
  }) as typeof sig;

  (spy as any).set = (value: T) => {
    calls.push({ type: 'set', value, timestamp: Date.now() });
    originalSet(value);
  };

  (spy as any).getCalls = () => calls;
  (spy as any).clearCalls = () => {
    calls.length = 0;
  };

  return spy;
}
