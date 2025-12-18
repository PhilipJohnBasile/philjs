# PhilJS Testing Examples

This directory contains comprehensive examples demonstrating various testing patterns with PhilJS.

## Examples

### 1. Basic Component Testing
**File:** `basic-component.test.tsx`

Learn how to:
- Render components for testing
- Query elements by role and test ID
- Simulate user interactions
- Test state updates

### 2. Form Testing
**File:** `form-testing.test.tsx`

Covers:
- Testing form inputs and validation
- Error message handling
- Form submission
- Clearing and updating validation errors

### 3. Async Data Loading
**File:** `async-data.test.tsx`

Demonstrates:
- Testing loading states
- Mocking fetch API
- Handling success and error cases
- Testing empty states

### 4. Signal Testing
**File:** `signal-testing.test.ts`

Shows:
- Creating mock signals
- Tracking signal history
- Testing computed signals
- Testing effects and their dependencies
- Async signal updates

## Running Examples

```bash
# Run all examples
npm test

# Run specific example
npm test basic-component

# Run with coverage
npm test -- --coverage
```

## Pattern Quick Reference

### Component Rendering
```tsx
import { render, screen } from 'philjs-testing';

const { container } = render(() => <MyComponent prop="value" />);
const element = screen.getByRole('button');
```

### User Interactions
```tsx
import { userEvent } from 'philjs-testing';

const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');
await user.selectOptions(select, 'option1');
```

### Signal Testing
```tsx
import { createMockSignal, waitForSignalValue } from 'philjs-testing';

const count = createMockSignal(0);
count.set(5);

expect(count.getHistory()).toEqual([0, 5]);
await waitForSignalValue(count, 10);
```

### Async Testing
```tsx
import { waitFor, waitForLoadingToFinish } from 'philjs-testing';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

await waitForLoadingToFinish();
```

### Mocking
```tsx
import { vi } from 'vitest';

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
);
```

## Best Practices

1. **Test user behavior, not implementation**
   - Focus on what users see and do
   - Avoid testing internal state directly
   - Use semantic queries (getByRole, getByLabelText)

2. **Keep tests simple and focused**
   - One concept per test
   - Clear test names that describe behavior
   - Arrange-Act-Assert pattern

3. **Clean up after tests**
   - Use `cleanup()` or auto-cleanup
   - Reset mocks with `vi.clearAllMocks()`
   - Restore global objects

4. **Use proper async patterns**
   - Always await async operations
   - Use `waitFor` for conditions
   - Don't use arbitrary timeouts

5. **Make tests deterministic**
   - Mock time-dependent code
   - Use controlled data
   - Avoid flaky assertions

## Additional Resources

- [PhilJS Testing Documentation](/docs/learn/testing.md)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
