import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Project Structure',
  description: 'Understanding the PhilJS project layout, file conventions, and configuration options.',
};

export default function ProjectStructurePage() {
  return (
    <div className="mdx-content">
      <h1>Project Structure</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS projects follow a conventional file structure that enables file-based routing, code organization, and optimal bundling.
      </p>

      <h2 id="standard-structure">Standard Project Structure</h2>

      <CodeBlock
        code={`my-philjs-app/
├── src/
│   ├── app/                    # Application routes (file-based routing)
│   │   ├── layout.tsx          # Root layout (wraps all pages)
│   │   ├── page.tsx            # Home page (/)
│   │   ├── loading.tsx         # Loading UI
│   │   ├── error.tsx           # Error boundary
│   │   ├── about/
│   │   │   └── page.tsx        # About page (/about)
│   │   ├── blog/
│   │   │   ├── layout.tsx      # Blog layout
│   │   │   ├── page.tsx        # Blog index (/blog)
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Blog post (/blog/:slug)
│   │   └── api/
│   │       └── users/
│   │           └── route.ts    # API route (/api/users)
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Card.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── features/           # Feature-specific components
│   │       ├── auth/
│   │       └── blog/
│   ├── lib/                    # Shared utilities
│   │   ├── api.ts              # API client
│   │   ├── utils.ts            # Helper functions
│   │   └── constants.ts        # App constants
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useMediaQuery.ts
│   ├── stores/                 # Global state stores
│   │   ├── auth.ts
│   │   └── theme.ts
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   ├── styles/                 # Global styles
│   │   ├── globals.css
│   │   └── variables.css
│   └── main.tsx                # Application entry point
├── public/                     # Static assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── images/
├── tests/                      # Test files
│   ├── unit/
│   └── e2e/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts          # If using Tailwind
└── philjs.config.ts            # PhilJS configuration`}
        language="plaintext"
        showLineNumbers={false}
      />

      <h2 id="app-directory">The app/ Directory</h2>

      <p>
        The <code>app/</code> directory uses file-based routing. Each folder represents a route segment,
        and special files define the behavior of that route.
      </p>

      <h3>Special Files</h3>

      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>page.tsx</code></td>
            <td>Defines the UI for a route (required for route to be accessible)</td>
          </tr>
          <tr>
            <td><code>layout.tsx</code></td>
            <td>Shared layout that wraps child routes</td>
          </tr>
          <tr>
            <td><code>loading.tsx</code></td>
            <td>Loading UI shown while page content loads</td>
          </tr>
          <tr>
            <td><code>error.tsx</code></td>
            <td>Error boundary for the route segment</td>
          </tr>
          <tr>
            <td><code>not-found.tsx</code></td>
            <td>UI shown when a route is not found</td>
          </tr>
          <tr>
            <td><code>route.ts</code></td>
            <td>API endpoint (server-only)</td>
          </tr>
        </tbody>
      </table>

      <h3>Dynamic Routes</h3>

      <CodeBlock
        code={`app/
├── blog/
│   ├── page.tsx                # /blog
│   └── [slug]/
│       └── page.tsx            # /blog/:slug (dynamic)
├── users/
│   └── [...id]/
│       └── page.tsx            # /users/* (catch-all)
└── shop/
    └── [[...categories]]/
        └── page.tsx            # /shop or /shop/* (optional catch-all)`}
        language="plaintext"
        showLineNumbers={false}
      />

      <h3>Route Groups</h3>

      <p>
        Use parentheses to create route groups that don't affect the URL:
      </p>

      <CodeBlock
        code={`app/
├── (marketing)/                # Group for marketing pages
│   ├── about/
│   │   └── page.tsx           # /about
│   └── contact/
│       └── page.tsx           # /contact
├── (shop)/                     # Group for shop pages
│   ├── layout.tsx             # Shared shop layout
│   ├── products/
│   │   └── page.tsx           # /products
│   └── cart/
│       └── page.tsx           # /cart
└── (auth)/                     # Group for auth pages
    ├── layout.tsx             # Auth-specific layout
    ├── login/
    │   └── page.tsx           # /login
    └── register/
        └── page.tsx           # /register`}
        language="plaintext"
        showLineNumbers={false}
      />

      <h2 id="components-directory">The components/ Directory</h2>

      <p>
        Organize your components by type and feature:
      </p>

      <CodeBlock
        code={`components/
├── ui/                        # Primitive/base components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Card/
│   └── index.ts               # Barrel export
├── layout/                    # Layout components
│   ├── Header/
│   ├── Footer/
│   └── Sidebar/
├── forms/                     # Form components
│   ├── LoginForm/
│   └── ContactForm/
└── features/                  # Feature-specific components
    ├── auth/
    │   ├── LoginButton.tsx
    │   └── UserMenu.tsx
    └── blog/
        ├── PostCard.tsx
        └── CommentSection.tsx`}
        language="plaintext"
        showLineNumbers={false}
      />

      <h2 id="configuration">Configuration Files</h2>

      <h3>philjs.config.ts</h3>

      <CodeBlock
        code={`import { defineConfig } from 'philjs';

export default defineConfig({
  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',
    // Enable/disable SSR
    ssr: true,
    // Islands mode for partial hydration
    islands: false,
  },

  // Server configuration
  server: {
    port: 3000,
    host: 'localhost',
  },

  // Router configuration
  router: {
    // Base path for all routes
    basePath: '',
    // Trailing slash behavior
    trailingSlash: false,
  },

  // Plugins
  plugins: [
    // Add plugins here
  ],
});`}
        language="typescript"
        filename="philjs.config.ts"
      />

      <h3>vite.config.ts</h3>

      <CodeBlock
        code={`import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    philjs({
      jsx: true,
      ssr: true,
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
    },
  },

  build: {
    target: 'esnext',
    minify: 'terser',
  },
});`}
        language="typescript"
        filename="vite.config.ts"
      />

      <h2 id="rust-structure">Rust Project Structure</h2>

      <p>
        Rust projects follow a similar structure but with Cargo conventions:
      </p>

      <CodeBlock
        code={`my-philjs-rust-app/
├── src/
│   ├── lib.rs                  # Library root
│   ├── app.rs                  # App component
│   ├── components/
│   │   ├── mod.rs
│   │   ├── header.rs
│   │   └── footer.rs
│   ├── routes/
│   │   ├── mod.rs
│   │   ├── home.rs
│   │   └── about.rs
│   ├── server/                 # Server-only code
│   │   ├── mod.rs
│   │   ├── api.rs
│   │   └── db.rs
│   └── types/
│       └── mod.rs
├── public/
│   └── index.html
├── Cargo.toml
├── PhilJS.toml                 # PhilJS configuration
└── README.md`}
        language="plaintext"
        showLineNumbers={false}
      />

      <h2 id="best-practices">Best Practices</h2>

      <ul>
        <li><strong>Colocation</strong>: Keep related files together (component, styles, tests)</li>
        <li><strong>Barrel exports</strong>: Use <code>index.ts</code> files for cleaner imports</li>
        <li><strong>Feature folders</strong>: Group code by feature rather than type for larger apps</li>
        <li><strong>Type safety</strong>: Define types in a central location for reuse</li>
        <li><strong>Environment separation</strong>: Use <code>.env</code> files for environment-specific config</li>
      </ul>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/getting-started/ide-setup"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">IDE Setup</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Configure your editor for the best development experience
          </p>
        </Link>

        <Link
          href="/docs/guides/routing"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Routing Guide</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn file-based routing in depth
          </p>
        </Link>
      </div>
    </div>
  );
}
