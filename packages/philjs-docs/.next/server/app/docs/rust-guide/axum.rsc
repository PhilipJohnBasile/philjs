2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","1266","static/chunks/app/docs/rust-guide/axum/page-cf4ef42417437f2b.js"],"Terminal"]
3:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","1266","static/chunks/app/docs/rust-guide/axum/page-cf4ef42417437f2b.js"],"CodeBlock"]
9:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","1266","static/chunks/app/docs/rust-guide/axum/page-cf4ef42417437f2b.js"],""]
a:I[6419,[],""]
b:I[8445,[],""]
c:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
d:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
e:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
f:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
4:T703,// src/main.rs
use axum::{
    routing::{get, post},
    Router,
    Extension,
};
use philjs::*;
use philjs_axum::*;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::services::ServeDir;

mod app;
mod api;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::init();

    // Set up database connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&std::env::var("DATABASE_URL").unwrap())
        .await
        .expect("Failed to create pool");

    // Configure PhilJS
    let conf = get_configuration(None).await.unwrap();
    let philjs_options = PhiljsOptions::builder()
        .output_name("bundle")
        .site_pkg_dir("pkg")
        .build();
    let routes = generate_route_list(app::App);

    // Build the router
    let app = Router::new()
        // API routes
        .route("/api/health", get(api::health))
        .route("/api/todos", get(api::get_todos).post(api::create_todo))
        .route("/api/todos/:id", get(api::get_todo).delete(api::delete_todo))
        // Server functions
        .philjs_routes(&philjs_options, routes.clone(), app::App)
        // Static files
        .nest_service("/pkg", ServeDir::new("pkg"))
        .nest_service("/assets", ServeDir::new("assets"))
        // SSR fallback
        .fallback(philjs_axum::render_app_to_stream(
            philjs_options.clone(),
            app::App,
        ))
        // Extensions
        .layer(Extension(pool))
        .layer(Extension(philjs_options));

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}5:T461,// src/app.rs
use philjs::*;
use philjs_meta::*;
use philjs_router::*;

mod pages;
use pages::*;

#[component]
pub fn App() -> impl IntoView {
    provide_meta_context();

    view! {
        <Html lang="en"/>
        <Meta charset="utf-8"/>
        <Meta name="viewport" content="width=device-width, initial-scale=1"/>

        <Title>"My PhilJS App"</Title>
        <Stylesheet href="/assets/styles.css"/>

        <Router>
            <header>
                <nav>
                    <A href="/">"Home"</A>
                    <A href="/todos">"Todos"</A>
                    <A href="/about">"About"</A>
                </nav>
            </header>

            <main>
                <Routes>
                    <Route path="/" view=HomePage/>
                    <Route path="/todos" view=TodosPage/>
                    <Route path="/todos/:id" view=TodoDetailPage/>
                    <Route path="/about" view=AboutPage/>
                    <Route path="/*" view=NotFoundPage/>
                </Routes>
            </main>
        </Router>

        // Hydration scripts
        <HydrationScripts/>
    }
}6:T74c,// src/api.rs
use axum::{
    extract::{Extension, Path, Json},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, Serialize, Deserialize)]
pub struct Todo {
    pub id: i32,
    pub title: String,
    pub completed: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateTodo {
    pub title: String,
}

pub async fn health() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}

