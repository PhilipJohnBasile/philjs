/**
 * PhilJS Add Command
 * Add features to existing PhilJS projects
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import prompts from 'prompts';
import { execSync } from 'child_process';

export type Feature =
  | 'ssr'
  | 'islands'
  | 'graphql'
  | 'tailwind'
  | 'testing'
  | 'linting'
  | 'pwa'
  | 'i18n'
  | 'analytics'
  | 'auth';

const FEATURES: Record<Feature, { name: string; description: string }> = {
  ssr: {
    name: 'Server-Side Rendering',
    description: 'Add SSR support with islands architecture',
  },
  islands: {
    name: 'Islands Architecture',
    description: 'Add selective hydration with islands',
  },
  graphql: {
    name: 'GraphQL',
    description: 'Add GraphQL client and server setup',
  },
  tailwind: {
    name: 'Tailwind CSS',
    description: 'Add Tailwind CSS framework',
  },
  testing: {
    name: 'Testing',
    description: 'Add Vitest testing framework',
  },
  linting: {
    name: 'Linting',
    description: 'Add ESLint and Prettier',
  },
  pwa: {
    name: 'PWA',
    description: 'Add Progressive Web App support',
  },
  i18n: {
    name: 'Internationalization',
    description: 'Add i18n support for multiple languages',
  },
  analytics: {
    name: 'Analytics',
    description: 'Add analytics and performance monitoring',
  },
  auth: {
    name: 'Authentication',
    description: 'Add authentication setup',
  },
};

export async function addFeature(featureName?: string): Promise<void> {
  console.log(pc.cyan('\n⚡ Add Feature to PhilJS Project\n'));

  // Check if we're in a PhilJS project
  const isPhilJSProject = await checkPhilJSProject();
  if (!isPhilJSProject) {
    console.error(pc.red('\n✖ Not a PhilJS project!\n'));
    console.log(pc.dim('Run this command from a PhilJS project directory.\n'));
    process.exit(1);
  }

  let feature: Feature;
  if (featureName && featureName in FEATURES) {
    feature = featureName as Feature;
  } else {
    const response = await prompts({
      type: 'select',
      name: 'feature',
      message: 'Select a feature to add:',
      choices: Object.entries(FEATURES).map(([key, { name, description }]) => ({
        title: `${name} - ${description}`,
        value: key,
      })),
    });

    // Handle cancellation
    if (!response['feature']) {
      console.log(pc.red('\n✖ Cancelled\n'));
      process.exit(1);
    }
    feature = response['feature'];
  }

  console.log(pc.cyan(`\n📦 Adding ${FEATURES[feature].name}...\n`));

  try {
    switch (feature) {
      case 'ssr':
        await addSSR();
        break;
      case 'islands':
        await addIslands();
        break;
      case 'graphql':
        await addGraphQL();
        break;
      case 'tailwind':
        await addTailwind();
        break;
      case 'testing':
        await addTesting();
        break;
      case 'linting':
        await addLinting();
        break;
      case 'pwa':
        await addPWA();
        break;
      case 'i18n':
        await addI18n();
        break;
      case 'analytics':
        await addAnalytics();
        break;
      case 'auth':
        await addAuth();
        break;
    }

    console.log(pc.green(`\n✓ ${FEATURES[feature].name} added successfully!\n`));
  } catch (error) {
    console.error(pc.red('\n✖ Failed to add feature:'), error);
    process.exit(1);
  }
}

async function checkPhilJSProject(): Promise<boolean> {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkgContent = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    return pkg.dependencies && 'philjs-core' in pkg.dependencies;
  } catch {
    return false;
  }
}

async function addSSR(): Promise<void> {
  const pkg = await readPackageJson();
  const isTS = await isTypeScript();
  const ext = isTS ? 'ts' : 'js';

  // Add dependencies
  pkg.dependencies['philjs-ssr'] = '^0.1.0';
  pkg.dependencies['philjs-islands'] = '^0.1.0';
  pkg.dependencies['express'] = '^4.18.2';
  pkg.dependencies['compression'] = '^1.7.4';
  pkg.dependencies['sirv'] = '^2.0.4';

  if (isTS) {
    pkg.devDependencies = pkg.devDependencies || {};
    pkg.devDependencies['@types/express'] = '^4.17.21';
    pkg.devDependencies['@types/compression'] = '^1.7.5';
  }

  pkg.scripts['dev:ssr'] = 'node server.js';
  pkg.scripts['build:ssr'] = 'vite build && vite build --ssr';

  await writePackageJson(pkg);
  console.log(pc.green('  ✓ Updated package.json'));

  // Create server entry files
  await fs.writeFile(
    path.join(process.cwd(), 'src', `entry-server.${ext}`),
    generateSSREntryServer(isTS)
  );
  console.log(pc.green(`  ✓ Created src/entry-server.${ext}`));

  await fs.writeFile(
    path.join(process.cwd(), 'src', `entry-client.${ext}`),
    generateSSREntryClient(isTS)
  );
  console.log(pc.green(`  ✓ Created src/entry-client.${ext}`));

  await fs.writeFile(
    path.join(process.cwd(), `server.${ext}`),
    generateExpressServer(isTS)
  );
  console.log(pc.green(`  ✓ Created server.${ext}`));

  // Update vite config
  await updateViteConfig(isTS, (config) => {
    return config + `\n  ssr: {\n    noExternal: ['philjs-core', 'philjs-router', 'philjs-ssr'],\n  },`;
  });
  console.log(pc.green('  ✓ Updated vite.config'));

  console.log(pc.dim('\n  Run: npm install && npm run dev:ssr\n'));
}

async function addIslands(): Promise<void> {
  const pkg = await readPackageJson();

  pkg.dependencies['philjs-islands'] = '^0.1.0';
  await writePackageJson(pkg);
  console.log(pc.green('  ✓ Updated package.json'));

  // Create islands directory
  await fs.mkdir(path.join(process.cwd(), 'src', 'islands'), { recursive: true });

  // Create example island
  const isTS = await isTypeScript();
  const ext = isTS ? 'tsx' : 'jsx';

  await fs.writeFile(
    path.join(process.cwd(), 'src', 'islands', `ExampleIsland.${ext}`),
    generateExampleIsland(isTS)
  );
  console.log(pc.green(`  ✓ Created src/islands/ExampleIsland.${ext}`));

  console.log(pc.dim('\n  Islands allow selective hydration for better performance.'));
  console.log(pc.dim('  Import islands with: import { Island } from "philjs-islands"\n'));
}

async function addGraphQL(): Promise<void> {
  const pkg = await readPackageJson();

  pkg.dependencies['philjs-graphql'] = '^0.1.0';
  pkg.dependencies['graphql'] = '^16.8.1';
  await writePackageJson(pkg);
  console.log(pc.green('  ✓ Updated package.json'));

  const isTS = await isTypeScript();
  const ext = isTS ? 'ts' : 'js';

  // Create GraphQL directory
  await fs.mkdir(path.join(process.cwd(), 'src', 'graphql'), { recursive: true });

  // Create schema
  await fs.writeFile(
    path.join(process.cwd(), 'src', 'graphql', `schema.${ext}`),
    generateGraphQLSchema(isTS)
  );
  console.log(pc.green(`  ✓ Created src/graphql/schema.${ext}`));

  // Create client
  await fs.writeFile(
    path.join(process.cwd(), 'src', 'graphql', `client.${ext}`),
    generateGraphQLClient(isTS)
  );
  console.log(pc.green(`  ✓ Created src/graphql/client.${ext}`));

  console.log(pc.dim('\n  GraphQL client is ready to use.'));
  console.log(pc.dim('  Import with: import { client } from "./graphql/client"\n'));
}

async function addTailwind(): Promise<void> {
  const pkg = await readPackageJson();

  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['tailwindcss'] = '^3.4.1';
  pkg.devDependencies['postcss'] = '^8.4.35';
  pkg.devDependencies['autoprefixer'] = '^10.4.17';

  await writePackageJson(pkg);
  console.log(pc.green('  ✓ Updated package.json'));

  // Create Tailwind config
  await fs.writeFile(
    path.join(process.cwd(), 'tailwind.config.js'),
    `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
  );
  console.log(pc.green('  ✓ Created tailwind.config.js'));

  // Create PostCSS config
  await fs.writeFile(
    path.join(process.cwd(), 'postcss.config.js'),
    `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
  );
  console.log(pc.green('  ✓ Created postcss.config.js'));

  // Create CSS file
  await fs.writeFile(
    path.join(process.cwd(), 'src', 'index.css'),
    `@tailwind base;
@tailwind components;
@tailwind utilities;
`
  );
  console.log(pc.green('  ✓ Created src/index.css'));

  console.log(pc.dim('\n  Import in your main file: import "./index.css"\n'));
}

async function addTesting(): Promise<void> {
  const pkg = await readPackageJson();
  const isTS = await isTypeScript();

  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['vitest'] = '^3.2.4';
  pkg.devDependencies['@vitest/ui'] = '^3.2.4';
  pkg.devDependencies['happy-dom'] = '^15.11.7';
  pkg.devDependencies['@testing-library/dom'] = '^10.4.0';

  pkg.scripts.test = 'vitest run';
  pkg.scripts['test:watch'] = 'vitest';
  pkg.scripts['test:ui'] = 'vitest --ui';

  await writePackageJson(pkg);
  console.log(pc.green('  ✓ Updated package.json'));

  // Create vitest config
  await fs.writeFile(
    path.join(process.cwd(), isTS ? 'vitest.config.ts' : 'vitest.config.js'),
    `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
  },
});
`
  );
  console.log(pc.green(`  ✓ Created vitest.config.${isTS ? 'ts' : 'js'}`));

  // Create tests directory
  await fs.mkdir(path.join(process.cwd(), 'tests'), { recursive: true });

  // Create example test
  const ext = isTS ? 'tsx' : 'jsx';
  await fs.writeFile(
    path.join(process.cwd(), 'tests', `example.test.${ext}`),
    `import { describe, it, expect } from 'vitest';

describe('Example Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
`
  );
  console.log(pc.green(`  ✓ Created tests/example.test.${ext}`));

  console.log(pc.dim('\n  Run tests with: npm test\n'));
}

async function addLinting(): Promise<void> {
  const pkg = await readPackageJson();
  const isTS = await isTypeScript();

  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['eslint'] = '^9.17.0';
  pkg.devDependencies['prettier'] = '^3.4.2';

  if (isTS) {
    pkg.devDependencies['@typescript-eslint/eslint-plugin'] = '^8.20.0';
    pkg.devDependencies['@typescript-eslint/parser'] = '^8.20.0';
  }

  pkg.scripts.lint = 'eslint . --ext .ts,.tsx,.js,.jsx';
  pkg.scripts['lint:fix'] = 'eslint . --ext .ts,.tsx,.js,.jsx --fix';
  pkg.scripts.format = 'prettier --write "src/**/*.{ts,tsx,js,jsx,css,md}"';

  await writePackageJson(pkg);
  console.log(pc.green('  ✓ Updated package.json'));

  // Create ESLint config
  await fs.writeFile(
    path.join(process.cwd(), '.eslintrc.json'),
    JSON.stringify({
      env: {
        browser: true,
        es2021: true,
        node: true,
      },
      extends: [
        'eslint:recommended',
        ...(isTS ? ['plugin:@typescript-eslint/recommended'] : []),
      ],
      parser: isTS ? '@typescript-eslint/parser' : undefined,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      plugins: isTS ? ['@typescript-eslint'] : [],
      rules: {
        'no-console': 'warn',
        'no-unused-vars': 'warn',
      },
    }, null, 2)
  );
  console.log(pc.green('  ✓ Created .eslintrc.json'));

  // Create Prettier config
  await fs.writeFile(
    path.join(process.cwd(), '.prettierrc.json'),
    JSON.stringify({
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
    }, null, 2)
  );
  console.log(pc.green('  ✓ Created .prettierrc.json'));

  console.log(pc.dim('\n  Run: npm run lint\n'));
}

