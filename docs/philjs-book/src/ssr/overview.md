# Chapter 5: Islands & Hydration

The greatest lie of the Single Page Application era was this: *"It's fast once it loads."*

The problem is the "once it loads." To make a page interactive, traditional frameworks must download all the JavaScript for the page, parse it, execute it, and then attach event listeners to every single DOM node. This process is called **Hydration**.

Hydration is pure overhead. It is purely redundant work. The server already rendered the HTML; why must the browser spend 500ms re-doing that work just to make a menu clickable?

## The Cost of Hydration

Imagine buying a furnished house.
**Server Side Rendering (SSR)** is like having the house built and furnished before you arrive.
**Hydration** is keeping the movers outside the door, and forcing them to touch every single piece of furniture to confirm it exists before you are allowed to sit on the couch.

It gets worse. As your app grows, the hydration cost grows linearly. Your "Blog" page might only need a tiny bit of JS for a "Like" button, but if it's built as an SPA, users must download the entire framework runtime, the router, and the layout logic just to read text.

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
