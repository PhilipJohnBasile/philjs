# Installation

Get PhilJS up and running in less than a minute.


## Prerequisites

Before installing PhilJS, make sure you have:

- **Node.js 24.0 or higher** (Node 25 supported) ([Download here](https://nodejs.org/))
- **npm**, **pnpm**, **yarn**, or **bun** package manager
- **TypeScript 6.0 or higher**

Check your Node version:
```bash
node --version
# Should output v24.0.0 or higher
```

PhilJS requires Node.js 24+ to take advantage of:
- Native ESM support with import attributes
- Built-in `Promise.withResolvers()`
- Native `Object.groupBy()` and `Map.groupBy()`
- Improved performance with V8 optimizations
- Native WebSocket client support

**Tip**: We recommend using **pnpm** for faster installs and better disk space usage.

## Quick Start with create-philjs

The fastest way to get started is with `create-philjs`:

### Using npm
```bash
npm create philjs@latest my-app
cd my-app
npm install
npm run dev
```

### Using pnpm (recommended)
```bash
pnpm create philjs my-app
cd my-app
pnpm install
pnpm dev
```

### Using yarn
```bash
yarn create philjs my-app
cd my-app
yarn install
yarn dev
```

### Using bun
```bash
bun create philjs my-app
cd my-app
bun install
bun dev
```

After running `dev`, open [http://localhost:3000](http://localhost:3000) in your browser. You should see your new PhilJS app running!

## Interactive Setup

When you run `create-philjs`, you'll be asked some questions:

```
✔ What is your project named? › my-app
✔ TypeScript (required) › Yes
✔ Would you like to use Tailwind CSS? › Yes
✔ Initialize a git repository? › Yes
✔ Install dependencies? › Yes
```

### Options Explained

**TypeScript** (Required)
- TypeScript is required for PhilJS projects
- PhilJS is built with TypeScript and has excellent type inference
- All templates are TypeScript-first

**Tailwind CSS** (Optional)
- Utility-first CSS framework
- Great for rapid development
- Say "No" if you prefer other styling approaches

**Git Repository** (Recommended)
- Initializes git for version control
- Creates a `.gitignore` file
- Ready for GitHub/GitLab

**Install Dependencies** (Recommended)
- Automatically runs `npm install` or equivalent
- Say "No" if you want to install manually later

## Manual Installation

If you prefer to add PhilJS to an existing project:

### 1. Install PhilJS packages

```bash
npm install @philjs/core @philjs/router @philjs/ssr

# Or with pnpm
pnpm add @philjs/core @philjs/router @philjs/ssr

# Or with yarn
yarn add @philjs/core @philjs/router @philjs/ssr

# Or with bun
bun add @philjs/core @philjs/router @philjs/ssr
```

### 2. Install dev dependencies

```bash
npm install -D vite @vitejs/plugin-react typescript
```

### 3. Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "useDefineForClassFields": true,
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "skipLibCheck": true,
    "moduleResolution": "NodeNext",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "isolatedDeclarations": true,
    "noEmit": true,
    "jsx": "preserve",
    "jsxImportSource": "@philjs/core",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4. Create `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### 5. Create `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import philjs from '@philjs/compiler/vite';

export default defineConfig({
  plugins: [philjs()],
});
```

### 6. Create `package.json` scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 7. Create your first component

Create `src/App.tsx`:
```typescript
import { signal } from '@philjs/core';

export function App() {
  const count = signal(0);

  return (
    <div>
      <h1>Welcome to PhilJS!</h1>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### 8. Create `src/index.tsx`

```typescript
import { render } from '@philjs/core';
import { App } from './App';

render(<App />, document.getElementById('root')!);
```

### 9. Create `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PhilJS App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

### 10. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you should see your app!

## Project Structure

After creating a new project, you'll see this structure:

```
my-app/
├── public/              # Static assets
│   └── favicon.ico
├── src/
│   ├── routes/         # File-based routing
│   │   └── index.tsx   # Homepage (/)
│   ├── components/     # Reusable components
│   ├── styles/         # Global styles
│   │   └── global.css
│   ├── App.tsx         # Root component
│   └── index.tsx       # Entry point
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Key Files

**`src/index.tsx`** - Application entry point
```typescript
import { render } from '@philjs/core';
import { App } from './App';

render(<App />, document.getElementById('root')!);
```

**`src/App.tsx`** - Root component
```typescript
import { Router } from '@philjs/router';

export function App() {
  return (
    <Router>
      {/* Your routes go here */}
    </Router>
  );
}
```

**`src/routes/index.tsx`** - Homepage
```typescript
export default function Home() {
  return <h1>Welcome to PhilJS!</h1>;
}
```

**`vite.config.ts`** - Build configuration
```typescript
import { defineConfig } from 'vite';
import philjs from '@philjs/compiler/vite';

export default defineConfig({
  plugins: [philjs()],
});
```

## Editor Setup

### VS Code (Recommended)

Install these extensions for the best experience:

1. **[TypeScript PhilJS Plugin](https://marketplace.visualstudio.com/items?itemName=philjs.vscode-philjs)**
   - JSX autocomplete
   - Signal type inference
   - Component prop validation

2. **[Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)**
   - If you're using Tailwind CSS

3. **[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)**
   - Linting support

4. **[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)**
   - Code formatting

#### VS Code Settings

Add to your `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### WebStorm / IntelliJ IDEA

PhilJS works great with WebStorm out of the box. For the best experience:

1. Enable TypeScript service
2. Set JSX to "React JSX"
3. Install PhilJS plugin from JetBrains Marketplace

### Other Editors

PhilJS uses standard TypeScript and JSX, so any editor with TypeScript support will work:
- **Vim/Neovim**: Use CoC or native LSP
- **Emacs**: Use `tide` or `lsp-mode`
- **Sublime Text**: Use LSP-TypeScript

## Troubleshooting

### Port 3000 already in use

If you see "Port 3000 is already in use":

```bash
# Kill the process using port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- --port 3001
```

### Module not found errors

Make sure you installed all dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

For pnpm:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript errors in JSX

Make sure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@philjs/core"
  }
}
```

### Vite not found

Install Vite as a dev dependency:

```bash
npm install -D vite
```

### "Cannot find module '@philjs/core'"

Make sure you've installed the core package:

```bash
npm install @philjs/core
```

### Windows-specific issues

**Line ending problems:**
```bash
git config core.autocrlf false
```

**Path length issues:**
Enable long paths:
```bash
git config --system core.longpaths true
```

## Next Steps

Now that PhilJS is installed, you're ready to start building:

1. **[Quick Start](./quick-start.md)** - Build your first app in 5 minutes
2. **[Your First Component](./your-first-component.md)** - Learn component basics
3. **[Tutorial: Tic-Tac-Toe](./tutorial-tic-tac-toe.md)** - Build a game and learn PhilJS concepts

## Version Information

**Current Version**: 0.1.0

**Minimum Requirements**:
- Node.js 24.0+
- TypeScript 6.0+
- Modern browser with ES2024 support

**Supported Browsers**:
- Chrome 120+
- Firefox 121+
- Safari 17.4+
- Edge 120+

**TypeScript 6 Features Used**:
- Isolated declarations for faster builds
- Enhanced type inference
- Improved `satisfies` operator
- Better const type parameters
- `NoInfer<T>` utility type

## Upgrade Guide

To upgrade to the latest version:

```bash
npm install @philjs/core@latest @philjs/router@latest @philjs/ssr@latest

# Or with pnpm
pnpm update @philjs/core @philjs/router @philjs/ssr
```

Check the [changelog](https://github.com/philjs/philjs/blob/main/CHANGELOG.md) for breaking changes.

---

**Next:** [Quick Start →](./quick-start.md)

