# PhilJS Error Codes Reference

This document provides a comprehensive reference for all PhilJS error codes, including explanations, common causes, and solutions.

## Table of Contents

- [Signal Errors (PHIL-001 to PHIL-099)](#signal-errors)
- [SSR/Hydration Errors (PHIL-100 to PHIL-199)](#ssr-hydration-errors)
- [Router Errors (PHIL-200 to PHIL-299)](#router-errors)
- [Compiler Errors (PHIL-300 to PHIL-399)](#compiler-errors)
- [Component Errors (PHIL-400 to PHIL-499)](#component-errors)
- [Runtime Errors (PHIL-500 to PHIL-599)](#runtime-errors)

---

## Signal Errors

### PHIL-001: Signal Read During Update

**Category:** Signal
**Severity:** Error

#### Description

This error occurs when you attempt to read a signal's value while it is being updated. This creates an infinite loop and is not allowed.

#### Common Causes

```typescript
const count = signal(0);

// ❌ Wrong: Reading signal during its own update
count.set(count() + 1);
```

#### Solutions

**Solution 1: Use signal.peek()**

```typescript
const count = signal(0);

// ✅ Correct: Use peek() to read without tracking
count.set(count.peek() + 1);
```

**Solution 2: Use an updater function**

```typescript
const count = signal(0);

// ✅ Correct: Use updater function
count.set(prev => prev + 1);
```

---

### PHIL-002: Circular Signal Dependency

**Category:** Signal
**Severity:** Error

#### Description

A circular dependency has been detected in your reactive graph. Signal A depends on Signal B, which depends on Signal A (directly or indirectly).

#### Common Causes

```typescript
// ❌ Wrong: Circular dependency
const a = memo(() => b());
const b = memo(() => a());
```

#### Solutions

**Solution 1: Break the cycle with untrack()**

```typescript
// ✅ Correct: Break cycle with untrack
const a = memo(() => b());
const b = memo(() => untrack(() => a()));
```

**Solution 2: Restructure your reactive graph**

```typescript
// ✅ Correct: Use a common source
const source = signal(0);
const a = memo(() => source() * 2);
const b = memo(() => source() * 3);
```

#### Learn More

- [Understanding Reactive Dependencies](../learn/signals.md#dependencies)
- [Using untrack()](../api-reference/core.md#untrack)

---

### PHIL-003: Signal Updated Outside Batch

**Category:** Signal
**Severity:** Warning

#### Description

Multiple signals were updated consecutively without batching. This can cause unnecessary re-computations and hurt performance.

#### Common Causes

```typescript
// ⚠️ Warning: 3 separate update cycles
firstName.set('John');
lastName.set('Doe');
age.set(30);
```

#### Solutions

**Wrap multiple updates in batch()**

```typescript
// ✅ Correct: Single update cycle
batch(() => {
  firstName.set('John');
  lastName.set('Doe');
  age.set(30);
});
```

#### Performance Impact

- **Without batching:** 3 separate re-computations
- **With batching:** 1 re-computation

---

### PHIL-004: Effect Missing Cleanup

**Category:** Signal
**Severity:** Warning

#### Description

An effect doesn't return a cleanup function. This may cause memory leaks if the effect sets up timers, subscriptions, or event listeners.

#### Common Causes

```typescript
// ⚠️ Warning: No cleanup for timer
effect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);
  // Missing cleanup!
});
```

#### Solutions

**Solution 1: Return cleanup function**

```typescript
// ✅ Correct: Returns cleanup
effect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => clearInterval(timer);
});
```

**Solution 2: Use onCleanup()**

```typescript
// ✅ Correct: Use onCleanup
effect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  onCleanup(() => clearInterval(timer));
});
```

---

### PHIL-005: Memo Returning Undefined

**Category:** Signal
**Severity:** Warning

#### Description

A memo computation returns `undefined`. This is usually unintentional and may indicate a missing `return` statement.

#### Common Causes

```typescript
// ⚠️ Warning: Missing return
const total = memo(() => {
  let sum = 0;
  items().forEach(item => sum += item.price);
  // Forgot to return!
});
```

#### Solutions

```typescript
// ✅ Correct: Explicit return
const total = memo(() => {
  return items().reduce((sum, item) => sum + item.price, 0);
});
```

---

## SSR/Hydration Errors

### PHIL-100: Hydration Mismatch

**Category:** Hydration
**Severity:** Error

#### Description

The HTML generated on the server doesn't match what the client rendered. This breaks hydration and can cause visual glitches or incorrect behavior.

#### Common Causes

1. **Random values used during rendering**

```typescript
// ❌ Wrong: Random value differs between server and client
function Component() {
  const id = signal(Math.random());
  return <div id={id()}>Content</div>;
}
```

2. **Date/time rendering**

```typescript
// ❌ Wrong: Server and client times differ
function Component() {
  return <div>{new Date().toLocaleString()}</div>;
}
```

3. **Browser-only APIs**

```typescript
// ❌ Wrong: window is undefined on server
function Component() {
  const width = signal(window.innerWidth);
  return <div>{width()}</div>;
}
```

#### Solutions

**Solution 1: Use initial state from server**

```typescript
// ✅ Correct: Pass initial state from server
function Component({ initialData }) {
  const data = signal(initialData);
  return <div>{data()}</div>;
}
```

**Solution 2: Guard browser APIs**

```typescript
// ✅ Correct: Check for browser environment
function Component() {
  const width = signal(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  return <div>{width()}</div>;
}
```

**Solution 3: Use effects for client-only code**

```typescript
// ✅ Correct: Run after hydration
function Component() {
  const timestamp = signal('');

  effect(() => {
    if (typeof window !== 'undefined') {
      timestamp.set(new Date().toLocaleString());
    }
  });

  return <div>{timestamp()}</div>;
}
```

---

### PHIL-101: Browser API Called During SSR

**Category:** SSR
**Severity:** Error

#### Description

Code attempted to use a browser-only API (like `localStorage`, `document`, or `window`) during server-side rendering.

#### Common Causes

```typescript
// ❌ Wrong: localStorage not available on server
const settings = JSON.parse(localStorage.getItem('settings'));
```

#### Solutions

```typescript
// ✅ Correct: Guard with environment check
const settings = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('settings') || '{}')
  : {};
```

---

### PHIL-102: Missing SSR Data

**Category:** SSR
**Severity:** Error

#### Description

Required data for server-side rendering is not available. This usually means data wasn't fetched before rendering.

#### Solutions

```typescript
// ✅ Correct: Fetch data before rendering
export async function getServerData() {
  const user = await fetchUser();
  const posts = await fetchPosts();

  return {
    user,
    posts,
  };
}

export function render({ user, posts }) {
  return <App user={user} posts={posts} />;
}
```

---

## Router Errors

### PHIL-200: Invalid Route Pattern

**Category:** Router
**Severity:** Error

#### Description

A route pattern uses invalid syntax.

#### Common Causes

```typescript
// ❌ Wrong: Invalid parameter syntax
<Route path="users/:id*extra" />

// ❌ Wrong: Invalid parameter name
<Route path="/:user-name" />
```

#### Solutions

```typescript
// ✅ Correct: Valid route patterns
<Route path="users/:id" />
<Route path="users/:id?" /> // Optional parameter
<Route path="users/*" /> // Wildcard
<Route path="/:userName" /> // Valid identifier
```

---

### PHIL-201: Missing Route Parameter

**Category:** Router
**Severity:** Error

#### Description

Required route parameters were not provided during navigation.

#### Common Causes

```typescript
// Route definition
<Route path="/users/:id" component={UserProfile} />

// ❌ Wrong: Missing :id parameter
navigate('/users');
```

#### Solutions

```typescript
// ✅ Correct: Provide required parameter
navigate('/users/123');

// Or make the parameter optional in the route
<Route path="/users/:id?" component={UserProfile} />
```

---

### PHIL-202: Route Not Found

**Category:** Router
**Severity:** Warning

#### Description

No route matches the requested path. Consider adding a catch-all route for 404 pages.

#### Solutions

```typescript
// ✅ Add catch-all route
<Routes>
  <Route path="/" component={Home} />
  <Route path="/about" component={About} />
  <Route path="*" component={NotFound} />
</Routes>
```

---

## Compiler Errors

### PHIL-300: Invalid JSX Syntax

**Category:** Compiler
**Severity:** Error

#### Description

JSX syntax error detected during compilation.

#### Common Causes

```typescript
// ❌ Wrong: Unclosed tag
<div>
  <p>Hello
</div>

// ❌ Wrong: Using 'class' instead of 'className'
<div class="container">
```

#### Solutions

```typescript
// ✅ Correct
<div>
  <p>Hello</p>
</div>

<div className="container">
```

---

### PHIL-301: Unsupported Feature

**Category:** Compiler
**Severity:** Error

#### Description

You're using a feature that isn't yet supported by PhilJS.

#### Solutions

Check the [Supported Features](../api-reference/core.md#supported-features) documentation for alternatives.

---

### PHIL-302: Optimization Warning

**Category:** Compiler
**Severity:** Warning

#### Description

The compiler detected a potential optimization opportunity.

#### Example

```typescript
// ⚠️ Warning: Could be memoized
function Component() {
  const expensive = () => {
    return items().map(i => i.price * tax()).reduce((a, b) => a + b);
  };

  return <div>{expensive()}</div>;
}
```

#### Solution

```typescript
// ✅ Better: Use memo
function Component() {
  const expensive = memo(() => {
    return items().map(i => i.price * tax()).reduce((a, b) => a + b);
  });

  return <div>{expensive()}</div>;
}
```

---

## Component Errors

### PHIL-400: Component Render Error

**Category:** Component
**Severity:** Error

#### Description

An error occurred while rendering a component.

#### Common Causes

1. Missing required props
2. Invalid return value
3. Runtime errors in component code

#### Solutions

```typescript
// ✅ Correct: Valid component
function MyComponent({ name, age }) {
  if (!name) {
    return <div>Error: Name is required</div>;
  }

  return (
    <div>
      <h1>{name}</h1>
      <p>Age: {age}</p>
    </div>
  );
}
```

---

### PHIL-401: Invalid Props

**Category:** Component
**Severity:** Error

#### Description

Invalid props were passed to a component.

#### Solutions

Use TypeScript for compile-time prop validation:

```typescript
interface UserCardProps {
  name: string;
  age: number;
  email?: string;
}

function UserCard({ name, age, email }: UserCardProps) {
  return (
    <div>
      <h1>{name}</h1>
      <p>Age: {age}</p>
      {email && <p>Email: {email}</p>}
    </div>
  );
}
```

---

## Runtime Errors

### PHIL-500: Null Reference Error

**Category:** Runtime
**Severity:** Error

#### Description

Attempted to access a property of `null` or `undefined`.

#### Common Causes

```typescript
// ❌ Wrong: user might be null
const name = user.profile.name;
```

#### Solutions

**Solution 1: Optional chaining**

```typescript
// ✅ Correct: Safe property access
const name = user?.profile?.name;
```

**Solution 2: Null checks**

```typescript
// ✅ Correct: Explicit null checks
const name = user && user.profile && user.profile.name;
```

**Solution 3: Default values**

```typescript
// ✅ Correct: Provide fallback
const name = user?.profile?.name ?? 'Guest';
```

---

### PHIL-501: Async Operation Error

**Category:** Runtime
**Severity:** Error

#### Description

An async operation (like fetch) failed.

#### Solutions

**Solution 1: Try-catch**

```typescript
// ✅ Correct: Error handling
async function loadData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load data:', error);
    // Handle error appropriately
    return null;
  }
}
```

**Solution 2: Use resource()**

```typescript
// ✅ Correct: Built-in error handling
const data = resource(async () => {
  const response = await fetch('/api/data');
  return response.json();
});

// In component
if (data.loading()) return <div>Loading...</div>;
if (data.error()) return <div>Error: {data.error().message}</div>;
return <div>{JSON.stringify(data())}</div>;
```

---

## Error Handling Best Practices

### 1. Use Error Boundaries

Wrap your app in error boundaries to gracefully handle errors:

```typescript
import { ErrorBoundary } from 'philjs-core';

function App() {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={retry}>Try Again</button>
        </div>
      )}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

### 2. Enable Error Tracking

Set up error tracking for production:

```typescript
import { initErrorTracking, createSentryTracker } from 'philjs-errors';

if (process.env.NODE_ENV === 'production') {
  initErrorTracking(createSentryTracker(), {
    dsn: 'your-sentry-dsn',
    environment: 'production',
    sampleRate: 1.0,
  });
}
```

### 3. Use the Error Overlay in Development

The error overlay automatically shows in development mode, but you can customize it:

```typescript
import { initErrorOverlay } from 'philjs-errors';

if (process.env.NODE_ENV === 'development') {
  initErrorOverlay();
}
```

### 4. Add Context to Errors

Provide context when capturing errors:

```typescript
import { captureError } from 'philjs-errors';

try {
  await riskyOperation();
} catch (error) {
  captureError(error, {
    component: 'UserProfile',
    extra: {
      userId: user.id,
      operation: 'updateProfile',
    },
  });
  throw error;
}
```

---

## Getting Help

If you encounter an error not covered in this guide:

1. Check the [GitHub Issues](https://github.com/yourusername/philjs/issues)
2. Ask in the [Discord Community](https://discord.gg/philjs)
3. Review the [FAQ](./faq.md)

## Contributing

Found a common error that should be documented? [Submit a PR](https://github.com/yourusername/philjs/blob/main/CONTRIBUTING.md) to add it to this guide!
