"use strict";(()=>{var e={};e.id=1266,e.ids=[1266],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},719:(e,t,s)=>{s.r(t),s.d(t,{GlobalError:()=>i.a,__next_app__:()=>c,originalPathname:()=>u,pages:()=>p,routeModule:()=>m,tree:()=>d}),s(1168),s(2108),s(4001),s(1305);var o=s(3545),r=s(5947),a=s(9761),i=s.n(a),n=s(4798),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);s.d(t,l);let d=["",{children:["docs",{children:["rust-guide",{children:["axum",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,1168)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\rust-guide\\axum\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],p=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\rust-guide\\axum\\page.tsx"],u="/docs/rust-guide/axum/page",c={require:s,loadChunk:()=>Promise.resolve()},m=new o.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/docs/rust-guide/axum/page",pathname:"/docs/rust-guide/axum",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},1168:(e,t,s)=>{s.r(t),s.d(t,{default:()=>n,metadata:()=>i});var o=s(9015),r=s(3288),a=s(8951);let i={title:"Axum Integration",description:"Build full-stack PhilJS applications with Axum backend."};function n(){return(0,o.jsxs)("div",{className:"mdx-content",children:[o.jsx("h1",{children:"Axum Integration"}),o.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS integrates seamlessly with Axum, the popular Rust web framework, to build full-stack applications with shared types and server-side rendering."}),o.jsx("h2",{id:"setup",children:"Project Setup"}),o.jsx(r.oI,{commands:["# Create a new full-stack project","cargo philjs new my-app --template fullstack","cd my-app"]}),o.jsx("h3",{children:"Cargo.toml"}),o.jsx(r.dn,{code:`[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
philjs = { version = "2.0", features = ["csr", "hydrate", "ssr"] }
philjs-axum = "2.0"
philjs-router = "2.0"
philjs-meta = "2.0"

axum = "0.7"
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["fs", "compression-gzip"] }

serde = { version = "1", features = ["derive"] }
sqlx = { version = "0.7", features = ["postgres", "runtime-tokio"] }

# WASM dependencies
wasm-bindgen = "0.2"
console_error_panic_hook = "0.1"

[features]
default = ["ssr"]
ssr = ["philjs/ssr", "philjs-axum/ssr"]
hydrate = ["philjs/hydrate"]
csr = ["philjs/csr"]`,language:"toml",filename:"Cargo.toml"}),o.jsx("h2",{id:"server-setup",children:"Server Setup"}),o.jsx(r.dn,{code:`// src/main.rs
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
}`,language:"rust",filename:"src/main.rs"}),o.jsx("h2",{id:"app-component",children:"App Component"}),o.jsx(r.dn,{code:`// src/app.rs
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
}`,language:"rust",filename:"src/app.rs"}),o.jsx("h2",{id:"api-routes",children:"API Routes"}),o.jsx(r.dn,{code:`// src/api.rs
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
}`,language:"rust",filename:"src/api.rs"}),o.jsx("h2",{id:"ssr",children:"Server-Side Rendering"}),o.jsx(r.dn,{code:`// src/pages/todos.rs
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
}`,language:"rust",filename:"src/pages/todos.rs"}),o.jsx("h2",{id:"authentication",children:"Authentication"}),o.jsx(r.dn,{code:`use axum::{
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
}`,language:"rust"}),o.jsx("h2",{id:"middleware",children:"Middleware"}),o.jsx(r.dn,{code:`use axum::middleware::{self, Next};
use axum::response::Response;
use axum::http::Request;
use std::time::Instant;

// Logging middleware
pub async fn logging<B>(
    request: Request<B>,
    next: Next<B>,
) -> Response {
    let start = Instant::now();
    let method = request.method().clone();
    let uri = request.uri().clone();

    let response = next.run(request).await;

    let duration = start.elapsed();
    tracing::info!(
        method = %method,
        uri = %uri,
        status = %response.status(),
        duration = ?duration,
    );

    response
}

// Apply middleware
let app = Router::new()
    .route("/api/*", api_routes)
    .layer(middleware::from_fn(logging))
    .layer(tower_http::compression::CompressionLayer::new())
    .layer(tower_http::cors::CorsLayer::permissive());`,language:"rust"}),o.jsx("h2",{id:"deployment",children:"Deployment"}),o.jsx(r.oI,{commands:["# Build for production","cargo philjs build --release","","# The build output includes:","# - target/release/my-app (server binary)","# - pkg/ (WASM and JS bundles)","# - assets/ (static files)"]}),o.jsx("h3",{children:"Docker Deployment"}),o.jsx(r.dn,{code:`FROM rust:1.75 as builder

WORKDIR /app
COPY . .

# Install wasm-pack
RUN cargo install wasm-pack cargo-philjs

# Build the application
RUN cargo philjs build --release

FROM debian:bookworm-slim

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/target/release/my-app ./
COPY --from=builder /app/pkg ./pkg
COPY --from=builder /app/assets ./assets

ENV PORT=3000
EXPOSE 3000

CMD ["./my-app"]`,language:"dockerfile",filename:"Dockerfile"}),o.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,o.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,o.jsxs)(a.default,{href:"/docs/rust-guide/wasm",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[o.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"WASM Deployment"}),o.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Deploy client-only WASM apps"})]}),(0,o.jsxs)(a.default,{href:"/docs/rust-guide/server-functions",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[o.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Server Functions"}),o.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Type-safe RPC calls"})]})]})]})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),o=t.X(0,[732,6314,3083],()=>s(719));module.exports=o})();