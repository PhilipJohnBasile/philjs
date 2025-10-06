# Thinking in PhilJS

PhilJS requires a different mental model than React, Vue, or other popular frameworks. Understanding these differences will help you write better code and avoid common pitfalls.

## The Mental Shift from React

If you're coming from React, the biggest mindset change is moving from **coarse-grained** to **fine-grained** reactivity.

### React's Mental Model

In React, when state changes:

```typescript
// React
const [count, setCount] = useState(0);

// Entire component re-runs when count changes
function Counter() {
  console.log('Component rendering'); // Logs on every update
  return <div>{count}</div>;
}
```

**Key concept**: The whole component function runs again. React diffs the virtual DOM to determine what changed.

### PhilJS's Mental Model

In PhilJS, when state changes, **only the specific parts using that state update**:

```typescript
// PhilJS
const count = signal(0);

function Counter() {
  console.log('Component setup'); // Only logs once!
  return <div>{count()}</div>; // Only this updates
}
```

**Key concept**: Components run once. Signals track their dependencies and update only the exact DOM nodes that need to change.

## Understanding Fine-Grained Reactivity

Fine-grained reactivity means the framework knows **exactly** which parts of your UI depend on which pieces of state.

### Automatic Dependency Tracking

```typescript
const firstName = signal('John');
const lastName = signal('Doe');

// This memo only recalculates when firstName or lastName change
const fullName = memo(() => `${firstName()} ${lastName()}`);

// This effect only runs when fullName changes
effect(() => {
  console.log('Name changed:', fullName());
});
```

**What happens:**
1. When you call `firstName()` inside the memo, PhilJS records that dependency
2. When `firstName.set()` is called, only `fullName` recalculates
3. Only the effect subscribed to `fullName` runs
4. Nothing else in your app is touched

### Surgical Updates

```typescript
function UserProfile() {
  const user = signal({ name: 'Alice', age: 30, bio: 'Developer' });

  return (
    <div>
      <h1>{user().name}</h1> {/* Updates only when name changes */}
      <p>Age: {user().age}</p> {/* Updates only when age changes */}
      <p>{user().bio}</p> {/* Updates only when bio changes */}
    </div>
  );
}
```

In React, changing any property would re-render the entire component. In PhilJS, each expression `{user().name}` creates its own subscription, so only that specific text node updates.

## When to Use Signals vs Props vs Context

This is one of the most common questions. Here's a decision tree:

### Use Props When...

**Data flows down the component tree naturally**

```typescript
// ✅ Good - data flows parent → child
function UserList({ users }) {
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

**Benefits:**
- Explicit data flow
- Easy to trace where data comes from
- TypeScript enforces the contract
- No hidden dependencies

### Use Signals When...

**You need reactive state within a component**

```typescript
// ✅ Good - local component state
function SearchBox() {
  const query = signal('');
  const isSearching = signal(false);

  return (
    <input
      value={query()}
      onInput={(e) => query.set(e.target.value)}
      placeholder={isSearching() ? 'Searching...' : 'Search'}
    />
  );
}
```

**You need to share state between a few related components**

```typescript
// ✅ Good - shared state in parent, passed down
function ShoppingCart() {
  const items = signal<Item[]>([]);

  return (
    <div>
      <ItemList items={items} />
      <CartSummary items={items} />
      <Checkout items={items} />
    </div>
  );
}
```

**Benefits:**
- Reactive updates
- Simple to create and use
- No boilerplate
- Can be passed as props

### Use Context When...

**Data needs to be accessible deep in the tree**

```typescript
// ✅ Good - avoid prop drilling
const ThemeContext = createContext<Theme>();

function App() {
  const theme = signal<Theme>({ mode: 'light', primary: '#667eea' });

  return (
    <ThemeContext.Provider value={theme}>
      <Layout>
        <Header />
        <Sidebar />
        <Content />
      </Layout>
    </ThemeContext.Provider>
  );
}

// Many levels deep...
function Button() {
  const theme = useContext(ThemeContext);
  return <button style={{ background: theme().primary }}>Click me</button>;
}
```

**Benefits:**
- Avoids prop drilling
- Clean component APIs
- Easy to access from anywhere in the subtree

**⚠️ Don't overuse:** Context is great for themes, auth, i18n, but don't make everything global. Local state is easier to reason about.

## Common Mental Model Pitfalls

### Pitfall 1: Forgetting to Call Signals

```typescript
const count = signal(0);

