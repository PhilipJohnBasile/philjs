# @philjs/cli - Command Line Interface

**The official CLI for PhilJS development, scaffolding, and builds.**

@philjs/cli provides everything you need to create, develop, and build PhilJS applications from the command line.

## Installation

```bash
npm install -g @philjs/cli
# or
npx @philjs/cli <command>
```

## Commands

### `philjs create`

Create a new PhilJS project with interactive prompts:

```bash
philjs create
# or
philjs create my-app
```

**Interactive Options:**
- **Project name**: Name of your new project
- **Template**: basic, ssr, spa, fullstack, or library
- **TypeScript**: Enable TypeScript support
- **CSS framework**: Tailwind, CSS Modules, Styled Components, or none
- **Testing**: Enable with Vitest or Jest
- **Linting**: Add ESLint & Prettier
- **Git**: Initialize git repository
- **Package manager**: npm, pnpm, or yarn

### Templates

| Template | Description |
|----------|-------------|
| `basic` | Basic starter with signals and routing |
| `ssr` | Server-side rendering with islands |
| `spa` | Single page app with client-side routing |
| `fullstack` | Full-stack SSR with API routes |
| `library` | Library template for creating PhilJS packages |

### `philjs dev`

Start the development server:

```bash
philjs dev

# Options
philjs dev --port 3000      # Custom port
philjs dev --host 0.0.0.0   # Expose to network
philjs dev --open           # Open browser
```

**Development Features:**
- Hot Module Replacement (HMR)
- Smart preloading with intent detection
- Performance budget monitoring
- Cost tracking dashboard
- Time-travel debugging

### `philjs build`

Build for production:

```bash
philjs build

# Options
philjs build --ssg           # Static site generation
philjs build --analyze       # Bundle analysis
philjs build --outDir dist   # Custom output directory
```

**Build Features:**
- Client and server bundles
- Automatic code splitting
- Performance budget checking
- Static site generation
- Bundle size analysis

### `philjs add`

Add packages and features to your project:

```bash
# Add a PhilJS package
philjs add router
philjs add ssr
philjs add forms
philjs add ui

# Add features
philjs add tailwind
philjs add testing
philjs add auth
```

### `philjs generate`

Generate code scaffolding:

```bash
# Generate a component
philjs generate component Button

# Generate a page/route
philjs generate page About --path /about

# Generate an API route
philjs generate api users

# Generate a hook
philjs generate hook useAuth

# Generate a store
philjs generate store cart

# Generate a context
philjs generate context Theme

# Generate full CRUD scaffold
philjs generate scaffold Product
```

### `philjs migrate`

Migrate from other frameworks:

```bash
# Migrate from React
philjs migrate --from react

# Migrate from Vue
philjs migrate --from vue

# Migrate from Svelte
philjs migrate --from svelte

# Migrate from Angular
philjs migrate --from angular
```

## Project Structure

A typical PhilJS project created with `philjs create`:

```
my-app/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Root component
│   ├── components/        # Reusable components
│   │   └── Counter.tsx
│   └── routes/            # Application routes
│       ├── index.tsx      # Home page
│       └── about.tsx      # About page
├── public/                # Static assets
└── tests/                 # Test files
```

### SSR Project Structure

```
my-app/
├── index.html
├── server.ts              # Express server
├── src/
│   ├── App.tsx
│   ├── entry-client.ts    # Client hydration
│   ├── entry-server.ts    # Server rendering
│   ├── components/
│   └── routes/
└── dist/
    ├── client/            # Client bundle
    └── server/            # Server bundle
```

### Fullstack Project Structure

```
my-app/
├── src/
│   ├── api/               # API routes
│   │   └── hello.ts
│   ├── db/                # Database schema
│   │   └── schema.ts
│   ├── components/
│   └── routes/
└── .env.example           # Environment variables
```

## Configuration

### `philjs.config.js`

```javascript
export default {
  // Project metadata
  name: 'my-app',
  description: 'My PhilJS application',

  // Build options
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: true,
  },

  // Development options
  dev: {
    port: 3000,
    host: 'localhost',
    open: true,
  },

  // Performance budgets
  performanceBudgets: {
    maxBundleSize: 100 * 1024, // 100KB
    maxInitialLoad: 50 * 1024, // 50KB
    maxChunkSize: 30 * 1024,   // 30KB
  },

  // Compiler options
  compiler: {
    autoMemo: true,
    autoBatch: true,
    deadCodeElimination: true,
  },

  // SSR options
  ssr: {
    streaming: true,
    islands: true,
  },
};
```

### Environment Variables

```bash
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=your-api-key
```

## Vite Plugin

The CLI uses a custom Vite plugin for PhilJS:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { philJSPlugin, philJSSSRPlugin } from '@philjs/cli/plugins';

export default defineConfig({
  plugins: [
    philJSPlugin(),
    // For SSR:
    philJSSSRPlugin(),
  ],
});
```

## Generator Details

### Component Generator

```bash
philjs generate component UserCard
```

Creates:
```tsx
// src/components/UserCard.tsx
import { signal } from '@philjs/core';

interface UserCardProps {
  name: string;
}

export function UserCard({ name }: UserCardProps) {
  return (
    <div class="user-card">
      <h3>{name}</h3>
    </div>
  );
}
```

### Page Generator

```bash
philjs generate page Dashboard --path /dashboard
```

Creates route file and updates router configuration.

### API Generator

```bash
philjs generate api products
```

Creates:
```typescript
// src/api/products.ts
export async function GET(req, res) {
  return res.json({ products: [] });
}

export async function POST(req, res) {
  const body = req.body;
  return res.json({ created: body });
}
```

### Scaffold Generator

```bash
philjs generate scaffold Product
```

Creates full CRUD:
- `src/api/products.ts` - API routes
- `src/components/ProductList.tsx`
- `src/components/ProductForm.tsx`
- `src/components/ProductDetail.tsx`
- `src/routes/products/index.tsx`
- `src/routes/products/[id].tsx`

## Best Practices

1. **Use TypeScript**: Better DX with full type checking
2. **Choose the right template**: Start with the template closest to your needs
3. **Set performance budgets**: Catch size regressions early
4. **Use generators**: Consistent code structure
5. **Configure ESLint**: Catch issues early

## Next Steps

- [Getting Started](../../getting-started/introduction.md) - Full tutorial
- [Project Structure](../../getting-started/project-structure.md) - Detailed structure
- [@philjs/compiler](../compiler/overview.md) - Build optimizations
