(()=>{var e={};e.id=6664,e.ids=[6664],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},6421:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>l.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>c,routeModule:()=>h,tree:()=>d}),s(2660),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),a=s(9761),l=s.n(a),o=s(4798),n={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(n[e]=()=>o[e]);s.d(t,n);let d=["",{children:["docs",{children:["rust-guide",{children:["wasm",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,2660)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\rust-guide\\wasm\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\rust-guide\\wasm\\page.tsx"],p="/docs/rust-guide/wasm/page",u={require:s,loadChunk:()=>Promise.resolve()},h=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/rust-guide/wasm/page",pathname:"/docs/rust-guide/wasm",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},4357:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>c,docsNavigation:()=>d});var r=s(6741),i=s(8972),a=s(47),l=s(7678),o=s(3178),n=s(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function c({sections:e}){let t=(0,a.usePathname)(),[s,d]=(0,n.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),c=e=>{d(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let a=s.has(e.title),n=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>c(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(o.Z,{className:(0,l.Z)("w-4 h-4 transition-transform",a&&"rotate-90")})]}),(a||n)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,l.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o});var r=s(9015),i=s(1471);let a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),l=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function o({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(l,{sections:a}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},2660:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>n,metadata:()=>o});var r=s(9015),i=s(3288),a=s(7309),l=s(8951);let o={title:"WASM Deployment",description:"Deploy PhilJS applications as WebAssembly for maximum performance."};function n(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"WASM Deployment"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Deploy your PhilJS application as WebAssembly for near-native performance in the browser. This guide covers client-side-only (CSR) and static site generation (SSG) deployments."}),r.jsx("h2",{id:"build-modes",children:"Build Modes"}),r.jsx("h3",{children:"Client-Side Rendering (CSR)"}),r.jsx("p",{children:"Pure client-side rendering compiles your entire app to WASM. The browser downloads the WASM bundle and renders the UI dynamically."}),r.jsx(i.oI,{commands:["# Build for CSR","cargo philjs build --release --features csr","","# Output in dist/ directory","ls dist/","# index.html","# pkg/","#   my-app.js","#   my-app_bg.wasm"]}),r.jsx("h3",{children:"Static Site Generation (SSG)"}),r.jsx("p",{children:"Pre-render all pages at build time for instant loading and SEO benefits."}),r.jsx(i.oI,{commands:["# Build with SSG","cargo philjs build --release --features ssr --ssg","","# Output includes pre-rendered HTML","ls dist/","# index.html","# about/index.html","# todos/index.html","# pkg/"]}),r.jsx("h2",{id:"optimization",children:"Optimization"}),r.jsx("h3",{children:"WASM Size Optimization"}),r.jsx(i.dn,{code:`# Cargo.toml
[profile.release]
opt-level = 'z'      # Optimize for size
lto = true           # Enable Link Time Optimization
codegen-units = 1    # Reduce parallel codegen for better optimization
panic = 'abort'      # Remove panic unwinding code
strip = true         # Strip debug symbols

[profile.release.package."*"]
opt-level = 'z'`,language:"toml",filename:"Cargo.toml"}),r.jsx("h3",{children:"wasm-opt"}),r.jsx(i.oI,{commands:["# Install wasm-opt (part of binaryen)","npm install -g binaryen","","# Optimize the WASM file","wasm-opt -Oz -o output.wasm input.wasm","","# With cargo-philjs (automatic)","cargo philjs build --release --wasm-opt"]}),r.jsx("h3",{children:"Code Splitting"}),r.jsx(i.dn,{code:`use philjs::prelude::*;

// Lazy load heavy components
#[component]
fn App() -> impl IntoView {
    view! {
        <Router>
            <Routes>
                <Route path="/" view=HomePage/>
                // Lazy loaded routes
                <Route
                    path="/dashboard"
                    view=|| {
                        let Dashboard = lazy(|| import("./pages/dashboard"));
                        view! {
                            <Suspense fallback=|| "Loading...">
                                <Dashboard/>
                            </Suspense>
                        }
                    }
                />
            </Routes>
        </Router>
    }
}`,language:"rust"}),r.jsx("h2",{id:"deployment-targets",children:"Deployment Targets"}),r.jsx("h3",{children:"Cloudflare Pages"}),r.jsx(i.dn,{code:`# wrangler.toml
name = "my-philjs-app"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[build]
command = "cargo philjs build --release --features csr"`,language:"toml",filename:"wrangler.toml"}),r.jsx(i.oI,{commands:["# Deploy to Cloudflare Pages","npx wrangler pages deploy dist --project-name=my-app"]}),r.jsx("h3",{children:"Netlify"}),r.jsx(i.dn,{code:`# netlify.toml
[build]
  command = "cargo philjs build --release --features csr"
  publish = "dist"

[[headers]]
  for = "/*.wasm"
  [headers.values]
    Content-Type = "application/wasm"
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"`,language:"toml",filename:"netlify.toml"}),r.jsx("h3",{children:"Vercel"}),r.jsx(i.dn,{code:`{
  "buildCommand": "cargo philjs build --release --features csr",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/(.*).wasm",
      "headers": [
        { "key": "Content-Type", "value": "application/wasm" },
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}`,language:"json",filename:"vercel.json"}),r.jsx("h3",{children:"GitHub Pages"}),r.jsx(i.dn,{code:`name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-action@stable
        with:
          targets: wasm32-unknown-unknown

      - name: Install cargo-philjs
        run: cargo install cargo-philjs

      - name: Build
        run: cargo philjs build --release --features csr

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist`,language:"yaml",filename:".github/workflows/deploy.yml"}),r.jsx("h2",{id:"loading-strategies",children:"Loading Strategies"}),r.jsx("h3",{children:"Streaming Instantiation"}),r.jsx(i.dn,{code:`<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>My App</title>
    <link rel="modulepreload" href="/pkg/my-app.js">
    <link rel="preload" href="/pkg/my-app_bg.wasm" as="fetch" crossorigin>
</head>
<body>
    <div id="app">
        <!-- Loading indicator shown while WASM loads -->
        <div class="loading">Loading...</div>
    </div>

    <script type="module">
        // Use streaming instantiation for faster startup
        import init, { hydrate } from '/pkg/my-app.js';

        // Start loading WASM immediately
        const wasmPromise = init();

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', async () => {
                await wasmPromise;
                hydrate();
            });
        } else {
            wasmPromise.then(hydrate);
        }
    </script>
</body>
</html>`,language:"html",filename:"index.html"}),r.jsx("h3",{children:"Progressive Enhancement"}),r.jsx(i.dn,{code:`<!-- Show content even before WASM loads -->
<div id="app">
    <!-- Server-rendered or static HTML -->
    <header>
        <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
        </nav>
    </header>
    <main>
        <h1>Welcome</h1>
        <p>Content is visible immediately.</p>
        <button disabled data-philjs-interactive>
            Click me (loading...)
        </button>
    </main>
</div>

<script type="module">
    import init, { hydrate } from '/pkg/my-app.js';

    await init();
    hydrate();

    // Enable interactive elements after hydration
    document.querySelectorAll('[data-philjs-interactive]').forEach(el => {
        el.removeAttribute('disabled');
        el.textContent = el.textContent.replace(' (loading...)', '');
    });
</script>`,language:"html"}),r.jsx("h2",{id:"caching",children:"Caching Strategies"}),r.jsx(i.dn,{code:`// Service Worker for offline support
// sw.js
const CACHE_NAME = 'philjs-app-v1';
const WASM_CACHE = 'philjs-wasm-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
];

