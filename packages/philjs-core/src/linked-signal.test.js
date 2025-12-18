/**
 * Linked Signal Tests - Writable Computed Signals
 * Tests for Angular-inspired linkedSignal (writable computed values)
 */
import { describe, it, expect } from 'vitest';
import { signal, linkedSignal, effect } from './signals';
describe('linkedSignal - Writable Computed', () => {
    describe('Basic Functionality', () => {
        it('should compute initial value from dependencies', () => {
            const firstName = signal('John');
            const lastName = signal('Doe');
            const fullName = linkedSignal(() => `${firstName()} ${lastName()}`);
            expect(fullName()).toBe('John Doe');
        });
        it('should recompute when dependencies change', () => {
            const a = signal(5);
            const b = signal(10);
            const sum = linkedSignal(() => a() + b());
            expect(sum()).toBe(15);
            a.set(20);
            expect(sum()).toBe(30);
            b.set(5);
            expect(sum()).toBe(25);
        });
        it('should allow manual override via set()', () => {
            const count = signal(0);
            const doubled = linkedSignal(() => count() * 2);
            expect(doubled()).toBe(0);
            // Manual override
            doubled.set(100);
            expect(doubled()).toBe(100);
            expect(doubled.isOverridden()).toBe(true);
        });
        it('should reset to computed value when dependencies change after override', () => {
            const firstName = signal('John');
            const lastName = signal('Doe');
            const fullName = linkedSignal(() => `${firstName()} ${lastName()}`);
            expect(fullName()).toBe('John Doe');
            // Manual override
            fullName.set('Jane Smith');
            expect(fullName()).toBe('Jane Smith');
            expect(fullName.isOverridden()).toBe(true);
            // Dependency changed - should reset to computed
            firstName.set('Bob');
            expect(fullName()).toBe('Bob Doe');
            expect(fullName.isOverridden()).toBe(false);
        });
    });
    describe('Manual Reset', () => {
        it('should reset to computed value via reset()', () => {
            const count = signal(5);
            const doubled = linkedSignal(() => count() * 2);
            expect(doubled()).toBe(10);
            doubled.set(999);
            expect(doubled()).toBe(999);
            expect(doubled.isOverridden()).toBe(true);
            // Manual reset
            doubled.reset();
            expect(doubled()).toBe(10);
            expect(doubled.isOverridden()).toBe(false);
        });
        it('should recompute after reset if dependencies changed', () => {
            const a = signal(1);
            const b = signal(2);
            const sum = linkedSignal(() => a() + b());
            sum.set(100);
            expect(sum()).toBe(100);
            // Change dependencies while overridden
            a.set(10);
            b.set(20);
            // Reset should recompute with new values
            sum.reset();
            expect(sum()).toBe(30);
        });
    });
    describe('Options: resetOnChange', () => {
        it('should NOT reset when resetOnChange is false', () => {
            const count = signal(0);
            const doubled = linkedSignal(() => count() * 2, { resetOnChange: false });
            expect(doubled()).toBe(0);
            doubled.set(100);
            expect(doubled()).toBe(100);
            // Dependency changed - but should NOT reset
            count.set(10);
            expect(doubled()).toBe(100);
            expect(doubled.isOverridden()).toBe(true);
        });
        it('should still recompute if not overridden with resetOnChange false', () => {
            const count = signal(0);
            const doubled = linkedSignal(() => count() * 2, { resetOnChange: false });
            expect(doubled()).toBe(0);
            count.set(5);
            expect(doubled()).toBe(10); // Still recomputes since not overridden
        });
    });
    describe('Reactivity', () => {
        it('should trigger effects when set manually', () => {
            const count = signal(0);
            const doubled = linkedSignal(() => count() * 2);
            let effectRuns = 0;
            let lastValue = 0;
            const dispose = effect(() => {
                lastValue = doubled();
                effectRuns++;
            });
            expect(effectRuns).toBe(1);
            expect(lastValue).toBe(0);
            // Manual set should trigger effect
            doubled.set(50);
            expect(effectRuns).toBe(2);
            expect(lastValue).toBe(50);
            dispose();
        });
        it('should trigger effects when dependencies change', () => {
            const count = signal(0);
            const doubled = linkedSignal(() => count() * 2);
            let effectRuns = 0;
            let lastValue = 0;
            const dispose = effect(() => {
                lastValue = doubled();
                effectRuns++;
            });
            expect(effectRuns).toBe(1);
            count.set(5);
            expect(effectRuns).toBe(2);
            expect(lastValue).toBe(10);
            dispose();
        });
        it('should trigger effects when reset', () => {
            const count = signal(5);
            const doubled = linkedSignal(() => count() * 2);
            let effectRuns = 0;
            const dispose = effect(() => {
                doubled();
                effectRuns++;
            });
            doubled.set(999);
            expect(effectRuns).toBe(2);
            doubled.reset();
            expect(effectRuns).toBe(3);
            dispose();
        });
    });
    describe('Updater Functions', () => {
        it('should support updater function in set()', () => {
            const count = signal(0);
            const value = linkedSignal(() => count() * 2);
            value.set(v => v + 10);
            expect(value()).toBe(10);
            value.set(v => v * 2);
            expect(value()).toBe(20);
        });
    });
    describe('Complex Dependencies', () => {
        it('should handle multiple dependencies', () => {
            const a = signal(1);
            const b = signal(2);
            const c = signal(3);
            const sum = linkedSignal(() => a() + b() + c());
            expect(sum()).toBe(6);
            sum.set(100);
            expect(sum()).toBe(100);
            // Any dependency change should reset
            b.set(10);
            expect(sum()).toBe(14); // 1 + 10 + 3
            expect(sum.isOverridden()).toBe(false);
        });
        it('should handle computed dependencies', () => {
            const count = signal(1);
            const doubled = linkedSignal(() => count() * 2);
            const quadrupled = linkedSignal(() => doubled() * 2);
            expect(quadrupled()).toBe(4);
            quadrupled.set(100);
            expect(quadrupled()).toBe(100);
            // Changing count should reset both
            count.set(5);
            expect(doubled()).toBe(10);
            expect(quadrupled()).toBe(20);
        });
    });
    describe('Real-World Use Cases', () => {
        it('Form field with validation - can be computed or manually set', () => {
            const firstName = signal('John');
            const lastName = signal('Doe');
            const email = signal('');
            // Email auto-generated from name, but can be manually overridden
            const autoEmail = linkedSignal(() => {
                const first = firstName().toLowerCase();
                const last = lastName().toLowerCase();
                return `${first}.${last}@example.com`;
            });
            expect(autoEmail()).toBe('john.doe@example.com');
            // User manually sets custom email
            autoEmail.set('custom@example.com');
            expect(autoEmail()).toBe('custom@example.com');
            // Name changes - resets to auto-generated
            firstName.set('Jane');
            expect(autoEmail()).toBe('jane.doe@example.com');
        });
        it('Search filter with smart defaults', () => {
            const category = signal('electronics');
            const priceRange = signal('$0-$100');
            // Auto-generate search query
            const searchQuery = linkedSignal(() => {
                return `${category()} ${priceRange()}`;
            });
            expect(searchQuery()).toBe('electronics $0-$100');
            // User manually types custom query
            searchQuery.set('laptop under $500');
            expect(searchQuery()).toBe('laptop under $500');
            // Category changes - resets to auto-generated
            category.set('books');
            expect(searchQuery()).toBe('books $0-$100');
        });
        it('Slider with calculated value that can be manually adjusted', () => {
            const min = signal(0);
            const max = signal(100);
            // Default to midpoint
            const value = linkedSignal(() => (min() + max()) / 2);
            expect(value()).toBe(50);
            // User drags slider
            value.set(75);
            expect(value()).toBe(75);
            // Range changes - resets to new midpoint
            max.set(200);
            expect(value()).toBe(100); // (0 + 200) / 2
        });
        it('Theme color with smart defaults', () => {
            const primaryColor = signal('#3b82f6');
            const isDark = signal(false);
            // Auto-generate background color based on theme
            const backgroundColor = linkedSignal(() => {
                return isDark() ? '#1a1a1a' : '#ffffff';
            });
            expect(backgroundColor()).toBe('#ffffff');
            // User manually sets custom background
            backgroundColor.set('#f0f0f0');
            expect(backgroundColor()).toBe('#f0f0f0');
            // Theme changes - resets to auto-generated
            isDark.set(true);
            expect(backgroundColor()).toBe('#1a1a1a');
        });
    });
    describe('Edge Cases', () => {
        it('should handle undefined values', () => {
            const source = signal(undefined);
            const linked = linkedSignal(() => source()?.toUpperCase());
            expect(linked()).toBe(undefined);
            source.set('hello');
            expect(linked()).toBe('HELLO');
            linked.set('WORLD');
            expect(linked()).toBe('WORLD');
            source.set(undefined);
            expect(linked()).toBe(undefined);
        });
        it('should handle object references correctly', () => {
            const obj = signal({ name: 'John', age: 30 });
            const linked = linkedSignal(() => ({ ...obj(), computed: true }));
            expect(linked()).toEqual({ name: 'John', age: 30, computed: true });
            linked.set({ name: 'Jane', age: 25, computed: false });
            expect(linked()).toEqual({ name: 'Jane', age: 25, computed: false });
            obj.set({ name: 'Bob', age: 40 });
            expect(linked()).toEqual({ name: 'Bob', age: 40, computed: true });
        });
        it('should not trigger if value is the same (Object.is)', () => {
            const count = signal(0);
            const doubled = linkedSignal(() => count() * 2);
            let effectRuns = 0;
            const dispose = effect(() => {
                doubled();
                effectRuns++;
            });
            expect(effectRuns).toBe(1);
            // Set to same value
            doubled.set(0);
            expect(effectRuns).toBe(1); // Should not trigger
            doubled.set(10);
            expect(effectRuns).toBe(2);
            dispose();
        });
    });
    describe('Performance', () => {
        it('should not recompute unnecessarily when overridden', () => {
            let computations = 0;
            const count = signal(0);
            const doubled = linkedSignal(() => {
                computations++;
                return count() * 2;
            });
            // Initial computation
            doubled();
            expect(computations).toBe(1);
            // Override - no recomputation
            doubled.set(999);
            expect(computations).toBe(1);
            // Multiple reads while overridden - no recomputation
            doubled();
            doubled();
            doubled();
            expect(computations).toBe(1);
            // Dependency changes - resets and recomputes
            count.set(5);
            doubled();
            expect(computations).toBe(2);
        });
        it('should handle 1000 overrides efficiently', () => {
            const count = signal(0);
            const doubled = linkedSignal(() => count() * 2);
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                doubled.set(i);
            }
            const duration = performance.now() - start;
            console.log(`  → 1000 linkedSignal overrides in ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(20);
        });
    });
});
//# sourceMappingURL=linked-signal.test.js.map