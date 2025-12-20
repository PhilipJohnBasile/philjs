/**
 * @fileoverview Examples for virtual modules
 */

// ============================================
// Example 1: Vite Configuration
// ============================================

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

// ============================================
// Example 2: Using virtual:philjs-routes
// ============================================

import { routes, getRoute, matchRoute } from 'virtual:philjs-routes';

// Get all routes
console.log('All routes:', routes);
/*
[
  {
    path: '/',
    filePath: 'src/routes/index.tsx',
    component: HomeComponent,
    loader: homeLoader,
    meta: { title: 'Home' }
  },
  {
    path: '/users/:id',
    filePath: 'src/routes/users/[id].tsx',
    component: UserComponent,
    loader: userLoader,
  },
  ...
]
*/

// Get specific route
const homeRoute = getRoute('/');
console.log('Home route:', homeRoute);

// Match route from pathname
const match = matchRoute('/users/123');
console.log('Matched route:', match);
// { route: {...}, params: { id: '123' } }

// Create router from virtual routes
function createRouter() {
  return {
    routes: routes.map(route => ({
      path: route.path,
      component: route.component,
      loader: route.loader,
      action: route.action,
      meta: route.meta || {},
    })),
    match: (pathname: string) => matchRoute(pathname),
  };
}

const router = createRouter();

// ============================================
// Example 3: Using virtual:philjs-content
// ============================================

import { content, getCollection, loadContent } from 'virtual:philjs-content';

// Get all content
console.log('All content:', content);
/*
[
  {
    path: 'blog/hello-world.md',
    collection: 'blog',
    load: () => import('./content/blog/hello-world.md')
  },
  ...
]
*/

// Get blog collection
const blogPosts = getCollection('blog');
console.log('Blog posts:', blogPosts);

// Load specific content
const post = await loadContent('blog/hello-world.md');
console.log('Loaded post:', post);
// { frontmatter: {...}, default: Content }

// Create content API
async function getBlogPosts() {
  const posts = getCollection('blog');
  const loaded = await Promise.all(posts.map(p => p.load()));

  return loaded
    .map((module, i) => ({
      slug: posts[i].path.replace(/^blog\//, '').replace(/\.md$/, ''),
      ...module.frontmatter,
      content: module.default,
    }))
    .filter(p => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        <article key={post.slug}>
          <h2>{post.title}</h2>
          <time>{post.date}</time>
          <div>{post.content}</div>
        </article>
      ))}
    </div>
  );
}

// ============================================
// Example 4: Using virtual:philjs-config
// ============================================

import config, { basePath } from 'virtual:philjs-config';

console.log('App config:', config);
// { siteName: 'My PhilJS App', version: '1.0.0', ... }

console.log('Base path:', basePath);
// '/app'

// Use in app
function App() {
  return (
    <div>
      <header>
        <h1>{config.siteName}</h1>
        <span>v{config.version}</span>
      </header>
      {config.features.analytics && <Analytics />}
      {config.features.darkMode && <DarkModeToggle />}
    </div>
  );
}

// Feature flags
function FeatureFlag({ name, children }: { name: string; children: any }) {
  const enabled = config.features?.[name];
  return enabled ? children : null;
}

// Usage
<FeatureFlag name="analytics">
  <Analytics />
</FeatureFlag>

// ============================================
// Example 5: Using virtual:philjs-plugins
// ============================================

import { plugins, initializePlugins } from 'virtual:philjs-plugins';

console.log('Available plugins:', plugins);
/*
[
  { name: 'analytics', module: AnalyticsPlugin },
  { name: 'auth', module: AuthPlugin },
  ...
]
*/

// Initialize all plugins
const app = createApp();
await initializePlugins(app);

// Initialize specific plugins
const selectedPlugins = plugins.filter(p =>
  ['analytics', 'logging'].includes(p.name)
);

for (const plugin of selectedPlugins) {
  if (plugin.module.setup) {
    await plugin.module.setup(app);
  }
}

// ============================================
// Example 6: Full Application Setup
// ============================================

import { routes } from 'virtual:philjs-routes';
import { content } from 'virtual:philjs-content';
import { plugins, initializePlugins } from 'virtual:philjs-plugins';
import config from 'virtual:philjs-config';

async function createApplication() {
  // Create app context
  const app = {
    config,
    router: null as any,
    content: null as any,
  };

  // Setup router
  app.router = createRouter();

  // Setup content
  app.content = {
    collections: {} as Record<string, any[]>,
    async getCollection(name: string) {
      if (!this.collections[name]) {
        const items = getCollection(name);
        this.collections[name] = await Promise.all(
          items.map(async item => ({
            path: item.path,
            ...(await item.load()),
          }))
        );
      }
      return this.collections[name];
    },
  };

  // Initialize plugins
  await initializePlugins(app);

  return app;
}

