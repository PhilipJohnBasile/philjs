#!/usr/bin/env node

/**
 * PhilJS Create Command
 * Interactive project scaffolding with templates
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import prompts from 'prompts';
import { execSync } from 'child_process';

export interface ProjectConfig {
  name: string;
  template: 'basic' | 'ssr' | 'spa' | 'fullstack' | 'library';
  typescript: boolean;
  cssFramework: 'none' | 'tailwind' | 'css-modules' | 'styled';
  testing: boolean;
  testFramework?: 'vitest' | 'jest';
  linting: boolean;
  git: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn';
}

const TEMPLATES = {
  basic: 'Basic starter with signals and routing',
  ssr: 'Server-side rendering with islands',
  spa: 'Single page app with client-side routing',
  fullstack: 'Full-stack SSR with API routes',
  library: 'Library template for creating PhilJS packages',
};

export async function createProject(projectName?: string): Promise<void> {
  console.log(pc.cyan('\n⚡ PhilJS Project Creator\n'));
  console.log(pc.dim('The framework that thinks ahead\n'));

  const config = await gatherProjectConfig(projectName);

  console.log(pc.cyan(`\n📦 Creating ${config.name}...\n`));

  const projectPath = path.join(process.cwd(), config.name);

  // Check if directory exists
  try {
    await fs.access(projectPath);
    console.error(pc.red(`\n✖ Directory ${config.name} already exists!\n`));
    process.exit(1);
  } catch {
    // Directory doesn't exist, we can proceed
  }

  // Create project structure
  await createProjectStructure(projectPath, config);

  // Copy template files
  await copyTemplateFiles(projectPath, config);

  // Generate configuration files
  await generateConfigFiles(projectPath, config);

  // Initialize git if requested
  if (config.git) {
    try {
      execSync('git init', { cwd: projectPath, stdio: 'pipe' });
      console.log(pc.green('  ✓ Initialized git repository'));
    } catch {
      console.log(pc.yellow('  ⚠ Failed to initialize git'));
    }
  }

  // Print success message and next steps
  printSuccessMessage(config);
}

async function gatherProjectConfig(projectName?: string): Promise<ProjectConfig> {
  // Use type assertion for prompts questions array since the types don't fully support
  // the conditional type field (null for skipping questions)
  const responses = await prompts([
    {
      type: projectName ? null : 'text',
      name: 'name',
      message: 'Project name:',
      initial: 'my-philjs-app',
      validate: (value: string) =>
        value.length > 0 && /^[a-z0-9-_]+$/i.test(value)
          ? true
          : 'Project name must contain only letters, numbers, dashes, and underscores',
    },
    {
      type: 'select',
      name: 'template',
      message: 'Select a template:',
      choices: Object.entries(TEMPLATES).map(([value, title]) => ({
        title: `${title}`,
        value,
      })),
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Use TypeScript?',
      initial: true,
    },
    {
      type: 'select',
      name: 'cssFramework',
      message: 'CSS solution:',
      choices: [
        { title: 'None (plain CSS)', value: 'none' },
        { title: 'Tailwind CSS', value: 'tailwind' },
        { title: 'CSS Modules', value: 'css-modules' },
        { title: 'Styled Components', value: 'styled' },
      ],
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'testing',
      message: 'Add testing?',
      initial: true,
    },
    {
      type: (prev: boolean) => prev ? 'select' : null,
      name: 'testFramework',
      message: 'Testing framework:',
      choices: [
        { title: 'Vitest (recommended)', value: 'vitest' },
        { title: 'Jest', value: 'jest' },
      ],
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'linting',
      message: 'Add ESLint & Prettier?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'git',
      message: 'Initialize git repository?',
      initial: true,
    },
    {
      type: 'select',
      name: 'packageManager',
      message: 'Package manager:',
      choices: [
        { title: 'npm', value: 'npm' },
        { title: 'pnpm (recommended)', value: 'pnpm' },
        { title: 'yarn', value: 'yarn' },
      ],
      initial: 1,
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any);

  // Handle cancellation
  if (Object.keys(responses).length === 0) {
    console.log(pc.red('\n✖ Cancelled\n'));
    process.exit(1);
  }

  return {
    name: projectName ?? responses['name'],
    template: responses['template'],
    typescript: responses['typescript'],
    cssFramework: responses['cssFramework'],
    testing: responses['testing'],
    testFramework: responses['testFramework'],
    linting: responses['linting'],
    git: responses['git'],
    packageManager: responses['packageManager'],
  };
}

async function createProjectStructure(projectPath: string, config: ProjectConfig): Promise<void> {
  // Create base directories
  await fs.mkdir(projectPath, { recursive: true });
  await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'public'), { recursive: true });

  // Create template-specific directories
  if (config.template === 'library') {
    await fs.mkdir(path.join(projectPath, 'src', 'lib'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'examples'), { recursive: true });
  } else {
    await fs.mkdir(path.join(projectPath, 'src', 'components'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'src', 'routes'), { recursive: true });

    if (config.template === 'fullstack') {
      await fs.mkdir(path.join(projectPath, 'src', 'api'), { recursive: true });
      await fs.mkdir(path.join(projectPath, 'src', 'db'), { recursive: true });
    }
  }

  if (config.testing) {
    await fs.mkdir(path.join(projectPath, 'tests'), { recursive: true });
  }

  console.log(pc.green('  ✓ Created project structure'));
}

async function copyTemplateFiles(projectPath: string, config: ProjectConfig): Promise<void> {
  const ext = config.typescript ? 'tsx' : 'jsx';
  const jsExt = config.typescript ? 'ts' : 'js';

  // Generate package.json
  const packageJson = generatePackageJson(config);
  await fs.writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  console.log(pc.green('  ✓ Created package.json'));

  // Generate index.html
  await fs.writeFile(
    path.join(projectPath, 'index.html'),
    generateIndexHtml(config)
  );
  console.log(pc.green('  ✓ Created index.html'));

  // Generate main entry file
  await fs.writeFile(
    path.join(projectPath, 'src', `main.${ext}`),
    generateMainFile(config)
  );
  console.log(pc.green(`  ✓ Created src/main.${ext}`));

  // Generate app files based on template
  await generateTemplateFiles(projectPath, config);
}

async function generateTemplateFiles(projectPath: string, config: ProjectConfig): Promise<void> {
  const ext = config.typescript ? 'tsx' : 'jsx';

  switch (config.template) {
    case 'basic':
      await generateBasicTemplate(projectPath, config, ext);
      break;
    case 'ssr':
      await generateSSRTemplate(projectPath, config, ext);
      break;
    case 'spa':
      await generateSPATemplate(projectPath, config, ext);
      break;
    case 'fullstack':
      await generateFullstackTemplate(projectPath, config, ext);
      break;
    case 'library':
      await generateLibraryTemplate(projectPath, config);
      break;
  }
}

async function generateBasicTemplate(projectPath: string, config: ProjectConfig, ext: string): Promise<void> {
  // App.tsx
  await fs.writeFile(
    path.join(projectPath, 'src', `App.${ext}`),
    generateBasicApp(config)
  );
  console.log(pc.green(`  ✓ Created src/App.${ext}`));

  // Counter component
  await fs.writeFile(
    path.join(projectPath, 'src', 'components', `Counter.${ext}`),
    generateCounterComponent(config)
  );
  console.log(pc.green(`  ✓ Created src/components/Counter.${ext}`));

  // Routes
  await fs.writeFile(
    path.join(projectPath, 'src', 'routes', `index.${ext}`),
    generateHomeRoute(config)
  );
  console.log(pc.green(`  ✓ Created src/routes/index.${ext}`));

  if (config.cssFramework === 'none') {
    await fs.writeFile(
      path.join(projectPath, 'src', 'App.css'),
      generateBasicCSS()
    );
    console.log(pc.green('  ✓ Created src/App.css'));
  }
}

async function generateSSRTemplate(projectPath: string, config: ProjectConfig, ext: string): Promise<void> {
  await generateBasicTemplate(projectPath, config, ext);

  // SSR entry files
  const jsExt = config.typescript ? 'ts' : 'js';
  await fs.writeFile(
    path.join(projectPath, 'src', `entry-server.${jsExt}`),
    generateSSREntryServer(config)
  );
  console.log(pc.green(`  ✓ Created src/entry-server.${jsExt}`));

  await fs.writeFile(
    path.join(projectPath, 'src', `entry-client.${jsExt}`),
    generateSSREntryClient(config)
  );
  console.log(pc.green(`  ✓ Created src/entry-client.${jsExt}`));

  await fs.writeFile(
    path.join(projectPath, `server.${jsExt}`),
    generateExpressServer(config)
  );
  console.log(pc.green(`  ✓ Created server.${jsExt}`));
}

async function generateSPATemplate(projectPath: string, config: ProjectConfig, ext: string): Promise<void> {
  await generateBasicTemplate(projectPath, config, ext);

  // Additional routes for SPA
  await fs.writeFile(
    path.join(projectPath, 'src', 'routes', `about.${ext}`),
    generateAboutRoute(config)
  );
  console.log(pc.green(`  ✓ Created src/routes/about.${ext}`));

  await fs.writeFile(
    path.join(projectPath, 'src', 'routes', `_layout.${ext}`),
    generateLayoutComponent(config)
  );
  console.log(pc.green(`  ✓ Created src/routes/_layout.${ext}`));
}

async function generateFullstackTemplate(projectPath: string, config: ProjectConfig, ext: string): Promise<void> {
  await generateSSRTemplate(projectPath, config, ext);

  // API routes
  const jsExt = config.typescript ? 'ts' : 'js';
  await fs.writeFile(
    path.join(projectPath, 'src', 'api', `hello.${jsExt}`),
    generateAPIRoute(config)
  );
  console.log(pc.green(`  ✓ Created src/api/hello.${jsExt}`));

  // Database setup
  await fs.writeFile(
    path.join(projectPath, 'src', 'db', `schema.${jsExt}`),
    generateDBSchema(config)
  );
  console.log(pc.green(`  ✓ Created src/db/schema.${jsExt}`));

  await fs.writeFile(
    path.join(projectPath, '.env.example'),
    generateEnvExample()
  );
  console.log(pc.green('  ✓ Created .env.example'));
}

async function generateLibraryTemplate(projectPath: string, config: ProjectConfig): Promise<void> {
  const jsExt = config.typescript ? 'ts' : 'js';

  await fs.writeFile(
    path.join(projectPath, 'src', 'lib', `index.${jsExt}`),
    generateLibraryIndex(config)
  );
  console.log(pc.green(`  ✓ Created src/lib/index.${jsExt}`));

  await fs.writeFile(
    path.join(projectPath, 'rollup.config.js'),
    generateRollupConfig(config)
  );
  console.log(pc.green('  ✓ Created rollup.config.js'));

  await fs.writeFile(
    path.join(projectPath, 'examples', 'basic.html'),
    generateLibraryExample(config)
  );
  console.log(pc.green('  ✓ Created examples/basic.html'));
}

async function generateConfigFiles(projectPath: string, config: ProjectConfig): Promise<void> {
  // TypeScript config
  if (config.typescript) {
    await fs.writeFile(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(generateTSConfig(config), null, 2)
    );
    console.log(pc.green('  ✓ Created tsconfig.json'));
  }

  // Vite config
  await fs.writeFile(
    path.join(projectPath, config.typescript ? 'vite.config.ts' : 'vite.config.js'),
    generateViteConfig(config)
  );
  console.log(pc.green(`  ✓ Created vite.config.${config.typescript ? 'ts' : 'js'}`));

  // Tailwind config
  if (config.cssFramework === 'tailwind') {
    await fs.writeFile(
      path.join(projectPath, 'tailwind.config.js'),
      generateTailwindConfig()
    );
    console.log(pc.green('  ✓ Created tailwind.config.js'));

    await fs.writeFile(
      path.join(projectPath, 'postcss.config.js'),
      generatePostCSSConfig()
    );
    console.log(pc.green('  ✓ Created postcss.config.js'));

    await fs.writeFile(
      path.join(projectPath, 'src', 'index.css'),
      generateTailwindCSS()
    );
    console.log(pc.green('  ✓ Created src/index.css'));
  }

  // ESLint config
  if (config.linting) {
    await fs.writeFile(
      path.join(projectPath, '.eslintrc.json'),
      JSON.stringify(generateESLintConfig(config), null, 2)
    );
    console.log(pc.green('  ✓ Created .eslintrc.json'));

    await fs.writeFile(
      path.join(projectPath, '.prettierrc.json'),
      JSON.stringify(generatePrettierConfig(), null, 2)
    );
    console.log(pc.green('  ✓ Created .prettierrc.json'));
  }

  // Vitest config
  if (config.testing) {
    await fs.writeFile(
      path.join(projectPath, config.typescript ? 'vitest.config.ts' : 'vitest.config.js'),
      generateVitestConfig(config)
    );
    console.log(pc.green(`  ✓ Created vitest.config.${config.typescript ? 'ts' : 'js'}`));

    // Example test
    const ext = config.typescript ? 'tsx' : 'jsx';
    await fs.writeFile(
      path.join(projectPath, 'tests', `App.test.${ext}`),
      generateExampleTest(config)
    );
    console.log(pc.green(`  ✓ Created tests/App.test.${ext}`));
  }

  // .gitignore
  await fs.writeFile(
    path.join(projectPath, '.gitignore'),
    generateGitignore()
  );
  console.log(pc.green('  ✓ Created .gitignore'));

  // README.md
  await fs.writeFile(
    path.join(projectPath, 'README.md'),
    generateReadme(config)
  );
  console.log(pc.green('  ✓ Created README.md'));
}

// File content generators
function generatePackageJson(config: ProjectConfig) {
  const pkg: any = {
    name: config.name,
    version: '0.1.0',
    private: config.template !== 'library',
    type: 'module',
    scripts: {
      dev: config.template === 'ssr' || config.template === 'fullstack'
        ? 'node server.js'
        : 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      'philjs-core': '^0.1.0',
    },
    devDependencies: {
      'vite': '^6.4.1',
    },
  };

  // Add template-specific dependencies
  if (config.template !== 'library') {
    pkg.dependencies['philjs-router'] = '^0.1.0';
  }

  if (config.template === 'ssr' || config.template === 'fullstack') {
    pkg.dependencies['philjs-ssr'] = '^0.1.0';
    pkg.dependencies['philjs-islands'] = '^0.1.0';
    pkg.dependencies['express'] = '^4.18.2';
    pkg.dependencies['compression'] = '^1.7.4';
    pkg.dependencies['sirv'] = '^2.0.4';
  }

  if (config.template === 'fullstack') {
    pkg.dependencies['philjs-graphql'] = '^0.1.0';
  }

  // TypeScript
  if (config.typescript) {
    pkg.devDependencies['typescript'] = '^5.7.2';
    pkg.devDependencies['@types/node'] = '^22.10.5';
  }

  // CSS frameworks
  if (config.cssFramework === 'tailwind') {
    pkg.devDependencies['tailwindcss'] = '^3.4.1';
    pkg.devDependencies['postcss'] = '^8.4.35';
    pkg.devDependencies['autoprefixer'] = '^10.4.17';
  } else if (config.cssFramework === 'styled') {
    pkg.dependencies['@emotion/styled'] = '^11.11.0';
    pkg.dependencies['@emotion/react'] = '^11.11.3';
  }

  // Testing
  if (config.testing) {
    const framework = config.testFramework || 'vitest';
    pkg.scripts.test = framework === 'vitest' ? 'vitest run' : 'jest';
    pkg.scripts['test:watch'] = framework === 'vitest' ? 'vitest' : 'jest --watch';

    if (framework === 'vitest') {
      pkg.devDependencies['vitest'] = '^3.2.4';
      pkg.devDependencies['@vitest/ui'] = '^3.2.4';
      pkg.devDependencies['happy-dom'] = '^15.11.7';
    } else {
      pkg.devDependencies['jest'] = '^29.7.0';
      pkg.devDependencies['@testing-library/jest-dom'] = '^6.1.5';
    }
    pkg.devDependencies['@testing-library/dom'] = '^10.4.0';
  }

  // Linting
  if (config.linting) {
    pkg.scripts.lint = 'eslint . --ext .ts,.tsx,.js,.jsx';
    pkg.scripts['lint:fix'] = 'eslint . --ext .ts,.tsx,.js,.jsx --fix';
    pkg.scripts.format = 'prettier --write "src/**/*.{ts,tsx,js,jsx,css,md}"';
    pkg.devDependencies['eslint'] = '^9.17.0';
    pkg.devDependencies['prettier'] = '^3.4.2';

    if (config.typescript) {
      pkg.devDependencies['@typescript-eslint/eslint-plugin'] = '^8.20.0';
      pkg.devDependencies['@typescript-eslint/parser'] = '^8.20.0';
    }
  }

  // Library-specific
  if (config.template === 'library') {
    pkg.main = './dist/index.js';
    pkg.types = './dist/index.d.ts';
    pkg.exports = {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
      },
    };
    pkg.files = ['dist'];
    pkg.scripts.build = 'rollup -c';
    pkg.devDependencies['rollup'] = '^4.28.1';
    pkg.devDependencies['@rollup/plugin-typescript'] = '^12.1.2';
    pkg.devDependencies['@rollup/plugin-node-resolve'] = '^15.3.0';
  }

  return pkg;
}

