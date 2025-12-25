import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'PhilJS vs SolidJS',
  description: 'Compare PhilJS with SolidJS - similar reactivity models with key differences in TypeScript support and Rust integration.',
};

export default function SolidJSComparisonPage() {
  return (
    <div className="mdx-content">
      <h1>PhilJS vs SolidJS</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS and SolidJS share a similar fine-grained reactivity model inspired by
        the same principles. Both offer excellent performance, but PhilJS adds
        Rust/WASM support and enhanced TypeScript integration.
      </p>

      <Callout type="info" title="Shared Heritage">
        PhilJS draws significant inspiration from SolidJS's excellent reactivity model.
        If you know SolidJS, you'll feel right at home with PhilJS.
      </Callout>

      <h2 id="similarities">What's Similar</h2>

      <ul>
        <li><strong>Fine-grained reactivity:</strong> Both use signals for reactive state</li>
        <li><strong>No Virtual DOM:</strong> Direct DOM updates for better performance</li>
        <li><strong>Automatic tracking:</strong> Dependencies tracked without manual arrays</li>
        <li><strong>JSX syntax:</strong> Familiar component authoring</li>
        <li><strong>Component as setup:</strong> Components run once, not on every update</li>
      </ul>

      <h2 id="api-comparison">API Comparison</h2>

      <h3>Signals</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">SolidJS</h4>
          <CodeBlock
            code={`import { createSignal } from 'solid-js';

const [count, setCount] = createSignal(0);

// Read value
console.log(count());

// Set value
setCount(5);
setCount(c => c + 1);`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`import { createSignal } from 'philjs-core';

const [count, setCount] = createSignal(0);

// Read value
console.log(count());

// Set value
setCount(5);
setCount(c => c + 1);`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h3>Effects</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">SolidJS</h4>
          <CodeBlock
            code={`import { createEffect, onCleanup } from 'solid-js';

createEffect(() => {
  const value = count();
  console.log('Count:', value);

  onCleanup(() => {
    console.log('Cleanup');
  });
});`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`import { createEffect, onCleanup } from 'philjs-core';

createEffect(() => {
  const value = count();
  console.log('Count:', value);

  onCleanup(() => {
    console.log('Cleanup');
  });
});`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h2 id="key-differences">Key Differences</h2>

      <h3>Rust and WASM Support</h3>

      <p>
        PhilJS provides first-class Rust support with the same reactivity model:
      </p>

      <CodeBlock
        code={`// PhilJS in Rust - same mental model!
use philjs::prelude::*;

#[component]
fn Counter() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <button on:click=move |_| set_count.update(|n| *n + 1)>
            "Count: " {count}
        </button>
    }
}`}
        language="rust"
      />

      <Callout type="success" title="Full-Stack Rust">
        PhilJS is the only signals-based framework with full Rust support,
        enabling type-safe full-stack development with shared code.
      </Callout>

      <h3>TypeScript Integration</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">SolidJS</h4>
          <CodeBlock
            code={`// SolidJS props typing
interface Props {
  name: string;
  age?: number;
}

const Component: Component<Props> = (props) => {
  // props.name - works
  // props.age - might be undefined
  return <div>{props.name}</div>;
};`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`// PhilJS uses standard TypeScript patterns
interface Props {
  name: string;
  age?: number;
}

function Component({ name, age = 25 }: Props) {
  // Destructuring with defaults works
  return <div>{name} ({age})</div>;
}

// Or with accessors for reactivity
function Component(props: Props) {
  return <div>{props.name}</div>;
}`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h3>Store API</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">SolidJS</h4>
          <CodeBlock
            code={`import { createStore, produce } from 'solid-js/store';

const [state, setState] = createStore({
  user: { name: 'Alice' },
  items: [{ id: 1, done: false }]
});

// Path-based update
setState('user', 'name', 'Bob');

// With produce (immer-like)
setState(produce(s => {
  s.items[0].done = true;
}));`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`import { createStore, reconcile } from 'philjs-core';

const [state, setState] = createStore({
  user: { name: 'Alice' },
  items: [{ id: 1, done: false }]
});

// Path-based update (same API)
setState('user', 'name', 'Bob');

// Enhanced array methods
setState('items', 0, 'done', true);

// Reconcile for server data
setState('items', reconcile(serverData));`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h3>Server-Side Rendering</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">SolidJS (SolidStart)</h4>
          <CodeBlock
            code={`// SolidStart server function
"use server";

export async function getTodos() {
  const db = await getDb();
  return db.query('SELECT * FROM todos');
}

// Usage in component
const [todos] = createResource(getTodos);`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`// PhilJS server function
import { server$ } from 'philjs-ssr';

export const getTodos = server$(async () => {
  const db = await getDb();
  return db.query('SELECT * FROM todos');
});

// Identical usage
const [todos] = createResource(getTodos);

// Or in Rust with full type safety
#[server]
async fn get_todos() -> Result<Vec<Todo>> {
  db::todos::all().await
}`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h3>Islands Architecture</h3>

      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div>
          <h4 className="font-semibold mb-2">SolidJS</h4>
          <CodeBlock
            code={`// SolidStart islands mode
// Requires configuration

export default function Island() {
  "use client"; // Mark as island

  const [count, setCount] = createSignal(0);
  return <button onClick={() => setCount(c => c + 1)}>
    {count()}
  </button>;
}`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">PhilJS</h4>
          <CodeBlock
            code={`// PhilJS islands - explicit and composable
import { Island } from 'philjs-ssr';

function Counter() {
  const [count, setCount] = createSignal(0);
  return <button onClick={() => setCount(c => c + 1)}>
    {count()}
  </button>;
}

// Use anywhere
<Island client:visible>
  <Counter />
</Island>

<Island client:idle priority="low">
  <HeavyComponent />
</Island>`}
            language="typescript"
            showLineNumbers={false}
          />
        </div>
      </div>

      <h2 id="ecosystem">Ecosystem Comparison</h2>

      <table className="w-full my-6">
        <thead>
          <tr>
            <th className="text-left">Feature</th>
            <th className="text-left">SolidJS</th>
            <th className="text-left">PhilJS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Meta-framework</td>
            <td>SolidStart</td>
            <td>Built-in SSR</td>
          </tr>
          <tr>
            <td>Rust Support</td>
            <td>No</td>
            <td>First-class</td>
          </tr>
          <tr>
            <td>UI Components</td>
            <td>Community libs</td>
            <td>philjs-ui</td>
          </tr>
          <tr>
            <td>Forms</td>
            <td>@modular-forms/solid</td>
            <td>philjs-forms</td>
          </tr>
          <tr>
            <td>Router</td>
            <td>@solidjs/router</td>
            <td>philjs-router</td>
          </tr>
          <tr>
            <td>DevTools</td>
            <td>solid-devtools</td>
            <td>philjs-devtools</td>
          </tr>
        </tbody>
      </table>

      <h2 id="when-to-choose">When to Choose Which</h2>

      <h3>Choose SolidJS if:</h3>
      <ul>
        <li>You want a mature, battle-tested framework</li>
        <li>You need extensive third-party library support</li>
        <li>You prefer a pure JavaScript/TypeScript stack</li>
      </ul>

      <h3>Choose PhilJS if:</h3>
      <ul>
        <li>You want Rust/WASM support for performance-critical code</li>
        <li>You're building full-stack Rust applications</li>
        <li>You want integrated tooling (forms, UI, routing)</li>
        <li>You prefer enhanced TypeScript patterns</li>
      </ul>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/getting-started/installation"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Get Started</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Try PhilJS in your next project
          </p>
        </Link>

        <Link
          href="/docs/rust-guide/quickstart"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Rust Guide</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Explore PhilJS's unique Rust support
          </p>
        </Link>
      </div>
    </div>
  );
}
