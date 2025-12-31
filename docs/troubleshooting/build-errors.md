# Build Errors

Comprehensive guide to diagnosing and fixing build errors in PhilJS applications.

## Common Build Errors

### 1. Module Not Found

**Error:**
```
Error: Cannot find module '@/components/Button'
Error: Cannot resolve './utils'
Error: Module not found: Can't resolve '@philjs/core'
```

#### Solution 1: Check Import Path

```tsx
// Problem: Wrong path
import { Button } from '@/components/Button'; // Path doesn't exist

// Solution: Correct path
import { Button } from './components/Button';
import { Button } from '../components/Button';
import { Button } from '../../components/Button';
```

#### Solution 2: Configure Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  }
});
```

#### Solution 3: Install Missing Dependencies

```bash
# Check if package is installed
npm list @philjs/core

# Install missing package
npm install @philjs/core

# Install all dependencies
npm install

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 2. JSX Transform Errors

**Error:**
```
Error: pragma and pragmaFrag cannot be set when runtime is automatic
Error: 'React' refers to a UMD global, but the current file is a module
```

#### Solution: Configure JSX

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@philjs/core",
    "types": ["vite/client"]
  }
}
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
    jsxInject: `import { jsx, Fragment } from '@philjs/core'`
  }
});
```

### 3. TypeScript Errors

**Error:**
```
TS2307: Cannot find module '@philjs/core' or its corresponding type declarations
TS2322: Type 'string' is not assignable to type 'number'
TS2339: Property 'xyz' does not exist on type 'Props'
```

#### Solution 1: Module Resolution

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

#### Solution 2: Type Definitions

```bash
# Install type definitions
npm install -D @types/node

# For React types (if needed)
npm install -D @types/react @types/react-dom
```

```typescript
// For custom type definitions
// src/types/global.d.ts
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '@philjs/core' {
  // Add any missing type definitions
}
```

#### Solution 3: Fix Type Errors

```tsx
// Problem: Type mismatch
interface Props {
  count: number;
}

function Component({ count }: Props) {
  return <div>{count}</div>;
}

// Wrong usage
<Component count="5" /> // Error!

// Solution: Correct type
<Component count={5} />

// Or update interface
interface Props {
  count: number | string;
}
```

### 4. Import/Export Errors

**Error:**
```
SyntaxError: The requested module doesn't provide an export named 'xyz'
Error: export 'default' (imported as 'Component') was not found
```

#### Solution 1: Check Exports

```tsx
// Problem: Wrong export/import
// component.ts
export function MyComponent() { }

// main.ts
import MyComponent from './component'; // Wrong! Not default export

// Solution: Match export type
// component.ts
export function MyComponent() { }

// main.ts
import { MyComponent } from './component'; // Correct!

// Or use default export
// component.ts
export default function MyComponent() { }

// main.ts
import MyComponent from './component'; // Correct!
```

#### Solution 2: Re-exports

```typescript
// Problem: Re-export issue
// index.ts
export * from './component';

// If component.ts has default export, it won't be re-exported
// Solution: Explicitly re-export default
export { default as MyComponent } from './component';

// Or export everything
export * from './component';
export { default } from './component';
```

### 5. Circular Dependency

**Error:**
```
Warning: Circular dependency detected
ReferenceError: Cannot access 'X' before initialization
```

#### Solution: Break Circular Dependencies

```typescript
// Problem: Circular dependency
// a.ts
import { B } from './b';
export class A {
  b = new B();
}

// b.ts
import { A } from './a';
export class B {
  a = new A(); // Circular!
}

// Solution 1: Combine into one file
// shared.ts
export class A {
  b: B | null = null;
}
export class B {
  a: A | null = null;
}

// Solution 2: Use dependency injection
// a.ts
export class A {
  constructor(public b: B) {}
}

// b.ts
export class B {
  constructor(public a: A) {}
}

// main.ts
const a = new A(null as any);
const b = new B(a);
a.b = b;

