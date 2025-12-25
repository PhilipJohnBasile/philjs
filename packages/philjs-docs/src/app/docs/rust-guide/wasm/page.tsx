import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WASM Deployment',
  description: 'Deploy PhilJS applications as WebAssembly for maximum performance.',
};

export default function WasmDeploymentPage() {
  return (
    <div className="mdx-content">
      <h1>WASM Deployment</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Deploy your PhilJS application as WebAssembly for near-native performance in the browser.
        This guide covers client-side-only (CSR) and static site generation (SSG) deployments.
      </p>

      <h2 id="build-modes">Build Modes</h2>

      <h3>Client-Side Rendering (CSR)</h3>

      <p>
        Pure client-side rendering compiles your entire app to WASM. The browser downloads
        the WASM bundle and renders the UI dynamically.
      </p>

      <Terminal commands={[
        '# Build for CSR',
        'cargo philjs build --release --features csr',
        '',
        '# Output in dist/ directory',
        'ls dist/',
        '# index.html',
        '# pkg/',
        '#   my-app.js',
        '#   my-app_bg.wasm',
      ]} />

      <h3>Static Site Generation (SSG)</h3>

      <p>
        Pre-render all pages at build time for instant loading and SEO benefits.
      </p>

      <Terminal commands={[
        '# Build with SSG',
        'cargo philjs build --release --features ssr --ssg',
        '',
        '# Output includes pre-rendered HTML',
        'ls dist/',
        '# index.html',
        '# about/index.html',
        '# todos/index.html',
        '# pkg/',
      ]} />

      <h2 id="optimization">Optimization</h2>

      <h3>WASM Size Optimization</h3>

      <CodeBlock
        code={`# Cargo.toml
[profile.release]
opt-level = 'z'      # Optimize for size
lto = true           # Enable Link Time Optimization
codegen-units = 1    # Reduce parallel codegen for better optimization
panic = 'abort'      # Remove panic unwinding code
strip = true         # Strip debug symbols

[profile.release.package."*"]
opt-level = 'z'`}
        language="toml"
        filename="Cargo.toml"
      />

      <h3>wasm-opt</h3>

      <Terminal commands={[
        '# Install wasm-opt (part of binaryen)',
        'npm install -g binaryen',
        '',
        '# Optimize the WASM file',
        'wasm-opt -Oz -o output.wasm input.wasm',
        '',
        '# With cargo-philjs (automatic)',
        'cargo philjs build --release --wasm-opt',
      ]} />

      <h3>Code Splitting</h3>

      <CodeBlock
        code={`use philjs::prelude::*;

// Lazy load heavy components
#[component]
fn App() -> impl IntoView {
    view! {
        <Router>
            <Routes>
                <Route path="/" view=HomePage/>
                // Lazy loaded routes
                <Route
                    path="/dashboard"
                    view=|| {
                        let Dashboard = lazy(|| import("./pages/dashboard"));
                        view! {
                            <Suspense fallback=|| "Loading...">
                                <Dashboard/>
                            </Suspense>
                        }
                    }
                />
            </Routes>
        </Router>
    }
}`}
        language="rust"
      />

      <h2 id="deployment-targets">Deployment Targets</h2>

      <h3>Cloudflare Pages</h3>

      <CodeBlock
        code={`# wrangler.toml
name = "my-philjs-app"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[build]
command = "cargo philjs build --release --features csr"`}
        language="toml"
        filename="wrangler.toml"
      />

      <Terminal commands={[
        '# Deploy to Cloudflare Pages',
        'npx wrangler pages deploy dist --project-name=my-app',
      ]} />

      <h3>Netlify</h3>

      <CodeBlock
        code={`# netlify.toml
[build]
  command = "cargo philjs build --release --features csr"
  publish = "dist"

[[headers]]
  for = "/*.wasm"
  [headers.values]
    Content-Type = "application/wasm"
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"`}
        language="toml"
        filename="netlify.toml"
      />

      <h3>Vercel</h3>

      <CodeBlock
        code={`{
  "buildCommand": "cargo philjs build --release --features csr",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/(.*).wasm",
      "headers": [
        { "key": "Content-Type", "value": "application/wasm" },
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}`}
        language="json"
        filename="vercel.json"
      />

      <h3>GitHub Pages</h3>

      <CodeBlock
        code={`name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-action@stable
        with:
          targets: wasm32-unknown-unknown

      - name: Install cargo-philjs
        run: cargo install cargo-philjs

      - name: Build
        run: cargo philjs build --release --features csr

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist`}
        language="yaml"
        filename=".github/workflows/deploy.yml"
      />

      <h2 id="loading-strategies">Loading Strategies</h2>

      <h3>Streaming Instantiation</h3>

      <CodeBlock
        code={`<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>My App</title>
    <link rel="modulepreload" href="/pkg/my-app.js">
    <link rel="preload" href="/pkg/my-app_bg.wasm" as="fetch" crossorigin>
</head>
<body>
    <div id="app">
        <!-- Loading indicator shown while WASM loads -->
        <div class="loading">Loading...</div>
    </div>

    <script type="module">
        // Use streaming instantiation for faster startup
        import init, { hydrate } from '/pkg/my-app.js';

        // Start loading WASM immediately
        const wasmPromise = init();

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', async () => {
                await wasmPromise;
                hydrate();
            });
        } else {
            wasmPromise.then(hydrate);
        }
    </script>
</body>
</html>`}
        language="html"
        filename="index.html"
      />

      <h3>Progressive Enhancement</h3>

      <CodeBlock
        code={`<!-- Show content even before WASM loads -->
<div id="app">
    <!-- Server-rendered or static HTML -->
    <header>
        <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
        </nav>
    </header>
    <main>
        <h1>Welcome</h1>
        <p>Content is visible immediately.</p>
        <button disabled data-philjs-interactive>
            Click me (loading...)
        </button>
    </main>
</div>

<script type="module">
    import init, { hydrate } from '/pkg/my-app.js';

    await init();
    hydrate();

    // Enable interactive elements after hydration
    document.querySelectorAll('[data-philjs-interactive]').forEach(el => {
        el.removeAttribute('disabled');
        el.textContent = el.textContent.replace(' (loading...)', '');
    });
</script>`}
        language="html"
      />

      <h2 id="caching">Caching Strategies</h2>

      <CodeBlock
        code={`// Service Worker for offline support
// sw.js
const CACHE_NAME = 'philjs-app-v1';
const WASM_CACHE = 'philjs-wasm-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
];

const WASM_ASSETS = [
    '/pkg/my-app.js',
    '/pkg/my-app_bg.wasm',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)),
            caches.open(WASM_CACHE).then(cache => cache.addAll(WASM_ASSETS)),
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Cache-first for WASM files
    if (url.pathname.endsWith('.wasm') || url.pathname.includes('/pkg/')) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
        return;
    }

    // Network-first for other requests
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});`}
        language="javascript"
        filename="sw.js"
      />

      <h2 id="debugging">Debugging</h2>

      <Callout type="info" title="Debug Builds">
        Debug builds include better error messages and source maps but are much larger.
        Only use for development.
      </Callout>

      <Terminal commands={[
        '# Debug build with source maps',
        'cargo philjs build --dev',
        '',
        '# Enable console_error_panic_hook',
        '# (already included in PhilJS apps)',
      ]} />

      <CodeBlock
        code={`// In your lib.rs
#[wasm_bindgen(start)]
pub fn main() {
    // Better panic messages in browser console
    console_error_panic_hook::set_once();

    // Enable logging
    #[cfg(debug_assertions)]
    {
        console_log::init_with_level(log::Level::Debug).unwrap();
    }

    mount_to_body(App);
}`}
        language="rust"
      />

      <h2 id="performance-tips">Performance Tips</h2>

      <ul>
        <li><strong>Use gzip/brotli compression:</strong> WASM files compress very well</li>
        <li><strong>Preload critical assets:</strong> Use <code>&lt;link rel="preload"&gt;</code></li>
        <li><strong>Code split:</strong> Lazy load non-critical routes</li>
        <li><strong>Tree shake:</strong> Avoid unused dependencies</li>
        <li><strong>Use release builds:</strong> Debug builds are 10x+ larger</li>
      </ul>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/rust-guide/axum"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Axum Integration</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Build full-stack apps with SSR
          </p>
        </Link>

        <Link
          href="/docs/guides/deployment"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Deployment Guide</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            General deployment strategies
          </p>
        </Link>
      </div>
    </div>
  );
}
