# PhilJS Testing Utilities - Complete Guide

This guide provides a comprehensive overview of the testing utilities available in PhilJS.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Core Utilities](#core-utilities)
3. [Signal Testing](#signal-testing)
4. [Snapshot Testing](#snapshot-testing)
5. [Async Testing](#async-testing)
6. [User Events](#user-events)
7. [Test Patterns](#test-patterns)
8. [Best Practices](#best-practices)

## Installation & Setup

### Install Dependencies

```bash
npm install --save-dev philjs-testing vitest jsdom
```

### Vitest Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

Create `vitest.setup.ts`:

```typescript
import 'philjs-testing/vitest';

// Custom setup here if needed
```

### Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
```

Create `jest.setup.ts`:

```typescript
import 'philjs-testing/jest';
```

## Core Utilities

### Rendering Components

```typescript
import { render, cleanup } from 'philjs-testing';

it('renders component', () => {
  const { container, getByRole, rerender, unmount } = render(
    () => <MyComponent prop="value" />
  );

  expect(getByRole('button')).toBeInTheDocument();

  // Re-render with new props
  rerender(() => <MyComponent prop="newValue" />);

  // Cleanup
  unmount();
});
```

### Querying Elements

```typescript
import { render, screen, within } from 'philjs-testing';

it('finds elements', () => {
  render(() => <Form />);

  // By role (preferred)
  const button = screen.getByRole('button', { name: /submit/i });

  // By label text
  const input = screen.getByLabelText(/email/i);

  // By text
  const heading = screen.getByText(/welcome/i);

  // By test ID
  const element = screen.getByTestId('custom-element');

  // Query within a container
  const form = screen.getByRole('form');
  const submitButton = within(form).getByRole('button');
});
```

### Custom Matchers

```typescript
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toBeEnabled();
expect(element).toHaveTextContent('text');
expect(element).toHaveAttribute('attr', 'value');
expect(element).toHaveClass('className');
expect(element).toHaveStyle({ color: 'red' });
expect(element).toHaveFocus();
expect(input).toHaveValue('value');
expect(checkbox).toBeChecked();
expect(element).toBeEmptyDOMElement();
```

## Signal Testing

### Mock Signals

```typescript
import { createMockSignal } from 'philjs-testing';

it('tracks signal updates', () => {
  const count = createMockSignal(0);

  count.set(1);
  count.set(2);
  count.set(3);

  expect(count.getHistory()).toEqual([0, 1, 2, 3]);
  expect(count.getCallCount()).toBeGreaterThan(0);

  count.reset(); // Reset to initial state
});
```

### Waiting for Signal Values

```typescript
import { waitForSignal, waitForSignalValue } from 'philjs-testing';

it('waits for signal update', async () => {
  const status = signal('loading');

  setTimeout(() => status.set('complete'), 100);

  // Wait for specific value
  await waitForSignalValue(status, 'complete');

  // Or wait for condition
  await waitForSignal(status, (value) => value !== 'loading');

  expect(status()).toBe('complete');
});
```

### Assert Signal History

```typescript
import { assertSignalHistory } from 'philjs-testing';

it('validates signal update sequence', () => {
  const count = createMockSignal(0);

  count.set(1);
  count.set(2);
  count.set(3);

  assertSignalHistory(count, [0, 1, 2, 3]); // Passes
  assertSignalHistory(count, [0, 1, 999]); // Throws error
});
```

## Snapshot Testing

### DOM Snapshots

```typescript
import { takeSnapshot, createSnapshotMatcher } from 'philjs-testing';

describe('Component snapshots', () => {
  const matcher = createSnapshotMatcher();

  it('matches DOM snapshot', () => {
    const { container } = render(() => <UserCard user={mockUser} />);

    matcher.matchSnapshot('user-card-default', container);
  });

  it('manually compares snapshots', () => {
    const { container } = render(() => <Component />);

    const result = takeSnapshot(container);

    expect(result.toMatch(previousSnapshot)).toBe(true);

    if (!result.toMatch(previousSnapshot)) {
      console.log(result.diff(previousSnapshot));
    }
  });
});
```

### Signal State Snapshots

```typescript
import { snapshotSignalState, compareSignalSnapshots } from 'philjs-testing';

it('captures signal state', () => {
  const count = signal(5);
  const name = signal('test');
  const active = signal(true);

  const snapshot = snapshotSignalState({ count, name, active });

  expect(JSON.parse(snapshot)).toEqual({
    count: 5,
    name: 'test',
    active: true,
  });
});

it('compares signal states', () => {
  const count = signal(5);
  const name = signal('test');

  const result = compareSignalSnapshots(
    { count, name },
    { count: 5, name: 'test' }
  );

  expect(result.match).toBe(true);
  if (!result.match) {
    console.log(result.diff);
  }
});
```

## Async Testing

### Wait For Conditions

```typescript
import { waitFor, waitForElementToBeRemoved } from 'philjs-testing';

it('waits for async updates', async () => {
  render(() => <AsyncComponent />);

  // Wait for element to appear
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });

  // Wait for element to be removed
  await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
});
```

### Find Queries (Async)

```typescript
it('uses async queries', async () => {
  render(() => <AsyncComponent />);

  // findBy* queries automatically wait
  const element = await screen.findByText('Loaded', {}, { timeout: 3000 });

  expect(element).toBeInTheDocument();
});
```

### Wait for Loading to Finish

```typescript
import { waitForLoadingToFinish, waitForNetworkIdle } from 'philjs-testing';

it('waits for loading indicators', async () => {
  render(() => <DataLoader />);

  await waitForLoadingToFinish();

  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});

it('waits for network requests', async () => {
  render(() => <Component />);

  await waitForNetworkIdle({ idleTime: 500 });

  expect(screen.getByText('All requests complete')).toBeInTheDocument();
});
```

## User Events

### Basic Interactions

```typescript
import { userEvent } from 'philjs-testing';

it('simulates user interactions', async () => {
  const user = userEvent.setup();

  render(() => <Form />);

  // Click
  await user.click(screen.getByRole('button'));

  // Type
  await user.type(screen.getByLabelText('Name'), 'Alice');

  // Clear input
  await user.clear(screen.getByLabelText('Name'));

  // Select option
  await user.selectOptions(screen.getByRole('combobox'), 'option1');

  // Upload file
  const file = new File(['content'], 'test.txt', { type: 'text/plain' });
  await user.upload(screen.getByLabelText('File'), file);

  // Keyboard
  await user.keyboard('{Enter}');

  // Hover
  await user.hover(screen.getByRole('button'));
  await user.unhover(screen.getByRole('button'));

  // Tab navigation
  await user.tab();
  await user.tab({ shift: true });
});
```

### Advanced User Events

```typescript
it('handles complex interactions', async () => {
  const user = userEvent.setup({ delay: 10 }); // Add delay between actions

  render(() => <Editor />);

  // Triple click to select all
  await user.tripleClick(screen.getByRole('textbox'));

  // Copy, cut, paste
  await user.copy();
  await user.cut();
  await user.paste('Pasted text');

  // Pointer events
  await user.pointer([
    { target: element, keys: '[MouseLeft>]' }, // Press
    { target: otherElement },                   // Move
    { target: otherElement, keys: '[/MouseLeft]' }, // Release
  ]);
});
```

## Test Patterns

### Testing Hooks

```typescript
import { renderHook, act } from 'philjs-testing';

describe('useCounter', () => {
  it('manages counter state', () => {
    const { result, rerender, unmount } = renderHook(() => useCounter(0));

    expect(result.current.count()).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count()).toBe(1);

    // Re-render with new props
    rerender({ initialCount: 10 });

    unmount();
  });
});
```

### Testing with Context

```typescript
import { render } from 'philjs-testing';

it('provides context to component', () => {
  const wrapper = ({ children }) => (
    <ThemeProvider theme="dark">
      {children}
    </ThemeProvider>
  );

  render(() => <ThemedComponent />, { wrapper });

  expect(screen.getByText('Dark theme active')).toBeInTheDocument();
});
```

### Testing Forms

```typescript
it('validates and submits form', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(() => <ContactForm onSubmit={onSubmit} />);

  // Invalid submission
  await user.click(screen.getByRole('button', { name: /submit/i }));
  expect(screen.getByText('Name is required')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();

  // Valid submission
  await user.type(screen.getByLabelText('Name'), 'Alice');
  await user.type(screen.getByLabelText('Email'), 'alice@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    name: 'Alice',
    email: 'alice@example.com',
  });
});
```

### Testing Async Data

```typescript
it('loads and displays data', async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'Alice' }]),
    })
  );

  render(() => <UserList />);

  // Check loading state
  expect(screen.getByRole('progressbar')).toBeInTheDocument();

  // Wait for data
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
```

## Best Practices

### 1. Use Semantic Queries

```typescript
// Good - accessible queries
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);