pub async fn get_todos(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<Todo>>, StatusCode> {
    let todos = sqlx::query_as!(Todo, "SELECT * FROM todos ORDER BY id")
        .fetch_all(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(todos))
}

pub async fn get_todo(
    Path(id): Path<i32>,
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Todo>, StatusCode> {
    let todo = sqlx::query_as!(Todo, "SELECT * FROM todos WHERE id = $1", id)
        .fetch_optional(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(todo))
}

pub async fn create_todo(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<CreateTodo>,
) -> Result<Json<Todo>, StatusCode> {
    let todo = sqlx::query_as!(
        Todo,
        "INSERT INTO todos (title, completed) VALUES ($1, false) RETURNING *",
        payload.title
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(todo))
}

pub async fn delete_todo(
    Path(id): Path<i32>,
    Extension(pool): Extension<PgPool>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query!("DELETE FROM todos WHERE id = $1", id)
        .execute(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}7:T7f0,// src/pages/todos.rs
use philjs::*;
use philjs_router::*;

#[component]
pub fn TodosPage() -> impl IntoView {
    // This resource will be pre-fetched on the server
    let todos = create_resource(
        || (),
        |_| async move {
            get_todos().await
        }
    );

    view! {
        <Title>"Todos | My App"</Title>

        <h1>"My Todos"</h1>

        <Suspense fallback=move || view! { <p>"Loading..."</p> }>
            {move || todos.get().map(|result| match result {
                Ok(todos) => view! {
                    <ul class="todo-list">
                        <For
                            each=move || todos.clone()
                            key=|todo| todo.id
                            children=|todo| view! {
                                <li>
                                    <A href=format!("/todos/{}", todo.id)>
                                        {&todo.title}
                                    </A>
                                </li>
                            }
                        />
                    </ul>
                }.into_view(),
                Err(e) => view! {
                    <p class="error">{e.to_string()}</p>
                }.into_view(),
            })}
        </Suspense>

        <TodoForm/>
    }
}

#[component]
fn TodoForm() -> impl IntoView {
    let create_todo = create_server_action::<CreateTodo>();
    let (title, set_title) = create_signal(String::new());

    view! {
        <form on:submit=move |ev| {
            ev.prevent_default();
            create_todo.dispatch(CreateTodo { title: title() });
            set_title(String::new());
        }>
            <input
                type="text"
                prop:value=title
                on:input=move |ev| set_title(event_target_value(&ev))
                placeholder="What needs to be done?"
            />
            <button type="submit" disabled=move || create_todo.pending()>
                "Add Todo"
            </button>
        </form>
    }
}8:T535,use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use axum_extra::extract::CookieJar;

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub id: i32,
    pub email: String,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let cookies = CookieJar::from_request_parts(parts, state)
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

        let session_token = cookies
            .get("session")
            .map(|c| c.value().to_string())
            .ok_or(StatusCode::UNAUTHORIZED)?;

        // Validate session and get user
        let user = validate_session(&session_token)
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

        Ok(user)
    }
}

// Protected API route
pub async fn get_profile(
    user: AuthUser,
) -> Json<AuthUser> {
    Json(user)
}

// Protected server function
#[server(GetUserData)]
pub async fn get_user_data() -> Result<UserData, ServerFnError> {
    let user = expect_context::<AuthUser>()
        .map_err(|_| ServerFnError::ServerError("Unauthorized".into()))?;

    // Fetch user-specific data
    Ok(fetch_user_data(user.id).await?)
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["rust-guide",{"children":["axum",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["rust-guide",{"children":["axum",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Axum Integration"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"PhilJS integrates seamlessly with Axum, the popular Rust web framework, to build full-stack applications with shared types and server-side rendering."}],["$","h2",null,{"id":"setup","children":"Project Setup"}],["$","$L2",null,{"commands":["# Create a new full-stack project","cargo philjs new my-app --template fullstack","cd my-app"]}],["$","h3",null,{"children":"Cargo.toml"}],["$","$L3",null,{"code":"[package]\nname = \"my-app\"\nversion = \"0.1.0\"\nedition = \"2021\"\n\n[lib]\ncrate-type = [\"cdylib\", \"rlib\"]\n\n[dependencies]\nphiljs = { version = \"2.0\", features = [\"csr\", \"hydrate\", \"ssr\"] }\nphiljs-axum = \"2.0\"\nphiljs-router = \"2.0\"\nphiljs-meta = \"2.0\"\n\naxum = \"0.7\"\ntokio = { version = \"1\", features = [\"full\"] }\ntower = \"0.4\"\ntower-http = { version = \"0.5\", features = [\"fs\", \"compression-gzip\"] }\n\nserde = { version = \"1\", features = [\"derive\"] }\nsqlx = { version = \"0.7\", features = [\"postgres\", \"runtime-tokio\"] }\n\n# WASM dependencies\nwasm-bindgen = \"0.2\"\nconsole_error_panic_hook = \"0.1\"\n\n[features]\ndefault = [\"ssr\"]\nssr = [\"philjs/ssr\", \"philjs-axum/ssr\"]\nhydrate = [\"philjs/hydrate\"]\ncsr = [\"philjs/csr\"]","language":"toml","filename":"Cargo.toml"}],["$","h2",null,{"id":"server-setup","children":"Server Setup"}],["$","$L3",null,{"code":"$4","language":"rust","filename":"src/main.rs"}],["$","h2",null,{"id":"app-component","children":"App Component"}],["$","$L3",null,{"code":"$5","language":"rust","filename":"src/app.rs"}],["$","h2",null,{"id":"api-routes","children":"API Routes"}],["$","$L3",null,{"code":"$6","language":"rust","filename":"src/api.rs"}],["$","h2",null,{"id":"ssr","children":"Server-Side Rendering"}],["$","$L3",null,{"code":"$7","language":"rust","filename":"src/pages/todos.rs"}],["$","h2",null,{"id":"authentication","children":"Authentication"}],["$","$L3",null,{"code":"$8","language":"rust"}],["$","h2",null,{"id":"middleware","children":"Middleware"}],["$","$L3",null,{"code":"use axum::middleware::{self, Next};\nuse axum::response::Response;\nuse axum::http::Request;\nuse std::time::Instant;\n\n// Logging middleware\npub async fn logging<B>(\n    request: Request<B>,\n    next: Next<B>,\n) -> Response {\n    let start = Instant::now();\n    let method = request.method().clone();\n    let uri = request.uri().clone();\n\n    let response = next.run(request).await;\n\n    let duration = start.elapsed();\n    tracing::info!(\n        method = %method,\n        uri = %uri,\n        status = %response.status(),\n        duration = ?duration,\n    );\n\n    response\n}\n\n// Apply middleware\nlet app = Router::new()\n    .route(\"/api/*\", api_routes)\n    .layer(middleware::from_fn(logging))\n    .layer(tower_http::compression::CompressionLayer::new())\n    .layer(tower_http::cors::CorsLayer::permissive());","language":"rust"}],["$","h2",null,{"id":"deployment","children":"Deployment"}],["$","$L2",null,{"commands":["# Build for production","cargo philjs build --release","","# The build output includes:","# - target/release/my-app (server binary)","# - pkg/ (WASM and JS bundles)","# - assets/ (static files)"]}],["$","h3",null,{"children":"Docker Deployment"}],["$","$L3",null,{"code":"FROM rust:1.75 as builder\n\nWORKDIR /app\nCOPY . .\n\n# Install wasm-pack\nRUN cargo install wasm-pack cargo-philjs\n\n# Build the application\nRUN cargo philjs build --release\n\nFROM debian:bookworm-slim\n\nWORKDIR /app\n\n# Copy built artifacts\nCOPY --from=builder /app/target/release/my-app ./\nCOPY --from=builder /app/pkg ./pkg\nCOPY --from=builder /app/assets ./assets\n\nENV PORT=3000\nEXPOSE 3000\n\nCMD [\"./my-app\"]","language":"dockerfile","filename":"Dockerfile"}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L9",null,{"href":"/docs/rust-guide/wasm","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"WASM Deployment"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Deploy client-only WASM apps"}]]}],["$","$L9",null,{"href":"/docs/rust-guide/server-functions","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Server Functions"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Type-safe RPC calls"}]]}]]}]]}],null],null],null]},[null,["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","rust-guide","children","axum","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","rust-guide","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$Lc",null,{"sections":"$d"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Le",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Lf",null,{}],["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$L10",null]]]]
10:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Axum Integration | PhilJS"}],["$","meta","3",{"name":"description","content":"Build full-stack PhilJS applications with Axum backend."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
