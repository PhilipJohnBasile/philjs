# Testing Best Practices

Comprehensive testing strategies for PhilJS applications.


## Testing Philosophy

### Test Pyramid

```
        /\
       /E2E\        ← Few, critical user flows
      /------\
     /  API   \     ← More, test integrations
    /----------\
   / Unit Tests \   ← Many, fast, isolated
  /--------------\
```

**Balance:**
- **70% Unit** - Signals, memos, effects, utilities
- **20% Integration** - Component integration, API calls
- **10% E2E** - Critical user journeys

## Unit Testing

### Testing Signals

```typescript
import { describe, it, expect } from 'vitest';
import { signal } from 'philjs-core';

describe('signal()', () => {
  it('creates reactive state', () => {
    const count = signal(0);
    expect(count()).toBe(0);
  });

  it('updates value', () => {
    const count = signal(0);
    count.set(5);
    expect(count()).toBe(5);
  });

  it('supports functional updates', () => {
    const count = signal(10);
    count.set(prev => prev + 1);
    expect(count()).toBe(11);
  });

  it('handles objects', () => {
    const user = signal({ name: 'Alice', age: 30 });

    user.set({ ...user(), age: 31 });

    expect(user()).toEqual({ name: 'Alice', age: 31 });
  });
});
```

### Testing Memos

```typescript
import { describe, it, expect, vi } from 'vitest';
import { signal, memo } from 'philjs-core';

describe('memo()', () => {
  it('computes derived value', () => {
    const count = signal(2);
    const doubled = memo(() => count() * 2);

    expect(doubled()).toBe(4);
  });

  it('updates when dependency changes', () => {
    const count = signal(2);
    const doubled = memo(() => count() * 2);

    count.set(5);

    expect(doubled()).toBe(10);
  });

  it('memoizes computation', () => {
    const count = signal(2);
    const computation = vi.fn(() => count() * 2);
    const doubled = memo(computation);

    // First read
    doubled();
    expect(computation).toHaveBeenCalledTimes(1);

    // Second read (cached)
    doubled();
    expect(computation).toHaveBeenCalledTimes(1);

    // Change dependency
    count.set(3);

    // Read again (recomputes)
    doubled();
    expect(computation).toHaveBeenCalledTimes(2);
  });

  it('chains memos', () => {
    const count = signal(2);
    const doubled = memo(() => count() * 2);
    const quadrupled = memo(() => doubled() * 2);

    expect(quadrupled()).toBe(8);

    count.set(3);
    expect(quadrupled()).toBe(12);
  });
});
```

### Testing Effects

```typescript
import { describe, it, expect, vi } from 'vitest';
import { signal, effect } from 'philjs-core';

describe('effect()', () => {
  it('runs immediately', () => {
    const spy = vi.fn();

    effect(spy);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('tracks dependencies', () => {
    const count = signal(0);
    const spy = vi.fn(() => {
      count(); // Track count
    });

    effect(spy);

    count.set(1);
    count.set(2);

    expect(spy).toHaveBeenCalledTimes(3); // Initial + 2 updates
  });

  it('calls cleanup on re-run', () => {
    const cleanup = vi.fn();
    const count = signal(0);

    effect(() => {
      count();
      return cleanup;
    });

    expect(cleanup).not.toHaveBeenCalled();

    count.set(1);
    expect(cleanup).toHaveBeenCalledTimes(1);

    count.set(2);
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it('handles async effects', async () => {
    const data = signal<string | null>(null);

    effect(async () => {
      const result = await Promise.resolve('loaded');
      data.set(result);
    });

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(data()).toBe('loaded');
  });
});
```

### Testing Custom Hooks

