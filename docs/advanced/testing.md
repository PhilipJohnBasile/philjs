# Testing

Comprehensive testing strategies for PhilJS applications.

## What You'll Learn

- Unit testing components
- Testing signals and effects
- Integration testing
- End-to-end testing
- Mocking and fixtures
- Best practices

## Unit Testing Components

### Setup with Vitest

```bash
npm install -D vitest @testing-library/dom happy-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true
  }
});
```

### Basic Component Test

```typescript
// Counter.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/dom';
import { Counter } from './Counter';

describe('Counter', () => {
  it('renders initial count', () => {
    const container = document.createElement('div');
    render(<Counter initialCount={0} />, container);

    expect(container.textContent).toContain('Count: 0');
  });

  it('increments count on button click', () => {
    const container = document.createElement('div');
    render(<Counter initialCount={0} />, container);

    const button = container.querySelector('button')!;
    button.click();

    expect(container.textContent).toContain('Count: 1');
  });
});
```

### Testing with User Interaction

```typescript
import { fireEvent } from '@testing-library/dom';

describe('TodoList', () => {
  it('adds new todo', () => {
    const container = document.createElement('div');
    render(<TodoList />, container);

    const input = container.querySelector('input')!;
    const button = container.querySelector('button')!;

    fireEvent.input(input, { target: { value: 'New task' } });
    fireEvent.click(button);

    expect(container.textContent).toContain('New task');
  });

  it('marks todo as complete', () => {
    const container = document.createElement('div');
    render(<TodoList initialTodos={[{ id: '1', text: 'Task 1', done: false }]} />, container);

    const checkbox = container.querySelector('input[type="checkbox"]')!;
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });
});
```

## Testing Signals

### Signal State Tests

```typescript
import { signal, memo } from 'philjs-core';

describe('Signals', () => {
  it('updates signal value', () => {
    const count = signal(0);

    expect(count()).toBe(0);

    count.set(5);

    expect(count()).toBe(5);
  });

  it('computes derived value', () => {
    const count = signal(2);
    const doubled = memo(() => count() * 2);

    expect(doubled()).toBe(4);

    count.set(5);

    expect(doubled()).toBe(10);
  });

  it('updates multiple dependents', () => {
    const count = signal(1);
    const doubled = memo(() => count() * 2);
    const tripled = memo(() => count() * 3);

    expect(doubled()).toBe(2);
    expect(tripled()).toBe(3);

    count.set(5);

    expect(doubled()).toBe(10);
    expect(tripled()).toBe(15);
  });
});
```

## Testing Effects

### Effect Execution

```typescript
import { effect, signal } from 'philjs-core';
import { describe, it, expect, vi } from 'vitest';

describe('Effects', () => {
  it('runs effect on dependency change', () => {
    const count = signal(0);
    const mockFn = vi.fn();

    effect(() => {
      mockFn(count());
    });

    expect(mockFn).toHaveBeenCalledWith(0);

    count.set(5);

    expect(mockFn).toHaveBeenCalledWith(5);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('runs cleanup on unmount', () => {
    const cleanup = vi.fn();

    const dispose = effect(() => {
      return cleanup;
    });

    dispose();

    expect(cleanup).toHaveBeenCalled();
  });

  it('runs cleanup before re-execution', () => {
    const count = signal(0);
    const cleanup = vi.fn();

    effect(() => {
      count(); // Track dependency
      return cleanup;
    });

    count.set(1);

    expect(cleanup).toHaveBeenCalled();
  });
});
```

## Async Testing

### Testing Async Operations

```typescript
describe('Async Data Loading', () => {
  it('loads data successfully', async () => {
    const container = document.createElement('div');

    const DataLoader = () => {
      const data = signal(null);
      const loading = signal(true);

      effect(async () => {
        const response = await fetch('/api/data');
        data.set(await response.json());
        loading.set(false);
      });

      if (loading()) return <div>Loading...</div>;

      return <div>Data: {data()?.value}</div>;
    };

    render(<DataLoader />, container);

    expect(container.textContent).toContain('Loading');

    // Wait for effect to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(container.textContent).toContain('Data:');
  });
});
```

