import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'cargo-philjs CLI',
  description: 'Complete reference for the cargo-philjs command-line tool.',
};

export default function CargoPhiljsPage() {
  return (
    <div className="mdx-content">
      <h1>cargo-philjs CLI</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        cargo-philjs is a Cargo extension for developing, building, and deploying
        PhilJS applications written in Rust.
      </p>

      <h2 id="installation">Installation</h2>

      <Terminal commands={[
        '# Install from crates.io',
        'cargo install cargo-philjs',
        '',
        '# Or install from source',
        'cargo install --git https://github.com/philjs/philjs cargo-philjs',
      ]} />

      <h2 id="commands">Commands</h2>

      <h3 id="new">cargo philjs new</h3>

      <p>Create a new PhilJS project.</p>

      <Terminal commands={[
        '# Create with default template',
        'cargo philjs new my-app',
        '',
        '# Choose a specific template',
        'cargo philjs new my-app --template minimal',
        'cargo philjs new my-app --template fullstack',
        'cargo philjs new my-app --template ssr',
        'cargo philjs new my-app --template liveview',
        'cargo philjs new my-app --template islands',
      ]} />

      <h4>Options</h4>

      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--template, -t</code></td>
            <td>Project template to use</td>
            <td><code>fullstack</code></td>
          </tr>
          <tr>
            <td><code>--name, -n</code></td>
            <td>Package name (if different from directory)</td>
            <td>Directory name</td>
          </tr>
          <tr>
            <td><code>--no-git</code></td>
            <td>Skip git initialization</td>
            <td><code>false</code></td>
          </tr>
          <tr>
            <td><code>--typescript</code></td>
            <td>Include TypeScript frontend setup</td>
            <td><code>false</code></td>
          </tr>
        </tbody>
      </table>

      <h3 id="dev">cargo philjs dev</h3>

      <p>Start the development server with hot reload.</p>

      <Terminal commands={[
        '# Start dev server',
        'cargo philjs dev',
        '',
        '# With custom port',
        'cargo philjs dev --port 3000',
        '',
        '# Open browser automatically',
        'cargo philjs dev --open',
      ]} />

      <h4>Options</h4>

      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--port, -p</code></td>
            <td>Development server port</td>
            <td><code>8080</code></td>
          </tr>
          <tr>
            <td><code>--host</code></td>
            <td>Host to bind to</td>
            <td><code>127.0.0.1</code></td>
          </tr>
          <tr>
            <td><code>--open, -o</code></td>
            <td>Open browser on start</td>
            <td><code>false</code></td>
          </tr>
          <tr>
            <td><code>--hot-reload</code></td>
            <td>Enable hot reload</td>
            <td><code>true</code></td>
          </tr>
          <tr>
            <td><code>--release</code></td>
            <td>Build in release mode</td>
            <td><code>false</code></td>
          </tr>
        </tbody>
      </table>

      <Callout type="info" title="Hot Reload">
        cargo philjs dev watches your Rust files and automatically rebuilds WASM
        when changes are detected. Page state is preserved when possible.
      </Callout>

      <h3 id="build">cargo philjs build</h3>

      <p>Build the project for production.</p>

      <Terminal commands={[
        '# Production build',
        'cargo philjs build --release',
        '',
        '# Build with optimizations',
        'cargo philjs build --release --wasm-opt',
        '',
        '# Build for specific target',
        'cargo philjs build --release --features csr',
        'cargo philjs build --release --features ssr',
      ]} />

      <h4>Options</h4>

      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--release, -r</code></td>
            <td>Build with optimizations</td>
            <td><code>false</code></td>
          </tr>
          <tr>
            <td><code>--wasm-opt</code></td>
            <td>Run wasm-opt for smaller bundles</td>
            <td><code>false</code></td>
          </tr>
          <tr>
            <td><code>--features</code></td>
            <td>Cargo features to enable</td>
            <td>Project default</td>
          </tr>
          <tr>
            <td><code>--out-dir</code></td>
            <td>Output directory</td>
            <td><code>dist</code></td>
          </tr>
          <tr>
            <td><code>--ssg</code></td>
            <td>Pre-render static pages</td>
            <td><code>false</code></td>
          </tr>
        </tbody>
      </table>

      <h3 id="serve">cargo philjs serve</h3>

      <p>Serve the production build locally for testing.</p>

      <Terminal commands={[
        '# Serve built files',
        'cargo philjs serve',
        '',
        '# Custom port',
        'cargo philjs serve --port 4000',
      ]} />

      <h3 id="test">cargo philjs test</h3>

      <p>Run tests including WASM tests in a browser environment.</p>

      <Terminal commands={[
        '# Run all tests',
        'cargo philjs test',
        '',
        '# Run specific tests',
        'cargo philjs test -- component_tests',
        '',
        '# Run in headless browser',
        'cargo philjs test --headless',
      ]} />

      <h4>Options</h4>

      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--headless</code></td>
            <td>Run in headless browser</td>
            <td><code>false</code></td>
          </tr>
          <tr>
            <td><code>--browser</code></td>
            <td>Browser to use (chrome, firefox, safari)</td>
            <td><code>chrome</code></td>
          </tr>
          <tr>
            <td><code>--coverage</code></td>
            <td>Generate coverage report</td>
            <td><code>false</code></td>
          </tr>
        </tbody>
      </table>

      <h3 id="generate">cargo philjs generate</h3>

      <p>Generate components, pages, and other code.</p>

      <Terminal commands={[
        '# Generate a component',
        'cargo philjs generate component Header',
        'cargo philjs generate component --path components/nav Button',
        '',
        '# Generate a page',
        'cargo philjs generate page About',
        'cargo philjs generate page users/[id]',
        '',
        '# Generate a server function',
        'cargo philjs generate server-fn GetTodos',
      ]} />

      <h3 id="fmt">cargo philjs fmt</h3>

      <p>Format view! macro code for consistent styling.</p>

      <Terminal commands={[
        '# Format all files',
        'cargo philjs fmt',
        '',
        '# Check without modifying',
        'cargo philjs fmt --check',
        '',
        '# Format specific file',
        'cargo philjs fmt src/app.rs',
      ]} />

      <h2 id="configuration">Configuration</h2>

      <p>
        Configure cargo-philjs via <code>Cargo.toml</code> or <code>philjs.toml</code>:
      </p>

      <CodeBlock
        code={`# philjs.toml
[package]
name = "my-app"

[dev]
port = 8080
hot-reload = true
open-browser = false

[build]
out-dir = "dist"
wasm-opt = true
minify = true

[features]
default = ["ssr"]
ssr = []
csr = []
hydrate = []

[assets]
# Copy these directories to output
static = ["static", "assets"]
# Include these in the HTML
scripts = ["pkg/my-app.js"]
styles = ["styles/main.css"]

[env]
# Environment variables for different modes
[env.development]
API_URL = "http://localhost:3001"

[env.production]
API_URL = "https://api.example.com"`}
        language="toml"
        filename="philjs.toml"
      />

      <h2 id="integration">CI/CD Integration</h2>

      <CodeBlock
        code={`name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
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
        run: cargo philjs build --release --wasm-opt

      - name: Test
        run: cargo philjs test --headless

      - name: Deploy
        uses: cloudflare/pages-action@v1
        with:
          apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: my-app
          directory: dist`}
        language="yaml"
        filename=".github/workflows/deploy.yml"
      />

      <h2 id="troubleshooting">Troubleshooting</h2>

      <h3>Common Issues</h3>

      <h4>WASM target not installed</h4>

      <Terminal commands={[
        'rustup target add wasm32-unknown-unknown',
      ]} />

      <h4>wasm-bindgen version mismatch</h4>

      <Terminal commands={[
        'cargo update -p wasm-bindgen',
      ]} />

      <h4>Out of memory during build</h4>

      <Terminal commands={[
        'cargo philjs build --release -- -j 1',
      ]} />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/rust-guide/quickstart"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Rust Quickstart</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Build your first Rust app
          </p>
        </Link>

        <Link
          href="/docs/rust-guide/view-macro"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">View Macro</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn the view! macro syntax
          </p>
        </Link>
      </div>
    </div>
  );
}
