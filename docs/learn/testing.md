# Testing PhilJS Applications

Testing is crucial for building reliable applications. PhilJS provides excellent testing utilities and integrates seamlessly with popular testing frameworks.

## Testing Setup

### Install Dependencies

```bash
npm install --save-dev vitest @testing-library/philjs @testing-library/user-event jsdom
```

### Configure Vitest

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
});
```

### Setup File

```ts
// test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/philjs';
import '@testing-library/jest-dom';

afterEach(() => {
  cleanup();
});
```

## Component Testing

### Basic Component Test

```tsx
// Counter.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('renders with initial count of 0', () => {
    render(() => <Counter />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('increments count when button is clicked', async () => {
    const user = userEvent.setup();
    render(() => <Counter />);

    const button = screen.getByRole('button', { name: /increment/i });
    await user.click(button);

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('decrements count when decrement button is clicked', async () => {
    const user = userEvent.setup();
    render(() => <Counter initialCount={5} />);

    const button = screen.getByRole('button', { name: /decrement/i });
    await user.click(button);

    expect(screen.getByText('Count: 4')).toBeInTheDocument();
  });
});
```

### Testing with Props

```tsx
// UserProfile.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  const mockUser = {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com'
  };

  it('displays user information', () => {
    render(() => <UserProfile user={mockUser} />);

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('shows placeholder when no user provided', () => {
    render(() => <UserProfile user={null} />);
    expect(screen.getByText(/no user/i)).toBeInTheDocument();
  });
});
```

## Testing Signals

### Signal Behavior

```tsx
// useCounter.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/philjs';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count()).toBe(0);
  });

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count()).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count()).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count()).toBe(4);
  });

  it('resets count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count()).toBe(0);
  });
});
```

### Testing Memos

```tsx
// useDerivedValue.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/philjs';
import { signal, memo } from 'philjs-core';

describe('Memo behavior', () => {
  it('recalculates when dependency changes', () => {
    let calculations = 0;

    const { result } = renderHook(() => {
      const count = signal(0);
      const doubled = memo(() => {
        calculations++;
        return count() * 2;
      });

      return { count, doubled };
    });

    expect(result.current.doubled()).toBe(0);
    expect(calculations).toBe(1);

    act(() => {
      result.current.count.set(5);
    });

    expect(result.current.doubled()).toBe(10);
    expect(calculations).toBe(2);
  });

  it('does not recalculate when dependency is unchanged', () => {
    let calculations = 0;

    const { result } = renderHook(() => {
      const count = signal(0);
      const doubled = memo(() => {
        calculations++;
        return count() * 2;
      });

      return { count, doubled };
    });

    const value1 = result.current.doubled();
    const value2 = result.current.doubled();

    expect(value1).toBe(value2);
    expect(calculations).toBe(1);
  });
});
```

## Testing Effects

```tsx
// useDocumentTitle.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/philjs';
import { signal, effect } from 'philjs-core';

describe('Document title effect', () => {
  beforeEach(() => {
    document.title = '';
  });

  it('updates document title', () => {
    renderHook(() => {
      const title = signal('Test Page');

      effect(() => {
        document.title = title();
      });

      return { title };
    });

    expect(document.title).toBe('Test Page');
  });

  it('updates title when signal changes', () => {
    const { result } = renderHook(() => {
      const title = signal('Initial');

      effect(() => {
        document.title = title();
      });

      return { title };
    });

    act(() => {
      result.current.title.set('Updated');
    });

    expect(document.title).toBe('Updated');
  });
});
```

## Testing User Interactions

### Form Submission

```tsx
// LoginForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits form with user credentials', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(() => <LoginForm onSubmit={onSubmit} />);

    await user.type(
      screen.getByLabelText(/email/i),
      'user@example.com'
    );
    await user.type(
      screen.getByLabelText(/password/i),
      'password123'
    );
    await user.click(
      screen.getByRole('button', { name: /log in/i })
    );

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123'
    });
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(() => <LoginForm />);

    await user.click(
      screen.getByRole('button', { name: /log in/i })
    );

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});
```

### Keyboard Interactions

```tsx
// Dropdown.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import userEvent from '@testing-library/user-event';
import { Dropdown } from './Dropdown';

