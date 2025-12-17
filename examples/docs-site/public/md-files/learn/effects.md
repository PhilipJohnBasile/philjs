# Effects (Side Effects)

Effects let you run code in response to signal changes. They're used for synchronizing with external systems - DOM manipulation, network requests, logging, etc.

## Creating Effects

```tsx playground
import { signal, effect } from 'philjs-core';

const count = signal(0);

// Effect runs immediately, then again when count changes
effect(() => {
  console.log('Count is now:', count());
});

count.set(1);  // Logs: "Count is now: 1"
count.set(2);  // Logs: "Count is now: 2"
```

## Automatic Dependency Tracking

Like memos, effects automatically track which signals they read:

```tsx playground
import { signal, effect } from 'philjs-core';

const firstName = signal('John');
const lastName = signal('Doe');

effect(() => {
  // Automatically tracks firstName and lastName
  document.title = `${firstName()} ${lastName()}`;
});

firstName.set('Jane');  // Effect runs - title updates
```

## Cleanup Functions

Effects can return a cleanup function that runs before each re-execution and when the effect is disposed:

```tsx playground
import { signal, effect } from 'philjs-core';

const count = signal(0);

effect(() => {
  const currentCount = count();
  console.log('Setting up for count:', currentCount);

  // Return cleanup function
  return () => {
    console.log('Cleaning up for count:', currentCount);
  };
});

count.set(1);
// Logs:
// "Cleaning up for count: 0"
// "Setting up for count: 1"
```

## Real-World Use Cases

### DOM Synchronization

```tsx
import { signal, effect } from 'philjs-core';

function ThemeProvider() {
  const theme = signal<'light' | 'dark'>('light');

  effect(() => {
    document.documentElement.setAttribute('data-theme', theme());
  });

  return (
    <button onClick={() => theme.set(t => t === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}
```

### Event Listeners

```tsx
import { signal, effect } from 'philjs-core';

function WindowSize() {
  const width = signal(window.innerWidth);

  effect(() => {
    const handleResize = () => width.set(window.innerWidth);
    window.addEventListener('resize', handleResize);

    // Cleanup removes the listener
    return () => window.removeEventListener('resize', handleResize);
  });

  return <p>Window width: {width()}px</p>;
}
```

### Local Storage

```tsx
import { signal, effect } from 'philjs-core';

function PersistentCounter() {
  // Initialize from localStorage
  const count = signal(
    parseInt(localStorage.getItem('count') || '0')
  );

  // Sync to localStorage when count changes
  effect(() => {
    localStorage.setItem('count', count().toString());
  });

  return (
    <button onClick={() => count.set(c => c + 1)}>
      Count: {count()}
    </button>
  );
}
```

### Data Fetching

```tsx
import { signal, effect } from 'philjs-core';

function UserProfile({ userId }: { userId: () => string }) {
  const user = signal<User | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  effect(() => {
    const id = userId();
    let cancelled = false;

    loading.set(true);
    error.set(null);

    fetch(`/api/users/${id}`)
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

    // Cleanup cancels pending request
    return () => { cancelled = true; };
  });

  if (loading()) return <p>Loading...</p>;
  if (error()) return <p>Error: {error()!.message}</p>;
  return <p>Hello, {user()!.name}</p>;
}
```

### Timers

```tsx
import { signal, effect } from 'philjs-core';

function Timer() {
  const seconds = signal(0);
  const isRunning = signal(false);

  effect(() => {
    if (!isRunning()) return;

    const interval = setInterval(() => {
      seconds.set(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  });

  return (
    <div>
      <p>Time: {seconds()}s</p>
      <button onClick={() => isRunning.set(r => !r)}>
        {isRunning() ? 'Stop' : 'Start'}
      </button>
      <button onClick={() => seconds.set(0)}>Reset</button>
    </div>
  );
}
```

## Effect Timing

Effects run **synchronously** after signals update:

```tsx playground
import { signal, effect } from 'philjs-core';

const count = signal(0);

effect(() => {
  console.log('Effect ran with count:', count());
});

console.log('Before set');
count.set(1);
console.log('After set');

// Logs:
// "Effect ran with count: 0"
// "Before set"
// "Effect ran with count: 1"
// "After set"
```

## onCleanup Helper

For more complex cleanup scenarios, use `onCleanup`:

```tsx playground
import { signal, effect, onCleanup } from 'philjs-core';

const count = signal(0);

effect(() => {
  const value = count();
  console.log('Effect running for:', value);

  // Register multiple cleanups
  onCleanup(() => console.log('First cleanup for:', value));
  onCleanup(() => console.log('Second cleanup for:', value));
});

count.set(1);
```

## Nested Effects

Effects can be nested, but be careful:

```tsx playground
import { signal, effect } from 'philjs-core';

const outer = signal(0);
const inner = signal(0);

effect(() => {
  console.log('Outer effect:', outer());

  // Inner effect created when outer runs
  effect(() => {
    console.log('Inner effect:', inner());
  });
});

inner.set(1);  // Only inner effect runs
outer.set(1);  // Outer runs, creates new inner effect
```

## createRoot for Effect Scoping

Group effects that should be disposed together:

```tsx playground
import { signal, effect, createRoot } from 'philjs-core';

const count = signal(0);

// Create a root for effect management
const dispose = createRoot(dispose => {
  effect(() => {
    console.log('Effect 1:', count());
  });

  effect(() => {
    console.log('Effect 2:', count() * 2);
  });

  return dispose;
});

count.set(1);  // Both effects run

// Dispose all effects in the root
dispose();
count.set(2);  // No effects run
```

## Best Practices

### 1. Keep Effects Focused

```tsx
// Bad - does too much
effect(() => {
  document.title = user().name;
  localStorage.setItem('user', JSON.stringify(user()));
  analytics.track('user_update', user());
});

// Good - separate concerns
effect(() => { document.title = user().name; });
effect(() => { localStorage.setItem('user', JSON.stringify(user())); });
effect(() => { analytics.track('user_update', user()); });
```

### 2. Always Clean Up

```tsx
effect(() => {
  const handler = () => { /* ... */ };
  element.addEventListener('click', handler);
  return () => element.removeEventListener('click', handler);
});
```

### 3. Avoid Infinite Loops

```tsx
// Bad - effect reads and writes same signal
const count = signal(0);
effect(() => {
  count.set(count() + 1);  // Infinite loop!
});

// Good - separate signals
const source = signal(0);
const doubled = signal(0);
effect(() => {
  doubled.set(source() * 2);
});
```

### 4. Use Memos for Derived Values

```tsx
// Bad - using effect for derived value
const count = signal(0);
const doubled = signal(0);
effect(() => { doubled.set(count() * 2); });

// Good - use memo
const count = signal(0);
const doubled = memo(() => count() * 2);
```

## Effect vs Memo

| Use `effect` | Use `memo` |
|--------------|------------|
| Side effects (DOM, network, etc.) | Pure computations |
| Fire and forget | Returns a value |
| Synchronize with external world | Derive state |

## Next Steps

- [Context](/docs/learn/context) - Share state across components
- [Error Boundaries](/docs/learn/error-boundaries) - Handle errors
- [Forms](/docs/learn/forms) - Form handling
