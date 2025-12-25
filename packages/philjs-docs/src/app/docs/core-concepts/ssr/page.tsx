import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Server-Side Rendering - Core Concepts',
  description: 'Master server-side rendering, hydration, and streaming in PhilJS applications.',
};

export default function SSRPage() {
  return (
    <div className="mdx-content">
      <h1>Server-Side Rendering</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS provides powerful SSR capabilities with automatic hydration, streaming, and islands architecture.
      </p>

      <h2 id="why-ssr">Why SSR?</h2>

      <ul>
        <li><strong>SEO:</strong> Search engines can crawl fully-rendered content</li>
        <li><strong>Performance:</strong> Faster initial page load and Time to Interactive</li>
        <li><strong>Accessibility:</strong> Content available without JavaScript</li>
        <li><strong>Social sharing:</strong> Proper meta tags for link previews</li>
      </ul>

      <h2 id="rendering-modes">Rendering Modes</h2>

      <h3>Client-Side Rendering (CSR)</h3>
      <p>Traditional SPA - JavaScript renders everything in the browser</p>

      <h3>Server-Side Rendering (SSR)</h3>
      <p>Server renders HTML, client hydrates for interactivity</p>

      <h3>Static Site Generation (SSG)</h3>
      <p>Pre-render pages at build time</p>

      <h3>Islands Architecture</h3>
      <p>Server-render static content, hydrate only interactive components</p>

      <h2 id="basic-setup">Basic SSR Setup</h2>

      <Terminal commands={[
        'npm create philjs@latest my-ssr-app -- --template ssr',
        'cd my-ssr-app',
        'npm run dev',
      ]} />

      <h3>Entry Points</h3>

      <CodeBlock
        code={`// src/entry-client.tsx
import { hydrate } from 'philjs-core/web';
import App from './App';

hydrate(() => <App />, document.getElementById('app')!);`}
        language="typescript"
        filename="src/entry-client.tsx"
      />

      <CodeBlock
        code={`// src/entry-server.tsx
import { renderToString } from 'philjs-core/web';
import App from './App';

export function render(url: string) {
  const html = renderToString(() => <App url={url} />);
  return { html };
}`}
        language="typescript"
        filename="src/entry-server.tsx"
      />

      <h2 id="data-fetching">Data Fetching</h2>

      <h3>Using createResource</h3>

      <CodeBlock
        code={`import { createResource } from 'philjs-core';

function UserProfile(props: { userId: string }) {
  const [user] = createResource(
    () => props.userId,
    async (id) => {
      const res = await fetch(\`/api/users/\${id}\`);
      return res.json();
    }
  );

  return (
    <Suspense fallback={<Spinner />}>
      <Show when={user()}>
        {(userData) => (
          <div>
            <h1>{userData.name}</h1>
            <p>{userData.email}</p>
          </div>
        )}
      </Show>
    </Suspense>
  );
}`}
        language="typescript"
      />

      <Callout type="info" title="Automatic Serialization">
        Resources automatically serialize data during SSR and hydrate it on the client.
      </Callout>

      <h3>Server-Only Code</h3>

      <CodeBlock
        code={`import { isServer } from 'philjs-core';

function SecureComponent() {
  const [data] = createResource(async () => {
    if (isServer) {
      // This code only runs on the server
      const db = await connectToDatabase();
      return await db.query('SELECT * FROM secrets');
    }
    // Client fetches from API
    return fetch('/api/data').then(r => r.json());
  });

  return <div>{/* render data */}</div>;
}`}
        language="typescript"
      />

      <h2 id="streaming">Streaming SSR</h2>

      <p>
        Stream HTML to the browser as it's generated, improving Time to First Byte:
      </p>

      <CodeBlock
        code={`// server.ts
import { renderToStream } from 'philjs-core/web';
import { App } from './App';

app.get('*', async (req, res) => {
  const stream = renderToStream(() => <App url={req.url} />);

  res.setHeader('Content-Type', 'text/html');

  stream.pipe(res);
});`}
        language="typescript"
        filename="server.ts"
      />

      <h3>Out-of-Order Streaming</h3>

      <CodeBlock
        code={`function App() {
  return (
    <html>
      <head>
        <title>My App</title>
      </head>
      <body>
        <header>
          <h1>Welcome</h1>
        </header>

        {/* This content streams first */}
        <main>
          <p>Static content loads immediately</p>

          {/* This suspends and streams later */}
          <Suspense fallback={<Skeleton />}>
            <AsyncContent />
          </Suspense>
        </main>

        <footer>
          <p>Footer content</p>
        </footer>
      </body>
    </html>
  );
}`}
        language="typescript"
      />

      <h2 id="islands">Islands Architecture</h2>

      <p>
        Render static HTML and only hydrate interactive components:
      </p>

      <CodeBlock
        code={`import { island } from 'philjs-core/web';

// Mark component as an island
const Counter = island(() => {
  const [count, setCount] = createSignal(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count()}
    </button>
  );
});

function Page() {
  return (
    <div>
      {/* Static content - no JavaScript */}
      <h1>Welcome to my site</h1>
      <p>This is static content</p>

      {/* Interactive island - includes JavaScript */}
      <Counter />

      {/* More static content */}
      <footer>Copyright 2024</footer>
    </div>
  );
}`}
        language="typescript"
      />

      <Callout type="success" title="Performance Benefits">
        Islands reduce JavaScript bundle size by 80-90% compared to full hydration!
      </Callout>

      <h2 id="meta-tags">Meta Tags & SEO</h2>

      <CodeBlock
        code={`import { Meta, Title, Link } from 'philjs-core/web';

function BlogPost(props: { post: Post }) {
  return (
    <>
      <Title>{props.post.title} - My Blog</Title>
      <Meta name="description" content={props.post.excerpt} />
      <Meta property="og:title" content={props.post.title} />
      <Meta property="og:description" content={props.post.excerpt} />
      <Meta property="og:image" content={props.post.imageUrl} />
      <Meta name="twitter:card" content="summary_large_image" />
      <Link rel="canonical" href={\`https://myblog.com/posts/\${props.post.slug}\`} />

      <article>
        <h1>{props.post.title}</h1>
        <div innerHTML={props.post.content} />
      </article>
    </>
  );
}`}
        language="typescript"
      />

      <h2 id="routing">SSR with Routing</h2>

      <CodeBlock
        code={`import { Router, Route } from 'philjs-router';

function App(props: { url: string }) {
  return (
    <Router url={props.url}>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/users/:id" component={UserProfile} />
      <Route path="*" component={NotFound} />
    </Router>
  );
}

// Server
import { renderToString } from 'philjs-core/web';

app.get('*', (req, res) => {
  const html = renderToString(() => <App url={req.url} />);

  res.send(\`
    <!DOCTYPE html>
    <html>
      <head>
        <title>My App</title>
        <script type="module" src="/src/entry-client.tsx"></script>
      </head>
      <body>
        <div id="app">\${html}</div>
      </body>
    </html>
  \`);
});`}
        language="typescript"
      />

      <h2 id="hydration">Hydration</h2>

      <p>
        PhilJS automatically matches server-rendered HTML with client-side components:
      </p>

      <CodeBlock
        code={`// Client entry
import { hydrate } from 'philjs-core/web';
import App from './App';

// Hydrate the server-rendered content
hydrate(
  () => <App />,
  document.getElementById('app')!
);`}
        language="typescript"
      />

      <h3>Progressive Hydration</h3>

      <CodeBlock
        code={`import { lazy } from 'philjs-core';

// Component only hydrates when it comes into view
const HeavyComponent = lazy(() => import('./HeavyComponent'), {
  ssr: true,
  hydrate: 'visible', // Options: 'visible', 'idle', 'interaction'
});

function App() {
  return (
    <div>
      <Header />
      <Suspense>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}`}
        language="typescript"
      />

      <h2 id="caching">Caching Strategies</h2>

      <h3>Component-Level Caching</h3>

      <CodeBlock
        code={`import { createAsync, cache } from 'philjs-core';

// Cache function results
const getUser = cache(async (id: string) => {
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json();
}, 'users');

function UserProfile(props: { id: string }) {
  const user = createAsync(() => getUser(props.id));

  return (
    <Show when={user()}>
      {(userData) => <div>{userData.name}</div>}
    </Show>
  );
}`}
        language="typescript"
      />

      <h3>Page-Level Caching</h3>

      <CodeBlock
        code={`// server.ts
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

app.get('*', (req, res) => {
  const cacheKey = req.url;
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.send(cached);
  }

  const html = renderToString(() => <App url={req.url} />);
  cache.set(cacheKey, html);

  res.send(html);
});`}
        language="typescript"
      />

      <h2 id="static-generation">Static Site Generation</h2>

      <CodeBlock
        code={`// build.ts
import { renderToString } from 'philjs-core/web';
import { writeFileSync, mkdirSync } from 'fs';
import { routes } from './routes';

for (const route of routes) {
  const html = renderToString(() => <App url={route.path} />);

  const filePath = \`dist\${route.path}/index.html\`;
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, html);
}

console.log('Static site generated!');`}
        language="typescript"
        filename="build.ts"
      />

      <Terminal commands={[
        'ts-node build.ts',
        'npx serve dist',
      ]} />

      <h2 id="deployment">Deployment</h2>

      <h3>Node.js Server</h3>

      <CodeBlock
        code={`import express from 'express';
import { renderToString } from 'philjs-core/web';
import { App } from './App';

const app = express();

app.use(express.static('dist/client'));

app.get('*', (req, res) => {
  const html = renderToString(() => <App url={req.url} />);

  res.send(\`
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="/assets/style.css">
      </head>
      <body>
        <div id="app">\${html}</div>
        <script type="module" src="/assets/client.js"></script>
      </body>
    </html>
  \`);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`}
        language="typescript"
        filename="server.ts"
      />

      <h3>Serverless (Vercel/Netlify)</h3>

      <CodeBlock
        code={`// api/render.ts
import { renderToString } from 'philjs-core/web';
import { App } from '../src/App';

export default function handler(req, res) {
  const html = renderToString(() => <App url={req.url} />);

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}`}
        language="typescript"
      />

      <h2 id="best-practices">Best Practices</h2>

      <ol>
        <li><strong>Use Suspense boundaries:</strong> Prevent entire page from waiting</li>
        <li><strong>Implement streaming:</strong> Improve perceived performance</li>
        <li><strong>Cache aggressively:</strong> Reduce server load</li>
        <li><strong>Use islands for interactive parts:</strong> Minimize JavaScript</li>
        <li><strong>Optimize images and assets:</strong> Use CDN when possible</li>
        <li><strong>Monitor performance:</strong> Track Time to First Byte, FCP, LCP</li>
      </ol>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/api/ssr"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">SSR API Reference</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Complete SSR API documentation
          </p>
        </Link>

        <Link
          href="/docs/guides/deployment"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Deployment Guide</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Deploy PhilJS apps to production
          </p>
        </Link>
      </div>
    </div>
  );
}
