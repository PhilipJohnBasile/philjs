# Performance Tuning Guide

## Optimization Strategies

### 1. Bundle Analysis
Run `npm run build -- --analyze` to visualize your bundle size. Look for large dependencies in the client chunk.

### 2. Lazy Loading
Use `lazy(() => import('./HeavyComponent'))` for routes or modals that aren't critical for LCP.

### 3. Signal Optimization
Avoid passing signals to `props` if you only need the value once. Pass the signal itself (`count`) rather than the value (`count.value`) to generic components to prevent re-renders of the parent.

### 4. Server-Side Rendering
Ensure your `entry-server.tsx` is not blocking the event loop. Use `streamSSR` for large pages.