// ❌ Wrong - reading a signal
<div>{count}</div> // Shows: [object Object]

// ✅ Correct - calling the signal
<div>{count()}</div> // Shows: 0
```

**Why:** Signals are functions. `count` is the signal object, `count()` reads its value.

### Pitfall 2: Using Signals Like React State

```typescript
// ❌ Wrong - treating signals like React
const count = signal(0);

function increment() {
  const current = count();
  count.set(current + 1); // Verbose!
}

// ✅ Better - use the updater function
function increment() {
  count.set(c => c + 1);
}
```

**Why:** Signals have an updater function like React's `setState`, use it!

### Pitfall 3: Not Using Memos for Derived State

```typescript
const todos = signal<Todo[]>([...]);

// ❌ Wrong - recalculates every time it's read
function getCompletedCount() {
  return todos().filter(t => t.completed).length;
}

// ✅ Correct - memoized, only recalculates when todos change
const completedCount = memo(() =>
  todos().filter(t => t.completed).length
);
```

**Why:** Memos cache their result and only recalculate when dependencies change. Functions run every time.

### Pitfall 4: Mutating Signal Values

```typescript
const user = signal({ name: 'Alice', age: 30 });

// ❌ Wrong - mutating the object
user().age = 31; // Doesn't trigger updates!

// ✅ Correct - creating new object
user.set({ ...user(), age: 31 });

// ✅ Also correct - using updater
user.set(u => ({ ...u, age: 31 }));
```

**Why:** Signals only detect changes when you call `.set()`. Direct mutation doesn't trigger updates.

### Pitfall 5: Creating Signals Inside Render

```typescript
// ❌ Wrong - creates new signal on every render
function Counter() {
  const count = signal(0); // New signal every time!
  return <div>{count()}</div>;
}

// ✅ Correct - signal persists across renders
const count = signal(0);

function Counter() {
  return <div>{count()}</div>;
}
```

**Why:** In PhilJS, components only run once during initial render. But if you're composing components, you want signals to be stable.

**Exception:** It's fine if the component truly only mounts once, but generally keep signals outside or use them for local ephemeral state.

## Component Composition Patterns

### Pattern 1: Container/Presenter

Separate logic from presentation:

```typescript
// Container - handles logic and state
function UserDashboardContainer() {
  const user = signal(null);
  const loading = signal(true);

  effect(() => {
    fetchUser().then(data => {
      user.set(data);
      loading.set(false);
    });
  });

  return <UserDashboard user={user} loading={loading} />;
}

// Presenter - pure rendering
function UserDashboard({ user, loading }) {
  if (loading()) return <Spinner />;
  if (!user()) return <Error />;

  return (
    <div>
      <h1>{user().name}</h1>
      <p>{user().email}</p>
    </div>
  );
}
```

### Pattern 2: Compound Components

Components that work together:

```typescript
function Tabs({ children }) {
  const activeTab = signal(0);

  return (
    <div>
      <TabContext.Provider value={{ activeTab }}>
        {children}
      </TabContext.Provider>
    </div>
  );
}

function TabList({ children }) {
  return <div role="tablist">{children}</div>;
}

function Tab({ index, children }) {
  const { activeTab } = useContext(TabContext);
  return (
    <button
      onClick={() => activeTab.set(index)}
      aria-selected={activeTab() === index}
    >
      {children}
    </button>
  );
}

// Usage:
<Tabs>
  <TabList>
    <Tab index={0}>Profile</Tab>
    <Tab index={1}>Settings</Tab>
  </TabList>
  <TabPanel index={0}>Profile content</TabPanel>
  <TabPanel index={1}>Settings content</TabPanel>
</Tabs>
```

### Pattern 3: Render Props (via Children)

```typescript
function DataFetcher({ url, children }) {
  const data = signal(null);
  const loading = signal(true);
  const error = signal(null);

  effect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        data.set(data);
        loading.set(false);
      })
      .catch(err => error.set(err));
  });

  return children({ data, loading, error });
}

// Usage:
<DataFetcher url="/api/users">
  {({ data, loading, error }) => (
    loading() ? <Spinner /> :
    error() ? <Error error={error()} /> :
    <UserList users={data()} />
  )}
</DataFetcher>
```

### Pattern 4: Higher-Order Components (HOCs)

```typescript
function withAuth<P>(Component: (props: P) => JSX.Element) {
  return (props: P) => {
    const user = useUser();

    if (!user()) {
      return <Redirect to="/login" />;
    }

    return <Component {...props} user={user} />;
  };
}

