/**
 * @fileoverview Examples for path utilities
 */

import { paths, configurePaths, buildPath, matchPath, resolveAsset } from '../src/paths';

// ============================================
// Example 1: Basic Path Configuration
// ============================================

// Configure paths for your app
configurePaths({
  base: '/my-app',
  assets: 'https://cdn.example.com/assets',
  trailingSlash: 'never'
});

console.log('Base path:', paths.base()); // '/my-app'
console.log('Assets path:', paths.assets()); // 'https://cdn.example.com/assets'

// ============================================
// Example 2: Route Resolution
// ============================================

const route1 = paths.resolveRoute('/users');
console.log('Resolved route:', route1); // '/my-app/users'

const route2 = paths.resolveRoute('about');
console.log('Resolved route:', route2); // '/my-app/about'

// Absolute URLs remain unchanged
const route3 = paths.resolveRoute('https://example.com/external');
console.log('External URL:', route3); // 'https://example.com/external'

// ============================================
// Example 3: Building Paths with Parameters
// ============================================

const userPath = buildPath('/users/:id', { id: 123 });
console.log('User path:', userPath); // '/my-app/users/123'

const searchPath = buildPath('/search', undefined, {
  q: 'javascript',
  page: 1,
  filter: ['recent', 'popular']
});
console.log('Search path:', searchPath);
// '/my-app/search?q=javascript&page=1&filter=recent&filter=popular'

const productPath = buildPath('/products/:category/:id', {
  category: 'electronics',
  id: 456
}, {
  view: 'details'
});
console.log('Product path:', productPath);
// '/my-app/products/electronics/456?view=details'

// ============================================
// Example 4: Path Matching
// ============================================

const params1 = matchPath('/users/:id', '/my-app/users/123');
console.log('Matched params:', params1); // { id: '123' }

const params2 = matchPath('/posts/:category/:slug', '/my-app/posts/tech/hello-world');
console.log('Matched params:', params2); // { category: 'tech', slug: 'hello-world' }

const params3 = matchPath('/api/*', '/my-app/api/v1/users');
console.log('Wildcard match:', params3); // Matches

const noMatch = matchPath('/users/:id', '/my-app/products/123');
console.log('No match:', noMatch); // null

// ============================================
// Example 5: Asset Resolution
// ============================================

const logo = resolveAsset('/images/logo.png');
console.log('Logo URL:', logo); // 'https://cdn.example.com/assets/images/logo.png'

const style = resolveAsset('styles/main.css');
console.log('Style URL:', style); // 'https://cdn.example.com/assets/styles/main.css'

// ============================================
// Example 6: URL Parsing
// ============================================

const parsed = paths.parseUrl('https://example.com/search?q=test&page=2#results');
console.log('Parsed URL:', {
  pathname: parsed.pathname, // '/search'
  search: parsed.search, // '?q=test&page=2'
  hash: parsed.hash, // '#results'
  query: parsed.query, // { q: 'test', page: '2' }
});

// ============================================
// Example 7: Path Utilities
// ============================================

// Join paths
const joined = paths.joinPaths('/api', 'v1/', '/users/', 'profile');
console.log('Joined path:', joined); // '/api/v1/users/profile'

// Normalize path
const normalized = paths.normalizePath('/api/../users/./profile');
console.log('Normalized path:', normalized); // '/users/profile'

// Make relative
const relative = paths.makeRelative('/api/v1/users', '/api/v2/posts');
console.log('Relative path:', relative); // '../../v2/posts'

// Get filename
const filename = paths.getFilename('/path/to/file.txt');
console.log('Filename:', filename); // 'file.txt'

const filenameNoExt = paths.getFilename('/path/to/file.txt', false);
console.log('Filename (no ext):', filenameNoExt); // 'file'

// Get directory
const directory = paths.getDirectory('/path/to/file.txt');
console.log('Directory:', directory); // '/path/to'

// Get extension
const extension = paths.getExtension('/path/to/file.txt');
console.log('Extension:', extension); // 'txt'

// ============================================
// Example 8: Breadcrumbs
// ============================================

const breadcrumbs = paths.buildBreadcrumbs('/products/electronics/laptops');
console.log('Breadcrumbs:', breadcrumbs);
// [
//   { name: 'Home', path: '/' },
//   { name: 'Products', path: '/products' },
//   { name: 'Electronics', path: '/products/electronics' },
//   { name: 'Laptops', path: '/products/electronics/laptops' }
// ]

// ============================================
// Example 9: SvelteKit-style Usage
// ============================================

// In your app setup
configurePaths({
  base: import.meta.env.BASE_URL || '',
  assets: import.meta.env.ASSETS_URL || '',
});

// In components
function NavigationLink({ to, children }: { to: string; children: any }) {
  const href = paths.resolveRoute(to);
  return <a href={href}>{children}</a>;
}

// Usage
<NavigationLink to="/about">About</NavigationLink>
// Renders: <a href="/my-app/about">About</a>

// Asset loading
function Image({ src, alt }: { src: string; alt: string }) {
  const assetUrl = resolveAsset(src);
  return <img src={assetUrl} alt={alt} />;
}

// Usage
<Image src="/images/hero.jpg" alt="Hero image" />
// Renders: <img src="https://cdn.example.com/assets/images/hero.jpg" alt="Hero image" />

// ============================================
// Example 10: Advanced Routing
// ============================================

// Route matching with parameter extraction
interface Route {
  pattern: string;
  component: any;
}

const routes: Route[] = [
  { pattern: '/', component: 'HomePage' },
  { pattern: '/about', component: 'AboutPage' },
  { pattern: '/users/:id', component: 'UserPage' },
  { pattern: '/posts/:category/:slug', component: 'PostPage' },
  { pattern: '/docs/*', component: 'DocsPage' },
];

function matchRoute(pathname: string): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    const params = matchPath(route.pattern, pathname);
    if (params) {
      return { route, params };
    }
  }
  return null;
}

// Test routing
const match1 = matchRoute('/my-app/users/123');
console.log('Match 1:', match1);
// { route: { pattern: '/users/:id', component: 'UserPage' }, params: { id: '123' } }

const match2 = matchRoute('/my-app/posts/tech/hello-world');
console.log('Match 2:', match2);
// { route: { pattern: '/posts/:category/:slug', component: 'PostPage' },
//   params: { category: 'tech', slug: 'hello-world' } }
