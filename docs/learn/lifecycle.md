# Component Lifecycle

Understanding the component lifecycle in PhilJS is essential for managing side effects, cleaning up resources, and optimizing performance. Unlike class-based frameworks, PhilJS uses a functional approach with signals and effects to handle lifecycle events.

## Overview

In PhilJS, components don't have traditional lifecycle methods like `componentDidMount` or `componentWillUnmount`. Instead, you use **effects** to respond to lifecycle events. This approach is simpler, more predictable, and eliminates many common bugs.

```tsx
import { signal, effect, onCleanup } from 'philjs-core';

function Timer() {
  const seconds = signal(0);

  // Runs when component mounts
  effect(() => {
    const interval = setInterval(() => {
      seconds.set(s => s + 1);
    }, 1000);

    // Cleanup when component unmounts
    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return <div>Seconds: {seconds()}</div>;
}
```

## Component Creation

When a component is created, PhilJS:

1. Executes the component function
2. Creates a reactive scope for tracking dependencies
3. Renders the initial JSX
4. Runs any effects defined in the component

```tsx
import { signal } from 'philjs-core';

function UserProfile({ userId }: { userId: number }) {
  console.log('Component function called');

  const user = signal(null);

  // This runs during component creation
  fetchUser(userId).then(data => user.set(data));

  return (
    <div>
      {user() ? <h1>{user().name}</h1> : <p>Loading...</p>}
    </div>
  );
}
```

## Mount Phase

The mount phase occurs when a component is first added to the DOM. Use `effect()` without dependencies to run code after mounting:

```tsx
import { effect } from 'philjs-core';

function AnalyticsTracker() {
  effect(() => {
    // This runs after the component is mounted
    analytics.track('Page View', {
      path: window.location.pathname,
      timestamp: Date.now()
    });
  });

  return <div>Content tracked</div>;
}
```

### Mount with Async Operations

```tsx
import { signal, effect } from 'philjs-core';

function DataLoader() {
  const data = signal(null);
  const loading = signal(true);
  const error = signal(null);

  effect(() => {
    // Runs on mount
    fetch('/api/data')
      .then(res => res.json())
      .then(result => {
        data.set(result);
        loading.set(false);
      })
      .catch(err => {
        error.set(err);
        loading.set(false);
      });
  });

  if (loading()) return <div>Loading...</div>;
  if (error()) return <div>Error: {error().message}</div>;
  return <div>{JSON.stringify(data())}</div>;
}
```

## Update Phase

Components update when their signals change. PhilJS only re-renders the specific DOM nodes that depend on the changed signal:

```tsx
import { signal, memo } from 'philjs-core';

function Counter() {
  const count = signal(0);

  // This memo updates when count changes
  const doubled = memo(() => {
    console.log('Recalculating doubled');
    return count() * 2;
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Tracking Updates

Use effects to respond to signal changes:

```tsx
import { signal, effect } from 'philjs-core';

function SearchBox() {
  const query = signal('');
  const results = signal([]);

  // Effect runs when query changes
  effect(() => {
    const currentQuery = query();

    if (currentQuery.length < 3) {
      results.set([]);
      return;
    }

    // Debounced search
    const timer = setTimeout(() => {
      searchAPI(currentQuery).then(data => results.set(data));
    }, 300);

    // Cleanup previous timer
    onCleanup(() => clearTimeout(timer));
  });

  return (
    <div>
      <input
        value={query()}
        onInput={(e) => query.set(e.target.value)}
      />
      <ul>
        {results().map(r => <li key={r.id}>{r.title}</li>)}
      </ul>
    </div>
  );
}
```

## Cleanup Phase

The cleanup phase runs when:
- A component unmounts
- An effect re-runs (cleaning up the previous effect)
- A signal dependency changes

Use `onCleanup()` to clean up resources:

```tsx
import { effect, onCleanup } from 'philjs-core';

function WebSocketComponent() {
  effect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      console.log('Message:', event.data);
    };

    // Cleanup: close WebSocket when component unmounts
    onCleanup(() => {
      ws.close();
      console.log('WebSocket closed');
    });
  });

  return <div>Connected to WebSocket</div>;
}
```

### Multiple Cleanup Handlers

```tsx
import { signal, effect, onCleanup } from 'philjs-core';

