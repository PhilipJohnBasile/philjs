# Chapter 3: The Component Paradox

This chapter addresses the most common source of confusion for developers moving to PhilJS: **The Component Paradox**.

> **The Paradox**: *PhilJS components look exactly like React components, but they share almost none of the same runtime behavior.*

## The Illusion of Similarity

Consider this component:

```typescript
function UserBadge({ user }) {
  console.log("Badge Rendered");
  return <div class="badge">{user.name}</div>;
}
```

In React, this function runs every time `user` changes. The `console.log` fires repeatedly.
In PhilJS, this function runs **once**. The `console.log` fires on mount, and never again.

## Components as Setup Functions

In PhilJS, a component is a **setup function**. Its job is to:
1.  Receive arguments (props).
2.  Declare local state (signals).
3.  Return a template (JSX).

Once the template is returned, the component function's job is done. It is garbage collected. The DOM nodes it created live on, wired directly to the signals you declared.

### Implications of "Run Once"

Because components run once, "Conditional Rendering" works differently.

**In React:**
```typescript
// React: This works because the function re-runs
function Timer() {
  const [time, setTime] = useState(0);
  if (time > 10) return <div>Done!</div>;
  return <div>{time}</div>;
}
```

**In PhilJS:**
```typescript
// PhilJS: This will NEVER update after the first render!
function Timer() {
  const time = signal(0);
  
  // ❌ WRONG: This `if` runs once at setup. 
  // If time(0) is not > 10, it returns the second div and wires it up.
  // Even if time becomes 11, the function never runs again to check the `if`.
  if (time() > 10) return <div>Done!</div>;
  
  return <div>{time()}</div>;
}
```

## How to Handle Dynamics

To make things dynamic, you must perform the logic **inside the JSX** or use helper components, because the JSX expressions are the only things that subscribe to signals.

**Correct Approach:**
```typescript
function Timer() {
  const time = signal(0);
  
  return (
    <div>
      {/* The ternary inside JSX creates a reactive boundary */}
      {time() > 10 ? <span>Done!</span> : <span>{time()}</span>}
    </div>
  );
}
```

## Props are Reactive

In many frameworks, props are plain values. In PhilJS, props can be signals or plain values. If you want a component to react to a prop change, you should generally pass a signal, or access props in a reactive context.

```typescript
// Parent
const count = signal(0);
return <Child count={count} />; // Pass the signal itself!

// Child
function Child({ count }) {
  // Accessing count() creates the subscription
  return <div>{count()}</div>; 
}
```

## Lifecycle: Setup and Disposal

Since there are no re-renders, there are no `componentDidUpdate` equivalents. There are only two moments in time:

1.  **Setup**: When the functions runs.
2.  **Disposal**: When the returned DOM is removed from the page.

Use `onCleanup` to handle disposal.

```typescript
import { onCleanup } from "@philjs/core";

function MouseTracker() {
  const listener = (e) => console.log(e.x, e.y);
  window.addEventListener("mousemove", listener);
  
  // Register cleanup logic
  onCleanup(() => {
    window.removeEventListener("mousemove", listener);
  });
  
  return <div>Tracking...</div>;
}
```

## Why This Model Wins

The "Run Once" model eliminates an entire class of performance pitfalls:
*   **No Stale Closures**: You don't need `useCallback` because functions are created once and stay stable.
*   **No Dependency Arrays**: You don't need to tell the framework what to watch. It watches the signals you access.
*   **Predictable Performance**: A strictly localized update is always O(1). A Virtual DOM diff is O(N) relative to the tree size.

Embrace the paradox: Write functions that run once to build UIs that update forever.