// Usage:
const ProtectedDashboard = withAuth(Dashboard);
```

## Reactivity Mental Model Diagram

Here's how to visualize PhilJS's reactivity:

```
┌─────────────┐
│   Signal    │ ← source of truth
│  count = 5  │
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
  ┌─────────┐       ┌─────────┐      ┌─────────┐
  │  Memo   │       │  Memo   │      │ Effect  │
  │ doubled │       │ isEven  │      │ console │
  │ = 10    │       │ = false │      │  log    │
  └────┬────┘       └────┬────┘      └─────────┘
       │                 │
       ▼                 ▼
  ┌─────────┐       ┌─────────┐
  │   DOM   │       │   DOM   │
  │ <div>10 │       │ <span>  │
  └─────────┘       └─────────┘

When count changes:
1. count.set(6) called
2. All subscribers notified (doubled, isEven, effect)
3. Memos recalculate their values
4. DOM nodes update automatically
5. Effects run their side effects
```

## Component Lifecycle Mental Model

Unlike React, PhilJS components don't have lifecycle methods. Instead:

```
React:                    PhilJS:
───────                   ───────

Mount                     Component function runs once
  ↓                         ↓
Render                    Creates JSX with signals
  ↓                         ↓
Effect (useEffect)        Effects created, run once
  ↓                         ↓
Update (state change)     Signal changes
  ↓                         ↓
Re-render                 Only subscribed nodes update
  ↓                         ↓
Effect cleanup            Effect cleanup (if needed)
  ↓                         ↓
Unmount                   Effect cleanup runs
```

**Key insight:** PhilJS components run once, then signals handle all updates. No re-renders!

## Best Practices Summary

### ✅ Do This

- Call signals to read values: `count()`
- Use memos for derived state
- Keep signals immutable (create new objects)
- Use updater functions: `count.set(c => c + 1)`
- Pass signals as props when needed
- Use context for deep tree data
- Keep components small and focused

### ❌ Avoid This

- Forgetting to call signals: `{count}` instead of `{count()}`
- Mutating signal values directly
- Creating signals inside frequently-called functions
- Overusing context (prefer props)
- Treating PhilJS like React
- Manually tracking dependencies (let PhilJS do it)

## Transitioning Your Mindset

### From React Hooks to PhilJS

```typescript
// React
const [count, setCount] = useState(0);
const doubled = useMemo(() => count * 2, [count]);
useEffect(() => {
  console.log(count);
}, [count]);

// PhilJS
const count = signal(0);
const doubled = memo(() => count() * 2);
effect(() => {
  console.log(count());
});
```

**Key differences:**
- No dependency arrays (automatic tracking)
- No hook rules (use anywhere)
- Signals persist outside components
- No re-renders

### From Vue to PhilJS

```typescript
// Vue (Composition API)
const count = ref(0);
const doubled = computed(() => count.value * 2);
watch(count, (newValue) => {
  console.log(newValue);
});

// PhilJS
const count = signal(0);
const doubled = memo(() => count() * 2);
effect(() => {
  console.log(count());
});
```

**Key differences:**
- Call signals as functions: `count()` vs `count.value`
- Similar mental model otherwise
- PhilJS has better TypeScript inference

## Next Steps

Now that you understand the PhilJS mental model:

1. **[Core Concepts: Signals](../learn/signals.md)** - Deep dive into signals
2. **[Core Concepts: Memos](../learn/memos.md)** - Master derived state
3. **[Core Concepts: Effects](../learn/effects.md)** - Handle side effects
4. **[Best Practices](../best-practices/overview.md)** - Advanced patterns

## Summary

The PhilJS mental model centers on:

🎯 **Fine-grained reactivity** - Updates are surgical, not wholesale
🎯 **Automatic dependency tracking** - No manual dependency arrays
🎯 **Components run once** - No re-renders, only signal updates
🎯 **Signals are functions** - Call them to read: `count()`
🎯 **Immutable updates** - Create new values, don't mutate
🎯 **Memos for derived state** - Cache expensive computations
🎯 **Effects for side effects** - Run when dependencies change

Once this mental model clicks, PhilJS feels natural and powerful. You'll wonder how you ever tolerated re-rendering entire component trees!

---

**Congratulations!** You've completed the Getting Started guide. You now have the foundation to build amazing applications with PhilJS.

**Next:** [Core Concepts: Components →](../learn/components.md)
