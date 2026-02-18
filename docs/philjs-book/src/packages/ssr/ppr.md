# Partial Prerendering (PPR)

Partial Prerendering (PPR) is the "Holy Grail" of rendering strategies. It combines the ultra-fast initial load of **Static Site Generation (SSG)** with the dynamic capabilities of **SSR**.

## The Concept

-   **The Shell**: A static HTML skeleton (Header, Sidebar, Footer) is pre-built at compile time and cached at the edge.
-   **The Holes**: Dynamic regions (User Profile, Cart) are marked as "holes" in the shell.
-   **The Stream**: When a user visits, the edge serves the shell *instantly*, then streams the dynamic content into the holes.

## Implementation

To use PPR, simply wrap dynamic parts of your application in a configured `<Suspense>` boundary or use the `dynamic` prop.

```tsx
// This entire component is prerendered at build time
export default function ProductPage() {
  return (
    <div className="page">
      <Header /> {/* Static */}
      
      <main>
        <h1>Product Details</h1>
        
        {/* Dynamic: Fetched at request time */}
        <Suspense dynamic fallback={<PriceSkeleton />}>
          <LivePricing />
        </Suspense>

        {/* Dynamic: Personalized recommendations */}
        <Suspense dynamic fallback={<RecsSkeleton />} priority={10}>
          <PersonalizedRecs />
        </Suspense>
      </main>
      
      <Footer /> {/* Static */}
    </div>
  );
}
```

## Build Process

1.  **Build Time**: `renderToStaticShell` runs. It renders the component tree but stops at dynamic boundaries, replacing them with unique tokens (e.g., `<!-- ppr-start-1 -->`).
2.  **Output**: A `shell.html` file is generated and uploaded to your CDN/Edge.
3.  **Request Time**: The server (or Edge Function) receives the request. It sends `shell.html` immediately. Simultaneously, it runs `renderAllDynamicContent` to resolve the dynamic pieces and streams them.

## Performance

PPR often results in a **Time to First Byte (TTFB)** of <50ms (since it's just a static file) while still delivering fully dynamic, personalized content.