function generateIndexHtml(config: ProjectConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${config.name} - Built with PhilJS" />
    <title>${config.name}</title>${config.cssFramework === 'tailwind' ? '\n    <link rel="stylesheet" href="/src/index.css" />' : ''}
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${config.typescript ? 'tsx' : 'jsx'}"></script>
  </body>
</html>
`;
}

function generateMainFile(config: ProjectConfig): string {
  if (config.template === 'library') {
    return '';
  }

  const importCss = config.cssFramework === 'none' ? "\nimport './App.css';" : '';

  return `import { render } from 'philjs-core';
import { createRouter } from 'philjs-router';
import App from './App';${importCss}

const router = createRouter({
  routes: [
    { path: '/', component: () => import('./routes/index') },${config.template === 'spa' || config.template === 'fullstack' ? `
    { path: '/about', component: () => import('./routes/about') },` : ''}
  ],
});

render(<App router={router} />, document.getElementById('app'));
`;
}

function generateBasicApp(config: ProjectConfig): string {
  const typeAnnotation = config.typescript ? ': { router: any }' : '';

  return `${config.typescript ? "import type { JSX } from 'philjs-core';\n" : ''}import { RouterView } from 'philjs-router';

export default function App({ router }${typeAnnotation}) {
  return (
    <div className="app">
      <RouterView router={router} />
    </div>
  );
}
`;
}

function generateCounterComponent(config: ProjectConfig): string {
  return `import { signal } from 'philjs-core';

export function Counter() {
  const count = signal(0);

  return (
    <div className="counter">
      <button onClick={() => count.set(c => c - 1)}>-</button>
      <span className="count">{count()}</span>
      <button onClick={() => count.set(c => c + 1)}>+</button>
    </div>
  );
}
`;
}

function generateHomeRoute(config: ProjectConfig): string {
  return `import { Counter } from '../components/Counter';

export default function Home() {
  return (
    <div className="home">
      <h1>Welcome to ${config.name}</h1>
      <p>Built with PhilJS - The framework that thinks ahead</p>
      <Counter />
    </div>
  );
}
`;
}

function generateAboutRoute(config: ProjectConfig): string {
  return `export default function About() {
  return (
    <div className="about">
      <h1>About ${config.name}</h1>
      <p>This is a PhilJS application with:</p>
      <ul>
        <li>Fine-grained reactivity with signals</li>
        <li>Zero-hydration resumability</li>
        <li>Smart prefetching</li>
        <li>Built-in view transitions</li>
      </ul>
    </div>
  );
}
`;
}

function generateLayoutComponent(config: ProjectConfig): string {
  return `import { Link } from 'philjs-router';

export default function Layout({ children }${config.typescript ? ': { children: any }' : ''}) {
  return (
    <div className="layout">
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
`;
}

function generateSSREntryServer(config: ProjectConfig): string {
  return `import { renderToString } from 'philjs-ssr';
import App from './App';

export function render(url${config.typescript ? ': string' : ''}) {
  const html = renderToString(<App url={url} />);
  return { html };
}
`;
}

function generateSSREntryClient(config: ProjectConfig): string {
  return `import { hydrate } from 'philjs-core';
import App from './App';

hydrate(<App />, document.getElementById('app'));
`;
}

function generateExpressServer(config: ProjectConfig): string {
  return `import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createServer as createViteServer } from 'vite';

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

      if (!isProduction) {
        template = await vite.transformIndexHtml(url,
          await vite.ssrLoadModule('/index.html')
        );
        render = (await vite.ssrLoadModule('/src/entry-server.${config.typescript ? 'ts' : 'js'}')).render;
      } else {
        template = await fs.readFile(
          resolve(__dirname, 'dist/client/index.html'),
          'utf-8'
        );
        render = (await import('./dist/server/entry-server.js')).render;
      }

      const { html: appHtml } = render(url);
      const html = template.replace('<!--app-html-->', appHtml);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      !isProduction && vite.ssrFixStacktrace(e);
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

function generateAPIRoute(config: ProjectConfig): string {
  return `import type { Request, Response } from 'express';

export async function GET(req${config.typescript ? ': Request' : ''}, res${config.typescript ? ': Response' : ''}) {
  return res.json({ message: 'Hello from PhilJS API!' });
}

export async function POST(req${config.typescript ? ': Request' : ''}, res${config.typescript ? ': Response' : ''}) {
  const body = req.body;
  return res.json({ received: body });
}
`;
}

function generateDBSchema(config: ProjectConfig): string {
  return `// Database schema example
// Replace with your preferred ORM (Prisma, Drizzle, etc.)

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
}
`;
}

function generateEnvExample(): string {
  return `# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# API Keys
API_KEY=your-api-key-here

# App Config
NODE_ENV=development
PORT=3000
`;
}

function generateLibraryIndex(config: ProjectConfig): string {
  return `/**
 * ${config.name}
 * A PhilJS library
 */

export { version } from '../package.json';

// Export your library components/functions here
export function hello(name${config.typescript ? ': string' : ''})${config.typescript ? ': string' : ''} {
  return \`Hello, \${name}!\`;
}
`;
}

function generateRollupConfig(config: ProjectConfig): string {
  return `import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/lib/index.${config.typescript ? 'ts' : 'js'}',
  output: {
    file: 'dist/index.js',
    format: 'esm',
  },
  external: ['philjs-core'],
  plugins: [
    resolve(),${config.typescript ? '\n    typescript({ tsconfig: \'./tsconfig.json\' }),' : ''}
  ],
};
`;
}

function generateLibraryExample(config: ProjectConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.name} Example</title>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { hello } from '../dist/index.js';
    document.getElementById('app').textContent = hello('World');
  </script>
</body>
</html>
`;
}

function generateBasicCSS(): string {
  return `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.home, .about {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h1 {
  margin-bottom: 1rem;
  color: #2563eb;
}

.counter {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
}

.counter button {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
}

.counter button:hover {
  background: #1d4ed8;
}

.count {
  font-size: 2rem;
  font-weight: bold;
  min-width: 3rem;
  text-align: center;
}

nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

nav a {
  color: #2563eb;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

nav a:hover {
  background: #eff6ff;
}
`;
}

function generateTSConfig(config: ProjectConfig) {
  const baseConfig: any = {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      jsx: 'react-jsx',
      jsxImportSource: 'philjs-core',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      allowImportingTsExtensions: true,
      strict: true,
      noEmit: config.template !== 'library',
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
      types: ['vite/client'],
    },
    include: ['src'],
    exclude: ['node_modules', 'dist'],
  };

  if (config.template === 'library') {
    baseConfig.compilerOptions.declaration = true;
    baseConfig.compilerOptions.declarationMap = true;
    baseConfig.compilerOptions.outDir = 'dist';
  }

  return baseConfig;
}

function generateViteConfig(config: ProjectConfig): string {
  const imports = ["import { defineConfig } from 'vite';"];
  const plugins = [];

  if (config.cssFramework === 'tailwind') {
    plugins.push('// Tailwind is handled by PostCSS');
  }

  return `${imports.join('\n')}

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'philjs-core',
  },${plugins.length > 0 ? `\n  plugins: [\n    ${plugins.join(',\n    ')}\n  ],` : ''}
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },${config.template === 'ssr' || config.template === 'fullstack' ? `\n  ssr: {\n    noExternal: ['philjs-core', 'philjs-router', 'philjs-ssr'],\n  },` : ''}
});
`;
}

function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
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
`;
}

function generatePostCSSConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
}

function generateTailwindCSS(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
}

function generateESLintConfig(config: ProjectConfig) {
  return {
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    extends: [
      'eslint:recommended',
      ...(config.typescript ? ['plugin:@typescript-eslint/recommended'] : []),
    ],
    parser: config.typescript ? '@typescript-eslint/parser' : undefined,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    plugins: config.typescript ? ['@typescript-eslint'] : [],
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
    },
  };
}

function generatePrettierConfig() {
  return {
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 100,
    tabWidth: 2,
  };
}

function generateVitestConfig(config: ProjectConfig): string {
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.${config.typescript ? 'ts' : 'js'}'],
  },
});
`;
}

function generateExampleTest(config: ProjectConfig): string {
  return `import { describe, it, expect } from 'vitest';
import { render } from 'philjs-testing';
import App from '../src/App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App router={{}} />);
    expect(container).toBeTruthy();
  });
});
`;
}

function generateGitignore(): string {
  return `# Dependencies
node_modules
.pnpm-store

# Build outputs
dist
dist-ssr
*.local

# Environment
.env
.env.local
.env.production

# Editor
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage
.nyc_output

# Temp
.tmp
.cache
`;
}

function generateReadme(config: ProjectConfig): string {
  return `# ${config.name}

