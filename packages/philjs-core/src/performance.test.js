/**
 * Performance Tests - Proving PhilJS is Fast
 * These tests demonstrate real performance, not just theory
 */
import { describe, it, expect } from 'vitest';
import { signal, memo, effect, batch } from './signals';
import { jsx } from './jsx-runtime';
import { renderToString } from './render-to-string';
describe('PhilJS Performance - Proving It\'s Fast', () => {
    it('✓ Creates 10,000 signals in <50ms', () => {
        const start = performance.now();
        for (let i = 0; i < 10000; i++) {
            signal(i);
        }
        const duration = performance.now() - start;
        console.log(`  → Created 10,000 signals in ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(50);
    });
    it('✓ Updates 100,000 signal values in <100ms', () => {
        const signals = Array.from({ length: 1000 }, () => signal(0));
        const start = performance.now();
        for (let i = 0; i < 100; i++) {
            signals.forEach(s => s.set(i));
        }
        const duration = performance.now() - start;
        console.log(`  → Updated 100k signal values in ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(100);
    });
    it('✓ Handles 1,000 computed values efficiently', () => {
        const source = signal(0);
        const memos = Array.from({ length: 1000 }, () => memo(() => source() * 2));
        const start = performance.now();
        source.set(5);
        memos.forEach(m => m()); // Force evaluation
        const duration = performance.now() - start;
        console.log(`  → Computed 1,000 memos in ${duration.toFixed(2)}ms`);
        // Increased threshold for CI variability
        expect(duration).toBeLessThan(50);
    });
    it('✓ Batches 10,000 updates into single effect run', () => {
        const signals = Array.from({ length: 100 }, () => signal(0));
        let effectRuns = 0;
        const dispose = effect(() => {
            signals.forEach(s => s());
            effectRuns++;
        });
        const start = performance.now();
        batch(() => {
            signals.forEach((s, i) => s.set(i));
        });
        const duration = performance.now() - start;
        console.log(`  → Batched 100 updates in ${duration.toFixed(2)}ms, effect ran ${effectRuns} times`);
        expect(effectRuns).toBe(2); // Initial + 1 batched
        expect(duration).toBeLessThan(10);
        dispose();
    });
    it('✓ SSR renders 1,000 items in <50ms', () => {
        const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `Item ${i}` }));
        const List = () => jsx('ul', {
            children: items.map(item => jsx('li', { key: item.id, children: item.text }))
        });
        const start = performance.now();
        const html = renderToString(jsx(List, {}));
        const duration = performance.now() - start;
        console.log(`  → SSR rendered 1,000 items in ${duration.toFixed(2)}ms`);
        expect(html).toContain('Item 0');
        expect(html).toContain('Item 999');
        expect(duration).toBeLessThan(50);
    });
    it('✓ SSR renders complex dashboard in <30ms', () => {
        const data = Array.from({ length: 100 }, (_, i) => ({
            id: i,
            name: `User ${i}`,
            email: `user${i}@example.com`,
            score: Math.random() * 100
        }));
        const Dashboard = () => jsx('div', {
            className: 'dashboard',
            children: [
                jsx('h1', { children: 'Dashboard' }),
                jsx('div', { className: 'stats', children: [
                        jsx('span', { children: `Total: ${data.length}` }),
                        jsx('span', { children: `Avg: ${(data.reduce((s, d) => s + d.score, 0) / data.length).toFixed(2)}` })
                    ] }),
                jsx('table', { children: [
                        jsx('thead', { children: jsx('tr', { children: [
                                    jsx('th', { children: 'Name' }),
                                    jsx('th', { children: 'Email' }),
                                    jsx('th', { children: 'Score' })
                                ] }) }),
                        jsx('tbody', { children: data.slice(0, 50).map(user => jsx('tr', { key: user.id, children: [
                                    jsx('td', { children: user.name }),
                                    jsx('td', { children: user.email }),
                                    jsx('td', { children: user.score.toFixed(2) })
                                ] })) })
                    ] })
            ]
        });
        const start = performance.now();
        const html = renderToString(jsx(Dashboard, {}));
        const duration = performance.now() - start;
        console.log(`  → SSR rendered complex dashboard in ${duration.toFixed(2)}ms`);
        expect(html).toContain('Dashboard');
        expect(html).toContain('User 0');
        expect(duration).toBeLessThan(30);
    });
    it('✓ Handles diamond dependency graph without over-computing', () => {
        const source = signal(1);
        let computations = 0;
        const left = memo(() => {
            computations++;
            return source() * 2;
        });
        const right = memo(() => {
            computations++;
            return source() + 10;
        });
        const combined = memo(() => {
            computations++;
            return left() + right();
        });
        computations = 0;
        source.set(2);
        combined(); // Force evaluation
        console.log(`  → Diamond graph computed ${computations} times (should be 3)`);
        expect(computations).toBe(3); // left, right, combined - no duplicates!
    });
    it('✓ Counter app: 1,000 increments in <20ms', () => {
        const count = signal(0);
        const doubled = memo(() => count() * 2);
        let effectRuns = 0;
        const dispose = effect(() => {
            doubled();
            effectRuns++;
        });
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            count.set(i);
        }
        const duration = performance.now() - start;
        console.log(`  → 1,000 counter increments in ${duration.toFixed(2)}ms`);
        expect(count()).toBe(999);
        expect(doubled()).toBe(1998);
        expect(duration).toBeLessThan(20);
        dispose();
    });
    it('✓ Memory efficient: 100,000 signals use <100MB', () => {
        const initialMemory = process.memoryUsage().heapUsed;
        const signals = Array.from({ length: 100000 }, (_, i) => signal(i));
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryUsed = (finalMemory - initialMemory) / (1024 * 1024);
        console.log(`  → 100,000 signals used ${memoryUsed.toFixed(2)}MB`);
        expect(memoryUsed).toBeLessThan(100);
        // Keep reference
        expect(signals.length).toBe(100000);
    });
});
describe('Performance Comparison Targets', () => {
    it('PhilJS: 100k signal updates benchmark', () => {
        const signals = Array.from({ length: 1000 }, () => signal(0));
        const start = performance.now();
        for (let i = 0; i < 100; i++) {
            signals.forEach(s => s.set(i));
        }
        const duration = performance.now() - start;
        console.log(`\n📊 PhilJS Performance:`);
        console.log(`  → 100,000 signal updates: ${duration.toFixed(2)}ms`);
        console.log(`  → ${(100000 / duration * 1000).toFixed(0)} updates/sec`);
        // Increased threshold for CI variability
        expect(duration).toBeLessThan(200);
    });
    it('PhilJS: 10k element SSR benchmark', () => {
        const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
        const List = () => jsx('ul', {
            children: items.map(item => jsx('li', { key: item.id, children: item.name }))
        });
        const start = performance.now();
        const html = renderToString(jsx(List, {}));
        const duration = performance.now() - start;
        console.log(`  → 10,000 element SSR: ${duration.toFixed(2)}ms`);
        console.log(`  → ${(10000 / duration * 1000).toFixed(0)} elements/sec`);
        expect(duration).toBeLessThan(200);
        expect(html).toContain('Item 9999');
    });
});
//# sourceMappingURL=performance.test.js.map