/**
 * PhilJS Testing - Signal Testing Utilities
 */

export interface MockSignal<T> {
  get(): T;
  set(value: T): void;
  update(fn: (prev: T) => T): void;
  subscribe(fn: (value: T) => void): () => void;
  getHistory(): T[];
  getCallCount(): number;
  reset(): void;
}

/**
 * Create a mock signal for testing
 */
export function createMockSignal<T>(initialValue: T): MockSignal<T> {
  let value = initialValue;
  const history: T[] = [initialValue];
  const subscribers = new Set<(value: T) => void>();
  let callCount = 0;

  return {
    get() {
      callCount++;
      return value;
    },

    set(newValue: T) {
      value = newValue;
      history.push(newValue);
      subscribers.forEach(fn => fn(newValue));
    },

    update(fn: (prev: T) => T) {
      const newValue = fn(value);
      this.set(newValue);
    },

    subscribe(fn: (value: T) => void) {
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
export function signalValue<T>(signal: { get(): T }): T {
  return signal.get();
}

/**
 * Wait for a signal to have a specific value
 */
export async function waitForSignal<T>(
  signal: { get(): T; subscribe?: (fn: (v: T) => void) => () => void },
  predicate: (value: T) => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  const { promise, resolve, reject } = Promise.withResolvers<T>();

  // Check immediately
  const currentValue = signal.get();
  if (predicate(currentValue)) {
    resolve(currentValue);
    return promise;
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

    return promise;
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

  return promise;
}

/**
 * Wait for a signal to equal a specific value
 */
export async function waitForSignalValue<T>(
  signal: { get(): T; subscribe?: (fn: (v: T) => void) => () => void },
  expectedValue: T,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  await waitForSignal(signal, value => value === expectedValue, options);
}

/**
 * Assert signal was called with specific values
 */
export function assertSignalHistory<T>(
  signal: MockSignal<T>,
  expectedHistory: T[]
): void {
  const history = signal.getHistory();

  if (history.length !== expectedHistory.length) {
    throw new Error(
      `Signal history length mismatch. Expected ${expectedHistory.length}, got ${history.length}\n` +
      `Expected: ${JSON.stringify(expectedHistory)}\n` +
      `Got: ${JSON.stringify(history)}`
    );
  }

  for (let i = 0; i < expectedHistory.length; i++) {
    if (history[i] !== expectedHistory[i]) {
      throw new Error(
        `Signal history mismatch at index ${i}. Expected ${JSON.stringify(expectedHistory[i])}, got ${JSON.stringify(history[i])}`
      );
    }
  }
}

/**
 * Create a computed signal mock
 */
export function createMockComputed<T>(computeFn: () => T): MockSignal<T> {
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
