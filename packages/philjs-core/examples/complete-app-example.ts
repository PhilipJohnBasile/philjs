/**
 * @fileoverview Complete application example using all path utilities
 * This example shows how to build a full-featured blog application
 * using PhilJS path utilities, glob imports, and virtual modules
 */

// ============================================
// Step 1: Vite Configuration
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
      basePath: '/blog',
      appConfig: {
        siteName: 'PhilJS Blog',
        description: 'A modern blog built with PhilJS',
        author: 'PhilJS Team',
        social: {
          twitter: '@philjs',
          github: 'philjs/philjs',
        },
        features: {
          comments: true,
          analytics: true,
          darkMode: true,
          rss: true,
        },
      },
    }),
  ],
});

// ============================================
// Step 2: Path Configuration
// ============================================

// src/config/paths.ts
import { configurePaths } from '@philjs/core';

export function setupPaths() {
  configurePaths({
    base: import.meta.env.BASE_URL || '/blog',
    assets: import.meta.env.ASSETS_URL || 'https://cdn.philjs.com/blog',
    trailingSlash: 'never',
  });
}

// ============================================
// Step 3: Application Setup
// ============================================

// src/app.ts
import { routes } from 'virtual:philjs-routes';
import { plugins, initializePlugins } from 'virtual:philjs-plugins';
import config from 'virtual:philjs-config';
import { setupPaths } from './config/paths';

export async function createApp() {
  // Setup paths
  setupPaths();

  // Create app context
  const app = {
    config,
    routes: [],
    content: {},
    plugins: [],
    state: {},
  };

  // Load routes
  app.routes = routes.map(route => ({
    path: route.path,
    component: route.component,
    loader: route.loader,
    action: route.action,
    meta: route.meta || {},
  }));

  // Initialize plugins
  await initializePlugins(app);

  return app;
}

// ============================================
// Step 4: Content Management
// ============================================

// src/lib/content.ts
import { getCollection, loadContent } from 'virtual:philjs-content';
import { filterByFrontmatter, sortByFrontmatter } from '@philjs/core';

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  content: any;
}

export async function getAllPosts(): Promise<Post[]> {
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

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const module = await loadContent(`blog/${slug}.md`);
    return {
      slug,
      ...module.frontmatter,
      content: module.default,
    };
  } catch (error) {
    return null;
  }
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter(p => p.featured).slice(0, 3);
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter(p => p.tags.includes(tag));
}

export async function getPostsByYear(year: number): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter(p => new Date(p.date).getFullYear() === year);
}

// ============================================
// Step 5: Router Setup
// ============================================

// src/lib/router.ts
import { matchPath, buildPath } from '@philjs/core';
import { routes } from 'virtual:philjs-routes';

export function createRouter() {
  return {
    routes,

    match(pathname: string) {
      for (const route of routes) {
        const params = matchPath(route.path, pathname);
        if (params) {
          return { route, params };
        }
      }
      return null;
    },

    navigate(to: string, params?: any, query?: any) {
      const path = buildPath(to, params, query);
      window.history.pushState({}, '', path);
      // Trigger route change
      window.dispatchEvent(new PopStateEvent('popstate'));
    },

    buildUrl(to: string, params?: any, query?: any) {
      return buildPath(to, params, query);
    },
  };
}

// ============================================
// Step 6: Components
// ============================================

// src/components/Link.tsx
import { buildPath } from '@philjs/core';

interface LinkProps {
  to: string;
  params?: any;
  query?: any;
  children: any;
  className?: string;
}

export function Link({ to, params, query, children, className }: LinkProps) {
  const href = buildPath(to, params, query);

  const handleClick = (e: Event) => {
    e.preventDefault();
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

// src/components/PostCard.tsx
import { Post } from '../lib/content';
import { Link } from './Link';

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      <h2>
        <Link to="/posts/:slug" params={{ slug: post.slug }}>
          {post.title}
        </Link>
      </h2>
      <p className="description">{post.description}</p>
      <div className="meta">
        <time>{new Date(post.date).toLocaleDateString()}</time>
        <span className="author">{post.author}</span>
      </div>
      <div className="tags">
        {post.tags.map(tag => (
          <Link
            key={tag}
            to="/tags/:tag"
            params={{ tag }}
            className="tag"
          >
            {tag}
          </Link>
        ))}
      </div>
    </article>
  );
}

// ============================================
// Step 7: Routes
// ============================================

// src/routes/index.tsx
import { getFeaturedPosts } from '../lib/content';
import { PostCard } from '../components/PostCard';

export async function loader() {
  const posts = await getFeaturedPosts();
  return { posts };
}

