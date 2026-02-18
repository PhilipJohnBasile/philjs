# Chapter 5: Islands & Hydration

Traditional Single Page Applications (SPAs) often face a performance bottleneck known as the "Uncanny Valley" of loading—where content is visible but not yet interactive.

This latency is primarily caused by **Hydration**, the process where the framework downloads, parses, and executes the JavaScript bundle to attach event listeners to the existing DOM nodes. This process duplicates the work already performed by the server during the initial render.

## The Cost of Hydration

Hydration scales linearly with application size. In a typical SPA, the entire application runtime must be initialized before any component becomes interactive, regardless of the user's immediate needs.

This architecture creates a trade-off: efficient initial paint times (via SSR) often come at the cost of delayed interactivity (Time-to-Interactive or TTI).

## The Solution: Islands Architecture

PhilJS implements the **Islands Architecture**.

The default behavior of PhilJS is **0kb JavaScript**.
If you render a static page (like this book), PhilJS sends pure HTML and CSS. No bundles. No hydration. It loads instantly.

When you need interactivity, you mark a component as an **Island**.

```typescript
// This component ships NO JavaScript to the client
function Header() {
  return (
    <header>
      <h1>My Site</h1>
      {/* This component hydrates in isolation */}
      <SearchBar client:load />
    </header>
  );
}
```

The `<SearchBar />` is an "Island of Interactivity" in a sea of static HTML. PhilJS generates a tiny, independent bundle for just that component.

## Hydration Strategies

You can control *when* an island hydrates using strategies:

*   `client:load`: Hydrate immediately (for critical UI like Nav).
*   `client:idle`: Hydrate when the CPU is free (for secondary UI).
*   `client:visible`: Hydrate only when the user scrolls it into view (for heavy footers or charts).
*   `client:media="(min-width: 768px)"`: Hydrate only on desktop.

## Resumability

PhilJS goes one step further with **Resumability**.

In standard hydration, the framework needs to re-run the component logic to figure out where the event listeners go. PhilJS serializes this information into the HTML itself.

```html
<button on:click="chunk-abc.js#handleClick">Buy</button>
```

When you click the button, a tiny 1kb bootloader intercepts the event, downloads `chunk-abc.js`, and executes `handleClick` directly. The component logic *never ran on the client*. We skipped hydration entirely for the event handler.

## Summary

*   **HTML is the fastest format**. Send more of it.
*   **JavaScript has a cost**. Spend it wisely.
*   **Islands** let you mix the performance of a static site with the interactivity of an app.

Your users don't care about your framework. They care about opening the page. Give them the HTML.
