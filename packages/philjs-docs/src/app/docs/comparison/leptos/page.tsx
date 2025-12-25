import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'PhilJS vs Leptos',
  description: 'Compare PhilJS with Leptos - both Rust frameworks with fine-grained reactivity, with key differences in TypeScript support.',
};

export default function LeptosComparisonPage() {
  return (
    <div className="mdx-content">
      <h1>PhilJS vs Leptos</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS and Leptos are both Rust-first web frameworks with fine-grained reactivity.
        PhilJS adds first-class TypeScript support for mixed-language or TS-only projects.
      </p>

      <Callout type="info" title="Shared Philosophy">
        Both frameworks embrace Rust's type safety and performance while providing
        reactive primitives similar to SolidJS. The main difference is PhilJS's
        dual TypeScript/Rust support.
      </Callout>

      <h2 id="language-support">Language Support</h2>

      <table className="w-full my-6">
        <thead>
          <tr>
            <th className="text-left">Aspect</th>
            <th className="text-left">Leptos</th>
            <th className="text-left">PhilJS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Primary Language</td>
            <td>Rust only</td>
            <td>TypeScript + Rust</td>
          </tr>
          <tr>
            <td>Frontend Options</td>
            <td>Rust/WASM</td>
            <td>TS, Rust/WASM, or hybrid</td>
          </tr>
          <tr>
            <td>Backend Options</td>
            <td>Rust (Actix/Axum)</td>
            <td>Node.js, Rust, or hybrid</td>
          </tr>
          <tr>
            <td>Shared Types</td>
            <td>Rust structs</td>
            <td>TS interfaces or Rust structs</td>
          </tr>
        </tbody>
      </table>

      <h2 id="syntax-comparison">Syntax Comparison</h2>

      <h3>Component Definition</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">Leptos</h4>
          <CodeBlock
            code={`use leptos::*;

#[component]
fn Counter(initial: i32) -> impl IntoView {
    let (count, set_count) = create_signal(initial);

    view! {
        <button on:click=move |_| {
            set_count.update(|n| *n += 1)
        }>
            "Count: " {count}
        </button>
    }
}`}
            language="rust"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS (Rust)</h4>
          <CodeBlock
            code={`use philjs::prelude::*;

#[component]
fn Counter(initial: i32) -> impl IntoView {
    let (count, set_count) = create_signal(initial);

    view! {
        <button on:click=move |_| {
            set_count.update(|n| *n += 1)
        }>
            "Count: " {count}
        </button>
    }
}`}
            language="rust"
            showLineNumbers={false}
          />
        </div>
      </div>

      <p>
        The Rust syntax is nearly identical! PhilJS also supports TypeScript:
      </p>

      <CodeBlock
        code={`// PhilJS (TypeScript)
import { createSignal } from 'philjs-core';

function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = createSignal(initial);

  return (
    <button onClick={() => setCount(n => n + 1)}>
      Count: {count()}
    </button>
  );
}`}
        language="typescript"
      />

      <h3>Server Functions</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">Leptos</h4>
          <CodeBlock
            code={`#[server(GetTodos, "/api")]
pub async fn get_todos() -> Result<Vec<Todo>, ServerFnError> {
    let pool = expect_context::<SqlitePool>();
    let todos = sqlx::query_as!(Todo,
        "SELECT * FROM todos"
    )
    .fetch_all(&pool)
    .await?;
    Ok(todos)
}`}
            language="rust"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS (Rust)</h4>
          <CodeBlock
            code={`#[server(GetTodos)]
pub async fn get_todos() -> Result<Vec<Todo>, ServerFnError> {
    let pool = expect_context::<SqlitePool>();
    let todos = sqlx::query_as!(Todo,
        "SELECT * FROM todos"
    )
    .fetch_all(&pool)
    .await?;
    Ok(todos)
}`}
            language="rust"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h2 id="key-differences">Key Differences</h2>

      <h3>TypeScript Interoperability</h3>

      <CodeBlock
        code={`// PhilJS allows mixing TS and Rust in the same project
// shared/types.ts - Generated from Rust or written in TS
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// frontend/components/TodoList.tsx - TypeScript component
import { createSignal, For } from 'philjs-core';
import type { Todo } from '../shared/types';

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <For each={todos}>
      {(todo) => <TodoItem todo={todo} />}
    </For>
  );
}

// Use Rust for performance-critical parts
// backend/processing.rs - Rust processing
#[wasm_bindgen]
pub fn process_todos(todos: JsValue) -> JsValue {
    let todos: Vec<Todo> = serde_wasm_bindgen::from_value(todos).unwrap();
    // Heavy processing in Rust
    serde_wasm_bindgen::to_value(&processed).unwrap()
}`}
        language="typescript"
      />

      <h3>Hydration Strategies</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">Leptos</h4>
          <CodeBlock
            code={`// Leptos - Component-level islands
#[island]
fn InteractiveCounter() -> impl IntoView {
    // This component hydrates independently
    let (count, set_count) = create_signal(0);
    view! { <button>{count}</button> }
}

// Usage
view! {
    <InteractiveCounter />
}`}
            language="rust"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`// PhilJS - Flexible island directives
// In Rust
view! {
    <Island client:visible>
        <Counter />
    </Island>
}

// In TypeScript
<Island client:idle priority="low">
  <HeavyChart />
</Island>

<Island client:media="(min-width: 768px)">
  <DesktopNav />
</Island>`}
            language="rust"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h3>Tooling</h3>

      <table className="w-full my-6">
        <thead>
          <tr>
            <th className="text-left">Tool</th>
            <th className="text-left">Leptos</th>
            <th className="text-left">PhilJS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dev Server</td>
            <td>cargo-leptos</td>
            <td>cargo-philjs + Vite</td>
          </tr>
          <tr>
            <td>Hot Reload</td>
            <td>WASM hot reload</td>
            <td>TS hot reload + WASM hot reload</td>
          </tr>
          <tr>
            <td>Build</td>
            <td>cargo build</td>
            <td>pnpm build / cargo build</td>
          </tr>
          <tr>
            <td>Formatting</td>
            <td>leptosfmt</td>
            <td>rustfmt + Prettier</td>
          </tr>
          <tr>
            <td>Type Generation</td>
            <td>N/A</td>
            <td>Rust to TS types</td>
          </tr>
        </tbody>
      </table>

      <h3>Router Comparison</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">Leptos</h4>
          <CodeBlock
            code={`use leptos_router::*;

view! {
    <Router>
        <Routes>
            <Route path="/" view=HomePage/>
            <Route path="/users/:id" view=UserPage/>
            <Route path="/*any" view=NotFound/>
        </Routes>
    </Router>
}

// Access params
#[component]
fn UserPage() -> impl IntoView {
    let params = use_params_map();
    let id = move || params.with(|p| p.get("id").cloned());
    view! { <p>"User: " {id}</p> }
}`}
            language="rust"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`use philjs_router::*;

view! {
    <Router>
        <Routes>
            <Route path="/" view=HomePage/>
            <Route path="/users/:id" view=UserPage/>
            <Route path="/*" view=NotFound/>
        </Routes>
    </Router>
}

// Similar param access
#[component]
fn UserPage() -> impl IntoView {
    let params = use_params::<UserParams>();
    view! { <p>"User: " {move || params().id}</p> }
}

// Or in TypeScript
const { id } = useParams<{ id: string }>();`}
            language="rust"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h2 id="performance">Performance Comparison</h2>

      <p>
        Both frameworks compile to efficient WASM with similar runtime performance.
        Key differences:
      </p>

      <ul>
        <li><strong>Bundle size:</strong> Similar for pure Rust; PhilJS TypeScript builds are smaller</li>
        <li><strong>Initial load:</strong> PhilJS TS hydrates faster than WASM</li>
        <li><strong>Runtime:</strong> Both achieve near-native performance in WASM</li>
        <li><strong>Hybrid:</strong> PhilJS allows TS for UI, Rust for compute-heavy parts</li>
      </ul>

      <h2 id="ecosystem">Ecosystem</h2>

      <table className="w-full my-6">
        <thead>
          <tr>
            <th className="text-left">Feature</th>
            <th className="text-left">Leptos</th>
            <th className="text-left">PhilJS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>UI Components</td>
            <td>Community crates</td>
            <td>philjs-ui (TS + Rust)</td>
          </tr>
          <tr>
            <td>Forms</td>
            <td>Built-in</td>
            <td>philjs-forms</td>
          </tr>
          <tr>
            <td>Styling</td>
            <td>Stylers crate</td>
            <td>philjs-css / Tailwind</td>
          </tr>
          <tr>
            <td>Testing</td>
            <td>Rust tests</td>
            <td>Rust + TS tests</td>
          </tr>
          <tr>
            <td>DevTools</td>
            <td>Browser WASM debugger</td>
            <td>philjs-devtools extension</td>
          </tr>
        </tbody>
      </table>

      <h2 id="when-to-choose">When to Choose Which</h2>

      <h3>Choose Leptos if:</h3>
      <ul>
        <li>You want pure Rust throughout your stack</li>
        <li>Your team is all Rust developers</li>
        <li>You don't need TypeScript interoperability</li>
        <li>You prefer a more established Rust-only ecosystem</li>
      </ul>

      <h3>Choose PhilJS if:</h3>
      <ul>
        <li>You want to mix TypeScript and Rust</li>
        <li>You have developers with different language backgrounds</li>
        <li>You want to progressively adopt Rust</li>
        <li>You need npm ecosystem access</li>
        <li>You want faster TypeScript hot reload during development</li>
      </ul>

      <h2 id="migration">Migration Path</h2>

      <p>
        Migrating between Leptos and PhilJS Rust code is relatively straightforward
        due to similar APIs:
      </p>

      <CodeBlock
        code={`// Leptos -> PhilJS: Main changes
use philjs::prelude::*;       // was: use leptos::*;
use philjs_router::*;          // was: use leptos_router::*;

// Most component code is identical
#[component]
fn App() -> impl IntoView {
    // Same signal API
    let (count, set_count) = create_signal(0);

    // Same view! macro
    view! {
        <button on:click=move |_| set_count.update(|n| *n += 1)>
            {count}
        </button>
    }
}`}
        language="rust"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/rust-guide/quickstart"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Rust Quickstart</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Get started with PhilJS Rust
          </p>
        </Link>

        <Link
          href="/docs/getting-started/installation"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">TypeScript Setup</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Try PhilJS with TypeScript
          </p>
        </Link>
      </div>
    </div>
  );
}
