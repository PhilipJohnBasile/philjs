# Frequently Asked Questions

Common questions about PhilJS and their answers.

## General Questions

### What is PhilJS?

PhilJS is a modern JavaScript framework featuring:
- **Fine-grained reactivity** - Updates only what changed, no virtual DOM
- **Signals-based state** - Simple, predictable reactive primitives
- **TypeScript-first** - Built with TypeScript for excellent type inference
- **Minimal API surface** - Easy to learn, powerful to use
- **Server-side rendering** - Built-in SSR support

### How is PhilJS different from React?

| Feature | React | PhilJS |
|---------|-------|--------|
| Reactivity | Virtual DOM | Fine-grained signals |
| State | useState | signal() |
| Computed | useMemo | memo() |
| Effects | useEffect | effect() |
| Dependencies | Manual arrays | Automatic tracking |
| Re-renders | Entire component | Only changed parts |
| Performance | Good | Excellent |

### How is PhilJS different from Vue?

| Feature | Vue 3 | PhilJS |
|---------|-------|--------|
| Templates | SFC templates | JSX |
| State | ref()/reactive() | signal() |
| Computed | computed() | memo() |
| Effects | watchEffect() | effect() |
| Syntax | .value | () call |
| Updates | Proxy-based | Signal-based |

### How is PhilJS different from Solid?

PhilJS is heavily inspired by Solid and shares similar concepts. The main differences are:
- API naming (signal() vs createSignal())
- Some additional features
- Different ecosystem

### Is PhilJS production-ready?

PhilJS is designed for production use with:
- ✅ Stable API
- ✅ SSR support
- ✅ TypeScript support
- ✅ Testing utilities
- ✅ Performance optimizations
- ✅ Comprehensive documentation

However, check the current version and stability before using in critical applications.

### What's the learning curve?

**If you know React:** 1-2 days to get comfortable
- Similar concepts (components, effects, memos)
- Main difference: signals instead of useState
- No dependency arrays needed

**If you know Vue:** 1-2 days to get comfortable
- Similar Composition API patterns
- JSX instead of templates
- () instead of .value

**If you're new to frameworks:** 1 week to get productive
- Learn TypeScript first
- Understand reactive programming
- Follow tutorials and examples

## Technical Questions

### Do I need to call signals everywhere?

**Yes**, when reading values:

```tsx
// ✅ Correct
<p>Count: {count()}</p>

// ❌ Wrong - shows [Function]
<p>Count: {count}</p>
```

**Exception:** When passing to another function that will call it.

### Why use .set() instead of direct assignment?

Direct assignment doesn't trigger reactivity:

```tsx
// ❌ Doesn't work
count = count + 1;  // Just reassigns variable

// ✅ Works
count.set(count() + 1);  // Triggers updates
```

### Can I use classes with signals?

Yes, but use immutable updates:

```tsx
class User {
  constructor(public name: string, public age: number) {}
}

const user = signal(new User('Alice', 30));

// ❌ Mutation doesn't trigger update
user().age = 31;

// ✅ Create new instance
user.set(new User('Alice', 31));

// Or use object
const userObj = signal({ name: 'Alice', age: 30 });
userObj.set({ ...userObj(), age: 31 });
```

### How do I handle forms?

Use controlled components:

```tsx
function Form() {
  const email = signal('');
  const password = signal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log({ email: email(), password: password() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.currentTarget.value)}
      />

      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.currentTarget.value)}
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Can I use PhilJS with existing React code?

Not directly. PhilJS is a separate framework. You would need to:
1. Migrate components one by one
2. Use a micro-frontend architecture
3. Rewrite the application

See [Migration Guides](../migration/from-react.md) for help.

### Does PhilJS support TypeScript?

Yes! PhilJS is built with TypeScript and provides excellent type inference:

```tsx
interface User {
  id: string;
  name: string;
}

// Full type inference
const user = signal<User | null>(null);

