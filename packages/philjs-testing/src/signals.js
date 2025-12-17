/**
 * PhilJS Testing - Signal Testing Utilities
 */
/**
 * Create a mock signal for testing
 */
export function createMockSignal(initialValue) {
    let value = initialValue;
    const history = [initialValue];
    const subscribers = new Set();
    let callCount = 0;
    return {
        get() {
            callCount++;
            return value;
        },
        set(newValue) {
            value = newValue;
            history.push(newValue);
            subscribers.forEach(fn => fn(newValue));
        },
        update(fn) {
            const newValue = fn(value);
            this.set(newValue);
        },
        subscribe(fn) {
            subscribers.add(fn);
            return () => subscribers.delete(fn);
        },
        getHistory() {
            return [...history];
        },
        getCallCount() {
            return callCount;
        },
        reset() {
            value = initialValue;
            history.length = 0;
            history.push(initialValue);
            callCount = 0;
            subscribers.clear();
        },
    };
}
/**
 * Get the current value of a signal (utility for tests)
 */
export function signalValue(signal) {
    return signal.get();
}
/**
 * Wait for a signal to have a specific value
 */
export async function waitForSignal(signal, predicate, options = {}) {
    const { timeout = 5000, interval = 50 } = options;
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
        // Check immediately
        const currentValue = signal.get();
        if (predicate(currentValue)) {
            resolve(currentValue);
            return;
        }
        // If signal has subscribe, use it
        if (signal.subscribe) {
            const unsubscribe = signal.subscribe((value) => {
                if (predicate(value)) {
                    unsubscribe();
                    resolve(value);
                }
            });
            // Timeout
            setTimeout(() => {
                unsubscribe();
                reject(new Error(`Timed out waiting for signal to match predicate after ${timeout}ms`));
            }, timeout);
            return;
        }
        // Polling fallback
        const checkValue = () => {
            const value = signal.get();
            if (predicate(value)) {
                resolve(value);
                return;
            }
            if (Date.now() - startTime >= timeout) {
                reject(new Error(`Timed out waiting for signal to match predicate after ${timeout}ms`));
                return;
            }
            setTimeout(checkValue, interval);
        };
        setTimeout(checkValue, interval);
    });
}
/**
 * Wait for a signal to equal a specific value
 */
export async function waitForSignalValue(signal, expectedValue, options = {}) {
    await waitForSignal(signal, value => value === expectedValue, options);
}
/**
 * Assert signal was called with specific values
 */
export function assertSignalHistory(signal, expectedHistory) {
    const history = signal.getHistory();
    if (history.length !== expectedHistory.length) {
        throw new Error(`Signal history length mismatch. Expected ${expectedHistory.length}, got ${history.length}\n` +
            `Expected: ${JSON.stringify(expectedHistory)}\n` +
            `Got: ${JSON.stringify(history)}`);
    }
    for (let i = 0; i < expectedHistory.length; i++) {
        if (history[i] !== expectedHistory[i]) {
            throw new Error(`Signal history mismatch at index ${i}. Expected ${JSON.stringify(expectedHistory[i])}, got ${JSON.stringify(history[i])}`);
        }
    }
}
/**
 * Create a computed signal mock
 */
export function createMockComputed(computeFn) {
    const mock = createMockSignal(computeFn());
    // Override get to always compute
    const originalGet = mock.get;
    mock.get = () => {
        const newValue = computeFn();
        if (newValue !== originalGet.call(mock)) {
            mock.set(newValue);
        }
        return newValue;
    };
    return mock;
}
//# sourceMappingURL=signals.js.map