# Tutorial: Build a Storefront with SSR

Build a production-ready e-commerce storefront with server-side rendering, streaming, islands architecture, AI integration, and PWA features. This advanced tutorial demonstrates PhilJS's full-stack capabilities.

## What You'll Learn

- Server-side rendering (SSR) with streaming
- Islands architecture for selective hydration
- Loaders and actions for data management
- View Transitions API integration
- AI-powered features
- Progressive Web App (PWA) setup
- Performance budgets and monitoring
- Security best practices (CSP, signed cookies)
- Service workers and offline support

## What We're Building

A full-featured e-commerce storefront with:
- **SSR streaming** - Instant page loads with progressive rendering
- **Product catalog** - Dynamic routes with loaders
- **Shopping cart** - Optimistic UI updates with actions
- **AI summaries** - AI-generated product descriptions
- **Islands** - Hydrate interactive components on demand
- **PWA** - Offline support and installable
- **Performance monitoring** - Core Web Vitals tracking
- **Production ready** - Security, caching, and optimization

## Architecture Overview

The storefront uses a modern architecture:

```
src/
  entry-client.ts        # Client runtime with islands
  routes/
    index.tsx            # Home page with loader
    products/[id].tsx    # Product page with loader + action
  server/
    entry-server.ts      # SSR streaming renderer
    router.ts            # File-based routing
    mock-db.ts           # Mock database
  ai/
    summarize.ts         # AI integration
public/
  sw.js                  # Service worker
  manifest.json          # PWA manifest
server/
  dev.js                 # Vite dev server
  prod.js                # Production server
  ai.js                  # AI endpoint (optional)
```

## Setup

```bash
# From the PhilJS repo root
cd examples/storefront

# Install dependencies (if not already installed)
pnpm install

# Build the packages first
cd ../..
pnpm build

# Return to storefront
cd examples/storefront

# Start the dev server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your storefront.

## Step 1: Understanding SSR with Loaders

PhilJS uses **loaders** to fetch data on the server before rendering.

### Home Page with Loader

File: `src/routes/index.tsx`

```typescript
import { defineLoader } from "@philjs/ssr";
import { html } from "../server/template";

// Loader runs on the server during SSR
export const loader = defineLoader(async ({ db }) => {
  const featured = await db.product.all();
  return { featured };
});

// Component receives data from loader
export default function Home({ data }: { data: { featured: Array<Product> } }) {
  return html`
    <main>
      <header>
        <h1>PhilJS Storefront</h1>
        <p>Fast by default, HTML first, batteries included.</p>
        <p>Streaming SSR with islands and AI assisted experiences.</p>
      </header>

      <section>
        <h2>Featured Products</h2>
        <div class="product-grid">
          ${data.featured.map((product) =>
            html`
              <article class="product-card">
                <div>
                  <h3>${product.title}</h3>
                  <p>$${product.price.toFixed(2)}</p>
                </div>
                <a href="/products/${product.id}" data-phil-prefetch>
                  View details
                </a>
              </article>
            `
          )}
        </div>
      </section>
    </main>
  `;
}
```

### How Loaders Work

1. **Server receives request** - User navigates to `/`
2. **Loader executes** - `loader()` function runs on server
3. **Data fetched** - Database queries complete
4. **HTML rendered** - Component renders with data
5. **Stream sent** - HTML streams to browser progressively

The page is **fully rendered HTML** - no loading spinners needed!

## Step 2: Dynamic Routes with Actions

Product pages use **dynamic routes** and **actions** for mutations.

### Product Page

File: `src/routes/products/[id].tsx`

```typescript
import { defineLoader, defineAction } from "@philjs/ssr";
import { signal } from "@philjs/core";
import { html } from "../../server/template";
import { Island } from "@philjs/islands";

// Loader fetches product data
export const loader = defineLoader(async ({ params, db }) => {
  const product = await db.product.get(params.id);
  if (!product) {
    return { product: null, inCart: false };
  }

  const cart = await db.cart.get();
  const inCart = cart.items.some(item => item.productId === params.id);

  return { product, inCart };
});

// Action handles form submissions
export const action = defineAction(async ({ request, params, db }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'add-to-cart') {
    await db.cart.add(params.id);
    return { success: true, message: 'Added to cart' };
  }

  if (intent === 'remove-from-cart') {
    await db.cart.remove(params.id);
    return { success: true, message: 'Removed from cart' };
  }

  return { success: false, message: 'Unknown action' };
});

