#!/usr/bin/env node

/**
 * create-philjs CLI
 * Zero-config project scaffolding with intelligent defaults.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { generateRouteTypes } from "philjs-router";
import type { RouteDefinition } from "philjs-router";

const TEMPLATES = {
  basic: "Basic app with routing and data fetching",
  ecommerce: "E-commerce with product catalog and cart",
  dashboard: "Admin dashboard with charts and tables",
  blog: "Blog with markdown and SEO",
  saas: "SaaS starter with auth and billing",
};

async function main() {
  console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🚀 Welcome to PhilJS Framework          ║
║   The Revolutionary Frontend Framework    ║
║                                           ║
╚═══════════════════════════════════════════╝
`);

  const projectName = process.argv[2] || await prompt("Project name:", "my-app");
  const template = await selectTemplate();
  const packageManager = await selectPackageManager();

  console.log(`\n📦 Creating ${projectName} with ${template} template...\n`);

  const projectPath = join(process.cwd(), projectName);

  if (existsSync(projectPath)) {
    console.error(`❌ Directory ${projectName} already exists!`);
    process.exit(1);
  }

  // Create project structure
  createProjectStructure(projectPath, template);

  // Generate files
  generatePackageJson(projectPath, projectName, packageManager);
  generateTsConfig(projectPath);
  generateViteConfig(projectPath);
  generateGitignore(projectPath);
  generateReadme(projectPath, projectName);
  generateAppFiles(projectPath, template);

  console.log(`\n✅ Project created successfully!\n`);
  console.log(`Next steps:\n`);
  console.log(`  cd ${projectName}`);
  console.log(`  ${packageManager} install`);
  console.log(`  ${packageManager} dev\n`);

  console.log(`📚 Features enabled:`);
  console.log(`  ✅ Performance budgets (blocks builds over budget)`);
  console.log(`  ✅ Cost tracking (see cloud costs per route)`);
  console.log(`  ✅ Usage analytics (track component usage)`);
  console.log(`  ✅ Automatic regression detection`);
  console.log(`  ✅ Dead code detection`);
  console.log(`  ✅ Spring physics animations`);
  console.log(`  ✅ Resumability (zero hydration)`);
  console.log(`  ✅ Islands architecture\n`);
}

function createProjectStructure(path: string, template: string) {
  mkdirSync(path, { recursive: true });
  mkdirSync(join(path, "src"), { recursive: true });
  mkdirSync(join(path, "src/routes"), { recursive: true });
  mkdirSync(join(path, "src/components"), { recursive: true });
  mkdirSync(join(path, "src/lib"), { recursive: true });
  mkdirSync(join(path, "public"), { recursive: true });
}

function generatePackageJson(path: string, name: string, pm: string) {
  const pkg = {
    name,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
      test: "vitest",
    },
    dependencies: {
      "philjs-core": "^0.1.0",
      "philjs-router": "^0.1.0",
      "philjs-ssr": "^0.1.0",
      "philjs-islands": "^0.1.0",
    },
    devDependencies: {
      "@types/node": "^20.11.0",
      typescript: "^5.7.2",
      vite: "^5.4.11",
      vitest: "^2.1.8",
    },
  };

  writeFileSync(
    join(path, "package.json"),
    JSON.stringify(pkg, null, 2)
  );
}

function generateTsConfig(path: string) {
  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      module: "ESNext",
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      jsx: "react-jsx",
      jsxImportSource: "philjs-core",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      allowImportingTsExtensions: true,
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
      types: ["vite/client"],
    },
    include: ["src/**/*"],
    exclude: ["node_modules"],
  };

  writeFileSync(
    join(path, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2)
  );
}

function generateViteConfig(path: string) {
  const config = `import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "philjs-core",
  },
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
    minify: "esbuild",
  },
});`;

  writeFileSync(join(path, "vite.config.ts"), config);
}

function generateGitignore(path: string) {
  const gitignore = `node_modules
dist
.DS_Store
.env
.env.local
.vscode
.idea
*.log`;

  writeFileSync(join(path, ".gitignore"), gitignore);
}

function generateReadme(path: string, name: string) {
  const readme = `# ${name}

Built with [PhilJS](https://github.com/yourusername/philjs) – the resumable framework with intelligent routing.

## Features

- ⚡ Fine-grained reactivity with signals
- 🔄 Zero-hydration resumability
- 🧠 Smart prefetching + intent-based navigation
- 🎬 Built-in view transitions
- 🏝️ Islands architecture
- 📊 Performance budgets & usage analytics
- 💰 Route-level cost tracking

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
\`\`\`

## Project Structure

\`\`\`
src/
  routes/            # High-level router pages & layouts
  components/        # Reusable UI
  lib/               # Utilities and helpers
public/              # Static assets
\`\`\`

## Learn More

- [PhilJS Documentation](https://philjs.dev)
- [Examples](https://philjs.dev/examples)
- [GitHub](https://github.com/yourusername/philjs)
`;

  writeFileSync(join(path, "README.md"), readme);
}

