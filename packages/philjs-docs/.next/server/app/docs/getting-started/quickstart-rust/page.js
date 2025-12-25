(()=>{var e={};e.id=27,e.ids=[27],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},2020:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>a.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>d,routeModule:()=>h,tree:()=>c}),s(470),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),o=s(9761),a=s.n(o),n=s(4798),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);s.d(t,l);let c=["",{children:["docs",{children:["getting-started",{children:["quickstart-rust",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,470)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\getting-started\\quickstart-rust\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\getting-started\\quickstart-rust\\page.tsx"],u="/docs/getting-started/quickstart-rust/page",p={require:s,loadChunk:()=>Promise.resolve()},h=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/getting-started/quickstart-rust/page",pathname:"/docs/getting-started/quickstart-rust",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},4357:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>c});var r=s(6741),i=s(8972),o=s(47),a=s(7678),n=s(3178),l=s(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,o.usePathname)(),[s,c]=(0,l.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{c(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=s.has(e.title),l=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(n.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||l)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},470:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l,metadata:()=>n});var r=s(9015),i=s(3288),o=s(7309),a=s(8951);let n={title:"Quick Start (Rust)",description:"Build your first PhilJS application with Rust. Learn the view! macro, signals, and WebAssembly deployment."};function l(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Quick Start (Rust)"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Build blazing-fast web applications with PhilJS and Rust. Compile to WebAssembly for near-native performance."}),(0,r.jsxs)(o.U,{type:"info",title:"Prerequisites",children:["Make sure you have Rust 1.75+ installed. Run ",r.jsx("code",{children:"rustup update"})," to get the latest version. You'll also need the wasm32-unknown-unknown target: ",r.jsx("code",{children:"rustup target add wasm32-unknown-unknown"})]}),r.jsx("h2",{id:"install-cli",children:"Install cargo-philjs"}),r.jsx(i.oI,{commands:["cargo install cargo-philjs"]}),r.jsx("h2",{id:"create-project",children:"Create a New Project"}),r.jsx(i.oI,{commands:["cargo philjs new my-app","cd my-app","cargo philjs dev"]}),(0,r.jsxs)("p",{children:["Open ",r.jsx("a",{href:"http://localhost:3000",target:"_blank",rel:"noopener noreferrer",children:"http://localhost:3000"})," to see your app running."]}),r.jsx("h2",{id:"project-structure",children:"Project Structure"}),r.jsx(i.dn,{code:`my-app/
├── src/
│   ├── lib.rs              # App entry point
│   ├── app.rs              # Main App component
│   ├── components/
│   │   ├── mod.rs
│   │   └── counter.rs      # Example component
│   └── routes/
│       ├── mod.rs
│       └── home.rs         # Home page
├── public/
│   └── index.html
├── Cargo.toml
└── PhilJS.toml             # PhilJS configuration`,language:"plaintext",showLineNumbers:!1}),r.jsx("h2",{id:"view-macro",children:"The view! Macro"}),(0,r.jsxs)("p",{children:["PhilJS Rust uses the ",r.jsx("code",{children:"view!"})," macro for declarative UI. It looks similar to HTML but with Rust expressions:"]}),r.jsx(i.dn,{code:`use philjs::prelude::*;

#[component]
fn Counter() -> Element {
    let count = use_signal(|| 0);

    view! {
        <div class="counter">
            <h1>"Count: " {count}</h1>
            <button on:click=move |_| count.set(|c| c + 1)>
                "Increment"
            </button>
        </div>
    }
}`,language:"rust",filename:"src/components/counter.rs"}),r.jsx("h3",{children:"Key Differences from JSX"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Strings must be quoted"}),": Use ",r.jsx("code",{children:'"text"'})," instead of bare text"]}),(0,r.jsxs)("li",{children:[(0,r.jsxs)("strong",{children:["Use ",r.jsx("code",{children:"class"})]}),": Not ",r.jsx("code",{children:"className"})]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Event handlers"}),": Use ",r.jsx("code",{children:"on:click"})," syntax"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Expressions"}),": Wrap Rust expressions in ",r.jsx("code",{children:"{}"})]})]}),r.jsx("h2",{id:"signals",children:"Signals in Rust"}),r.jsx("p",{children:"Signals work similarly to TypeScript, but with Rust's ownership semantics:"}),r.jsx(i.dn,{code:`use philjs::prelude::*;

#[component]
fn SignalsExample() -> Element {
    // Create a signal - Clone is automatic
    let count = use_signal(|| 0);

    // Computed values with use_memo
    let doubled = use_memo(move || count() * 2);
    let is_even = use_memo(move || count() % 2 == 0);

    // Side effects
    use_effect(move || {
        log::info!("Count changed to: {}", count());

        // Cleanup (optional)
        on_cleanup(|| {
            log::info!("Cleaning up...");
        });
    });

    view! {
        <div>
            <p>"Count: " {count}</p>
            <p>"Doubled: " {doubled}</p>
            <p>"Is Even: " {move || if is_even() { "Yes" } else { "No" }}</p>
            <button on:click=move |_| count.set(|c| c + 1)>"+1"</button>
        </div>
    }
}`,language:"rust",filename:"src/components/signals_example.rs"}),r.jsx("h2",{id:"lists",children:"Rendering Lists"}),(0,r.jsxs)("p",{children:["Use the ",r.jsx("code",{children:"For"})," component for efficient list rendering:"]}),r.jsx(i.dn,{code:`use philjs::prelude::*;

#[derive(Clone, PartialEq)]
struct Todo {
    id: u32,
    text: String,
    done: bool,
}

#[component]
fn TodoList() -> Element {
    let todos = use_signal(|| vec![
        Todo { id: 1, text: "Learn Rust".into(), done: true },
        Todo { id: 2, text: "Build with PhilJS".into(), done: false },
    ]);

    let add_todo = move |text: String| {
        todos.update(|t| t.push(Todo {
            id: t.len() as u32 + 1,
            text,
            done: false,
        }));
    };

    view! {
        <ul class="space-y-2">
            <For
                each=move || todos()
                key=|todo| todo.id
                children=|todo| view! {
                    <li class="flex items-center gap-2">
                        <input
                            type="checkbox"
                            prop:checked=todo.done
                        />
                        <span class=("line-through", todo.done)>
                            {todo.text}
                        </span>
                    </li>
                }
            />
        </ul>
    }
}`,language:"rust",filename:"src/components/todo_list.rs"}),r.jsx("h2",{id:"async",children:"Async Data Fetching"}),(0,r.jsxs)("p",{children:["Use ",r.jsx("code",{children:"use_resource"})," for async data:"]}),r.jsx(i.dn,{code:`use philjs::prelude::*;
use serde::Deserialize;

#[derive(Clone, Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}

#[component]
fn UserProfile() -> Element {
    let user_id = use_signal(|| 1u32);

    let user = use_resource(move || async move {
        let url = format!(
            "https://api.example.com/users/{}",
            user_id()
        );
        reqwest::get(&url)
            .await?
            .json::<User>()
            .await
    });

    view! {
        <div>
            <Suspense fallback=|| view! { <p>"Loading..."</p> }>
                {move || user.read().map(|result| {
                    match result {
                        Ok(u) => view! {
                            <div>
                                <h2>{u.name.clone()}</h2>
                                <p>{u.email.clone()}</p>
                            </div>
                        },
                        Err(e) => view! {
                            <p class="text-red-500">
                                "Error: " {e.to_string()}
                            </p>
                        },
                    }
                })}
            </Suspense>
        </div>
    }
}`,language:"rust",filename:"src/components/user_profile.rs"}),r.jsx("h2",{id:"server-functions",children:"Server Functions"}),r.jsx("p",{children:"Call Rust functions on the server directly from your components:"}),r.jsx(i.dn,{code:`use philjs::prelude::*;

// This function runs on the server
#[server]
async fn get_user(id: u32) -> Result<User, ServerError> {
    // Database access, file I/O, etc.
    let user = db::get_user(id).await?;
    Ok(user)
}

#[server]
async fn create_todo(text: String) -> Result<Todo, ServerError> {
    let todo = db::create_todo(&text).await?;
    Ok(todo)
}

#[component]
fn UserPage() -> Element {
    let user_id = use_params::<u32>();

    // Call server function from client
    let user = use_resource(move || get_user(user_id()));

    view! {
        <Suspense fallback=|| view! { <LoadingSkeleton /> }>
            {move || user.read().map(|result| {
                result.map(|u| view! {
                    <UserCard user=u />
                })
            })}
        </Suspense>
    }
}`,language:"rust",filename:"src/routes/user.rs"}),r.jsx("h2",{id:"building",children:"Building for Production"}),r.jsx(i.oI,{commands:["# Build optimized WASM binary","cargo philjs build --release","","# Output is in dist/","ls dist/"]}),r.jsx("p",{children:"The build output includes optimized WASM, JavaScript glue code, and your static assets. Deploy to any static hosting provider."}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(a.default,{href:"/docs/rust/view-macro",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"View Macro Deep Dive"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Master the view! macro syntax and patterns"})]}),(0,r.jsxs)(a.default,{href:"/docs/rust/server-functions",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Server Functions"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Build full-stack apps with type-safe RPC"})]}),(0,r.jsxs)(a.default,{href:"/docs/rust/axum",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Axum Integration"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Use PhilJS with the Axum web framework"})]}),(0,r.jsxs)(a.default,{href:"/docs/rust/wasm",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"WASM Deployment"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Deploy your Rust app to the web"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>n});var r=s(9015),i=s(1471);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(a,{sections:o}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>o});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(2020));module.exports=r})();