# Migrating from React

Complete guide for migrating React applications to PhilJS.


## Overview

PhilJS and React share similar concepts but PhilJS uses fine-grained reactivity instead of virtual DOM. This guide will help you understand the differences and migrate your React applications.

## Key Differences

| Concept | React | PhilJS |
|---------|-------|--------|
| Reactivity | Virtual DOM | Fine-grained reactivity |
| State | `useState()` | `signal()` |
| Derived State | `useMemo()` | `memo()` |
| Side Effects | `useEffect()` | `effect()` |
| Context | `useContext()` | `useContext()` |
| Component Re-render | Entire component | Only affected parts |

## State Management

### useState → signal()

**React:**
```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**PhilJS:**
```tsx
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**Key differences:**
- Read with `count()` instead of `count`
- Update with `count.set()` instead of `setCount()`
- No need for dependency arrays

### Functional Updates

**React:**
```tsx
setCount(prev => prev + 1);
```

**PhilJS:**
```tsx
count.set(prev => prev + 1);
```

### Multiple State Variables

**React:**
```tsx
const [name, setName] = useState('');
const [age, setAge] = useState(0);
const [email, setEmail] = useState('');
```

**PhilJS:**
```tsx
const name = signal('');
const age = signal(0);
const email = signal('');
```

### Object State

**React:**
```tsx
const [user, setUser] = useState({ name: 'Alice', age: 30, email: 'alice@example.com' });

// Updating nested properties
const updateName = (newName) => {
  setUser({ ...user, name: newName });
};

const updateAge = (newAge) => {
  setUser(prev => ({ ...prev, age: newAge }));
};
```

**PhilJS:**
```tsx
const user = signal({ name: 'Alice', age: 30, email: 'alice@example.com' });

// Updating nested properties
const updateName = (newName) => {
  user.set({ ...user(), name: newName });
};

const updateAge = (newAge) => {
  user.set(prev => ({ ...prev, age: newAge }));
};
```

### Array State

**React:**
```tsx
const [items, setItems] = useState([1, 2, 3]);

// Add item
setItems([...items, 4]);

// Remove item
setItems(items.filter(item => item !== 2));

// Update item
setItems(items.map(item => item === 2 ? 20 : item));

// Clear all
setItems([]);
```

**PhilJS:**
```tsx
const items = signal([1, 2, 3]);

// Add item
items.set([...items(), 4]);

// Remove item
items.set(items().filter(item => item !== 2));

// Update item
items.set(items().map(item => item === 2 ? 20 : item));

// Clear all
items.set([]);
```

### Lazy Initial State

**React:**
```tsx
// Expensive computation only runs once
const [data, setData] = useState(() => {
  return expensiveComputation();
});
```

**PhilJS:**
```tsx
// Expensive computation only runs once
const data = signal(expensiveComputation());
// Note: This runs immediately, not lazily
// For truly lazy initialization, use memo:
const data = memo(() => expensiveComputation());
```

## Derived State

### useMemo → memo()

**React:**
```tsx
const doubled = useMemo(() => count * 2, [count]);
const quadrupled = useMemo(() => doubled * 2, [doubled]);
```

**PhilJS:**
```tsx
const doubled = memo(() => count() * 2);
const quadrupled = memo(() => doubled() * 2);
// No dependency arrays needed!
```

### Complex Computations

