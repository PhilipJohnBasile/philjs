import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SSR & Hydration Guide',
  description: 'Server-side rendering, hydration strategies, and streaming in PhilJS.',
};

export default function SSRHydrationGuidePage() {
  return (
    <div className="mdx-content">
      <h1>SSR & Hydration</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS provides multiple rendering strategies including SSR, streaming,
        islands architecture, and resumability for optimal performance.
      </p>

      <h2 id="rendering-modes">Rendering Modes</h2>

      <table>
        <thead>
          <tr>
            <th>Mode</th>
            <th>Description</th>
            <th>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SPA</strong></td>
            <td>Client-side rendering only</td>
            <td>Dashboards, internal tools</td>
          </tr>
          <tr>
            <td><strong>SSR</strong></td>
            <td>Server renders, client hydrates</td>
            <td>SEO-critical pages, content sites</td>
          </tr>
          <tr>
            <td><strong>SSG</strong></td>
            <td>Pre-rendered at build time</td>
            <td>Blogs, docs, marketing sites</td>
          </tr>
          <tr>
            <td><strong>Islands</strong></td>
            <td>Static shell, interactive islands</td>
            <td>Content-heavy with some interactivity</td>
          </tr>
          <tr>
            <td><strong>Streaming</strong></td>
            <td>Progressive HTML streaming</td>
            <td>Fast TTFB with async data</td>
          </tr>
          <tr>
            <td><strong>Resumable</strong></td>
            <td>No hydration, instant interactivity</td>
            <td>Maximum performance</td>
          </tr>
        </tbody>
      </table>

      <h2 id="basic-ssr">Basic SSR Setup</h2>

      <p>
        Enable SSR by rendering on the server and hydrating on the client:
      </p>

      <CodeBlock
        code={`// server.ts
import { renderToString } from 'philjs-ssr';
import App from './App';

const handler = async (req: Request) => {
  const url = new URL(req.url);

  const html = await renderToString(() => (
    <App url={url.pathname} />
  ));

  return new Response(\`
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div id="app">\${html}</div>
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  \`, {
    headers: { 'Content-Type': 'text/html' },
  });
};`}
        language="typescript"
        filename="server.ts"
      />

      <CodeBlock
        code={`// client.ts
import { hydrate } from 'philjs-core';
import App from './App';

hydrate(
  document.getElementById('app')!,
  () => <App url={window.location.pathname} />
);`}
        language="typescript"
        filename="client.ts"
      />

      <h2 id="streaming">Streaming SSR</h2>

      <p>
        Stream HTML progressively for faster Time to First Byte:
      </p>

      <CodeBlock
        code={`import { renderToStream } from 'philjs-ssr';
import App from './App';

const handler = async (req: Request) => {
  const stream = renderToStream(() => <App />);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html',
      'Transfer-Encoding': 'chunked',
    },
  });
};`}
        language="typescript"
        filename="streaming-server.ts"
      />

      <h3 id="suspense-streaming">Streaming with Suspense</h3>

      <p>
        Combine streaming with Suspense for progressive loading:
      </p>

      <CodeBlock
        code={`import { Suspense, createResource } from 'philjs-core';

function App() {
  return (
    <html>
      <head>
        <title>My App</title>
      </head>
      <body>
        {/* This renders immediately */}
        <Header />

        {/* This streams when data is ready */}
        <Suspense fallback={<ArticleSkeleton />}>
          <ArticleContent />
        </Suspense>

        {/* This also streams when ready */}
        <Suspense fallback={<CommentsSkeleton />}>
          <Comments />
        </Suspense>

        <Footer />
      </body>
    </html>
  );
}

function ArticleContent() {
  // Data fetching inside component
  const [article] = createResource(() => fetchArticle());

  return (
    <article>
      <h1>{article()?.title}</h1>
      <div innerHTML={article()?.content} />
    </article>
  );
}`}
        language="tsx"
        filename="StreamingApp.tsx"
      />

      <Callout type="info" title="How Streaming Works">
        The server sends the shell immediately, then streams in Suspense content
        as it resolves. The client receives chunks progressively and can start
        parsing/rendering before the full response completes.
      </Callout>

      <h2 id="islands">Islands Architecture</h2>

      <p>
        Render a static HTML shell with interactive "islands" that hydrate independently:
      </p>

      <CodeBlock
        code={`import { Island } from 'philjs-ssr';

function ProductPage({ product }: { product: Product }) {
  return (
    <div>
      {/* Static content - no JS */}
      <header>
        <nav>...</nav>
      </header>

      <main>
        <h1>{product.name}</h1>
        <img src={product.image} alt={product.name} />
        <p>{product.description}</p>

        {/* Interactive island - hydrates independently */}
        <Island component={AddToCartButton} props={{ productId: product.id }}>
          <button disabled>Add to Cart</button>
        </Island>

        {/* Another island */}
        <Island component={ProductReviews} props={{ productId: product.id }}>
          <div>Loading reviews...</div>
        </Island>
      </main>

      {/* Static footer */}
      <footer>...</footer>
    </div>
  );
}`}
        language="tsx"
        filename="ProductPage.tsx"
      />

      <CodeBlock
        code={`// AddToCartButton.tsx - Only this code ships to client
import { createSignal } from 'philjs-core';

export function AddToCartButton({ productId }: { productId: string }) {
  const [adding, setAdding] = createSignal(false);
  const [added, setAdded] = createSignal(false);

  const handleAdd = async () => {
    setAdding(true);
    await cart.add(productId);
    setAdding(false);
    setAdded(true);
  };

  return (
    <button onClick={handleAdd} disabled={adding()}>
      {adding() ? 'Adding...' : added() ? 'Added!' : 'Add to Cart'}
    </button>
  );
}`}
        language="tsx"
        filename="AddToCartButton.tsx"
      />

      <h3 id="island-hydration">Island Hydration Strategies</h3>

      <CodeBlock
        code={`// Hydrate on page load (default)
<Island component={Widget} />

// Hydrate when visible in viewport
<Island component={Widget} client:visible />

// Hydrate when browser is idle
<Island component={Widget} client:idle />

// Hydrate on user interaction
<Island component={Widget} client:hover />
<Island component={Widget} client:click />

// Never hydrate (static only)
<Island component={Widget} client:none />

// Hydrate on media query
<Island component={Widget} client:media="(min-width: 768px)" />`}
        language="tsx"
        filename="island-strategies.tsx"
      />

      <h2 id="resumability">Resumability</h2>

      <p>
        PhilJS supports Qwik-style resumability where the application can resume
        execution without re-running initialization code:
      </p>

      <CodeBlock
        code={`import { component$, useSignal, $ } from 'philjs-resumable';

// This component is resumable - no hydration needed
export const Counter = component$(() => {
  const count = useSignal(0);

  // Event handler is lazy-loaded on first interaction
  const increment = $(() => {
    count.value++;
  });

  return (
    <button onClick$={increment}>
      Count: {count.value}
    </button>
  );
});`}
        language="tsx"
        filename="ResumableCounter.tsx"
      />

      <Callout type="info" title="When to Use Resumability">
        Resumability is ideal for content-heavy sites where most users don't interact.
        It provides instant interactivity without downloading or executing component code
        until needed.
      </Callout>

      <h2 id="data-loading">Data Loading</h2>

      <p>
        Load data on the server and pass it to components:
      </p>

      <CodeBlock
        code={`// Using loaders (route-level data)
import { createRouteLoader } from 'philjs-router';

export const loader = createRouteLoader(async ({ params }) => {
  const user = await db.users.find(params.id);
  if (!user) throw new Response('Not Found', { status: 404 });
  return { user };
});

export default function UserPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{data.user.name}</h1>
      <p>{data.user.bio}</p>
    </div>
  );
}`}
        language="tsx"
        filename="UserPage.tsx"
      />

      <h3 id="server-functions">Server Functions</h3>

      <CodeBlock
        code={`// Define server-only functions
'use server';

import { createServerFn } from 'philjs-ssr';

export const getUser = createServerFn(async (id: string) => {
  // This only runs on the server
  const user = await db.users.find(id);
  return user;
});

export const updateUser = createServerFn(async (id: string, data: UserUpdate) => {
  // Validate and update
  await db.users.update(id, data);
  return { success: true };
});

// Use in components - automatically becomes RPC call on client
function UserProfile({ userId }: { userId: string }) {
  const [user] = createResource(() => getUser(userId));

  const handleSave = async (data: UserUpdate) => {
    await updateUser(userId, data);
  };

  return (
    <Show when={user()}>
      {(u) => <ProfileForm user={u} onSave={handleSave} />}
    </Show>
  );
}`}
        language="tsx"
        filename="server-functions.tsx"
      />

      <h2 id="seo">SEO & Meta Tags</h2>

      <CodeBlock
        code={`import { Title, Meta, Link } from 'philjs-ssr';

function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <Title>{product.name} | My Store</Title>
      <Meta name="description" content={product.description} />
      <Meta property="og:title" content={product.name} />
      <Meta property="og:image" content={product.image} />
      <Meta property="og:type" content="product" />
      <Link rel="canonical" href={\`https://mystore.com/products/\${product.slug}\`} />

      {/* Structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: product.image,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "USD",
          },
        })}
      </script>

      <main>
        <h1>{product.name}</h1>
        {/* ... */}
      </main>
    </>
  );
}`}
        language="tsx"
        filename="SEO.tsx"
      />

      <h2 id="caching">Caching Strategies</h2>

      <CodeBlock
        code={`import { renderToString, cache } from 'philjs-ssr';

// Cache full page renders
const cachedRender = cache(
  async (url: string) => {
    return renderToString(() => <App url={url} />);
  },
  {
    maxAge: 60, // seconds
    staleWhileRevalidate: 300,
  }
);

// Cache data fetches
const getCachedProducts = cache(
  async () => db.products.findMany(),
  { maxAge: 300 }
);

// Component-level caching
function ProductList() {
  const [products] = createResource(getCachedProducts);

  return (
    <For each={products()}>
      {(product) => <ProductCard product={product} />}
    </For>
  );
}`}
        language="typescript"
        filename="caching.ts"
      />

      <h2 id="error-handling">Error Handling</h2>

      <CodeBlock
        code={`import { ErrorBoundary } from 'philjs-core';

function App() {
  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <div class="error-page">
          <h1>Something went wrong</h1>
          <p>{err.message}</p>
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    >
      <Router>
        <Route path="/" component={Home} />
        <Route path="/products/:id" component={ProductPage} />
      </Router>
    </ErrorBoundary>
  );
}

// Route-level error handling
export function errorBoundary(error: Error) {
  if (error.status === 404) {
    return <NotFoundPage />;
  }
  return <ErrorPage error={error} />;
}`}
        language="tsx"
        filename="ErrorHandling.tsx"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/guides/deployment"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Deployment</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Deploy your SSR application
          </p>
        </Link>

        <Link
          href="/docs/api/philjs-ssr"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">SSR API Reference</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Complete API for server-side rendering
          </p>
        </Link>
      </div>
    </div>
  );
}
