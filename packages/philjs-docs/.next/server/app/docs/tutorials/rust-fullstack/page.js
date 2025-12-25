(()=>{var e={};e.id=7148,e.ids=[7148],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},9650:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>a.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>d,routeModule:()=>h,tree:()=>c}),s(2807),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),o=s(9761),a=s.n(o),l=s(4798),n={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(n[e]=()=>l[e]);s.d(t,n);let c=["",{children:["docs",{children:["tutorials",{children:["rust-fullstack",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,2807)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\tutorials\\rust-fullstack\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\tutorials\\rust-fullstack\\page.tsx"],u="/docs/tutorials/rust-fullstack/page",p={require:s,loadChunk:()=>Promise.resolve()},h=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/tutorials/rust-fullstack/page",pathname:"/docs/tutorials/rust-fullstack",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},4357:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>c});var r=s(6741),i=s(8972),o=s(47),a=s(7678),l=s(3178),n=s(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,o.usePathname)(),[s,c]=(0,n.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{c(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=s.has(e.title),n=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(l.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||n)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l});var r=s(9015),i=s(1471);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function l({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(a,{sections:o}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},2807:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>n,metadata:()=>l});var r=s(9015),i=s(3288),o=s(7309),a=s(8951);let l={title:"Rust Full-Stack Guide",description:"Build high-performance full-stack applications with PhilJS and Rust using Axum, WASM, and server functions."};function n(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Rust Full-Stack Guide"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Build high-performance full-stack applications with PhilJS and Rust using Axum, WASM, and server functions."}),r.jsx("h2",{id:"overview",children:"Overview"}),r.jsx("p",{children:"PhilJS offers first-class Rust support, allowing you to build entire full-stack applications in Rust. This guide covers everything from setup to deployment."}),r.jsx("h3",{children:"What You'll Learn"}),(0,r.jsxs)("ul",{children:[r.jsx("li",{children:"Setting up a Rust + PhilJS project"}),r.jsx("li",{children:"Using the view! macro for type-safe components"}),r.jsx("li",{children:"Creating server functions with Axum"}),r.jsx("li",{children:"Database integration with SeaORM"}),r.jsx("li",{children:"Building and deploying WASM applications"}),r.jsx("li",{children:"Server-side rendering in Rust"})]}),r.jsx("h2",{id:"prerequisites",children:"Prerequisites"}),r.jsx(i.oI,{commands:["rustup --version","cargo --version"]}),(0,r.jsxs)(o.U,{type:"info",title:"Rust Version",children:["PhilJS requires Rust 1.75 or later. Update with ",r.jsx("code",{children:"rustup update stable"}),"."]}),r.jsx("h2",{id:"installation",children:"Installation"}),r.jsx("p",{children:"Install the PhilJS cargo extension:"}),r.jsx(i.oI,{commands:["cargo install cargo-philjs","cargo philjs new fullstack-app","cd fullstack-app"]}),r.jsx("p",{children:"This creates a new project with the following structure:"}),r.jsx(i.dn,{code:`fullstack-app/
├── Cargo.toml
├── src/
│   ├── main.rs           # Server entry point
│   ├── app.rs            # Root component
│   ├── components/       # UI components
│   ├── server/           # Server functions
│   └── lib.rs            # Shared code
├── static/               # Static assets
└── migrations/           # Database migrations`,language:"text"}),r.jsx("h2",{id:"view-macro",children:"The view! Macro"}),(0,r.jsxs)("p",{children:["PhilJS provides a powerful ",r.jsx("code",{children:"view!"})," macro for building UI in Rust:"]}),r.jsx(i.dn,{code:`use philjs::prelude::*;

#[component]
pub fn App() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <div class="app">
            <h1>"Counter: " {count}</h1>
            <button on:click=move |_| set_count.update(|n| *n + 1)>
                "Increment"
            </button>
        </div>
    }
}

fn main() {
    philjs::mount_to_body(App);
}`,language:"rust",filename:"src/app.rs"}),r.jsx(o.U,{type:"success",title:"Type Safety",children:"The view! macro is fully type-checked at compile time. Typos and type errors are caught before your code even runs!"}),r.jsx("h2",{id:"components",children:"Creating Components"}),r.jsx(i.dn,{code:`use philjs::prelude::*;

#[component]
pub fn TodoItem(
    #[prop] todo: Todo,
    #[prop] on_toggle: Callback<String>,
    #[prop] on_delete: Callback<String>,
) -> impl IntoView {
    view! {
        <li class:completed={todo.completed}>
            <input
                type="checkbox"
                checked={todo.completed}
                on:change=move |_| on_toggle.call(todo.id.clone())
            />
            <span>{&todo.text}</span>
            <button on:click=move |_| on_delete.call(todo.id.clone())>
                "Delete"
            </button>
        </li>
    }
}

#[derive(Clone, PartialEq)]
pub struct Todo {
    pub id: String,
    pub text: String,
    pub completed: bool,
}`,language:"rust",filename:"src/components/todo_item.rs"}),r.jsx("h2",{id:"server-functions",children:"Server Functions"}),r.jsx("p",{children:"Server functions let you call server-side code from the client seamlessly:"}),r.jsx(i.dn,{code:`use philjs::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct Todo {
    pub id: String,
    pub text: String,
    pub completed: bool,
}

// Server function - runs only on the server
#[server(GetTodos, "/api")]
pub async fn get_todos() -> Result<Vec<Todo>, ServerFnError> {
    use crate::db;

    let todos = db::get_all_todos().await?;
    Ok(todos)
}

#[server(CreateTodo, "/api")]
pub async fn create_todo(text: String) -> Result<Todo, ServerFnError> {
    use crate::db;

    let todo = db::create_todo(text).await?;
    Ok(todo)
}

#[server(ToggleTodo, "/api")]
pub async fn toggle_todo(id: String) -> Result<(), ServerFnError> {
    use crate::db;

    db::toggle_todo(&id).await?;
    Ok(())
}

// Client-side usage
#[component]
pub fn TodoList() -> impl IntoView {
    let todos = create_resource(|| (), |_| async { get_todos().await });

    let create = create_action(|text: &String| {
        let text = text.clone();
        async move { create_todo(text).await }
    });

    view! {
        <div>
            <Suspense fallback=|| view! { <p>"Loading..."</p> }>
                {move || todos.get().map(|result| match result {
                    Ok(todos) => view! {
                        <ul>
                            <For
                                each=move || todos.clone()
                                key=|todo| todo.id.clone()
                                let:todo
                            >
                                <TodoItem todo={todo}/>
                            </For>
                        </ul>
                    }.into_view(),
                    Err(e) => view! { <p>"Error: " {e.to_string()}</p> }.into_view(),
                })}
            </Suspense>
        </div>
    }
}`,language:"rust",filename:"src/server/todos.rs"}),r.jsx("h2",{id:"axum-integration",children:"Axum Integration"}),r.jsx("p",{children:"PhilJS integrates seamlessly with Axum for the server:"}),r.jsx(i.dn,{code:`use axum::{
    routing::{get, post},
    Router,
};
use philjs_axum::{generate_route_list, PhilJsRoutes};
use tower_http::services::ServeDir;

mod app;
mod server;

#[tokio::main]
async fn main() {
    // Generate routes from PhilJS app
    let conf = philjs::get_configuration(None).await.unwrap();
    let philjs_routes = generate_route_list(app::App);

    let app = Router::new()
        // Serve static files
        .nest_service("/static", ServeDir::new("static"))
        // API routes
        .route("/api/todos", get(server::get_todos))
        .route("/api/todos", post(server::create_todo))
        // PhilJS SSR routes
        .philjs_routes(&philjs_routes, app::App)
        // Fallback to PhilJS router
        .fallback(philjs_axum::render_app_async(
            philjs_routes.clone(),
            app::App,
        ));

    println!("Listening on http://127.0.0.1:3000");
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();

    axum::serve(listener, app).await.unwrap();
}`,language:"rust",filename:"src/main.rs"}),r.jsx("h2",{id:"database",children:"Database Integration with SeaORM"}),r.jsx(i.dn,{code:`use sea_orm::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "todos")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    pub text: String,
    pub completed: bool,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

// Database operations
pub async fn get_all_todos(db: &DatabaseConnection) -> Result<Vec<Model>, DbErr> {
    Entity::find()
        .order_by_desc(Column::CreatedAt)
        .all(db)
        .await
}

pub async fn create_todo(
    db: &DatabaseConnection,
    text: String,
) -> Result<Model, DbErr> {
    let todo = ActiveModel {
        id: Set(uuid::Uuid::new_v4().to_string()),
        text: Set(text),
        completed: Set(false),
        created_at: Set(chrono::Utc::now()),
    };

    todo.insert(db).await
}

pub async fn toggle_todo(
    db: &DatabaseConnection,
    id: &str,
) -> Result<Model, DbErr> {
    let todo = Entity::find_by_id(id).one(db).await?;

    if let Some(todo) = todo {
        let mut todo: ActiveModel = todo.into();
        todo.completed = Set(!todo.completed.unwrap());
        todo.update(db).await
    } else {
        Err(DbErr::RecordNotFound(id.to_string()))
    }
}`,language:"rust",filename:"src/db/todos.rs"}),r.jsx("h2",{id:"state-management",children:"Global State Management"}),r.jsx(i.dn,{code:`use philjs::prelude::*;
use std::rc::Rc;

#[derive(Clone)]
pub struct AppState {
    pub user: RwSignal<Option<User>>,
    pub theme: RwSignal<Theme>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            user: create_rw_signal(None),
            theme: create_rw_signal(Theme::Light),
        }
    }
}

#[component]
pub fn App() -> impl IntoView {
    let state = AppState::new();
    provide_context(state.clone());

    view! {
        <Router>
            <Routes>
                <Route path="/" view=Home/>
                <Route path="/profile" view=Profile/>
            </Routes>
        </Router>
    }
}

// Use in child components
#[component]
pub fn Profile() -> impl IntoView {
    let state = use_context::<AppState>()
        .expect("AppState context missing");

    view! {
        <Show
            when=move || state.user.get().is_some()
            fallback=|| view! { <p>"Please log in"</p> }
        >
            {move || {
                let user = state.user.get().unwrap();
                view! {
                    <div>
                        <h1>{&user.name}</h1>
                        <p>{&user.email}</p>
                    </div>
                }
            }}
        </Show>
    }
}`,language:"rust",filename:"src/state.rs"}),r.jsx("h2",{id:"wasm-build",children:"Building for WASM"}),r.jsx("p",{children:"Compile your PhilJS Rust app to WebAssembly:"}),r.jsx(i.oI,{commands:["cargo philjs build --release","cargo philjs serve"]}),r.jsx("p",{children:"The build process:"}),(0,r.jsxs)("ol",{children:[r.jsx("li",{children:"Compiles Rust code to WASM"}),r.jsx("li",{children:"Generates JavaScript bindings"}),r.jsx("li",{children:"Optimizes WASM binary with wasm-opt"}),r.jsx("li",{children:"Bundles with your static assets"})]}),r.jsx(o.U,{type:"info",title:"Bundle Size",children:"PhilJS Rust apps compile to small WASM bundles (typically 50-150KB gzipped) with excellent performance characteristics."}),r.jsx("h2",{id:"deployment",children:"Deployment"}),r.jsx("h3",{children:"Docker Deployment"}),r.jsx(i.dn,{code:`FROM rust:1.75 as builder
WORKDIR /app
COPY . .
RUN cargo install cargo-philjs
RUN cargo philjs build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/fullstack-app /usr/local/bin/
COPY --from=builder /app/static /app/static

ENV RUST_LOG=info
EXPOSE 3000

CMD ["fullstack-app"]`,language:"dockerfile",filename:"Dockerfile"}),r.jsx("h3",{children:"Shuttle.rs Deployment"}),r.jsx(i.dn,{code:`use shuttle_axum::ShuttleAxum;

#[shuttle_runtime::main]
async fn main() -> ShuttleAxum {
    let router = create_router().await;
    Ok(router.into())
}

// Deploy with:
// cargo shuttle deploy`,language:"rust",filename:"src/main.rs"}),r.jsx("h2",{id:"performance",children:"Performance Tips"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Use memoization:"})," ",r.jsx("code",{children:"create_memo"})," for expensive computations"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Lazy loading:"})," Split code with dynamic imports"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Resource pooling:"})," Reuse database connections"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Caching:"})," Cache server function results when appropriate"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Streaming SSR:"})," Stream HTML for faster Time to First Byte"]})]}),r.jsx(i.dn,{code:`// Streaming SSR example
use philjs_axum::ResponseOptions;

#[component]
pub fn StreamingApp() -> impl IntoView {
    view! {
        <Suspense fallback=|| view! { <p>"Loading..."</p> }>
            <AsyncContent/>
        </Suspense>
    }
}

#[component]
async fn AsyncContent() -> impl IntoView {
    let data = fetch_data().await;
    view! { <div>{data}</div> }
}`,language:"rust"}),r.jsx("h2",{id:"testing",children:"Testing"}),r.jsx(i.dn,{code:`#[cfg(test)]
mod tests {
    use super::*;
    use philjs::testing::*;

    #[test]
    fn test_counter() {
        let runtime = create_runtime();

        runtime.run(|| {
            let (count, set_count) = create_signal(0);

            assert_eq!(count.get(), 0);
            set_count.set(5);
            assert_eq!(count.get(), 5);
        });
    }

    #[tokio::test]
    async fn test_server_function() {
        let result = create_todo("Test".to_string()).await;
        assert!(result.is_ok());
    }
}`,language:"rust",filename:"src/tests.rs"}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:["Explore the ",r.jsx(a.default,{href:"/docs/rust/view-macro",children:"view! macro syntax"})]}),(0,r.jsxs)("li",{children:["Learn about ",r.jsx(a.default,{href:"/docs/rust/server-functions",children:"server functions"})]}),(0,r.jsxs)("li",{children:["Check out ",r.jsx(a.default,{href:"/docs/rust/axum",children:"Axum integration"})]}),(0,r.jsxs)("li",{children:["Read the ",r.jsx(a.default,{href:"/docs/rust/wasm",children:"WASM deployment guide"})]})]}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(a.default,{href:"/docs/tutorials/migration-from-react",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Migration from React"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn how to migrate React apps to PhilJS"})]}),(0,r.jsxs)(a.default,{href:"/examples",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Example Gallery"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Explore full example applications"})]})]})]})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>o});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(9650));module.exports=r})();