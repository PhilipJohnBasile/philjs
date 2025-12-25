(()=>{var e={};e.id=5710,e.ids=[5710],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},9217:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>h,pages:()=>c,routeModule:()=>u,tree:()=>a}),s(313),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),o=s(9761),n=s.n(o),l=s(4798),d={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>l[e]);s.d(t,d);let a=["",{children:["docs",{children:["comparison",{children:["leptos",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,313)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\comparison\\leptos\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\comparison\\leptos\\page.tsx"],h="/docs/comparison/leptos/page",p={require:s,loadChunk:()=>Promise.resolve()},u=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/comparison/leptos/page",pathname:"/docs/comparison/leptos",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:a}})},7656:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>c,docsNavigation:()=>a});var r=s(6741),i=s(8972),o=s(47),n=s(7678),l=s(3178),d=s(5280);let a=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function c({sections:e}){let t=(0,o.usePathname)(),[s,a]=(0,d.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),c=e=>{a(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=s.has(e.title),d=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>c(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(l.Z,{className:(0,n.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||d)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,n.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},313:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>d,metadata:()=>l});var r=s(9015),i=s(3288),o=s(7309),n=s(8951);let l={title:"PhilJS vs Leptos",description:"Compare PhilJS with Leptos - both Rust frameworks with fine-grained reactivity, with key differences in TypeScript support."};function d(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"PhilJS vs Leptos"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS and Leptos are both Rust-first web frameworks with fine-grained reactivity. PhilJS adds first-class TypeScript support for mixed-language or TS-only projects."}),r.jsx(o.U,{type:"info",title:"Shared Philosophy",children:"Both frameworks embrace Rust's type safety and performance while providing reactive primitives similar to SolidJS. The main difference is PhilJS's dual TypeScript/Rust support."}),r.jsx("h2",{id:"language-support",children:"Language Support"}),(0,r.jsxs)("table",{className:"w-full my-6",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{className:"text-left",children:"Aspect"}),r.jsx("th",{className:"text-left",children:"Leptos"}),r.jsx("th",{className:"text-left",children:"PhilJS"})]})}),(0,r.jsxs)("tbody",{children:[(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Primary Language"}),r.jsx("td",{children:"Rust only"}),r.jsx("td",{children:"TypeScript + Rust"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Frontend Options"}),r.jsx("td",{children:"Rust/WASM"}),r.jsx("td",{children:"TS, Rust/WASM, or hybrid"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Backend Options"}),r.jsx("td",{children:"Rust (Actix/Axum)"}),r.jsx("td",{children:"Node.js, Rust, or hybrid"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Shared Types"}),r.jsx("td",{children:"Rust structs"}),r.jsx("td",{children:"TS interfaces or Rust structs"})]})]})]}),r.jsx("h2",{id:"syntax-comparison",children:"Syntax Comparison"}),r.jsx("h3",{children:"Component Definition"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"Leptos"}),r.jsx(i.dn,{code:`use leptos::*;

#[component]
fn Counter(initial: i32) -> impl IntoView {
    let (count, set_count) = create_signal(initial);

    view! {
        <button on:click=move |_| {
            set_count.update(|n| *n += 1)
        }>
            "Count: " {count}
        </button>
    }
}`,language:"rust",showLineNumbers:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS (Rust)"}),r.jsx(i.dn,{code:`use philjs::prelude::*;

#[component]
fn Counter(initial: i32) -> impl IntoView {
    let (count, set_count) = create_signal(initial);

    view! {
        <button on:click=move |_| {
            set_count.update(|n| *n += 1)
        }>
            "Count: " {count}
        </button>
    }
}`,language:"rust",showLineNumbers:!1})]})]}),r.jsx("p",{children:"The Rust syntax is nearly identical! PhilJS also supports TypeScript:"}),r.jsx(i.dn,{code:`// PhilJS (TypeScript)
import { createSignal } from 'philjs-core';

function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = createSignal(initial);

  return (
    <button onClick={() => setCount(n => n + 1)}>
      Count: {count()}
    </button>
  );
}`,language:"typescript"}),r.jsx("h3",{children:"Server Functions"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"Leptos"}),r.jsx(i.dn,{code:`#[server(GetTodos, "/api")]
pub async fn get_todos() -> Result<Vec<Todo>, ServerFnError> {
    let pool = expect_context::<SqlitePool>();
    let todos = sqlx::query_as!(Todo,
        "SELECT * FROM todos"
    )
    .fetch_all(&pool)
    .await?;
    Ok(todos)
}`,language:"rust",showLineNumbers:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS (Rust)"}),r.jsx(i.dn,{code:`#[server(GetTodos)]
pub async fn get_todos() -> Result<Vec<Todo>, ServerFnError> {
    let pool = expect_context::<SqlitePool>();
    let todos = sqlx::query_as!(Todo,
        "SELECT * FROM todos"
    )
    .fetch_all(&pool)
    .await?;
    Ok(todos)
}`,language:"rust",showLineNumbers:!1})]})]}),r.jsx("h2",{id:"key-differences",children:"Key Differences"}),r.jsx("h3",{children:"TypeScript Interoperability"}),r.jsx(i.dn,{code:`// PhilJS allows mixing TS and Rust in the same project
// shared/types.ts - Generated from Rust or written in TS
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// frontend/components/TodoList.tsx - TypeScript component
import { createSignal, For } from 'philjs-core';
import type { Todo } from '../shared/types';

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <For each={todos}>
      {(todo) => <TodoItem todo={todo} />}
    </For>
  );
}

// Use Rust for performance-critical parts
// backend/processing.rs - Rust processing
#[wasm_bindgen]
pub fn process_todos(todos: JsValue) -> JsValue {
    let todos: Vec<Todo> = serde_wasm_bindgen::from_value(todos).unwrap();
    // Heavy processing in Rust
    serde_wasm_bindgen::to_value(&processed).unwrap()
}`,language:"typescript"}),r.jsx("h3",{children:"Hydration Strategies"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"Leptos"}),r.jsx(i.dn,{code:`// Leptos - Component-level islands
#[island]
fn InteractiveCounter() -> impl IntoView {
    // This component hydrates independently
    let (count, set_count) = create_signal(0);
    view! { <button>{count}</button> }
}

// Usage
view! {
    <InteractiveCounter />
}`,language:"rust",showLineNumbers:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`// PhilJS - Flexible island directives
// In Rust
view! {
    <Island client:visible>
        <Counter />
    </Island>
}

// In TypeScript
<Island client:idle priority="low">
  <HeavyChart />
</Island>

<Island client:media="(min-width: 768px)">
  <DesktopNav />
</Island>`,language:"rust",showLineNumbers:!1})]})]}),r.jsx("h3",{children:"Tooling"}),(0,r.jsxs)("table",{className:"w-full my-6",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{className:"text-left",children:"Tool"}),r.jsx("th",{className:"text-left",children:"Leptos"}),r.jsx("th",{className:"text-left",children:"PhilJS"})]})}),(0,r.jsxs)("tbody",{children:[(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Dev Server"}),r.jsx("td",{children:"cargo-leptos"}),r.jsx("td",{children:"cargo-philjs + Vite"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Hot Reload"}),r.jsx("td",{children:"WASM hot reload"}),r.jsx("td",{children:"TS hot reload + WASM hot reload"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Build"}),r.jsx("td",{children:"cargo build"}),r.jsx("td",{children:"pnpm build / cargo build"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Formatting"}),r.jsx("td",{children:"leptosfmt"}),r.jsx("td",{children:"rustfmt + Prettier"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Type Generation"}),r.jsx("td",{children:"N/A"}),r.jsx("td",{children:"Rust to TS types"})]})]})]}),r.jsx("h3",{children:"Router Comparison"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 my-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"Leptos"}),r.jsx(i.dn,{code:`use leptos_router::*;

view! {
    <Router>
        <Routes>
            <Route path="/" view=HomePage/>
            <Route path="/users/:id" view=UserPage/>
            <Route path="/*any" view=NotFound/>
        </Routes>
    </Router>
}

// Access params
#[component]
fn UserPage() -> impl IntoView {
    let params = use_params_map();
    let id = move || params.with(|p| p.get("id").cloned());
    view! { <p>"User: " {id}</p> }
}`,language:"rust",showLineNumbers:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-semibold mb-2",children:"PhilJS"}),r.jsx(i.dn,{code:`use philjs_router::*;

view! {
    <Router>
        <Routes>
            <Route path="/" view=HomePage/>
            <Route path="/users/:id" view=UserPage/>
            <Route path="/*" view=NotFound/>
        </Routes>
    </Router>
}

// Similar param access
#[component]
fn UserPage() -> impl IntoView {
    let params = use_params::<UserParams>();
    view! { <p>"User: " {move || params().id}</p> }
}

// Or in TypeScript
const { id } = useParams<{ id: string }>();`,language:"rust",showLineNumbers:!1})]})]}),r.jsx("h2",{id:"performance",children:"Performance Comparison"}),r.jsx("p",{children:"Both frameworks compile to efficient WASM with similar runtime performance. Key differences:"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Bundle size:"})," Similar for pure Rust; PhilJS TypeScript builds are smaller"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Initial load:"})," PhilJS TS hydrates faster than WASM"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Runtime:"})," Both achieve near-native performance in WASM"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Hybrid:"})," PhilJS allows TS for UI, Rust for compute-heavy parts"]})]}),r.jsx("h2",{id:"ecosystem",children:"Ecosystem"}),(0,r.jsxs)("table",{className:"w-full my-6",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{className:"text-left",children:"Feature"}),r.jsx("th",{className:"text-left",children:"Leptos"}),r.jsx("th",{className:"text-left",children:"PhilJS"})]})}),(0,r.jsxs)("tbody",{children:[(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"UI Components"}),r.jsx("td",{children:"Community crates"}),r.jsx("td",{children:"philjs-ui (TS + Rust)"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Forms"}),r.jsx("td",{children:"Built-in"}),r.jsx("td",{children:"philjs-forms"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Styling"}),r.jsx("td",{children:"Stylers crate"}),r.jsx("td",{children:"philjs-css / Tailwind"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"Testing"}),r.jsx("td",{children:"Rust tests"}),r.jsx("td",{children:"Rust + TS tests"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:"DevTools"}),r.jsx("td",{children:"Browser WASM debugger"}),r.jsx("td",{children:"philjs-devtools extension"})]})]})]}),r.jsx("h2",{id:"when-to-choose",children:"When to Choose Which"}),r.jsx("h3",{children:"Choose Leptos if:"}),(0,r.jsxs)("ul",{children:[r.jsx("li",{children:"You want pure Rust throughout your stack"}),r.jsx("li",{children:"Your team is all Rust developers"}),r.jsx("li",{children:"You don't need TypeScript interoperability"}),r.jsx("li",{children:"You prefer a more established Rust-only ecosystem"})]}),r.jsx("h3",{children:"Choose PhilJS if:"}),(0,r.jsxs)("ul",{children:[r.jsx("li",{children:"You want to mix TypeScript and Rust"}),r.jsx("li",{children:"You have developers with different language backgrounds"}),r.jsx("li",{children:"You want to progressively adopt Rust"}),r.jsx("li",{children:"You need npm ecosystem access"}),r.jsx("li",{children:"You want faster TypeScript hot reload during development"})]}),r.jsx("h2",{id:"migration",children:"Migration Path"}),r.jsx("p",{children:"Migrating between Leptos and PhilJS Rust code is relatively straightforward due to similar APIs:"}),r.jsx(i.dn,{code:`// Leptos -> PhilJS: Main changes
use philjs::prelude::*;       // was: use leptos::*;
use philjs_router::*;          // was: use leptos_router::*;

// Most component code is identical
#[component]
fn App() -> impl IntoView {
    // Same signal API
    let (count, set_count) = create_signal(0);

    // Same view! macro
    view! {
        <button on:click=move |_| set_count.update(|n| *n += 1)>
            {count}
        </button>
    }
}`,language:"rust"}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(n.default,{href:"/docs/rust-guide/quickstart",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Rust Quickstart"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Get started with PhilJS Rust"})]}),(0,r.jsxs)(n.default,{href:"/docs/getting-started/installation",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"TypeScript Setup"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Try PhilJS with TypeScript"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l});var r=s(9015),i=s(1471);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),n=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function l({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(n,{sections:o}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>o});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(9217));module.exports=r})();