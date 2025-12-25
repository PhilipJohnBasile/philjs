import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'LiveView - PhilJS Guide',
  description: 'Build real-time server-rendered UI with PhilJS LiveView for interactive applications without complex client-side state.',
};

export default function LiveViewPage() {
  return (
    <div className="mdx-content">
      <h1>LiveView</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS LiveView enables real-time, server-rendered UI updates over WebSockets,
        providing rich interactivity without complex client-side state management.
      </p>

      <h2 id="introduction">Introduction</h2>

      <p>
        LiveView keeps your application logic on the server while providing a reactive,
        real-time user experience. The server maintains the state, handles events, and
        sends optimized DOM patches to the client over WebSockets.
      </p>

      <Callout type="info" title="Inspiration">
        PhilJS LiveView is inspired by Phoenix LiveView and brings similar patterns to
        the TypeScript/Rust ecosystem with seamless integration into the PhilJS framework.
      </Callout>

      <h2 id="setup">Setup</h2>

      <Terminal commands={[
        'pnpm add philjs-liveview',
        '# For Rust projects:',
        'cargo add philjs-liveview',
      ]} />

      <CodeBlock
        code={`// server.ts
import { createServer } from 'philjs-liveview/server';
import { App } from './App';

const server = createServer({
  component: App,
  port: 3000,
  // WebSocket configuration
  ws: {
    path: '/live',
    heartbeat: 30000,
  },
});

server.listen();`}
        language="typescript"
        filename="server.ts"
      />

      <h2 id="basic-example">Basic Example</h2>

      <h3>TypeScript</h3>

      <CodeBlock
        code={`import { createLiveView, useLiveState } from 'philjs-liveview';

export const Counter = createLiveView({
  // Initial state (runs on server)
  mount: () => ({
    count: 0,
  }),

  // Event handlers (run on server)
  handleEvent: {
    increment: (state) => ({
      ...state,
      count: state.count + 1,
    }),
    decrement: (state) => ({
      ...state,
      count: state.count - 1,
    }),
  },

  // Render (runs on server, sends DOM patches)
  render: (state, { pushEvent }) => (
    <div className="counter">
      <h1>Count: {state.count}</h1>
      <button onClick={() => pushEvent('decrement')}>-</button>
      <button onClick={() => pushEvent('increment')}>+</button>
    </div>
  ),
});`}
        language="typescript"
        filename="Counter.tsx"
      />

      <h3>Rust</h3>

      <CodeBlock
        code={`use philjs_liveview::prelude::*;

#[derive(Default, Clone)]
struct CounterState {
    count: i32,
}

#[live_view]
fn Counter() -> impl LiveView {
    LiveViewBuilder::new()
        .mount(|| CounterState::default())
        .handle_event("increment", |state: &mut CounterState| {
            state.count += 1;
        })
        .handle_event("decrement", |state: &mut CounterState| {
            state.count -= 1;
        })
        .render(|state, cx| {
            view! {
                <div class="counter">
                    <h1>"Count: " {state.count}</h1>
                    <button on:click=cx.push_event("decrement")>"-"</button>
                    <button on:click=cx.push_event("increment")">"+"</button>
                </div>
            }
        })
}`}
        language="rust"
        filename="counter.rs"
      />

      <h2 id="forms">Form Handling</h2>

      <p>
        LiveView provides seamless form handling with real-time validation:
      </p>

      <CodeBlock
        code={`import { createLiveView } from 'philjs-liveview';

export const ContactForm = createLiveView({
  mount: () => ({
    form: { name: '', email: '', message: '' },
    errors: {},
    submitted: false,
  }),

  handleEvent: {
    validate: (state, { field, value }) => {
      const errors = { ...state.errors };

      if (field === 'email' && !value.includes('@')) {
        errors.email = 'Invalid email address';
      } else {
        delete errors[field];
      }

      return {
        ...state,
        form: { ...state.form, [field]: value },
        errors,
      };
    },

    submit: async (state) => {
      // Server-side form processing
      await sendEmail(state.form);
      return { ...state, submitted: true };
    },
  },

  render: (state, { pushEvent }) => (
    <form onSubmit={(e) => { e.preventDefault(); pushEvent('submit'); }}>
      <input
        value={state.form.name}
        onInput={(e) => pushEvent('validate', {
          field: 'name',
          value: e.target.value,
        })}
      />

      <input
        type="email"
        value={state.form.email}
        onInput={(e) => pushEvent('validate', {
          field: 'email',
          value: e.target.value,
        })}
      />
      {state.errors.email && <span>{state.errors.email}</span>}

      <textarea
        value={state.form.message}
        onInput={(e) => pushEvent('validate', {
          field: 'message',
          value: e.target.value,
        })}
      />

      <button type="submit">Send</button>
    </form>
  ),
});`}
        language="typescript"
      />

      <h2 id="real-time-updates">Real-Time Updates</h2>

      <p>
        LiveView can push updates to clients from server-side events:
      </p>

      <CodeBlock
        code={`import { createLiveView } from 'philjs-liveview';

export const Dashboard = createLiveView({
  mount: async () => ({
    metrics: await fetchMetrics(),
    lastUpdated: new Date(),
  }),

  // Subscribe to server-side events
  subscriptions: ['metrics:updated'],

  // Handle broadcast messages
  handleInfo: {
    'metrics:updated': async (state, payload) => ({
      ...state,
      metrics: payload.metrics,
      lastUpdated: new Date(),
    }),
  },

  render: (state) => (
    <div className="dashboard">
      <h1>Live Metrics</h1>
      <p>Last updated: {state.lastUpdated.toLocaleString()}</p>
      <MetricsGrid metrics={state.metrics} />
    </div>
  ),
});

// Broadcast updates from anywhere on the server
import { broadcast } from 'philjs-liveview';

setInterval(async () => {
  const metrics = await fetchMetrics();
  broadcast('metrics:updated', { metrics });
}, 5000);`}
        language="typescript"
      />

      <h2 id="navigation">Navigation</h2>

      <p>
        LiveView supports client-side navigation while maintaining WebSocket connection:
      </p>

      <CodeBlock
        code={`import { createLiveView, navigate, Link } from 'philjs-liveview';

export const ProductList = createLiveView({
  mount: async ({ params }) => ({
    products: await fetchProducts(params.category),
    category: params.category,
  }),

  render: (state) => (
    <div>
      <nav>
        <Link to="/products/electronics">Electronics</Link>
        <Link to="/products/clothing">Clothing</Link>
      </nav>

      <ul>
        {state.products.map(product => (
          <li key={product.id}>
            <Link to={\`/products/\${product.id}\`}>
              {product.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ),
});`}
        language="typescript"
      />

      <h2 id="uploads">File Uploads</h2>

      <CodeBlock
        code={`import { createLiveView } from 'philjs-liveview';

export const ImageUpload = createLiveView({
  mount: () => ({
    uploads: [],
    progress: {},
  }),

  // Configure uploads
  uploads: {
    images: {
      accept: ['image/*'],
      maxSize: 5 * 1024 * 1024, // 5MB
      maxEntries: 5,
    },
  },

  handleEvent: {
    upload: async (state, { uploads }, { consumeUpload }) => {
      const uploaded = [];
      for (const upload of uploads.images) {
        const url = await consumeUpload(upload, saveToStorage);
        uploaded.push({ name: upload.name, url });
      }
      return { ...state, uploads: [...state.uploads, ...uploaded] };
    },
  },

  render: (state, { uploads, pushEvent }) => (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => uploads.images.addFiles(e.target.files)}
      />

      {uploads.images.entries.map(entry => (
        <div key={entry.ref}>
          {entry.name} - {entry.progress}%
        </div>
      ))}

      <button onClick={() => pushEvent('upload')}>
        Upload
      </button>
    </div>
  ),
});`}
        language="typescript"
      />

      <h2 id="javascript-hooks">JavaScript Hooks</h2>

      <p>
        For complex client-side behavior, use JavaScript hooks:
      </p>

      <CodeBlock
        code={`// hooks.ts
export const Hooks = {
  Chart: {
    mounted() {
      this.chart = new Chart(this.el, {
        data: JSON.parse(this.el.dataset.points),
      });
    },
    updated() {
      this.chart.update(JSON.parse(this.el.dataset.points));
    },
    destroyed() {
      this.chart.destroy();
    },
  },
};

// In your LiveView
render: (state) => (
  <canvas
    phx-hook="Chart"
    data-points={JSON.stringify(state.chartData)}
  />
)`}
        language="typescript"
      />

      <h2 id="axum-integration">Axum Integration (Rust)</h2>

      <CodeBlock
        code={`use axum::{routing::get, Router};
use philjs_liveview::{LiveViewLayer, live};

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(home))
        .route("/counter", live(Counter))
        .route("/dashboard", live(Dashboard))
        .layer(LiveViewLayer::new());

    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}`}
        language="rust"
        filename="main.rs"
      />

      <h2 id="best-practices">Best Practices</h2>

      <ul>
        <li>
          <strong>Keep state minimal:</strong> Only store what's needed for rendering
        </li>
        <li>
          <strong>Debounce frequent events:</strong> Use built-in debouncing for inputs
        </li>
        <li>
          <strong>Handle disconnections:</strong> Implement reconnection logic for robustness
        </li>
        <li>
          <strong>Use hooks sparingly:</strong> Prefer server-side logic when possible
        </li>
        <li>
          <strong>Optimize subscriptions:</strong> Unsubscribe from topics when not needed
        </li>
      </ul>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/guides/ssr-hydration"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">SSR & Hydration</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Understanding server-side rendering
          </p>
        </Link>

        <Link
          href="/docs/guides/forms"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Forms</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Form handling patterns in PhilJS
          </p>
        </Link>
      </div>
    </div>
  );
}