Built with [PhilJS](https://github.com/yourusername/philjs) - The framework that thinks ahead.

## Features

- ⚡ Fine-grained reactivity with signals
- 🔄 Zero-hydration resumability
- 🧠 Smart prefetching + intent-based navigation
- 🎬 Built-in view transitions
${config.template === 'ssr' || config.template === 'fullstack' ? '- 🏝️ Islands architecture\n' : ''}- 📊 Performance budgets & usage analytics

## Getting Started

\`\`\`bash
# Install dependencies
${config.packageManager} install

# Start dev server
${config.packageManager} ${config.packageManager === 'npm' ? 'run ' : ''}dev

# Build for production
${config.packageManager} ${config.packageManager === 'npm' ? 'run ' : ''}build
${config.testing ? `
# Run tests
${config.packageManager} ${config.packageManager === 'npm' ? 'run ' : ''}test
` : ''}\`\`\`

## Project Structure

\`\`\`
src/
${config.template === 'library' ? '  lib/              # Library source code' : `  routes/           # Application routes
  components/       # Reusable components`}${config.template === 'fullstack' ? `
  api/              # API routes
  db/               # Database schema` : ''}
public/            # Static assets
\`\`\`

## Learn More

- [PhilJS Documentation](https://philjs.dev)
- [Examples](https://philjs.dev/examples)
- [GitHub](https://github.com/yourusername/philjs)

## License

MIT
`;
}

function printSuccessMessage(config: ProjectConfig): void {
  console.log(pc.green('\n✓ Project created successfully!\n'));
  console.log(pc.cyan('Next steps:\n'));
  console.log(pc.dim(`  cd ${config.name}`));
  console.log(pc.dim(`  ${config.packageManager} install`));
  console.log(pc.dim(`  ${config.packageManager} ${config.packageManager === 'npm' ? 'run ' : ''}dev\n`));

  console.log(pc.cyan('Features enabled:\n'));
  console.log(pc.green(`  ✓ Template: ${config.template}`));
  console.log(pc.green(`  ✓ Language: ${config.typescript ? 'TypeScript' : 'JavaScript'}`));
  console.log(pc.green(`  ✓ CSS: ${config.cssFramework}`));
  if (config.testing) console.log(pc.green(`  ✓ Testing: ${config.testFramework}`));
  if (config.linting) console.log(pc.green('  ✓ ESLint & Prettier'));
  if (config.git) console.log(pc.green('  ✓ Git initialized'));
  console.log();
}