user.set({ id: '1', name: 'Alice' });  // ✅ Type-safe
user.set({ id: 1, name: 'Alice' });    // ❌ Type error
```

### How do I debug PhilJS apps?

See [Debugging Guide](./debugging.md) for comprehensive debugging techniques.

Quick tips:
- Use console.log in effects
- Set breakpoints with `debugger`
- Use browser DevTools
- Check signal values
- Monitor network requests

### What about SEO?

PhilJS supports SSR for SEO:

```tsx
// Server
import { renderToString } from '@philjs/ssr';

const html = await renderToString(<App />);

// Client
import { hydrate } from '@philjs/core';

hydrate(<App />, document.getElementById('app')!);
```

### Can I use PhilJS for mobile apps?

PhilJS is primarily for web applications. For mobile:
- Use PhilJS for mobile web apps (PWA)
- Consider React Native or similar for native apps
- PhilJS can power the web version

### What about testing?

PhilJS has excellent testing support:

```tsx
import { describe, it, expect } from 'vitest';
import { signal, effect } from '@philjs/core';

describe('Counter', () => {
  it('increments count', () => {
    const count = signal(0);
    count.set(count() + 1);
    expect(count()).toBe(1);
  });
});
```

See [Testing Guide](../best-practices/testing.md) for more.

## Performance Questions

### Is PhilJS fast?

Yes! PhilJS uses fine-grained reactivity:
- ✅ No virtual DOM overhead
- ✅ Only updates changed parts
- ✅ Automatic dependency tracking
- ✅ Minimal re-computation
- ✅ Small bundle size

### Should I use memo() everywhere?

No! Only use memo() for:
- ✅ Expensive computations
- ✅ Derived values used multiple times
- ✅ Complex filtering/sorting

Don't use for:
- ❌ Simple operations (x * 2)
- ❌ Single-use values
- ❌ Direct signal access

### How do I optimize large lists?

Use virtualization:

```tsx
import { VirtualList } from './VirtualList';

<VirtualList
  items={thousands}
  itemHeight={50}
  containerHeight={600}
  renderItem={(item) => <Item data={item} />}
/>
```

### What's the bundle size?

PhilJS core is very small:
- **Core**: ~5kb gzipped
- **Router**: ~2kb gzipped
- **SSR**: ~3kb gzipped

Total typical app: ~10-15kb for framework code.

## API Questions

### When should I use memo() vs effect()?

**memo()**: For computed values (no side effects)

```tsx
const doubled = memo(() => count() * 2);  // Computation
```

**effect()**: For side effects

```tsx
effect(() => {
  console.log('Count:', count());  // Side effect
});
```

### Can effects be async?

Yes:

```tsx
effect(async () => {
  const data = await fetchData();
  result.set(data);
});
```

But be careful with cleanup and race conditions!

### How do I share state between components?

**Option 1: Lift state up**

```tsx
function Parent() {
  const count = signal(0);

  return (
    <>
      <ChildA count={count} />
      <ChildB count={count} />
    </>
  );
}
```

**Option 2: Global store**

```tsx
// store.ts
export const count = signal(0);

// Component A
import { count } from './store';
```

**Option 3: Context**

```tsx
const CountContext = createContext(0);

// Provider
<CountContext.Provider value={count()}>
  <Children />
</CountContext.Provider>

// Consumer
const count = useContext(CountContext);
```

### Do I need dependency arrays?

No! PhilJS automatically tracks dependencies:

```tsx
// React (manual dependencies)
useEffect(() => {
  console.log(count);
}, [count]);  // Must list dependencies

// PhilJS (automatic tracking)
effect(() => {
  console.log(count());  // Automatically tracked
});
```

### Can I use hooks outside components?

Yes! PhilJS "hooks" (signal, memo, effect) can be used anywhere:

```tsx
// ✅ In component
function Component() {
  const count = signal(0);
  return <div>{count()}</div>;
}