```typescript
import { describe, it, expect } from 'vitest';
import { signal, memo } from 'philjs-core';

function useCounter(initialValue = 0) {
  const count = signal(initialValue);
  const doubled = memo(() => count() * 2);

  const increment = () => count.set(count() + 1);
  const decrement = () => count.set(count() - 1);
  const reset = () => count.set(initialValue);

  return {
    count,
    doubled,
    increment,
    decrement,
    reset
  };
}

describe('useCounter()', () => {
  it('initializes with value', () => {
    const counter = useCounter(5);
    expect(counter.count()).toBe(5);
  });

  it('increments count', () => {
    const counter = useCounter(0);
    counter.increment();
    expect(counter.count()).toBe(1);
  });

  it('decrements count', () => {
    const counter = useCounter(5);
    counter.decrement();
    expect(counter.count()).toBe(4);
  });

  it('doubles count', () => {
    const counter = useCounter(3);
    expect(counter.doubled()).toBe(6);

    counter.increment();
    expect(counter.doubled()).toBe(8);
  });

  it('resets to initial value', () => {
    const counter = useCounter(10);

    counter.increment();
    counter.increment();
    expect(counter.count()).toBe(12);

    counter.reset();
    expect(counter.count()).toBe(10);
  });
});
```

## Component Testing

### Testing Presentational Components

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();

    render(<Button label="Click me" onClick={handleClick} />);

    await screen.getByText('Click me').click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables when disabled prop is true', () => {
    render(<Button label="Click me" onClick={() => {}} disabled />);

    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('applies variant class', () => {
    render(<Button label="Click me" onClick={() => {}} variant="primary" />);

    expect(screen.getByText('Click me')).toHaveClass('btn-primary');
  });
});
```

### Testing Container Components

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/philjs';
import { UserProfile } from './UserProfile';

// Mock API
vi.mock('./api', () => ({
  fetchUser: vi.fn()
}));

import { fetchUser } from './api';

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    fetchUser.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<UserProfile userId="123" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    fetchUser.mockRejectedValue(new Error('Failed to fetch'));

    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('shows user data', async () => {
    const mockUser = {
      id: '123',
      name: 'Alice Smith',
      email: 'alice@example.com'
    };

    fetchUser.mockResolvedValue(mockUser);

    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });
  });

  it('refetches when userId changes', async () => {
    fetchUser.mockResolvedValue({ id: '123', name: 'Alice' });

    const { rerender } = render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(fetchUser).toHaveBeenCalledWith('123');
    });

    fetchUser.mockResolvedValue({ id: '456', name: 'Bob' });

    rerender(<UserProfile userId="456" />);

    await waitFor(() => {
      expect(fetchUser).toHaveBeenCalledWith('456');
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });
});
```

### Testing Forms

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import { userEvent } from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('validates required fields', async () => {
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByText('Log In');
    await submitButton.click();

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<LoginForm onSubmit={() => {}} />);

    const emailInput = screen.getByLabelText('Email');
    await userEvent.type(emailInput, 'invalid-email');

    const submitButton = screen.getByText('Log In');
    await submitButton.click();

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('submits valid form', async () => {
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');

    await screen.getByText('Log In').click();

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'password123'
    });
  });

  it('shows loading state during submission', async () => {
    const handleSubmit = vi.fn(() => new Promise(() => {})); // Never resolves

    render(<LoginForm onSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');

    await screen.getByText('Log In').click();

    expect(screen.getByText('Logging in...')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeDisabled();
  });
});
```

## Integration Testing

### Testing with Context

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import { createContext } from 'philjs-core';
import { ThemedButton } from './ThemedButton';

const ThemeContext = createContext('light');

describe('ThemedButton with Context', () => {
  it('uses theme from context', () => {
    render(
      <ThemeContext.Provider value="dark">
        <ThemedButton>Click me</ThemedButton>
      </ThemeContext.Provider>
    );

    expect(screen.getByText('Click me')).toHaveClass('btn-dark');
  });

  it('falls back to default theme', () => {
    render(<ThemedButton>Click me</ThemedButton>);

    expect(screen.getByText('Click me')).toHaveClass('btn-light');
  });
});
```

### Testing with Router

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/philjs';
import { Router, Route } from 'philjs-router';
import { App } from './App';

