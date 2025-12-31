# Testing PhilJS Applications

Testing is crucial for building reliable applications. PhilJS provides excellent testing utilities and integrates seamlessly with popular testing frameworks.

## Table of Contents

- [Testing Setup](#testing-setup)
- [Unit Testing Components](#unit-testing-components)
- [Testing Signals and Effects](#testing-signals-and-effects)
- [Mocking Patterns](#mocking-patterns)
- [Integration Testing](#integration-testing)
- [E2E Testing Setup](#e2e-testing-setup)
- [Best Practices](#best-practices)

## Testing Setup

### Install Dependencies

```bash
# For unit and integration tests
npm install --save-dev vitest @testing-library/philjs @testing-library/user-event jsdom

# For E2E tests
npm install --save-dev @playwright/test
```

### Vitest Configuration Examples

#### Basic Configuration

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

#### Advanced Configuration with Coverage

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.spec.ts',
        'src/**/*.spec.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

#### Configuration with TypeScript Path Mapping

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
```

### Setup File

```ts
// test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/philjs';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock global APIs if needed
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch if not using a fetch library
global.fetch = vi.fn();
```

## Unit Testing Components

Unit testing focuses on testing individual components in isolation. PhilJS components can be tested using standard testing libraries like Vitest and Testing Library.

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

## Testing Signals and Effects

PhilJS's reactive system is built on signals and effects. Understanding how to test these primitives is essential for building reliable applications.

### Testing Signal Behavior

```tsx
// signal.test.ts
import { describe, it, expect, vi } from 'vitest';
import { signal, effect } from '@philjs/core';

describe('Signal basics', () => {
  it('creates signal with initial value', () => {
    const count = signal(0);
    expect(count()).toBe(0);
  });

  it('updates signal value', () => {
    const count = signal(0);
    count.set(5);
    expect(count()).toBe(5);
  });

  it('supports updater function', () => {
    const count = signal(0);
    count.set(c => c + 1);
    expect(count()).toBe(1);
  });

  it('does not trigger effects for same value (Object.is)', () => {
    const count = signal(0);
    const spy = vi.fn();

    effect(() => {
      count();
      spy();
    });

    spy.mockClear();
    count.set(0); // Same value
    expect(spy).not.toHaveBeenCalled();
  });

  it('peek() reads without tracking dependencies', () => {
    const count = signal(0);
    const spy = vi.fn();

    effect(() => {
      count.peek(); // Untracked
      spy();
    });

    spy.mockClear();
    count.set(5);
    expect(spy).not.toHaveBeenCalled();
  });

  it('subscribe() allows manual subscription', () => {
    const count = signal(0);
    const spy = vi.fn();

    const unsubscribe = count.subscribe(spy);

    count.set(1);
    expect(spy).toHaveBeenCalledWith(1);

    spy.mockClear();
    unsubscribe();
    count.set(2);
    expect(spy).not.toHaveBeenCalled();
  });
});
```

### Testing Custom Hooks with Signals

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

### Testing Memos (Computed Values)

```tsx
// memo.test.ts
import { describe, it, expect, vi } from 'vitest';
import { signal, memo } from '@philjs/core';

describe('Memo behavior', () => {
  it('recalculates when dependency changes', () => {
    let calculations = 0;

    const count = signal(0);
    const doubled = memo(() => {
      calculations++;
      return count() * 2;
    });

    expect(doubled()).toBe(0);
    expect(calculations).toBe(1);

    count.set(5);
    expect(doubled()).toBe(10);
    expect(calculations).toBe(2);
  });

  it('does not recalculate when dependency is unchanged', () => {
    let calculations = 0;

    const count = signal(0);
    const doubled = memo(() => {
      calculations++;
      return count() * 2;
    });

    const value1 = doubled();
    const value2 = doubled();

    expect(value1).toBe(value2);
    expect(calculations).toBe(1);
  });

  it('tracks multiple dependencies', () => {
    const a = signal(1);
    const b = signal(2);
    const sum = memo(() => a() + b());

    expect(sum()).toBe(3);
    a.set(10);
    expect(sum()).toBe(12);
    b.set(20);
    expect(sum()).toBe(30);
  });

  it('supports chained memos', () => {
    const a = signal(2);
    const b = memo(() => a() * 2);
    const c = memo(() => b() * 2);

    expect(c()).toBe(8);
    a.set(3);
    expect(c()).toBe(12);
  });

  it('handles diamond dependency graph', () => {
    const source = signal(1);
    const left = memo(() => source() * 2);
    const right = memo(() => source() + 10);
    const combined = memo(() => left() + right());

    expect(combined()).toBe(13); // (1*2) + (1+10) = 13

    source.set(2);
    expect(combined()).toBe(16); // (2*2) + (2+10) = 16
  });
});
```

### Testing Effects

```tsx
// effect.test.ts
import { describe, it, expect, vi } from 'vitest';
import { signal, effect, onCleanup, batch } from '@philjs/core';

describe('Effect behavior', () => {
  it('runs immediately', () => {
    const spy = vi.fn();
    const dispose = effect(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('re-runs when dependencies change', () => {
    const count = signal(0);
    const spy = vi.fn();

    const dispose = effect(() => {
      count();
      spy();
    });

    spy.mockClear();
    count.set(1);
    expect(spy).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('tracks multiple dependencies', () => {
    const a = signal(1);
    const b = signal(2);
    const spy = vi.fn();

    const dispose = effect(() => {
      a();
      b();
      spy();
    });

    spy.mockClear();

    a.set(10);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    b.set(20);
    expect(spy).toHaveBeenCalledTimes(1);

    dispose();
  });

  it('supports cleanup function', () => {
    const cleanup = vi.fn();
    const dispose = effect(() => cleanup);

    expect(cleanup).not.toHaveBeenCalled();
    dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('runs cleanup before re-execution', () => {
    const count = signal(0);
    const cleanup = vi.fn();

    const dispose = effect(() => {
      count();
      return cleanup;
    });

    cleanup.mockClear();
    count.set(1);

    expect(cleanup).toHaveBeenCalled();
    dispose();
  });

  it('can be disposed', () => {
    const count = signal(0);
    const spy = vi.fn();

    const dispose = effect(() => {
      count();
      spy();
    });

    spy.mockClear();
    dispose();

    count.set(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('uses onCleanup helper', () => {
    const cleanup = vi.fn();

    const dispose = effect(() => {
      onCleanup(cleanup);
    });

    expect(cleanup).not.toHaveBeenCalled();
    dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

describe('Batching updates', () => {
  it('batches multiple signal updates', () => {
    const a = signal(1);
    const b = signal(2);
    const spy = vi.fn();

    const dispose = effect(() => {
      a();
      b();
      spy();
    });

    spy.mockClear();

    batch(() => {
      a.set(10);
      b.set(20);
    });

    // Should only trigger one update
    expect(spy).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('handles nested batching', () => {
    const count = signal(0);
    const spy = vi.fn();

    const dispose = effect(() => {
      count();
      spy();
    });

    spy.mockClear();

    batch(() => {
      count.set(1);
      batch(() => {
        count.set(2);
      });
      count.set(3);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    dispose();
  });
});

### Testing Effects with Side Effects

```tsx
// useDocumentTitle.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/philjs';
import { signal, effect } from '@philjs/core';

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

### Testing Resources (Async Data)

```tsx
// resource.test.ts
import { describe, it, expect } from 'vitest';
import { resource } from '@philjs/core';

describe('Resource behavior', () => {
  it('creates resource with initial value', () => {
    const user = resource(() => ({ name: 'Alice' }));

    expect(user.loading()).toBe(false);
    expect(user.error()).toBe(null);
    expect(user()).toEqual({ name: 'Alice' });
  });

  it('handles async fetching', async () => {
    const fetchUser = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { name: 'Bob' };
    };

    const user = resource(fetchUser);

    expect(user.loading()).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(user.loading()).toBe(false);
    expect(user()).toEqual({ name: 'Bob' });
  });

  it('handles errors', async () => {
    const fetchUser = async () => {
      throw new Error('Failed to fetch');
    };

    const user = resource(fetchUser);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(user.loading()).toBe(false);
    expect(user.error()).toBeInstanceOf(Error);
    expect(user.error()?.message).toBe('Failed to fetch');
  });

  it('can be refreshed', async () => {
    let callCount = 0;
    const fetchUser = async () => {
      callCount++;
      return { name: 'User' + callCount };
    };

    const user = resource(fetchUser);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(user()).toEqual({ name: 'User1' });

    user.refresh();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(user()).toEqual({ name: 'User2' });
  });
});

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
import { Suspense } from '@philjs/core';
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
import { ErrorBoundary } from '@philjs/core';

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

## Mocking Patterns

Effective mocking is essential for isolating units of code and testing them in controlled environments. Here are comprehensive mocking patterns for PhilJS applications.

### Mocking Modules

```tsx
// api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUsers } from './api';

// Mock entire module
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

### Mocking Fetch API

```tsx
// userService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserById } from './userService';

describe('UserService', () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches user successfully', async () => {
    const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com' };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const user = await getUserById(1);

    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });

  it('handles fetch errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getUserById(999)).rejects.toThrow('User not found');
  });

  it('handles network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(getUserById(1)).rejects.toThrow('Network error');
  });
});
```

### Mocking Server Functions

```tsx
// serverFunctions.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createUser, updateUser, deleteUser } from './server';

vi.mock('./server', () => ({
  createUser: vi.fn(async (data) => ({
    id: 123,
    ...data,
    createdAt: new Date('2024-01-01'),
  })),
  updateUser: vi.fn(async (id, data) => ({
    id,
    ...data,
    updatedAt: new Date('2024-01-01'),
  })),
  deleteUser: vi.fn(async (id) => ({ success: true })),
}));

describe('Server Functions', () => {
  it('creates user with mocked server function', async () => {
    const user = await createUser({
      name: 'Alice',
      email: 'alice@example.com'
    });

    expect(user.id).toBe(123);
    expect(user.name).toBe('Alice');
    expect(createUser).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com'
    });
  });

  it('updates user', async () => {
    const updated = await updateUser(1, { name: 'Bob' });

    expect(updated.id).toBe(1);
    expect(updated.name).toBe('Bob');
    expect(updateUser).toHaveBeenCalledWith(1, { name: 'Bob' });
  });

  it('deletes user', async () => {
    const result = await deleteUser(1);

    expect(result.success).toBe(true);
    expect(deleteUser).toHaveBeenCalledWith(1);
  });
});
```

### Mocking Context Providers

```tsx
// useAuth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/philjs';
import { AuthContext, useAuth } from './AuthContext';
import { signal } from '@philjs/core';

describe('useAuth', () => {
  it('uses auth context', () => {
    const mockUser = signal({ id: 1, name: 'Alice' });
    const mockLogout = vi.fn();

    // Create mock context value
    const mockAuthValue = {
      user: mockUser,
      logout: mockLogout,
      isAuthenticated: () => !!mockUser(),
    };

    // Mock the provider
    AuthContext.Provider({
      value: mockAuthValue,
      children: null as any,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user()).toEqual({ id: 1, name: 'Alice' });
    expect(result.current.isAuthenticated()).toBe(true);

    result.current.logout();
    expect(mockLogout).toHaveBeenCalled();
  });
});
```

### Mocking Timers

```tsx
// timer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal, effect } from '@philjs/core';

describe('Timer functionality', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates after delay', () => {
    const count = signal(0);

    setTimeout(() => {
      count.set(5);
    }, 1000);

    expect(count()).toBe(0);

    vi.advanceTimersByTime(1000);

    expect(count()).toBe(5);
  });

  it('handles setInterval', () => {
    const count = signal(0);

    const interval = setInterval(() => {
      count.set(c => c() + 1);
    }, 100);

    expect(count()).toBe(0);

    vi.advanceTimersByTime(250);
    expect(count()).toBe(2);

    vi.advanceTimersByTime(250);
    expect(count()).toBe(4);

    clearInterval(interval);
  });

  it('can fast-forward to next timer', () => {
    const spy = vi.fn();

    setTimeout(() => spy('first'), 100);
    setTimeout(() => spy('second'), 200);

    vi.runOnlyPendingTimers();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('first');

    vi.runOnlyPendingTimers();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('second');
  });
});
```

### Mocking LocalStorage

```tsx
// storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { saveToStorage, loadFromStorage } from './storage';

describe('Storage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('saves and loads data', () => {
    const data = { user: 'Alice', theme: 'dark' };

    saveToStorage('settings', data);
    const loaded = loadFromStorage('settings');

    expect(loaded).toEqual(data);
  });

  it('handles missing keys', () => {
    const result = loadFromStorage('nonexistent');
    expect(result).toBeNull();
  });

  it('handles invalid JSON', () => {
    localStorage.setItem('corrupt', 'not-valid-json');
    const result = loadFromStorage('corrupt');
    expect(result).toBeNull();
  });
});
```

### Mocking Router

```tsx
// navigation.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import userEvent from '@testing-library/user-event';
import { Router, useRouter } from '@philjs/router';

vi.mock('@philjs/router', () => ({
  useRouter: vi.fn(),
  Router: ({ children }: any) => children,
}));

describe('Navigation', () => {
  it('navigates on button click', async () => {
    const mockNavigate = vi.fn();
    const mockRouter = {
      navigate: mockNavigate,
      location: () => ({ pathname: '/' }),
    };

    (useRouter as any).mockReturnValue(mockRouter);

    const user = userEvent.setup();

    render(() => (
      <button onClick={() => mockRouter.navigate('/about')}>
        Go to About
      </button>
    ));

    await user.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('/about');
  });
});
```

### Mocking WebSocket

```tsx
// websocket.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal, effect } from '@philjs/core';

// Mock WebSocket
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  send = vi.fn();
  close = vi.fn();

  // Helper to simulate events
  simulateOpen() {
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: any) {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }

  simulateClose() {
    this.onclose?.(new CloseEvent('close'));
  }
}

describe('WebSocket connection', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    mockWs = new MockWebSocket();
    (global as any).WebSocket = vi.fn(() => mockWs);
  });

  it('connects and receives messages', () => {
    const messages = signal<string[]>([]);
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      messages.set([...messages(), event.data]);
    };

    mockWs.simulateOpen();
    mockWs.simulateMessage('Hello');
    mockWs.simulateMessage('World');

    expect(messages()).toEqual(['Hello', 'World']);
  });

  it('sends messages', () => {
    const ws = new WebSocket('ws://localhost:8080');
    mockWs.simulateOpen();

    ws.send('test message');

    expect(mockWs.send).toHaveBeenCalledWith('test message');
  });
});
```

## Integration Testing

Integration tests verify that different parts of your application work together correctly.

### Testing Multiple Components Together

```tsx
// TodoApp.integration.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import userEvent from '@testing-library/user-event';
import { TodoApp } from './TodoApp';

describe('TodoApp Integration', () => {
  it('adds and removes todos', async () => {
    const user = userEvent.setup();
    render(() => <TodoApp />);

    // Add first todo
    await user.type(screen.getByPlaceholderText(/add todo/i), 'Buy milk');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByText('Buy milk')).toBeInTheDocument();

    // Add second todo
    await user.type(screen.getByPlaceholderText(/add todo/i), 'Walk dog');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByText('Walk dog')).toBeInTheDocument();

    // Remove first todo
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
    expect(screen.getByText('Walk dog')).toBeInTheDocument();
  });

  it('marks todos as complete', async () => {
    const user = userEvent.setup();
    render(() => <TodoApp />);

    await user.type(screen.getByPlaceholderText(/add todo/i), 'Test todo');
    await user.click(screen.getByRole('button', { name: /add/i }));

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByText('Test todo')).toHaveClass('completed');
  });
});
```

### Testing Signal + Context Integration

```tsx
// themeIntegration.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import userEvent from '@testing-library/user-event';
import { signal } from '@philjs/core';
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

describe('Theme Integration', () => {
  it('provides and updates theme across components', async () => {
    const user = userEvent.setup();

    render(() => (
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    ));

    expect(screen.getByText('Current theme: light')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
  });
});
```

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

## Snapshot Testing

PhilJS provides powerful snapshot testing utilities for capturing and comparing component state.

### DOM Snapshots

```tsx
// snapshot.test.tsx
import { describe, it } from 'vitest';
import { render, takeSnapshot, createSnapshotMatcher } from '@philjs/testing';
import { UserCard } from './UserCard';

describe('UserCard snapshots', () => {
  const matcher = createSnapshotMatcher();

  it('matches snapshot for default user', () => {
    const { container } = render(() => (
      <UserCard
        user={{ name: 'Alice', email: 'alice@example.com' }}
      />
    ));

    matcher.matchSnapshot('default-user', container);
  });

  it('matches snapshot for premium user', () => {
    const { container } = render(() => (
      <UserCard
        user={{ name: 'Bob', email: 'bob@example.com', premium: true }}
      />
    ));

    matcher.matchSnapshot('premium-user', container);
  });
});
```

### Signal State Snapshots

```tsx
// signalSnapshot.test.ts
import { describe, it, expect } from 'vitest';
import { snapshotSignalState, compareSignalSnapshots } from '@philjs/testing';
import { signal } from '@philjs/core';

describe('Signal state snapshots', () => {
  it('captures signal state', () => {
    const count = signal(0);
    const name = signal('test');
    const active = signal(true);

    const snapshot = snapshotSignalState({ count, name, active });

    expect(snapshot).toMatchInlineSnapshot(`
      {
        "count": 0,
        "name": "test",
        "active": true
      }
    `);
  });

  it('compares signal states', () => {
    const count = signal(5);
    const name = signal('test');

    const result = compareSignalSnapshots(
      { count, name },
      { count: 5, name: 'test' }
    );

    expect(result.match).toBe(true);
  });
});
```

### Custom Snapshot Options

```tsx
import { takeSnapshot } from '@philjs/testing';

const result = takeSnapshot(element, {
  maxLength: 5000,
  includeSignals: true,
  serializer: (el) => el.outerHTML,
});

if (!result.toMatch(expectedSnapshot)) {
  console.log('Diff:', result.diff(expectedSnapshot));
}
```

## Setup Files

### Vitest Setup

```ts
// vitest.setup.ts
import '@philjs/testing/vitest';

// Custom setup if needed
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
});
```

### Jest Setup

```ts
// jest.setup.ts
import '@philjs/testing/jest';

// Custom matchers will be automatically extended
```

```js
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
```

## Advanced Testing Patterns

### Testing Custom Hooks

```tsx
// useCounter.ts
import { signal } from '@philjs/core';

export function useCounter(initialValue = 0) {
  const count = signal(initialValue);

  return {
    count,
    increment: () => count.set(c => c + 1),
    decrement: () => count.set(c => c - 1),
    reset: () => count.set(initialValue),
  };
}

// useCounter.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@philjs/testing';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count()).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count()).toBe(1);
  });

  it('supports initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count()).toBe(10);
  });
});
```

### Testing Server Functions

```tsx
// api.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@philjs/testing';
import { UserList } from './UserList';