// ✅ In store
export const userStore = {
  user: signal(null),
  isAuthenticated: memo(() => user() !== null)
};

// ✅ In utility function
export function createCounter(initial = 0) {
  const count = signal(initial);
  const doubled = memo(() => count() * 2);
  return { count, doubled };
}
```

## Ecosystem Questions

### What tools work with PhilJS?

- **Build tools**: Vite, Webpack, Rollup
- **Testing**: Vitest, Jest
- **TypeScript**: Full support
- **ESLint**: Compatible
- **Prettier**: Compatible
- **VS Code**: Excellent support

### Are there UI component libraries?

The PhilJS ecosystem is growing. You can:
1. Build your own components
2. Adapt headless UI libraries
3. Use CSS frameworks (Tailwind, etc.)
4. Create component libraries

### Can I use React libraries?

Not directly. PhilJS is a separate framework. However:
- Headless libraries may work with adapters
- CSS-only libraries work fine
- Port React components to PhilJS (usually straightforward)

### Is there a PhilJS devtools?

Check the PhilJS ecosystem for devtools extensions. Features may include:
- Signal inspection
- Effect tracking
- Component tree
- Performance profiling
- Time-travel debugging

## Deployment Questions

### How do I deploy PhilJS apps?

PhilJS apps deploy like any web application:

**Static hosting:**
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

**Server-side rendering:**
- Vercel
- AWS
- DigitalOcean
- Your own server

### Do I need a server for SSR?

Only if you want server-side rendering. For client-only apps:
- ✅ Static hosting is sufficient
- ✅ No server needed
- ✅ Deploy anywhere

### What about CI/CD?

Standard CI/CD works:

```yaml
# .github/workflows/deploy.yml
- run: npm ci
- run: npm test
- run: npm run build
- run: npm run deploy
```

## Community Questions

### Where can I get help?

1. **Documentation**: You're reading it!
2. **GitHub Discussions**: Ask questions
3. **Discord**: Real-time chat
4. **Stack Overflow**: Tag questions with `philjs`
5. **GitHub Issues**: Report bugs

### How can I contribute?

- Report bugs
- Submit PRs
- Improve documentation
- Create examples
- Help others
- Write blog posts

### Is PhilJS open source?

Check the PhilJS repository for licensing information. Most modern frameworks are open source (MIT or similar license).

## Migration Questions

### Should I migrate from React to PhilJS?

Consider PhilJS if:
- ✅ You want better performance
- ✅ You like fine-grained reactivity
- ✅ You want simpler state management
- ✅ You're starting a new project

If you have constraints:
- ✅ Migrate incrementally with PhilJS compatibility layers
- ✅ Isolate legacy routes and move page-by-page
- ✅ If a dependency is missing, build a PhilJS plugin or adapter

### How long does migration take?

Depends on app size:
- **Small app** (10 components): 1-2 days
- **Medium app** (50 components): 1-2 weeks
- **Large app** (200+ components): 1-2 months

Can be done incrementally with micro-frontends.

### What about React hooks I use?

Most React hooks have PhilJS equivalents:

| React | PhilJS |
|-------|--------|
| useState | signal() |
| useMemo | memo() |
| useEffect | effect() |
| useContext | useContext() |
| useReducer | Custom store |
| useCallback | Not needed |
| useRef | signal() or ref attribute |
| useLayoutEffect | effect() |

## Reactivity Questions

### How does automatic dependency tracking work?

PhilJS automatically tracks which signals are read during execution:

```tsx
const count = signal(0);
const doubled = signal(0);

// This effect automatically tracks 'count'
effect(() => {
  doubled.set(count() * 2);
});

// When count changes, the effect re-runs
count.set(5); // doubled becomes 10
```

No manual dependency arrays needed! PhilJS knows that the effect depends on `count` because you called `count()` inside it.

### Can I prevent tracking a signal?

Yes, use `untrack()`:

```tsx
import { untrack } from '@philjs/core';