describe('App Routing', () => {
  it('renders home page', () => {
    render(
      <Router initialPath="/">
        <App />
      </Router>
    );

    expect(screen.getByText('Welcome Home')).toBeInTheDocument();
  });

  it('renders about page', () => {
    render(
      <Router initialPath="/about">
        <App />
      </Router>
    );

    expect(screen.getByText('About Us')).toBeInTheDocument();
  });

  it('handles 404', () => {
    render(
      <Router initialPath="/nonexistent">
        <App />
      </Router>
    );

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});
```

### Testing API Integration

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/philjs';
import { ProductList } from './ProductList';

const server = setupServer(
  http.get('/api/products', () => {
    return HttpResponse.json([
      { id: '1', name: 'Product 1', price: 10 },
      { id: '2', name: 'Product 2', price: 20 }
    ]);
  })
);

beforeEach(() => server.listen());
afterEach(() => server.close());

describe('ProductList API Integration', () => {
  it('fetches and displays products', async () => {
    render(<ProductList />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    server.use(
      http.get('/api/products', () => {
        return HttpResponse.error();
      })
    );

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('handles empty results', async () => {
    server.use(
      http.get('/api/products', () => {
        return HttpResponse.json([]);
      })
    );

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument();
    });
  });
});
```

## E2E Testing

### Playwright Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test('user can log in', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'alice@example.com');
    await page.fill('input[name="password"]', 'password123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome, Alice')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'alice@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('user can log out', async ({ page }) => {
    // Assume user is logged in
    await page.goto('/dashboard');

    await page.click('button:has-text("Logout")');

    await expect(page).toHaveURL('/login');
  });
});

test.describe('Shopping Cart', () => {
  test('user can add items to cart', async ({ page }) => {
    await page.goto('/products');

    await page.click('button:has-text("Add to Cart")').first();

    const cartBadge = page.locator('.cart-badge');
    await expect(cartBadge).toHaveText('1');
  });

  test('user can complete checkout', async ({ page }) => {
    await page.goto('/cart');

    await page.click('button:has-text("Checkout")');

    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');

    await page.click('button:has-text("Pay")');

    await expect(page.locator('text=Order Confirmed')).toBeVisible();
  });
});
```

## Testing Best Practices

### Arrange-Act-Assert Pattern

```typescript
it('increments counter', () => {
  // Arrange
  const counter = useCounter(0);

  // Act
  counter.increment();

  // Assert
  expect(counter.count()).toBe(1);
});
```

### Test One Thing

```typescript
// ❌ Testing too much
it('manages user profile', async () => {
  const profile = createUserProfile();

  profile.setName('Alice');
  expect(profile.name()).toBe('Alice');

  profile.setEmail('alice@example.com');
  expect(profile.email()).toBe('alice@example.com');

  await profile.save();
  expect(profile.saved()).toBe(true);
});

// ✅ Separate tests
it('sets user name', () => {
  const profile = createUserProfile();
  profile.setName('Alice');
  expect(profile.name()).toBe('Alice');
});

it('sets user email', () => {
  const profile = createUserProfile();
  profile.setEmail('alice@example.com');
  expect(profile.email()).toBe('alice@example.com');
});

it('saves profile', async () => {
  const profile = createUserProfile();
  await profile.save();
  expect(profile.saved()).toBe(true);
});
```

### Use Descriptive Names

```typescript
// ❌ Unclear
it('works', () => {
  // ...
});

// ✅ Clear
it('increments count when button is clicked', () => {
  // ...
});
```

### Avoid Implementation Details

```typescript
// ❌ Testing implementation
it('calls setState with incremented value', () => {
  const counter = useCounter();
  const spy = vi.spyOn(counter.count, 'set');

  counter.increment();

  expect(spy).toHaveBeenCalledWith(1);
});

// ✅ Testing behavior
it('increments count', () => {
  const counter = useCounter();

  counter.increment();

  expect(counter.count()).toBe(1);
});
```

## Coverage Goals

**Target Coverage:**
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

**Priority:**
- Critical paths: 100%
- Business logic: >90%
- UI components: >70%
- Utils: >90%

## Summary

**Testing Best Practices:**

✅ Write tests that verify behavior, not implementation
✅ Use the test pyramid: many unit, some integration, few E2E
✅ Test signals, memos, and effects in isolation
✅ Mock external dependencies
✅ Use descriptive test names
✅ Follow Arrange-Act-Assert pattern
✅ Test error states and edge cases
✅ Maintain good coverage
✅ Run tests in CI/CD
✅ Keep tests fast and reliable

**Next:** [Code Organization →](./code-organization.md)