// Solution 3: Extract interface
// interfaces.ts
export interface IA { }
export interface IB { }

// a.ts
import { IB } from './interfaces';
export class A {
  b: IB | null = null;
}

// b.ts
import { IA } from './interfaces';
export class B {
  a: IA | null = null;
}
```

### 6. Dynamic Import Errors

**Error:**
```
Error: Cannot find module './lazy-component'
Error: Dynamic import failed
```

#### Solution: Fix Dynamic Imports

```tsx
// Problem: Wrong dynamic import syntax
const LazyComponent = import('./LazyComponent'); // Wrong!

// Solution: Use lazy helper
import { lazy } from '@philjs/core';

const LazyComponent = lazy(() => import('./LazyComponent'));

// Usage
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

```typescript
// For non-component dynamic imports
async function loadModule() {
  try {
    const module = await import('./module');
    module.doSomething();
  } catch (err) {
    console.error('Failed to load module:', err);
  }
}
```

### 7. CSS/Asset Import Errors

**Error:**
```
Error: Cannot find module './styles.css'
Error: Unexpected token '<' (importing SVG)
```

#### Solution: Configure Asset Handling

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg'],

  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
});
```

```typescript
// For TypeScript
// src/types/assets.d.ts
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}
```

```tsx
// Usage
import styles from './Component.module.css';
import logo from './logo.svg';
import image from './image.png';

function Component() {
  return (
    <div className={styles.container}>
      <img src={logo} alt="Logo" />
      <img src={image} alt="Image" />
    </div>
  );
}
```

### 8. Out of Memory Errors

**Error:**
```
FATAL ERROR: Reached heap limit Allocation failed
JavaScript heap out of memory
```

#### Solution: Increase Memory Limit

```json
// package.json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max-old-space-size=4096' vite",
    "build": "NODE_OPTIONS='--max-old-space-size=8192' vite build"
  }
}
```

```bash
# Or set environment variable
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build

# Windows
set NODE_OPTIONS=--max-old-space-size=8192
npm run build
```

#### Optimize Build

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false // Disable source maps to save memory
  }
});
```

### 9. Plugin Errors

**Error:**
```
Error: Plugin "xyz" not found
Error: Could not resolve plugin
```

#### Solution: Install and Configure Plugins

```bash
# Install missing plugin
npm install -D @vitejs/plugin-react

# Or for PhilJS
npm install -D @philjs/compiler
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from '@philjs/compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      // Plugin options
    })
  ]
});
```

### 10. Dependency Version Conflicts

**Error:**
```
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Found: @philjs/core@1.0.0
npm ERR! Could not resolve dependency
```

#### Solution: Resolve Version Conflicts

```bash
# Check for conflicts
npm ls @philjs/core

# Force install (use with caution)
npm install --force

# Or use legacy peer deps
npm install --legacy-peer-deps

# Update dependencies
npm update

# Clean install
rm -rf node_modules package-lock.json
npm install
```

```json
// package.json - Pin specific versions
{
  "dependencies": {
    "@philjs/core": "^1.0.0",
    "@philjs/router": "^1.0.0"
  },
  "resolutions": {
    "@philjs/core": "1.0.0"
  }
}
```

## Build Configuration Issues

### Vite Configuration

```typescript
// vite.config.ts - Complete example
import { defineConfig } from 'vite';
import path from 'path';
import philjs from '@philjs/compiler/vite';

export default defineConfig({
  plugins: [philjs()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './src')
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json']
  },

  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@philjs/core', '@philjs/router']
        }
      }
    }
  },

  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },

  esbuild: {
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
    jsxInject: `import { jsx, Fragment } from '@philjs/core'`
  }
});
```

### TypeScript Configuration

```json
// tsconfig.json - Complete example
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "jsxImportSource": "@philjs/core",

    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    "strict": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    },

    "types": ["vite/client", "node"]
  },
  "include": ["src/**/*", "src/**/*.tsx", "src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Debugging Build Errors

### Verbose Output

```bash
# Get more detailed error messages
npm run build -- --debug

