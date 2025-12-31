# Best Practices Overview

Essential patterns and guidelines for building production-ready PhilJS applications.

## Introduction

This section provides comprehensive best practices for PhilJS development. These guidelines are based on real-world experience, performance testing, and community feedback.

## Core Principles

### 1. Explicit Over Implicit

PhilJS favors explicit code that's easy to understand and debug.

**✅ Good:**
```tsx
const count = signal(0);
const doubled = memo(() => count() * 2);

effect(() => {
  console.log('Count:', count());
});
```

**❌ Avoid:**
```tsx
// Relying on implicit behavior
let count = 0; // Not reactive!
const doubled = count * 2; // Not memoized!
```

### 2. Immutability

Always use immutable updates for signals.

**✅ Good:**
```tsx
const user = signal({ name: 'Alice', age: 30 });

user.set({
  ...user(),
  age: 31
});
```

**❌ Avoid:**
```tsx
user().age = 31; // Mutation doesn't trigger updates!
user.set(user()); // Same reference, no update!
```

### 3. Composition Over Complexity

Break complex logic into small, composable pieces.

**✅ Good:**
```tsx
function useAuth() {
  const user = signal<User | null>(null);
  const isAuthenticated = memo(() => user() !== null);

  const login = async (credentials: Credentials) => {
    const userData = await authService.login(credentials);
    user.set(userData);
  };

  return { user, isAuthenticated, login };
}

function usePermissions() {
  const { user } = useAuth();
  const canEdit = memo(() => user()?.role === 'admin');

  return { canEdit };
}
```

**❌ Avoid:**
```tsx
function useEverything() {
  // Giant function doing too much
  const user = signal(null);
  const posts = signal([]);
  const comments = signal([]);
  const likes = signal([]);
  // ... hundreds of lines
}
```

### 4. Type Safety

Leverage TypeScript for better development experience.

**✅ Good:**
```tsx
interface User {
  id: string;
  name: string;
  email: string;
}

const user = signal<User | null>(null);

function UserProfile({ userId }: { userId: string }) {
  // Type-safe throughout
}
```

**❌ Avoid:**
```tsx
const user = signal<any>(null); // Loses type safety
const data: any = fetchData(); // Loses type safety
```

### 5. Performance by Default

Write code that performs well without manual optimization.

**✅ Good:**
```tsx
const filtered = memo(() => {
  return items().filter(item => item.active);
});

const sorted = memo(() => {
  return filtered().sort((a, b) => a.name.localeCompare(b.name));
});
```

**❌ Avoid:**
```tsx
// Recomputing on every render
return items()
  .filter(item => item.active)
  .sort((a, b) => a.name.localeCompare(b.name));
```

## Best Practice Categories

### Component Patterns
Learn how to structure components effectively:
- Presentational vs Container components
- Composition patterns
- Props design
- Component lifecycle

→ [Component Patterns](./component-patterns.md)

### State Management
Master state management at all scales:
- Local state patterns
- Global state strategies
- State composition
- State machines

→ [State Management](./state-management.md)

### Performance
Optimize for speed and efficiency:
- Memoization strategies
- Batching updates
- Lazy loading
- Bundle optimization

→ [Performance](./performance.md)

### Testing
Write maintainable, reliable tests:
- Unit testing signals and effects
- Component testing
- Integration testing
- E2E testing

→ [Testing](./testing.md)

### Code Organization
Structure your project for scale:
- Directory structure
- File naming conventions
- Module organization
- Dependency management

→ [Code Organization](./code-organization.md)

### Architecture
Design scalable applications:
- Application structure
- Layer separation
- Dependency injection
- Plugin architecture

→ [Architecture](./architecture.md)

### Security
Protect your application and users:
- XSS prevention
- CSRF protection
- Authentication patterns
- Authorization strategies

→ [Security](./security.md)

### Accessibility
Build inclusive applications:
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Screen reader support

→ [Accessibility](./accessibility.md)

### Production
Deploy with confidence:
- Build optimization
- Environment configuration
- Error tracking
- Monitoring

→ [Production](./production.md)

## Quick Reference

### Signal Best Practices

```tsx
// ✅ Initialize with correct type
const count = signal<number>(0);
const user = signal<User | null>(null);

// ✅ Use functional updates for complex logic
count.set(prev => prev + 1);

// ✅ Batch related updates
batch(() => {
  firstName.set('Alice');
  lastName.set('Smith');
  age.set(30);
});

// ❌ Don't mutate signal values
const user = signal({ name: 'Alice' });
user().name = 'Bob'; // Bad!

// ❌ Don't create signals in loops
items().forEach(item => {
  const selected = signal(false); // Bad!
});
```

### Memo Best Practices

```tsx
// ✅ Use memo for derived values
const total = memo(() => items().reduce((sum, item) => sum + item.price, 0));

// ✅ Chain memos for complex computations
const filtered = memo(() => items().filter(item => item.active));
const sorted = memo(() => filtered().sort((a, b) => a.name.localeCompare(b.name)));

// ❌ Don't use memo for simple references
const userName = memo(() => user().name); // Overkill

// ❌ Don't put side effects in memo
const badMemo = memo(() => {
  console.log('Computing'); // Side effect!
  return count() * 2;
});
```

### Effect Best Practices