export default function HomePage({ data }) {
  const { posts } = data;

  return (
    <div className="home">
      <h1>Welcome to PhilJS Blog</h1>
      <section className="featured">
        <h2>Featured Posts</h2>
        <div className="posts-grid">
          {posts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}

// src/routes/posts/[slug].tsx
import { getPostBySlug } from '../../lib/content';

export async function loader({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    throw new Response('Not Found', { status: 404 });
  }
  return { post };
}

export default function PostPage({ data }) {
  const { post } = data;

  return (
    <article className="post">
      <header>
        <h1>{post.title}</h1>
        <div className="meta">
          <time>{new Date(post.date).toLocaleDateString()}</time>
          <span className="author">{post.author}</span>
        </div>
      </header>
      <div className="content">
        {post.content}
      </div>
      <div className="tags">
        {post.tags.map(tag => (
          <Link
            key={tag}
            to="/tags/:tag"
            params={{ tag }}
            className="tag"
          >
            {tag}
          </Link>
        ))}
      </div>
    </article>
  );
}

// src/routes/tags/[tag].tsx
import { getPostsByTag } from '../../lib/content';
import { PostCard } from '../../components/PostCard';

export async function loader({ params }) {
  const posts = await getPostsByTag(params.tag);
  return { tag: params.tag, posts };
}

export default function TagPage({ data }) {
  const { tag, posts } = data;

  return (
    <div className="tag-page">
      <h1>Posts tagged with "{tag}"</h1>
      <div className="posts-grid">
        {posts.map(post => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Step 8: Plugins
// ============================================

// src/plugins/analytics.ts
export default {
  name: 'analytics',
  async setup(app: any) {
    if (!app.config.features.analytics) return;

    app.analytics = {
      pageView(path: string) {
        console.log('Page view:', path);
        // Send to analytics service
      },
      event(name: string, data: any) {
        console.log('Event:', name, data);
        // Send to analytics service
      },
    };

    // Track route changes
    window.addEventListener('popstate', () => {
      app.analytics.pageView(window.location.pathname);
    });
  },
};

// src/plugins/dark-mode.ts
import { signal, effect } from '@philjs/core';

export default {
  name: 'dark-mode',
  async setup(app: any) {
    if (!app.config.features.darkMode) return;

    const isDark = signal(localStorage.getItem('theme') === 'dark');

    app.darkMode = {
      isDark,
      toggle() {
        isDark.value = !isDark.value;
      },
    };

    effect(() => {
      const theme = isDark.value ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
  },
};

// ============================================
// Step 9: Build-time Generation
// ============================================

// scripts/generate-rss.ts
import { getAllPosts } from '../src/lib/content';
import { writeFile } from '@philjs/core';
import config from 'virtual:philjs-config';

async function generateRSS() {
  const posts = await getAllPosts();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${config.siteName}</title>
    <description>${config.description}</description>
    <link>https://philjs.com/blog</link>
    ${posts.map(post => `
    <item>
      <title>${post.title}</title>
      <description>${post.description}</description>
      <link>https://philjs.com/blog/posts/${post.slug}</link>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>https://philjs.com/blog/posts/${post.slug}</guid>
    </item>
    `).join('')}
  </channel>
</rss>`;

  await writeFile('./dist/rss.xml', rss);
  console.log('Generated RSS feed');
}

generateRSS();

// scripts/generate-sitemap.ts
import { routes } from 'virtual:philjs-routes';
import { getAllPosts } from '../src/lib/content';
import { writeFile } from '@philjs/core';

async function generateSitemap() {
  const staticRoutes = routes
    .filter(r => !r.path.includes(':'))
    .map(r => r.path);

  const posts = await getAllPosts();
  const postRoutes = posts.map(p => `/posts/${p.slug}`);

  const allRoutes = [...staticRoutes, ...postRoutes];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>https://philjs.com/blog${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  await writeFile('./dist/sitemap.xml', sitemap);
  console.log('Generated sitemap');
}

generateSitemap();

// ============================================
// Step 10: Main Entry Point
// ============================================

// src/main.ts
import { createApp } from './app';
import { render } from '@philjs/core';

async function main() {
  const app = await createApp();

  // Track initial page view
  if (app.analytics) {
    app.analytics.pageView(window.location.pathname);
  }

  // Render app
  const root = document.getElementById('app');
  if (root) {
    render(() => <App />, root);
  }
}

main();

// ============================================
// Usage Summary
// ============================================

/*
This complete example demonstrates:

1. Path Management
   - Configure base paths
   - Build URLs with params
   - Match routes
   - Navigate programmatically

2. Content Collections
   - Auto-discover content
   - Filter and sort
   - Load by slug
   - Load by tag/year

3. Virtual Modules
   - Auto-discovered routes
   - Content collections
   - App configuration
   - Plugin system

4. File-based Routing
   - Routes in src/routes/
   - Dynamic routes with [param]
   - Loaders for data fetching

5. Plugin System
   - Auto-discovered plugins
   - App context integration
   - Feature flags

6. Build-time Generation
   - RSS feeds
   - Sitemaps
   - Static site generation

7. Type Safety
   - Full TypeScript support
   - Virtual module types
   - Content types

To run:
1. Create content in src/content/blog/
2. Create routes in src/routes/
3. Create plugins in src/plugins/
4. Run: vite build
5. Deploy: dist/

File structure:
├── src/
│   ├── routes/           <- Auto-discovered routes
│   ├── content/          <- Auto-discovered content
│   ├── plugins/          <- Auto-discovered plugins
│   ├── components/       <- Reusable components
│   ├── lib/             <- Utilities
│   └── main.ts          <- Entry point
├── scripts/             <- Build scripts
├── dist/                <- Build output
└── vite.config.ts       <- Vite configuration
*/
