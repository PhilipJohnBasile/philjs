(()=>{var e={};e.id=9895,e.ids=[9895],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},4769:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>a.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>l,routeModule:()=>h,tree:()=>c}),r(3054),r(2108),r(4001),r(1305);var s=r(3545),i=r(5947),n=r(9761),a=r.n(n),o=r(4798),d={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>o[e]);r.d(t,d);let c=["",{children:["docs",{children:["guides",{children:["ssr-hydration",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,3054)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\ssr-hydration\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],l=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\ssr-hydration\\page.tsx"],p="/docs/guides/ssr-hydration/page",u={require:r,loadChunk:()=>Promise.resolve()},h=new s.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/guides/ssr-hydration/page",pathname:"/docs/guides/ssr-hydration",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},7656:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,5505,23)),Promise.resolve().then(r.bind(r,2015)),Promise.resolve().then(r.bind(r,306))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>l,docsNavigation:()=>c});var s=r(6741),i=r(8972),n=r(47),a=r(7678),o=r(3178),d=r(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function l({sections:e}){let t=(0,n.usePathname)(),[r,c]=(0,d.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),l=e=>{c(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return s.jsx("nav",{className:"w-64 flex-shrink-0",children:s.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:s.jsx("ul",{className:"space-y-6",children:e.map(e=>{let n=r.has(e.title),d=e.links.some(e=>t===e.href);return(0,s.jsxs)("li",{children:[(0,s.jsxs)("button",{onClick:()=>l(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,s.jsx(o.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",n&&"rotate-90")})]}),(n||d)&&s.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return s.jsx("li",{children:s.jsx(i.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,r)=>{"use strict";r.d(t,{default:()=>i.a});var s=r(7654),i=r.n(s)},7654:(e,t,r)=>{"use strict";let{createProxy:s}=r(1471);e.exports=s("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},3054:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>d,metadata:()=>o});var s=r(9015),i=r(3288),n=r(7309),a=r(8951);let o={title:"SSR & Hydration Guide",description:"Server-side rendering, hydration strategies, and streaming in PhilJS."};function d(){return(0,s.jsxs)("div",{className:"mdx-content",children:[s.jsx("h1",{children:"SSR & Hydration"}),s.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS provides multiple rendering strategies including SSR, streaming, islands architecture, and resumability for optimal performance."}),s.jsx("h2",{id:"rendering-modes",children:"Rendering Modes"}),(0,s.jsxs)("table",{children:[s.jsx("thead",{children:(0,s.jsxs)("tr",{children:[s.jsx("th",{children:"Mode"}),s.jsx("th",{children:"Description"}),s.jsx("th",{children:"Use Case"})]})}),(0,s.jsxs)("tbody",{children:[(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("strong",{children:"SPA"})}),s.jsx("td",{children:"Client-side rendering only"}),s.jsx("td",{children:"Dashboards, internal tools"})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("strong",{children:"SSR"})}),s.jsx("td",{children:"Server renders, client hydrates"}),s.jsx("td",{children:"SEO-critical pages, content sites"})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("strong",{children:"SSG"})}),s.jsx("td",{children:"Pre-rendered at build time"}),s.jsx("td",{children:"Blogs, docs, marketing sites"})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("strong",{children:"Islands"})}),s.jsx("td",{children:"Static shell, interactive islands"}),s.jsx("td",{children:"Content-heavy with some interactivity"})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("strong",{children:"Streaming"})}),s.jsx("td",{children:"Progressive HTML streaming"}),s.jsx("td",{children:"Fast TTFB with async data"})]}),(0,s.jsxs)("tr",{children:[s.jsx("td",{children:s.jsx("strong",{children:"Resumable"})}),s.jsx("td",{children:"No hydration, instant interactivity"}),s.jsx("td",{children:"Maximum performance"})]})]})]}),s.jsx("h2",{id:"basic-ssr",children:"Basic SSR Setup"}),s.jsx("p",{children:"Enable SSR by rendering on the server and hydrating on the client:"}),s.jsx(i.dn,{code:`// server.ts
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
};`,language:"typescript",filename:"server.ts"}),s.jsx(i.dn,{code:`// client.ts
import { hydrate } from 'philjs-core';
import App from './App';

hydrate(
  document.getElementById('app')!,
  () => <App url={window.location.pathname} />
);`,language:"typescript",filename:"client.ts"}),s.jsx("h2",{id:"streaming",children:"Streaming SSR"}),s.jsx("p",{children:"Stream HTML progressively for faster Time to First Byte:"}),s.jsx(i.dn,{code:`import { renderToStream } from 'philjs-ssr';
import App from './App';

const handler = async (req: Request) => {
  const stream = renderToStream(() => <App />);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html',
      'Transfer-Encoding': 'chunked',
    },
  });
};`,language:"typescript",filename:"streaming-server.ts"}),s.jsx("h3",{id:"suspense-streaming",children:"Streaming with Suspense"}),s.jsx("p",{children:"Combine streaming with Suspense for progressive loading:"}),s.jsx(i.dn,{code:`import { Suspense, createResource } from 'philjs-core';

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
}`,language:"tsx",filename:"StreamingApp.tsx"}),s.jsx(n.U,{type:"info",title:"How Streaming Works",children:"The server sends the shell immediately, then streams in Suspense content as it resolves. The client receives chunks progressively and can start parsing/rendering before the full response completes."}),s.jsx("h2",{id:"islands",children:"Islands Architecture"}),s.jsx("p",{children:'Render a static HTML shell with interactive "islands" that hydrate independently:'}),s.jsx(i.dn,{code:`import { Island } from 'philjs-ssr';

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
}`,language:"tsx",filename:"ProductPage.tsx"}),s.jsx(i.dn,{code:`// AddToCartButton.tsx - Only this code ships to client
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
}`,language:"tsx",filename:"AddToCartButton.tsx"}),s.jsx("h3",{id:"island-hydration",children:"Island Hydration Strategies"}),s.jsx(i.dn,{code:`// Hydrate on page load (default)
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
<Island component={Widget} client:media="(min-width: 768px)" />`,language:"tsx",filename:"island-strategies.tsx"}),s.jsx("h2",{id:"resumability",children:"Resumability"}),s.jsx("p",{children:"PhilJS supports Qwik-style resumability where the application can resume execution without re-running initialization code:"}),s.jsx(i.dn,{code:`import { component$, useSignal, $ } from 'philjs-resumable';

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
});`,language:"tsx",filename:"ResumableCounter.tsx"}),s.jsx(n.U,{type:"info",title:"When to Use Resumability",children:"Resumability is ideal for content-heavy sites where most users don't interact. It provides instant interactivity without downloading or executing component code until needed."}),s.jsx("h2",{id:"data-loading",children:"Data Loading"}),s.jsx("p",{children:"Load data on the server and pass it to components:"}),s.jsx(i.dn,{code:`// Using loaders (route-level data)
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
}`,language:"tsx",filename:"UserPage.tsx"}),s.jsx("h3",{id:"server-functions",children:"Server Functions"}),s.jsx(i.dn,{code:`// Define server-only functions
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
}`,language:"tsx",filename:"server-functions.tsx"}),s.jsx("h2",{id:"seo",children:"SEO & Meta Tags"}),s.jsx(i.dn,{code:`import { Title, Meta, Link } from 'philjs-ssr';

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
}`,language:"tsx",filename:"SEO.tsx"}),s.jsx("h2",{id:"caching",children:"Caching Strategies"}),s.jsx(i.dn,{code:`import { renderToString, cache } from 'philjs-ssr';

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
}`,language:"typescript",filename:"caching.ts"}),s.jsx("h2",{id:"error-handling",children:"Error Handling"}),s.jsx(i.dn,{code:`import { ErrorBoundary } from 'philjs-core';

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
}`,language:"tsx",filename:"ErrorHandling.tsx"}),s.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,s.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,s.jsxs)(a.default,{href:"/docs/guides/deployment",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Deployment"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Deploy your SSR application"})]}),(0,s.jsxs)(a.default,{href:"/docs/api/philjs-ssr",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"SSR API Reference"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Complete API for server-side rendering"})]})]})]})}},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>o});var s=r(9015),i=r(1471);let n=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function o({children:e}){return s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,s.jsxs)("div",{className:"flex gap-12",children:[s.jsx(a,{sections:n}),s.jsx("main",{className:"flex-1 min-w-0",children:s.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,r)=>{"use strict";r.d(t,{dn:()=>i,oI:()=>n});var s=r(1471);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let n=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[732,6314,9858],()=>r(4769));module.exports=s})();