const trigger = signal(0);
const value = signal(0);

effect(() => {
  trigger(); // Tracked

  // Not tracked - won't cause re-run
  const currentValue = untrack(() => value());

  console.log('Value is:', currentValue);
});
```

### What's the difference between memo() and effect()?

**memo()** - For computed values (pure functions)
- Returns a value
- No side effects
- Caches result
- Only recomputes when dependencies change

**effect()** - For side effects
- No return value (or returns cleanup)
- Can have side effects (API calls, DOM manipulation, etc.)
- Runs when dependencies change

```tsx
// memo - pure computation
const filtered = memo(() => items().filter(i => i.active));

// effect - side effect
effect(() => {
  console.log('Count changed:', count());
});
```

### When should I use batch()?

Use `batch()` when making multiple signal updates that should trigger effects only once:

```tsx
import { batch } from '@philjs/core';

// Without batch - effect runs 3 times
firstName.set('Alice');
lastName.set('Smith');
email.set('alice@example.com');

// With batch - effect runs once
batch(() => {
  firstName.set('Alice');
  lastName.set('Smith');
  email.set('alice@example.com');
});
```

### Can I create derived state from multiple signals?

Yes, use `memo()`:

```tsx
const firstName = signal('Alice');
const lastName = signal('Smith');

// Derived from multiple signals
const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "Alice Smith"

firstName.set('Bob');
console.log(fullName()); // "Bob Smith"
```

### How do I handle race conditions with async effects?

Use cleanup functions:

```tsx
effect(() => {
  const controller = new AbortController();
  const id = userId();

  fetchUser(id, { signal: controller.signal })
    .then(user => {
      // Only update if still relevant
      if (userId() === id) {
        setUser(user);
      }
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    });

  return () => controller.abort();
});
```

## Component Questions

### How do I handle component lifecycle?

PhilJS doesn't have lifecycle methods like React. Use effects:

```tsx
function Component() {
  // On mount
  effect(() => {
    console.log('Component mounted');

    // On unmount
    return () => {
      console.log('Component unmounted');
    };
  });

  return <div>Content</div>;
}
```

### Can I use default props?

Yes, use JavaScript default parameters:

```tsx
interface Props {
  count?: number;
  name?: string;
}

function Component({ count = 0, name = 'Unknown' }: Props) {
  return <div>{name}: {count}</div>;
}
```

### How do I handle prop changes?

Props are reactive - just use them:

```tsx
function Component({ userId }: { userId: string }) {
  const user = signal(null);

  // This effect re-runs when userId prop changes
  effect(async () => {
    const data = await fetchUser(userId);
    user.set(data);
  });

  return <div>{user()?.name}</div>;
}
```

### Can I use render props?

Yes, pass functions as props:

```tsx
interface Props {
  data: any[];
  render: (item: any) => JSXElement;
}

function List({ data, render }: Props) {
  return (
    <ul>
      {data.map((item, i) => (
        <li key={i}>{render(item)}</li>
      ))}
    </ul>
  );
}

// Usage
<List
  data={items()}
  render={(item) => <span>{item.name}</span>}
/>
```

### How do I pass refs to child components?

Use props:

```tsx
function Child({ inputRef }: { inputRef: Signal<HTMLInputElement | null> }) {
  return <input ref={inputRef} />;
}

function Parent() {
  const inputRef = signal<HTMLInputElement | null>(null);

  effect(() => {
    const input = inputRef();
    if (input) {
      input.focus();
    }
  });

  return <Child inputRef={inputRef} />;
}
```

### Can I use Higher-Order Components (HOCs)?

Yes, but composition is preferred:

```tsx
// HOC pattern
function withLogging<P>(Component: (props: P) => JSXElement) {
  return (props: P) => {
    console.log('Rendering with props:', props);
    return <Component {...props} />;
  };
}

