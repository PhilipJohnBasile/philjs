# Signal Testing

PhilJS signals are the foundation of reactive state management. `@philjs/testing` provides specialized utilities for testing signals, computed values, effects, and components that use them.

## Mock Signals

### Creating Mock Signals

Use `createMockSignal` to create test-friendly signals with history tracking:

```typescript
import { createMockSignal } from '@philjs/testing';

// Create mock signal with initial value
const count = createMockSignal(0);

// Use like a regular signal
console.log(count.get()); // 0

// Set new value
count.set(5);
console.log(count.get()); // 5

// Update with function
count.update(n => n + 1);
console.log(count.get()); // 6
```

### MockSignal Interface

```typescript
interface MockSignal<T> {
  // Core signal API
  get(): T;
  set(value: T): void;
  update(fn: (prev: T) => T): void;
  subscribe(fn: (value: T) => void): () => void;

  // Testing utilities
  getHistory(): T[];
  getCallCount(): number;
  reset(): void;
}
```

### Tracking Value History

Mock signals automatically track all values:

```typescript
import { createMockSignal } from '@philjs/testing';

const count = createMockSignal(0);

count.set(1);
count.set(2);
count.set(3);

// Get all values from creation to now
const history = count.getHistory();
console.log(history); // [0, 1, 2, 3]
```

### Tracking Read Count

Track how many times a signal was read:

```typescript
import { createMockSignal } from '@philjs/testing';

const value = createMockSignal(42);

console.log(value.getCallCount()); // 0

value.get();
value.get();
value.get();

console.log(value.getCallCount()); // 3
```

### Resetting Mock Signals

Reset to initial state for test isolation:

```typescript
import { createMockSignal } from '@philjs/testing';

const count = createMockSignal(0);

count.set(10);
count.set(20);
count.get();
count.get();

// Reset everything
count.reset();

console.log(count.get()); // 0
console.log(count.getHistory()); // [0]
console.log(count.getCallCount()); // 1 (from the get() above)
```

## Signal Value Assertions

### Getting Current Value

```typescript
import { signalValue } from '@philjs/testing';
import { signal } from '@philjs/core';

const count = signal(42);

// Get current value safely
const value = signalValue(count);
console.log(value); // 42
```

### Asserting Signal History

```typescript
import { createMockSignal, assertSignalHistory } from '@philjs/testing';

const count = createMockSignal(0);

count.set(1);
count.set(2);
count.set(3);

// Assert exact history - passes
assertSignalHistory(count, [0, 1, 2, 3]);

// Assert incorrect history - throws
assertSignalHistory(count, [0, 1, 999]);
// Error: Signal history mismatch at index 2. Expected 999, got 2
```

## Async Signal Testing

### Waiting for Signal Value

Wait for a signal to reach a specific value:

```typescript
import { createMockSignal, waitForSignalValue } from '@philjs/testing';

const status = createMockSignal('loading');

// Simulate async operation
setTimeout(() => {
  status.set('success');
}, 100);

// Wait for specific value
await waitForSignalValue(status, 'success');

console.log(status.get()); // 'success'
```

### Waiting for Condition

Wait for a signal to satisfy a condition:

```typescript
import { createMockSignal, waitForSignal } from '@philjs/testing';

const count = createMockSignal(0);

// Simulate increments
const interval = setInterval(() => {
  count.update(n => n + 1);
}, 50);

// Wait for condition
await waitForSignal(count, value => value >= 5);

clearInterval(interval);
console.log(count.get()); // 5 or higher
```

### Timeout Options

Configure timeout and polling interval:

```typescript
import { waitForSignalValue, waitForSignal } from '@philjs/testing';

// With custom timeout (default: 5000ms)
await waitForSignalValue(status, 'done', { timeout: 10000 });

// With custom interval (default: 50ms)
await waitForSignal(count, v => v > 10, {
  timeout: 5000,
  interval: 100,
});

// Timeout error
try {
  await waitForSignalValue(status, 'never', { timeout: 100 });
} catch (error) {
  console.log(error.message);
  // "Timed out waiting for signal to match predicate after 100ms"
}
```

## Testing Computed Signals

### Mock Computed Signals

Create mock computed signals for testing:

