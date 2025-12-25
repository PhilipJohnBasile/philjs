(()=>{var e={};e.id=5919,e.ids=[5919],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},5252:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>c,routeModule:()=>h,tree:()=>d}),s(6154),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),a=s(9761),n=s.n(a),o=s(4798),l={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>o[e]);s.d(t,l);let d=["",{children:["docs",{children:["guides",{children:["liveview",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,6154)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\liveview\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\liveview\\page.tsx"],u="/docs/guides/liveview/page",p={require:s,loadChunk:()=>Promise.resolve()},h=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/guides/liveview/page",pathname:"/docs/guides/liveview",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},4357:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>c,docsNavigation:()=>d});var r=s(6741),i=s(8972),a=s(47),n=s(7678),o=s(3178),l=s(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function c({sections:e}){let t=(0,a.usePathname)(),[s,d]=(0,l.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),c=e=>{d(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let a=s.has(e.title),l=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>c(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(o.Z,{className:(0,n.Z)("w-4 h-4 transition-transform",a&&"rotate-90")})]}),(a||l)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,n.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},6154:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l,metadata:()=>o});var r=s(9015),i=s(3288),a=s(7309),n=s(8951);let o={title:"LiveView - PhilJS Guide",description:"Build real-time server-rendered UI with PhilJS LiveView for interactive applications without complex client-side state."};function l(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"LiveView"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS LiveView enables real-time, server-rendered UI updates over WebSockets, providing rich interactivity without complex client-side state management."}),r.jsx("h2",{id:"introduction",children:"Introduction"}),r.jsx("p",{children:"LiveView keeps your application logic on the server while providing a reactive, real-time user experience. The server maintains the state, handles events, and sends optimized DOM patches to the client over WebSockets."}),r.jsx(a.U,{type:"info",title:"Inspiration",children:"PhilJS LiveView is inspired by Phoenix LiveView and brings similar patterns to the TypeScript/Rust ecosystem with seamless integration into the PhilJS framework."}),r.jsx("h2",{id:"setup",children:"Setup"}),r.jsx(i.oI,{commands:["pnpm add philjs-liveview","# For Rust projects:","cargo add philjs-liveview"]}),r.jsx(i.dn,{code:`// server.ts
import { createServer } from 'philjs-liveview/server';
import { App } from './App';

const server = createServer({
  component: App,
  port: 3000,
  // WebSocket configuration
  ws: {
    path: '/live',
    heartbeat: 30000,
  },
});

server.listen();`,language:"typescript",filename:"server.ts"}),r.jsx("h2",{id:"basic-example",children:"Basic Example"}),r.jsx("h3",{children:"TypeScript"}),r.jsx(i.dn,{code:`import { createLiveView, useLiveState } from 'philjs-liveview';

export const Counter = createLiveView({
  // Initial state (runs on server)
  mount: () => ({
    count: 0,
  }),

  // Event handlers (run on server)
  handleEvent: {
    increment: (state) => ({
      ...state,
      count: state.count + 1,
    }),
    decrement: (state) => ({
      ...state,
      count: state.count - 1,
    }),
  },

  // Render (runs on server, sends DOM patches)
  render: (state, { pushEvent }) => (
    <div className="counter">
      <h1>Count: {state.count}</h1>
      <button onClick={() => pushEvent('decrement')}>-</button>
      <button onClick={() => pushEvent('increment')}>+</button>
    </div>
  ),
});`,language:"typescript",filename:"Counter.tsx"}),r.jsx("h3",{children:"Rust"}),r.jsx(i.dn,{code:`use philjs_liveview::prelude::*;

#[derive(Default, Clone)]
struct CounterState {
    count: i32,
}

#[live_view]
fn Counter() -> impl LiveView {
    LiveViewBuilder::new()
        .mount(|| CounterState::default())
        .handle_event("increment", |state: &mut CounterState| {
            state.count += 1;
        })
        .handle_event("decrement", |state: &mut CounterState| {
            state.count -= 1;
        })
        .render(|state, cx| {
            view! {
                <div class="counter">
                    <h1>"Count: " {state.count}</h1>
                    <button on:click=cx.push_event("decrement")>"-"</button>
                    <button on:click=cx.push_event("increment")">"+"</button>
                </div>
            }
        })
}`,language:"rust",filename:"counter.rs"}),r.jsx("h2",{id:"forms",children:"Form Handling"}),r.jsx("p",{children:"LiveView provides seamless form handling with real-time validation:"}),r.jsx(i.dn,{code:`import { createLiveView } from 'philjs-liveview';

export const ContactForm = createLiveView({
  mount: () => ({
    form: { name: '', email: '', message: '' },
    errors: {},
    submitted: false,
  }),

  handleEvent: {
    validate: (state, { field, value }) => {
      const errors = { ...state.errors };

      if (field === 'email' && !value.includes('@')) {
        errors.email = 'Invalid email address';
      } else {
        delete errors[field];
      }

      return {
        ...state,
        form: { ...state.form, [field]: value },
        errors,
      };
    },

    submit: async (state) => {
      // Server-side form processing
      await sendEmail(state.form);
      return { ...state, submitted: true };
    },
  },

  render: (state, { pushEvent }) => (
    <form onSubmit={(e) => { e.preventDefault(); pushEvent('submit'); }}>
      <input
        value={state.form.name}
        onInput={(e) => pushEvent('validate', {
          field: 'name',
          value: e.target.value,
        })}
      />

      <input
        type="email"
        value={state.form.email}
        onInput={(e) => pushEvent('validate', {
          field: 'email',
          value: e.target.value,
        })}
      />
      {state.errors.email && <span>{state.errors.email}</span>}

      <textarea
        value={state.form.message}
        onInput={(e) => pushEvent('validate', {
          field: 'message',
          value: e.target.value,
        })}
      />

      <button type="submit">Send</button>
    </form>
  ),
});`,language:"typescript"}),r.jsx("h2",{id:"real-time-updates",children:"Real-Time Updates"}),r.jsx("p",{children:"LiveView can push updates to clients from server-side events:"}),r.jsx(i.dn,{code:`import { createLiveView } from 'philjs-liveview';

export const Dashboard = createLiveView({
  mount: async () => ({
    metrics: await fetchMetrics(),
    lastUpdated: new Date(),
  }),

  // Subscribe to server-side events
  subscriptions: ['metrics:updated'],

  // Handle broadcast messages
  handleInfo: {
    'metrics:updated': async (state, payload) => ({
      ...state,
      metrics: payload.metrics,
      lastUpdated: new Date(),
    }),
  },

  render: (state) => (
    <div className="dashboard">
      <h1>Live Metrics</h1>
      <p>Last updated: {state.lastUpdated.toLocaleString()}</p>
      <MetricsGrid metrics={state.metrics} />
    </div>
  ),
});

// Broadcast updates from anywhere on the server
import { broadcast } from 'philjs-liveview';

setInterval(async () => {
  const metrics = await fetchMetrics();
  broadcast('metrics:updated', { metrics });
}, 5000);`,language:"typescript"}),r.jsx("h2",{id:"navigation",children:"Navigation"}),r.jsx("p",{children:"LiveView supports client-side navigation while maintaining WebSocket connection:"}),r.jsx(i.dn,{code:`import { createLiveView, navigate, Link } from 'philjs-liveview';

export const ProductList = createLiveView({
  mount: async ({ params }) => ({
    products: await fetchProducts(params.category),
    category: params.category,
  }),

  render: (state) => (
    <div>
      <nav>
        <Link to="/products/electronics">Electronics</Link>
        <Link to="/products/clothing">Clothing</Link>
      </nav>

      <ul>
        {state.products.map(product => (
          <li key={product.id}>
            <Link to={\`/products/\${product.id}\`}>
              {product.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ),
});`,language:"typescript"}),r.jsx("h2",{id:"uploads",children:"File Uploads"}),r.jsx(i.dn,{code:`import { createLiveView } from 'philjs-liveview';

export const ImageUpload = createLiveView({
  mount: () => ({
    uploads: [],
    progress: {},
  }),

  // Configure uploads
  uploads: {
    images: {
      accept: ['image/*'],
      maxSize: 5 * 1024 * 1024, // 5MB
      maxEntries: 5,
    },
  },

  handleEvent: {
    upload: async (state, { uploads }, { consumeUpload }) => {
      const uploaded = [];
      for (const upload of uploads.images) {
        const url = await consumeUpload(upload, saveToStorage);
        uploaded.push({ name: upload.name, url });
      }
      return { ...state, uploads: [...state.uploads, ...uploaded] };
    },
  },

  render: (state, { uploads, pushEvent }) => (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => uploads.images.addFiles(e.target.files)}
      />

      {uploads.images.entries.map(entry => (
        <div key={entry.ref}>
          {entry.name} - {entry.progress}%
        </div>
      ))}

      <button onClick={() => pushEvent('upload')}>
        Upload
      </button>
    </div>
  ),
});`,language:"typescript"}),r.jsx("h2",{id:"javascript-hooks",children:"JavaScript Hooks"}),r.jsx("p",{children:"For complex client-side behavior, use JavaScript hooks:"}),r.jsx(i.dn,{code:`// hooks.ts
export const Hooks = {
  Chart: {
    mounted() {
      this.chart = new Chart(this.el, {
        data: JSON.parse(this.el.dataset.points),
      });
    },
    updated() {
      this.chart.update(JSON.parse(this.el.dataset.points));
    },
    destroyed() {
      this.chart.destroy();
    },
  },
};

// In your LiveView
render: (state) => (
  <canvas
    phx-hook="Chart"
    data-points={JSON.stringify(state.chartData)}
  />
)`,language:"typescript"}),r.jsx("h2",{id:"axum-integration",children:"Axum Integration (Rust)"}),r.jsx(i.dn,{code:`use axum::{routing::get, Router};
use philjs_liveview::{LiveViewLayer, live};

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(home))
        .route("/counter", live(Counter))
        .route("/dashboard", live(Dashboard))
        .layer(LiveViewLayer::new());

    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}`,language:"rust",filename:"main.rs"}),r.jsx("h2",{id:"best-practices",children:"Best Practices"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Keep state minimal:"})," Only store what's needed for rendering"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Debounce frequent events:"})," Use built-in debouncing for inputs"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Handle disconnections:"})," Implement reconnection logic for robustness"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use hooks sparingly:"})," Prefer server-side logic when possible"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Optimize subscriptions:"})," Unsubscribe from topics when not needed"]})]}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(n.default,{href:"/docs/guides/ssr-hydration",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"SSR & Hydration"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Understanding server-side rendering"})]}),(0,r.jsxs)(n.default,{href:"/docs/guides/forms",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Forms"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Form handling patterns in PhilJS"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o});var r=s(9015),i=s(1471);let a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),n=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function o({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(n,{sections:a}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>a});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let a=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(5252));module.exports=r})();