# Detailed React to PhilJS Migration Guide

This comprehensive guide walks you through migrating React applications to PhilJS using the compatibility layer and beyond.

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Installation and Setup](#installation-and-setup)
3. [Phase 1: Compatibility Mode](#phase-1-compatibility-mode)
4. [Phase 2: Gradual Adoption](#phase-2-gradual-adoption)
5. [Phase 3: Full Migration](#phase-3-full-migration)
6. [Advanced Patterns](#advanced-patterns)
7. [Performance Optimization](#performance-optimization)
8. [Testing Strategy](#testing-strategy)
9. [Common Pitfalls](#common-pitfalls)
10. [Case Studies](#case-studies)

## Migration Overview

### Why Migrate to PhilJS?

- **Fine-grained Reactivity**: Only update what changed, not entire component trees
- **Smaller Bundle Size**: No virtual DOM overhead (~40% smaller than React)
- **Better Performance**: Direct DOM manipulation without reconciliation
- **Simpler Mental Model**: No Rules of Hooks, no stale closures
- **Better DX**: Automatic dependency tracking, no useCallback/useMemo needed

### Migration Phases

```
Phase 1: Compatibility (Day 1)
├─ Install philjs-react-compat
├─ Replace imports
└─ Verify everything works

Phase 2: Gradual Adoption (Week 1-2)
├─ Remove dependency arrays
├─ Adopt PhilJS patterns incrementally
└─ Update tests

Phase 3: Full Migration (Week 3-4)
├─ Replace useState with signal
├─ Replace useEffect with effect
├─ Remove unnecessary memoization
└─ Optimize with batching

Phase 4: Cleanup (Week 5+)
├─ Remove compatibility layer
├─ Bundle size optimization
└─ Performance profiling
```

## Installation and Setup

### 1. Install Dependencies

```bash
npm install philjs-core philjs-react-compat philjs-router
# or
yarn add philjs-core philjs-react-compat philjs-router
# or
pnpm add philjs-core philjs-react-compat philjs-router
```

### 2. Update Build Configuration

#### Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [philjs()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'philjs-core'
  }
});
```

#### TypeScript Configuration

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core",
    "types": ["philjs-core/jsx"]
  }
}
```

### 3. Update Package Scripts

```json
{
  "scripts": {
    "migrate": "jscodeshift -t node_modules/philjs-react-compat/dist/codemod/transform.js src/**/*.tsx",
    "analyze": "node scripts/analyze-migration.js"
  }
}
```

## Phase 1: Compatibility Mode

### Step 1: Replace Imports Automatically

Use the codemod to replace all React imports:

```bash
npx jscodeshift -t node_modules/philjs-react-compat/dist/codemod/transform.js src/**/*.tsx
```

This transforms:

```tsx
// Before
import React, { useState, useEffect, useMemo } from 'react';
import { createContext, useContext } from 'react';

// After
import { useState, useEffect, useMemo, createContext, useContext } from 'philjs-react-compat';
```

### Step 2: Verify Application Works

Run your application and tests:

```bash
npm run dev
npm test
```

If issues arise, check:

1. **JSX Import Source**: Ensure `jsxImportSource` is set to `philjs-core`
2. **Build Configuration**: Verify Vite/Webpack config is correct
3. **Type Definitions**: Check TypeScript finds PhilJS types

### Step 3: Update Router (if using React Router)

**Before (React Router):**
```tsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
  </Routes>
</BrowserRouter>
```

**After (PhilJS Router):**
```tsx
import { Router, Route, Link } from 'philjs-router';

<Router>
  <Route path="/" component={Home} />
  <Route path="/about" component={About} />
</Router>
```

### Step 4: Run Compatibility Report

Analyze your codebase for migration opportunities:

```tsx
import { analyzeMigration } from 'philjs-react-compat';

const report = analyzeMigration(sourceCode);
console.log('Migration opportunities:', report);
```

## Phase 2: Gradual Adoption

### Remove Dependency Arrays

PhilJS tracks dependencies automatically, so you can safely remove dependency arrays.

#### useEffect

**Before:**
```tsx
useEffect(() => {
  fetchUser(userId);
}, [userId]);

useEffect(() => {
  const timer = setInterval(() => setTime(Date.now()), 1000);
  return () => clearInterval(timer);
}, []);
```

**After:**
```tsx
useEffect(() => {
  fetchUser(userId);
}); // Auto-tracks userId

useEffect(() => {
  const timer = setInterval(() => setTime(Date.now()), 1000);
  return () => clearInterval(timer);
}); // No deps needed for mount-only effects either
```

#### useMemo

**Before:**
```tsx
const filtered = useMemo(() => {
  return items.filter(item => item.category === category);
}, [items, category]);

const sorted = useMemo(() => {
  return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
}, [filtered]);
```

**After:**
```tsx
const filtered = useMemo(() => {
  return items.filter(item => item.category === category);
}); // Auto-tracks items and category

const sorted = useMemo(() => {
  return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
}); // Auto-tracks filtered
```

### Remove useCallback

`useCallback` is unnecessary in PhilJS because functions don't cause re-renders.

**Before:**
```tsx
const handleClick = useCallback(() => {
  setCount(count + 1);
}, [count]);

const handleSubmit = useCallback((e) => {
  e.preventDefault();
  onSubmit(formData);
}, [formData, onSubmit]);
```

**After:**
```tsx
const handleClick = () => {
  setCount(count + 1);
}; // No memoization needed

const handleSubmit = (e) => {
  e.preventDefault();
  onSubmit(formData);
}; // Functions are stable in PhilJS
```

### Remove React.memo

Component memoization is automatic in PhilJS.

**Before:**
```tsx
const ExpensiveList = React.memo(({ items, onItemClick }) => {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onItemClick(item)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});
```

**After:**
```tsx
const ExpensiveList = ({ items, onItemClick }) => {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onItemClick(item)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}; // Auto-optimized with fine-grained reactivity
```

## Phase 3: Full Migration

### Migrate useState to signal

The biggest conceptual shift is moving from useState to signals.

#### Simple State

**Before:**
```tsx
const [count, setCount] = useState(0);
const [name, setName] = useState('');
const [isOpen, setIsOpen] = useState(false);

// Reading
console.log(count, name, isOpen);

// Writing
setCount(count + 1);
setName('Alice');
setIsOpen(!isOpen);

// Functional updates
setCount(c => c + 1);
```

**After:**
```tsx
const count = signal(0);
const name = signal('');
const isOpen = signal(false);

// Reading (must call the signal)
console.log(count(), name(), isOpen());

// Writing
count.set(count() + 1);
name.set('Alice');
isOpen.set(!isOpen());

// Functional updates
count.set(c => c + 1);
```

#### Object State

**Before:**
```tsx
const [user, setUser] = useState({
  name: 'Alice',
  age: 30,
  email: 'alice@example.com'
});

// Update single field
setUser({ ...user, age: 31 });

// Functional update
setUser(prev => ({ ...prev, age: prev.age + 1 }));
```

**After:**
```tsx
const user = signal({
  name: 'Alice',
  age: 30,
  email: 'alice@example.com'
});

// Update single field
user.set({ ...user(), age: 31 });

// Functional update
user.set(prev => ({ ...prev, age: prev.age + 1 }));
```

**Pro Tip:** For complex objects, consider splitting into multiple signals:

```tsx
// Instead of one signal for everything
const user = signal({ name: 'Alice', age: 30, email: 'alice@example.com' });

// Split into multiple signals for finer granularity
const userName = signal('Alice');
const userAge = signal(30);
const userEmail = signal('alice@example.com');

// Now updates to userName won't trigger updates that depend on userAge
```

#### Array State

**Before:**
```tsx
const [items, setItems] = useState([]);

// Add
setItems([...items, newItem]);

// Remove
setItems(items.filter(item => item.id !== id));

// Update
setItems(items.map(item => item.id === id ? { ...item, done: !item.done } : item));

// Clear
setItems([]);
```

**After:**
```tsx
const items = signal([]);

// Add
items.set([...items(), newItem]);

// Remove
items.set(items().filter(item => item.id !== id));

// Update
items.set(items().map(item => item.id === id ? { ...item, done: !item.done } : item));

// Clear
items.set([]);
```

### Migrate useEffect to effect

**Before:**
```tsx
import { useEffect } from 'react';

useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);

useEffect(() => {
  const timer = setInterval(() => {
    setTime(Date.now());
  }, 1000);

  return () => clearInterval(timer);
}, []);

useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]);
```

**After:**
```tsx
import { effect } from 'philjs-core';

effect(() => {
  document.title = `Count: ${count()}`;
}); // Auto-tracks count

effect(() => {
  const timer = setInterval(() => {
    time.set(Date.now());
  }, 1000);

  return () => clearInterval(timer);
}); // Still runs once

effect(() => {
  fetchUser(userId()).then(u => user.set(u));
}); // Auto-tracks userId
```

### Migrate useMemo to memo

**Before:**
```tsx
import { useMemo } from 'react';

const doubled = useMemo(() => count * 2, [count]);

const filteredItems = useMemo(() => {
  return items.filter(item => item.active);
}, [items]);

const total = useMemo(() => {
  return filteredItems.reduce((sum, item) => sum + item.price, 0);
}, [filteredItems]);
```

**After:**
```tsx
import { memo } from 'philjs-core';

const doubled = memo(() => count() * 2);

const filteredItems = memo(() => {
  return items().filter(item => item.active);
});

const total = memo(() => {
  return filteredItems().reduce((sum, item) => sum + item.price, 0);
});
```

### Update Component Props

When passing state to child components, decide whether to pass signal objects or values.

**Option 1: Pass Signal Objects (Recommended)**

```tsx
// Parent
const count = signal(0);
<Child count={count} />

// Child
function Child({ count }: { count: Signal<number> }) {
  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>Increment</button>
    </div>
  );
}
```

**Pros:**
- Child can read and write
- Reactive updates
- No prop drilling

**Option 2: Pass Values and Setters**

```tsx
// Parent
const count = signal(0);
<Child count={count()} setCount={count.set} />

// Child
function Child({ count, setCount }: { count: number; setCount: (n: number) => void }) {
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

**Pros:**
- More explicit
- Familiar React pattern
- Child is "pure"

**Cons:**
- Not reactive (child re-renders when parent re-renders)
- More props to pass

## Advanced Patterns

### Context with Signals

Create reactive context with signals:

```tsx
import { createContext, useContext, signal } from 'philjs-core';

interface ThemeContextType {
  theme: Signal<'light' | 'dark'>;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>(null!);

function ThemeProvider({ children }) {
  const theme = signal<'light' | 'dark'>('light');

  const toggleTheme = () => {
    theme.set(theme() === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button className={theme()} onClick={toggleTheme}>
      Toggle Theme
    </button>
  );
}
```

### Global State Management

Create a global store with signals:

```tsx
// store.ts
import { signal, memo } from 'philjs-core';

export const store = {
  // State
  user: signal<User | null>(null),
  cart: signal<CartItem[]>([]),

  // Computed
  cartTotal: memo(() => {
    return store.cart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }),

  // Actions
  addToCart(item: CartItem) {
    store.cart.set([...store.cart(), item]);
  },

  removeFromCart(itemId: string) {
    store.cart.set(store.cart().filter(item => item.id !== itemId));
  },

  login(user: User) {
    store.user.set(user);
  },

  logout() {
    store.user.set(null);
    store.cart.set([]);
  }
};

// Usage in components
import { store } from './store';

function Cart() {
  return (
    <div>
      <h2>Cart Total: ${store.cartTotal()}</h2>
      <ul>
        {store.cart().map(item => (
          <li key={item.id}>
            {item.name} - ${item.price}
            <button onClick={() => store.removeFromCart(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Form Management

Create reusable form hooks:

```tsx
import { signal, memo } from 'philjs-core';

function useForm<T extends Record<string, any>>(initialValues: T) {
  const values = signal(initialValues);
  const errors = signal<Partial<Record<keyof T, string>>>({});
  const touched = signal<Partial<Record<keyof T, boolean>>>({});

  const getFieldProps = (name: keyof T) => ({
    value: values()[name],
    onInput: (e: Event) => {
      const target = e.target as HTMLInputElement;
      values.set({ ...values(), [name]: target.value });
    },
    onBlur: () => {
      touched.set({ ...touched(), [name]: true });
    }
  });

  const setFieldValue = (name: keyof T, value: any) => {
    values.set({ ...values(), [name]: value });
  };

  const setFieldError = (name: keyof T, error: string) => {
    errors.set({ ...errors(), [name]: error });
  };

  const reset = () => {
    values.set(initialValues);
    errors.set({});
    touched.set({});
  };

  return {
    values,
    errors,
    touched,
    getFieldProps,
    setFieldValue,
    setFieldError,
    reset
  };
}

// Usage
function LoginForm() {
  const form = useForm({ email: '', password: '' });

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (!form.values().email) {
      form.setFieldError('email', 'Email is required');
      return;
    }

    console.log('Submit:', form.values());
  };

  return (
    <form onSubmit={handleSubmit}>
      <input {...form.getFieldProps('email')} placeholder="Email" />
      {form.errors().email && <span>{form.errors().email}</span>}

      <input {...form.getFieldProps('password')} type="password" placeholder="Password" />
      {form.errors().password && <span>{form.errors().password}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

## Performance Optimization

### Batching Updates

Use `batch()` to group multiple signal updates:

```tsx
import { signal, batch } from 'philjs-core';

const firstName = signal('');
const lastName = signal('');
const email = signal('');

// Without batching: 3 separate updates
firstName.set('Alice');
lastName.set('Smith');
email.set('alice@example.com');

// With batching: 1 combined update
batch(() => {
  firstName.set('Alice');
  lastName.set('Smith');
  email.set('alice@example.com');
});
```

### Untracking Dependencies

Use `untrack()` to read signals without creating dependencies:

```tsx
import { signal, effect, untrack } from 'philjs-core';

const count = signal(0);
const debugMode = signal(false);

effect(() => {
  console.log('Count:', count());

  // Read debugMode without tracking it
  if (untrack(() => debugMode())) {
    console.log('Debug info...');
  }
});

// This won't trigger the effect
debugMode.set(true);
```

### Lazy Initialization

For expensive computations, use memos instead of signals:

```tsx
// ❌ Bad: Computation runs immediately
const expensiveData = signal(expensiveComputation());

// ✅ Good: Computation only runs when accessed
const expensiveData = memo(() => expensiveComputation());
```

## Testing Strategy

### Unit Testing Signals

```tsx
import { signal, effect } from 'philjs-core';
import { describe, it, expect } from 'vitest';

describe('Counter', () => {
  it('should increment count', () => {
    const count = signal(0);

    count.set(count() + 1);

    expect(count()).toBe(1);
  });

  it('should trigger effects', () => {
    const count = signal(0);
    let effectCount = 0;

    effect(() => {
      count(); // Track dependency
      effectCount++;
    });

    count.set(1);

    expect(effectCount).toBe(2); // Initial + update
  });
});
```

### Component Testing

```tsx
import { render, screen } from 'philjs-testing';
import { signal } from 'philjs-core';

describe('Counter Component', () => {
  it('should display count', () => {
    const count = signal(0);
    render(<Counter count={count} />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('should increment on click', async () => {
    const count = signal(0);
    render(<Counter count={count} />);

    await userEvent.click(screen.getByText('Increment'));

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });
});
```

## Common Pitfalls

### 1. Forgetting to Call Signals

```tsx
// ❌ Wrong
<p>Count: {count}</p>

// ✅ Correct
<p>Count: {count()}</p>
```

### 2. Mutating Signal Values

```tsx
// ❌ Wrong
const items = signal([1, 2, 3]);
items().push(4); // Mutation won't trigger updates!

// ✅ Correct
items.set([...items(), 4]);
```

### 3. Reading Signals Outside Reactive Contexts

```tsx
// ❌ Wrong
const count = signal(0);
const doubled = count() * 2; // Not reactive!

// ✅ Correct
const doubled = memo(() => count() * 2); // Reactive!
```

### 4. Infinite Loops in Effects

```tsx
// ❌ Wrong
effect(() => {
  count.set(count() + 1); // Infinite loop!
});

// ✅ Correct
const doubled = memo(() => count() * 2); // Derived state
```

## Case Studies

### Case Study 1: E-commerce Product List

**React Version (Before):**
```tsx
import { useState, useEffect, useMemo, useCallback } from 'react';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (filter === 'all') return true;
      return p.category === filter;
    });
  }, [products, filter]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.price - b.price;
      return 0;
    });
  }, [filteredProducts, sortBy]);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <FilterButtons filter={filter} onChange={handleFilterChange} />
      <SortButtons sortBy={sortBy} onChange={setSortBy} />
      <div>
        {sortedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

**PhilJS Version (After):**
```tsx
import { signal, memo, effect } from 'philjs-core';

function ProductList() {
  const products = signal([]);
  const filter = signal('all');
  const sortBy = signal('name');
  const loading = signal(true);

  effect(() => {
    fetchProducts().then(data => {
      products.set(data);
      loading.set(false);
    });
  });

  const filteredProducts = memo(() => {
    return products().filter(p => {
      if (filter() === 'all') return true;
      return p.category === filter();
    });
  });

  const sortedProducts = memo(() => {
    return [...filteredProducts()].sort((a, b) => {
      if (sortBy() === 'name') return a.name.localeCompare(b.name);
      if (sortBy() === 'price') return a.price - b.price;
      return 0;
    });
  });

  if (loading()) return <div>Loading...</div>;

  return (
    <div>
      <FilterButtons filter={filter} onChange={filter.set} />
      <SortButtons sortBy={sortBy} onChange={sortBy.set} />
      <div>
        {sortedProducts().map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

**Improvements:**
- Removed dependency arrays (auto-tracking)
- Removed useCallback (unnecessary)
- Simpler code, same functionality
- Better performance (fine-grained updates)

## Summary

Migrating from React to PhilJS is a gradual process:

1. **Start with compatibility layer** - Get immediate benefits
2. **Remove dependency arrays** - Leverage auto-tracking
3. **Migrate to signals** - Better reactivity model
4. **Remove memoization wrappers** - Automatic optimization
5. **Optimize with batching** - Fine-tune performance

The compatibility layer ensures you can migrate incrementally without breaking your application. Take your time, test thoroughly, and enjoy the benefits of fine-grained reactivity!

## Next Steps

- Read the [PhilJS Core Documentation](../api-reference/core.md)
- Explore [Example Applications](../../examples)
- Join the [PhilJS Community](https://discord.gg/philjs)
- Report issues on [GitHub](https://github.com/philjs/philjs/issues)