```typescript
import { createMockSignal, createMockComputed } from '@philjs/testing';

const count = createMockSignal(2);

// Create computed that depends on count
const doubled = createMockComputed(() => count.get() * 2);

console.log(doubled.get()); // 4

count.set(5);
console.log(doubled.get()); // 10
```

### Testing Real Computed Signals

Test `@philjs/core` computed signals:

```typescript
import { signal, memo } from '@philjs/core';

describe('Computed Signals', () => {
  it('computes derived values', () => {
    const firstName = signal('John');
    const lastName = signal('Doe');

    const fullName = memo(() => `${firstName()} ${lastName()}`);

    expect(fullName()).toBe('John Doe');

    firstName.set('Jane');
    expect(fullName()).toBe('Jane Doe');
  });

  it('caches computed values', () => {
    let computeCount = 0;

    const data = signal([1, 2, 3]);
    const sum = memo(() => {
      computeCount++;
      return data().reduce((a, b) => a + b, 0);
    });

    // First read - computes
    expect(sum()).toBe(6);
    expect(computeCount).toBe(1);

    // Second read - cached
    expect(sum()).toBe(6);
    expect(computeCount).toBe(1);

    // Dependency changed - recomputes
    data.set([1, 2, 3, 4]);
    expect(sum()).toBe(10);
    expect(computeCount).toBe(2);
  });
});
```

## Testing Effects

### Tracking Effect Execution

```typescript
import { signal, effect } from '@philjs/core';

describe('Effects', () => {
  it('runs on signal change', () => {
    const count = signal(0);
    const executions: number[] = [];

    const dispose = effect(() => {
      executions.push(count());
    });

    expect(executions).toEqual([0]); // Initial run

    count.set(1);
    expect(executions).toEqual([0, 1]);

    count.set(2);
    expect(executions).toEqual([0, 1, 2]);

    dispose();
  });

  it('stops after dispose', () => {
    const count = signal(0);
    const executions: number[] = [];

    const dispose = effect(() => {
      executions.push(count());
    });

    expect(executions).toEqual([0]);

    dispose();

    count.set(1);
    count.set(2);

    // No new executions after dispose
    expect(executions).toEqual([0]);
  });
});
```

### Testing Effect Cleanup

```typescript
import { signal, effect } from '@philjs/core';

describe('Effect Cleanup', () => {
  it('calls cleanup on re-run', () => {
    const count = signal(0);
    const cleanup = vi.fn();

    const dispose = effect(() => {
      count(); // Track dependency
      return cleanup;
    });

    expect(cleanup).not.toHaveBeenCalled();

    count.set(1); // Re-run effect
    expect(cleanup).toHaveBeenCalledTimes(1);

    count.set(2); // Re-run again
    expect(cleanup).toHaveBeenCalledTimes(2);

    dispose(); // Final cleanup
    expect(cleanup).toHaveBeenCalledTimes(3);
  });
});
```

### Testing Effect Dependencies

```typescript
import { signal, effect } from '@philjs/core';

describe('Effect Dependencies', () => {
  it('tracks multiple dependencies', () => {
    const a = signal(1);
    const b = signal(2);
    const executions: number[] = [];

    effect(() => {
      executions.push(a() + b());
    });

    expect(executions).toEqual([3]);

    a.set(10);
    expect(executions).toEqual([3, 12]);

    b.set(20);
    expect(executions).toEqual([3, 12, 30]);
  });

  it('handles conditional dependencies', () => {
    const condition = signal(true);
    const a = signal(10);
    const b = signal(20);
    const values: number[] = [];

    effect(() => {
      values.push(condition() ? a() : b());
    });

    expect(values).toEqual([10]);

    // a is tracked, b is not
    a.set(15);
    expect(values).toEqual([10, 15]);

    b.set(25);
    expect(values).toEqual([10, 15]); // No change - b not tracked

    // Switch condition
    condition.set(false);
    expect(values).toEqual([10, 15, 25]);

    // Now b is tracked, a is not
    b.set(30);
    expect(values).toEqual([10, 15, 25, 30]);

    a.set(100);
    expect(values).toEqual([10, 15, 25, 30]); // No change - a not tracked
  });
});
```

## Testing Components with Signals

### Basic Signal Component Test

