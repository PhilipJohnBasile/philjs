# philjs-testing

Official testing library for PhilJS - render, queries, events, and utilities for testing components and signals.

## Features

- **Component Rendering** - Render components in a test environment
- **DOM Queries** - Find elements using accessible queries
- **User Events** - Simulate user interactions
- **Signal Testing** - Test reactive state and computed values
- **Async Utilities** - Wait for conditions and async updates
- **Custom Matchers** - Assertion helpers for common checks
- **Hook Testing** - Test custom hooks in isolation
- **Debug Helpers** - Inspect DOM, signals, and accessibility
- **Vitest Integration** - Works seamlessly with Vitest

## Installation

```bash
pnpm add -D philjs-testing vitest jsdom
```

## Quick Start

### Basic Component Test

```typescript
import { render, screen, fireEvent } from 'philjs-testing';
import { describe, it, expect } from 'vitest';
import Counter from './Counter';

describe('Counter', () => {
  it('increments count on button click', () => {
    render(<Counter />);

    const button = screen.getByRole('button', { name: /increment/i });
    const count = screen.getByText(/count: 0/i);

    expect(count).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText(/count: 2/i)).toBeInTheDocument();
  });
});
```

### Testing Signals

```typescript
import { signal } from 'philjs-core';
import { waitForSignal, signalValue } from 'philjs-testing';
import { describe, it, expect } from 'vitest';

describe('Signal Tests', () => {
  it('waits for signal to update', async () => {
    const count = signal(0);

    setTimeout(() => count.set(10), 100);

    await waitForSignal(count, (value) => value === 10);
    expect(signalValue(count)).toBe(10);
  });

  it('tracks signal history', async () => {
    const count = signal(0);
    const history = [];

    count.subscribe((value) => history.push(value));

    count.set(1);
    count.set(2);
    count.set(3);

    expect(history).toEqual([0, 1, 2, 3]);
  });
});
```

### User Events

Use `userEvent` for more realistic interactions:

```typescript
import { render, screen, userEvent } from 'philjs-testing';
import LoginForm from './LoginForm';

it('submits the form with user credentials', async () => {
  const handleSubmit = vi.fn();
  render(<LoginForm onSubmit={handleSubmit} />);

  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/email/i), 'user@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'password123'
  });
});
```

### Async Utilities

Wait for elements and conditions:

```typescript
import { render, screen, waitFor, waitForElementToBeRemoved } from 'philjs-testing';
import UserProfile from './UserProfile';

it('loads and displays user data', async () => {
  render(<UserProfile userId="123" />);

  // Wait for loading spinner to disappear
  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  // Wait for data to appear
  await waitFor(() => {
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });

  expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
});
```

### Testing Hooks

Test custom hooks in isolation:

```typescript
import { renderHook, act } from 'philjs-testing';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter(0));

    expect(result.current.count()).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count()).toBe(1);
  });

  it('accepts initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count()).toBe(10);
  });
});
```

### Custom Matchers

Use built-in matchers for common assertions:

```typescript
import { render, screen } from 'philjs-testing';

it('uses custom matchers', () => {
  render(<button disabled>Click me</button>);

  const button = screen.getByRole('button');

  expect(button).toBeInTheDocument();
  expect(button).toBeDisabled();
  expect(button).toHaveTextContent('Click me');
  expect(button).not.toBeVisible(); // if hidden
  expect(button).toHaveAttribute('disabled');
});
```

### Debug Utilities

Inspect rendered output and signals:

```typescript
import { render, screen, debug, debugSignals } from 'philjs-testing';
import { signal } from 'philjs-core';

it('debugs component output', () => {
  const count = signal(5);
  const { container } = render(<Counter count={count} />);

  // Print the DOM
  debug(container);

  // Print specific element
  debug(screen.getByRole('button'));

  // Debug signal values
  debugSignals({ count });
  // Outputs: { count: 5 }
});
```

## API Reference

### Rendering

#### `render(component, options?)`

Renders a component for testing.

**Returns:** `RenderResult` with utilities and container

**Options:**
- `container` - Custom container element
- `wrapper` - Wrapper component (e.g., providers)
- `hydrate` - Use hydration instead of render

**Example:**
```typescript
const { container, rerender, unmount } = render(<App />);
```

#### `cleanup()`

Unmounts all rendered components. Called automatically after each test.

### Queries

All queries from `@testing-library/dom` are available:

- `getByRole`, `queryByRole`, `findByRole`
- `getByText`, `queryByText`, `findByText`
- `getByLabelText`, `queryByLabelText`, `findByLabelText`
- `getByPlaceholderText`, `getByAltText`, `getByTitle`
- `getByTestId`, `queryByTestId`, `findByTestId`
- Plus `getAllBy*`, `queryAllBy*`, `findAllBy*` variants

**screen** - Query the entire document:
```typescript
screen.getByRole('button', { name: /submit/i });
```