**React:**
```tsx
function ExpensiveComponent({ items, filter, sortBy }) {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      return a[sortBy] > b[sortBy] ? 1 : -1;
    });
  }, [filteredItems, sortBy]);

  const total = useMemo(() => {
    return sortedItems.reduce((sum, item) => sum + item.price, 0);
  }, [sortedItems]);

  return (
    <div>
      <p>Total: ${total}</p>
      <ul>
        {sortedItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

**PhilJS:**
```tsx
function ExpensiveComponent({
  items,
  filter,
  sortBy
}: {
  items: Signal<Item[]>;
  filter: Signal<string>;
  sortBy: Signal<string>
}) {
  const filteredItems = memo(() => {
    return items().filter(item => item.category === filter());
  });

  const sortedItems = memo(() => {
    return [...filteredItems()].sort((a, b) => {
      return a[sortBy()] > b[sortBy()] ? 1 : -1;
    });
  });

  const total = memo(() => {
    return sortedItems().reduce((sum, item) => sum + item.price, 0);
  });

  return (
    <div>
      <p>Total: ${total()}</p>
      <ul>
        {sortedItems().map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Key advantages:**
- No dependency arrays to maintain
- Automatic dependency tracking
- Memos only recompute when dependencies change
- Chained memos are efficient

### Conditional Computations

**React:**
```tsx
const expensiveValue = useMemo(() => {
  if (!enabled) return null;
  return expensiveCalculation(data);
}, [enabled, data]);
```

**PhilJS:**
```tsx
const expensiveValue = memo(() => {
  if (!enabled()) return null;
  return expensiveCalculation(data());
});
// Only tracks dependencies that are actually read
```

## Side Effects

### useEffect → effect()

**React:**
```tsx
useEffect(() => {
  console.log('Count changed:', count);
}, [count]);

useEffect(() => {
  const id = setInterval(() => {
    console.log('Tick');
  }, 1000);

  return () => clearInterval(id);
}, []);
```

**PhilJS:**
```tsx
effect(() => {
  console.log('Count changed:', count());
});

effect(() => {
  const id = setInterval(() => {
    console.log('Tick');
  }, 1000);

  return () => clearInterval(id);
});
// No dependency arrays!
```

**Key differences:**
- No dependency arrays
- Automatic dependency tracking
- Same cleanup pattern

### Effect Dependencies

**React:**
```tsx
useEffect(() => {
  fetchUser(userId);
}, [userId]); // Must list all dependencies
```

**PhilJS:**
```tsx
effect(() => {
  fetchUser(userId());
}); // Auto-tracks dependencies
```

### Data Fetching with Effects

**React:**
```tsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchUser(userId)
      .then(data => {
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{user.name}</div>;
}
```

**PhilJS:**
```tsx
function UserProfile({ userId }: { userId: Signal<number> }) {
  const user = signal(null);
  const loading = signal(true);
  const error = signal(null);

  effect(() => {
    let cancelled = false;
    loading.set(true);
    error.set(null);

    fetchUser(userId())
      .then(data => {
        if (!cancelled) {
          user.set(data);
          loading.set(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          error.set(err);
          loading.set(false);
        }
      });

    return () => {
      cancelled = true;
    };
  });

  if (loading()) return <div>Loading...</div>;
  if (error()) return <div>Error: {error().message}</div>;
  return <div>{user().name}</div>;
}
```

### Multiple Effects

**React:**
```tsx
function Component({ userId, theme }) {
  // Effect 1: Fetch user data
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  // Effect 2: Update document title
  useEffect(() => {
    document.title = `User ${userId}`;
  }, [userId]);

  // Effect 3: Apply theme
  useEffect(() => {
    document.body.className = theme;
    return () => {
      document.body.className = '';
    };
  }, [theme]);
}
```

**PhilJS:**
```tsx
function Component({
  userId,
  theme
}: {
  userId: Signal<number>;
  theme: Signal<string>
}) {
  // Effect 1: Fetch user data
  effect(() => {
    fetchUser(userId()).then(u => user.set(u));
  });

  // Effect 2: Update document title
  effect(() => {
    document.title = `User ${userId()}`;
  });

  // Effect 3: Apply theme
  effect(() => {
    document.body.className = theme();
    return () => {
      document.body.className = '';
    };
  });
}
```

**Key advantages:**
- Each effect automatically tracks only what it reads
- No need to manually synchronize dependency arrays
- Cleaner separation of concerns

### Conditional Effects

**React:**
```tsx
useEffect(() => {
  if (isEnabled) {
    subscribe(channel);
  }
}, [isEnabled, channel]); // Both dependencies needed even when isEnabled is false
```

**PhilJS:**
```tsx
effect(() => {
  if (isEnabled()) {
    subscribe(channel()); // Only tracks channel() when isEnabled() is true
  }
});
// Dependency tracking is dynamic based on execution path
```

### Effect with External Dependencies

**React:**
```tsx
function Component({ onUpdate }) {
  const [count, setCount] = useState(0);

  // Need to include onUpdate in deps, or use useCallback in parent
  useEffect(() => {
    onUpdate(count);
  }, [count, onUpdate]);
}
```

**PhilJS:**
```tsx
function Component({ onUpdate }: { onUpdate: (n: number) => void }) {
  const count = signal(0);

  // No dependency issues - only tracks signals
  effect(() => {
    onUpdate(count());
  });
}
```

## Context

### React Context → PhilJS Context

#### Simple Static Context

**React:**
```tsx
import { createContext, useContext } from 'react';

const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <ThemedButton />
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Button</button>;
}
```

**PhilJS:**
```tsx
import { createContext, useContext } from '@philjs/core';

const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <ThemedButton />
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Button</button>;
}
```

**Almost identical!** The main difference is signals for reactive values.

#### Reactive Context with State

**React:**
```tsx
const [theme, setTheme] = useState('light');

<ThemeContext.Provider value={{ theme, setTheme }}>
```

**PhilJS:**
```tsx
const theme = signal('light');

<ThemeContext.Provider value={{ theme, setTheme: theme.set }}>
```

#### Complex Context Example

**React:**
```tsx
import { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await authApi.login(email, password);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage
function Profile() {
  const { user, logout, isLoading } = useContext(AuthContext);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**PhilJS:**
```tsx
import { createContext, useContext, signal } from '@philjs/core';

interface AuthContextType {
  user: Signal<User | null>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: Signal<boolean>;
}

const AuthContext = createContext<AuthContextType>(null!);

function AuthProvider({ children }: { children: any }) {
  const user = signal<User | null>(null);
  const isLoading = signal(false);

  const login = async (email: string, password: string) => {
    isLoading.set(true);
    try {
      const userData = await authApi.login(email, password);
      user.set(userData);
    } finally {
      isLoading.set(false);
    }
  };

  const logout = () => {
    user.set(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage
function Profile() {
  const { user, logout, isLoading } = useContext(AuthContext);

  if (isLoading()) return <div>Loading...</div>;
  if (!user()) return <div>Not logged in</div>;

  return (
    <div>
      <h1>{user().name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Key differences:**
- Context values are signals, not state variables
- Read with `user()` instead of `user`
- Functions can be passed as-is
- No need for `useMemo` on context value (signals are already stable)

#### Context with Computed Values

**React:**
```tsx
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Need useMemo to prevent re-renders
  const value = useMemo(() => ({
    user,
    isAdmin: user?.role === 'admin',
    hasPermission: (perm) => permissions.includes(perm),
    setUser,
    setPermissions
  }), [user, permissions]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

**PhilJS:**
```tsx
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const user = signal(null);
  const permissions = signal([]);

  // memo for computed values
  const isAdmin = memo(() => user()?.role === 'admin');

  const hasPermission = (perm) => permissions().includes(perm);

  // No useMemo needed - signals are stable references
  const value = {
    user,
    isAdmin,
    hasPermission,
    setUser: user.set,
    setPermissions: permissions.set
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage
function AdminPanel() {
  const { isAdmin } = useContext(AuthContext);

  if (!isAdmin()) return null; // Call memo to get value

  return <div>Admin Panel</div>;
}
```

## Component Patterns

### Class Components → Functional Components

React class components should be converted to PhilJS functional components.

**React Class:**
```tsx
class Counter extends React.Component {
  state = { count: 0 };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  componentDidMount() {
    console.log('Mounted');
  }

  componentWillUnmount() {
    console.log('Unmounted');
  }

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>Increment</button>
      </div>
    );
  }
}
```

**PhilJS:**
```tsx
function Counter() {
  const count = signal(0);

  effect(() => {
    console.log('Mounted');

    return () => {
      console.log('Unmounted');
    };
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Higher-Order Components → Composition

**React HOC:**
```tsx
function withLoading(Component) {
  return function WithLoadingComponent(props) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchData().then(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;

    return <Component {...props} />;
  };
}

const EnhancedComponent = withLoading(MyComponent);
```

**PhilJS:**
```tsx
function withLoading<P>(Component: (props: P) => JSX.Element) {
  return (props: P) => {
    const loading = signal(true);

    effect(async () => {
      await fetchData();
      loading.set(false);
    });

    if (loading()) return <div>Loading...</div>;

    return <Component {...props} />;
  };
}

const EnhancedComponent = withLoading(MyComponent);
```

## Routing

### React Router → PhilJS Router

**React Router:**
```tsx
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:id" element={<User />} />
      </Routes>
    </BrowserRouter>
  );
}

function User() {
  const { id } = useParams();
  return <div>User ID: {id}</div>;
}
```

**PhilJS Router:**
```tsx
import { Router, Route, Link, useParams } from '@philjs/router';

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/users/:id" component={User} />
    </Router>
  );
}

function User() {
  const { id } = useParams();
  return <div>User ID: {id}</div>;
}
```

**Key differences:**
- `<Routes>` → `<Router>`
- `element={<Component />}` → `component={Component}`
- Same Link and useParams API

## Data Fetching

### React Query/SWR → PhilJS Patterns

**React with React Query:**
```tsx
import { useQuery } from '@tanstack/react-query';

function Users() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

**PhilJS:**
```tsx
function Users() {
  const data = signal(null);
  const loading = signal(true);
  const error = signal(null);

  effect(async () => {
    try {
      const users = await fetchUsers();
      data.set(users);
    } catch (err) {
      error.set(err);
    } finally {
      loading.set(false);
    }
  });

  if (loading()) return <div>Loading...</div>;
  if (error()) return <div>Error: {error().message}</div>;

  return (
    <ul>
      {data().map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Forms

### React Hook Form → PhilJS Forms

**React Hook Form:**
```tsx
import { useForm } from 'react-hook-form';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: true })} />
      {errors.email && <span>Email is required</span>}

      <input type="password" {...register('password', { required: true })} />
      {errors.password && <span>Password is required</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

**PhilJS:**
```tsx
function LoginForm() {
  const email = signal('');
  const password = signal('');
  const errors = signal({});

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!email()) newErrors.email = 'Email is required';
    if (!password()) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      errors.set(newErrors);
      return;
    }

    console.log({ email: email(), password: password() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email()}
        onInput={(e) => email.set(e.target.value)}
      />
      {errors().email && <span>{errors().email}</span>}

      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.target.value)}
      />
      {errors().password && <span>{errors().password}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

## Performance

### React.memo → Automatic

React requires explicit memoization:

**React:**
```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});
```

**PhilJS:**
```tsx
function ExpensiveComponent({ data }: { data: any }) {
  return <div>{/* expensive rendering */}</div>;
}
// Automatically optimized with fine-grained reactivity!
```

### useCallback → Not Needed

**React:**
```tsx
const handleClick = useCallback(() => {
  doSomething(count);
}, [count]);
```

**PhilJS:**
```tsx
const handleClick = () => {
  doSomething(count());
};
// No memoization needed!
```

### useCallback with Expensive Operations

**React:**
```tsx
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');

  // Need useCallback to prevent child re-renders
  const addTodo = useCallback((text) => {
    setTodos(prev => [...prev, { id: Date.now(), text, done: false }]);
  }, []);

  const toggleTodo = useCallback((id) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  }, []);

  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      if (filter === 'active') return !todo.done;
      if (filter === 'completed') return todo.done;
      return true;
    });
  }, [todos, filter]);

  return (
    <div>
      <TodoInput onAdd={addTodo} />
      <FilterButtons filter={filter} setFilter={setFilter} />
      <TodoItems todos={filteredTodos} onToggle={toggleTodo} />
    </div>
  );
}
```

**PhilJS:**
```tsx
function TodoList() {
  const todos = signal([]);
  const filter = signal('all');

  // No useCallback needed - functions are stable
  const addTodo = (text) => {
    todos.set([...todos(), { id: Date.now(), text, done: false }]);
  };

  const toggleTodo = (id) => {
    todos.set(todos().map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  // memo automatically tracks dependencies
  const filteredTodos = memo(() => {
    return todos().filter(todo => {
      if (filter() === 'active') return !todo.done;
      if (filter() === 'completed') return todo.done;
      return true;
    });
  });

  return (
    <div>
      <TodoInput onAdd={addTodo} />
      <FilterButtons filter={filter} setFilter={filter.set} />
      <TodoItems todos={filteredTodos()} onToggle={toggleTodo} />
    </div>
  );
}
```

**Key differences:**
- No `useCallback` needed - functions don't cause re-renders
- `memo()` automatically tracks dependencies
- Pass `signal.set` directly as a callback
- Only the actual changed DOM nodes update

## Migration Strategy

### 1. Incremental Migration

You can migrate React apps incrementally:

1. **Start with new features in PhilJS**
2. **Migrate components one at a time**
3. **Use adapters if needed**

### 2. Side-by-Side Comparison

Create a mapping document:

```typescript
// migration-map.ts
export const componentMap = {
  // React → PhilJS
  'useState': 'signal',
  'useMemo': 'memo',
  'useEffect': 'effect',
  'useContext': 'useContext',
  'useCallback': 'not needed',
  'React.memo': 'automatic',
};
```

### 3. Automated Conversion

Use search and replace for common patterns:

```bash
# useState → signal
s/const \[(\w+), set(\w+)\] = useState/const $1 = signal/g

# count → count()
s/\{count\}/\{count()\}/g

# setCount → count.set
s/setCount/count.set/g
```

## Component Lifecycle Differences

### Mounting and Unmounting

**React:**
```tsx
function Component() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Runs after mount
    console.log('Component mounted');
    fetchData().then(setData);

    return () => {
      // Runs before unmount
      console.log('Component unmounting');
    };
  }, []); // Empty array = run once

  return <div>{data}</div>;
}
```

**PhilJS:**
```tsx
function Component() {
  const data = signal(null);

  effect(() => {
    // Runs immediately (synchronously)
    console.log('Component mounted');
    fetchData().then(d => data.set(d));

    return () => {
      // Runs on cleanup
      console.log('Component unmounting');
    };
  });

  return <div>{data()}</div>;
}
```

**Key differences:**
- PhilJS effects run synchronously, React's run after paint
- No need for empty dependency arrays
- Cleanup functions work the same way

### Update Lifecycle

**React:**
```tsx
function Component({ userId }) {
  const [user, setUser] = useState(null);

  // Runs on mount AND when userId changes
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  // Runs after every render
  useEffect(() => {
    console.log('Component updated');
  });

  return <div>{user?.name}</div>;
}
```

**PhilJS:**
```tsx
function Component({ userId }: { userId: Signal<number> }) {
  const user = signal(null);

  // Automatically re-runs when userId() changes
  effect(() => {
    fetchUser(userId()).then(u => user.set(u));
  });

  // Runs whenever any tracked signal changes
  effect(() => {
    console.log('Tracked signals updated');
  });

  return <div>{user()?.name}</div>;
}
```

**Key differences:**
- PhilJS tracks dependencies automatically
- Effects only re-run when tracked signals change
- No "runs after every render" concept - only when dependencies change

### Comparison with Legacy Lifecycle Methods

**React Class Component:**
```tsx
class UserProfile extends React.Component {
  state = { user: null, loading: true };

  componentDidMount() {
    this.fetchUser();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      this.fetchUser();
    }
  }

  componentWillUnmount() {
    this.cancelRequest();
  }

  fetchUser() {
    this.setState({ loading: true });
    fetchUser(this.props.userId)
      .then(user => this.setState({ user, loading: false }));
  }

  cancelRequest() {
    // Cancel any pending requests
  }

  render() {
    const { user, loading } = this.state;
    if (loading) return <div>Loading...</div>;
    return <div>{user.name}</div>;
  }
}
```

**PhilJS Functional Component:**
```tsx
function UserProfile({ userId }: { userId: Signal<number> }) {
  const user = signal(null);
  const loading = signal(true);

  effect(() => {
    loading.set(true);
    const request = fetchUser(userId());

    request.then(u => {
      user.set(u);
      loading.set(false);
    });

    // Cleanup runs on next effect or unmount
    return () => request.cancel();
  });

  if (loading()) return <div>Loading...</div>;
  return <div>{user().name}</div>;
}
```

**Key differences:**
- One `effect()` replaces `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount`
- Automatic dependency tracking eliminates manual prop comparisons
- Cleanup is declarative via return function

## Migration Checklist

Use this checklist when migrating a React component to PhilJS:

### Phase 1: Setup

- [ ] Install PhilJS packages (`@philjs/core`, `@philjs/router`, etc.)
- [ ] Update build configuration (Vite, Webpack, etc.)
- [ ] Set up TypeScript if using (tsconfig.json)
- [ ] Create a new branch for migration work

### Phase 2: Component Conversion

- [ ] **State Hooks**
  - [ ] Replace `useState` with `signal`
  - [ ] Update state reads from `value` to `value()`
  - [ ] Update state writes from `setValue(x)` to `value.set(x)`
  - [ ] Replace `setState(prev => ...)` with `value.set(prev => ...)`

- [ ] **Derived State**
  - [ ] Replace `useMemo` with `memo`
  - [ ] Remove dependency arrays
  - [ ] Update reads to use function calls `memo()`

- [ ] **Side Effects**
  - [ ] Replace `useEffect` with `effect`
  - [ ] Remove dependency arrays
  - [ ] Verify cleanup functions still work
  - [ ] Check async effect patterns

- [ ] **Callbacks**
  - [ ] Remove `useCallback` wrappers
  - [ ] Update inline event handlers
  - [ ] Pass `signal.set` directly where appropriate

- [ ] **Performance Optimizations**
  - [ ] Remove `React.memo()` wrappers (automatic in PhilJS)
  - [ ] Remove `useCallback` for prop drilling
  - [ ] Identify opportunities for batched updates

- [ ] **Context**
  - [ ] Update imports from `react` to `@philjs/core`
  - [ ] Keep Provider/Consumer pattern
  - [ ] Update context values to use signals

### Phase 3: Patterns and APIs

- [ ] **Routing**
  - [ ] Replace `react-router-dom` with `@philjs/router`
  - [ ] Update `<Routes>` to `<Router>`
  - [ ] Change `element={<Component />}` to `component={Component}`
  - [ ] Verify `Link`, `useParams`, `useNavigate` work

- [ ] **Forms**
  - [ ] Replace controlled inputs with signal bindings
  - [ ] Update form validation logic
  - [ ] Handle submit events with signals

- [ ] **Class Components**
  - [ ] Convert to functional components
  - [ ] Map lifecycle methods to effects
  - [ ] Convert instance methods to functions

- [ ] **Higher-Order Components**
  - [ ] Convert to composition functions
  - [ ] Update type signatures for TypeScript

### Phase 4: Testing and Validation

- [ ] **Functionality**
  - [ ] Test all user interactions
  - [ ] Verify data fetching works
  - [ ] Check form submissions
  - [ ] Validate routing and navigation

- [ ] **Reactivity**
  - [ ] Verify UI updates on state changes
  - [ ] Test effect cleanup on unmount
  - [ ] Check memo computations only run when needed
  - [ ] Validate batched updates work correctly

- [ ] **Performance**
  - [ ] Profile render performance
  - [ ] Check for unnecessary re-computations
  - [ ] Validate memory cleanup
  - [ ] Test with production build

### Phase 5: Polish

- [ ] Remove unused React imports
- [ ] Update component prop types
- [ ] Clean up console warnings
- [ ] Update tests for PhilJS APIs
- [ ] Update documentation/comments
- [ ] Run linter and fix issues

### Phase 6: Deployment

- [ ] Test production build
- [ ] Verify bundle size
- [ ] Run E2E tests
- [ ] Deploy to staging
- [ ] Monitor for errors
- [ ] Deploy to production

## Common Gotchas and Pitfalls

### 1. Don't Forget Function Calls

The most common mistake when migrating from React.

```tsx
// ❌ React habit - signals look like values
<p>Count: {count}</p>
<button onClick={() => count.set(count + 1)}>Increment</button>

// ✅ PhilJS - call the signal to read it
<p>Count: {count()}</p>
<button onClick={() => count.set(count() + 1)}>Increment</button>
```

**Pro tip:** Enable ESLint rules to catch this mistake.

### 2. No Dependency Arrays

React developers instinctively add dependency arrays.

```tsx
// ❌ React habit - unnecessary dependency array
effect(() => {
  console.log(count());
}, [count]);

// ✅ PhilJS - automatic dependency tracking
effect(() => {
  console.log(count());
});
```

**Key insight:** PhilJS tracks what signals you read inside effects automatically.

### 3. Don't Destructure Signals

Destructuring breaks reactivity.

```tsx
const user = signal({ name: 'Alice', age: 30 });

// ❌ Loses reactivity
const { name, age } = user();
return <p>{name} is {age}</p>; // Won't update!

// ✅ Read on access
return <p>{user().name} is {user().age}</p>;

// ✅ Or use memo for computed values
const name = memo(() => user().name);
return <p>{name()}</p>;
```

**Rule of thumb:** Always call signals where you need reactivity.

### 4. Batching Updates

Multiple signal updates can trigger multiple effects.

```tsx
// ❌ Three separate updates = three effect runs
count.set(1);
name.set('Alice');
active.set(true);

// ✅ Batch for performance
batch(() => {
  count.set(1);
  name.set('Alice');
  active.set(true);
});
// Effects run once after batch completes
```

**When to batch:** Updating multiple related signals in succession.

### 5. Async Effects and Stale Closures

Be careful with async operations in effects.

```tsx
// ❌ Stale closure - userId might change
effect(() => {
  fetchUser(userId()).then(data => {
    user.set(data); // Might be wrong user!
  });
});

// ✅ Check if still valid
effect(() => {
  const currentId = userId();
  fetchUser(currentId).then(data => {
    if (userId() === currentId) {
      user.set(data);
    }
  });
});

// ✅✅ Better: use cleanup
effect(() => {
  let cancelled = false;
  fetchUser(userId()).then(data => {
    if (!cancelled) user.set(data);
  });

  return () => { cancelled = true; };
});
```

**Best practice:** Always handle cleanup for async effects.

### 6. Signal in JSX Attributes

Signals need to be called even in JSX attributes.

```tsx
const className = signal('active');
const disabled = signal(false);

// ❌ Passes the signal object, not the value
<button class={className} disabled={disabled}>Click</button>

// ✅ Call the signal
<button class={className()} disabled={disabled()}>Click</button>
```

### 7. Conditional Effects

Effects always run, even if you guard them with conditionals.

```tsx
const show = signal(false);

// ❌ Effect still runs and tracks 'show'
effect(() => {
  if (!show()) return;
  console.log('Showing');
});

// ✅ Use separate effect or memo
const shouldShow = memo(() => show());

effect(() => {
  if (shouldShow()) {
    console.log('Showing');
  }
});
```

**When it matters:** If you want to prevent effect registration entirely.

### 8. Don't Mutate Signal Values

Always create new objects/arrays when updating.

```tsx
const items = signal([1, 2, 3]);

// ❌ Mutates the array - won't trigger updates
items().push(4);

// ✅ Create new array
items.set([...items(), 4]);

// ❌ Mutates object
const user = signal({ name: 'Alice', age: 30 });
user().age = 31; // Won't trigger updates!

// ✅ Create new object
user.set({ ...user(), age: 31 });
```

**Why:** PhilJS uses identity comparison to detect changes.

### 9. Effect Execution Timing

PhilJS effects run synchronously, React's run after paint.

```tsx
// React useEffect
function ReactComponent() {
  useEffect(() => {
    // Runs AFTER browser paint
    console.log('DOM updated');
  });
  return <div>Hello</div>;
}

// PhilJS effect
function PhilJSComponent() {
  effect(() => {
    // Runs IMMEDIATELY (before paint)
    console.log('Effect running');
  });
  return <div>Hello</div>;
}
```

**Impact:** If you need to wait for DOM updates, use `queueMicrotask` or `requestAnimationFrame`.

### 10. Passing Signals as Props

Decide whether to pass signal objects or values.

```tsx
const count = signal(0);

// Option 1: Pass the signal object (child can read AND write)
<Child count={count} />

function Child({ count }: { count: Signal<number> }) {
  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => count.set(count() + 1)}>Inc</button>
    </div>
  );
}

// Option 2: Pass the value (read-only)
<Child count={count()} />

function Child({ count }: { count: number }) {
  return <p>{count}</p>; // Not reactive!
}

// Option 3: Pass both value and setter
<Child count={count()} setCount={count.set} />
```

**Recommendation:** Pass signal objects for reactive props, values for static props.

### 11. Infinite Effect Loops

Reading and writing the same signal in an effect.

```tsx
// ❌ Infinite loop!
const count = signal(0);

effect(() => {
  count.set(count() + 1); // Reads count, writes count, triggers effect again!
});

// ✅ Use a different signal or guard the update
const input = signal(0);
const doubled = memo(() => input() * 2);

effect(() => {
  console.log('Doubled:', doubled());
});
```

**Rule:** Effects should rarely write to signals they read.

### 12. Using Raw Values in Event Handlers

Don't read signals outside of reactive contexts unnecessarily.

```tsx
const count = signal(0);
const message = signal('');

// ❌ Reads count() at definition time
const handleClick = () => {
  const value = count(); // Fixed value
  setTimeout(() => {
    message.set(`Count was ${value}`);
  }, 1000);
};

// ✅ Read inside the handler or callback
const handleClick = () => {
  setTimeout(() => {
    message.set(`Count is ${count()}`); // Current value
  }, 1000);
};
```

**Key insight:** Signals are only reactive when read inside `effect()` or `memo()`.

## Quick Reference Guide

### API Translation Table

| React Hook/API | PhilJS Equivalent | Key Difference |
|---------------|------------------|----------------|
| `useState(value)` | `signal(value)` | Read with `signal()`, write with `signal.set()` |
| `useMemo(fn, deps)` | `memo(fn)` | No dependency array needed |
| `useEffect(fn, deps)` | `effect(fn)` | No dependency array needed |
| `useCallback(fn, deps)` | `fn` | No memoization needed |
| `React.memo(Component)` | `Component` | Automatic optimization |
| `useContext(Context)` | `useContext(Context)` | Same API, use signals for reactive values |
| `useRef(value)` | `signal(value)` | Similar behavior, but reactive |
| `useReducer` | Custom signal + functions | Use signals with update functions |

### Common Pattern Conversions

```tsx
// React → PhilJS

// 1. State declaration
const [x, setX] = useState(0);     →  const x = signal(0);

// 2. Reading state
{x}                                 →  {x()}
onClick={() => console.log(x)}     →  onClick={() => console.log(x())}

// 3. Writing state
setX(5)                            →  x.set(5)
setX(prev => prev + 1)             →  x.set(prev => prev + 1)

// 4. Derived state
const y = useMemo(() => x * 2, [x]) →  const y = memo(() => x() * 2)
{y}                                 →  {y()}

// 5. Effects
useEffect(() => {                   →  effect(() => {
  console.log(x);                       console.log(x());
}, [x]);                            });

// 6. Cleanup
useEffect(() => {                   →  effect(() => {
  const id = setInterval(...);          const id = setInterval(...);
  return () => clearInterval(id);       return () => clearInterval(id);
}, []);                             });

// 7. Context
const [theme, setTheme] =           →  const theme = signal('light');
  useState('light');
<Context.Provider                   →  <Context.Provider
  value={{ theme, setTheme }}>          value={{ theme, setTheme: theme.set }}>

// 8. Object updates
setUser({ ...user, age: 31 })      →  user.set({ ...user(), age: 31 })

// 9. Array updates
setItems([...items, newItem])      →  items.set([...items(), newItem])

// 10. Batching
// React batches automatically in       batch(() => {
// event handlers, use                    x.set(1);
// unstable_batchedUpdates elsewhere      y.set(2);
                                        });
```

### Migration Tips

1. **Search and Replace Strategy:**
   - Search for `useState` → replace with `signal`
   - Search for `useMemo` → replace with `memo`
   - Search for `useEffect` → replace with `effect`
   - Remove all dependency arrays `}, [deps]);` → `});`

2. **Type Signatures (TypeScript):**
   ```tsx
   // React props
   interface Props {
     count: number;
     setCount: (n: number) => void;
   }

   // PhilJS props - pass signal object
   interface Props {
     count: Signal<number>;
   }

   // Or pass value and setter separately
   interface Props {
     count: number;
     setCount: (n: number) => void;
   }
   ```

3. **Testing Strategy:**
   - Start with leaf components (no children)
   - Move up the component tree
   - Test reactivity after each migration
   - Verify cleanup functions still work

4. **Common Mistakes:**
   - Forgetting to call signals: `{count}` should be `{count()}`
   - Adding dependency arrays: `effect(() => {...}, [deps])` should be `effect(() => {...})`
   - Mutating signal values: `user().age = 31` should be `user.set({ ...user(), age: 31 })`
   - Destructuring reactive values: `const { name } = user()` loses reactivity

## Summary

PhilJS migration from React:

✅ Similar API surface
✅ No virtual DOM
✅ No dependency arrays
✅ Automatic optimization
✅ Fine-grained reactivity
✅ Better performance

Most React code translates directly to PhilJS with minor syntax changes!

**Key Takeaways:**
- Replace `useState` with `signal`, call with `()` to read
- Replace `useMemo` with `memo`, no dependency arrays
- Replace `useEffect` with `effect`, no dependency arrays
- Remove `useCallback` - not needed
- Remove `React.memo` - automatic
- Always create new objects/arrays when updating
- Use `batch()` for multiple related updates

---

**Next:** [Migrating from Vue →](./from-vue.md)
