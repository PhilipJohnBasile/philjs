/**
 * Tests for Testing Utilities
 * Meta-testing to ensure our testing tools work!
 */
import { describe, it, expect } from 'vitest';
import { signal, memo, effect } from './signals';
import { jsx } from './jsx-runtime';
import { render, createTestSignal, nextTick, wait, createSpy, async as asyncUtils, mock, createTestComponent, perf } from './testing';
describe('Testing Utilities', () => {
    describe('render()', () => {
        it('should render a component', () => {
            const Component = () => jsx('div', { children: 'Hello' });
            const { html } = render(jsx(Component, {}));
            expect(html).toContain('Hello');
        });
        it('should support rerender', () => {
            const count = signal(0);
            const Component = () => jsx('div', { children: `Count: ${count()}` });
            const { html: initial, rerender } = render(jsx(Component, {}));
            expect(initial).toContain('Count: 0');
            count.set(5);
            const updated = rerender();
            expect(updated).toContain('Count: 5');
        });
        it('should get elements by test ID', () => {
            const Component = () => jsx('div', {
                'data-testid': 'greeting',
                children: 'Hello World'
            });
            const { getByTestId } = render(jsx(Component, {}));
            expect(getByTestId('greeting')).toBe('Hello World');
        });
        it('should check if HTML contains text', () => {
            const Component = () => jsx('div', { children: 'Test Content' });
            const { contains } = render(jsx(Component, {}));
            expect(contains('Test Content')).toBe(true);
            expect(contains('Missing')).toBe(false);
        });
    });
    describe('createTestSignal()', () => {
        it('should track signal updates', () => {
            const { signal: count, updates } = createTestSignal(0);
            expect(updates).toEqual([0]);
            count.set(1);
            count.set(2);
            count.set(3);
            expect(updates).toEqual([0, 1, 2, 3]);
        });
        it('should support reset', () => {
            const { signal: count, updates, reset } = createTestSignal(0);
            count.set(10);
            count.set(20);
            expect(updates).toEqual([0, 10, 20]);
            reset();
            expect(count()).toBe(0);
            expect(updates).toEqual([0]);
        });
    });
    describe('nextTick() and wait()', () => {
        it('should wait for next tick', async () => {
            let completed = false;
            setTimeout(() => {
                completed = true;
            }, 0);
            expect(completed).toBe(false);
            await nextTick();
            expect(completed).toBe(true);
        });
        it('should wait for specified duration', async () => {
            const start = Date.now();
            await wait(50);
            const duration = Date.now() - start;
            expect(duration).toBeGreaterThanOrEqual(45);
        });
    });
    describe('createSpy()', () => {
        it('should track function calls', () => {
            const spy = createSpy();
            spy(1);
            spy(2);
            spy(3);
            expect(spy.calls).toEqual([[1], [2], [3]]);
            expect(spy.callCount).toBe(3);
        });
        it('should support reset', () => {
            const spy = createSpy();
            spy();
            spy();
            expect(spy.callCount).toBe(2);
            spy.reset();
            expect(spy.callCount).toBe(0);
            expect(spy.calls).toEqual([]);
        });
    });
    describe('async.waitFor()', () => {
        it('should wait for condition to be true', async () => {
            let ready = false;
            setTimeout(() => {
                ready = true;
            }, 20);
            await asyncUtils.waitFor(() => ready, { timeout: 100, interval: 5 });
            expect(ready).toBe(true);
        });
        it('should timeout if condition never becomes true', async () => {
            await expect(async () => {
                await asyncUtils.waitFor(() => false, { timeout: 50, interval: 5 });
            }).rejects.toThrow('Timeout');
        });
    });
    describe('async.waitForSignal()', () => {
        it('should wait for signal value', async () => {
            const count = signal(0);
            setTimeout(() => {
                count.set(5);
            }, 20);
            await asyncUtils.waitForSignal(count, 5, { timeout: 100 });
            expect(count()).toBe(5);
        });
    });
    describe('mock.fn()', () => {
        it('should create a mock function', () => {
            const mockFn = mock.fn();
            mockFn(1);
            mockFn(2);
            expect(mockFn.calls).toEqual([[1], [2]]);
        });
        it('should support mockReturnValue', () => {
            const mockFn = mock.fn();
            mockFn.mockReturnValue(42);
            expect(mockFn()).toBe(42);
            expect(mockFn()).toBe(42);
        });
        it('should support mockImplementation', () => {
            const mockFn = mock.fn();
            mockFn.mockImplementation((x) => x * 2);
            expect(mockFn(5)).toBe(10);
            expect(mockFn(3)).toBe(6);
        });
    });
    describe('mock.signal()', () => {
        it('should track signal set calls', () => {
            const { signal: count, setCalls } = mock.signal(0);
            count.set(1);
            count.set(2);
            count.set(3);
            expect(setCalls).toEqual([1, 2, 3]);
        });
    });
    describe('createTestComponent()', () => {
        it('should create component test wrapper', () => {
            const Greeting = ({ name }) => jsx('div', { children: `Hello, ${name}!` });
            const TestGreeting = createTestComponent(Greeting);
            const { html } = TestGreeting.render({ name: 'Alice' });
            expect(html).toContain('Hello, Alice!');
        });
        it('should support renderToString', () => {
            const Button = ({ label }) => jsx('button', { children: label });
            const TestButton = createTestComponent(Button);
            const html = TestButton.renderToString({ label: 'Click me' });
            expect(html).toContain('Click me');
        });
    });
    describe('perf.measure()', () => {
        it('should measure execution time', () => {
            const { result, duration } = perf.measure(() => {
                let sum = 0;
                for (let i = 0; i < 1000; i++) {
                    sum += i;
                }
                return sum;
            });
            expect(result).toBe(499500);
            expect(duration).toBeGreaterThan(0);
            expect(duration).toBeLessThan(10);
        });
    });
    describe('perf.measureAsync()', () => {
        it('should measure async execution time', async () => {
            const { result, duration } = await perf.measureAsync(async () => {
                await wait(10);
                return 42;
            });
            expect(result).toBe(42);
            expect(duration).toBeGreaterThanOrEqual(9);
        });
    });
    describe('perf.assertFast()', () => {
        it('should pass if function is fast enough', () => {
            const result = perf.assertFast(() => {
                return 42;
            }, 10);
            expect(result).toBe(42);
        });
        it('should throw if function is too slow', () => {
            expect(() => {
                perf.assertFast(() => {
                    let sum = 0;
                    for (let i = 0; i < 10000000; i++) {
                        sum += i;
                    }
                    return sum;
                }, 1); // 1ms limit - will likely fail
            }).toThrow();
        });
    });
    describe('Real-World Test Scenarios', () => {
        it('should test a counter component', () => {
            const count = signal(0);
            const Counter = () => jsx('div', {
                children: [
                    jsx('span', { 'data-testid': 'count', children: `Count: ${count()}` }),
                    jsx('button', { 'data-testid': 'increment', children: '+' })
                ]
            });
            const { getByTestId, rerender } = render(jsx(Counter, {}));
            expect(getByTestId('count')).toBe('Count: 0');
            count.set(count() + 1);
            rerender();
            expect(getByTestId('count')).toBe('Count: 1');
        });
        it('should test a form with validation', () => {
            const email = signal('');
            const isValid = memo(() => email().includes('@'));
            const Form = () => jsx('form', {
                children: [
                    jsx('input', { value: email(), type: 'email' }),
                    jsx('span', {
                        'data-testid': 'validation',
                        children: isValid() ? 'Valid' : 'Invalid'
                    })
                ]
            });
            const { getByTestId, rerender } = render(jsx(Form, {}));
            expect(getByTestId('validation')).toBe('Invalid');
            email.set('test@example.com');
            rerender();
            expect(getByTestId('validation')).toBe('Valid');
        });
        it('should test effects with spy', () => {
            const count = signal(0);
            const spy = createSpy();
            const dispose = effect(() => {
                spy(count());
            });
            expect(spy.callCount).toBe(1);
            expect(spy.calls[0][0]).toBe(0);
            count.set(5);
            expect(spy.callCount).toBe(2);
            expect(spy.calls[1][0]).toBe(5);
            dispose();
        });
    });
});
//# sourceMappingURL=testing.test.js.map