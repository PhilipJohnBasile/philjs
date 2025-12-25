2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","7148","static/chunks/app/docs/tutorials/rust-fullstack/page-dc30113adef6594a.js"],"Terminal"]
3:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","7148","static/chunks/app/docs/tutorials/rust-fullstack/page-dc30113adef6594a.js"],"Callout"]
4:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","7148","static/chunks/app/docs/tutorials/rust-fullstack/page-dc30113adef6594a.js"],"CodeBlock"]
9:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","7148","static/chunks/app/docs/tutorials/rust-fullstack/page-dc30113adef6594a.js"],""]
a:I[6419,[],""]
b:I[8445,[],""]
c:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
d:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
e:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
f:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
5:T703,use philjs::prelude::*;
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
}6:T410,use axum::{
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
}7:T55c,use sea_orm::*;
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
}8:T4de,use philjs::prelude::*;
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
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["tutorials",{"children":["rust-fullstack",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["tutorials",{"children":["rust-fullstack",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Rust Full-Stack Guide"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"Build high-performance full-stack applications with PhilJS and Rust using Axum, WASM, and server functions."}],["$","h2",null,{"id":"overview","children":"Overview"}],["$","p",null,{"children":"PhilJS offers first-class Rust support, allowing you to build entire full-stack applications in Rust. This guide covers everything from setup to deployment."}],["$","h3",null,{"children":"What You'll Learn"}],["$","ul",null,{"children":[["$","li",null,{"children":"Setting up a Rust + PhilJS project"}],["$","li",null,{"children":"Using the view! macro for type-safe components"}],["$","li",null,{"children":"Creating server functions with Axum"}],["$","li",null,{"children":"Database integration with SeaORM"}],["$","li",null,{"children":"Building and deploying WASM applications"}],["$","li",null,{"children":"Server-side rendering in Rust"}]]}],["$","h2",null,{"id":"prerequisites","children":"Prerequisites"}],["$","$L2",null,{"commands":["rustup --version","cargo --version"]}],["$","$L3",null,{"type":"info","title":"Rust Version","children":["PhilJS requires Rust 1.75 or later. Update with ",["$","code",null,{"children":"rustup update stable"}],"."]}],["$","h2",null,{"id":"installation","children":"Installation"}],["$","p",null,{"children":"Install the PhilJS cargo extension:"}],["$","$L2",null,{"commands":["cargo install cargo-philjs","cargo philjs new fullstack-app","cd fullstack-app"]}],["$","p",null,{"children":"This creates a new project with the following structure:"}],["$","$L4",null,{"code":"fullstack-app/\n├── Cargo.toml\n├── src/\n│   ├── main.rs           # Server entry point\n│   ├── app.rs            # Root component\n│   ├── components/       # UI components\n│   ├── server/           # Server functions\n│   └── lib.rs            # Shared code\n├── static/               # Static assets\n└── migrations/           # Database migrations","language":"text"}],["$","h2",null,{"id":"view-macro","children":"The view! Macro"}],["$","p",null,{"children":["PhilJS provides a powerful ",["$","code",null,{"children":"view!"}]," macro for building UI in Rust:"]}],["$","$L4",null,{"code":"use philjs::prelude::*;\n\n#[component]\npub fn App() -> impl IntoView {\n    let (count, set_count) = create_signal(0);\n\n    view! {\n        <div class=\"app\">\n            <h1>\"Counter: \" {count}</h1>\n            <button on:click=move |_| set_count.update(|n| *n + 1)>\n                \"Increment\"\n            </button>\n        </div>\n    }\n}\n\nfn main() {\n    philjs::mount_to_body(App);\n}","language":"rust","filename":"src/app.rs"}],["$","$L3",null,{"type":"success","title":"Type Safety","children":"The view! macro is fully type-checked at compile time. Typos and type errors are caught before your code even runs!"}],["$","h2",null,{"id":"components","children":"Creating Components"}],["$","$L4",null,{"code":"use philjs::prelude::*;\n\n#[component]\npub fn TodoItem(\n    #[prop] todo: Todo,\n    #[prop] on_toggle: Callback<String>,\n    #[prop] on_delete: Callback<String>,\n) -> impl IntoView {\n    view! {\n        <li class:completed={todo.completed}>\n            <input\n                type=\"checkbox\"\n                checked={todo.completed}\n                on:change=move |_| on_toggle.call(todo.id.clone())\n            />\n            <span>{&todo.text}</span>\n            <button on:click=move |_| on_delete.call(todo.id.clone())>\n                \"Delete\"\n            </button>\n        </li>\n    }\n}\n\n#[derive(Clone, PartialEq)]\npub struct Todo {\n    pub id: String,\n    pub text: String,\n    pub completed: bool,\n}","language":"rust","filename":"src/components/todo_item.rs"}],["$","h2",null,{"id":"server-functions","children":"Server Functions"}],["$","p",null,{"children":"Server functions let you call server-side code from the client seamlessly:"}],["$","$L4",null,{"code":"$5","language":"rust","filename":"src/server/todos.rs"}],["$","h2",null,{"id":"axum-integration","children":"Axum Integration"}],["$","p",null,{"children":"PhilJS integrates seamlessly with Axum for the server:"}],["$","$L4",null,{"code":"$6","language":"rust","filename":"src/main.rs"}],["$","h2",null,{"id":"database","children":"Database Integration with SeaORM"}],["$","$L4",null,{"code":"$7","language":"rust","filename":"src/db/todos.rs"}],["$","h2",null,{"id":"state-management","children":"Global State Management"}],["$","$L4",null,{"code":"$8","language":"rust","filename":"src/state.rs"}],["$","h2",null,{"id":"wasm-build","children":"Building for WASM"}],["$","p",null,{"children":"Compile your PhilJS Rust app to WebAssembly:"}],["$","$L2",null,{"commands":["cargo philjs build --release","cargo philjs serve"]}],["$","p",null,{"children":"The build process:"}],["$","ol",null,{"children":[["$","li",null,{"children":"Compiles Rust code to WASM"}],["$","li",null,{"children":"Generates JavaScript bindings"}],["$","li",null,{"children":"Optimizes WASM binary with wasm-opt"}],["$","li",null,{"children":"Bundles with your static assets"}]]}],["$","$L3",null,{"type":"info","title":"Bundle Size","children":"PhilJS Rust apps compile to small WASM bundles (typically 50-150KB gzipped) with excellent performance characteristics."}],["$","h2",null,{"id":"deployment","children":"Deployment"}],["$","h3",null,{"children":"Docker Deployment"}],["$","$L4",null,{"code":"FROM rust:1.75 as builder\nWORKDIR /app\nCOPY . .\nRUN cargo install cargo-philjs\nRUN cargo philjs build --release\n\nFROM debian:bookworm-slim\nRUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*\nCOPY --from=builder /app/target/release/fullstack-app /usr/local/bin/\nCOPY --from=builder /app/static /app/static\n\nENV RUST_LOG=info\nEXPOSE 3000\n\nCMD [\"fullstack-app\"]","language":"dockerfile","filename":"Dockerfile"}],["$","h3",null,{"children":"Shuttle.rs Deployment"}],["$","$L4",null,{"code":"use shuttle_axum::ShuttleAxum;\n\n#[shuttle_runtime::main]\nasync fn main() -> ShuttleAxum {\n    let router = create_router().await;\n    Ok(router.into())\n}\n\n// Deploy with:\n// cargo shuttle deploy","language":"rust","filename":"src/main.rs"}],["$","h2",null,{"id":"performance","children":"Performance Tips"}],["$","ul",null,{"children":[["$","li",null,{"children":[["$","strong",null,{"children":"Use memoization:"}]," ",["$","code",null,{"children":"create_memo"}]," for expensive computations"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Lazy loading:"}]," Split code with dynamic imports"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Resource pooling:"}]," Reuse database connections"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Caching:"}]," Cache server function results when appropriate"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Streaming SSR:"}]," Stream HTML for faster Time to First Byte"]}]]}],["$","$L4",null,{"code":"// Streaming SSR example\nuse philjs_axum::ResponseOptions;\n\n#[component]\npub fn StreamingApp() -> impl IntoView {\n    view! {\n        <Suspense fallback=|| view! { <p>\"Loading...\"</p> }>\n            <AsyncContent/>\n        </Suspense>\n    }\n}\n\n#[component]\nasync fn AsyncContent() -> impl IntoView {\n    let data = fetch_data().await;\n    view! { <div>{data}</div> }\n}","language":"rust"}],["$","h2",null,{"id":"testing","children":"Testing"}],["$","$L4",null,{"code":"#[cfg(test)]\nmod tests {\n    use super::*;\n    use philjs::testing::*;\n\n    #[test]\n    fn test_counter() {\n        let runtime = create_runtime();\n\n        runtime.run(|| {\n            let (count, set_count) = create_signal(0);\n\n            assert_eq!(count.get(), 0);\n            set_count.set(5);\n            assert_eq!(count.get(), 5);\n        });\n    }\n\n    #[tokio::test]\n    async fn test_server_function() {\n        let result = create_todo(\"Test\".to_string()).await;\n        assert!(result.is_ok());\n    }\n}","language":"rust","filename":"src/tests.rs"}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","ul",null,{"children":[["$","li",null,{"children":["Explore the ",["$","$L9",null,{"href":"/docs/rust/view-macro","children":"view! macro syntax"}]]}],["$","li",null,{"children":["Learn about ",["$","$L9",null,{"href":"/docs/rust/server-functions","children":"server functions"}]]}],["$","li",null,{"children":["Check out ",["$","$L9",null,{"href":"/docs/rust/axum","children":"Axum integration"}]]}],["$","li",null,{"children":["Read the ",["$","$L9",null,{"href":"/docs/rust/wasm","children":"WASM deployment guide"}]]}]]}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L9",null,{"href":"/docs/tutorials/migration-from-react","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Migration from React"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Learn how to migrate React apps to PhilJS"}]]}],["$","$L9",null,{"href":"/examples","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Example Gallery"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Explore full example applications"}]]}]]}]]}],null],null],null]},[null,["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","tutorials","children","rust-fullstack","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","tutorials","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$Lc",null,{"sections":"$d"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Le",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Lf",null,{}],["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$L10",null]]]]
10:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Rust Full-Stack Guide | PhilJS"}],["$","meta","3",{"name":"description","content":"Build high-performance full-stack applications with PhilJS and Rust using Axum, WASM, and server functions."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
