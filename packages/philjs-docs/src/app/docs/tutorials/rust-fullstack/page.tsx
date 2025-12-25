import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rust Full-Stack Guide',
  description: 'Build high-performance full-stack applications with PhilJS and Rust using Axum, WASM, and server functions.',
};

export default function RustFullStackPage() {
  return (
    <div className="mdx-content">
      <h1>Rust Full-Stack Guide</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Build high-performance full-stack applications with PhilJS and Rust using Axum, WASM, and server functions.
      </p>

      <h2 id="overview">Overview</h2>

      <p>
        PhilJS offers first-class Rust support, allowing you to build entire full-stack applications
        in Rust. This guide covers everything from setup to deployment.
      </p>

      <h3>What You'll Learn</h3>

      <ul>
        <li>Setting up a Rust + PhilJS project</li>
        <li>Using the view! macro for type-safe components</li>
        <li>Creating server functions with Axum</li>
        <li>Database integration with SeaORM</li>
        <li>Building and deploying WASM applications</li>
        <li>Server-side rendering in Rust</li>
      </ul>

      <h2 id="prerequisites">Prerequisites</h2>

      <Terminal commands={[
        'rustup --version',
        'cargo --version',
      ]} />

      <Callout type="info" title="Rust Version">
        PhilJS requires Rust 1.75 or later. Update with <code>rustup update stable</code>.
      </Callout>

      <h2 id="installation">Installation</h2>

      <p>
        Install the PhilJS cargo extension:
      </p>

      <Terminal commands={[
        'cargo install cargo-philjs',
        'cargo philjs new fullstack-app',
        'cd fullstack-app',
      ]} />

      <p>
        This creates a new project with the following structure:
      </p>

      <CodeBlock
        code={`fullstack-app/
├── Cargo.toml
├── src/
│   ├── main.rs           # Server entry point
│   ├── app.rs            # Root component
│   ├── components/       # UI components
│   ├── server/           # Server functions
│   └── lib.rs            # Shared code
├── static/               # Static assets
└── migrations/           # Database migrations`}
        language="text"
      />

      <h2 id="view-macro">The view! Macro</h2>

      <p>
        PhilJS provides a powerful <code>view!</code> macro for building UI in Rust:
      </p>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
        filename="src/app.rs"
      />

      <Callout type="success" title="Type Safety">
        The view! macro is fully type-checked at compile time. Typos and type errors are caught
        before your code even runs!
      </Callout>

      <h2 id="components">Creating Components</h2>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
        filename="src/components/todo_item.rs"
      />

      <h2 id="server-functions">Server Functions</h2>

      <p>
        Server functions let you call server-side code from the client seamlessly:
      </p>

      <CodeBlock
        code={`use philjs::prelude::*;
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
}`}
        language="rust"
        filename="src/server/todos.rs"
      />

      <h2 id="axum-integration">Axum Integration</h2>

      <p>
        PhilJS integrates seamlessly with Axum for the server:
      </p>

      <CodeBlock
        code={`use axum::{
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
}`}
        language="rust"
        filename="src/main.rs"
      />

      <h2 id="database">Database Integration with SeaORM</h2>

      <CodeBlock
        code={`use sea_orm::*;
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
}`}
        language="rust"
        filename="src/db/todos.rs"
      />

      <h2 id="state-management">Global State Management</h2>

      <CodeBlock
        code={`use philjs::prelude::*;
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
}`}
        language="rust"
        filename="src/state.rs"
      />

      <h2 id="wasm-build">Building for WASM</h2>

      <p>
        Compile your PhilJS Rust app to WebAssembly:
      </p>

      <Terminal commands={[
        'cargo philjs build --release',
        'cargo philjs serve',
      ]} />

      <p>
        The build process:
      </p>

      <ol>
        <li>Compiles Rust code to WASM</li>
        <li>Generates JavaScript bindings</li>
        <li>Optimizes WASM binary with wasm-opt</li>
        <li>Bundles with your static assets</li>
      </ol>

      <Callout type="info" title="Bundle Size">
        PhilJS Rust apps compile to small WASM bundles (typically 50-150KB gzipped) with excellent
        performance characteristics.
      </Callout>

      <h2 id="deployment">Deployment</h2>

      <h3>Docker Deployment</h3>

      <CodeBlock
        code={`FROM rust:1.75 as builder
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

CMD ["fullstack-app"]`}
        language="dockerfile"
        filename="Dockerfile"
      />

      <h3>Shuttle.rs Deployment</h3>

      <CodeBlock
        code={`use shuttle_axum::ShuttleAxum;

#[shuttle_runtime::main]
async fn main() -> ShuttleAxum {
    let router = create_router().await;
    Ok(router.into())
}

// Deploy with:
// cargo shuttle deploy`}
        language="rust"
        filename="src/main.rs"
      />

      <h2 id="performance">Performance Tips</h2>

      <ul>
        <li><strong>Use memoization:</strong> <code>create_memo</code> for expensive computations</li>
        <li><strong>Lazy loading:</strong> Split code with dynamic imports</li>
        <li><strong>Resource pooling:</strong> Reuse database connections</li>
        <li><strong>Caching:</strong> Cache server function results when appropriate</li>
        <li><strong>Streaming SSR:</strong> Stream HTML for faster Time to First Byte</li>
      </ul>

      <CodeBlock
        code={`// Streaming SSR example
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
}`}
        language="rust"
      />

      <h2 id="testing">Testing</h2>

      <CodeBlock
        code={`#[cfg(test)]
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
}`}
        language="rust"
        filename="src/tests.rs"
      />

      <h2 id="next-steps">Next Steps</h2>

      <ul>
        <li>Explore the <Link href="/docs/rust/view-macro">view! macro syntax</Link></li>
        <li>Learn about <Link href="/docs/rust/server-functions">server functions</Link></li>
        <li>Check out <Link href="/docs/rust/axum">Axum integration</Link></li>
        <li>Read the <Link href="/docs/rust/wasm">WASM deployment guide</Link></li>
      </ul>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/tutorials/migration-from-react"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Migration from React</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn how to migrate React apps to PhilJS
          </p>
        </Link>

        <Link
          href="/examples"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Example Gallery</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Explore full example applications
          </p>
        </Link>
      </div>
    </div>
  );
}
