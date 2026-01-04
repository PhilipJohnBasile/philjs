/**
 * PhilJS Testing Utilities
 * Makes it easy to test PhilJS components and applications
 */
import { createRoot, signal } from './signals.js';
import { jsx } from './jsx-runtime.js';
import { renderToString } from './render-to-string.js';
/**
 * Render a component for testing
 */
export function render(component) {
    let dispose = null;
    const doRender = () => {
        if (dispose) {
            dispose();
        }
        let html = '';
        dispose = createRoot((d) => {
            html = renderToString(component);
            return d;
        });
        return html;
    };
    let html = doRender();
    return {
        html,
        rerender: () => {
            html = doRender();
            return html;
        },
        cleanup: () => {
            if (dispose) {
                dispose();
            }
        },
        getByTestId: (testId) => {
            const regex = new RegExp(`data-testid="${testId}"[^>]*>([^<]*)<`, 'i');
            const match = html.match(regex);
            return match ? match[1] : null;
        },
        queryAll: (selector) => {
            // Simple selector matching for testing
            const matches = [];
            const tagMatch = selector.match(/^([a-z]+)/);
            if (tagMatch) {
                const tag = tagMatch[1];
                const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi');
                let match;
                while ((match = regex.exec(html)) !== null) {
                    matches.push(match[1]);
                }
            }
            return matches;
        },
        contains: (text) => {
            return html.includes(text);
        }
    };
}
/**
 * Create a test signal that tracks all updates
 */
export function createTestSignal(initialValue) {
    const updates = [initialValue];
    const sig = signal(initialValue);
    let tracking = true;
    const originalSet = sig.set;
    sig.set = (value) => {
        const newValue = typeof value === 'function'
            ? value(sig())
            : value;
        if (tracking) {
            updates.push(newValue);
        }
        originalSet(newValue);
    };
    return {
        signal: sig,
        updates,
        reset: () => {
            tracking = false;
            originalSet(initialValue);
            updates.length = 0;
            updates.push(initialValue);
            tracking = true;
        }
    };
}
/**
 * Wait for next tick (useful for async tests)
 */
export function nextTick() {
    return new Promise(resolve => setTimeout(resolve, 0));
}
/**
 * Wait for a specific amount of time
 */
export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Create a spy function that tracks calls
 */
export function createSpy() {
    const calls = [];
    const results = [];
    const spy = ((...args) => {
        calls.push(args);
        const result = undefined;
        results.push(result);
        return result;
    });
    spy.calls = calls;
    spy.results = results;
    Object.defineProperty(spy, 'callCount', {
        get: () => calls.length
    });
    spy.reset = () => {
        calls.length = 0;
        results.length = 0;
    };
    return spy;
}
/**
 * Assert that a value is truthy
 */
export function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}
/**
 * Test utilities for async operations
 */
export const async = {
    /** Wait for a condition to be true */
    waitFor: async (condition, options = {}) => {
        const { timeout = 1000, interval = 10 } = options;
        const start = Date.now();
        while (!condition()) {
            if (Date.now() - start > timeout) {
                throw new Error(`Timeout waiting for condition after ${timeout}ms`);
            }
            await wait(interval);
        }
    },
    /** Wait for a signal to have a specific value */
    waitForSignal: async (signal, expectedValue, options) => {
        await async.waitFor(() => signal() === expectedValue, options);
    }
};
/**
 * Snapshot testing utility
 */
export class SnapshotTester {
    snapshots = new Map();
    snapshot(name, value) {
        if (!this.snapshots.has(name)) {
            this.snapshots.set(name, value);
            return;
        }
        const existing = this.snapshots.get(name);
        if (existing !== value) {
            throw new Error(`Snapshot mismatch for "${name}"\nExpected:\n${existing}\n\nReceived:\n${value}`);
        }
    }
    update(name, value) {
        this.snapshots.set(name, value);
    }
    clear() {
        this.snapshots.clear();
    }
}
/**
 * Mock utilities
 */
export const mock = {
    /** Create a mock function */
    fn: (implementation) => {
        const calls = [];
        const returns = [];
        let impl = implementation;
        const mockFn = ((...args) => {
            calls.push(args);
            const result = impl ? impl(...args) : undefined;
            returns.push(result);
            return result;
        });
        mockFn.calls = calls;
        mockFn.returns = returns;
        mockFn.mockReturnValue = (value) => {
            impl = (() => value);
        };
        mockFn.mockImplementation = (newImpl) => {
            impl = newImpl;
        };
        return mockFn;
    },
    /** Create a mock signal */
    signal: (initialValue) => {
        const sig = signal(initialValue);
        const setCalls = [];
        const originalSet = sig.set;
        sig.set = (value) => {
            const newValue = typeof value === 'function'
                ? value(sig())
                : value;
            setCalls.push(newValue);
            originalSet(newValue);
        };
        return {
            signal: sig,
            setCalls
        };
    }
};
/**
 * Create a test component wrapper
 */
export function createTestComponent(Component) {
    return {
        render: (props) => render(jsx(Component, props)),
        renderToString: (props) => renderToString(jsx(Component, props))
    };
}
/**
 * Batch test assertions
 */
export function expectAll(...assertions) {
    const errors = [];
    for (const assertion of assertions) {
        try {
            assertion();
        }
        catch (error) {
            errors.push(error);
        }
    }
    if (errors.length > 0) {
        throw new Error(`Multiple assertions failed:\n${errors.map(e => e.message).join('\n')}`);
    }
}
/**
 * Performance testing utilities
 */
export const perf = {
    /** Measure execution time */
    measure: (fn) => {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        return { result, duration };
    },
    /** Measure async execution time */
    measureAsync: async (fn) => {
        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;
        return { result, duration };
    },
    /** Assert function executes within time limit */
    assertFast: (fn, maxDuration) => {
        const { result, duration } = perf.measure(fn);
        if (duration > maxDuration) {
            throw new Error(`Function took ${duration}ms, expected < ${maxDuration}ms`);
        }
        return result;
    }
};
//# sourceMappingURL=testing.js.map