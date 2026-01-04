/**
 * PhilJS Static Adapter
 *
 * Generate a fully static site (SSG)
 */
import { writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
export function staticAdapter(config = {}) {
    const { outDir = 'dist', pages = [], fallback = 'index.html', sitemap, robots, trailingSlash = false, cleanUrls = true, } = config;
    const prerenderCache = new Map();
    return {
        name: 'static',
        async adapt() {
            console.log('Building static site...');
            mkdirSync(outDir, { recursive: true });
            // Discover routes if no pages specified
            const routesToRender = pages.length > 0 ? pages : await discoverRoutes();
            console.log(`Prerendering ${routesToRender.length} pages...`);
            // Prerender all pages
            for (const route of routesToRender) {
                await prerenderPage(route);
            }
            // Copy static assets
            const staticDir = config.static?.assets || 'public';
            if (existsSync(staticDir)) {
                cpSync(staticDir, outDir, { recursive: true });
            }
            // Generate sitemap
            if (sitemap) {
                generateSitemap(routesToRender);
            }
            // Generate robots.txt
            if (robots) {
                generateRobots();
            }
            // Generate fallback page
            if (fallback) {
                generateFallback();
            }
            console.log(`Static site generated: ${outDir}`);
            console.log(`  Pages: ${routesToRender.length}`);
            console.log(`  Output: ${outDir}`);
        },
        getHandler() {
            // Static sites don't have a runtime handler
            return async () => {
                return new Response('Static site - no runtime handler', { status: 404 });
            };
        },
    };
    async function discoverRoutes() {
        const routes = ['/'];
        const routesDir = 'src/routes';
        if (!existsSync(routesDir)) {
            return routes;
        }
        function scanDir(dir, prefix = '') {
            const entries = readdirSync(dir);
            for (const entry of entries) {
                const fullPath = join(dir, entry);
                const stat = statSync(fullPath);
                if (stat.isDirectory()) {
                    // Skip special directories
                    if (entry.startsWith('_') || entry.startsWith('.'))
                        continue;
                    // Handle route groups
                    if (entry.startsWith('(') && entry.endsWith(')')) {
                        scanDir(fullPath, prefix);
                    }
                    else {
                        scanDir(fullPath, `${prefix}/${entry}`);
                    }
                }
                else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
                    // Skip non-route files
                    if (entry.startsWith('_'))
                        continue;
                    let routePath = prefix;
                    if (entry === 'index.tsx' || entry === 'index.ts') {
                        // Index route
                    }
                    else if (entry === 'page.tsx' || entry === 'page.ts') {
                        // Page route
                    }
                    else {
                        // Named route
                        const name = entry.replace(/\.(tsx?|jsx?)$/, '');
                        routePath = `${prefix}/${name}`;
                    }
                    // Skip dynamic routes for static generation
                    if (!routePath.includes('[')) {
                        routes.push(routePath || '/');
                    }
                }
            }
        }
        scanDir(routesDir);
        return [...new Set(routes)];
    }
    async function prerenderPage(route) {
        try {
            const { renderToString } = await import('@philjs/ssr');
            // Create a mock request for the route
            const url = new URL(route, 'http://localhost');
            const html = await renderToString(url);
            // Determine output path
            let outputPath;
            if (cleanUrls) {
                if (route === '/') {
                    outputPath = join(outDir, 'index.html');
                }
                else {
                    outputPath = trailingSlash
                        ? join(outDir, route, 'index.html')
                        : join(outDir, `${route}.html`);
                }
            }
            else {
                outputPath = route === '/'
                    ? join(outDir, 'index.html')
                    : join(outDir, `${route}.html`);
            }
            // Create directory if needed
            mkdirSync(dirname(outputPath), { recursive: true });
            // Write HTML file
            writeFileSync(outputPath, html);
            prerenderCache.set(route, html);
            console.log(`  ✓ ${route}`);
        }
        catch (error) {
            console.error(`  ✗ ${route}:`, error);
        }
    }
    function generateSitemap(routes) {
        if (!sitemap)
            return;
        const { hostname, changefreq = 'weekly', priority = 0.5 } = sitemap;
        const urls = routes.map(route => {
            const loc = route === '/' ? hostname : `${hostname}${route}`;
            return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${route === '/' ? '1.0' : priority}</priority>
  </url>`;
        });
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
        writeFileSync(join(outDir, 'sitemap.xml'), xml);
        console.log('  ✓ sitemap.xml');
    }
    function generateRobots() {
        if (!robots)
            return;
        const lines = ['User-agent: *'];
        for (const path of robots.allow || []) {
            lines.push(`Allow: ${path}`);
        }
        for (const path of robots.disallow || []) {
            lines.push(`Disallow: ${path}`);
        }
        if (robots.sitemap !== false && sitemap) {
            lines.push('');
            lines.push(`Sitemap: ${sitemap.hostname}/sitemap.xml`);
        }
        writeFileSync(join(outDir, 'robots.txt'), lines.join('\n'));
        console.log('  ✓ robots.txt');
    }
    function generateFallback() {
        if (!fallback)
            return;
        const fallbackPath = join(outDir, fallback);
        // If fallback doesn't exist, create a basic one
        if (!existsSync(fallbackPath)) {
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/assets/main.js"></script>
</body>
</html>`;
            writeFileSync(fallbackPath, html);
            console.log(`  ✓ ${fallback} (fallback)`);
        }
    }
}
// Export prerender function for use in routes
export async function prerender(routes) {
    const results = new Map();
    for (const route of routes) {
        const { renderToString } = await import('@philjs/ssr');
        const url = new URL(route, 'http://localhost');
        const html = await renderToString(url);
        results.set(route, html);
    }
    return results;
}
// Export static paths generator
export function getStaticPaths(paths) {
    return {
        paths,
        fallback: false,
    };
}
export default staticAdapter;
//# sourceMappingURL=index.js.map