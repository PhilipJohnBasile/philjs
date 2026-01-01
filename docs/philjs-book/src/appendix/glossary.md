# Glossary

A quick reference for terms used throughout the PhilJS book.

- **Action**: Route-bound mutation handler; runs on server/edge, can invalidate caches.
- **Adapter**: Platform-specific integration for SSR/edge/serverless (Vercel, Netlify, CF, AWS, Bun, Deno, Node, static).
- **Cache tag**: Identifier used to scope loader caches and invalidations (e.g., `['user', id]`).
- **CSR**: Client-side rendering; PhilJS prefers SSR + islands for speed.
- **Effect**: PhilJS reactive side-effect; should perform side effects only.
- **Hydration**: Attaching event handlers/state to server-rendered markup.
- **Island**: An interactive component hydrated separately from the rest of the page.
- **Loader**: Route-bound data fetcher; runs before render, supports caching and revalidation.
- **Memo**: Derived value that recomputes when dependencies change.
- **Resource**: Async data primitive with loading/error states.
- **SSR**: Server-side rendering; in PhilJS, often streamed and edge-friendly.
- **Store**: Structured state container with middleware, history, persistence.
- **Stale time**: Duration a cached value is considered fresh before revalidation.
- **TTFB**: Time to first byte; key SSR/edge performance metric.
- **Untrack**: Read a signal without subscribing to its changes.
- **Variant/Flag**: Value used to control experiments or feature toggles.