// Use in main.ts
const app = await createApplication();

function render() {
  return (
    <AppProvider value={app}>
      <Router routes={app.router.routes} />
    </AppProvider>
  );
}

// ============================================
// Example 7: Dynamic Content Loading
// ============================================

import { getCollection } from 'virtual:philjs-content';

// Blog with pagination
async function getBlogPage(page: number = 1, perPage: number = 10) {
  const posts = getCollection('blog');
  const loaded = await Promise.all(posts.map(p => p.load()));

  const published = loaded
    .filter(p => p.frontmatter.published)
    .sort((a, b) =>
      new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
    );

  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    posts: published.slice(start, end),
    total: published.length,
    page,
    pages: Math.ceil(published.length / perPage),
  };
}

// Documentation with search
async function searchDocs(query: string) {
  const docs = getCollection('docs');
  const loaded = await Promise.all(docs.map(d => d.load()));

  return loaded.filter(doc => {
    const title = doc.frontmatter.title?.toLowerCase() || '';
    const content = doc.default?.toString().toLowerCase() || '';
    const q = query.toLowerCase();
    return title.includes(q) || content.includes(q);
  });
}

// ============================================
// Example 8: Route Generation
// ============================================

import { routes } from 'virtual:philjs-routes';

// Generate sitemap
function generateSitemap() {
  const baseUrl = 'https://example.com';

  const urls = routes
    .filter(route => !route.path.includes(':')) // Exclude dynamic routes
    .map(route => ({
      loc: `${baseUrl}${route.path}`,
      lastmod: new Date().toISOString(),
      priority: route.path === '/' ? 1.0 : 0.8,
    }));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

// Generate navigation menu
function generateNav() {
  return routes
    .filter(route => route.meta?.showInNav)
    .map(route => ({
      label: route.meta.title || route.path,
      href: route.path,
      icon: route.meta.icon,
    }));
}

// ============================================
// Example 9: Content-Based Routing
// ============================================

import { getCollection } from 'virtual:philjs-content';

// Generate routes from content
async function generateContentRoutes() {
  const posts = getCollection('blog');
  const loaded = await Promise.all(posts.map(p => p.load()));

  return loaded.map((post, i) => {
    const slug = posts[i].path.replace(/^blog\//, '').replace(/\.md$/, '');

    return {
      path: `/blog/${slug}`,
      component: BlogPost,
      loader: async () => post,
      meta: {
        title: post.frontmatter.title,
        description: post.frontmatter.description,
      },
    };
  });
}

// ============================================
// Example 10: Plugin with Virtual Modules
// ============================================

// Create a plugin that uses virtual modules
export default {
  name: 'content-plugin',

  async setup(app: any) {
    const { getCollection } = await import('virtual:philjs-content');

    // Add content helpers to app
    app.content = {
      async getBlogPosts() {
        const posts = getCollection('blog');
        return Promise.all(posts.map(p => p.load()));
      },

      async getAuthor(id: string) {
        const authors = getCollection('authors');
        const author = authors.find(a => a.path.includes(id));
        return author ? author.load() : null;
      },
    };
  },
};

// ============================================
// Example 11: TypeScript Type Safety
// ============================================

// The virtual modules have type definitions generated
// This provides full IntelliSense support

import type { RouteMetadata } from 'virtual:philjs-routes';
import type { ContentItem } from 'virtual:philjs-content';

// Typed route handler
function createRouteHandler(route: RouteMetadata) {
  return async (req: Request) => {
    const data = route.loader ? await route.loader() : null;
    return {
      component: route.component,
      data,
      meta: route.meta,
    };
  };
}

// Typed content loader
async function loadTypedContent<T>(path: string): Promise<T> {
  const module = await loadContent(path);
  return module as T;
}

// ============================================
// Example 12: Hot Module Replacement
// ============================================

// Virtual modules automatically update when files change

if (import.meta.hot) {
  // Accept HMR for virtual modules
  import.meta.hot.accept('virtual:philjs-routes', (newModule) => {
    console.log('Routes updated:', newModule.routes);
    // Update router with new routes
    router.updateRoutes(newModule.routes);
  });

  import.meta.hot.accept('virtual:philjs-content', (newModule) => {
    console.log('Content updated:', newModule.content);
    // Invalidate content cache
    app.content.invalidate();
  });
}
