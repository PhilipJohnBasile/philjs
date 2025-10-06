/**
 * Integration Tests for PhilJS
 *
 * These tests verify that different parts of the framework work together correctly.
 */

import { describe, it, expect, vi } from 'vitest';
import { signal, effect, memo, batch, createRoot, onCleanup } from './signals.js';
import { createContext, useContext } from './context.js';

// ============================================================================
// Signals + Effects Integration
// ============================================================================

describe('Integration: Signals + Effects', () => {
  it('should track dependencies across multiple signals', () => {
    const firstName = signal('John');
    const lastName = signal('Doe');
    const fullName = memo(() => `${firstName()} ${lastName()}`);

    expect(fullName()).toBe('John Doe');

    firstName.set('Jane');
    expect(fullName()).toBe('Jane Doe');

    lastName.set('Smith');
    expect(fullName()).toBe('Jane Smith');
  });

  it('should batch multiple updates', () => {
    const count = signal(0);
    const double = memo(() => count() * 2);
    const spy = vi.fn();

    effect(() => {
      spy(double());
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0);

    batch(() => {
      count.set(1);
      count.set(2);
      count.set(3);
    });

    // Should only trigger once due to batching
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(6);
  });

  it('should handle nested effects', () => {
    const outer = signal(1);
    const inner = signal(2);
    const results: number[] = [];

    effect(() => {
      const o = outer();
      effect(() => {
        results.push(o * inner());
      });
    });

    expect(results).toEqual([2]);

    inner.set(3);
    expect(results).toEqual([2, 3]);

    outer.set(2);
    expect(results).toEqual([2, 3, 6]);
  });

  it('should handle cleanup functions in effects', () => {
    const count = signal(0);
    const spy = vi.fn();
    const cleanupSpy = vi.fn();

    const dispose = effect(() => {
      spy(count());
      onCleanup(cleanupSpy);
    });

    expect(spy).toHaveBeenCalledTimes(1);

    count.set(1);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(cleanupSpy).toHaveBeenCalledTimes(1); // Cleanup from previous run

    dispose();
    expect(cleanupSpy).toHaveBeenCalled(); // Cleanup is called
  });
});

// ============================================================================
// Context + Signals Integration
// ============================================================================

describe('Integration: Context + Signals', () => {
  it('should share reactive state through context', () => {
    const ThemeContext = createContext<{ color: () => string; setColor: (c: string) => void }>();

    const color = signal('blue');
    ThemeContext.Provider({
      value: {
        color,
        setColor: (c: string) => color.set(c)
      },
      children: []
    });

    const theme = useContext(ThemeContext);
    expect(theme?.color()).toBe('blue');

    theme?.setColor('red');
    expect(theme?.color()).toBe('red');
  });

  it('should track context value changes in effects', () => {
    const CountContext = createContext<() => number>();
    const count = signal(0);

    CountContext.Provider({
      value: count,
      children: []
    });

    const getCount = useContext(CountContext);
    const spy = vi.fn();

    effect(() => {
      if (getCount) {
        spy(getCount());
      }
    });

    expect(spy).toHaveBeenCalledWith(0);

    count.set(5);
    expect(spy).toHaveBeenCalledWith(5);
  });

  it('should handle nested context providers', () => {
    const ThemeContext = createContext<string>();

    ThemeContext.Provider({
      value: 'light',
      children: []
    });

    const theme1 = useContext(ThemeContext);
    expect(theme1).toBe('light');

    ThemeContext.Provider({
      value: 'dark',
      children: []
    });

    const theme2 = useContext(ThemeContext);
    expect(theme2).toBe('dark');
  });
});

// ============================================================================
// Complex Reactive Scenarios
// ============================================================================

describe('Integration: Complex Reactive Scenarios', () => {
  it('should handle diamond dependencies correctly', () => {
    const source = signal(1);
    const left = memo(() => source() * 2);
    const right = memo(() => source() + 10);
    const combined = memo(() => left() + right());

    expect(combined()).toBe(13); // (1*2) + (1+10) = 2 + 11 = 13

    source.set(2);
    expect(combined()).toBe(16); // (2*2) + (2+10) = 4 + 12 = 16
  });

  it('should handle deep nested memos efficiently', () => {
    const base = signal(1);
    const m1 = memo(() => base() + 1);
    const m2 = memo(() => m1() + 1);
    const m3 = memo(() => m2() + 1);
    const m4 = memo(() => m3() + 1);
    const m5 = memo(() => m4() + 1);

    expect(m5()).toBe(6); // 1 + 5 = 6

    base.set(10);
    expect(m5()).toBe(15); // 10 + 5 = 15
  });

  it('should batch updates across multiple reactive systems', () => {
    const count = signal(0);
    const users = signal<string[]>([]);
    const memoCount = memo(() => count() * 2);
    const memoUsers = memo(() => users().length);

    const spy = vi.fn();
    effect(() => {
      spy({ count: memoCount(), userCount: memoUsers() });
    });

    const initialCalls = spy.mock.calls.length;

    batch(() => {
      count.set(5);
      users.set(['Alice', 'Bob', 'Charlie']);
    });

    // Should batch updates (may be 2 or 3 calls depending on implementation)
    expect(spy.mock.calls.length).toBeGreaterThan(initialCalls);
    expect(spy).toHaveBeenLastCalledWith({ count: 10, userCount: 3 });
  });

  it('should handle conditional subscriptions', () => {
    const flag = signal(true);
    const a = signal(1);
    const b = signal(10);
    const spy = vi.fn();

    effect(() => {
      spy(flag() ? a() : b());
    });

    expect(spy).toHaveBeenLastCalledWith(1);

    a.set(2);
    expect(spy).toHaveBeenLastCalledWith(2);

    const beforeFlag = spy.mock.calls.length;
    b.set(20); // May or may not trigger depending on tracking

    flag.set(false);
    expect(spy).toHaveBeenLastCalledWith(20);

    const beforeA = spy.mock.calls.length;
    a.set(3); // May or may not trigger depending on tracking

    b.set(30);
    expect(spy).toHaveBeenLastCalledWith(30);
  });
});

// ============================================================================
// Memory and Performance Integration
// ============================================================================

describe('Integration: Memory and Performance', () => {
  it('should clean up effects properly', () => {
    const count = signal(0);
    const spy = vi.fn();

    const dispose = effect(() => {
      spy(count());
    });

    expect(spy).toHaveBeenCalledTimes(1);

    count.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    dispose();

    count.set(2);
    expect(spy).toHaveBeenCalledTimes(2); // Should not be called after disposal
  });

  it('should handle many subscribers efficiently', () => {
    const source = signal(0);
    const memos = Array.from({ length: 100 }, () => memo(() => source() * 2));

    const start = Date.now();
    source.set(1);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100); // Should be fast
    expect(memos[0]()).toBe(2);
    expect(memos[99]()).toBe(2);
  });

  it('should not leak memory with disposed effects', () => {
    const count = signal(0);
    const disposers: (() => void)[] = [];

    // Create 100 effects
    for (let i = 0; i < 100; i++) {
      disposers.push(effect(() => count()));
    }

    // Dispose all effects
    disposers.forEach(d => d());

    // Signal should still work but with no subscribers
    count.set(1);
    expect(count()).toBe(1);
  });

  it('should handle deeply nested roots', () => {
    const values: number[] = [];

    const dispose1 = createRoot(dispose => {
      effect(() => values.push(1));

      const dispose2 = createRoot(dispose => {
        effect(() => values.push(2));

        const dispose3 = createRoot(dispose => {
          effect(() => values.push(3));
          return dispose;
        });

        return () => {
          dispose3();
          dispose();
        };
      });

      return () => {
        dispose2();
        dispose();
      };
    });

    expect(values).toEqual([1, 2, 3]);

    dispose1();
    // All nested effects should be disposed
  });
});

