# Side Effects with Effects

Effects let you run code in response to signal changes. Use them for side effects like data fetching, logging, localStorage, and DOM manipulation.

## What You'll Learn

- What effects are and when to use them
- Creating and managing effects
- Effect cleanup and disposal
- Common effect patterns
- Best practices

## What is an Effect?

An effect is a function that **runs when its dependencies change**:

```typescript
import { signal, effect } from 'philjs-core';

const count = signal(0);

// Effect runs immediately, then whenever count changes
effect(() => {
  console.log('Count is now:', count());
});

// Logs: "Count is now: 0"

count.set(1);
// Logs: "Count is now: 1"

count.set(2);
// Logs: "Count is now: 2"
```

**Key concept:** Effects automatically track which signals they read and re-run when those signals change.

## Why Effects?

Effects are for **side effects** - actions that affect things outside your component:

- 📡 **Data fetching** - Load data from APIs
- 💾 **localStorage** - Persist state
- 📊 **Analytics** - Track user behavior
- 🎯 **DOM manipulation** - Direct DOM access when needed
- 🔔 **Logging** - Debug and monitor
- 🌐 **WebSocket** - Real-time connections
- ⏰ **Timers** - setTimeout, setInterval

### Effects vs Memos

```typescript
// Memo: for computing values
const doubled = memo(() => count() * 2);
console.log(doubled()); // Read the computed value

// Effect: for side effects
effect(() => {
  console.log('Count changed to', count());
  // Doesn't return anything, just does something
});
```

**Rule of thumb:**
- Need a value? Use `memo()`
- Need to do something? Use `effect()`

## Creating Effects

### Basic Effect

```typescript
const count = signal(0);

effect(() => {
  document.title = `Count: ${count()}`;
});

// Title updates automatically when count changes!
```

### Effect with Multiple Dependencies

```typescript
const firstName = signal('John');
const lastName = signal('Doe');

effect(() => {
  console.log('Name changed:', firstName(), lastName());
});

// Runs when EITHER firstName OR lastName changes
```

### Conditional Effects

```typescript
const enabled = signal(true);
const value = signal(0);

effect(() => {
  if (!enabled()) return;

  console.log('Value:', value());
});

// Only logs when enabled is true
```

## Effect Cleanup

Effects can return a cleanup function that runs before the next execution:

```typescript
const count = signal(0);

effect(() => {
  console.log('Effect running');

  return () => {
    console.log('Cleanup running');
  };
});

// Logs: "Effect running"

count.set(1);
// Logs: "Cleanup running"
// Logs: "Effect running"
```

### Why Cleanup?

Cleanup prevents resource leaks:

```typescript
// ❌ Without cleanup - creates new listener on every change!
effect(() => {
  window.addEventListener('resize', handleResize);
});

// ✅ With cleanup - removes old listener before adding new one
effect(() => {
  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
});
```

## Common Effect Patterns

### localStorage Persistence

```typescript
const todos = signal<Todo[]>([]);

// Load from localStorage on mount
todos.set(
  JSON.parse(localStorage.getItem('todos') || '[]')
);

// Save to localStorage whenever todos change
effect(() => {
  localStorage.setItem('todos', JSON.stringify(todos()));
});
```

### Data Fetching

```typescript
const userId = signal<number | null>(null);
const user = signal<User | null>(null);
const loading = signal(false);
const error = signal<Error | null>(null);

effect(() => {
  const id = userId();
  if (!id) return;

  loading.set(true);
  error.set(null);

  fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(data => {
      user.set(data);
      loading.set(false);
    })
    .catch(err => {
      error.set(err);
      loading.set(false);
    });
});

// Changing userId triggers a new fetch
userId.set(123);
```

### Data Fetching with Cleanup

```typescript
const query = signal('');
const results = signal<Result[]>([]);

effect(() => {
  const searchQuery = query();
  if (!searchQuery) {
    results.set([]);
    return;
  }

  const abortController = new AbortController();

  fetch(`/api/search?q=${searchQuery}`, {
    signal: abortController.signal
  })
    .then(res => res.json())
    .then(data => results.set(data))
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    });

  // Cleanup: cancel previous request
  return () => abortController.abort();
});
```

### WebSocket Connection

```typescript
const wsUrl = signal('ws://localhost:8080');
const messages = signal<Message[]>([]);

effect(() => {
  const url = wsUrl();
  const ws = new WebSocket(url);

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    messages.set([...messages(), message]);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  // Cleanup: close connection
  return () => {
    ws.close();
  };
});
```

