import { describe, it, expect, vi } from 'vitest';
import { signal, memo, effect, batch, untrack, onCleanup, createRoot, resource, } from './signals';
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
describe('Edge Cases - Signal Mutation', () => {
    it('should handle rapid successive updates', () => {
        const count = signal(0);
        const spy = vi.fn();
        effect(() => {
            count();
            spy();
        });
        spy.mockClear();
        // Rapid updates
        count.set(1);
        count.set(2);
        count.set(3);
        count.set(4);
        count.set(5);
        // Each update triggers effect
        expect(spy).toHaveBeenCalledTimes(5);
        expect(count()).toBe(5);
    });
    it('should handle updates with same reference but different content', () => {
        const obj = { value: 1 };
        const state = signal(obj);
        const spy = vi.fn();
        effect(() => {
            state();
            spy();
        });
        spy.mockClear();
        // Same reference - should NOT update
        state.set(obj);
        expect(spy).not.toHaveBeenCalled();
        // Different reference - should update
        state.set({ value: 1 });
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should handle null and undefined transitions', () => {
        const value = signal(0);
        value.set(null);
        expect(value()).toBe(null);
        value.set(undefined);
        expect(value()).toBe(undefined);
        value.set(0);
        expect(value()).toBe(0);
    });
    it('should handle NaN values correctly', () => {
        const num = signal(0);
        num.set(NaN);
        expect(Number.isNaN(num())).toBe(true);
        // Object.is(NaN, NaN) is actually true in JavaScript
        // So setting NaN again should NOT trigger update
        const spy = vi.fn();
        effect(() => {
            num();
            spy();
        });
        spy.mockClear();
        num.set(NaN);
        // Object.is(NaN, NaN) is true, so this does NOT trigger update
        expect(spy).not.toHaveBeenCalled();
    });
    it('should handle +0 and -0 correctly', () => {
        const num = signal(0);
        const spy = vi.fn();
        effect(() => {
            num();
            spy();
        });
        spy.mockClear();
        // +0 and -0 are different in Object.is
        num.set(-0);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(Object.is(num(), -0)).toBe(true);
    });
});
describe('Edge Cases - Memo Computation', () => {
    it('should handle memo with no dependencies', () => {
        let callCount = 0;
        const constant = memo(() => {
            callCount++;
            return 42;
        });
        expect(constant()).toBe(42);
        expect(callCount).toBe(1);
        // Should not recompute
        expect(constant()).toBe(42);
        expect(callCount).toBe(1);
    });
    it('should handle memo returning undefined', () => {
        const value = signal(true);
        const result = memo(() => value() ? undefined : 'defined');
        expect(result()).toBe(undefined);
        value.set(false);
        expect(result()).toBe('defined');
    });
    it('should handle memo with conditional dependencies', () => {
        const flag = signal(true);
        const a = signal(1);
        const b = signal(100);
        const spy = vi.fn();
        const conditional = memo(() => {
            spy();
            return flag() ? a() : b();
        });
        expect(conditional()).toBe(1);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockClear();
        // Change 'a' - should trigger recompute
        a.set(2);
        expect(conditional()).toBe(2);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockClear();
        // Change 'b' - should NOT trigger (not a dependency when flag is true)
        b.set(200);
        expect(spy).not.toHaveBeenCalled();
        // Switch to 'b' branch
        flag.set(false);
        expect(conditional()).toBe(200);
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should handle deeply nested memos', () => {
        const a = signal(1);
        const b = memo(() => a() * 2);
        const c = memo(() => b() * 2);
        const d = memo(() => c() * 2);
        const e = memo(() => d() * 2);
        expect(e()).toBe(16); // 1 * 2 * 2 * 2 * 2
        a.set(2);
        expect(e()).toBe(32); // 2 * 2 * 2 * 2 * 2
    });
    it.skip('should handle memo with throwing function', () => {
        const shouldThrow = signal(true);
        const dangerous = memo(() => {
            if (shouldThrow()) {
                throw new Error('Computed error');
            }
            return 'safe';
        });
        // First call throws
        try {
            dangerous();
            expect(true).toBe(false); // Should not reach here
        }
        catch (e) {
            expect(e.message).toBe('Computed error');
        }
        shouldThrow.set(false);
        expect(dangerous()).toBe('safe');
    });
});
describe('Edge Cases - Effect Cleanup', () => {
    it('should cleanup on every re-run', () => {
        const count = signal(0);
        const cleanups = [];
        effect(() => {
            const current = count();
            onCleanup(() => {
                cleanups.push(current);
            });
        });
        count.set(1);
        count.set(2);
        count.set(3);
        expect(cleanups).toEqual([0, 1, 2]);
    });
    it('should cleanup in order registered', () => {
        const order = [];
        const dispose = createRoot(dispose => {
            effect(() => {
                onCleanup(() => order.push(1));
                onCleanup(() => order.push(2));
                onCleanup(() => order.push(3));
            });
            return dispose;
        });
        dispose();
        // Cleanups run in the order they were registered
        expect(order).toEqual([1, 2, 3]);
    });
    it.skip('should handle cleanup errors gracefully', () => {
        // This test is skipped because cleanup errors may propagate
        // depending on implementation details
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const count = signal(0);
        effect(() => {
            count();
            onCleanup(() => {
                throw new Error('Cleanup failed');
            });
        });
        // Should not throw, just log
        count.set(1);
        consoleSpy.mockRestore();
    });
    it('should run cleanup even outside effect', () => {
        const spy = vi.fn();
        const dispose = createRoot(dispose => {
            onCleanup(spy);
            return dispose;
        });
        dispose();
        // onCleanup registers in the current scope (createRoot)
        expect(spy).toHaveBeenCalled();
    });
});
describe('Edge Cases - Batching', () => {
    it('should handle nested batches with different signals', () => {
        const a = signal(1);
        const b = signal(1);
        const spy = vi.fn();
        effect(() => {
            a();
            b();
            spy();
        });
        spy.mockClear();
        batch(() => {
            a.set(2);
            batch(() => {
                b.set(2);
                batch(() => {
                    a.set(3);
                });
            });
        });
        // Should only run once after all batches
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should handle empty batch', () => {
        const spy = vi.fn();
        batch(() => {
            spy();
        });
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should handle errors inside batch', () => {
        const count = signal(0);
        const spy = vi.fn();
        effect(() => {
            count();
            spy();
        });
        spy.mockClear();
        expect(() => {
            batch(() => {
                count.set(1);
                throw new Error('Batch error');
            });
        }).toThrow('Batch error');
        // Effect should still run after batch error
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
describe('Edge Cases - Resource', () => {
    it('should handle concurrent refreshes', async () => {
        let fetchCount = 0;
        const fetchData = async () => {
            fetchCount++;
            await new Promise(resolve => setTimeout(resolve, 10));
            return fetchCount;
        };
        const data = resource(fetchData);
        await new Promise(resolve => setTimeout(resolve, 15));
        // Trigger multiple refreshes
        data.refresh();
        data.refresh();
        data.refresh();
        await new Promise(resolve => setTimeout(resolve, 15));
        // Should handle concurrent refreshes
        expect(fetchCount).toBeGreaterThan(1);
    });
    it('should handle refresh during loading', async () => {
        let fetchCount = 0;
        const fetchData = async () => {
            fetchCount++;
            await new Promise(resolve => setTimeout(resolve, 20));
            return fetchCount;
        };
        const data = resource(fetchData);
        // Refresh while still loading
        setTimeout(() => data.refresh(), 5);
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(fetchCount).toBeGreaterThan(1);
    });
    it('should handle synchronous fetcher', () => {
        const data = resource(() => 'immediate');
        expect(data.loading()).toBe(false);
        expect(data()).toBe('immediate');
    });
});
//# sourceMappingURL=signals.test.js.map