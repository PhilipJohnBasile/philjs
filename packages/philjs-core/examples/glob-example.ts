/**
 * @fileoverview Examples for glob utilities
 */

import {
  glob,
  importGlob,
  loadContent,
  loadRoutes,
  loadPlugins,
  initializePlugins,
  createCollection,
  loadContentWithFrontmatter,
  sortByFrontmatter,
  filterByFrontmatter,
  autoRegister,
} from '../src/glob';

// ============================================
// Example 1: Basic Glob Usage
// ============================================

// Lazy loading (default)
const lazyModules = glob('./components/**/*.tsx');
console.log('Lazy modules:', Object.keys(lazyModules));
// { './components/Button.tsx': () => import('./components/Button.tsx'), ... }

// Eager loading
const eagerModules = glob('./components/**/*.tsx', { eager: true });
console.log('Eager modules:', Object.keys(eagerModules));
// { './components/Button.tsx': ButtonModule, ... }

// Import as raw text
const rawFiles = glob('./content/**/*.md', { as: 'raw' });
console.log('Raw files:', rawFiles);

// ============================================
// Example 2: Importing All Routes
// ============================================

// Auto-load all route files
const routes = await loadRoutes('./src/routes/**/*.tsx');
console.log('Loaded routes:', routes);
/*
{
  '/': { default: HomePage, loader: homeLoader },
  '/about': { default: AboutPage },
  '/users/:id': { default: UserPage, loader: userLoader },
  '/posts/:category/:slug': { default: PostPage, loader: postLoader }
}
*/

// Use in router
function createRouter(routes: Record<string, any>) {
  return {
    routes: Object.entries(routes).map(([path, module]) => ({
      path,
      component: module.default,
      loader: module.loader,
      action: module.action,
    })),
  };
}

const router = createRouter(routes);

// ============================================
// Example 3: Importing All Content
// ============================================

// Load markdown/MDX content
const blogPosts = await loadContentWithFrontmatter('./content/blog/**/*.md');
console.log('Blog posts:', blogPosts);
/*
[
  {
    frontmatter: { title: 'Hello World', date: '2025-01-01', tags: ['intro'] },
    content: MarkdownContent,
    path: './content/blog/hello-world.md'
  },
  ...
]
*/

// Filter published posts
const publishedPosts = filterByFrontmatter(blogPosts, (fm: any) => fm.published === true);

// Sort by date
const sortedPosts = sortByFrontmatter(publishedPosts, 'date', 'desc');

// ============================================
// Example 4: Content Collections
// ============================================

// Create collections
const blog = createCollection('blog', './content/blog/**/*.md');
const docs = createCollection('docs', './content/docs/**/*.mdx');
const authors = createCollection('authors', './content/authors/**/*.json');

// Use collections
const allPosts = await blog.all();
const featuredPost = await blog.find(item =>
  (item.module as any).frontmatter?.featured === true
);
const recentPosts = await blog.filter(item => {
  const date = new Date((item.module as any).frontmatter?.date);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return date > monthAgo;
});

// ============================================
// Example 5: Plugin System with Auto-Discovery
// ============================================

// Plugin interface
interface MyPlugin {
  name: string;
  setup: (app: any) => void;
}

// Load all plugins
const plugins = await loadPlugins<MyPlugin>('./src/plugins/**/*.ts');
console.log('Loaded plugins:', plugins.map(p => p.name));

// Initialize plugins
const app = { /* your app context */ };
await initializePlugins(plugins, app);

// Alternative: Auto-register with custom key
const pluginRegistry = await autoRegister<MyPlugin>({
  pattern: './src/plugins/**/*.ts',
  getKey: (path, module) => module.name || path,
  transform: (module) => module,
});

console.log('Plugin registry:', pluginRegistry);
/*
{
  'analytics': { name: 'analytics', setup: [Function] },
  'auth': { name: 'auth', setup: [Function] },
  'logging': { name: 'logging', setup: [Function] }
}
*/

// ============================================
// Example 6: Dynamic Component Registration
// ============================================

// Auto-register all UI components
const components = await autoRegister({
  pattern: './src/components/**/*.tsx',
  getKey: (path, module) => {
    // Extract component name from path
    // ./src/components/Button.tsx -> Button
    // ./src/components/forms/Input.tsx -> Input
    const match = path.match(/\/([^/]+)\.tsx$/);
    return match ? match[1] : path;
  },
  transform: (module) => module.default,
});

// Use in app
function renderComponent(name: string, props: any) {
  const Component = components[name];
  if (!Component) {
    throw new Error(`Component not found: ${name}`);
  }
  return <Component {...props} />;
}

