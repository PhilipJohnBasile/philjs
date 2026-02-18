# Static Site Generation (SSG) & ISR

PhilJS supports hybrid rendering models, allowing you to choose between Server-Side Rendering (SSR), Static Site Generation (SSG), and Incremental Static Regeneration (ISR) on a per-route basis.

## Modes

You can define the rendering mode in your route configuration.

```typescript
import { ssg, isr, ssr } from '@philjs/ssr/static-generation';

// Static Site Generation (Built once at deploy time)
export const config = ssg();

// Incremental Static Regeneration (Revalidated every 60s)
export const config = isr(60);

// Server-Side Rendering (Default)
export const config = ssr();
```

## Static Site Generation (SSG)

For pages that use `ssg()`, you must export a `getStaticPaths` function if the route has dynamic parameters (e.g., `/blog/[slug]`).

```typescript
// src/routes/blog/[slug].tsx
import { ssg } from '@philjs/ssr/static-generation';

export const config = ssg();

export async function getStaticPaths() {
  const posts = await db.posts.findMany();
  return posts.map(post => `/blog/${post.slug}`);
}

export default function BlogPost({ params }) {
  // ...
}
```

## Incremental Static Regeneration (ISR)

ISR allows you to update static pages *after* you've built your site.

### Time-Based Revalidation

```typescript
// Revalidate at most once every 60 seconds
export const config = isr(60);
```

1.  The first request after 60s serves the "stale" page immediately.
2.  PhilJS triggers a background regeneration.
3.  Once generated, the new page replaces the old one in the cache.
4.  Subsequent requests serve the new page.

### On-Demand Revalidation

You can manually trigger a revalidation via API (e.g., when a CMS content changes).

```typescript
// API Route: /api/webhook
import { handleRevalidation } from '@philjs/ssr/static-generation';

export async function action({ request }) {
  // Verify webhook secret
  if (request.headers.get('secret') !== process.env.REVALIDATION_TOKEN) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Invalidate specific paths
  await generator.invalidate('/blog/new-post');
  
  return { revalidated: true };
}
```

## Caching

PhilJS supports pluggable ISR caches.

-   **MemoryISRCache**: Default. Good for single-instance deployments.
-   **RedisISRCache**: Recommended for distributed deployments / clusters.

```typescript
import { RedisISRCache } from '@philjs/ssr/static-generation';
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
const cache = new RedisISRCache(redis);
```