```typescript
import { render, screen, fireEvent, waitFor } from '@philjs/testing';
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <span data-testid="count">{count()}</span>
      <button onClick={() => count.update(n => n + 1)}>
        Increment
      </button>
    </div>
  );
}

describe('Counter', () => {
  it('increments on click', async () => {
    render(<Counter />);

    expect(screen.getByTestId('count')).toHaveTextContent('0');

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });
  });
});
```

### Testing External Signals

```typescript
import { render, screen, waitFor } from '@philjs/testing';
import { signal } from '@philjs/core';

function Display({ value }: { value: { (): number } }) {
  return <span data-testid="value">{value()}</span>;
}

describe('Display', () => {
  it('updates when external signal changes', async () => {
    const count = signal(0);

    render(<Display value={count} />);

    expect(screen.getByTestId('value')).toHaveTextContent('0');

    // Update signal externally
    count.set(42);

    await waitFor(() => {
      expect(screen.getByTestId('value')).toHaveTextContent('42');
    });
  });
});
```

### Testing Signal Props

```typescript
import { render, screen, fireEvent, waitFor } from '@philjs/testing';
import { createMockSignal } from '@philjs/testing';

interface TodoItemProps {
  text: string;
  completed: { (): boolean; set(v: boolean): void };
}

function TodoItem({ text, completed }: TodoItemProps) {
  return (
    <label>
      <input
        type="checkbox"
        checked={completed()}
        onChange={() => completed.set(!completed())}
      />
      {text}
    </label>
  );
}

describe('TodoItem', () => {
  it('toggles completed state', async () => {
    const completed = createMockSignal(false);

    render(<TodoItem text="Buy groceries" completed={completed} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });

    expect(completed.getHistory()).toEqual([false, true]);
  });
});
```

## Testing Signal Subscriptions

### Manual Subscriptions

```typescript
import { createMockSignal } from '@philjs/testing';

describe('Signal Subscriptions', () => {
  it('notifies subscribers', () => {
    const count = createMockSignal(0);
    const calls: number[] = [];

    const unsubscribe = count.subscribe(value => {
      calls.push(value);
    });

    count.set(1);
    count.set(2);
    count.set(3);

    expect(calls).toEqual([1, 2, 3]);

    unsubscribe();

    count.set(4);
    expect(calls).toEqual([1, 2, 3]); // No new calls
  });

  it('supports multiple subscribers', () => {
    const value = createMockSignal('initial');
    const calls1: string[] = [];
    const calls2: string[] = [];

    const unsub1 = value.subscribe(v => calls1.push(v));
    const unsub2 = value.subscribe(v => calls2.push(v));

    value.set('updated');

    expect(calls1).toEqual(['updated']);
    expect(calls2).toEqual(['updated']);

    unsub1();
    value.set('final');

    expect(calls1).toEqual(['updated']); // Unsubscribed
    expect(calls2).toEqual(['updated', 'final']); // Still subscribed

    unsub2();
  });
});
```

## Advanced Signal Patterns

### Signal Chains

```typescript
import { signal, memo } from '@philjs/core';

describe('Signal Chains', () => {
  it('propagates through chain', () => {
    const base = signal(2);
    const doubled = memo(() => base() * 2);
    const quadrupled = memo(() => doubled() * 2);

    expect(quadrupled()).toBe(8);

    base.set(3);
    expect(quadrupled()).toBe(12);

    base.set(5);
    expect(quadrupled()).toBe(20);
  });
});
```

### Diamond Dependency

```typescript
import { signal, memo } from '@philjs/core';

describe('Diamond Dependency', () => {
  it('handles diamond pattern correctly', () => {
    //     source
    //    /      \
    //  left    right
    //    \      /
    //    combined

    const source = signal(1);
    const left = memo(() => source() * 2);
    const right = memo(() => source() + 10);
    const combined = memo(() => left() + right());

    expect(combined()).toBe(13); // (1*2) + (1+10)

    source.set(2);
    expect(combined()).toBe(16); // (2*2) + (2+10)
  });
});
```

### Batched Updates