// Avoid - implementation details
screen.getByClassName('btn-submit');
screen.getByTestId('submit-button'); // Use sparingly
```

### 2. Test User Behavior

```typescript
// Good - test what users do
it('increments count on button click', async () => {
  const user = userEvent.setup();
  render(() => <Counter />);

  await user.click(screen.getByRole('button', { name: /increment/i }));

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});

// Avoid - testing implementation
it('sets count signal to 1', () => {
  const { count } = useCounter();
  count.set(1);
  expect(count()).toBe(1);
});
```

### 3. Use userEvent Over fireEvent

```typescript
// Good - realistic user interactions
const user = userEvent.setup();
await user.type(input, 'Hello');

// Acceptable - low-level events
fireEvent.change(input, { target: { value: 'Hello' } });
```

### 4. Proper Async Handling

```typescript
// Good - wait for changes
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Avoid - arbitrary delays
await new Promise(resolve => setTimeout(resolve, 1000));
```

### 5. Clean Test Setup

```typescript
describe('Component', () => {
  let mockData;
  let mockFn;

  beforeEach(() => {
    mockData = { id: 1, name: 'Test' };
    mockFn = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('test case', () => {
    // Test implementation
  });
});
```

### 6. Descriptive Test Names

```typescript
// Good - describes behavior
it('displays error message when form submission fails', () => {});
it('increments counter when increment button is clicked', () => {});

// Avoid - vague names
it('works correctly', () => {});
it('test 1', () => {});
```

### 7. Debug When Needed

```typescript
import { debug, debugSignals, debugA11y } from 'philjs-testing';

it('debugs component', () => {
  const { container } = render(() => <Component />);

  // Print DOM
  debug(container);
  screen.debug(); // Print entire document

  // Debug signals
  debugSignals(container);

  // Check accessibility
  debugA11y(container);
});
```

## Additional Resources

- [PhilJS Documentation](../../docs/learn/testing.md)
- [Testing Examples](./examples/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