**within** - Query within a specific element:
```typescript
const form = screen.getByRole('form');
const button = within(form).getByRole('button');
```

### Events

#### `fireEvent.{eventType}(element, options?)`

Fire DOM events on elements:

```typescript
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'new value' } });
fireEvent.submit(form);
```

#### `userEvent`

More realistic user interactions:

```typescript
const user = userEvent.setup();

await user.click(button);
await user.type(input, 'Hello');
await user.clear(input);
await user.selectOptions(select, 'option-1');
await user.upload(fileInput, file);
await user.keyboard('{Enter}');
```

### Async Utilities

#### `waitFor(callback, options?)`

Wait for a condition to be true:

```typescript
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
}, { timeout: 3000 });
```

#### `waitForElementToBeRemoved(callback)`

Wait for element to be removed from DOM:

```typescript
await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
```

#### `findBy*` Queries

Async versions of queries that wait for elements:

```typescript
const button = await screen.findByRole('button');
```

#### `waitForSignal(signal, condition, options?)`

Wait for signal to meet a condition:

```typescript
await waitForSignal(count, (value) => value > 5);
```

### Signal Testing

#### `createMockSignal(initialValue)`

Create a mock signal for testing:

```typescript
const mockCount = createMockSignal(0);
mockCount.set(5);
expect(mockCount()).toBe(5);
```

#### `signalValue(signal)`

Get current signal value safely:

```typescript
const value = signalValue(count);
```

#### `waitForSignalValue(signal, expectedValue, options?)`

Wait for signal to have a specific value:

```typescript
await waitForSignalValue(count, 10);
```

### Matchers

- `toBeInTheDocument()` - Element is in the DOM
- `toBeVisible()` - Element is visible
- `toBeDisabled()` / `toBeEnabled()` - Element disabled state
- `toHaveTextContent(text)` - Element contains text
- `toHaveAttribute(attr, value?)` - Element has attribute
- `toHaveClass(className)` - Element has CSS class
- `toHaveStyle(styles)` - Element has inline styles
- `toHaveFocus()` - Element has focus
- `toHaveValue(value)` - Input has value
- `toBeChecked()` - Checkbox/radio is checked
- `toBeEmptyDOMElement()` - Element has no children

### Hooks

#### `renderHook(hook, options?)`

Render a hook for testing:

```typescript
const { result, rerender, unmount } = renderHook(() => useMyHook());
expect(result.current.value).toBe(42);
```

#### `act(callback)`

Wrap state updates in `act`:

```typescript
act(() => {
  result.current.increment();
});
```

### Debug & Snapshots

- `debug(element?)` - Print DOM to console
- `logDOM(element?)` - Same as debug
- `prettyDOM(element)` - Return formatted DOM string
- `debugSignals(signals)` - Print signal values
- `debugA11y(element)` - Check accessibility tree
- `snapshot(element)` - Create DOM snapshot
- `compareSnapshots(snap1, snap2)` - Compare snapshots

#### `takeSnapshot(element, options?)`

Create a snapshot of DOM or component state:

```typescript
const result = takeSnapshot(container, {
  maxLength: 5000,
  includeSignals: true,
  serializer: (el) => el.outerHTML
});

if (!result.toMatch(expectedSnapshot)) {
  console.log(result.diff(expectedSnapshot));
}
```

#### `createSnapshotMatcher(options?)`

Create a snapshot matcher for testing:

```typescript
const matcher = createSnapshotMatcher({ updateMode: false });

it('matches snapshot', () => {
  const { container } = render(<Component />);
  matcher.matchSnapshot('component-default', container);
});
```

#### `snapshotSignalState(signals)`

Capture signal state as JSON:

```typescript
const snapshot = snapshotSignalState({
  count: signal(5),
  name: signal('test')
});
// Returns: { "count": 5, "name": "test" }
```

#### `compareSignalSnapshots(actual, expected)`

Compare signal states:

```typescript
const result = compareSignalSnapshots(
  { count: signal(5) },
  { count: 5 }
);

expect(result.match).toBe(true);
```

## Vitest Configuration

Add to your `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts']
  }
});
```

Create `test/setup.ts`:

```typescript
import { cleanup } from 'philjs-testing';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

## Best Practices

1. **Use accessible queries** - Prefer `getByRole` and `getByLabelText` over `getByTestId`
2. **Test behavior, not implementation** - Test what users see and do
3. **Use userEvent for interactions** - More realistic than fireEvent
4. **Wait for async changes** - Use `waitFor` and `findBy*` queries
5. **Clean up after tests** - Use `cleanup()` to avoid test pollution
6. **Test signal behavior** - Verify reactive state changes
7. **Debug when needed** - Use `debug()` and `screen.debug()`

## Examples

See the [examples](../../examples) directory for full working tests.

## Documentation

For more information, see the [PhilJS documentation](../../docs).

## License

MIT