describe('Server function integration', () => {
  it('loads users from server', async () => {
    // Mock server function
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ]),
      } as Response)
    );

    render(() => <UserList />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('handles server errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Server error'))
    );

    render(() => <UserList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Testing with Context Providers

```tsx
// ThemeContext.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@philjs/testing';
import userEvent from '@philjs/testing/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';

function TestComponent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <span data-testid="theme">{theme()}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  it('provides theme to children', () => {
    render(() => (
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    ));

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('toggles theme', async () => {
    const user = userEvent.setup();

    render(() => (
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    ));

    await user.click(screen.getByRole('button'));

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });
});
```

### Testing Async Data Loading

```tsx
// DataLoader.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitForLoadingToFinish } from '@philjs/testing';
import { DataLoader } from './DataLoader';

describe('DataLoader', () => {
  it('shows loading state', () => {
    render(() => <DataLoader url="/api/data" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('loads and displays data', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      } as Response)
    );

    render(() => <DataLoader url="/api/data" />);

    await waitForLoadingToFinish();

    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Testing Forms with Validation

```tsx
// ContactForm.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@philjs/testing';
import userEvent from '@philjs/testing/user-event';
import { ContactForm } from './ContactForm';

describe('ContactForm validation', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(() => <ContactForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();

    render(() => <ContactForm />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('submits valid form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(() => <ContactForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'Alice');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello!');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello!',
    });
  });
});
```

### Performance Testing

```tsx
// performance.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@philjs/testing';
import { signal, memo } from '@philjs/core';
import { HeavyComponent } from './HeavyComponent';