describe('Dropdown', () => {
  it('opens on Enter key', async () => {
    const user = userEvent.setup();
    render(() => (
      <Dropdown>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Dropdown>
    ));

    const trigger = screen.getByRole('button');
    await user.type(trigger, '{Enter}');

    expect(screen.getByRole('listbox')).toBeVisible();
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(() => <Dropdown />);

    await user.click(screen.getByRole('button'));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
```

## Testing Async Operations

### Data Fetching

```tsx
// UserList.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/philjs';
import { UserList } from './UserList';

describe('UserList', () => {
  it('displays loading state initially', () => {
    render(() => <UserList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays users after loading', async () => {
    const mockUsers = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockUsers)
      } as Response)
    );

    render(() => <UserList />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('displays error message on failure', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Failed to fetch'))
    );

    render(() => <UserList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Promises and Suspense

```tsx
// AsyncComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/philjs';
import { Suspense } from 'philjs-core';
import { AsyncComponent } from './AsyncComponent';

describe('AsyncComponent', () => {
  it('shows fallback while loading', () => {
    render(() => (
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncComponent />
      </Suspense>
    ));

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders component after loading', async () => {
    render(() => (
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncComponent />
      </Suspense>
    ));

    await waitFor(() => {
      expect(screen.getByText('Loaded!')).toBeInTheDocument();
    });
  });
});
```

## Testing Context

```tsx
// ThemeContext.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';

function ThemeConsumer() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme()}</p>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  it('provides theme to consumers', () => {
    render(() => (
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    ));

    expect(screen.getByText('Current theme: light')).toBeInTheDocument();
  });

  it('toggles theme on button click', async () => {
    const user = userEvent.setup();

    render(() => (
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    ));

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
  });
});
```

## Testing Error Boundaries

```tsx
// ErrorBoundary.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import { ErrorBoundary } from 'philjs-core';

function BrokenComponent() {
  throw new Error('Something went wrong!');
}

describe('ErrorBoundary', () => {
  it('catches errors and renders fallback', () => {
    render(() => (
      <ErrorBoundary
        fallback={(error) => <div>Error: {error.message}</div>}
      >
        <BrokenComponent />
      </ErrorBoundary>
    ));

    expect(screen.getByText('Error: Something went wrong!')).toBeInTheDocument();
  });

  it('renders children when no error', () => {
    render(() => (
      <ErrorBoundary fallback={(error) => <div>Error</div>}>
        <div>Working component</div>
      </ErrorBoundary>
    ));

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });
});
```

## Integration Testing

### Full User Flow

```tsx
// CheckoutFlow.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import userEvent from '@testing-library/user-event';
import { CheckoutFlow } from './CheckoutFlow';

describe('Checkout Flow', () => {
  it('completes full checkout process', async () => {
    const user = userEvent.setup();

    render(() => <CheckoutFlow />);

    // Step 1: Enter shipping info
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/address/i), '123 Main St');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: Enter payment info
    await user.type(screen.getByLabelText(/card number/i), '4242424242424242');
    await user.type(screen.getByLabelText(/expiry/i), '12/25');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: Review and confirm
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // Success
    expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
  });
});
```

## Mocking

### Mock Modules

```tsx
// api.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchUsers } from './api';

vi.mock('./api', () => ({
  fetchUsers: vi.fn(() => Promise.resolve([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]))
}));

describe('API', () => {
  it('returns mocked users', async () => {
    const users = await fetchUsers();
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Alice');
  });
});
```

### Mock Server Functions

```tsx
// serverFunctions.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createUser } from './server';

vi.mock('./server', () => ({
  createUser: vi.fn(async (data) => ({
    id: 123,
    ...data
  }))
}));

describe('Server Functions', () => {
  it('creates user with mocked server function', async () => {
    const user = await createUser({
      name: 'Alice',
      email: 'alice@example.com'
    });

    expect(user.id).toBe(123);
    expect(user.name).toBe('Alice');
  });
});
```

## Best Practices

### ✅ Do: Test User Behavior, Not Implementation

```tsx
// ❌ Bad - testing implementation details
it('sets count signal to 5', () => {
  const { result } = renderHook(() => useCounter());
  result.current.count.set(5);
  expect(result.current.count()).toBe(5);
});

// ✅ Good - testing user behavior
it('displays incremented count', async () => {
  const user = userEvent.setup();
  render(() => <Counter />);

  await user.click(screen.getByRole('button', { name: /increment/i }));

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### ✅ Do: Use Semantic Queries

```tsx
// ✅ Prefer these queries (in order)
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByPlaceholderText(/enter email/i)
screen.getByText(/welcome/i)

// ❌ Avoid these
screen.getByTestId('submit-btn')
screen.getByClassName('btn-primary')
```

### ✅ Do: Clean Up After Tests

```tsx
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/philjs';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

### ❌ Don't: Test Third-Party Libraries

```tsx
// ❌ Bad - testing PhilJS itself
it('signal updates correctly', () => {
  const count = signal(0);
  count.set(1);
  expect(count()).toBe(1);
});

// ✅ Good - testing your logic
it('calculates total price correctly', () => {
  const { result } = renderHook(() => useCart());
  result.current.addItem({ price: 10, quantity: 2 });
  expect(result.current.total()).toBe(20);
});
```

## Next Steps

- [Error Boundaries](/docs/learn/error-boundaries.md) - Handle errors gracefully
- [Best Practices](/docs/best-practices/testing.md) - Advanced testing patterns
- [CI/CD](/docs/best-practices/deployment.md) - Automate testing

---

💡 **Tip**: Use `screen.debug()` to print the current DOM when debugging tests.

⚠️ **Warning**: Don't test implementation details. Focus on what users see and do.

ℹ️ **Note**: PhilJS testing utilities work seamlessly with Vitest, Jest, and other testing frameworks.
