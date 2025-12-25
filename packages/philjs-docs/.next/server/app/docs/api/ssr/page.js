(()=>{var e={};e.id=4829,e.ids=[4829],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},5152:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>u,originalPathname:()=>d,pages:()=>l,routeModule:()=>m,tree:()=>c}),r(3130),r(2108),r(4001),r(1305);var s=r(3545),n=r(5947),i=r(9761),o=r.n(i),a=r(4798),p={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(p[e]=()=>a[e]);r.d(t,p);let c=["",{children:["docs",{children:["api",{children:["ssr",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,3130)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\api\\ssr\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],l=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\api\\ssr\\page.tsx"],d="/docs/api/ssr/page",u={require:r,loadChunk:()=>Promise.resolve()},m=new s.AppPageRouteModule({definition:{kind:n.x.APP_PAGE,page:"/docs/api/ssr/page",pathname:"/docs/api/ssr",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},5356:(e,t,r)=>{Promise.resolve().then(r.bind(r,2015))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>l,docsNavigation:()=>c});var s=r(6741),n=r(8972),i=r(47),o=r(7678),a=r(3178),p=r(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function l({sections:e}){let t=(0,i.usePathname)(),[r,c]=(0,p.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),l=e=>{c(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return s.jsx("nav",{className:"w-64 flex-shrink-0",children:s.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:s.jsx("ul",{className:"space-y-6",children:e.map(e=>{let i=r.has(e.title),p=e.links.some(e=>t===e.href);return(0,s.jsxs)("li",{children:[(0,s.jsxs)("button",{onClick:()=>l(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,s.jsx(a.Z,{className:(0,o.Z)("w-4 h-4 transition-transform",i&&"rotate-90")})]}),(i||p)&&s.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return s.jsx("li",{children:s.jsx(n.default,{href:e.href,className:(0,o.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},3130:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>o,metadata:()=>i});var s=r(9015),n=r(7309);let i={title:"philjs-ssr API Reference",description:"Complete API documentation for philjs-ssr - server-side rendering, streaming, and hydration."};function o(){return s.jsx(n.q,{title:"philjs-ssr",description:"Server-side rendering utilities for PhilJS applications.",sourceLink:"https://github.com/philjs/philjs/tree/main/packages/philjs-ssr",methods:[{name:"renderToString",signature:"function renderToString(fn: () => JSX.Element, options?: RenderOptions): string",description:"Synchronously renders a component tree to an HTML string.",parameters:[{name:"fn",type:"() => JSX.Element",description:"Function that returns the component to render"},{name:"options",type:"RenderOptions",description:"Rendering options",optional:!0}],returns:{type:"string",description:"HTML string of the rendered component"},example:`import { renderToString } from 'philjs-ssr';
import { App } from './App';

const html = renderToString(() => <App />);

console.log(html); // '<div>...</div>'`,since:"1.0.0"},{name:"renderToStream",signature:"function renderToStream(fn: () => JSX.Element, options?: RenderOptions): ReadableStream",description:"Renders a component tree to a readable stream for progressive rendering.",parameters:[{name:"fn",type:"() => JSX.Element",description:"Function that returns the component to render"},{name:"options",type:"RenderOptions",description:"Rendering options",optional:!0}],returns:{type:"ReadableStream",description:"Stream of HTML chunks"},example:`import { renderToStream } from 'philjs-ssr';
import { App } from './App';

app.get('*', (req, res) => {
  const stream = renderToStream(() => <App url={req.url} />);

  res.setHeader('Content-Type', 'text/html');
  stream.pipeTo(res);
});`,since:"1.0.0"},{name:"hydrate",signature:"function hydrate(fn: () => JSX.Element, node: Element): () => void",description:"Hydrates a server-rendered component tree, making it interactive.",parameters:[{name:"fn",type:"() => JSX.Element",description:"Function that returns the component to hydrate"},{name:"node",type:"Element",description:"DOM node containing server-rendered HTML"}],returns:{type:"() => void",description:"Disposal function"},example:`import { hydrate } from 'philjs-ssr';
import { App } from './App';

hydrate(
  () => <App />,
  document.getElementById('app')!
);`,since:"1.0.0"},{name:"Suspense",signature:"function Suspense(props: SuspenseProps): JSX.Element",description:"Wraps async components and shows fallback content while loading.",parameters:[{name:"props.fallback",type:"JSX.Element",description:"Content to show while children are suspending"},{name:"props.children",type:"JSX.Element",description:"Components that may suspend"}],example:`<Suspense fallback={<Spinner />}>
  <AsyncUserProfile userId={userId()} />
</Suspense>

// With multiple boundaries
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<ContentSkeleton />}>
    <MainContent />
  </Suspense>
  <Footer />
</Suspense>`,since:"1.0.0"},{name:"Title",signature:"function Title(props: { children: string }): JSX.Element",description:"Sets the document title. Works with SSR.",parameters:[{name:"props.children",type:"string",description:"The page title"}],example:`function BlogPost(props: { post: Post }) {
  return (
    <>
      <Title>{props.post.title} - My Blog</Title>
      <article>{/* content */}</article>
    </>
  );
}`,since:"1.0.0"},{name:"Meta",signature:"function Meta(props: MetaProps): JSX.Element",description:"Adds meta tags to the document head. Works with SSR.",parameters:[{name:"props",type:"MetaProps",description:"Meta tag attributes"}],example:`<Meta name="description" content="Learn PhilJS" />
<Meta property="og:title" content="PhilJS Tutorial" />
<Meta property="og:image" content="/og-image.png" />
<Meta name="twitter:card" content="summary_large_image" />`,since:"1.0.0"},{name:"Link",signature:"function Link(props: LinkProps): JSX.Element",description:"Adds link tags to the document head. Works with SSR.",parameters:[{name:"props",type:"LinkProps",description:"Link tag attributes"}],example:`<Link rel="canonical" href="https://example.com/page" />
<Link rel="stylesheet" href="/styles.css" />
<Link rel="icon" type="image/png" href="/favicon.png" />`,since:"1.0.0"},{name:"isServer",signature:"const isServer: boolean",description:"Boolean indicating if code is running on the server.",example:`import { isServer } from 'philjs-ssr';

function Component() {
  const data = createResource(async () => {
    if (isServer) {
      // Server-only code
      return await db.query('...');
    } else {
      // Client-side fetch
      return fetch('/api/data').then(r => r.json());
    }
  });

  return <div>{/* render data */}</div>;
}`,since:"1.0.0"},{name:"ssr",signature:"function ssr(template: string, ...values: any[]): { t: string }",description:"Template literal tag for SSR-safe HTML.",parameters:[{name:"template",type:"string",description:"HTML template string"},{name:"values",type:"any[]",description:"Values to interpolate"}],returns:{type:"{ t: string }",description:"SSR-safe HTML object"},example:`function RawHTML() {
  const content = ssr\`
    <div class="prose">
      <h1>Title</h1>
      <p>Content with <strong>HTML</strong></p>
    </div>
  \`;

  return <div innerHTML={content.t} />;
}`,since:"1.0.0"},{name:"createAsync",signature:"function createAsync<T>(fn: () => Promise<T>): Accessor<T | undefined>",description:"Creates an async resource that works with Suspense.",parameters:[{name:"fn",type:"() => Promise<T>",description:"Async function to execute"}],returns:{type:"Accessor<T | undefined>",description:"Accessor for the async result"},example:`function UserProfile(props: { userId: string }) {
  const user = createAsync(async () => {
    const res = await fetch(\`/api/users/\${props.userId}\`);
    return res.json();
  });

  return (
    <Suspense fallback={<Spinner />}>
      <div>{user()?.name}</div>
    </Suspense>
  );
}`,since:"1.0.0"}],types:[{name:"RenderOptions",kind:"interface",description:"Options for server rendering functions.",properties:[{name:"nonce",type:"string",description:"Nonce for CSP",optional:!0},{name:"renderId",type:"string",description:"Unique ID for this render",optional:!0}]},{name:"MetaProps",kind:"interface",description:"Props for Meta component.",properties:[{name:"name",type:"string",description:"Meta name attribute",optional:!0},{name:"property",type:"string",description:"Meta property attribute (for Open Graph)",optional:!0},{name:"content",type:"string",description:"Meta content"},{name:"charset",type:"string",description:"Character encoding",optional:!0}]},{name:"SuspenseContext",kind:"interface",description:"Context provided by Suspense boundaries.",properties:[{name:"suspended",type:"boolean",description:"Whether content is currently suspended"},{name:"resources",type:"Set<Promise<any>>",description:"Pending resource promises"}]}]})}},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>a});var s=r(9015),n=r(1471);let i=(0,n.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),o=(0,n.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function a({children:e}){return s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,s.jsxs)("div",{className:"flex gap-12",children:[s.jsx(o,{sections:i}),s.jsx("main",{className:"flex-1 min-w-0",children:s.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[732,6314,9858],()=>r(5152));module.exports=s})();