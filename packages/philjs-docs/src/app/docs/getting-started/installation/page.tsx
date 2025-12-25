import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Installation',
  description: 'Install PhilJS via npm, yarn, pnpm, or cargo. Get started with the modern web framework in seconds.',
};

export default function InstallationPage() {
  return (
    <div className="mdx-content">
      <h1>Installation</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS can be installed via npm, yarn, pnpm, or cargo for Rust projects. Choose your preferred package manager below.
      </p>

      <h2 id="quick-start">Quick Start</h2>

      <p>
        The fastest way to get started is using the <code>create-philjs</code> CLI which sets up everything automatically:
      </p>

      <Terminal commands={[
        'npm create philjs@latest my-app',
        'cd my-app',
        'npm run dev',
      ]} />

      <p className="mt-4">
        This will create a new PhilJS project with TypeScript support, Vite for bundling, and a basic project structure.
      </p>

      <h2 id="package-managers">Using Package Managers</h2>

      <h3 id="npm">npm</h3>
      <Terminal commands={['npm install philjs-core philjs-router']} />

      <h3 id="yarn">yarn</h3>
      <Terminal commands={['yarn add philjs-core philjs-router']} />

      <h3 id="pnpm">pnpm</h3>
      <Terminal commands={['pnpm add philjs-core philjs-router']} />

      <h3 id="bun">Bun</h3>
      <Terminal commands={['bun add philjs-core philjs-router']} />

      <h2 id="rust-installation">Rust Installation</h2>

      <p>
        For Rust projects, PhilJS provides a Cargo extension that manages your PhilJS project:
      </p>

      <Terminal commands={[
        'cargo install cargo-philjs',
        'cargo philjs new my-app',
        'cd my-app',
        'cargo philjs dev',
      ]} />

      <Callout type="info" title="Rust Version">
        PhilJS Rust requires Rust 1.75 or later. The framework uses the latest stable features
        including async traits and const generics.
      </Callout>

      <h2 id="packages">Available Packages</h2>

      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>philjs-core</code></td>
            <td>Core reactivity system with signals, memos, and effects</td>
          </tr>
          <tr>
            <td><code>philjs-router</code></td>
            <td>File-based routing with nested routes and data loading</td>
          </tr>
          <tr>
            <td><code>philjs-forms</code></td>
            <td>Form handling with validation and server actions</td>
          </tr>
          <tr>
            <td><code>philjs-ssr</code></td>
            <td>Server-side rendering and hydration</td>
          </tr>
          <tr>
            <td><code>philjs-ui</code></td>
            <td>Pre-built accessible UI components</td>
          </tr>
          <tr>
            <td><code>philjs-devtools</code></td>
            <td>Browser extension for debugging</td>
          </tr>
        </tbody>
      </table>

      <h2 id="vite-setup">Vite Configuration</h2>

      <p>
        If you're adding PhilJS to an existing Vite project, update your <code>vite.config.ts</code>:
      </p>

      <CodeBlock
        code={`import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      // Enable JSX transform
      jsx: true,
      // Enable SSR mode
      ssr: false,
      // Enable islands mode for partial hydration
      islands: false,
    }),
  ],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'philjs-core',
  },
});`}
        language="typescript"
        filename="vite.config.ts"
      />

      <h2 id="typescript">TypeScript Configuration</h2>

      <p>
        Add the PhilJS JSX types to your <code>tsconfig.json</code>:
      </p>

      <CodeBlock
        code={`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core",
    "strict": true,
    "skipLibCheck": true
  }
}`}
        language="json"
        filename="tsconfig.json"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/getting-started/quickstart-typescript"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">TypeScript Quick Start</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Build your first PhilJS app with TypeScript
          </p>
        </Link>

        <Link
          href="/docs/getting-started/quickstart-rust"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Rust Quick Start</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Build your first PhilJS app with Rust
          </p>
        </Link>
      </div>
    </div>
  );
}