const WASM_ASSETS = [
    '/pkg/my-app.js',
    '/pkg/my-app_bg.wasm',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)),
            caches.open(WASM_CACHE).then(cache => cache.addAll(WASM_ASSETS)),
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Cache-first for WASM files
    if (url.pathname.endsWith('.wasm') || url.pathname.includes('/pkg/')) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
        return;
    }

    // Network-first for other requests
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});`,language:"javascript",filename:"sw.js"}),r.jsx("h2",{id:"debugging",children:"Debugging"}),r.jsx(a.U,{type:"info",title:"Debug Builds",children:"Debug builds include better error messages and source maps but are much larger. Only use for development."}),r.jsx(i.oI,{commands:["# Debug build with source maps","cargo philjs build --dev","","# Enable console_error_panic_hook","# (already included in PhilJS apps)"]}),r.jsx(i.dn,{code:`// In your lib.rs
#[wasm_bindgen(start)]
pub fn main() {
    // Better panic messages in browser console
    console_error_panic_hook::set_once();

    // Enable logging
    #[cfg(debug_assertions)]
    {
        console_log::init_with_level(log::Level::Debug).unwrap();
    }

    mount_to_body(App);
}`,language:"rust"}),r.jsx("h2",{id:"performance-tips",children:"Performance Tips"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use gzip/brotli compression:"})," WASM files compress very well"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Preload critical assets:"})," Use ",r.jsx("code",{children:'<link rel="preload">'})]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Code split:"})," Lazy load non-critical routes"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Tree shake:"})," Avoid unused dependencies"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use release builds:"})," Debug builds are 10x+ larger"]})]}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(l.default,{href:"/docs/rust-guide/axum",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Axum Integration"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Build full-stack apps with SSR"})]}),(0,r.jsxs)(l.default,{href:"/docs/guides/deployment",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Deployment Guide"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"General deployment strategies"})]})]})]})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>a});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let a=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(6421));module.exports=r})();