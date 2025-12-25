import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Routing Guide',
  description: 'File-based routing, nested routes, and navigation in PhilJS.',
};

export default function RoutingGuidePage() {
  return (
    <div className="mdx-content">
      <h1>Routing Guide</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS Router provides file-based routing with nested layouts, data loading,
        and type-safe navigation.
      </p>

      <h2 id="installation">Installation</h2>

      <Terminal commands={['npm install philjs-router']} />

      <h2 id="file-based">File-Based Routing</h2>

      <p>
        Routes are defined by the file structure in your <code>routes/</code> directory:
      </p>

      <CodeBlock
        code={`routes/
├── index.tsx          → /
├── about.tsx          → /about
├── blog/
│   ├── index.tsx      → /blog
│   └── [slug].tsx     → /blog/:slug
├── users/
│   ├── index.tsx      → /users
│   ├── [id].tsx       → /users/:id
│   └── [id]/
│       ├── posts.tsx  → /users/:id/posts
│       └── settings.tsx → /users/:id/settings
└── [...all].tsx       → /* (catch-all)`}
        language="text"
        filename="File Structure"
      />

      <h3 id="route-conventions">Route Conventions</h3>

      <table>
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Example</th>
            <th>Matches</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>index.tsx</code></td>
            <td><code>routes/index.tsx</code></td>
            <td><code>/</code></td>
          </tr>
          <tr>
            <td><code>name.tsx</code></td>
            <td><code>routes/about.tsx</code></td>
            <td><code>/about</code></td>
          </tr>
          <tr>
            <td><code>[param].tsx</code></td>
            <td><code>routes/users/[id].tsx</code></td>
            <td><code>/users/123</code></td>
          </tr>
          <tr>
            <td><code>[...rest].tsx</code></td>
            <td><code>routes/docs/[...path].tsx</code></td>
            <td><code>/docs/a/b/c</code></td>
          </tr>
          <tr>
            <td><code>_layout.tsx</code></td>
            <td><code>routes/dashboard/_layout.tsx</code></td>
            <td>Wraps nested routes</td>
          </tr>
          <tr>
            <td><code>_error.tsx</code></td>
            <td><code>routes/_error.tsx</code></td>
            <td>Error boundary</td>
          </tr>
        </tbody>
      </table>

      <h2 id="basic-routing">Basic Routing</h2>

      <CodeBlock
        code={`// routes/index.tsx
export default function Home() {
  return (
    <main>
      <h1>Welcome to PhilJS</h1>
      <p>A modern web framework</p>
    </main>
  );
}

// routes/about.tsx
export default function About() {
  return (
    <main>
      <h1>About Us</h1>
    </main>
  );
}`}
        language="tsx"
        filename="Basic Routes"
      />

      <h2 id="dynamic-routes">Dynamic Routes</h2>

      <CodeBlock
        code={`// routes/users/[id].tsx
import { useParams } from 'philjs-router';

export default function UserPage() {
  const params = useParams<{ id: string }>();

  return (
    <main>
      <h1>User {params.id}</h1>
    </main>
  );
}

// routes/blog/[...slug].tsx - Catch-all route
export default function BlogPost() {
  const params = useParams<{ slug: string[] }>();
  const path = params.slug.join('/');

  return (
    <main>
      <h1>Blog: {path}</h1>
    </main>
  );
}`}
        language="tsx"
        filename="Dynamic Routes"
      />

      <h2 id="layouts">Layouts</h2>

      <p>
        Use <code>_layout.tsx</code> files to wrap child routes with shared UI:
      </p>

      <CodeBlock
        code={`// routes/_layout.tsx - Root layout
import { Outlet } from 'philjs-router';

export default function RootLayout() {
  return (
    <div class="app">
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
      </header>

      <main>
        <Outlet /> {/* Child routes render here */}
      </main>

      <footer>
        <p>&copy; 2024 My App</p>
      </footer>
    </div>
  );
}

// routes/dashboard/_layout.tsx - Nested layout
export default function DashboardLayout() {
  return (
    <div class="dashboard">
      <aside class="sidebar">
        <nav>
          <a href="/dashboard">Overview</a>
          <a href="/dashboard/analytics">Analytics</a>
          <a href="/dashboard/settings">Settings</a>
        </nav>
      </aside>

      <div class="content">
        <Outlet />
      </div>
    </div>
  );
}`}
        language="tsx"
        filename="Layouts"
      />

      <h2 id="navigation">Navigation</h2>

      <h3 id="link-component">Link Component</h3>

      <CodeBlock
        code={`import { A, useNavigate, useLocation } from 'philjs-router';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav>
      {/* Declarative navigation */}
      <A
        href="/"
        class="nav-link"
        activeClass="active"
      >
        Home
      </A>

      <A
        href="/dashboard"
        class="nav-link"
        activeClass="active"
        end={false} // Match child routes too
      >
        Dashboard
      </A>

      {/* Programmatic navigation */}
      <button onClick={() => navigate('/login')}>
        Login
      </button>

      {/* Navigate with state */}
      <button onClick={() => navigate('/checkout', {
        state: { from: location.pathname }
      })}>
        Checkout
      </button>

      {/* Replace history */}
      <button onClick={() => navigate('/new-page', { replace: true })}>
        Replace
      </button>
    </nav>
  );
}`}
        language="tsx"
        filename="Navigation.tsx"
      />

      <h3 id="prefetching">Prefetching</h3>

      <CodeBlock
        code={`import { A } from 'philjs-router';

function ProductList({ products }) {
  return (
    <ul>
      <For each={products}>
        {(product) => (
          <li>
            {/* Prefetch on hover */}
            <A
              href={\`/products/\${product.id}\`}
              prefetch="hover"
            >
              {product.name}
            </A>

            {/* Prefetch when visible */}
            <A
              href={\`/products/\${product.id}\`}
              prefetch="viewport"
            >
              {product.name}
            </A>

            {/* Prefetch intent (hover + focus) */}
            <A
              href={\`/products/\${product.id}\`}
              prefetch="intent"
            >
              {product.name}
            </A>
          </li>
        )}
      </For>
    </ul>
  );
}`}
        language="tsx"
        filename="Prefetching.tsx"
      />

      <h2 id="data-loading">Data Loading</h2>

      <p>
        Load data for routes using loaders:
      </p>

      <CodeBlock
        code={`// routes/users/[id].tsx
import { createRouteLoader, useLoaderData, useParams } from 'philjs-router';

// Loader runs on server (SSR) or before navigation (SPA)
export const loader = createRouteLoader(async ({ params }) => {
  const user = await db.users.find(params.id);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  const posts = await db.posts.findMany({
    where: { authorId: user.id },
    take: 10,
  });

  return { user, posts };
});

export default function UserPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <main>
      <h1>{data.user.name}</h1>
      <p>{data.user.bio}</p>

      <h2>Recent Posts</h2>
      <ul>
        <For each={data.posts}>
          {(post) => (
            <li>
              <A href={\`/blog/\${post.slug}\`}>{post.title}</A>
            </li>
          )}
        </For>
      </ul>
    </main>
  );
}`}
        language="tsx"
        filename="DataLoading.tsx"
      />

      <h3 id="parallel-loading">Parallel Data Loading</h3>

      <CodeBlock
        code={`export const loader = createRouteLoader(async ({ params }) => {
  // Parallel data fetching
  const [user, posts, followers] = await Promise.all([
    db.users.find(params.id),
    db.posts.findMany({ where: { authorId: params.id } }),
    db.followers.count({ where: { followingId: params.id } }),
  ]);

  return { user, posts, followers };
});`}
        language="typescript"
        filename="ParallelLoading.tsx"
      />

      <h2 id="actions">Form Actions</h2>

      <CodeBlock
        code={`// routes/settings.tsx
import { createAction, useActionData, Form } from 'philjs-router';

export const action = createAction(async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get('name');
  const email = formData.get('email');

  // Validate
  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required';
  if (!email) errors.email = 'Email is required';

  if (Object.keys(errors).length) {
    return { errors };
  }

  // Update user
  await db.users.update({
    where: { id: currentUser.id },
    data: { name, email },
  });

  return { success: true };
});

export default function Settings() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      <div>
        <label>Name</label>
        <input name="name" />
        <Show when={actionData?.errors?.name}>
          <span class="error">{actionData.errors.name}</span>
        </Show>
      </div>

      <div>
        <label>Email</label>
        <input name="email" type="email" />
        <Show when={actionData?.errors?.email}>
          <span class="error">{actionData.errors.email}</span>
        </Show>
      </div>

      <Show when={actionData?.success}>
        <div class="success">Settings saved!</div>
      </Show>

      <button type="submit">Save</button>
    </Form>
  );
}`}
        language="tsx"
        filename="FormActions.tsx"
      />

      <h2 id="protected-routes">Protected Routes</h2>

      <CodeBlock
        code={`// routes/dashboard/_layout.tsx
import { createRouteLoader, redirect, Outlet } from 'philjs-router';
import { getSession } from '../lib/auth';

export const loader = createRouteLoader(async ({ request }) => {
  const session = await getSession(request);

  if (!session) {
    // Redirect to login with return URL
    const url = new URL(request.url);
    throw redirect(\`/login?returnTo=\${url.pathname}\`);
  }

  return { user: session.user };
});

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div class="dashboard">
      <header>
        <span>Welcome, {user.name}</span>
        <form method="post" action="/logout">
          <button type="submit">Logout</button>
        </form>
      </header>
      <Outlet />
    </div>
  );
}`}
        language="tsx"
        filename="ProtectedRoutes.tsx"
      />

      <h2 id="route-meta">Route Meta</h2>

      <CodeBlock
        code={`// routes/blog/[slug].tsx
import { createRouteMeta, useRouteMeta } from 'philjs-router';

export const meta = createRouteMeta(({ data }) => {
  return [
    { title: data.post.title },
    { name: 'description', content: data.post.excerpt },
    { property: 'og:title', content: data.post.title },
    { property: 'og:image', content: data.post.image },
  ];
});

export const loader = createRouteLoader(async ({ params }) => {
  const post = await db.posts.findBySlug(params.slug);
  return { post };
});

export default function BlogPost() {
  const { post } = useLoaderData<typeof loader>();

  return (
    <article>
      <h1>{post.title}</h1>
      <div innerHTML={post.content} />
    </article>
  );
}`}
        language="tsx"
        filename="RouteMeta.tsx"
      />

      <h2 id="error-handling">Error Handling</h2>

      <CodeBlock
        code={`// routes/_error.tsx - Global error boundary
export default function ErrorPage({ error }: { error: Error }) {
  return (
    <div class="error-page">
      <h1>Oops!</h1>
      <p>{error.message}</p>
      <a href="/">Go Home</a>
    </div>
  );
}

// routes/users/_error.tsx - Nested error boundary
export default function UserErrorPage({ error }: { error: Error }) {
  if (error.status === 404) {
    return (
      <div>
        <h1>User Not Found</h1>
        <a href="/users">Browse Users</a>
      </div>
    );
  }

  return (
    <div>
      <h1>Error Loading User</h1>
      <p>{error.message}</p>
    </div>
  );
}`}
        language="tsx"
        filename="ErrorHandling.tsx"
      />

      <h2 id="scroll-restoration">Scroll Restoration</h2>

      <CodeBlock
        code={`import { Router, ScrollRestoration } from 'philjs-router';

function App() {
  return (
    <Router>
      {/* Automatically restores scroll position */}
      <ScrollRestoration />

      <Routes />
    </Router>
  );
}

// Manual scroll control
import { useScrollToTop } from 'philjs-router';

function ProductList() {
  const scrollToTop = useScrollToTop();

  return (
    <div>
      {/* ... */}
      <button onClick={() => scrollToTop()}>
        Back to Top
      </button>
    </div>
  );
}`}
        language="tsx"
        filename="ScrollRestoration.tsx"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/api/philjs-router"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Router API</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Complete API reference for the router
          </p>
        </Link>

        <Link
          href="/docs/guides/ssr-hydration"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">SSR Guide</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Server-side rendering with routing
          </p>
        </Link>
      </div>
    </div>
  );
}
