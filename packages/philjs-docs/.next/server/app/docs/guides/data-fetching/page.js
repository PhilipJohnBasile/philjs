"use strict";(()=>{var e={};e.id=3778,e.ids=[3778],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},5010:(e,r,t)=>{t.r(r),t.d(r,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>l,routeModule:()=>h,tree:()=>d}),t(8166),t(2108),t(4001),t(1305);var s=t(3545),a=t(5947),i=t(9761),n=t.n(i),o=t(4798),c={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>o[e]);t.d(r,c);let d=["",{children:["docs",{children:["guides",{children:["data-fetching",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,8166)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\data-fetching\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(t.bind(t,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,1305,23)),"next/dist/client/components/not-found-error"]}],l=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\data-fetching\\page.tsx"],u="/docs/guides/data-fetching/page",p={require:t,loadChunk:()=>Promise.resolve()},h=new s.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/docs/guides/data-fetching/page",pathname:"/docs/guides/data-fetching",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},8166:(e,r,t)=>{t.r(r),t.d(r,{default:()=>o,metadata:()=>n});var s=t(9015),a=t(3288),i=t(8951);let n={title:"Data Fetching - PhilJS Guide",description:"Learn how to fetch, cache, and manage async data in PhilJS applications with resources and server functions."};function o(){return(0,s.jsxs)("div",{className:"mdx-content",children:[s.jsx("h1",{children:"Data Fetching"}),s.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS provides powerful primitives for fetching, caching, and managing async data with built-in loading states, error handling, and automatic refetching."}),s.jsx("h2",{id:"resources",children:"Resources"}),s.jsx("p",{children:"Resources are the primary way to handle async data in PhilJS. They automatically track loading and error states, and re-fetch when dependencies change."}),s.jsx(a.dn,{code:`import { createResource, createSignal } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx("h2",{id:"resource-states",children:"Resource States"}),s.jsx("p",{children:"Resources provide detailed state information:"}),s.jsx(a.dn,{code:`const [data, { mutate, refetch }] = createResource(source, fetcher);

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
mutate(newData); // Update data optimistically`,language:"typescript"}),s.jsx("h2",{id:"suspense",children:"Suspense Integration"}),s.jsx("p",{children:"Resources integrate seamlessly with Suspense for declarative loading states:"}),s.jsx(a.dn,{code:`import { Suspense, createResource } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx("h2",{id:"error-boundaries",children:"Error Boundaries"}),s.jsx(a.dn,{code:`import { ErrorBoundary, createResource } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx("h2",{id:"server-functions",children:"Server Functions"}),s.jsx("p",{children:"Server functions allow you to run code on the server and call it from the client:"}),s.jsx(a.dn,{code:`// server/api.ts
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
}`,language:"typescript"}),s.jsx("h2",{id:"caching",children:"Caching Strategies"}),s.jsx(a.dn,{code:`import { createResource, cache } from 'philjs-core';

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
});`,language:"typescript"}),s.jsx("h2",{id:"parallel-fetching",children:"Parallel & Sequential Fetching"}),s.jsx(a.dn,{code:`import { createResource, createSignal } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx("h2",{id:"optimistic-updates",children:"Optimistic Updates"}),s.jsx(a.dn,{code:`import { createResource } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx("h2",{id:"rust-data-fetching",children:"Data Fetching in Rust"}),s.jsx(a.dn,{code:`use philjs::prelude::*;

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
}`,language:"rust"}),s.jsx("h2",{id:"pagination",children:"Pagination"}),s.jsx(a.dn,{code:`import { createResource, createSignal } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx("h2",{id:"infinite-scroll",children:"Infinite Scroll"}),s.jsx(a.dn,{code:`import { createSignal, createResource, onMount } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx("h2",{id:"best-practices",children:"Best Practices"}),(0,s.jsxs)("ul",{children:[(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Use Suspense boundaries:"})," Wrap data-dependent UI for clean loading states"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Implement error boundaries:"})," Handle failures gracefully"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Cache wisely:"})," Balance freshness with performance"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Optimize for waterfalls:"})," Fetch data in parallel when possible"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Use server functions:"})," Keep sensitive logic on the server"]})]}),s.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,s.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,s.jsxs)(i.default,{href:"/docs/guides/state-management",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"State Management"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn about stores and global state"})]}),(0,s.jsxs)(i.default,{href:"/docs/api/core",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"API Reference"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Complete createResource documentation"})]})]})]})}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[732,6314,9332],()=>t(5010));module.exports=s})();