### Document Title

```typescript
const pageName = signal('Home');
const unreadCount = signal(0);

effect(() => {
  const count = unreadCount();
  const name = pageName();

  document.title = count > 0
    ? `(${count}) ${name} - MyApp`
    : `${name} - MyApp`;
});
```

### Analytics Tracking

```typescript
const currentPage = signal('/');

effect(() => {
  const page = currentPage();

  // Track page view
  analytics.track('page_view', {
    page,
    timestamp: Date.now()
  });
});
```

### Logging/Debugging

```typescript
const appState = signal({ user: null, theme: 'light' });

effect(() => {
  console.log('State changed:', appState());
});

// Or more sophisticated logging
effect(() => {
  const state = appState();

  logger.log('STATE_CHANGE', {
    state,
    timestamp: new Date().toISOString(),
    user: state.user?.id
  });
});
```

### Timer with Cleanup

```typescript
const interval = signal(1000);
const tick = signal(0);

effect(() => {
  const ms = interval();

  const timer = setInterval(() => {
    tick.set(t => t + 1);
  }, ms);

  // Cleanup: clear timer
  return () => clearInterval(timer);
});
```

### Scroll Position Sync

```typescript
const scrollY = signal(0);

effect(() => {
  const handleScroll = () => {
    scrollY.set(window.scrollY);
  };

  window.addEventListener('scroll', handleScroll);

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
});
```

## Effects in Components

### Auto-save Form

```typescript
function EditProfile({ userId }: { userId: number }) {
  const name = signal('');
  const email = signal('');
  const bio = signal('');

  // Auto-save after 1 second of no changes
  effect(() => {
    const data = { name: name(), email: email(), bio: bio() };

    const timer = setTimeout(() => {
      fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    }, 1000);

    return () => clearTimeout(timer);
  });

  return (
    <form>
      <input value={name()} onInput={e => name.set(e.target.value)} />
      <input value={email()} onInput={e => email.set(e.target.value)} />
      <textarea value={bio()} onInput={e => bio.set(e.target.value)} />
    </form>
  );
}
```

### Theme Synchronization

```typescript
function ThemeProvider({ children }: { children: any }) {
  const theme = signal<'light' | 'dark'>('light');

  // Sync with localStorage
  effect(() => {
    localStorage.setItem('theme', theme());
  });

  // Sync with DOM
  effect(() => {
    document.documentElement.setAttribute('data-theme', theme());
  });

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Real-time Data Subscription

```typescript
function LivePrice({ symbol }: { symbol: string }) {
  const price = signal<number | null>(null);

  effect(() => {
    const subscription = priceService.subscribe(symbol, (newPrice) => {
      price.set(newPrice);
    });

    return () => subscription.unsubscribe();
  });

  return (
    <div>
      {price() !== null ? `$${price()!.toFixed(2)}` : 'Loading...'}
    </div>
  );
}
```

## Advanced Techniques

### Conditional Effect Execution

```typescript
const enabled = signal(false);
const data = signal<Data | null>(null);

effect(() => {
  if (!enabled()) {
    // Effect won't track dependencies here
    return;
  }

  // This runs only when enabled is true
  console.log('Data:', data());
});
```

### Batched Effects

Multiple signal updates trigger the effect only once:

```typescript
const firstName = signal('');
const lastName = signal('');
const email = signal('');

effect(() => {
  console.log('Form changed:', firstName(), lastName(), email());
});

// All three updates batched - effect runs once
function updateUser(user: User) {
  firstName.set(user.firstName);
  lastName.set(user.lastName);
  email.set(user.email);
}
// Logs once, not three times!
```

### Async Effects

```typescript
const userId = signal<number | null>(null);
const user = signal<User | null>(null);