const LoggedButton = withLogging(Button);

// Composition pattern (preferred)
function LoggingWrapper({ children }: { children: any }) {
  console.log('Rendering children');
  return children;
}

function App() {
  return (
    <LoggingWrapper>
      <Button />
    </LoggingWrapper>
  );
}
```

## State Management Questions

### How do I create a global store?

Create signals at module level:

```tsx
// store.ts
import { signal, memo } from '@philjs/core';

interface User {
  id: string;
  name: string;
}

export const user = signal<User | null>(null);
export const isLoggedIn = memo(() => user() !== null);

export function login(userData: User) {
  user.set(userData);
}

export function logout() {
  user.set(null);
}

// In components
import { user, isLoggedIn, login, logout } from './store';

function UserProfile() {
  if (!isLoggedIn()) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user()!.name}</div>;
}
```

### How do I model global state in PhilJS?

PhilJS uses signals for shared state. Create a module-level store and export actions:

```tsx
interface State {
  count: number;
  user: User | null;
}

const store = {
  count: signal(0),
  user: signal<User | null>(null),

  increment() {
    this.count.set(this.count() + 1);
  },

  setUser(user: User) {
    this.user.set(user);
  }
};

// Usage
function Counter() {
  return (
    <div>
      <p>Count: {store.count()}</p>
      <button onClick={() => store.increment()}>+</button>
    </div>
  );
}
```

### How do I persist state to localStorage?

Use effects to sync:

```tsx
const STORAGE_KEY = 'app-state';

function createPersistedSignal<T>(key: string, initialValue: T) {
  // Load from storage
  const stored = localStorage.getItem(key);
  const initial = stored ? JSON.parse(stored) : initialValue;

  const sig = signal<T>(initial);

  // Save to storage on change
  effect(() => {
    localStorage.setItem(key, JSON.stringify(sig()));
  });

  return sig;
}

// Usage
const theme = createPersistedSignal('theme', 'light');

// Changes automatically saved to localStorage
theme.set('dark');
```

### Can I use Zustand or other state libraries?

Yes, but signals are often simpler:

```tsx
// Zustand-like pattern with signals
function createStore<T>(initialState: T) {
  const state = signal(initialState);

  return {
    getState: () => state(),
    setState: (update: Partial<T> | ((prev: T) => T)) => {
      if (typeof update === 'function') {
        state.set(update(state()));
      } else {
        state.set({ ...state(), ...update });
      }
    },
    subscribe: (fn: (state: T) => void) => {
      return effect(() => fn(state()));
    }
  };
}

// Usage
const useStore = createStore({
  count: 0,
  user: null as User | null
});

function Component() {
  const state = useStore.getState();

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => {
        useStore.setState({ count: state.count + 1 });
      }}>
        Increment
      </button>
    </div>
  );
}
```

## Advanced Questions

### How do I implement undo/redo?

Track state history:

```tsx
function createUndoableSignal<T>(initialValue: T) {
  const current = signal(initialValue);
  const history = signal<T[]>([initialValue]);
  const index = signal(0);

  const set = (value: T) => {
    const newHistory = history().slice(0, index() + 1);
    newHistory.push(value);

    history.set(newHistory);
    index.set(newHistory.length - 1);
    current.set(value);
  };

  const undo = () => {
    if (index() > 0) {
      const newIndex = index() - 1;
      index.set(newIndex);
      current.set(history()[newIndex]);
    }
  };

  const redo = () => {
    if (index() < history().length - 1) {
      const newIndex = index() + 1;
      index.set(newIndex);
      current.set(history()[newIndex]);
    }
  };

  const canUndo = memo(() => index() > 0);
  const canRedo = memo(() => index() < history().length - 1);

  return { current, set, undo, redo, canUndo, canRedo };
}

// Usage
const text = createUndoableSignal('');

