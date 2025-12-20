# PhilJS Path Utilities & Glob Imports

Complete guide to SvelteKit-style path utilities and Astro-style glob imports in PhilJS.

## Table of Contents

1. [Path Utilities](#path-utilities)
2. [Glob Imports](#glob-imports)
3. [Virtual Modules](#virtual-modules)
4. [File Utilities](#file-utilities)
5. [Examples](#examples)

---

## Path Utilities

SvelteKit-style path management for your PhilJS applications.

### Configuration

```typescript
import { configurePaths } from '@philjs/core';

configurePaths({
  base: '/my-app',
  assets: 'https://cdn.example.com/assets',
  trailingSlash: 'never'
});
```

### API Reference

#### `base()`

Get the base path of the application.

```typescript
import { base } from '@philjs/core';

console.log(base()); // '/my-app'
```

#### `assets()`

Get the assets path (CDN or base path).

```typescript
import { assets } from '@philjs/core';

console.log(assets()); // 'https://cdn.example.com/assets'
```

#### `resolveRoute(path: string)`

Resolve a route path with the base path.

```typescript
import { resolveRoute } from '@philjs/core';

resolveRoute('/users'); // '/my-app/users'
resolveRoute('about'); // '/my-app/about'
resolveRoute('https://external.com'); // 'https://external.com' (unchanged)
```

#### `buildPath(pattern: string, params?: RouteParams, query?: Record<string, any>)`

Build a URL with parameters and query strings.

```typescript
import { buildPath } from '@philjs/core';

buildPath('/users/:id', { id: 123 });
// '/my-app/users/123'

buildPath('/search', undefined, { q: 'javascript', page: 1 });
// '/my-app/search?q=javascript&page=1'

buildPath('/products/:category/:id', { category: 'electronics', id: 456 }, { view: 'details' });
// '/my-app/products/electronics/456?view=details'
```

#### `matchPath(pattern: string, url: string)`

Match a URL against a route pattern and extract parameters.

```typescript
import { matchPath } from '@philjs/core';

matchPath('/users/:id', '/my-app/users/123');
// { id: '123' }

matchPath('/posts/:category/:slug', '/my-app/posts/tech/hello-world');
// { category: 'tech', slug: 'hello-world' }

matchPath('/api/*', '/my-app/api/v1/users');
// {} (matches wildcard)

matchPath('/users/:id', '/my-app/products/123');
// null (no match)
```

#### `resolveAsset(path: string)`

Resolve an asset path with the CDN or base path.

```typescript
import { resolveAsset } from '@philjs/core';

resolveAsset('/images/logo.png');
// 'https://cdn.example.com/assets/images/logo.png'

resolveAsset('styles/main.css');
// 'https://cdn.example.com/assets/styles/main.css'
```

#### Additional Utilities

```typescript
import {
  parseUrl,
  joinPaths,
  normalizePath,
  isRelativePath,
  makeRelative,
  sanitizePath,
  getExtension,
  getFilename,
  getDirectory,
  pathsMatch,
  buildBreadcrumbs
} from '@philjs/core';

// Parse URL
parseUrl('https://example.com/search?q=test#results');
// { pathname: '/search', search: '?q=test', hash: '#results', query: { q: 'test' } }

// Join paths
joinPaths('/api', 'v1/', '/users/', 'profile');
// '/api/v1/users/profile'

// Normalize path
normalizePath('/api/../users/./profile');
// '/users/profile'

// Make relative
makeRelative('/api/v1/users', '/api/v2/posts');
// '../../v2/posts'

// Get filename
getFilename('/path/to/file.txt'); // 'file.txt'
getFilename('/path/to/file.txt', false); // 'file'

// Get extension
getExtension('/path/to/file.txt'); // 'txt'

// Get directory
getDirectory('/path/to/file.txt'); // '/path/to'

// Build breadcrumbs
buildBreadcrumbs('/products/electronics/laptops');
// [
//   { name: 'Home', path: '/' },
//   { name: 'Products', path: '/products' },
//   { name: 'Electronics', path: '/products/electronics' },
//   { name: 'Laptops', path: '/products/electronics/laptops' }
// ]
```

---

## Glob Imports

Astro-style glob imports for dynamic module loading.

### Basic Usage

```typescript
import { glob, importGlob, loadContent } from '@philjs/core';

// Lazy loading (default)
const lazyModules = glob('./components/**/*.tsx');
// { './components/Button.tsx': () => import('./components/Button.tsx'), ... }

// Eager loading
const eagerModules = glob('./components/**/*.tsx', { eager: true });
// { './components/Button.tsx': ButtonModule, ... }

// Import all
const modules = await importGlob('./components/**/*.tsx');
// { './components/Button.tsx': ButtonModule, ... }
```

### Auto-Loading Routes

```typescript
import { loadRoutes } from '@philjs/core';

// Auto-load all route files
const routes = await loadRoutes('./src/routes/**/*.tsx');
// {
//   '/': { default: HomePage, loader: homeLoader },
//   '/users/:id': { default: UserPage, loader: userLoader },
// }
```

### Content Collections

```typescript
import { createCollection, loadContentWithFrontmatter } from '@philjs/core';

// Create a collection
const blog = createCollection('blog', './content/blog/**/*.md');

// Get all posts
const allPosts = await blog.all();

// Find specific post
const featuredPost = await blog.find(item =>
  item.module.frontmatter?.featured === true
);

// Filter posts
const recentPosts = await blog.filter(item => {
  const date = new Date(item.module.frontmatter?.date);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return date > monthAgo;
});
```

### Plugin System

```typescript
import { loadPlugins, initializePlugins } from '@philjs/core';

// Load all plugins
const plugins = await loadPlugins('./src/plugins/**/*.ts');

// Initialize with context
const app = { /* your app context */ };
await initializePlugins(plugins, app);
```

### Auto-Registration

```typescript
import { autoRegister } from '@philjs/core';

// Auto-register components
const components = await autoRegister({
  pattern: './src/components/**/*.tsx',
  getKey: (path) => {
    const match = path.match(/\/([^/]+)\.tsx$/);
    return match ? match[1] : path;
  },
  transform: (module) => module.default,
});

// Use components
const Button = components['Button'];
<Button onClick={() => alert('Clicked!')}>Click me</Button>
```

### Content with Frontmatter

```typescript
import {
  loadContentWithFrontmatter,
  filterByFrontmatter,
  sortByFrontmatter
} from '@philjs/core';

// Load markdown/MDX content
const blogPosts = await loadContentWithFrontmatter('./content/blog/**/*.md');

// Filter published posts
const publishedPosts = filterByFrontmatter(
  blogPosts,
  (fm: any) => fm.published === true
);

// Sort by date
const sortedPosts = sortByFrontmatter(publishedPosts, 'date', 'desc');
```

---

## Virtual Modules

Vite plugin for virtual modules providing build-time route and content discovery.

### Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { virtualModulesPlugin } from '@philjs/core/virtual-modules';

export default defineConfig({
  plugins: [
    virtualModulesPlugin({
      routesDir: './src/routes',
      contentDir: './src/content',
      pluginsDir: './src/plugins',
      basePath: '/app',
      appConfig: {
        siteName: 'My PhilJS App',
        version: '1.0.0',
        features: {
          analytics: true,
          darkMode: true,
        },
      },
    }),
  ],
});
```

### virtual:philjs-routes

```typescript
import { routes, getRoute, matchRoute } from 'virtual:philjs-routes';

// Get all routes
console.log(routes);

// Get specific route
const homeRoute = getRoute('/');

// Match route from pathname
const match = matchRoute('/users/123');
// { route: {...}, params: { id: '123' } }
```

### virtual:philjs-content

```typescript
import { content, getCollection, loadContent } from 'virtual:philjs-content';

// Get all content
console.log(content);

// Get blog collection
const blogPosts = getCollection('blog');

// Load specific content
const post = await loadContent('blog/hello-world.md');
```

### virtual:philjs-config

```typescript
import config, { basePath } from 'virtual:philjs-config';

console.log(config.siteName); // 'My PhilJS App'
console.log(basePath); // '/app'

// Use in components
function App() {
  return (
    <div>
      <h1>{config.siteName}</h1>
      {config.features.analytics && <Analytics />}
    </div>
  );
}
```

### virtual:philjs-plugins

```typescript
import { plugins, initializePlugins } from 'virtual:philjs-plugins';

console.log(plugins);

// Initialize all plugins
const app = createApp();
await initializePlugins(app);
```

### Type Safety

Virtual modules include full TypeScript support:

```typescript
import type { RouteMetadata } from 'virtual:philjs-routes';
import type { ContentItem } from 'virtual:philjs-content';

function createRouteHandler(route: RouteMetadata) {
  // Full IntelliSense support
}
```

---

## File Utilities

Build-time file operations with caching.

### Reading Files

```typescript
import { readFile, readJSON } from '@philjs/core';

// Read file (cached by default)
const content = await readFile('./src/config.json');

// Disable cache
const freshContent = await readFile('./src/config.json', { cache: false });

// Custom cache TTL
const content = await readFile('./src/config.json', { cacheTTL: 5000 });

// Read JSON
const config = await readJSON('./package.json');
```

### Writing Files

```typescript
import { writeFile, writeJSON } from '@philjs/core';

// Write file
await writeFile('./output/result.txt', 'Hello, World!');

// Write with directory creation
await writeFile('./deeply/nested/path/file.txt', 'Content', {
  createDir: true,
});

// Write JSON
await writeJSON('./output/config.json', { name: 'my-app' }, {
  indent: 2,
  createDir: true,
});
```

### Directory Operations

```typescript
import { readDir, matchFiles } from '@philjs/core';

// Read directory
const files = await readDir('./src');

// With pattern
const tsFiles = await readDir('./src', { pattern: '*.ts' });

// Recursive
const allFiles = await readDir('./src', {
  recursive: true,
  pattern: /\.(ts|tsx)$/,
});

// Glob patterns
const components = await matchFiles('./src', '**/*.tsx');
const sourceFiles = await matchFiles('./src', [
  '**/*.ts',
  '**/*.tsx',
  '!**/*.test.*',
]);
```

### File Watching

```typescript
import { watchFile, watchDir } from '@philjs/core';

// Watch single file
const stopWatching = watchFile('./src/config.json', (path) => {
  console.log('Config changed:', path);
});

// Watch directory
const stopWatchingDir = watchDir('./src', (path, event) => {
  console.log(`File ${event}:`, path);
}, {
  debounce: 300,
});

// Stop watching
stopWatching();
```

### Cache Management

```typescript
import { clearCaches, getCacheStats } from '@philjs/core';

// Get cache statistics
const stats = getCacheStats();
console.log(stats);

// Clear all caches
clearCaches();
```

---

## Examples

### Complete Route Setup

```typescript
import { routes } from 'virtual:philjs-routes';
import { configurePaths, buildPath } from '@philjs/core';

// Configure paths
configurePaths({
  base: '/app',
  assets: 'https://cdn.example.com',
});

// Create router
const router = {
  routes: routes.map(route => ({
    path: route.path,
    component: route.component,
    loader: route.loader,
  })),
};

// Build links
const userLink = buildPath('/users/:id', { id: 123 });
// '/app/users/123'
```

### Blog System

```typescript
import { getCollection } from 'virtual:philjs-content';
import { filterByFrontmatter, sortByFrontmatter } from '@philjs/core';

async function getBlogPosts() {
  const posts = getCollection('blog');
  const loaded = await Promise.all(posts.map(p => p.load()));

  const published = filterByFrontmatter(
    loaded.map((m, i) => ({ ...posts[i], module: m })),
    (fm: any) => fm.published
  );

  return sortByFrontmatter(published, 'date', 'desc');
}

// Use in component
function BlogList() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getBlogPosts().then(setPosts);
  }, []);

  return (
    <div>
      {posts.map(post => (
        <article key={post.path}>
          <h2>{post.module.frontmatter.title}</h2>
          <time>{post.module.frontmatter.date}</time>
          <div>{post.module.default}</div>
        </article>
      ))}
    </div>
  );
}
```

### Static Site Generation

```typescript
import { routes } from 'virtual:philjs-routes';
import { writeFile } from '@philjs/core';

async function generateStaticSite() {
  for (const route of routes) {
    // Skip dynamic routes
    if (route.path.includes(':')) continue;

    // Load data
    const data = route.loader ? await route.loader() : null;

    // Render to HTML
    const html = renderToString(
      <route.component data={data} />
    );

    // Write to file
    const outputPath = `./dist${route.path === '/' ? '/index' : route.path}.html`;
    await writeFile(outputPath, html, { createDir: true });

    console.log(`Generated: ${outputPath}`);
  }
}
```

### Plugin Development

```typescript
// src/plugins/analytics.ts
export default {
  name: 'analytics',
  async setup(app: any) {
    // Initialize analytics
    console.log('Analytics plugin loaded');

    app.analytics = {
      track: (event: string, data: any) => {
        console.log('Track:', event, data);
      },
    };
  },
};

// Usage
import { plugins, initializePlugins } from 'virtual:philjs-plugins';

const app = {};
await initializePlugins(app);

app.analytics.track('page_view', { path: '/' });
```

---

## Best Practices

1. **Use virtual modules for build-time discovery** - Routes, content, and plugins
2. **Cache file reads** - Speeds up development and builds
3. **Configure paths early** - In your app entry point
4. **Type your content** - Use TypeScript interfaces for frontmatter
5. **Watch files in development** - Auto-reload on changes
6. **Clear caches when needed** - After major file changes

---

## Migration Guide

### From Manual Route Registration

**Before:**
```typescript
const routes = [
  { path: '/', component: HomePage },
  { path: '/users/:id', component: UserPage },
];
```

**After:**
```typescript
import { routes } from 'virtual:philjs-routes';
// Routes auto-discovered from filesystem
```

### From Manual Content Loading

**Before:**
```typescript
const posts = [
  await import('./content/post1.md'),
  await import('./content/post2.md'),
];
```

**After:**
```typescript
import { getCollection } from 'virtual:philjs-content';
const posts = await Promise.all(
  getCollection('blog').map(p => p.load())
);
```

---

## Performance Tips

1. **Eager load critical routes** - Use `{ eager: true }` for above-the-fold content
2. **Lazy load heavy content** - Use default lazy loading for images, docs
3. **Cache aggressively** - File system operations are expensive
4. **Use glob patterns efficiently** - More specific = faster
5. **Clear caches strategically** - Only when files actually change

---

## Troubleshooting

### Virtual modules not working

Ensure the Vite plugin is properly configured:

```typescript
import { virtualModulesPlugin } from '@philjs/core/virtual-modules';

export default defineConfig({
  plugins: [virtualModulesPlugin()],
});
```

### Type errors with virtual modules

Generate type definitions:

```typescript
import { writeVirtualModuleTypes } from '@philjs/core/virtual-modules';

await writeVirtualModuleTypes('./src/virtual-modules.d.ts');
```

### Cache not invalidating

Clear caches manually:

```typescript
import { clearCaches } from '@philjs/core';
clearCaches();
```

---

## API Reference

See the [examples directory](./examples/) for complete working examples:

- `paths-example.ts` - Path utilities
- `glob-example.ts` - Glob imports
- `virtual-modules-example.ts` - Virtual modules
- `file-utils-example.ts` - File operations

## License

MIT
