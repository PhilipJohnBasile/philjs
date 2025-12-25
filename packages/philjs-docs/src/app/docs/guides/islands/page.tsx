import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Islands Architecture - PhilJS Guide',
  description: 'Implement Islands Architecture in PhilJS for partial hydration and optimal performance.',
};

export default function IslandsPage() {
  return (
    <div className="mdx-content">
      <h1>Islands Architecture</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Islands Architecture enables partial hydration, shipping only the JavaScript needed for interactive components while keeping the rest as static HTML.
      </p>

      <h2 id="what-are-islands">What are Islands?</h2>

      <p>
        Islands Architecture is a rendering pattern where most of your page is static HTML,
        with isolated "islands" of interactivity that get hydrated independently. This approach
        dramatically reduces JavaScript bundle size and improves Time to Interactive (TTI).
      </p>

      <CodeBlock
        code={`// Static content - no JavaScript shipped
function Header() {
  return (
    <header>
      <h1>Welcome to our site</h1>
      <nav>{/* Static navigation */}</nav>
    </header>
  );
}

// Interactive island - only this ships JavaScript
import { island } from 'philjs-core';

const CounterIsland = island(() => import('./Counter'));

function Page() {
  return (
    <>
      <Header />
      <main>
        <p>This is static content.</p>
        <CounterIsland client:visible />
      </main>
    </>
  );
}`}
        language="typescript"
        filename="page.tsx"
      />

      <h2 id="creating-islands">Creating Islands</h2>

      <h3>Basic Island</h3>

      <CodeBlock
        code={`import { island } from 'philjs-core';

// Create an island from a component
const MyIsland = island(() => import('./MyComponent'));

// Use in your page
function Page() {
  return (
    <div>
      <MyIsland
        client:load      // Hydrate immediately on load
        fallback={<Spinner />}
        someProp="value"
      />
    </div>
  );
}`}
        language="typescript"
      />

      <h3>Hydration Strategies</h3>

      <p>PhilJS supports multiple hydration strategies to control when islands become interactive:</p>

      <CodeBlock
        code={`// Hydrate immediately when the page loads
<Island client:load />

// Hydrate when the island becomes visible in viewport
<Island client:visible />

// Hydrate when the browser is idle
<Island client:idle />

// Hydrate on user interaction (hover, focus, or click)
<Island client:hover />
<Island client:focus />
<Island client:click />

// Hydrate when a media query matches
<Island client:media="(min-width: 768px)" />

// Never hydrate (useful for static content that uses islands infra)
<Island client:only />`}
        language="tsx"
      />

      <Callout type="info" title="Default Strategy">
        If no hydration directive is specified, islands use <code>client:visible</code> by default
        for optimal performance.
      </Callout>

      <h2 id="passing-props">Passing Props to Islands</h2>

      <p>
        Props are serialized and passed to islands during hydration. Only serializable data types
        are supported:
      </p>

      <CodeBlock
        code={`const ProductIsland = island(() => import('./ProductCard'));

function ProductPage({ product }) {
  return (
    <ProductIsland
      client:visible
      // Serializable props
      id={product.id}
      name={product.name}
      price={product.price}
      imageUrl={product.imageUrl}
      // Objects and arrays work too
      variants={product.variants}
      metadata={{ featured: true }}
    />
  );
}

// Functions and class instances cannot be serialized
// This would cause an error:
// <Island onClick={handleClick} />  // Error!`}
        language="typescript"
      />

      <h2 id="nested-islands">Nested Islands</h2>

      <p>Islands can contain other islands for complex interactive sections:</p>

      <CodeBlock
        code={`const DashboardIsland = island(() => import('./Dashboard'));
const ChartIsland = island(() => import('./Chart'));
const FiltersIsland = island(() => import('./Filters'));

function DashboardPage() {
  return (
    <DashboardIsland client:load>
      {/* These islands hydrate independently */}
      <FiltersIsland client:idle />
      <ChartIsland client:visible />
    </DashboardIsland>
  );
}`}
        language="typescript"
      />

      <h2 id="rust-islands">Islands in Rust</h2>

      <CodeBlock
        code={`use philjs::prelude::*;

// Define an island component
#[island]
fn Counter(initial: i32) -> Element {
    let count = use_signal(|| initial);

    view! {
        <button on:click=move |_| count.set(|c| c + 1)>
            "Count: " {count}
        </button>
    }
}

// Use in a page
#[component]
fn Page() -> Element {
    view! {
        <div>
            <h1>"Static Content"</h1>
            // Hydrate when visible
            <Counter initial=0 client:visible />
        </div>
    }
}`}
        language="rust"
        filename="page.rs"
      />

      <h2 id="shared-state">Shared State Between Islands</h2>

      <p>
        Islands can share state using PhilJS stores or context that's initialized on the server:
      </p>

      <CodeBlock
        code={`// store.ts - Shared store
import { createStore } from 'philjs-core';

export const [cartStore, setCart] = createStore({
  items: [],
  total: 0,
});

// CartButton island
export function CartButton() {
  return (
    <button>
      Cart ({cartStore.items.length})
    </button>
  );
}

// CartDropdown island
export function CartDropdown() {
  return (
    <div>
      {cartStore.items.map(item => (
        <CartItem key={item.id} item={item} />
      ))}
      <p>Total: \${cartStore.total}</p>
    </div>
  );
}

// Both islands share the same store state`}
        language="typescript"
      />

      <h2 id="configuration">Configuration</h2>

      <CodeBlock
        code={`// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      islands: {
        // Enable islands mode
        enabled: true,
        // Directory containing island components
        islandsDir: 'src/islands',
        // Default hydration strategy
        defaultStrategy: 'visible',
        // Preload islands for faster hydration
        preload: true,
      },
    }),
  ],
});`}
        language="typescript"
        filename="vite.config.ts"
      />

      <h2 id="performance">Performance Tips</h2>

      <ul>
        <li>
          <strong>Use <code>client:visible</code> for below-the-fold content:</strong> Only hydrate
          components when users scroll to them
        </li>
        <li>
          <strong>Prefer <code>client:idle</code> for non-critical UI:</strong> Let the browser
          prioritize critical rendering
        </li>
        <li>
          <strong>Keep islands small:</strong> Break large interactive sections into smaller islands
        </li>
        <li>
          <strong>Share code between islands:</strong> Common utilities are deduplicated automatically
        </li>
        <li>
          <strong>Use static content where possible:</strong> Not everything needs to be an island
        </li>
      </ul>

      <h2 id="debugging">Debugging Islands</h2>

      <CodeBlock
        code={`// Enable island debugging in development
import { configureIslands } from 'philjs-core';

configureIslands({
  debug: true,           // Log hydration events
  showBoundaries: true,  // Highlight island boundaries
  timing: true,          // Log hydration timing
});`}
        language="typescript"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/guides/ssr-hydration"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">SSR & Hydration</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn about server-side rendering fundamentals
          </p>
        </Link>

        <Link
          href="/docs/guides/deployment"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Deployment</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Deploy your islands-based application
          </p>
        </Link>
      </div>
    </div>
  );
}
