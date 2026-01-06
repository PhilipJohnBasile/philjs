# Chapter 2: Primitives of State

If the Dependency Graph is the map, then **Signals** are the territory.

PhilJS provides three core primitives for state management:
1.  **Signal**: The atomic unit of state (The Source).
2.  **Memo**: A derived value (The Compute).
3.  **Effect**: A side effect (The Observer).

## 1. The Signal (Source)

A Signal is a container for a value that changes over time. Structurally, it is a getter function with a `.set()` method attached.

```typescript
import { signal } from "@philjs/core";

const count = signal(0); // Create

console.log(count());    // Read: 0
count.set(1);            // Write: 1
count.update(n => n + 1);// Update: 2
```

### The Golden Rule of Signals
> **"Read Function, Write Method"**

To access the value, you *call* the signal (`count()`). This allows the current context (like an Effect or a Template) to detect the access and subscribe to future changes. To change the value, you use the methods (`.set()`).

## 2. The Memo (Derivation)

Memos are cached, read-only signals. They value comes from a pure function.

```typescript
const price = signal(100);
const tax = signal(0.1);

// Automatically tracks 'price' and 'tax'
const total = memo(() => price() * (1 + tax())); 
```

Memos are lazy. If nothing is reading `total`, the calculation function never runs, even if `price` changes. Memos are also smart: if `price` changes from `100` to `100` (no change), `total` will not notify its downstream dependents.

## 3. The Effect (Observer)

Effects are the bridge between the reactive world and the imperative world. An Effect runs instantly when created, and runs again whenever any signal it read changes.

```typescript
effect(() => {
  // This function runs every time 'total' updates
  console.log(`The new total is ${total()}`);
  
  // Example: Sync to localStorage
  localStorage.setItem('cart_total', total());
});
```

> [!WARNING]
> **Avoid Effect Spaghetti**: Beginners often use Effects to synchronize state (e.g., using an effect to set `b` when `a` changes). This causes cascading updates. Always use **Memos** for derived data. Only use Effects for logging, DOM manipulation, or I/O.

## The "Glitch-Free" Guarantee

Reactive systems are prone to a class of bugs called "Glitches" (also known as the Diamond Problem).

Imagine this graph:
```
    A (Name: "John")
   / \
  B   C (Derived: B = A.upper, C = A.len)
   \ /
    D (Effect: Log "NAME: LENGTH")
```

If `A` changes to "Jane":
1.  A notifies B and C.
2.  In a naive system, B might update and trigger D *immediately*.
3.  D runs and sees B="JANE" but C=4 (stale length of "John"). **This is a glitch.**
4.  C updates to 4 ("Jane" is also length 4).
5.  D runs again.

PhilJS is **Glitch-Free**. It uses a topological stabilization phase. When `A` changes, it marks B and C as "stale", but D does not run until *both* B and C have settled. D will never see an inconsistent state.

## Async Resources

State is not always synchronous. PhilJS handles async data via **Resources**. Using `Suspense` boundaries (discussed in the Routing chapter), specific parts of the UI can "pause" while a Resource loads.

```typescript
const userId = signal(1);

const user = resource(async () => {
  const response = await fetch(\`/api/users/\${userId()}\`);
  return response.json();
});

// In component:
// <div>{user().name}</div> -> Will show fallback until resolved
```

## Summary

| Primitive | Role | Writeable? | Lazy? |
| :--- | :--- | :--- | :--- |
| **Signal** | Source of Truth | Yes | No |
| **Memo** | Derived State | No | Yes |
| **Effect** | Side Effect / I/O | No | No |

Mastering these three primitives is 90% of the work in PhilJS.
