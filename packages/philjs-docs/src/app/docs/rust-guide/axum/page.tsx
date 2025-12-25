import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Axum Integration',
  description: 'Build full-stack PhilJS applications with Axum backend.',
};

export default function AxumIntegrationPage() {
  return (
    <div className="mdx-content">
      <h1>Axum Integration</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS integrates seamlessly with Axum, the popular Rust web framework,
        to build full-stack applications with shared types and server-side rendering.
      </p>

      <h2 id="setup">Project Setup</h2>

      <Terminal commands={[
        '# Create a new full-stack project',
        'cargo philjs new my-app --template fullstack',
        'cd my-app',
      ]} />

      <h3>Cargo.toml</h3>

      <CodeBlock
        code={`[package]
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
csr = ["philjs/csr"]`}
        language="toml"
        filename="Cargo.toml"
      />

      <h2 id="server-setup">Server Setup</h2>

      <CodeBlock
        code={`// src/main.rs
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
}`}
        language="rust"
        filename="src/main.rs"
      />

      <h2 id="app-component">App Component</h2>

      <CodeBlock
        code={`// src/app.rs
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
}`}
        language="rust"
        filename="src/app.rs"
      />

      <h2 id="api-routes">API Routes</h2>

      <CodeBlock
        code={`// src/api.rs
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
}`}
        language="rust"
        filename="src/api.rs"
      />

      <h2 id="ssr">Server-Side Rendering</h2>

      <CodeBlock
        code={`// src/pages/todos.rs
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
}`}
        language="rust"
        filename="src/pages/todos.rs"
      />

      <h2 id="authentication">Authentication</h2>

      <CodeBlock
        code={`use axum::{
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
}`}
        language="rust"
      />

      <h2 id="middleware">Middleware</h2>

      <CodeBlock
        code={`use axum::middleware::{self, Next};
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
    .layer(tower_http::cors::CorsLayer::permissive());`}
        language="rust"
      />

      <h2 id="deployment">Deployment</h2>

      <Terminal commands={[
        '# Build for production',
        'cargo philjs build --release',
        '',
        '# The build output includes:',
        '# - target/release/my-app (server binary)',
        '# - pkg/ (WASM and JS bundles)',
        '# - assets/ (static files)',
      ]} />

      <h3>Docker Deployment</h3>

      <CodeBlock
        code={`FROM rust:1.75 as builder

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

CMD ["./my-app"]`}
        language="dockerfile"
        filename="Dockerfile"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/rust-guide/wasm"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">WASM Deployment</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Deploy client-only WASM apps
          </p>
        </Link>

        <Link
          href="/docs/rust-guide/server-functions"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Server Functions</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Type-safe RPC calls
          </p>
        </Link>
      </div>
    </div>
  );
}