function MultiResourceComponent() {
  const active = signal(true);

  effect(() => {
    // Set up multiple resources
    const eventListener = () => console.log('Window resized');
    window.addEventListener('resize', eventListener);

    const interval = setInterval(() => {
      console.log('Tick');
    }, 1000);

    const subscription = eventBus.subscribe('update', handleUpdate);

    // Clean up all resources
    onCleanup(() => {
      window.removeEventListener('resize', eventListener);
      clearInterval(interval);
      subscription.unsubscribe();
      console.log('All resources cleaned up');
    });
  });

  return <div>Managing multiple resources</div>;
}
```

## Lifecycle Patterns

### Execute Once on Mount

```tsx
import { effect } from 'philjs-core';

function OnceOnMount() {
  effect(() => {
    console.log('This runs once when component mounts');
    initializeApp();
  });

  return <div>Initialized</div>;
}
```

### Execute on Specific Signal Changes

```tsx
import { signal, effect } from 'philjs-core';

function WatchSpecificSignal() {
  const userPreference = signal('light');
  const otherSignal = signal(0);

  // Only watches userPreference
  effect(() => {
    const pref = userPreference();
    console.log('Preference changed to:', pref);
    applyTheme(pref);
  });

  return (
    <div>
      <button onClick={() => userPreference.set('dark')}>
        Dark Mode
      </button>
      <button onClick={() => otherSignal.set(otherSignal() + 1)}>
        This won't trigger the effect
      </button>
    </div>
  );
}
```

### Conditional Effects

```tsx
import { signal, effect } from 'philjs-core';

function ConditionalEffect() {
  const isLoggedIn = signal(false);
  const userData = signal(null);

  effect(() => {
    if (isLoggedIn()) {
      // Only fetch user data when logged in
      fetchUserData().then(data => userData.set(data));

      onCleanup(() => {
        console.log('User logged out, cleaning up');
        userData.set(null);
      });
    }
  });

  return (
    <div>
      {isLoggedIn() && userData() && (
        <p>Welcome, {userData().name}!</p>
      )}
    </div>
  );
}
```

## Advanced Lifecycle Techniques

### Deferred Execution

Execute code after the DOM has updated:

```tsx
import { effect, onMount } from 'philjs-core';

function DeferredExecution() {
  let divRef;

  onMount(() => {
    // Runs after component is mounted and DOM is ready
    console.log('Div height:', divRef.offsetHeight);
  });

  return <div ref={divRef}>Content</div>;
}
```

### Batched Updates

PhilJS automatically batches signal updates for optimal performance:

```tsx
import { signal, batch } from 'philjs-core';

function BatchedUpdates() {
  const firstName = signal('');
  const lastName = signal('');
  const age = signal(0);

  const updateUser = () => {
    // These updates are batched - only one render
    batch(() => {
      firstName.set('John');
      lastName.set('Doe');
      age.set(30);
    });
  };

  return (
    <div>
      <p>{firstName()} {lastName()}, {age()}</p>
      <button onClick={updateUser}>Update</button>
    </div>
  );
}
```

### Error Boundaries in Lifecycle

```tsx
import { ErrorBoundary } from 'philjs-core';

function SafeComponent() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h2>Something went wrong</h2>
          <pre>{error.message}</pre>
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    >
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}
```

## Comparing to Other Frameworks

### React Class Components

```tsx
// React
class Timer extends React.Component {
  state = { seconds: 0 };

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({ seconds: this.state.seconds + 1 });
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return <div>Seconds: {this.state.seconds}</div>;
  }
}