# Vite verbose output
DEBUG=vite:* npm run build

# Node verbose
NODE_DEBUG=module npm run build
```

### Isolate the Problem

```bash
# Build specific entry point
vite build src/main.tsx

# Skip type checking
vite build --mode production

# Build without minification
vite build --minify false
```

### Check Dependencies

```bash
# Verify all dependencies are installed
npm ls

# Check for security issues
npm audit

# Check for outdated packages
npm outdated

# Update packages
npm update
```

### Clear Caches

```bash
# Clear npm cache
npm cache clean --force

# Clear Vite cache
rm -rf node_modules/.vite

# Clear build output
rm -rf dist

# Full clean
rm -rf node_modules package-lock.json dist node_modules/.vite
npm install
```

## Environment-Specific Issues

### Development vs Production

```typescript
// Use environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Development-only code
if (import.meta.env.DEV) {
  console.log('Development mode');
}

// Production-only code
if (import.meta.env.PROD) {
  console.log('Production mode');
}
```

```bash
# .env.development
VITE_API_URL=http://localhost:8080
VITE_DEBUG=true

# .env.production
VITE_API_URL=https://api.example.com
VITE_DEBUG=false
```

### Platform-Specific Issues

```typescript
// Windows vs Unix paths
import path from 'path';

// Wrong - hardcoded separator
const filePath = 'src/components/Button.tsx';

// Correct - use path.join
const filePath = path.join('src', 'components', 'Button.tsx');

// Or use URL for imports
const filePath = new URL('./components/Button.tsx', import.meta.url);
```

## Build Performance

### Optimize Build Speed

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // Use esbuild for faster builds
    minify: 'esbuild',

    // Reduce chunk size calculations
    reportCompressedSize: false,

    // Skip source maps in development
    sourcemap: false
  },

  optimizeDeps: {
    // Pre-bundle dependencies
    include: ['@philjs/core', '@philjs/router'],

    // Exclude large dependencies
    exclude: ['large-package']
  }
});
```

### Monitor Build Size

```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Or use rollup plugin
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

## Common Build Warnings

### Chunk Size Warning

```
(!) Some chunks are larger than 500 kB after minification
```

**Solution:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit

    rollupOptions: {
      output: {
        manualChunks: {
          // Split large chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@mui/material'],
          'vendor-utils': ['lodash', 'date-fns']
        }
      }
    }
  }
});
```

### Circular Dependency Warning

```
(!) Circular dependencies detected
```

**Solution:** Refactor code to break circular dependencies (see section above).

### Source Map Warning

```
Warning: Sourcemap is likely to be incorrect
```

**Solution:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: 'hidden', // Generate but don't reference in code
    // or
    sourcemap: false // Disable completely
  }
});
```

## Build Checklist

Before deploying:

- [ ] All dependencies installed (`npm install`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Bundle size acceptable
- [ ] Source maps configured correctly
- [ ] Environment variables set
- [ ] Assets optimized
- [ ] Security audit clean (`npm audit`)

## Summary

**Common Build Errors:**
- Module not found
- JSX transform issues
- TypeScript errors
- Import/export mismatches
- Circular dependencies
- Dynamic import problems
- Asset loading issues
- Out of memory
- Plugin errors
- Dependency conflicts

**Solutions:**
- Configure path aliases correctly
- Set up JSX transform
- Fix TypeScript configuration
- Match export/import types
- Break circular dependencies
- Use proper dynamic import syntax
- Configure asset handling
- Increase Node memory
- Install and configure plugins
- Resolve dependency versions

**Prevention:**
- Use TypeScript for type safety
- Configure linting
- Set up pre-commit hooks
- Document configuration
- Test builds regularly

**Next:**
- [TypeScript Errors](./typescript-errors.md) - TypeScript-specific issues
- [Common Issues](./common-issues.md) - Runtime problems
- [Debugging Guide](./debugging.md) - Debugging techniques