## Mocking

### Mock API Calls

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

describe('API Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches user data', async () => {
    const mockUser = { id: '1', name: 'Alice' };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser
    });

    const user = await fetchUser('1');

    expect(user).toEqual(mockUser);
    expect(global.fetch).toHaveBeenCalledWith('/api/users/1');
  });

  it('handles API error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchUser('1')).rejects.toThrow('Network error');
  });
});
```

### Mock Modules

```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: '1', name: 'Mock User' })
}));

// Mock specific function
const mockFetchUser = vi.fn();
vi.mock('./api', () => ({
  fetchUser: mockFetchUser
}));

describe('UserProfile', () => {
  it('displays user name', async () => {
    mockFetchUser.mockResolvedValueOnce({ id: '1', name: 'Alice' });

    const container = document.createElement('div');
    render(<UserProfile userId="1" />, container);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(container.textContent).toContain('Alice');
  });
});
```

## Integration Testing

### Testing Multiple Components

```typescript
describe('Todo App Integration', () => {
  it('manages todo lifecycle', () => {
    const container = document.createElement('div');
    render(<TodoApp />, container);

    // Add todo
    const input = container.querySelector('input')!;
    const addButton = container.querySelector('button[data-testid="add"]')!;

    fireEvent.input(input, { target: { value: 'Buy milk' } });
    fireEvent.click(addButton);

    expect(container.textContent).toContain('Buy milk');

    // Mark complete
    const checkbox = container.querySelector('input[type="checkbox"]')!;
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();

    // Delete todo
    const deleteButton = container.querySelector('button[data-testid="delete"]')!;
    fireEvent.click(deleteButton);

    expect(container.textContent).not.toContain('Buy milk');
  });
});
```

### Testing Router Integration

```typescript
import { Router, Route } from 'philjs-router';

describe('Router Integration', () => {
  it('navigates between routes', () => {
    const container = document.createElement('div');

    const App = () => (
      <Router>
        <Route path="/" component={() => <div>Home</div>} />
        <Route path="/about" component={() => <div>About</div>} />
      </Router>
    );

    render(<App />, container);

    expect(container.textContent).toContain('Home');

    // Navigate to /about
    window.history.pushState({}, '', '/about');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(container.textContent).toContain('About');
  });
});
```

## End-to-End Testing

### Setup with Playwright

```bash
npm install -D @playwright/test
```

```typescript
// e2e/todo.spec.ts
import { test, expect } from '@playwright/test';

test('adds and completes todo', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Add todo
  await page.fill('input[placeholder="Add todo"]', 'Buy milk');
  await page.click('button:has-text("Add")');

  await expect(page.locator('text=Buy milk')).toBeVisible();

  // Mark complete
  await page.click('input[type="checkbox"]');

  await expect(page.locator('input[type="checkbox"]')).toBeChecked();
});

test('filters todos', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Add todos
  await page.fill('input', 'Todo 1');
  await page.click('button:has-text("Add")');

  await page.fill('input', 'Todo 2');
  await page.click('button:has-text("Add")');

  // Complete first todo
  await page.click('input[type="checkbox"]');

  // Filter to active
  await page.click('button:has-text("Active")');

  await expect(page.locator('text=Todo 1')).not.toBeVisible();
  await expect(page.locator('text=Todo 2')).toBeVisible();
});
```

## Test Utilities

### Custom Render Function

```typescript
import { render as baseRender } from '@testing-library/dom';

export function render(
  component: JSX.Element,
  options?: {
    initialRoute?: string;
    authUser?: User;
  }
) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  // Setup initial route
  if (options?.initialRoute) {
    window.history.pushState({}, '', options.initialRoute);
  }

  // Setup auth context
  let wrappedComponent = component;

  if (options?.authUser) {
    wrappedComponent = (
      <AuthProvider initialUser={options.authUser}>
        {component}
      </AuthProvider>
    );
  }

  baseRender(wrappedComponent, container);

  return {
    container,
    unmount: () => {
      document.body.removeChild(container);
    }
  };
}