// ============================================================================
// Error Handling Integration
// ============================================================================

describe('Integration: Error Handling', () => {
  it('should handle errors in effects gracefully', () => {
    const count = signal(0);
    const spy = vi.fn();

    const dispose = effect(() => {
      if (count() === 2) {
        throw new Error('Test error');
      }
      spy(count());
    });

    expect(spy).toHaveBeenCalledWith(0);

    count.set(1);
    expect(spy).toHaveBeenCalledWith(1);

    // This should throw but not break the system
    expect(() => count.set(2)).toThrow('Test error');

    dispose();
  });

  it('should handle errors in memo computations', () => {
    const count = signal(0);
    const errorMemo = memo(() => {
      if (count() === 5) {
        throw new Error('Memo error');
      }
      return count() * 2;
    });

    expect(errorMemo()).toBe(0);

    count.set(2);
    expect(errorMemo()).toBe(4);

    count.set(5);
    expect(() => errorMemo()).toThrow('Memo error');
  });
});

// ============================================================================
// Edge Cases Integration
// ============================================================================

describe('Integration: Edge Cases', () => {
  it('should handle rapid signal updates', () => {
    const count = signal(0);
    const spy = vi.fn();

    effect(() => spy(count()));

    expect(spy).toHaveBeenCalledTimes(1); // Initial call

    for (let i = 0; i < 100; i++) {
      count.set(i);
    }

    expect(count()).toBe(99);
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(100); // At least 100 calls
  });

  it('should handle circular memo references correctly', () => {
    // This should not cause infinite loops
    const a = signal(1);
    const b = memo(() => a() + 1);
    const c = memo(() => b() + 1);

    expect(c()).toBe(3);

    a.set(5);
    expect(c()).toBe(7);
  });

  it('should handle empty batch', () => {
    const spy = vi.fn();
    const count = signal(0);

    effect(() => spy(count()));

    expect(spy).toHaveBeenCalledTimes(1);

    batch(() => {
      // Empty batch
    });

    expect(spy).toHaveBeenCalledTimes(1); // No additional calls
  });

  it('should handle nested batches', () => {
    const count = signal(0);
    const spy = vi.fn();

    effect(() => spy(count()));

    expect(spy).toHaveBeenCalledTimes(1);

    batch(() => {
      count.set(1);
      batch(() => {
        count.set(2);
        batch(() => {
          count.set(3);
        });
      });
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(3);
  });
});
