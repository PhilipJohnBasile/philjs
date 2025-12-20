/**
 * Signal Mocks Tests
 */

import { describe, it, expect } from 'vitest';
import { createMockSignal, createMockComputed } from './signal-mocks.js';
import { signal } from 'philjs-core';

describe('createMockSignal', () => {
  it('should create a mock signal with initial value', () => {
    const sig = createMockSignal(0);

    expect(sig()).toBe(0);
  });

  it('should track signal gets', () => {
    const sig = createMockSignal(0);

    sig();
    sig();
    sig();

    expect((sig as any).getGetCount()).toBe(3);
  });

  it('should track signal sets', () => {
    const sig = createMockSignal(0);

    sig.set(1);
    sig.set(2);
    sig.set(3);

    expect((sig as any).getSetCount()).toBe(3);
  });

  it('should track all calls', () => {
    const sig = createMockSignal(0);

    sig();
    sig.set(1);
    sig();
    sig.set(2);

    const calls = (sig as any).getCalls();
    expect(calls).toHaveLength(4);
    expect(calls[0].type).toBe('get');
    expect(calls[1].type).toBe('set');
    expect(calls[1].value).toBe(1);
  });

  it('should reset signal', () => {
    const sig = createMockSignal(0);

    sig.set(5);
    sig();
    sig();

    (sig as any).reset();

    expect(sig()).toBe(0);
    expect((sig as any).getCalls()).toHaveLength(1); // Only the get from expect
  });
});

describe('createMockComputed', () => {
  it('should create a mock computed signal', () => {
    const count = signal(0);
    const doubled = createMockComputed(() => count() * 2);

    expect(doubled()).toBe(0);

    count.set(5);
    expect(doubled()).toBe(10);
  });

  it('should track computed gets', () => {
    const count = signal(0);
    const doubled = createMockComputed(() => count() * 2);

    doubled();
    doubled();
    doubled();

    expect((doubled as any).getCallCount()).toBe(3);
  });

  it('should reset call tracking', () => {
    const count = signal(0);
    const doubled = createMockComputed(() => count() * 2);

    doubled();
    doubled();

    (doubled as any).reset();

    expect((doubled as any).getCallCount()).toBe(0);
  });
});
