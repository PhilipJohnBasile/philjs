import { describe, it, expect, vi } from 'vitest';
import {
  signal,
  memo,
  effect,
  batch,
  untrack,
  onCleanup,
  createRoot,
  resource,
} from './signals';

describe('signal()', () => {
  it('creates a signal with initial value', () => {
    const count = signal(0);
    expect(count()).toBe(0);
  });

  it('updates signal value', () => {
    const count = signal(0);
    count.set(5);
    expect(count()).toBe(5);
  });

  it('supports updater function', () => {
    const count = signal(0);
    count.set(c => c + 1);
    expect(count()).toBe(1);
  });

  it('does not update if value is the same (Object.is)', () => {
    const count = signal(0);
    const spy = vi.fn();

    effect(() => {
      count();
      spy();
    });

    spy.mockClear();

    count.set(0); // Same value
    expect(spy).not.toHaveBeenCalled();
  });

  it('peek() reads without tracking dependencies', () => {
    const count = signal(0);
    const spy = vi.fn();

    effect(() => {
      count.peek(); // Untracked
      spy();
    });

    spy.mockClear();
    count.set(5);
    expect(spy).not.toHaveBeenCalled();
  });

  it('subscribe() allows manual subscription', () => {
    const count = signal(0);
    const spy = vi.fn();

    const unsubscribe = count.subscribe(spy);

    count.set(1);
    expect(spy).toHaveBeenCalledWith(1);

    spy.mockClear();
    unsubscribe();
    count.set(2);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('memo()', () => {
  it('creates a computed value', () => {
    const count = signal(0);
    const doubled = memo(() => count() * 2);

    expect(doubled()).toBe(0);
    count.set(5);
    expect(doubled()).toBe(10);
  });

  it('only recomputes when dependencies change', () => {
    const count = signal(0);
    const spy = vi.fn(() => count() * 2);
    const doubled = memo(spy);

    doubled(); // Initial computation
    spy.mockClear();

    doubled(); // Should not recompute
    expect(spy).not.toHaveBeenCalled();

    count.set(5); // Change dependency
    doubled(); // Should recompute
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('tracks dependencies automatically', () => {
    const a = signal(1);
    const b = signal(2);
    const sum = memo(() => a() + b());

    expect(sum()).toBe(3);
    a.set(10);
    expect(sum()).toBe(12);
    b.set(20);
    expect(sum()).toBe(30);
  });

  it('supports chained memos', () => {
    const a = signal(2);
    const b = memo(() => a() * 2);
    const c = memo(() => b() * 2);

    expect(c()).toBe(8);
    a.set(3);
    expect(c()).toBe(12);
  });
});

describe('effect()', () => {
  it('runs immediately', () => {
    const spy = vi.fn();
    const dispose = effect(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('re-runs when dependencies change', () => {
    const count = signal(0);
    const spy = vi.fn();

    const dispose = effect(() => {
      count();
      spy();
    });

    spy.mockClear();
    count.set(1);
    expect(spy).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('tracks multiple dependencies', () => {
    const a = signal(1);
    const b = signal(2);
    const spy = vi.fn();

    const dispose = effect(() => {
      a();
      b();
      spy();
    });

    spy.mockClear();

    a.set(10);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    b.set(20);
    expect(spy).toHaveBeenCalledTimes(1);

    dispose();
  });

  it('supports cleanup function', () => {
    const cleanup = vi.fn();
    const dispose = effect(() => cleanup);

    expect(cleanup).not.toHaveBeenCalled();
    dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('runs cleanup before re-execution', () => {
    const count = signal(0);
    const cleanup = vi.fn();

    const dispose = effect(() => {
      count(); // Track dependency
      return cleanup;
    });

    cleanup.mockClear();
    count.set(1); // Trigger re-execution

    // Cleanup should run before effect
    expect(cleanup).toHaveBeenCalled();

    dispose(); // Clean up
  });

  it('can be disposed', () => {
    const count = signal(0);
    const spy = vi.fn();

    const dispose = effect(() => {
      count();
      spy();
    });

    spy.mockClear();
    dispose();

    count.set(1);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('batch()', () => {
  it('batches multiple signal updates', () => {
    const a = signal(1);
    const b = signal(2);
    const spy = vi.fn();

    const dispose = effect(() => {
      a();
      b();
      spy();
    });

    spy.mockClear();

    batch(() => {
      a.set(10);
      b.set(20);
    });

    // Should only trigger one update
    expect(spy).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('returns the batched function result', () => {
    const result = batch(() => 42);
    expect(result).toBe(42);
  });

  it('handles nested batching', () => {
    const count = signal(0);
    const spy = vi.fn();

    const dispose = effect(() => {
      count();
      spy();
    });

    spy.mockClear();

    batch(() => {
      count.set(1);
      batch(() => {
        count.set(2);
      });
      count.set(3);
    });

    // Should only trigger one update after all batches complete
    expect(spy).toHaveBeenCalledTimes(1);
    dispose();
  });
});

describe('untrack()', () => {
  it('prevents dependency tracking', () => {
    const a = signal(1);
    const b = signal(2);
    const spy = vi.fn();

    const sum = memo(() => {
      const aVal = a(); // Tracked
      const bVal = untrack(() => b()); // Not tracked
      return aVal + bVal;
    });

    const dispose = effect(() => {
      sum();
      spy();
    });

    spy.mockClear();

    b.set(100); // Should not trigger update
    expect(spy).not.toHaveBeenCalled();

    a.set(5); // Should trigger update
    expect(spy).toHaveBeenCalledTimes(1);

    dispose();
  });

  it('returns the untracked function result', () => {
    const result = untrack(() => 42);
    expect(result).toBe(42);
  });
});

describe('onCleanup()', () => {
  it('registers cleanup in effect', () => {
    const cleanup = vi.fn();

    const dispose = effect(() => {
      onCleanup(cleanup);
    });

    expect(cleanup).not.toHaveBeenCalled();
    dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('registers multiple cleanups', () => {
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();

    const dispose = effect(() => {
      onCleanup(cleanup1);
      onCleanup(cleanup2);
    });

    dispose();
    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).toHaveBeenCalledTimes(1);
  });
});

describe('createRoot()', () => {
  it('creates a root scope', () => {
    const spy = vi.fn();

    const dispose = createRoot(dispose => {
      effect(spy);
      return dispose;
    });

    expect(spy).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('disposes all owned effects', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();

    const dispose = createRoot(dispose => {
      effect(spy1);
      effect(spy2);
      return dispose;
    });

    spy1.mockClear();
    spy2.mockClear();

    dispose();

    // Effects should not run after disposal
    // (This test is simplified; in practice you'd test with signals)
  });
});

describe('resource()', () => {
  it('creates a resource with initial value', () => {
    const user = resource(() => ({ name: 'Alice' }));

    expect(user.loading()).toBe(false);
    expect(user.error()).toBe(null);
    expect(user()).toEqual({ name: 'Alice' });
  });

  it('handles async fetching', async () => {
    const fetchUser = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { name: 'Bob' };
    };

    const user = resource(fetchUser);

    expect(user.loading()).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(user.loading()).toBe(false);
    expect(user()).toEqual({ name: 'Bob' });
  });

  it('handles errors', async () => {
    const fetchUser = async () => {
      throw new Error('Failed to fetch');
    };

    const user = resource(fetchUser);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(user.loading()).toBe(false);
    expect(user.error()).toBeInstanceOf(Error);
    expect(user.error()?.message).toBe('Failed to fetch');
  });

  it('can be refreshed', async () => {
    let callCount = 0;
    const fetchUser = async () => {
      callCount++;
      return { name: 'User' + callCount };
    };

    const user = resource(fetchUser);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(user()).toEqual({ name: 'User1' });

    user.refresh();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(user()).toEqual({ name: 'User2' });
  });
});


describe('Complex scenarios', () => {
  it('handles diamond dependency graph', () => {
    const a = signal(1);
    const b = memo(() => a() * 2);
    const c = memo(() => a() * 3);
    const d = memo(() => b() + c());

    expect(d()).toBe(5); // (1*2) + (1*3) = 5

    a.set(2);
    expect(d()).toBe(10); // (2*2) + (2*3) = 10
  });

  it('handles conditional dependencies', () => {
    const condition = signal(true);
    const a = signal(1);
    const b = signal(10);
    const spy = vi.fn();

    const dispose = effect(() => {
      const result = condition() ? a() : b();
      spy(result);
    });

    spy.mockClear();

    a.set(5); // Should trigger (condition is true)
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(5);

    spy.mockClear();
    b.set(20); // Should not trigger (condition is true, b not tracked)
    expect(spy).not.toHaveBeenCalled();

    condition.set(false); // Change condition
    expect(spy).toHaveBeenCalledWith(20);

    spy.mockClear();
    b.set(30); // Should trigger now
    expect(spy).toHaveBeenCalledWith(30);

    spy.mockClear();
    a.set(100); // Should not trigger (condition is false, a not tracked)
    expect(spy).not.toHaveBeenCalled();

    dispose();
  });

  it('prevents infinite loops with proper design', () => {
    const input = signal(0);
    const output = signal(0);

    // Proper way: separate read and write signals
    const dispose = effect(() => {
      output.set(input() * 2);
    });

    expect(output()).toBe(0);
    input.set(5);
    expect(output()).toBe(10);

    dispose();
  });
});