effect(() => {
  const id = userId();
  if (!id) return;

  // Async function
  (async () => {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();
    user.set(data);
  })();
});
```

### Debounced Effect

```typescript
function debounce(fn: Function, delay: number) {
  let timer: number;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

const query = signal('');
const results = signal([]);

effect(() => {
  const search = debounce(async () => {
    const response = await fetch(`/api/search?q=${query()}`);
    results.set(await response.json());
  }, 300);

  search();
});
```

## When to Use Effects

### ✅ Use Effects For:

- Data fetching
- localStorage/sessionStorage
- Analytics and logging
- WebSocket connections
- Event listeners (window, document)
- DOM manipulation
- Timers and intervals
- Third-party library integration

### ❌ Don't Use Effects For:

**Computing values - use memos instead:**
```typescript
// ❌ Wrong - effect for computation
const doubled = signal(0);
effect(() => {
  doubled.set(count() * 2);
});

// ✅ Correct - memo for computation
const doubled = memo(() => count() * 2);
```

**Event handlers - use onClick, etc:**
```typescript
// ❌ Wrong
effect(() => {
  if (buttonClicked()) {
    doSomething();
  }
});

// ✅ Correct
<button onClick={doSomething}>Click</button>
```

**Initializing signals:**
```typescript
// ❌ Wrong
const data = signal(null);
effect(() => {
  data.set(initialData);
});

// ✅ Correct
const data = signal(initialData);
```

## Common Mistakes

### Forgetting Cleanup

```typescript
// ❌ Memory leak - listener never removed
effect(() => {
  window.addEventListener('resize', handleResize);
});

// ✅ Cleanup prevents leak
effect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
});
```

### Infinite Loops

```typescript
// ❌ Infinite loop - effect updates its own dependency
const count = signal(0);

effect(() => {
  count.set(count() + 1); // Triggers itself infinitely!
});

// ✅ Use a different signal or condition
effect(() => {
  if (count() < 10) {
    setTimeout(() => count.set(count() + 1), 1000);
  }
});
```

### Not Handling Async Properly

```typescript
// ❌ Race condition - old requests can override new ones
const query = signal('');

effect(() => {
  fetch(`/api/search?q=${query()}`)
    .then(res => res.json())
    .then(data => results.set(data));
});

// ✅ Use AbortController
effect(() => {
  const controller = new AbortController();

  fetch(`/api/search?q=${query()}`, { signal: controller.signal })
    .then(res => res.json())
    .then(data => results.set(data))
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });

  return () => controller.abort();
});
```

### Using Effects for Derived State

```typescript
// ❌ Wrong - using effect for computation
const count = signal(0);
const doubled = signal(0);

effect(() => {
  doubled.set(count() * 2);
});

// ✅ Correct - use memo
const doubled = memo(() => count() * 2);
```

## Debugging Effects

### Log When Effects Run

```typescript
effect(() => {
  console.log('Effect triggered');
  console.log('Dependencies:', count(), name());
  // Your effect logic
});
```

### Name Your Effects (for DevTools)

```typescript
effect(() => {
  // Effect logic
}, { name: 'Save to localStorage' });

effect(() => {
  // Effect logic
}, { name: 'Fetch user data' });
```

### Track Effect Runs

```typescript
let runCount = 0;

effect(() => {
  runCount++;
  console.log(`Effect run #${runCount}`);
  // Effect logic
});
```

## Performance Tips

### Avoid Heavy Work in Effects

```typescript
// ❌ Expensive work on every change
effect(() => {
  const sorted = items().sort((a, b) => /* expensive */);
  doSomething(sorted);
});

// ✅ Use memo for expensive computation
const sorted = memo(() => items().sort((a, b) => /* expensive */));

effect(() => {
  doSomething(sorted());
});
```

### Conditional Execution

```typescript
// ✅ Early return if work not needed
effect(() => {
  if (!shouldRun()) return;

  // Expensive work only when needed
  performExpensiveOperation();
});
```

## Comparison to Other Frameworks

### vs React useEffect

```typescript
// React
useEffect(() => {
  console.log(count);

  return () => {
    // cleanup
  };
}, [count]); // Manual dependencies

// PhilJS
effect(() => {
  console.log(count());

  return () => {
    // cleanup
  };
}); // Automatic dependencies
```

**Differences:**
- No dependency array (automatic tracking)
- Can be used outside components
- No stale closure issues

### vs Vue watchEffect

```typescript
// Vue
watchEffect(() => {
  console.log(count.value);
});

// PhilJS
effect(() => {
  console.log(count());
});
```

Very similar! Just different syntax for reading values.

## Summary

You've learned:

✅ Effects run code when signals change
✅ Create with `effect(() => { /* code */ })`
✅ Return cleanup functions to prevent leaks
✅ Use for side effects like fetching, localStorage, events
✅ Effects automatically track dependencies
✅ Don't use effects for computing values (use memos)
✅ Always clean up timers, listeners, subscriptions

Effects complete PhilJS's reactivity system. With signals, memos, and effects, you can build any reactive application!

---

**Next:** [Context for Sharing State →](./context.md) Learn how to share state across your component tree
