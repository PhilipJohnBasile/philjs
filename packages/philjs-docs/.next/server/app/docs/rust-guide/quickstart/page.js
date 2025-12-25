(()=>{var e={};e.id=2323,e.ids=[2323],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3903:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>a.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>d,routeModule:()=>m,tree:()=>c}),s(7942),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),o=s(9761),a=s.n(o),n=s(4798),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);s.d(t,l);let c=["",{children:["docs",{children:["rust-guide",{children:["quickstart",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,7942)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\rust-guide\\quickstart\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\rust-guide\\quickstart\\page.tsx"],u="/docs/rust-guide/quickstart/page",p={require:s,loadChunk:()=>Promise.resolve()},m=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/rust-guide/quickstart/page",pathname:"/docs/rust-guide/quickstart",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},4357:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>c});var r=s(6741),i=s(8972),o=s(47),a=s(7678),n=s(3178),l=s(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,o.usePathname)(),[s,c]=(0,l.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{c(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=s.has(e.title),l=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(n.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||l)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>n});var r=s(9015),i=s(1471);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(a,{sections:o}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},7942:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l,metadata:()=>n});var r=s(9015),i=s(3288),o=s(7309),a=s(8951);let n={title:"Rust Quickstart",description:"Build your first PhilJS application with Rust and WebAssembly."};function l(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Rust Quickstart"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Build type-safe, high-performance web applications with Rust, compiled to WebAssembly. PhilJS brings fine-grained reactivity to Rust developers."}),r.jsx(o.U,{type:"info",title:"Why Rust + PhilJS?",children:(0,r.jsxs)("ul",{className:"list-disc list-inside space-y-1 mt-2",children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Type Safety"}),": Compile-time guarantees across your entire stack"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Performance"}),": Near-native speed with WASM, zero-cost abstractions"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Memory Safety"}),": No null pointers, no data races, no garbage collector"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Full-Stack Rust"}),": Same language for frontend, backend, and shared code"]})]})}),r.jsx("h2",{id:"prerequisites",children:"Prerequisites"}),r.jsx(i.oI,{commands:["# Install Rust (if not already installed)","curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh","","# Add WASM target","rustup target add wasm32-unknown-unknown","","# Install cargo-philjs","cargo install cargo-philjs"]}),r.jsx("h2",{id:"create-project",children:"Create a New Project"}),r.jsx(i.oI,{commands:["# Create a new full-stack project","cargo philjs new my-app --template fullstack","cd my-app","","# Or choose a specific template","cargo philjs new my-app --template minimal","cargo philjs new my-app --template ssr","cargo philjs new my-app --template liveview"]}),r.jsx("h2",{id:"project-structure",children:"Project Structure"}),r.jsx(i.dn,{code:`my-app/
├── Cargo.toml           # Rust dependencies
├── src/
│   ├── lib.rs           # WASM entry point
│   ├── app.rs           # Root component
│   └── components/      # UI components
│       ├── mod.rs
│       ├── header.rs
│       └── counter.rs
├── server/              # (Full-stack only)
│   ├── main.rs          # Server entry
│   └── routes/          # API routes
├── static/              # Static assets
│   └── styles.css
└── index.html           # HTML template`,language:"text",filename:"Project Structure"}),r.jsx("h2",{id:"first-component",children:"Your First Component"}),r.jsx(i.dn,{code:`// src/lib.rs
use philjs::prelude::*;
use wasm_bindgen::prelude::*;

mod components;
use components::app::App;

#[wasm_bindgen(start)]
pub fn main() {
    // Set up panic handler for better error messages
    console_error_panic_hook::set_once();

    // Mount the app to the DOM
    mount_to_body(App);
}

// src/components/app.rs
use philjs::prelude::*;
use super::counter::Counter;

#[component]
pub fn App() -> impl IntoView {
    view! {
        <main class="container">
            <h1>"Welcome to PhilJS"</h1>
            <p>"Built with Rust and WebAssembly"</p>
            <Counter />
        </main>
    }
}

// src/components/counter.rs
use philjs::prelude::*;

#[component]
pub fn Counter() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <div class="counter">
            <button on:click=move |_| set_count.update(|n| *n -= 1)>
                "-"
            </button>
            <span class="count">{count}</span>
            <button on:click=move |_| set_count.update(|n| *n += 1)>
                "+"
            </button>
        </div>
    }
}`,language:"rust",filename:"First Component"}),r.jsx("h2",{id:"reactivity",children:"Reactivity System"}),r.jsx("h3",{id:"signals",children:"Signals"}),r.jsx(i.dn,{code:`use philjs::prelude::*;

#[component]
fn ReactivityDemo() -> impl IntoView {
    // Basic signal
    let (name, set_name) = create_signal(String::from("World"));

    // Derived signal (like useMemo)
    let greeting = create_memo(move || {
        format!("Hello, {}!", name())
    });

    // Effect (runs when dependencies change)
    create_effect(move || {
        log::info!("Name changed to: {}", name());
    });

    view! {
        <div>
            <input
                type="text"
                prop:value=name
                on:input=move |ev| {
                    set_name(event_target_value(&ev));
                }
            />
            <p>{greeting}</p>
        </div>
    }
}`,language:"rust",filename:"Signals"}),r.jsx("h3",{id:"stores",children:"Stores (Nested State)"}),r.jsx(i.dn,{code:`use philjs::prelude::*;

#[derive(Clone, Debug)]
struct Todo {
    id: u32,
    text: String,
    completed: bool,
}

#[component]
fn TodoApp() -> impl IntoView {
    let (todos, set_todos) = create_store(Vec::<Todo>::new());
    let (input, set_input) = create_signal(String::new());

    let add_todo = move |_| {
        let text = input();
        if !text.is_empty() {
            set_todos.update(|todos| {
                let id = todos.len() as u32 + 1;
                todos.push(Todo { id, text, completed: false });
            });
            set_input(String::new());
        }
    };

    let toggle_todo = move |id: u32| {
        set_todos.update(|todos| {
            if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
                todo.completed = !todo.completed;
            }
        });
    };

    view! {
        <div class="todo-app">
            <div class="input-row">
                <input
                    type="text"
                    prop:value=input
                    on:input=move |ev| set_input(event_target_value(&ev))
                    on:keypress=move |ev| {
                        if ev.key() == "Enter" {
                            add_todo(());
                        }
                    }
                />
                <button on:click=add_todo>"Add"</button>
            </div>

            <ul class="todo-list">
                <For
                    each=move || todos.get().clone()
                    key=|todo| todo.id
                    children=move |todo| {
                        view! {
                            <li class:completed=todo.completed>
                                <input
                                    type="checkbox"
                                    prop:checked=todo.completed
                                    on:change=move |_| toggle_todo(todo.id)
                                />
                                <span>{todo.text.clone()}</span>
                            </li>
                        }
                    }
                />
            </ul>
        </div>
    }
}`,language:"rust",filename:"TodoApp.rs"}),r.jsx("h2",{id:"control-flow",children:"Control Flow"}),r.jsx(i.dn,{code:`use philjs::prelude::*;

#[component]
fn ControlFlowDemo() -> impl IntoView {
    let (show, set_show) = create_signal(true);
    let (items, _) = create_signal(vec!["Apple", "Banana", "Cherry"]);
    let (status, set_status) = create_signal("loading");

    view! {
        <div>
            // Conditional rendering
            <Show
                when=move || show()
                fallback=|| view! { <p>"Hidden"</p> }
            >
                <p>"Visible"</p>
            </Show>

            // List rendering
            <ul>
                <For
                    each=move || items()
                    key=|item| *item
                    children=|item| view! {
                        <li>{item}</li>
                    }
                />
            </ul>

            // Pattern matching
            {move || match status() {
                "loading" => view! { <Spinner /> }.into_view(),
                "error" => view! { <Error /> }.into_view(),
                "success" => view! { <Content /> }.into_view(),
                _ => view! { <p>"Unknown"</p> }.into_view(),
            }}

            <button on:click=move |_| set_show.update(|s| *s = !*s)>
                "Toggle"
            </button>
        </div>
    }
}`,language:"rust",filename:"ControlFlow.rs"}),r.jsx("h2",{id:"async",children:"Async Data Fetching"}),r.jsx(i.dn,{code:`use philjs::prelude::*;
use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}

async fn fetch_user(id: u32) -> Result<User, reqwest::Error> {
    let url = format!("https://api.example.com/users/{}", id);
    reqwest::get(&url).await?.json().await
}

#[component]
fn UserProfile(id: u32) -> impl IntoView {
    let user = create_resource(
        move || id,
        |id| async move { fetch_user(id).await }
    );

    view! {
        <Suspense fallback=move || view! { <p>"Loading..."</p> }>
            {move || user.get().map(|result| match result {
                Ok(user) => view! {
                    <div class="profile">
                        <h2>{&user.name}</h2>
                        <p>{&user.email}</p>
                    </div>
                }.into_view(),
                Err(e) => view! {
                    <p class="error">"Error: " {e.to_string()}</p>
                }.into_view(),
            })}
        </Suspense>
    }
}`,language:"rust",filename:"AsyncData.rs"}),r.jsx("h2",{id:"server-functions",children:"Server Functions"}),r.jsx("p",{children:"Call server-side Rust functions directly from your components:"}),r.jsx(i.dn,{code:`use philjs::prelude::*;
use philjs_server::*;

// This function runs on the server
#[server(CreateTodo)]
pub async fn create_todo(title: String) -> Result<Todo, ServerFnError> {
    // Access database, environment variables, etc.
    let todo = db::todos::create(&title).await?;
    Ok(todo)
}

#[component]
fn TodoForm() -> impl IntoView {
    let (title, set_title) = create_signal(String::new());
    let create = create_server_action::<CreateTodo>();

    view! {
        <form on:submit=move |ev| {
            ev.prevent_default();
            create.dispatch(CreateTodo { title: title() });
            set_title(String::new());
        }>
            <input
                type="text"
                prop:value=title
                on:input=move |ev| set_title(event_target_value(&ev))
            />
            <button type="submit" disabled=move || create.pending()>
                {move || if create.pending() { "Creating..." } else { "Create" }}
            </button>
        </form>
    }
}`,language:"rust",filename:"ServerFunctions.rs"}),r.jsx("h2",{id:"run-dev",children:"Run Development Server"}),r.jsx(i.oI,{commands:["# Start development server with hot reload","cargo philjs dev","","# Open http://localhost:8080"]}),r.jsx("h2",{id:"build-prod",children:"Build for Production"}),r.jsx(i.oI,{commands:["# Build optimized WASM","cargo philjs build --release","","# Output is in dist/ directory","ls dist/"]}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(a.default,{href:"/docs/rust-guide/cargo-philjs",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"cargo-philjs CLI"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Full CLI reference and commands"})]}),(0,r.jsxs)(a.default,{href:"/docs/rust-guide/axum-integration",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Axum Integration"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Full-stack apps with Axum backend"})]}),(0,r.jsxs)(a.default,{href:"/docs/rust-guide/view-macro",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"View Macro Syntax"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Complete view! macro reference"})]}),(0,r.jsxs)(a.default,{href:"/docs/rust-guide/server-functions",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Server Functions"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"RPC-style server communication"})]})]})]})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>o});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(3903));module.exports=r})();