export default function Product({ data }: { data: { product: Product; inCart: boolean } }) {
  if (!data.product) {
    return html`<h1>Product not found</h1>`;
  }

  const { product, inCart } = data;

  return html`
    <article class="product-detail">
      <div class="product-image">
        <img src="${product.image}" alt="${product.title}" />
      </div>

      <div class="product-info">
        <h1>${product.title}</h1>
        <p class="price">$${product.price.toFixed(2)}</p>
        <p class="description">${product.description}</p>

        <!-- Island: Hydrate only this interactive component -->
        <${Island} name="AddToCart" props=${{ productId: product.id, inCart }}>
          <add-to-cart-island data-product-id="${product.id}" data-in-cart="${inCart}">
            <form method="post">
              <input type="hidden" name="intent" value="${inCart ? 'remove-from-cart' : 'add-to-cart'}" />
              <button type="submit">
                ${inCart ? 'Remove from Cart' : 'Add to Cart'}
              </button>
            </form>
          </add-to-cart-island>
        </Island>
      </div>
    </article>
  `;
}
```

### Understanding Actions

Actions handle **mutations** (POST, PUT, DELETE):
1. User submits form
2. Action runs on server
3. Database updated
4. Page re-rendered with new data
5. Client receives updated HTML

This is similar to traditional server-rendered forms, but with **optimistic UI** support on the client.

## Step 3: Islands Architecture

Islands are **interactive components** that hydrate on demand. The rest of the page stays static HTML.

### Client Entry Point

File: `src/entry-client.ts`

```typescript
import { hydrateIslands } from '@philjs/islands';
import { AddToCart } from './islands/AddToCart';
import { CartSummary } from './islands/CartSummary';

// Register island components
const islands = {
  AddToCart,
  CartSummary,
};

// Hydrate islands when they become visible
hydrateIslands(islands, {
  strategy: 'visible', // Options: 'idle', 'visible', 'eager'
});

// View Transitions API support
if ('startViewTransition' in document) {
  document.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest('a[href]');
    if (link && link.hasAttribute('data-phil-transition')) {
      e.preventDefault();
      const href = link.getAttribute('href')!;

      // @ts-ignore
      document.startViewTransition(() => {
        window.location.href = href;
      });
    }
  });
}
```

### Creating an Island Component

File: `src/islands/AddToCart.tsx`

```typescript
import { signal } from '@philjs/core';

interface AddToCartProps {
  productId: string;
  inCart: boolean;
}