```typescript
import { signal, batch } from '@philjs/core';

describe('Batched Updates', () => {
  it('batches multiple updates', () => {
    const a = signal(1);
    const b = signal(2);
    const effectRuns: number[] = [];

    effect(() => {
      effectRuns.push(a() + b());
    });

    expect(effectRuns).toEqual([3]);

    // Without batch - effect runs twice
    a.set(10);
    b.set(20);
    expect(effectRuns).toEqual([3, 12, 30]);

    // With batch - effect runs once
    batch(() => {
      a.set(100);
      b.set(200);
    });
    expect(effectRuns).toEqual([3, 12, 30, 300]);
  });
});
```

## Snapshot Testing with Signals

### Snapshot Signal State

```typescript
import { snapshotSignalState } from '@philjs/testing';
import { signal } from '@philjs/core';

it('captures signal state', () => {
  const count = signal(5);
  const name = signal('test');
  const items = signal([1, 2, 3]);

  const snapshot = snapshotSignalState({ count, name, items });

  expect(snapshot).toMatchInlineSnapshot(`
    {
      "count": 5,
      "name": "test",
      "items": [1, 2, 3]
    }
  `);
});
```

### Compare Signal Snapshots

```typescript
import { compareSignalSnapshots } from '@philjs/testing';
import { signal } from '@philjs/core';

it('compares signal states', () => {
  const count = signal(5);
  const name = signal('test');

  const result = compareSignalSnapshots(
    { count, name },
    { count: 5, name: 'test' }
  );

  expect(result.match).toBe(true);
});

it('detects differences', () => {
  const count = signal(10);

  const result = compareSignalSnapshots(
    { count },
    { count: 5 }
  );

  expect(result.match).toBe(false);
  expect(result.diff).toContain('count');
  expect(result.diff).toContain('Expected: 5');
  expect(result.diff).toContain('Actual: 10');
});
```

## Best Practices

### 1. Use Mock Signals for Isolation

```typescript
// Good - isolated test
it('handles form submission', () => {
  const formData = createMockSignal({ name: '', email: '' });
  render(<Form data={formData} />);
  // ...
});

// Risky - shared state
const sharedData = signal({ name: '', email: '' });
it('test 1', () => { /* uses sharedData */ });
it('test 2', () => { /* might be affected by test 1 */ });
```

### 2. Wait for Signal Updates

```typescript
// Good - wait for update
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});

// Risky - might be flaky
count.set(5);
expect(screen.getByText('5')).toBeInTheDocument();
```

### 3. Dispose Effects in Tests

```typescript
let dispose: () => void;

beforeEach(() => {
  const count = signal(0);
  dispose = effect(() => {
    // ...
  });
});

afterEach(() => {
  dispose();
});
```

### 4. Track History for Complex Flows

```typescript
it('processes user flow correctly', async () => {
  const status = createMockSignal('idle');

  render(<AsyncForm status={status} />);

  fireEvent.click(screen.getByRole('button'));

  await waitForSignalValue(status, 'success');

  // Verify the status progression
  expect(status.getHistory()).toEqual([
    'idle',
    'submitting',
    'success',
  ]);
});
```

## API Reference

### Mock Signal Creation

| Function | Description |
|----------|-------------|
| `createMockSignal<T>(initial)` | Create mock signal with history |
| `createMockComputed<T>(fn)` | Create mock computed signal |

### Signal Utilities

| Function | Description |
|----------|-------------|
| `signalValue(signal)` | Get current signal value |
| `assertSignalHistory(signal, expected)` | Assert signal value history |

### Async Signal Utilities

| Function | Description |
|----------|-------------|
| `waitForSignal(signal, predicate, options?)` | Wait for condition |
| `waitForSignalValue(signal, value, options?)` | Wait for specific value |

### Snapshot Utilities

| Function | Description |
|----------|-------------|
| `snapshotSignalState(signals)` | Capture signal state as JSON |
| `compareSignalSnapshots(actual, expected)` | Compare signal states |

### MockSignal Methods

| Method | Description |
|--------|-------------|
| `get()` | Get current value |
| `set(value)` | Set new value |
| `update(fn)` | Update with function |
| `subscribe(fn)` | Subscribe to changes |
| `getHistory()` | Get all values |
| `getCallCount()` | Get read count |
| `reset()` | Reset to initial state |

## Next Steps

- [Async Utilities](./async.md) - Handle asynchronous testing
- [Rendering](./rendering.md) - Component rendering options
- [Events](./events.md) - Simulate user interactions