function generateAppFiles(path: string, template: string) {
  // index.html
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

  writeFileSync(join(path, "index.html"), html);

  // main.tsx
  const main = `import { createAppRouter } from "philjs-router";
import { routes } from "./routes";

createAppRouter({
  target: "#app",
  prefetch: true,
  transitions: { type: "fade", duration: 220 },
  routes,
});`;

  writeFileSync(join(path, "src/main.tsx"), main);

  // App.tsx
  const layout = `import { Link } from "philjs-router";

export function AppLayout({ children }: { children: any }) {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      <header style={{ padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", background: "white", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.1)" }}>
        <strong>PhilJS</strong>
        <nav style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/" style={{ color: "#334155", textDecoration: "none" }}>Home</Link>
          <Link to="/about" style={{ color: "#334155", textDecoration: "none" }}>About</Link>
          <Link to="/docs" style={{ color: "#334155", textDecoration: "none" }}>Docs</Link>
        </nav>
      </header>
      <main style={{ padding: "2rem" }}>{children}</main>
    </div>
  );
}`;

  writeFileSync(join(path, "src/routes/_layout.tsx"), layout);

  const counter = `import { signal } from "philjs-core";

export function Counter() {
  const count = signal(0);

  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      <button onClick={() => count.set(c => c - 1)}>-</button>
      <strong>{count()}</strong>
      <button onClick={() => count.set(c => c + 1)}>+</button>
    </div>
  );
}`;

  writeFileSync(join(path, "src/components/Counter.tsx"), counter);

  const homeRoute = `import { Counter } from "../components/Counter";

export function HomeRoute() {
  return (
    <section style={{ maxWidth: "720px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Welcome to PhilJS</h1>
      <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
        Start building apps with fine-grained reactivity, zero hydration resumability, and intelligent routing.
      </p>
      <Counter />
    </section>
  );
}`;

  writeFileSync(join(path, "src/routes/index.tsx"), homeRoute);

  const aboutRoute = `export function AboutRoute() {
  return (
    <section style={{ maxWidth: "720px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Why PhilJS?</h1>
      <ul style={{ color: "#475569", lineHeight: 1.7 }}>
        <li>Fine-grained signals keep components fast.</li>
        <li>Smart prefetching predicts where users will go next.</li>
        <li>View transitions make navigation feel native.</li>
      </ul>
    </section>
  );
}`;

  writeFileSync(join(path, "src/routes/about.tsx"), aboutRoute);

  const docsRoute = `import { Link } from "philjs-router";

export function DocsRoute() {
  return (
    <section style={{ maxWidth: "720px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Docs & Resources</h1>
      <p style={{ color: "#475569" }}>Explore the documentation to learn about loaders, actions, resumability, and more.</p>
      <p style={{ marginTop: "1rem" }}>
        <Link to="https://philjs.dev" style={{ color: "#2563eb", textDecoration: "none" }}>
          philjs.dev ↗
        </Link>
      </p>
    </section>
  );
}`;

  writeFileSync(join(path, "src/routes/docs.tsx"), docsRoute);

  const routesModule = `import type { RouteDefinition } from "philjs-router";
import { createRouteManifest } from "philjs-router";
import { AppLayout } from "./routes/_layout";
import { HomeRoute } from "./routes/index";
import { AboutRoute } from "./routes/about";
import { DocsRoute } from "./routes/docs";

export const routes: RouteDefinition[] = [
  {
    path: "/",
    layout: AppLayout,
    component: HomeRoute,
    children: [
      { path: "/about", component: AboutRoute },
      { path: "/docs", component: DocsRoute },
    ],
  },
];

export const routeManifest = createRouteManifest(routes);
`;

  writeFileSync(join(path, "src/routes.ts"), routesModule);

  const routeDefinitionsForTypes: RouteDefinition[] = [
    {
      path: "/",
      layout: () => null,
      component: () => null,
      children: [
        { path: "/about", component: () => null },
        { path: "/docs", component: () => null },
      ],
    },
  ];

  const routeTypes = generateRouteTypes(routeDefinitionsForTypes, {
    moduleName: "./routes",
  });

  writeFileSync(join(path, "src/routes.d.ts"), routeTypes);
}

async function prompt(message: string, defaultValue: string): Promise<string> {
  // Simplified for now - in real implementation would use inquirer or prompts
  return defaultValue;
}

async function selectTemplate(): Promise<string> {
  // Simplified - would use interactive selection
  return "basic";
}

async function selectPackageManager(): Promise<string> {
  // Auto-detect from lock files or let user choose
  if (existsSync("pnpm-lock.yaml")) return "pnpm";
  if (existsSync("yarn.lock")) return "yarn";
  return "npm";
}

main().catch((error) => {
  console.error("❌ Error creating project:", error);
  process.exit(1);
});