// Usage
renderComponent('Button', { onClick: () => alert('Clicked!') });

// ============================================
// Example 7: Icon System
// ============================================

// Auto-load all SVG icons
const icons = await autoRegister({
  pattern: './src/icons/**/*.svg',
  getKey: (path) => {
    const match = path.match(/\/([^/]+)\.svg$/);
    return match ? match[1] : path;
  },
  globOptions: { as: 'raw' },
});

// Icon component
function Icon({ name, size = 24 }: { name: string; size?: number }) {
  const svg = icons[name];
  if (!svg) return null;

  return (
    <span
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ width: size, height: size }}
    />
  );
}

// Usage
<Icon name="arrow-right" size={16} />
<Icon name="user" />

// ============================================
// Example 8: I18n Translations
// ============================================

// Load all translation files
const translations = await autoRegister({
  pattern: './locales/**/*.json',
  getKey: (path) => {
    // ./locales/en/common.json -> en.common
    // ./locales/es/errors.json -> es.errors
    const match = path.match(/\/locales\/([^/]+)\/([^/]+)\.json$/);
    return match ? `${match[1]}.${match[2]}` : path;
  },
  transform: (module) => module,
});

console.log('Translations:', Object.keys(translations));
// ['en.common', 'en.errors', 'es.common', 'es.errors', ...]

function translate(key: string, locale: string = 'en'): string {
  const [namespace, ...keyParts] = key.split('.');
  const translationKey = keyParts.join('.');
  const translations = translations[`${locale}.${namespace}`];

  return translationKey.split('.').reduce((obj, k) => obj?.[k], translations) || key;
}

// Usage
translate('common.welcome', 'en'); // "Welcome"
translate('errors.notFound', 'es'); // "No encontrado"

// ============================================
// Example 9: API Route Registration
// ============================================

interface APIRoute {
  method: string;
  handler: (req: any) => any;
}

// Load all API routes
const apiRoutes = await autoRegister<APIRoute>({
  pattern: './src/api/**/*.ts',
  getKey: (path) => {
    // ./src/api/users/[id].ts -> /api/users/:id
    return path
      .replace(/^\.\/src\/api/, '/api')
      .replace(/\.ts$/, '')
      .replace(/\[([^\]]+)\]/g, ':$1');
  },
});

// Create API router
function createAPIRouter(routes: Record<string, any>) {
  return (req: any) => {
    const handler = routes[req.path];
    if (handler) {
      return handler(req);
    }
    return { status: 404, body: 'Not found' };
  };
}

const apiRouter = createAPIRouter(apiRoutes);

// ============================================
// Example 10: Content Organization
// ============================================

// Load and organize content
const content = await loadContent('./content/**/*.md');

// Group by directory (collection) - ES2024 Object.groupBy()
const byCollection = Object.groupBy(content, item =>
  item.pathInfo.segments[1] || 'default'
);

console.log('Content by collection:', Object.keys(byCollection));
// ['blog', 'docs', 'tutorials', ...]

// Group by year (from frontmatter) - ES2024 Object.groupBy()
const byYear = Object.groupBy(content, item =>
  new Date((item.module as any).frontmatter?.date).getFullYear()
);

console.log('Content by year:', Object.keys(byYear));
// ['2023', '2024', '2025']

// ============================================
// Example 11: Middleware System
// ============================================

interface Middleware {
  name: string;
  order?: number;
  handler: (ctx: any, next: () => void) => void;
}

// Load middleware
const middleware = await autoRegister<Middleware>({
  pattern: './src/middleware/**/*.ts',
  transform: (module) => module.default || module,
});

// Sort by order and create middleware chain
const sortedMiddleware = Object.values(middleware)
  .sort((a, b) => (a.order || 0) - (b.order || 0));

function createMiddlewareChain(middleware: Middleware[]) {
  return (ctx: any) => {
    let index = 0;

    const next = () => {
      if (index >= middleware.length) return;
      const mw = middleware[index++];
      mw.handler(ctx, next);
    };

    next();
  };
}

const middlewareChain = createMiddlewareChain(sortedMiddleware);

// ============================================
// Example 12: Test Fixtures
// ============================================

// Load test fixtures
const fixtures = await autoRegister({
  pattern: './tests/fixtures/**/*.json',
  getKey: (path) => {
    // ./tests/fixtures/users/admin.json -> users.admin
    const match = path.match(/\/fixtures\/(.+)\.json$/);
    return match ? match[1].replace(/\//g, '.') : path;
  },
});

// Use in tests
describe('User API', () => {
  it('should create admin user', () => {
    const adminData = fixtures['users.admin'];
    // test with adminData
  });
});
