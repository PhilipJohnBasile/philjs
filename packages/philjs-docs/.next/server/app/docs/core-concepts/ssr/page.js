(()=>{var e={};e.id=2684,e.ids=[2684],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},5432:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>h,originalPathname:()=>p,pages:()=>d,routeModule:()=>u,tree:()=>l}),r(872),r(2108),r(4001),r(1305);var s=r(3545),i=r(5947),n=r(9761),o=r.n(n),a=r(4798),c={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>a[e]);r.d(t,c);let l=["",{children:["docs",{children:["core-concepts",{children:["ssr",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,872)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\core-concepts\\ssr\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\core-concepts\\ssr\\page.tsx"],p="/docs/core-concepts/ssr/page",h={require:r,loadChunk:()=>Promise.resolve()},u=new s.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/core-concepts/ssr/page",pathname:"/docs/core-concepts/ssr",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},4357:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,5505,23)),Promise.resolve().then(r.bind(r,2015)),Promise.resolve().then(r.bind(r,306))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>d,docsNavigation:()=>l});var s=r(6741),i=r(8972),n=r(47),o=r(7678),a=r(3178),c=r(5280);let l=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,n.usePathname)(),[r,l]=(0,c.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),d=e=>{l(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return s.jsx("nav",{className:"w-64 flex-shrink-0",children:s.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:s.jsx("ul",{className:"space-y-6",children:e.map(e=>{let n=r.has(e.title),c=e.links.some(e=>t===e.href);return(0,s.jsxs)("li",{children:[(0,s.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,s.jsx(a.Z,{className:(0,o.Z)("w-4 h-4 transition-transform",n&&"rotate-90")})]}),(n||c)&&s.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return s.jsx("li",{children:s.jsx(i.default,{href:e.href,className:(0,o.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,r)=>{"use strict";r.d(t,{default:()=>i.a});var s=r(7654),i=r.n(s)},7654:(e,t,r)=>{"use strict";let{createProxy:s}=r(1471);e.exports=s("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},872:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>c,metadata:()=>a});var s=r(9015),i=r(3288),n=r(7309),o=r(8951);let a={title:"Server-Side Rendering - Core Concepts",description:"Master server-side rendering, hydration, and streaming in PhilJS applications."};function c(){return(0,s.jsxs)("div",{className:"mdx-content",children:[s.jsx("h1",{children:"Server-Side Rendering"}),s.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS provides powerful SSR capabilities with automatic hydration, streaming, and islands architecture."}),s.jsx("h2",{id:"why-ssr",children:"Why SSR?"}),(0,s.jsxs)("ul",{children:[(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"SEO:"})," Search engines can crawl fully-rendered content"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Performance:"})," Faster initial page load and Time to Interactive"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Accessibility:"})," Content available without JavaScript"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Social sharing:"})," Proper meta tags for link previews"]})]}),s.jsx("h2",{id:"rendering-modes",children:"Rendering Modes"}),s.jsx("h3",{children:"Client-Side Rendering (CSR)"}),s.jsx("p",{children:"Traditional SPA - JavaScript renders everything in the browser"}),s.jsx("h3",{children:"Server-Side Rendering (SSR)"}),s.jsx("p",{children:"Server renders HTML, client hydrates for interactivity"}),s.jsx("h3",{children:"Static Site Generation (SSG)"}),s.jsx("p",{children:"Pre-render pages at build time"}),s.jsx("h3",{children:"Islands Architecture"}),s.jsx("p",{children:"Server-render static content, hydrate only interactive components"}),s.jsx("h2",{id:"basic-setup",children:"Basic SSR Setup"}),s.jsx(i.oI,{commands:["npm create philjs@latest my-ssr-app -- --template ssr","cd my-ssr-app","npm run dev"]}),s.jsx("h3",{children:"Entry Points"}),s.jsx(i.dn,{code:`// src/entry-client.tsx
import { hydrate } from 'philjs-core/web';
import App from './App';

hydrate(() => <App />, document.getElementById('app')!);`,language:"typescript",filename:"src/entry-client.tsx"}),s.jsx(i.dn,{code:`// src/entry-server.tsx
import { renderToString } from 'philjs-core/web';
import App from './App';

export function render(url: string) {
  const html = renderToString(() => <App url={url} />);
  return { html };
}`,language:"typescript",filename:"src/entry-server.tsx"}),s.jsx("h2",{id:"data-fetching",children:"Data Fetching"}),s.jsx("h3",{children:"Using createResource"}),s.jsx(i.dn,{code:`import { createResource } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx(n.U,{type:"info",title:"Automatic Serialization",children:"Resources automatically serialize data during SSR and hydrate it on the client."}),s.jsx("h3",{children:"Server-Only Code"}),s.jsx(i.dn,{code:`import { isServer } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx("h2",{id:"streaming",children:"Streaming SSR"}),s.jsx("p",{children:"Stream HTML to the browser as it's generated, improving Time to First Byte:"}),s.jsx(i.dn,{code:`// server.ts
import { renderToStream } from 'philjs-core/web';
import { App } from './App';

app.get('*', async (req, res) => {
  const stream = renderToStream(() => <App url={req.url} />);

  res.setHeader('Content-Type', 'text/html');

  stream.pipe(res);
});`,language:"typescript",filename:"server.ts"}),s.jsx("h3",{children:"Out-of-Order Streaming"}),s.jsx(i.dn,{code:`function App() {
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
}`,language:"typescript"}),s.jsx("h2",{id:"islands",children:"Islands Architecture"}),s.jsx("p",{children:"Render static HTML and only hydrate interactive components:"}),s.jsx(i.dn,{code:`import { island } from 'philjs-core/web';

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
}`,language:"typescript"}),s.jsx(n.U,{type:"success",title:"Performance Benefits",children:"Islands reduce JavaScript bundle size by 80-90% compared to full hydration!"}),s.jsx("h2",{id:"meta-tags",children:"Meta Tags & SEO"}),s.jsx(i.dn,{code:`import { Meta, Title, Link } from 'philjs-core/web';

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
}`,language:"typescript"}),s.jsx("h2",{id:"routing",children:"SSR with Routing"}),s.jsx(i.dn,{code:`import { Router, Route } from 'philjs-router';

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
});`,language:"typescript"}),s.jsx("h2",{id:"hydration",children:"Hydration"}),s.jsx("p",{children:"PhilJS automatically matches server-rendered HTML with client-side components:"}),s.jsx(i.dn,{code:`// Client entry
import { hydrate } from 'philjs-core/web';
import App from './App';

// Hydrate the server-rendered content
hydrate(
  () => <App />,
  document.getElementById('app')!
);`,language:"typescript"}),s.jsx("h3",{children:"Progressive Hydration"}),s.jsx(i.dn,{code:`import { lazy } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx("h2",{id:"caching",children:"Caching Strategies"}),s.jsx("h3",{children:"Component-Level Caching"}),s.jsx(i.dn,{code:`import { createAsync, cache } from 'philjs-core';

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
}`,language:"typescript"}),s.jsx("h3",{children:"Page-Level Caching"}),s.jsx(i.dn,{code:`// server.ts
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
});`,language:"typescript"}),s.jsx("h2",{id:"static-generation",children:"Static Site Generation"}),s.jsx(i.dn,{code:`// build.ts
import { renderToString } from 'philjs-core/web';
import { writeFileSync, mkdirSync } from 'fs';
import { routes } from './routes';

for (const route of routes) {
  const html = renderToString(() => <App url={route.path} />);

  const filePath = \`dist\${route.path}/index.html\`;
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, html);
}

console.log('Static site generated!');`,language:"typescript",filename:"build.ts"}),s.jsx(i.oI,{commands:["ts-node build.ts","npx serve dist"]}),s.jsx("h2",{id:"deployment",children:"Deployment"}),s.jsx("h3",{children:"Node.js Server"}),s.jsx(i.dn,{code:`import express from 'express';
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
});`,language:"typescript",filename:"server.ts"}),s.jsx("h3",{children:"Serverless (Vercel/Netlify)"}),s.jsx(i.dn,{code:`// api/render.ts
import { renderToString } from 'philjs-core/web';
import { App } from '../src/App';

export default function handler(req, res) {
  const html = renderToString(() => <App url={req.url} />);

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}`,language:"typescript"}),s.jsx("h2",{id:"best-practices",children:"Best Practices"}),(0,s.jsxs)("ol",{children:[(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Use Suspense boundaries:"})," Prevent entire page from waiting"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Implement streaming:"})," Improve perceived performance"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Cache aggressively:"})," Reduce server load"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Use islands for interactive parts:"})," Minimize JavaScript"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Optimize images and assets:"})," Use CDN when possible"]}),(0,s.jsxs)("li",{children:[s.jsx("strong",{children:"Monitor performance:"})," Track Time to First Byte, FCP, LCP"]})]}),s.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,s.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,s.jsxs)(o.default,{href:"/docs/api/ssr",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"SSR API Reference"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Complete SSR API documentation"})]}),(0,s.jsxs)(o.default,{href:"/docs/guides/deployment",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Deployment Guide"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Deploy PhilJS apps to production"})]})]})]})}},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>a});var s=r(9015),i=r(1471);let n=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function a({children:e}){return s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,s.jsxs)("div",{className:"flex gap-12",children:[s.jsx(o,{sections:n}),s.jsx("main",{className:"flex-1 min-w-0",children:s.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,r)=>{"use strict";r.d(t,{dn:()=>i,oI:()=>n});var s=r(1471);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let n=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[732,6314,9858],()=>r(5432));module.exports=s})();