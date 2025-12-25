(()=>{var e={};e.id=476,e.ids=[476],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},265:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>h,pages:()=>c,routeModule:()=>u,tree:()=>d}),s(1603),s(2108),s(4001),s(1305);var i=s(3545),r=s(5947),a=s(9761),n=s.n(a),l=s(4798),o={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>l[e]);s.d(t,o);let d=["",{children:["docs",{children:["guides",{children:["islands",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,1603)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\islands\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\islands\\page.tsx"],h="/docs/guides/islands/page",p={require:s,loadChunk:()=>Promise.resolve()},u=new i.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/docs/guides/islands/page",pathname:"/docs/guides/islands",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},7656:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>c,docsNavigation:()=>d});var i=s(6741),r=s(8972),a=s(47),n=s(7678),l=s(3178),o=s(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function c({sections:e}){let t=(0,a.usePathname)(),[s,d]=(0,o.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),c=e=>{d(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return i.jsx("nav",{className:"w-64 flex-shrink-0",children:i.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:i.jsx("ul",{className:"space-y-6",children:e.map(e=>{let a=s.has(e.title),o=e.links.some(e=>t===e.href);return(0,i.jsxs)("li",{children:[(0,i.jsxs)("button",{onClick:()=>c(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,i.jsx(l.Z,{className:(0,n.Z)("w-4 h-4 transition-transform",a&&"rotate-90")})]}),(a||o)&&i.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return i.jsx("li",{children:i.jsx(r.default,{href:e.href,className:(0,n.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>r.a});var i=s(7654),r=s.n(i)},7654:(e,t,s)=>{"use strict";let{createProxy:i}=s(1471);e.exports=i("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},1603:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o,metadata:()=>l});var i=s(9015),r=s(3288),a=s(7309),n=s(8951);let l={title:"Islands Architecture - PhilJS Guide",description:"Implement Islands Architecture in PhilJS for partial hydration and optimal performance."};function o(){return(0,i.jsxs)("div",{className:"mdx-content",children:[i.jsx("h1",{children:"Islands Architecture"}),i.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Islands Architecture enables partial hydration, shipping only the JavaScript needed for interactive components while keeping the rest as static HTML."}),i.jsx("h2",{id:"what-are-islands",children:"What are Islands?"}),i.jsx("p",{children:'Islands Architecture is a rendering pattern where most of your page is static HTML, with isolated "islands" of interactivity that get hydrated independently. This approach dramatically reduces JavaScript bundle size and improves Time to Interactive (TTI).'}),i.jsx(r.dn,{code:`// Static content - no JavaScript shipped
function Header() {
  return (
    <header>
      <h1>Welcome to our site</h1>
      <nav>{/* Static navigation */}</nav>
    </header>
  );
}

// Interactive island - only this ships JavaScript
import { island } from 'philjs-core';

const CounterIsland = island(() => import('./Counter'));

function Page() {
  return (
    <>
      <Header />
      <main>
        <p>This is static content.</p>
        <CounterIsland client:visible />
      </main>
    </>
  );
}`,language:"typescript",filename:"page.tsx"}),i.jsx("h2",{id:"creating-islands",children:"Creating Islands"}),i.jsx("h3",{children:"Basic Island"}),i.jsx(r.dn,{code:`import { island } from 'philjs-core';

// Create an island from a component
const MyIsland = island(() => import('./MyComponent'));

// Use in your page
function Page() {
  return (
    <div>
      <MyIsland
        client:load      // Hydrate immediately on load
        fallback={<Spinner />}
        someProp="value"
      />
    </div>
  );
}`,language:"typescript"}),i.jsx("h3",{children:"Hydration Strategies"}),i.jsx("p",{children:"PhilJS supports multiple hydration strategies to control when islands become interactive:"}),i.jsx(r.dn,{code:`// Hydrate immediately when the page loads
<Island client:load />

// Hydrate when the island becomes visible in viewport
<Island client:visible />

// Hydrate when the browser is idle
<Island client:idle />

// Hydrate on user interaction (hover, focus, or click)
<Island client:hover />
<Island client:focus />
<Island client:click />

// Hydrate when a media query matches
<Island client:media="(min-width: 768px)" />

// Never hydrate (useful for static content that uses islands infra)
<Island client:only />`,language:"tsx"}),(0,i.jsxs)(a.U,{type:"info",title:"Default Strategy",children:["If no hydration directive is specified, islands use ",i.jsx("code",{children:"client:visible"})," by default for optimal performance."]}),i.jsx("h2",{id:"passing-props",children:"Passing Props to Islands"}),i.jsx("p",{children:"Props are serialized and passed to islands during hydration. Only serializable data types are supported:"}),i.jsx(r.dn,{code:`const ProductIsland = island(() => import('./ProductCard'));

function ProductPage({ product }) {
  return (
    <ProductIsland
      client:visible
      // Serializable props
      id={product.id}
      name={product.name}
      price={product.price}
      imageUrl={product.imageUrl}
      // Objects and arrays work too
      variants={product.variants}
      metadata={{ featured: true }}
    />
  );
}

// Functions and class instances cannot be serialized
// This would cause an error:
// <Island onClick={handleClick} />  // Error!`,language:"typescript"}),i.jsx("h2",{id:"nested-islands",children:"Nested Islands"}),i.jsx("p",{children:"Islands can contain other islands for complex interactive sections:"}),i.jsx(r.dn,{code:`const DashboardIsland = island(() => import('./Dashboard'));
const ChartIsland = island(() => import('./Chart'));
const FiltersIsland = island(() => import('./Filters'));

function DashboardPage() {
  return (
    <DashboardIsland client:load>
      {/* These islands hydrate independently */}
      <FiltersIsland client:idle />
      <ChartIsland client:visible />
    </DashboardIsland>
  );
}`,language:"typescript"}),i.jsx("h2",{id:"rust-islands",children:"Islands in Rust"}),i.jsx(r.dn,{code:`use philjs::prelude::*;

// Define an island component
#[island]
fn Counter(initial: i32) -> Element {
    let count = use_signal(|| initial);

    view! {
        <button on:click=move |_| count.set(|c| c + 1)>
            "Count: " {count}
        </button>
    }
}

// Use in a page
#[component]
fn Page() -> Element {
    view! {
        <div>
            <h1>"Static Content"</h1>
            // Hydrate when visible
            <Counter initial=0 client:visible />
        </div>
    }
}`,language:"rust",filename:"page.rs"}),i.jsx("h2",{id:"shared-state",children:"Shared State Between Islands"}),i.jsx("p",{children:"Islands can share state using PhilJS stores or context that's initialized on the server:"}),i.jsx(r.dn,{code:`// store.ts - Shared store
import { createStore } from 'philjs-core';

export const [cartStore, setCart] = createStore({
  items: [],
  total: 0,
});

// CartButton island
export function CartButton() {
  return (
    <button>
      Cart ({cartStore.items.length})
    </button>
  );
}

// CartDropdown island
export function CartDropdown() {
  return (
    <div>
      {cartStore.items.map(item => (
        <CartItem key={item.id} item={item} />
      ))}
      <p>Total: \${cartStore.total}</p>
    </div>
  );
}

// Both islands share the same store state`,language:"typescript"}),i.jsx("h2",{id:"configuration",children:"Configuration"}),i.jsx(r.dn,{code:`// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      islands: {
        // Enable islands mode
        enabled: true,
        // Directory containing island components
        islandsDir: 'src/islands',
        // Default hydration strategy
        defaultStrategy: 'visible',
        // Preload islands for faster hydration
        preload: true,
      },
    }),
  ],
});`,language:"typescript",filename:"vite.config.ts"}),i.jsx("h2",{id:"performance",children:"Performance Tips"}),(0,i.jsxs)("ul",{children:[(0,i.jsxs)("li",{children:[(0,i.jsxs)("strong",{children:["Use ",i.jsx("code",{children:"client:visible"})," for below-the-fold content:"]})," Only hydrate components when users scroll to them"]}),(0,i.jsxs)("li",{children:[(0,i.jsxs)("strong",{children:["Prefer ",i.jsx("code",{children:"client:idle"})," for non-critical UI:"]})," Let the browser prioritize critical rendering"]}),(0,i.jsxs)("li",{children:[i.jsx("strong",{children:"Keep islands small:"})," Break large interactive sections into smaller islands"]}),(0,i.jsxs)("li",{children:[i.jsx("strong",{children:"Share code between islands:"})," Common utilities are deduplicated automatically"]}),(0,i.jsxs)("li",{children:[i.jsx("strong",{children:"Use static content where possible:"})," Not everything needs to be an island"]})]}),i.jsx("h2",{id:"debugging",children:"Debugging Islands"}),i.jsx(r.dn,{code:`// Enable island debugging in development
import { configureIslands } from 'philjs-core';

configureIslands({
  debug: true,           // Log hydration events
  showBoundaries: true,  // Highlight island boundaries
  timing: true,          // Log hydration timing
});`,language:"typescript"}),i.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,i.jsxs)(n.default,{href:"/docs/guides/ssr-hydration",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[i.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"SSR & Hydration"}),i.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn about server-side rendering fundamentals"})]}),(0,i.jsxs)(n.default,{href:"/docs/guides/deployment",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[i.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Deployment"}),i.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Deploy your islands-based application"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l});var i=s(9015),r=s(1471);let a=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),n=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function l({children:e}){return i.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,i.jsxs)("div",{className:"flex gap-12",children:[i.jsx(n,{sections:a}),i.jsx("main",{className:"flex-1 min-w-0",children:i.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>r,oI:()=>a});var i=s(1471);let r=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),i=t.X(0,[732,6314,9858],()=>s(265));module.exports=i})();