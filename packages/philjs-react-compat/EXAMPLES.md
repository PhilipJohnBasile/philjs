# PhilJS React Compat Examples

Real-world examples of migrating React patterns to PhilJS using the compatibility layer.

## Table of Contents

1. [Counter Component](#counter-component)
2. [Todo List](#todo-list)
3. [Form with Validation](#form-with-validation)
4. [Data Fetching](#data-fetching)
5. [Shopping Cart](#shopping-cart)
6. [Authentication](#authentication)
7. [Dark Mode Toggle](#dark-mode-toggle)
8. [Infinite Scroll](#infinite-scroll)

## Counter Component

### React Original

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  return (
    <div>
      <h1>Count: {count}</h1>
      <input
        type="number"
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
      />
      <button onClick={() => setCount(count + step)}>
        Add {step}
      </button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

### PhilJS with Compat Layer

```tsx
import { useState } from 'philjs-react-compat';

function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  return (
    <div>
      <h1>Count: {count}</h1>
      <input
        type="number"
        value={step}
        onInput={(e) => setStep(Number(e.target.value))}
      />
      <button onClick={() => setCount(count + step)}>
        Add {step}
      </button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

### PhilJS Native

```tsx
import { signal } from 'philjs-core';

function Counter() {
  const count = signal(0);
  const step = signal(1);

  return (
    <div>
      <h1>Count: {count()}</h1>
      <input
        type="number"
        value={step()}
        onInput={(e) => step.set(Number(e.target.value))}
      />
      <button onClick={() => count.set(count() + step())}>
        Add {step()}
      </button>
      <button onClick={() => count.set(0)}>Reset</button>
    </div>
  );
}
```

## Todo List

### React Original

```tsx
import { useState, useMemo } from 'react';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

type Filter = 'all' | 'active' | 'completed';

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [input, setInput] = useState('');

  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      if (filter === 'active') return !todo.done;
      if (filter === 'completed') return todo.done;
      return true;
    });
  }, [todos, filter]);

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, {
      id: Date.now(),
      text: input,
      done: false
    }]);
    setInput('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div>
      <h1>Todo List</h1>

      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="What needs to be done?"
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <ul>
        {filteredTodos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### PhilJS Native

```tsx
import { signal, memo } from 'philjs-core';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

type Filter = 'all' | 'active' | 'completed';

function TodoList() {
  const todos = signal<Todo[]>([]);
  const filter = signal<Filter>('all');
  const input = signal('');

  const filteredTodos = memo(() => {
    return todos().filter(todo => {
      if (filter() === 'active') return !todo.done;
      if (filter() === 'completed') return todo.done;
      return true;
    });
  });

  const addTodo = () => {
    if (!input().trim()) return;
    todos.set([...todos(), {
      id: Date.now(),
      text: input(),
      done: false
    }]);
    input.set('');
  };

  const toggleTodo = (id: number) => {
    todos.set(todos().map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    todos.set(todos().filter(todo => todo.id !== id));
  };

  return (
    <div>
      <h1>Todo List</h1>

      <div>
        <input
          value={input()}
          onInput={(e) => input.set(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="What needs to be done?"
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <div>
        <button onClick={() => filter.set('all')}>All</button>
        <button onClick={() => filter.set('active')}>Active</button>
        <button onClick={() => filter.set('completed')}>Completed</button>
      </div>

      <ul>
        {filteredTodos().map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Form with Validation

### React Original

```tsx
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      console.log('Login:', { email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>

      <button type="submit">Login</button>
    </form>
  );
}
```

### PhilJS Native

```tsx
import { signal } from 'philjs-core';

function LoginForm() {
  const email = signal('');
  const password = signal('');
  const errors = signal<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email())) {
      newErrors.email = 'Email is invalid';
    }

    if (!password()) {
      newErrors.password = 'Password is required';
    } else if (password().length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (validate()) {
      console.log('Login:', { email: email(), password: password() });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={email()}
          onInput={(e) => email.set(e.target.value)}
          placeholder="Email"
        />
        {errors().email && <span className="error">{errors().email}</span>}
      </div>

      <div>
        <input
          type="password"
          value={password()}
          onInput={(e) => password.set(e.target.value)}
          placeholder="Password"
        />
        {errors().password && <span className="error">{errors().password}</span>}
      </div>

      <button type="submit">Login</button>
    </form>
  );
}
```

## Data Fetching

### React Original

```tsx
import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
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
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### PhilJS Native

```tsx
import { signal, effect } from 'philjs-core';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: number }) {
  const user = signal<User | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  effect(() => {
    let cancelled = false;

    loading.set(true);
    error.set(null);

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
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
  if (!user()) return <div>No user found</div>;

  return (
    <div>
      <h1>{user().name}</h1>
      <p>{user().email}</p>
    </div>
  );
}
```

## Shopping Cart

### PhilJS Native with Global Store

```tsx
import { signal, memo } from 'philjs-core';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Global store
export const cart = {
  items: signal<CartItem[]>([]),

  total: memo(() => {
    return cart.items().reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }),

  itemCount: memo(() => {
    return cart.items().reduce((sum, item) => sum + item.quantity, 0);
  }),

  addItem(item: CartItem) {
    const existing = cart.items().find(i => i.id === item.id);

    if (existing) {
      cart.items.set(
        cart.items().map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      cart.items.set([...cart.items(), { ...item, quantity: 1 }]);
    }
  },

  removeItem(id: string) {
    cart.items.set(cart.items().filter(i => i.id !== id));
  },

  updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      cart.removeItem(id);
    } else {
      cart.items.set(
        cart.items().map(i =>
          i.id === id ? { ...i, quantity } : i
        )
      );
    }
  },

  clear() {
    cart.items.set([]);
  }
};

// Cart component
function ShoppingCart() {
  return (
    <div>
      <h2>Shopping Cart ({cart.itemCount()})</h2>

      {cart.items().length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <ul>
            {cart.items().map(item => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span>${item.price}</span>
                <input
                  type="number"
                  value={item.quantity}
                  onInput={(e) => cart.updateQuantity(item.id, Number(e.target.value))}
                  min="0"
                />
                <button onClick={() => cart.removeItem(item.id)}>Remove</button>
              </li>
            ))}
          </ul>

          <div>
            <strong>Total: ${cart.total().toFixed(2)}</strong>
          </div>

          <button onClick={() => cart.clear()}>Clear Cart</button>
          <button>Checkout</button>
        </>
      )}
    </div>
  );
}
```

## Authentication

### PhilJS Native with Context

```tsx
import { signal, createContext, useContext } from 'philjs-core';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: Signal<User | null>;
  isAuthenticated: Memo<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

function AuthProvider({ children }) {
  const user = signal<User | null>(null);
  const isLoading = signal(false);

  const isAuthenticated = memo(() => user() !== null);

  const login = async (email: string, password: string) => {
    isLoading.set(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      user.set(data.user);
    } finally {
      isLoading.set(false);
    }
  };

  const logout = () => {
    user.set(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage in components
function Profile() {
  const { user, logout } = useContext(AuthContext);

  if (!user()) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user().name}!</h1>
      <p>{user().email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Dark Mode Toggle

### PhilJS Native

```tsx
import { signal, effect } from 'philjs-core';

const theme = signal<'light' | 'dark'>(() => {
  // Load from localStorage
  const saved = localStorage.getItem('theme');
  return (saved === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
});

// Persist to localStorage
effect(() => {
  localStorage.setItem('theme', theme());
  document.documentElement.setAttribute('data-theme', theme());
});

function ThemeToggle() {
  const toggleTheme = () => {
    theme.set(theme() === 'light' ? 'dark' : 'light');
  };

  return (
    <button onClick={toggleTheme}>
      {theme() === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
```

## Infinite Scroll

### PhilJS Native

```tsx
import { signal, effect } from 'philjs-core';

interface Post {
  id: number;
  title: string;
  content: string;
}

function InfiniteScroll() {
  const posts = signal<Post[]>([]);
  const page = signal(1);
  const loading = signal(false);
  const hasMore = signal(true);

  const loadMore = async () => {
    if (loading() || !hasMore()) return;

    loading.set(true);

    try {
      const response = await fetch(`/api/posts?page=${page()}`);
      const data = await response.json();

      if (data.posts.length === 0) {
        hasMore.set(false);
      } else {
        posts.set([...posts(), ...data.posts]);
        page.set(page() + 1);
      }
    } finally {
      loading.set(false);
    }
  };

  effect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  // Load initial posts
  effect(() => {
    if (posts().length === 0) {
      loadMore();
    }
  });

  return (
    <div>
      <h1>Posts</h1>

      <div>
        {posts().map(post => (
          <article key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </article>
        ))}
      </div>

      {loading() && <div>Loading...</div>}
      {!hasMore() && <div>No more posts</div>}
    </div>
  );
}
```

## Key Takeaways

1. **Compat Layer**: Drop-in replacement for React hooks
2. **No Dependency Arrays**: PhilJS tracks automatically
3. **Signal Pattern**: Call signals to read: `count()` not `count`
4. **Immutable Updates**: Create new objects/arrays when updating
5. **Fine-grained**: Only changed values trigger updates
6. **Global State**: Simple to share state without Context
7. **No useCallback**: Functions are stable in PhilJS
8. **No React.memo**: Automatic optimization

Start with the compat layer, then gradually migrate to PhilJS patterns for best performance!
