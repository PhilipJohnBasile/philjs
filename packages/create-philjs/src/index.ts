#!/usr/bin/env node

/**
 * create-philjs CLI
 * Zero-config project scaffolding with intelligent defaults.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

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
  mkdirSync(join(path, "src/components"), { recursive: true });
  mkdirSync(join(path, "src/routes"), { recursive: true });
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

Built with [PhilJS](https://github.com/yourusername/philjs) - The Revolutionary Frontend Framework

## Features

- ⚡ Fine-grained reactivity with signals
- 🏝️ Islands architecture for optimal performance
- 🔄 Resumability (zero hydration cost)
- 📊 Built-in performance budgets
- 💰 Cloud cost tracking per route
- 📈 Component usage analytics
- 🎨 Spring physics animations
- 🔒 Security by default (CSRF, XSS protection)

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
  routes/          # File-based routing
  components/      # Reusable components
  lib/             # Utilities and helpers
public/            # Static assets
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
  const main = `import { render } from "philjs-core";
import { App } from "./App";

const root = document.getElementById("app");
if (root) {
  render(<App />, root);
}`;

  writeFileSync(join(path, "src/main.tsx"), main);

  // App.tsx
  const app = `import { signal } from "philjs-core";
import { Counter } from "./components/Counter";

export function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome to PhilJS</h1>
      <p>Start building revolutionary web applications!</p>
      <Counter />
    </div>
  );
}`;

  writeFileSync(join(path, "src/App.tsx"), app);

  // Counter.tsx
  const counter = `import { signal } from "philjs-core";

export function Counter() {
  const count = signal(0);

  return (
    <div>
      <h2>Count: {count()}</h2>
      <button onClick={() => count.set(c => c + 1)}>Increment</button>
      <button onClick={() => count.set(c => c - 1)}>Decrement</button>
    </div>
  );
}`;

  writeFileSync(join(path, "src/components/Counter.tsx"), counter);
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