import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Fetching - PhilJS Guide',
  description: 'Learn how to fetch, cache, and manage async data in PhilJS applications with resources and server functions.',
};

export default function DataFetchingPage() {
  return (
    <div className="mdx-content">
      <h1>Data Fetching</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS provides powerful primitives for fetching, caching, and managing async data
        with built-in loading states, error handling, and automatic refetching.
      </p>

      <h2 id="resources">Resources</h2>

      <p>
        Resources are the primary way to handle async data in PhilJS. They automatically
        track loading and error states, and re-fetch when dependencies change.
      </p>

      <CodeBlock
        code={`import { createResource, createSignal } from 'philjs-core';

function UserProfile() {
  const [userId, setUserId] = createSignal(1);

  // Resource automatically refetches when userId changes
  const [user] = createResource(userId, async (id) => {
    const response = await fetch(\`/api/users/\${id}\`);
    return response.json();
  });

  return (
    <div>
      {user.loading && <Spinner />}
      {user.error && <Error message={user.error.message} />}
      {user() && (
        <div>
          <h1>{user().name}</h1>
          <p>{user().email}</p>
        </div>
      )}
    </div>
  );
}`}
        language="typescript"
      />

      <h2 id="resource-states">Resource States</h2>

      <p>Resources provide detailed state information:</p>

      <CodeBlock
        code={`const [data, { mutate, refetch }] = createResource(source, fetcher);

// Accessor - returns the data or undefined
data();

// Loading state
data.loading;    // true while fetching
data.state;      // 'pending' | 'ready' | 'refreshing' | 'errored'

// Error handling
data.error;      // Error object if failed

// Latest value (even during refetch)
data.latest;     // Previous value while refreshing

// Control functions
refetch();       // Force refetch
mutate(newData); // Update data optimistically`}
        language="typescript"
      />

      <h2 id="suspense">Suspense Integration</h2>

      <p>
        Resources integrate seamlessly with Suspense for declarative loading states:
      </p>

      <CodeBlock
        code={`import { Suspense, createResource } from 'philjs-core';

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const [metrics] = createResource(async () => {
    const res = await fetch('/api/metrics');
    return res.json();
  });

  // Component suspends until data is ready
  return (
    <div>
      <MetricsGrid data={metrics()} />
    </div>
  );
}`}
        language="typescript"
      />

      <h2 id="error-boundaries">Error Boundaries</h2>

      <CodeBlock
        code={`import { ErrorBoundary, createResource } from 'philjs-core';

function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <p>Something went wrong: {error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <Suspense fallback={<Loading />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  );
}`}
        language="typescript"
      />

      <h2 id="server-functions">Server Functions</h2>

      <p>
        Server functions allow you to run code on the server and call it from the client:
      </p>

      <CodeBlock
        code={`// server/api.ts
'use server';

import { db } from './db';

export async function getUsers() {
  return db.users.findMany();
}

export async function createUser(data: { name: string; email: string }) {
  return db.users.create({ data });
}

export async function deleteUser(id: string) {
  return db.users.delete({ where: { id } });
}

// client component
import { getUsers, createUser, deleteUser } from './server/api';
import { createResource } from 'philjs-core';

function UserList() {
  const [users, { refetch }] = createResource(getUsers);

  const handleCreate = async () => {
    await createUser({ name: 'New User', email: 'new@example.com' });
    refetch();
  };

  return (
    <div>
      {users()?.map(user => (
        <UserCard key={user.id} user={user} onDelete={deleteUser} />
      ))}
      <button onClick={handleCreate}>Add User</button>
    </div>
  );
}`}
        language="typescript"
      />

      <h2 id="caching">Caching Strategies</h2>

      <CodeBlock
        code={`import { createResource, cache } from 'philjs-core';

// Simple in-memory cache
const cachedFetch = cache(async (id: string) => {
  const res = await fetch(\`/api/items/\${id}\`);
  return res.json();
});

// Use cached function as fetcher
const [item] = createResource(itemId, cachedFetch);

// Configure cache behavior
const cachedWithOptions = cache(fetcher, {
  // Cache key generator
  key: (args) => args.join('-'),
  // Time-to-live in milliseconds
  ttl: 5 * 60 * 1000, // 5 minutes
  // Stale-while-revalidate
  staleWhileRevalidate: true,
  // Maximum cache entries
  maxSize: 100,
});`}
        language="typescript"
      />

      <h2 id="parallel-fetching">Parallel & Sequential Fetching</h2>

      <CodeBlock
        code={`import { createResource, createSignal } from 'philjs-core';

function Dashboard() {
  // Parallel fetching - both start immediately
  const [users] = createResource(fetchUsers);
  const [products] = createResource(fetchProducts);
  const [orders] = createResource(fetchOrders);

  return (
    <Suspense fallback={<Loading />}>
      <UsersWidget data={users()} />
      <ProductsWidget data={products()} />
      <OrdersWidget data={orders()} />
    </Suspense>
  );
}

// Sequential fetching - one depends on another
function UserOrders() {
  const [userId] = createSignal(1);
  const [user] = createResource(userId, fetchUser);

  // Only fetches after user is loaded
  const [orders] = createResource(
    () => user()?.id,
    (id) => id && fetchOrdersForUser(id)
  );

  return (
    <Suspense fallback={<Loading />}>
      <UserInfo user={user()} />
      <OrdersList orders={orders() ?? []} />
    </Suspense>
  );
}`}
        language="typescript"
      />

      <h2 id="optimistic-updates">Optimistic Updates</h2>

      <CodeBlock
        code={`import { createResource } from 'philjs-core';

function TodoList() {
  const [todos, { mutate, refetch }] = createResource(fetchTodos);

  const addTodo = async (text: string) => {
    // Optimistically add the todo
    const optimisticTodo = {
      id: 'temp-' + Date.now(),
      text,
      done: false,
    };
    mutate(prev => [...(prev ?? []), optimisticTodo]);

    try {
      // Actually create on server
      const newTodo = await createTodo(text);
      // Replace optimistic with real
      mutate(prev =>
        prev?.map(t => t.id === optimisticTodo.id ? newTodo : t) ?? []
      );
    } catch (error) {
      // Rollback on error
      mutate(prev => prev?.filter(t => t.id !== optimisticTodo.id) ?? []);
      throw error;
    }
  };

  return (
    <ul>
      {todos()?.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}`}
        language="typescript"
      />

      <h2 id="rust-data-fetching">Data Fetching in Rust</h2>

      <CodeBlock
        code={`use philjs::prelude::*;

#[component]
fn UserProfile() -> Element {
    let user_id = use_signal(|| 1u32);

    let user = use_resource(move || async move {
        let id = user_id();
        reqwest::get(&format!("/api/users/{}", id))
            .await?
            .json::<User>()
            .await
    });

    view! {
        <Suspense fallback=|| view! { <Spinner /> }>
            {move || user.read().map(|u| view! {
                <div>
                    <h1>{u.name}</h1>
                    <p>{u.email}</p>
                </div>
            })}
        </Suspense>
    }
}

// Server function
#[server]
async fn get_users() -> Result<Vec<User>, ServerError> {
    let users = db::users::find_all().await?;
    Ok(users)
}`}
        language="rust"
      />

      <h2 id="pagination">Pagination</h2>

      <CodeBlock
        code={`import { createResource, createSignal } from 'philjs-core';

function PaginatedList() {
  const [page, setPage] = createSignal(1);
  const [pageSize] = createSignal(20);

  const [data] = createResource(
    () => ({ page: page(), pageSize: pageSize() }),
    async ({ page, pageSize }) => {
      const res = await fetch(
        \`/api/items?page=\${page}&pageSize=\${pageSize}\`
      );
      return res.json();
    }
  );

  return (
    <div>
      <Suspense fallback={<TableSkeleton />}>
        <table>
          {data()?.items.map(item => (
            <tr key={item.id}>{/* ... */}</tr>
          ))}
        </table>
      </Suspense>

      <Pagination
        page={page()}
        totalPages={data()?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}`}
        language="typescript"
      />

      <h2 id="infinite-scroll">Infinite Scroll</h2>

      <CodeBlock
        code={`import { createSignal, createResource, onMount } from 'philjs-core';

function InfiniteList() {
  const [items, setItems] = createSignal<Item[]>([]);
  const [cursor, setCursor] = createSignal<string | null>(null);
  const [hasMore, setHasMore] = createSignal(true);

  const [page, { refetch }] = createResource(
    cursor,
    async (cur) => {
      const res = await fetch(
        \`/api/items\${cur ? \`?cursor=\${cur}\` : ''}\`
      );
      return res.json();
    }
  );

  // Append new items when page loads
  createEffect(() => {
    const data = page();
    if (data) {
      setItems(prev => [...prev, ...data.items]);
      setHasMore(data.hasMore);
    }
  });

  const loadMore = () => {
    if (!page.loading && hasMore()) {
      const lastItem = items().at(-1);
      setCursor(lastItem?.id ?? null);
    }
  };

  return (
    <div>
      {items().map(item => (
        <ItemCard key={item.id} item={item} />
      ))}

      {page.loading && <Spinner />}

      {hasMore() && !page.loading && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}`}
        language="typescript"
      />

      <h2 id="best-practices">Best Practices</h2>

      <ul>
        <li>
          <strong>Use Suspense boundaries:</strong> Wrap data-dependent UI for clean loading states
        </li>
        <li>
          <strong>Implement error boundaries:</strong> Handle failures gracefully
        </li>
        <li>
          <strong>Cache wisely:</strong> Balance freshness with performance
        </li>
        <li>
          <strong>Optimize for waterfalls:</strong> Fetch data in parallel when possible
        </li>
        <li>
          <strong>Use server functions:</strong> Keep sensitive logic on the server
        </li>
      </ul>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/guides/state-management"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">State Management</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn about stores and global state
          </p>
        </Link>

        <Link
          href="/docs/api/core"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">API Reference</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Complete createResource documentation
          </p>
        </Link>
      </div>
    </div>
  );
}