describe('Performance tests', () => {
  it('memoizes expensive computations', () => {
    let computeCount = 0;

    const data = signal([1, 2, 3]);
    const sum = memo(() => {
      computeCount++;
      return data().reduce((a, b) => a + b, 0);
    });

    // Access multiple times
    sum();
    sum();
    sum();

    // Should only compute once
    expect(computeCount).toBe(1);

    // Update data
    data.set([1, 2, 3, 4]);
    sum();

    // Should compute again
    expect(computeCount).toBe(2);
  });

  it('renders large lists efficiently', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    const start = performance.now();
    const { container } = render(() => <HeavyComponent items={items} />);
    const duration = performance.now() - start;

    expect(container.querySelectorAll('li')).toHaveLength(1000);
    expect(duration).toBeLessThan(100); // Should render in < 100ms
  });
});
```

## Test Organization

### Grouping Related Tests

```tsx
describe('UserProfile', () => {
  describe('rendering', () => {
    it('displays user name', () => {
      // ...
    });

    it('displays user avatar', () => {
      // ...
    });
  });

  describe('editing', () => {
    it('enables edit mode', () => {
      // ...
    });

    it('saves changes', () => {
      // ...
    });
  });

  describe('permissions', () => {
    it('shows edit button for own profile', () => {
      // ...
    });

    it('hides edit button for other profiles', () => {
      // ...
    });
  });
});
```

### Shared Setup

```tsx
describe('TodoList', () => {
  let mockTodos: Todo[];
  let onAdd: Mock;
  let onDelete: Mock;

  beforeEach(() => {
    mockTodos = [
      { id: 1, text: 'Task 1', completed: false },
      { id: 2, text: 'Task 2', completed: true },
    ];

    onAdd = vi.fn();
    onDelete = vi.fn();
  });

  it('displays todos', () => {
    render(() => <TodoList todos={mockTodos} />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });

  it('adds new todo', async () => {
    const user = userEvent.setup();

    render(() => <TodoList todos={mockTodos} onAdd={onAdd} />);

    await user.type(screen.getByPlaceholderText(/add/i), 'New task');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(onAdd).toHaveBeenCalledWith('New task');
  });
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
