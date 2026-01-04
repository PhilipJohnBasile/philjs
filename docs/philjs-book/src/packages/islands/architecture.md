# The PhilJS Resumability Engine

**Understanding the technology behind 0ms Hydration.**

Traditional frameworks (React, Vue, Svelte) rely on **Hydration** to make server-rendered HTML interactive. This involves downloading, parsing, and executing all the JavaScript for every component on the page, even if the user never interacts with them.

PhilJS takes a fundamentally different approach called **Resumability**.

## The Hydration Bottleneck

In a standard "Hydration" architecture (Next.js, Nuxt, etc.):
1.  **Server**: Renders HTML string.
2.  **Browser**: Downloads HTML (fast).
3.  **Browser**: Downloads JS bundle (slow).
4.  **Browser**: Executes JS to rebuild the VDOM and attach event listeners (slow & main-thread blocking).
5.  **Interactive**: finally, the button clicks work.

This creates an **Uncanny Valley** where the user sees the UI but cannot interact with it.

## The Resumable Solution

PhilJS (inspired by Qwik) eliminates step 4 entirely.

1.  **Server**: Renders HTML *and* serializes the application state + event listeners into the DOM.
2.  **Browser**: Downloads HTML. **Interactive immediately.**
3.  **User Interaction**: User clicks a button.
4.  **PhilJS Runtime**:
    *   Intercepts the click via a global event listener (set up by a tiny <1KB inline script).
    *   Reads the `on:click` attribute to find the **QRL** (Quick Resource Locator).
    *   Dynamically downloads *only* the code for that specific event handler.
    *   Executes the handler.

### Key differences:
*   **0ms Hydration**: There is no "hydrating" phase on load.
*   **Lazy Execution**: Code runs only when needed.
*   **Fine-Grained**: We don't download the whole component, just the closure needed for the interaction.

---

## 1. Quick Resource Locators (QRLs)

The core primitive of resumability is the **QRL**. It acts as a pointer to a function that can be lazy-loaded.

```typescript
// Source Code
const Counter = component$(() => {
  const count = useSignal(0);
  return <button onClick$={() => count.value++}>{count.value}</button>;
});
```

**Compiler Transformation:**
The compiler extracts the closure passed to `onClick$` into a top-level export in a separate chunk.

```javascript
// Output Chunk 1 (Critical Path)
// ... minimal bootstrap ...

// Output Chunk 2 (Lazy Loaded)
export const Counter_onClick = (ctx) => {
  const [count] = useLexicalScope(ctx); // Restore closure variables
  count.value++;
};
```

**Rendered HTML:**
```html
<button
  on:click="./chunk-2.js#Counter_onClick"
  ph:scope="s1"
>
  0
</button>
```

When you click the button, the runtime sees `./chunk-2.js#Counter_onClick`, imports it, restores the scope `s1` (which contains `count`), and executes the function.

## 2. Serialization & The Scope Graph

For resumability to work, the framework must be able to pause execution on the server and resume it on the client without re-running component logic.

PhilJS serializes the entire **Lexical Scope** of your application into JSON script tags.

```html
<script type="phil/json">
{
  "refs": {
    "s1": { "type": "Signal", "value": 0, "subs": ["t1"] }
  },
  "objs": []
}
</script>
```

This allows the event handler to say "I need to increment `count`", and the runtime can provide the exact signal instance that was created on the server, completely bypassing the need to re-create the component tree.

## 3. Global Event Delegation

Instead of attaching thousands of `addEventListener` calls to individual elements (which is slow), PhilJS attaches a single listener for each event type (`click`, `input`, etc.) to the `window`.

```javascript
// The <1KB Bootstrap Script
window.addEventListener('click', (event) => {
  const target = event.target;
  // Walk up the DOM to find ph:click attribute
  const handler = findHandler(target, 'click');
  if (handler) {
    // Download and execute the QRL
    import(handler.url).then(m => m[handler.symbol](event));
  }
});
```

## 4. Resumability vs. React Server Components (RSC)

| Feature | React Server Components (RSC) | PhilJS Resumability |
| :--- | :--- | :--- |
| **Server Rendering** | Components run on server, send static HTML + JSON. | Components run on server, send static HTML + Serialized Scope. |
| **Client Hydration** | **Required** for Client Components. React must boot up on client. | **Not Required**. No boot-up process. |
| **Interactivity** | Delays until JS bundle loads (for Client Components). | **Instant**. Code loads *on interaction*. |
| **State Preservation** | Complex state requires client-side reconstruction. | State is serialized and restored lazily. |

RSC reduces the *amount* of JS sent to the client, but the interactive parts still suffer from hydration costs. PhilJS removes hydration entirely.

## 5. Intelligent Prefetching (The "Nexus" Layer)

While "loading on click" sounds slow (network latency), PhilJS uses the **Nexus Service Worker** to prefetch QRLs in the background based on **Predictive AI**.

1.  **Viewport Detection**: If a button enters the viewport, its QRL is prefetched (low priority).
2.  **Intent Analysis**: If the user hovers or moves the mouse towards the button, the priority is boosted.
3.  **Result**: By the time the click happens, the code is usually already in the cache.

## Summary

The Resumability Engine is what allows PhilJS applications to scale infinitely. Whether you have 10 interactive components or 10,000, your **Time-to-Interactive (TTI)** remains constant at **0ms**.