// PhilJS
function Timer() {
  const seconds = signal(0);

  effect(() => {
    const interval = setInterval(() => {
      seconds.set(s => s + 1);
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  return <div>Seconds: {seconds()}</div>;
}
```

### React Hooks

```tsx
// React
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Don't forget dependency array!

  return <div>Seconds: {seconds}</div>;
}

// PhilJS - no dependency arrays needed
function Timer() {
  const seconds = signal(0);

  effect(() => {
    const interval = setInterval(() => {
      seconds.set(s => s + 1);
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  return <div>Seconds: {seconds()}</div>;
}
```

## Best Practices

### ✅ Do: Clean Up Resources

Always clean up subscriptions, timers, and event listeners:

```tsx
effect(() => {
  const handler = () => console.log('Clicked');
  document.addEventListener('click', handler);

  onCleanup(() => {
    document.removeEventListener('click', handler);
  });
});
```

### ✅ Do: Use Memos for Derived Values

Don't put computations in effects when you can use memos:

```tsx
// ❌ Bad
const fullName = signal('');
effect(() => {
  fullName.set(`${firstName()} ${lastName()}`);
});

// ✅ Good
const fullName = memo(() => `${firstName()} ${lastName()}`);
```

### ❌ Don't: Mutate Signals in Render

Keep renders pure—use effects for side effects:

```tsx
// ❌ Bad
function Counter() {
  const count = signal(0);
  count.set(count() + 1); // Infinite loop!

  return <div>{count()}</div>;
}

// ✅ Good
function Counter() {
  const count = signal(0);

  effect(() => {
    // Side effects belong in effects
    logAnalytics('count', count());
  });

  return <div>{count()}</div>;
}
```

### ❌ Don't: Forget Cleanup

Always clean up to prevent memory leaks:

```tsx
// ❌ Bad - memory leak
effect(() => {
  setInterval(() => console.log('tick'), 1000);
});

// ✅ Good
effect(() => {
  const interval = setInterval(() => console.log('tick'), 1000);
  onCleanup(() => clearInterval(interval));
});
```

## Debugging Lifecycle

### Log Lifecycle Events

```tsx
import { effect, onMount, onCleanup } from 'philjs-core';

function DebugComponent() {
  console.log('Component function called');

  onMount(() => {
    console.log('Component mounted');
  });

  effect(() => {
    console.log('Effect running');

    onCleanup(() => {
      console.log('Effect cleaning up');
    });
  });

  onCleanup(() => {
    console.log('Component unmounting');
  });

  return <div>Debug Component</div>;
}
```

### DevTools Integration

Use PhilJS DevTools to visualize lifecycle events:

```tsx
import { enableDevTools } from 'philjs-devtools';

// Enable in development
if (process.env.NODE_ENV === 'development') {
  enableDevTools();
}
```

## Common Patterns

### Auto-save Form

```tsx
import { signal, effect } from 'philjs-core';

function AutoSaveForm() {
  const formData = signal({ title: '', content: '' });
  const lastSaved = signal(null);

  effect(() => {
    const data = formData();

    // Debounce auto-save
    const timer = setTimeout(() => {
      saveToServer(data).then(() => {
        lastSaved.set(new Date());
      });
    }, 1000);

    onCleanup(() => clearTimeout(timer));
  });

  return (
    <div>
      <input
        value={formData().title}
        onInput={(e) => formData.set({
          ...formData(),
          title: e.target.value
        })}
      />
      {lastSaved() && <p>Saved at {lastSaved().toLocaleTimeString()}</p>}
    </div>
  );
}
```

### Polling with Pause/Resume

```tsx
import { signal, effect } from 'philjs-core';

function PollingComponent() {
  const data = signal(null);
  const isPaused = signal(false);

  effect(() => {
    if (isPaused()) return;

    const poll = () => {
      fetchData().then(result => data.set(result));
    };

    poll(); // Initial fetch
    const interval = setInterval(poll, 5000);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <div>
      <button onClick={() => isPaused.set(!isPaused())}>
        {isPaused() ? 'Resume' : 'Pause'} Polling
      </button>
      <pre>{JSON.stringify(data(), null, 2)}</pre>
    </div>
  );
}
```

## Next Steps

- [Effects](/docs/learn/effects.md) - Deep dive into effects
- [Signals](/docs/learn/signals.md) - Master reactive state
- [Error Boundaries](/docs/learn/error-boundaries.md) - Handle errors gracefully
- [Performance](/docs/learn/performance.md) - Optimize lifecycle operations

---

💡 **Tip**: Use the PhilJS DevTools to visualize when components mount, update, and unmount. It's invaluable for understanding lifecycle behavior.

⚠️ **Warning**: Always clean up subscriptions and timers to prevent memory leaks. If you're creating a resource, you probably need to clean it up.

ℹ️ **Note**: PhilJS's lifecycle model is simpler than React's because effects automatically track dependencies. No more forgetting dependency arrays!