```tsx
// ✅ Use effects for side effects only
effect(() => {
  console.log('Count changed:', count());
});

// ✅ Return cleanup functions
effect(() => {
  const id = setInterval(() => tick(), 1000);
  return () => clearInterval(id);
});

// ✅ Handle async properly
effect(async () => {
  const data = await fetchData(userId());
  results.set(data);
});

// ❌ Don't update signals that the effect reads
effect(() => {
  const value = count();
  count.set(value + 1); // Infinite loop!
});

// ❌ Don't create effects in loops
items().forEach(item => {
  effect(() => console.log(item)); // Bad!
});
```

### Component Best Practices

```tsx
// ✅ Define clear prop interfaces
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

// ✅ Keep components focused
function UserCard({ user }: { user: User }) {
  return (
    <div className="card">
      <UserAvatar user={user} />
      <UserInfo user={user} />
      <UserActions user={user} />
    </div>
  );
}

// ❌ Don't create components inside components
function Parent() {
  function Child() { // Bad! Creates new component on every render
    return <div>Child</div>;
  }
  return <Child />;
}
```

## Common Anti-Patterns

### 1. Overusing Effects

**❌ Bad:**
```tsx
const count = signal(0);
const doubled = signal(0);

effect(() => {
  doubled.set(count() * 2); // Use memo instead!
});
```

**✅ Good:**
```tsx
const count = signal(0);
const doubled = memo(() => count() * 2);
```

### 2. Prop Drilling

**❌ Bad:**
```tsx
<App>
  <Layout theme={theme}>
    <Header theme={theme}>
      <Nav theme={theme}>
        <Button theme={theme} />
      </Nav>
    </Header>
  </Layout>
</App>
```

**✅ Good:**
```tsx
const ThemeContext = createContext('light');

<ThemeContext.Provider value={theme()}>
  <App />
</ThemeContext.Provider>

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click</button>;
}
```

### 3. Massive Components

**❌ Bad:**
```tsx
function Dashboard() {
  // 500 lines of code
  // Multiple concerns
  // Hard to test
  // Hard to maintain
}
```

**✅ Good:**
```tsx
function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardStats />
      <DashboardCharts />
      <DashboardActivity />
    </div>
  );
}
```

### 4. Premature Optimization

**❌ Bad:**
```tsx
// Optimizing before measuring
const memoizedEverything = memo(() => someValue);
const batchedEverything = batch(() => simpleUpdate());
```

**✅ Good:**
```tsx
// Measure first, optimize when needed
const value = someSimpleComputation();

// Optimize hot paths after profiling
const expensiveComputation = memo(() => {
  // Actually expensive operation
});
```

## Code Quality Standards

### Naming Conventions

```tsx
// Signals: noun describing the value
const count = signal(0);
const userName = signal('');
const isAuthenticated = signal(false);

// Memos: noun describing the computed value
const doubledCount = memo(() => count() * 2);
const fullName = memo(() => `${firstName()} ${lastName()}`);
const hasPermission = memo(() => user()?.role === 'admin');

// Effects: describe what they do (optional)
effect(() => {
  // Can use comments to describe complex effects
  localStorage.setItem('theme', theme());
});

// Functions: verb describing the action
function handleClick() { }
function fetchUserData() { }
function validateForm() { }

// Components: PascalCase, noun or noun phrase
function Button() { }
function UserProfile() { }
function DashboardLayout() { }
```

### File Organization

```
src/
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
├── stores/
│   ├── userStore.ts
│   ├── cartStore.ts
│   └── themeStore.ts
├── utils/
│   ├── formatting.ts
│   ├── validation.ts
│   └── api.ts
├── types/
│   ├── user.ts
│   ├── product.ts
│   └── api.ts
└── pages/
    ├── Home.tsx
    ├── Dashboard.tsx
    └── Settings.tsx
```

## Testing Standards

```tsx
import { describe, it, expect } from 'vitest';
import { signal, memo, effect } from '@philjs/core';

describe('Counter', () => {
  it('increments count', () => {
    const count = signal(0);
    count.set(count() + 1);
    expect(count()).toBe(1);
  });

  it('doubles count', () => {
    const count = signal(2);
    const doubled = memo(() => count() * 2);
    expect(doubled()).toBe(4);
  });

  it('tracks count changes', () => {
    const count = signal(0);
    let tracked = 0;

    effect(() => {
      tracked = count();
    });

    count.set(5);
    expect(tracked).toBe(5);
  });
});
```

## Documentation Standards

```tsx
/**
 * Custom hook for managing user authentication
 *
 * @returns Authentication state and methods
 *
 * @example
 * ```tsx
 * function App() {
 *   const { user, login, logout } = useAuth();
 *
 *   if (!user()) {
 *     return <LoginForm onLogin={login} />;
 *   }
 *
 *   return <Dashboard user={user()} onLogout={logout} />;
 * }
 * ```
 */
export function useAuth() {
  const user = signal<User | null>(null);
  const isAuthenticated = memo(() => user() !== null);

  const login = async (credentials: Credentials) => {
    const userData = await authService.login(credentials);
    user.set(userData);
  };

  const logout = () => {
    user.set(null);
  };

  return { user, isAuthenticated, login, logout };
}
```

## Next Steps

Explore specific best practice areas:

1. [Component Patterns](./component-patterns.md) - Component design and composition
2. [State Management](./state-management.md) - Managing application state
3. [Performance](./performance.md) - Optimization techniques
4. [Testing](./testing.md) - Testing strategies
5. [Code Organization](./code-organization.md) - Project structure
6. [Architecture](./architecture.md) - Application architecture
7. [Security](./security.md) - Security best practices
8. [Accessibility](./accessibility.md) - Building accessible apps
9. [Production](./production.md) - Production deployment

---

**Start here** to learn PhilJS best practices, then dive into specific areas.