<div>
  <input
    value={text.current()}
    onInput={(e) => text.set(e.currentTarget.value)}
  />
  <button onClick={text.undo} disabled={!text.canUndo()}>Undo</button>
  <button onClick={text.redo} disabled={!text.canRedo()}>Redo</button>
</div>
```

### Can I use Web Workers with PhilJS?

Yes, for heavy computations:

```tsx
function useWorker<T, R>(workerFn: (data: T) => R) {
  const result = signal<R | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const execute = (data: T) => {
    loading.set(true);
    error.set(null);

    const worker = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.postMessage(data);

    worker.onmessage = (e) => {
      result.set(e.data);
      loading.set(false);
      worker.terminate();
    };

    worker.onerror = (e) => {
      error.set(new Error(e.message));
      loading.set(false);
      worker.terminate();
    };
  };

  return { result, loading, error, execute };
}

// Usage
const { result, loading, execute } = useWorker(processLargeData);

<button onClick={() => execute(largeDataset)}>
  Process Data
</button>

{loading() && <div>Processing...</div>}
{result() && <div>Result: {result()}</div>}
```

### How do I implement optimistic updates?

Update immediately, revert on error:

```tsx
async function updateTodo(id: string, changes: Partial<Todo>) {
  const todos = signal<Todo[]>([]);

  // Save current state
  const previousTodos = todos();

  // Optimistic update
  todos.set(
    todos().map(todo =>
      todo.id === id ? { ...todo, ...changes } : todo
    )
  );

  try {
    // API call
    await api.updateTodo(id, changes);
  } catch (error) {
    // Revert on error
    todos.set(previousTodos);
    console.error('Update failed:', error);
  }
}
```

### Can I use PhilJS for real-time apps (WebSockets)?

Yes:

```tsx
function useWebSocket(url: string) {
  const messages = signal<any[]>([]);
  const connected = signal(false);

  effect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => connected.set(true);
    ws.onclose = () => connected.set(false);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      messages.set([...messages(), message]);
    };

    return () => {
      ws.close();
    };
  });

  const send = (data: any) => {
    const ws = new WebSocket(url);
    ws.send(JSON.stringify(data));
  };

  return { messages, connected, send };
}

// Usage
function Chat() {
  const { messages, connected, send } = useWebSocket('ws://localhost:8080');

  return (
    <div>
      <div>Status: {connected() ? 'Connected' : 'Disconnected'}</div>
      <ul>
        {messages().map((msg, i) => (
          <li key={i}>{msg.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

### How do I handle complex forms?

Use the forms package:

```tsx
import { useForm, validators as v } from '@philjs/core';

function RegistrationForm() {
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validation: {
      email: [v.required, v.email],
      password: [v.required, v.minLength(8)],
      confirmPassword: [
        v.required,
        (value, values) => value === values.password || 'Passwords must match'
      ]
    },
    onSubmit: async (values) => {
      await api.register(values);
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        type="email"
        value={form.values.email()}
        onInput={(e) => form.setField('email', e.currentTarget.value)}
      />
      {form.errors().email && <span>{form.errors().email}</span>}

      <input
        type="password"
        value={form.values.password()}
        onInput={(e) => form.setField('password', e.currentTarget.value)}
      />
      {form.errors().password && <span>{form.errors().password}</span>}

      <button type="submit" disabled={!form.isValid()}>
        Register
      </button>
    </form>
  );
}
```

## Still Have Questions?

- 📚 Read the [Documentation](../README.md)
- 💬 Ask on [GitHub Discussions](https://github.com/philjs/philjs/discussions)
- 🐛 Report bugs on [GitHub Issues](https://github.com/philjs/philjs/issues)
- 💡 Check [Common Issues](./common-issues.md)
- 🔧 See [Debugging Guide](./debugging.md)

---

**Can't find your answer?** Ask the community! We're here to help.

Return to [Troubleshooting Overview](./overview.md) for more resources.
