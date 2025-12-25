"use strict";(()=>{var e={};e.id=1172,e.ids=[1172],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},924:(e,t,r)=>{r.r(t),r.d(t,{GlobalError:()=>n.a,__next_app__:()=>h,originalPathname:()=>u,pages:()=>c,routeModule:()=>p,tree:()=>l}),r(801),r(2108),r(4001),r(1305);var s=r(3545),o=r(5947),a=r(9761),n=r.n(a),i=r(4798),d={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>i[e]);r.d(t,d);let l=["",{children:["docs",{children:["guides",{children:["routing",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,801)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\routing\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\routing\\page.tsx"],u="/docs/guides/routing/page",h={require:r,loadChunk:()=>Promise.resolve()},p=new s.AppPageRouteModule({definition:{kind:o.x.APP_PAGE,page:"/docs/guides/routing/page",pathname:"/docs/guides/routing",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},801:(e,t,r)=>{r.r(t),r.d(t,{default:()=>i,metadata:()=>n});var s=r(9015),o=r(3288),a=r(8951);let n={title:"Routing Guide",description:"File-based routing, nested routes, and navigation in PhilJS."};function i(){return(0,s.jsxs)("div",{className:"mdx-content",children:[s.jsx("h1",{children:"Routing Guide"}),s.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS Router provides file-based routing with nested layouts, data loading, and type-safe navigation."}),s.jsx("h2",{id:"installation",children:"Installation"}),s.jsx(o.oI,{commands:["npm install philjs-router"]}),s.jsx("h2",{id:"file-based",children:"File-Based Routing"}),(0,s.jsxs)("p",{children:["Routes are defined by the file structure in your ",s.jsx("code",{children:"routes/"})," directory:"]}),s.jsx(o.dn,{code:`routes/
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
└── [...all].tsx       → /* (catch-all)`,language:"text",filename:"File Structure"}),s.jsx("h3",{id:"route-conventions",children:"Route Conventions"}),(0,s.jsxs)("table",{children:[s.jsx("thead",{children:(0,s.jsxs)("tr",{children:[s.jsx("th",{children:"Pattern"}),s.jsx("th",{children:"Example"}),s.jsx("th",{children:"Matches"})]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("code",{children:"index.tsx"})}),s.jsx("td",{children:s.jsx("code",{children:"routes/index.tsx"})}),s.jsx("td",{children:s.jsx("code",{children:"/"})})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("code",{children:"name.tsx"})}),s.jsx("td",{children:s.jsx("code",{children:"routes/about.tsx"})}),s.jsx("td",{children:s.jsx("code",{children:"/about"})})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("code",{children:"[param].tsx"})}),s.jsx("td",{children:s.jsx("code",{children:"routes/users/[id].tsx"})}),s.jsx("td",{children:s.jsx("code",{children:"/users/123"})})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("code",{children:"[...rest].tsx"})}),s.jsx("td",{children:s.jsx("code",{children:"routes/docs/[...path].tsx"})}),s.jsx("td",{children:s.jsx("code",{children:"/docs/a/b/c"})})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("code",{children:"_layout.tsx"})}),s.jsx("td",{children:s.jsx("code",{children:"routes/dashboard/_layout.tsx"})}),s.jsx("td",{children:"Wraps nested routes"})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("code",{children:"_error.tsx"})}),s.jsx("td",{children:s.jsx("code",{children:"routes/_error.tsx"})}),s.jsx("td",{children:"Error boundary"})]})]})]}),s.jsx("h2",{id:"basic-routing",children:"Basic Routing"}),s.jsx(o.dn,{code:`// routes/index.tsx
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
}`,language:"tsx",filename:"Basic Routes"}),s.jsx("h2",{id:"dynamic-routes",children:"Dynamic Routes"}),s.jsx(o.dn,{code:`// routes/users/[id].tsx
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
}`,language:"tsx",filename:"Dynamic Routes"}),s.jsx("h2",{id:"layouts",children:"Layouts"}),(0,s.jsxs)("p",{children:["Use ",s.jsx("code",{children:"_layout.tsx"})," files to wrap child routes with shared UI:"]}),s.jsx(o.dn,{code:`// routes/_layout.tsx - Root layout
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
}`,language:"tsx",filename:"Layouts"}),s.jsx("h2",{id:"navigation",children:"Navigation"}),s.jsx("h3",{id:"link-component",children:"Link Component"}),s.jsx(o.dn,{code:`import { A, useNavigate, useLocation } from 'philjs-router';

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
}`,language:"tsx",filename:"Navigation.tsx"}),s.jsx("h3",{id:"prefetching",children:"Prefetching"}),s.jsx(o.dn,{code:`import { A } from 'philjs-router';

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
}`,language:"tsx",filename:"Prefetching.tsx"}),s.jsx("h2",{id:"data-loading",children:"Data Loading"}),s.jsx("p",{children:"Load data for routes using loaders:"}),s.jsx(o.dn,{code:`// routes/users/[id].tsx
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
}`,language:"tsx",filename:"DataLoading.tsx"}),s.jsx("h3",{id:"parallel-loading",children:"Parallel Data Loading"}),s.jsx(o.dn,{code:`export const loader = createRouteLoader(async ({ params }) => {
  // Parallel data fetching
  const [user, posts, followers] = await Promise.all([
    db.users.find(params.id),
    db.posts.findMany({ where: { authorId: params.id } }),
    db.followers.count({ where: { followingId: params.id } }),
  ]);

  return { user, posts, followers };
});`,language:"typescript",filename:"ParallelLoading.tsx"}),s.jsx("h2",{id:"actions",children:"Form Actions"}),s.jsx(o.dn,{code:`// routes/settings.tsx
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
}`,language:"tsx",filename:"FormActions.tsx"}),s.jsx("h2",{id:"protected-routes",children:"Protected Routes"}),s.jsx(o.dn,{code:`// routes/dashboard/_layout.tsx
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
}`,language:"tsx",filename:"ProtectedRoutes.tsx"}),s.jsx("h2",{id:"route-meta",children:"Route Meta"}),s.jsx(o.dn,{code:`// routes/blog/[slug].tsx
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
}`,language:"tsx",filename:"RouteMeta.tsx"}),s.jsx("h2",{id:"error-handling",children:"Error Handling"}),s.jsx(o.dn,{code:`// routes/_error.tsx - Global error boundary
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
}`,language:"tsx",filename:"ErrorHandling.tsx"}),s.jsx("h2",{id:"scroll-restoration",children:"Scroll Restoration"}),s.jsx(o.dn,{code:`import { Router, ScrollRestoration } from 'philjs-router';

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
}`,language:"tsx",filename:"ScrollRestoration.tsx"}),s.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,s.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,s.jsxs)(a.default,{href:"/docs/api/philjs-router",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Router API"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Complete API reference for the router"})]}),(0,s.jsxs)(a.default,{href:"/docs/guides/ssr-hydration",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"SSR Guide"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Server-side rendering with routing"})]})]})]})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[732,6314,3083],()=>r(924));module.exports=s})();