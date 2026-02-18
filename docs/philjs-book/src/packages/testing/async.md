# Testing Async Logic

Testing asynchronous behavior requires utilities to wait for state updates, effects, and network operations to settle. PhilJS Testing Library provides a robust set of async primitives.

## `waitFor`

Waits for an assertion to pass within a timeout period.

```typescript
import { render, screen, waitFor } from '@philjs/testing';
import { UserProfile } from './UserProfile';

test('loads user data', async () => {
  render(<UserProfile id="123" />);

  // Initially showing loading
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

## `findBy` Queries

`findBy` queries are async wrappers around `getBy` queries + `waitFor`.

```typescript
// Equivalent to the above
test('loads user data', async () => {
  render(<UserProfile id="123" />);
  
  // Waits up to 1000ms by default
  const name = await screen.findByText('Alice');
  expect(name).toBeInTheDocument();
});
```

## `waitForElementToBeRemoved`

Useful for asserting that loading states disappear.

```typescript
import { waitForElementToBeRemoved } from '@philjs/testing';

await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
```

## Testing Hooks

Use `renderHook` to test async hooks in isolation.

```typescript
import { renderHook, act } from '@philjs/testing';
import { useAsyncData } from './hooks';

test('fetches data', async () => {
  const { result } = renderHook(() => useAsyncData('123'));

  expect(result.current.loading).toBe(true);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.data).toEqual({ name: 'Alice' });
});
```

## Mocking Timers

For precise control over `setTimeout` and `setInterval`.

```typescript
import { vi } from 'vitest';

test('debounces input', async () => {
  vi.useFakeTimers();
  const onChange = vi.fn();
  
  render(<SearchInput onChange={onChange} />);
  
  await userEvent.type(screen.getByRole('textbox'), 'test');
  
  // Should not call yet
  expect(onChange).not.toHaveBeenCalled();
  
  // Fast-forward time
  vi.advanceTimersByTime(300);
  
  expect(onChange).toHaveBeenCalledWith('test');
  vi.useRealTimers();
});
```