export function AddToCart({ productId, inCart: initialInCart }: AddToCartProps) {
  const inCart = signal(initialInCart);
  const loading = signal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    loading.set(true);

    const intent = inCart() ? 'remove-from-cart' : 'add-to-cart';

    // Optimistic update
    inCart.set(!inCart());

    try {
      const formData = new FormData();
      formData.append('intent', intent);

      const response = await fetch(`/products/${productId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Rollback on error
        inCart.set(!inCart());
      }
    } catch (error) {
      // Rollback on error
      inCart.set(!inCart());
      console.error('Failed to update cart:', error);
    } finally {
      loading.set(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={loading()}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.125rem',
          background: inCart() ? '#dc3545' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading() ? 'not-allowed' : 'pointer',
          opacity: loading() ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
      >
        {loading() ? 'Updating...' : inCart() ? 'Remove from Cart' : 'Add to Cart'}
      </button>
    </form>
  );
}
```

### Why Islands?

Traditional hydration loads **all** JavaScript for the entire page. Islands only load JavaScript for **interactive components**.

**Benefits:**
- ⚡ **Faster initial load** - Less JavaScript to parse
- 💰 **Lower bandwidth** - Send only what's needed
- ♿ **Progressive enhancement** - Works without JS (forms still submit)
- 🔋 **Better battery** - Less code execution

## Step 4: AI Integration

Integrate AI to generate product summaries.

### AI Adapter

File: `src/ai/summarize.ts`

```typescript
import { createAIAdapter } from '@philjs/ai';

// Create adapter for AI endpoint
const ai = createAIAdapter({
  endpoint: 'http://localhost:8787/api/ai',
  fallback: 'AI service unavailable',
});

export async function summarizeProduct(product: Product): Promise<string> {
  const prompt = `Summarize this product in 2-3 sentences for an e-commerce site:

Product: ${product.title}
Price: $${product.price}
Description: ${product.description}

Write a compelling summary that highlights key features.`;

  try {
    const summary = await ai.complete(prompt, {
      temperature: 0.7,
      maxTokens: 150,
    });

    return summary;
  } catch (error) {
    console.error('AI summarization failed:', error);
    return product.description;
  }
}
```

### Using AI in a Loader

```typescript
import { summarizeProduct } from '../../ai/summarize';

export const loader = defineLoader(async ({ params, db }) => {
  const product = await db.product.get(params.id);

  // Generate AI summary (cached on subsequent visits)
  const aiSummary = await summarizeProduct(product);

  return { product, aiSummary };
});
```

## Step 5: Progressive Web App (PWA)

Make your storefront installable and work offline.

### Service Worker

File: `public/sw.js`

```javascript
const CACHE_NAME = 'philjs-storefront-v1';
const STATIC_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );
});

// Fetch: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache the response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});
```

### PWA Manifest

File: `public/manifest.json`

```json
{
  "name": "PhilJS Storefront",
  "short_name": "Storefront",
  "description": "Fast e-commerce powered by PhilJS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Step 6: Performance Monitoring

Track Core Web Vitals and send to your analytics.

### RUM (Real User Monitoring)

File: `src/entry-client.ts` (add this):

```typescript
import { getCLS, getFID, getLCP } from 'web-vitals';

// Send metrics to your backend
function sendToAnalytics(metric: any) {
  const body = JSON.stringify(metric);

  // Use sendBeacon if available (doesn't block page unload)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/metrics', body);
  } else {
    fetch('/api/metrics', { method: 'POST', body, keepalive: true });
  }
}

// Track Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
```

### Performance Budgets

File: `scripts/check-budgets.ts`

```typescript
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const budgets = {
  'dist/client/assets/index.js': 70 * 1024, // 70 KB
  'dist/client/assets/style.css': 15 * 1024, // 15 KB
};

let failed = false;

for (const [file, budget] of Object.entries(budgets)) {
  try {
    const content = readFileSync(file);
    const gzipped = gzipSync(content);
    const size = gzipped.length;

    if (size > budget) {
      console.error(`❌ ${file}: ${size} bytes (budget: ${budget})`);
      failed = true;
    } else {
      console.log(`✅ ${file}: ${size} bytes (budget: ${budget})`);
    }
  } catch (error) {
    console.error(`❌ ${file}: not found`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
```

Run with:
```bash
pnpm build
pnpm tsx scripts/check-budgets.ts
```

## Step 7: Security

### Content Security Policy (CSP)

```typescript
import { buildCSP } from '@philjs/ssr';

const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://api.github.com'],
  },
});

// In server response:
headers.set('Content-Security-Policy', csp);
```

### Signed Cookies

```typescript
import { createCookie } from '@philjs/ssr';

const sessionCookie = createCookie('session', {
  secrets: [process.env.COOKIE_SECRET],
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
});

// Set cookie
await sessionCookie.serialize({ userId: '123' });

// Read cookie
const session = await sessionCookie.parse(request.headers.get('Cookie'));
```

## Production Deployment

### Build for Production

```bash
pnpm build
```

This creates:
- `dist/client/` - Static assets (JS, CSS, images)
- `dist/server/` - SSR entry point

### Production Server

File: `server/prod.js`

```javascript
import { createServer } from 'http';
import { serveStatic } from './serve-static.js';
import { renderPage } from '../dist/server/entry-server.js';

const server = createServer(async (req, res) => {
  // Serve static assets
  if (req.url.startsWith('/assets/')) {
    return serveStatic(req, res, 'dist/client');
  }

  // SSR for pages
  const html = await renderPage(req.url);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(3000, () => {
  console.log('Production server running at http://localhost:3000');
});
```

### Deployment Platforms

**Vercel:**
```bash
vercel deploy
```

**Netlify:**
```bash
netlify deploy --prod
```

**Cloudflare Workers:**
```bash
wrangler deploy
```

**Docker:**
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
CMD ["node", "server/prod.js"]
EXPOSE 3000
```

## What You Learned

✅ **SSR streaming** - Progressive rendering for instant loads
✅ **Loaders** - Server-side data fetching
✅ **Actions** - Form handling and mutations
✅ **Islands** - Selective hydration for performance
✅ **AI integration** - Enhancing UX with AI
✅ **PWA** - Offline support and installability
✅ **Performance** - Monitoring and budgets
✅ **Security** - CSP, signed cookies, best practices

## Challenges

Extend the storefront:

1. **Search** - Add product search with autocomplete
2. **Filters** - Filter products by category, price, rating
3. **Checkout** - Implement full checkout flow
4. **User accounts** - Sign up, login, order history
5. **Reviews** - Let users rate and review products
6. **Recommendations** - AI-powered product suggestions
7. **Real-time updates** - WebSocket for stock updates
8. **Multi-language** - i18n support
9. **Admin panel** - Manage products and orders
10. **Payment integration** - Stripe, PayPal, etc.

## Next Steps

- **[Advanced: SSR](../advanced/ssr.md)** - Deep dive into server-side rendering
- **[Advanced: Islands](../advanced/islands.md)** - Islands architecture patterns
- **[Data Fetching](../data-fetching/overview.md)** - Loaders, actions, and caching
- **[Performance](../performance/overview.md)** - Optimization techniques

---

**Next:** [Tutorial: Static Blog →](./tutorial-blog-ssg.md)
