import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rust Quickstart',
  description: 'Build your first PhilJS application with Rust and WebAssembly.',
};

export default function RustQuickstartPage() {
  return (
    <div className="mdx-content">
      <h1>Rust Quickstart</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Build type-safe, high-performance web applications with Rust, compiled to WebAssembly.
        PhilJS brings fine-grained reactivity to Rust developers.
      </p>

      <Callout type="info" title="Why Rust + PhilJS?">
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Type Safety</strong>: Compile-time guarantees across your entire stack</li>
          <li><strong>Performance</strong>: Near-native speed with WASM, zero-cost abstractions</li>
          <li><strong>Memory Safety</strong>: No null pointers, no data races, no garbage collector</li>
          <li><strong>Full-Stack Rust</strong>: Same language for frontend, backend, and shared code</li>
        </ul>
      </Callout>

      <h2 id="prerequisites">Prerequisites</h2>

      <Terminal commands={[
        '# Install Rust (if not already installed)',
        'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh',
        '',
        '# Add WASM target',
        'rustup target add wasm32-unknown-unknown',
        '',
        '# Install cargo-philjs',
        'cargo install cargo-philjs',
      ]} />

      <h2 id="create-project">Create a New Project</h2>

      <Terminal commands={[
        '# Create a new full-stack project',
        'cargo philjs new my-app --template fullstack',
        'cd my-app',
        '',
        '# Or choose a specific template',
        'cargo philjs new my-app --template minimal',
        'cargo philjs new my-app --template ssr',
        'cargo philjs new my-app --template liveview',
      ]} />

      <h2 id="project-structure">Project Structure</h2>

      <CodeBlock
        code={`my-app/
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
└── index.html           # HTML template`}
        language="text"
        filename="Project Structure"
      />

      <h2 id="first-component">Your First Component</h2>

      <CodeBlock
        code={`// src/lib.rs
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
}`}
        language="rust"
        filename="First Component"
      />

      <h2 id="reactivity">Reactivity System</h2>

      <h3 id="signals">Signals</h3>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
        filename="Signals"
      />

      <h3 id="stores">Stores (Nested State)</h3>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
        filename="TodoApp.rs"
      />

      <h2 id="control-flow">Control Flow</h2>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
        filename="ControlFlow.rs"
      />

      <h2 id="async">Async Data Fetching</h2>

      <CodeBlock
        code={`use philjs::prelude::*;
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
}`}
        language="rust"
        filename="AsyncData.rs"
      />

      <h2 id="server-functions">Server Functions</h2>

      <p>
        Call server-side Rust functions directly from your components:
      </p>

      <CodeBlock
        code={`use philjs::prelude::*;
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
}`}
        language="rust"
        filename="ServerFunctions.rs"
      />

      <h2 id="run-dev">Run Development Server</h2>

      <Terminal commands={[
        '# Start development server with hot reload',
        'cargo philjs dev',
        '',
        '# Open http://localhost:8080',
      ]} />

      <h2 id="build-prod">Build for Production</h2>

      <Terminal commands={[
        '# Build optimized WASM',
        'cargo philjs build --release',
        '',
        '# Output is in dist/ directory',
        'ls dist/',
      ]} />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/rust-guide/cargo-philjs"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">cargo-philjs CLI</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Full CLI reference and commands
          </p>
        </Link>

        <Link
          href="/docs/rust-guide/axum-integration"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Axum Integration</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Full-stack apps with Axum backend
          </p>
        </Link>

        <Link
          href="/docs/rust-guide/view-macro"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">View Macro Syntax</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Complete view! macro reference
          </p>
        </Link>

        <Link
          href="/docs/rust-guide/server-functions"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Server Functions</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            RPC-style server communication
          </p>
        </Link>
      </div>
    </div>
  );
}