async function addPWA(): Promise<void> {
  const pkg = await readPackageJson();

  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['vite-plugin-pwa'] = '^0.17.5';

  await writePackageJson(pkg);
  console.log(pc.green('  ✓ Updated package.json'));

  // Create manifest
  await fs.writeFile(
    path.join(process.cwd(), 'public', 'manifest.json'),
    JSON.stringify({
      name: pkg.name,
      short_name: pkg.name,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#2563eb',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    }, null, 2)
  );
  console.log(pc.green('  ✓ Created public/manifest.json'));

  const isTS = await isTypeScript();
  await updateViteConfig(isTS, (config) => {
    return `import { VitePWA } from 'vite-plugin-pwa';\n\n${config}    VitePWA({\n      registerType: 'autoUpdate',\n      manifest: './public/manifest.json',\n    }),\n`;
  });
  console.log(pc.green('  ✓ Updated vite.config'));

  console.log(pc.dim('\n  PWA support added. Add icons to public/ directory.\n'));
}

async function addI18n(): Promise<void> {
  const pkg = await readPackageJson();

  pkg.dependencies['@formatjs/intl'] = '^2.10.0';
  await writePackageJson(pkg);
  console.log(pc.green('  ✓ Updated package.json'));

  const isTS = await isTypeScript();
  const ext = isTS ? 'ts' : 'js';

  // Create i18n directory
  await fs.mkdir(path.join(process.cwd(), 'src', 'i18n'), { recursive: true });

  await fs.writeFile(
    path.join(process.cwd(), 'src', 'i18n', `config.${ext}`),
    `export const defaultLocale = 'en';
export const locales = ['en', 'es', 'fr'];

export const messages = {
  en: {
    'app.welcome': 'Welcome',
    'app.hello': 'Hello, {name}!',
  },
  es: {
    'app.welcome': 'Bienvenido',
    'app.hello': '¡Hola, {name}!',
  },
  fr: {
    'app.welcome': 'Bienvenue',
    'app.hello': 'Bonjour, {name}!',
  },
};
`
  );
  console.log(pc.green(`  ✓ Created src/i18n/config.${ext}`));

  console.log(pc.dim('\n  Add translations to src/i18n/config\n'));
}

async function addAnalytics(): Promise<void> {
  const isTS = await isTypeScript();
  const ext = isTS ? 'ts' : 'js';

  await fs.mkdir(path.join(process.cwd(), 'src', 'lib'), { recursive: true });

  await fs.writeFile(
    path.join(process.cwd(), 'src', 'lib', `analytics.${ext}`),
    `/**
 * Analytics integration
 */

export function trackPageView(url${isTS ? ': string' : ''}) {
  if (typeof window === 'undefined') return;

  // Add your analytics provider here (Google Analytics, Plausible, etc.)
  console.log('Page view:', url);
}

export function trackEvent(event${isTS ? ': string' : ''}, data${isTS ? '?: Record<string, any>' : ''}) {
  if (typeof window === 'undefined') return;

  console.log('Event:', event, data);
}

export function trackPerformance(metric${isTS ? ': string' : ''}, value${isTS ? ': number' : ''}) {
  if (typeof window === 'undefined') return;

  console.log('Performance:', metric, value);
}
`
  );
  console.log(pc.green(`  ✓ Created src/lib/analytics.${ext}`));

  console.log(pc.dim('\n  Add your analytics provider in src/lib/analytics\n'));
}

async function addAuth(): Promise<void> {
  const isTS = await isTypeScript();
  const ext = isTS ? 'ts' : 'js';

  await fs.mkdir(path.join(process.cwd(), 'src', 'lib'), { recursive: true });

  await fs.writeFile(
    path.join(process.cwd(), 'src', 'lib', `auth.${ext}`),
    `import { signal } from 'philjs-core';

${isTS ? `interface User {
  id: string;
  email: string;
  name: string;
}

` : ''}const user = signal${isTS ? '<User | null>' : ''}(null);
const loading = signal(false);

export const auth = {
  get user() {
    return user.get();
  },

  get loading() {
    return loading.get();
  },

  async login(email${isTS ? ': string' : ''}, password${isTS ? ': string' : ''}) {
    loading.set(true);
    try {
      // Implement your auth logic here
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      user.set(data.user);
      return data;
    } finally {
      loading.set(false);
    }
  },

  async logout() {
    loading.set(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      user.set(null);
    } finally {
      loading.set(false);
    }
  },

  async checkAuth() {
    loading.set(true);
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        user.set(data.user);
      }
    } finally {
      loading.set(false);
    }
  },
};
`
  );
  console.log(pc.green(`  ✓ Created src/lib/auth.${ext}`));

  console.log(pc.dim('\n  Implement your auth provider in src/lib/auth\n'));
}

// Utility functions
async function readPackageJson(): Promise<any> {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const content = await fs.readFile(pkgPath, 'utf-8');
  return JSON.parse(content);
}

async function writePackageJson(pkg: any): Promise<void> {
  const pkgPath = path.join(process.cwd(), 'package.json');
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
}

async function isTypeScript(): Promise<boolean> {
  try {
    await fs.access(path.join(process.cwd(), 'tsconfig.json'));
    return true;
  } catch {
    return false;
  }
}

async function updateViteConfig(isTS: boolean, modifier: (config: string) => string): Promise<void> {
  const configPath = path.join(process.cwd(), isTS ? 'vite.config.ts' : 'vite.config.js');
  try {
    let config = await fs.readFile(configPath, 'utf-8');
    config = modifier(config);
    await fs.writeFile(configPath, config);
  } catch (error) {
    console.log(pc.yellow('  ⚠ Could not update vite.config automatically'));
  }
}

function generateSSREntryServer(isTS: boolean): string {
  return `import { renderToString } from 'philjs-ssr';
import App from './App';

export function render(url${isTS ? ': string' : ''}) {
  const html = renderToString(<App url={url} />);
  return { html };
}
`;
}

function generateSSREntryClient(isTS: boolean): string {
  return `import { hydrate } from 'philjs-core';
import App from './App';

hydrate(<App />, document.getElementById('app'));
`;
}

function generateExpressServer(isTS: boolean): string {
  return `import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

async function createServer() {
  const app = express();

  app.use(compression());

  let vite;
  if (!isProduction) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(resolve(__dirname, 'dist/client')));
  }

  app.use('*', async (req, res) => {
    const url = req.originalUrl;

    try {
      let template, render;

      if (!isProduction && vite) {
        template = fs.readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.${isTS ? 'ts' : 'js'}')).render;
      } else {
        template = fs.readFileSync(
          resolve(__dirname, 'dist/client/index.html'),
          'utf-8'
        );
        render = (await import('./dist/server/entry-server.js')).render;
      }

      const { html: appHtml } = render(url);
      const html = template.replace('<!--app-html-->', appHtml);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e${isTS ? ': any' : ''}) {
      vite?.ssrFixStacktrace(e);
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  app.listen(port, () => {
    console.log(\`Server running at http://localhost:\${port}\`);
  });
}

createServer();
`;
}

function generateExampleIsland(isTS: boolean): string {
  return `import { signal } from 'philjs-core';
import { Island } from 'philjs-islands';

export default function ExampleIsland() {
  const count = signal(0);

  return (
    <Island client:load>
      <div>
        <h2>Interactive Island</h2>
        <p>Count: {count()}</p>
        <button onClick={() => count.set(c => c + 1)}>
          Increment
        </button>
      </div>
    </Island>
  );
}
`;
}

function generateGraphQLSchema(isTS: boolean): string {
  return `export const typeDefs = \`
  type Query {
    hello: String
    user(id: ID!): User
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Mutation {
    createUser(name: String!, email: String!): User
  }
\`;

export const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
    user: (_${isTS ? ': any' : ''}, { id }${isTS ? ': { id: string }' : ''}) => {
      return { id, name: 'John Doe', email: 'john@example.com' };
    },
  },
  Mutation: {
    createUser: (_${isTS ? ': any' : ''}, { name, email }${isTS ? ': { name: string; email: string }' : ''}) => {
      return { id: '1', name, email };
    },
  },
};
`;
}

function generateGraphQLClient(isTS: boolean): string {
  return `import { createClient } from 'philjs-graphql';

export const client = createClient({
  url: '/graphql',
});

export async function query(query${isTS ? ': string' : ''}, variables${isTS ? '?: Record<string, any>' : ''}) {
  return client.query({ query, variables });
}

export async function mutate(mutation${isTS ? ': string' : ''}, variables${isTS ? '?: Record<string, any>' : ''}) {
  return client.mutate({ mutation, variables });
}
`;
}