// Usage
const { container, unmount } = render(<Dashboard />, {
  initialRoute: '/dashboard',
  authUser: { id: '1', name: 'Alice' }
});
```

### Test Fixtures

```typescript
// fixtures.ts
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  ...overrides
});

export const createMockPost = (overrides?: Partial<Post>): Post => ({
  id: '1',
  title: 'Test Post',
  content: 'Test content',
  author: createMockUser(),
  createdAt: new Date().toISOString(),
  ...overrides
});

// Usage in tests
const user = createMockUser({ name: 'Alice' });
const post = createMockPost({ author: user });
```

## Best Practices

### Test User Behavior, Not Implementation

```typescript
// ❌ Testing implementation details
it('sets count signal to 5', () => {
  const counter = new Counter();
  counter.count.set(5);
  expect(counter.count()).toBe(5);
});

// ✅ Testing user behavior
it('displays incremented count', () => {
  const container = document.createElement('div');
  render(<Counter />, container);

  const button = container.querySelector('button')!;
  button.click();

  expect(container.textContent).toContain('Count: 1');
});
```

### Use Data Attributes for Test Selectors

```typescript
// Component
function TodoList() {
  return (
    <div>
      <input data-testid="todo-input" />
      <button data-testid="add-todo">Add</button>
      <ul data-testid="todo-list">{/* todos */}</ul>
    </div>
  );
}

// Test
it('adds todo', () => {
  const container = document.createElement('div');
  render(<TodoList />, container);

  const input = container.querySelector('[data-testid="todo-input"]')!;
  const button = container.querySelector('[data-testid="add-todo"]')!;

  fireEvent.input(input, { target: { value: 'New task' } });
  fireEvent.click(button);

  const list = container.querySelector('[data-testid="todo-list"]')!;
  expect(list.textContent).toContain('New task');
});
```

### Test Edge Cases

```typescript
describe('Input Validation', () => {
  it('handles empty input', () => {
    const container = document.createElement('div');
    render(<TodoList />, container);

    const button = container.querySelector('button')!;
    button.click();

    // Should not add empty todo
    const todos = container.querySelectorAll('li');
    expect(todos.length).toBe(0);
  });

  it('handles very long input', () => {
    const container = document.createElement('div');
    render(<TodoList />, container);

    const input = container.querySelector('input')!;
    const longText = 'a'.repeat(1000);

    fireEvent.input(input, { target: { value: longText } });

    // Should validate max length
    expect(container.textContent).toContain('Too long');
  });

  it('handles special characters', () => {
    const container = document.createElement('div');
    render(<TodoList />, container);

    const input = container.querySelector('input')!;

    fireEvent.input(input, { target: { value: '<script>alert("xss")</script>' } });

    // Should escape HTML
    expect(container.innerHTML).not.toContain('<script>');
  });
});
```

### Snapshot Testing

```typescript
import { toMatchSnapshot } from 'vitest';

describe('Button Component', () => {
  it('matches snapshot', () => {
    const container = document.createElement('div');
    render(<Button variant="primary">Click me</Button>, container);

    expect(container.innerHTML).toMatchSnapshot();
  });

  it('matches snapshot with icon', () => {
    const container = document.createElement('div');
    render(<Button icon={<Icon name="plus" />}>Add</Button>, container);

    expect(container.innerHTML).toMatchSnapshot();
  });
});
```

## Summary

You've learned:

✅ Unit testing components with Vitest
✅ Testing signals and effects
✅ Async testing patterns
✅ Mocking APIs and modules
✅ Integration testing
✅ End-to-end testing with Playwright
✅ Custom test utilities
✅ Test fixtures
✅ Best practices for testing

Comprehensive testing ensures application reliability!

---

**Next:** [Error Boundaries →](./error-boundaries.md) Robust error handling
