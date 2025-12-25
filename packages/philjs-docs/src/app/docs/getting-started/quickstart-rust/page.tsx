import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quick Start (Rust)',
  description: 'Build your first PhilJS application with Rust. Learn the view! macro, signals, and WebAssembly deployment.',
};

export default function QuickStartRustPage() {
  return (
    <div className="mdx-content">
      <h1>Quick Start (Rust)</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Build blazing-fast web applications with PhilJS and Rust. Compile to WebAssembly for near-native performance.
      </p>

      <Callout type="info" title="Prerequisites">
        Make sure you have Rust 1.75+ installed. Run <code>rustup update</code> to get the latest version.
        You'll also need the wasm32-unknown-unknown target: <code>rustup target add wasm32-unknown-unknown</code>
      </Callout>

      <h2 id="install-cli">Install cargo-philjs</h2>

      <Terminal commands={[
        'cargo install cargo-philjs',
      ]} />

      <h2 id="create-project">Create a New Project</h2>

      <Terminal commands={[
        'cargo philjs new my-app',
        'cd my-app',
        'cargo philjs dev',
      ]} />

      <p>
        Open <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">http://localhost:3000</a> to see your app running.
      </p>

      <h2 id="project-structure">Project Structure</h2>

      <CodeBlock
        code={`my-app/
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
└── PhilJS.toml             # PhilJS configuration`}
        language="plaintext"
        showLineNumbers={false}
      />

      <h2 id="view-macro">The view! Macro</h2>

      <p>
        PhilJS Rust uses the <code>view!</code> macro for declarative UI. It looks similar to HTML but with Rust expressions:
      </p>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
        filename="src/components/counter.rs"
      />

      <h3>Key Differences from JSX</h3>

      <ul>
        <li><strong>Strings must be quoted</strong>: Use <code>"text"</code> instead of bare text</li>
        <li><strong>Use <code>class</code></strong>: Not <code>className</code></li>
        <li><strong>Event handlers</strong>: Use <code>on:click</code> syntax</li>
        <li><strong>Expressions</strong>: Wrap Rust expressions in <code>{"{}"}</code></li>
      </ul>

      <h2 id="signals">Signals in Rust</h2>

      <p>
        Signals work similarly to TypeScript, but with Rust's ownership semantics:
      </p>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
        filename="src/components/signals_example.rs"
      />

      <h2 id="lists">Rendering Lists</h2>

      <p>
        Use the <code>For</code> component for efficient list rendering:
      </p>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
        filename="src/components/todo_list.rs"
      />

      <h2 id="async">Async Data Fetching</h2>

      <p>
        Use <code>use_resource</code> for async data:
      </p>

      <CodeBlock
        code={`use philjs::prelude::*;
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
}`}
        language="rust"
        filename="src/components/user_profile.rs"
      />

      <h2 id="server-functions">Server Functions</h2>

      <p>
        Call Rust functions on the server directly from your components:
      </p>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
        filename="src/routes/user.rs"
      />

      <h2 id="building">Building for Production</h2>

      <Terminal commands={[
        '# Build optimized WASM binary',
        'cargo philjs build --release',
        '',
        '# Output is in dist/',
        'ls dist/',
      ]} />

      <p>
        The build output includes optimized WASM, JavaScript glue code, and your static assets.
        Deploy to any static hosting provider.
      </p>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/rust/view-macro"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">View Macro Deep Dive</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Master the view! macro syntax and patterns
          </p>
        </Link>

        <Link
          href="/docs/rust/server-functions"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Server Functions</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Build full-stack apps with type-safe RPC
          </p>
        </Link>

        <Link
          href="/docs/rust/axum"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Axum Integration</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Use PhilJS with the Axum web framework
          </p>
        </Link>

        <Link
          href="/docs/rust/wasm"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">WASM Deployment</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Deploy your Rust app to the web
          </p>
        </Link>
      </div>
    </div>
  );
}
