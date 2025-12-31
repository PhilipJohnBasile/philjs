/**
 * PhilJS Content - Sitemap Generation
 *
 * Comprehensive XML sitemap generation with support for images, videos,
 * multi-language sites, and auto-discovery from routes and content.
 */
/**
 * Generate XML sitemap
 */
export function generateSitemap(config) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    // Add standard namespaces if needed
    const hasImages = config.urls.some(url => url.images && url.images.length > 0);
    const hasVideos = config.urls.some(url => url.videos && url.videos.length > 0);
    const hasAlternates = config.urls.some(url => url.alternates && url.alternates.length > 0);
    if (hasImages) {
        xml += '\n  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
    }
    if (hasVideos) {
        xml += '\n  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"';
    }
    if (hasAlternates) {
        xml += '\n  xmlns:xhtml="http://www.w3.org/1999/xhtml"';
    }
    // Add custom namespaces
    if (config.customNamespaces) {
        for (const [prefix, uri] of Object.entries(config.customNamespaces)) {
            xml += `\n  xmlns:${prefix}="${escapeXML(uri)}"`;
        }
    }
    xml += '>\n';
    // Add URLs
    for (const url of config.urls) {
        xml += '  <url>\n';
        // Normalize and escape URL
        const loc = normalizeUrl(url.loc, config.site);
        xml += `    <loc>${escapeXML(loc)}</loc>\n`;
        if (url.lastmod) {
            xml += `    <lastmod>${formatW3CDate(url.lastmod)}</lastmod>\n`;
        }
        if (url.changefreq) {
            xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
        }
        if (url.priority !== undefined) {
            const priority = Math.max(0.0, Math.min(1.0, url.priority));
            xml += `    <priority>${priority.toFixed(1)}</priority>\n`;
        }
        // Add alternate languages
        if (url.alternates && url.alternates.length > 0) {
            for (const alt of url.alternates) {
                const altHref = normalizeUrl(alt.href, config.site);
                xml += `    <xhtml:link rel="alternate" hreflang="${escapeXML(alt.lang)}" href="${escapeXML(altHref)}" />\n`;
            }
        }
        // Add images
        if (url.images && url.images.length > 0) {
            for (const img of url.images) {
                xml += '    <image:image>\n';
                const imgLoc = normalizeUrl(img.loc, config.site);
                xml += `      <image:loc>${escapeXML(imgLoc)}</image:loc>\n`;
                if (img.caption) {
                    xml += `      <image:caption>${escapeXML(img.caption)}</image:caption>\n`;
                }
                if (img.geo_location) {
                    xml += `      <image:geo_location>${escapeXML(img.geo_location)}</image:geo_location>\n`;
                }
                if (img.title) {
                    xml += `      <image:title>${escapeXML(img.title)}</image:title>\n`;
                }
                if (img.license) {
                    xml += `      <image:license>${escapeXML(img.license)}</image:license>\n`;
                }
                xml += '    </image:image>\n';
            }
        }
        // Add videos
        if (url.videos && url.videos.length > 0) {
            for (const video of url.videos) {
                xml += '    <video:video>\n';
                const thumbLoc = normalizeUrl(video.thumbnail_loc, config.site);
                xml += `      <video:thumbnail_loc>${escapeXML(thumbLoc)}</video:thumbnail_loc>\n`;
                xml += `      <video:title>${escapeXML(video.title)}</video:title>\n`;
                xml += `      <video:description>${escapeXML(video.description)}</video:description>\n`;
                if (video.content_loc) {
                    const contentLoc = normalizeUrl(video.content_loc, config.site);
                    xml += `      <video:content_loc>${escapeXML(contentLoc)}</video:content_loc>\n`;
                }
                if (video.player_loc) {
                    xml += `      <video:player_loc>${escapeXML(video.player_loc)}</video:player_loc>\n`;
                }
                if (video.duration) {
                    xml += `      <video:duration>${video.duration}</video:duration>\n`;
                }
                if (video.expiration_date) {
                    xml += `      <video:expiration_date>${formatW3CDate(video.expiration_date)}</video:expiration_date>\n`;
                }
                if (video.rating !== undefined) {
                    xml += `      <video:rating>${video.rating.toFixed(1)}</video:rating>\n`;
                }
                if (video.view_count !== undefined) {
                    xml += `      <video:view_count>${video.view_count}</video:view_count>\n`;
                }
                if (video.publication_date) {
                    xml += `      <video:publication_date>${formatW3CDate(video.publication_date)}</video:publication_date>\n`;
                }
                if (video.family_friendly !== undefined) {
                    xml += `      <video:family_friendly>${video.family_friendly ? 'yes' : 'no'}</video:family_friendly>\n`;
                }
                if (video.tags && video.tags.length > 0) {
                    for (const tag of video.tags.slice(0, 32)) {
                        xml += `      <video:tag>${escapeXML(tag)}</video:tag>\n`;
                    }
                }
                if (video.category) {
                    xml += `      <video:category>${escapeXML(video.category)}</video:category>\n`;
                }
                if (video.live !== undefined) {
                    xml += `      <video:live>${video.live ? 'yes' : 'no'}</video:live>\n`;
                }
                if (video.requires_subscription !== undefined) {
                    xml += `      <video:requires_subscription>${video.requires_subscription ? 'yes' : 'no'}</video:requires_subscription>\n`;
                }
                if (video.uploader) {
                    xml += `      <video:uploader`;
                    if (video.uploader.info) {
                        xml += ` info="${escapeXML(video.uploader.info)}"`;
                    }
                    xml += `>${escapeXML(video.uploader.name)}</video:uploader>\n`;
                }
                xml += '    </video:video>\n';
            }
        }
        xml += '  </url>\n';
    }
    xml += '</urlset>';
    return xml;
}
/**
 * Generate sitemap index (for multiple sitemaps)
 */
export function generateSitemapIndex(sitemaps) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const sitemap of sitemaps) {
        xml += '  <sitemap>\n';
        xml += `    <loc>${escapeXML(sitemap.loc)}</loc>\n`;
        if (sitemap.lastmod) {
            xml += `    <lastmod>${formatW3CDate(sitemap.lastmod)}</lastmod>\n`;
        }
        xml += '  </sitemap>\n';
    }
    xml += '</sitemapindex>';
    return xml;
}
/**
 * Generate sitemap from content collection
 */
export function generateSitemapFromCollection(options) {
    const { entries, site, mapping = {}, filter } = options;
    const filteredEntries = filter ? entries.filter(filter) : entries;
    const urls = filteredEntries.map(entry => {
        const data = entry.data;
        // Extract values using mapping or defaults
        const loc = typeof mapping.loc === 'function'
            ? mapping.loc(entry)
            : typeof mapping.loc === 'string'
                ? data[mapping.loc]
                : `/${'slug' in entry ? entry.slug : entry.id}`;
        const lastmod = typeof mapping.lastmod === 'function'
            ? mapping.lastmod(entry)
            : typeof mapping.lastmod === 'string'
                ? data[mapping.lastmod]
                : entry.modifiedTime;
        const priority = typeof mapping.priority === 'function'
            ? mapping.priority(entry)
            : typeof mapping.priority === 'number'
                ? mapping.priority
                : undefined;
        const result = { loc };
        if (lastmod !== undefined)
            result.lastmod = lastmod;
        if (mapping.changefreq !== undefined)
            result.changefreq = mapping.changefreq;
        if (priority !== undefined)
            result.priority = priority;
        return result;
    });
    return generateSitemap({ site, urls });
}
/**
 * Auto-discover routes from file system.
 *
 * Scans the routes directory recursively and parses file-based routing conventions:
 * - index.ts/tsx -> /
 * - about.ts -> /about
 * - [slug].ts -> /:slug (dynamic)
 * - [...rest].ts -> /* (catch-all)
 * - (group) folders -> route groups (no URL segment)
 *
 * @param routesDir - Absolute path to routes directory
 * @returns Array of RouteInfo objects
 */
export async function discoverRoutes(routesDir) {
    const { readdir, readFile } = await import('node:fs/promises');
    const { join, extname, basename } = await import('node:path');
    const routes = [];
    const validExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
    /**
     * Recursively scan directory for route files
     */
    async function scan(dir, prefix = '') {
        let entries;
        try {
            entries = await readdir(dir, { withFileTypes: true });
        }
        catch {
            // Directory doesn't exist or not readable
            return;
        }
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                // Check if it's a route group (parentheses folder)
                const isRouteGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
                if (isRouteGroup) {
                    // Route groups don't add to the URL path
                    await scan(fullPath, prefix);
                }
                else {
                    // Regular directory - add to path
                    const dirSegment = fileNameToRouteSegment(entry.name);
                    await scan(fullPath, prefix + '/' + dirSegment);
                }
            }
            else if (entry.isFile()) {
                const ext = extname(entry.name);
                if (!validExtensions.has(ext))
                    continue;
                // Skip declaration files (.d.ts, .d.tsx, etc.)
                if (entry.name.includes('.d.'))
                    continue;
                const fileName = basename(entry.name, ext);
                // Skip private files (starting with _)
                if (fileName.startsWith('_'))
                    continue;
                // Skip layout files
                if (fileName === 'layout' || fileName === '_layout')
                    continue;
                // Build the route path
                let routePath;
                if (fileName === 'index') {
                    // index.ts -> use parent path
                    routePath = prefix || '/';
                }
                else {
                    const segment = fileNameToRouteSegment(fileName);
                    routePath = prefix + '/' + segment;
                }
                // Normalize the path
                routePath = normalizePath(routePath);
                // Try to extract metadata from the file
                const metadata = await extractMetadata(fullPath, readFile);
                // Detect dynamic params
                const params = extractParams(routePath);
                const routeInfo = {
                    path: routePath,
                    ...metadata,
                };
                if (Object.keys(params).length > 0) {
                    routeInfo.params = params;
                }
                routes.push(routeInfo);
            }
        }
    }
    await scan(routesDir);
    // Sort routes: static routes first, then dynamic, then catch-all
    return routes.sort((a, b) => {
        const priorityA = calculatePriority(a.path);
        const priorityB = calculatePriority(b.path);
        return priorityB - priorityA;
    });
}
/**
 * Convert file name to route segment.
 * Handles dynamic ([param]) and catch-all ([...param]) patterns.
 */
function fileNameToRouteSegment(name) {
    // Handle catch-all: [...slug] -> *
    if (name.startsWith('[...') && name.endsWith(']')) {
        return '*';
    }
    // Handle dynamic: [id] -> :id
    if (name.startsWith('[') && name.endsWith(']')) {
        const param = name.slice(1, -1);
        return `:${param}`;
    }
    return name;
}
/**
 * Normalize route path
 */
function normalizePath(path) {
    // Ensure path starts with /
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    // Remove duplicate slashes
    path = path.replace(/\/+/g, '/');
    // Remove trailing slash (except for root)
    if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    return path;
}
/**
 * Extract dynamic params from route path.
 * Returns a Record with param names as keys and empty arrays as values
 * (to be populated by the user with actual values for sitemap generation).
 */
function extractParams(path) {
    const params = {};
    const segments = path.split('/');
    for (const segment of segments) {
        // Dynamic param: :id
        if (segment.startsWith(':')) {
            const paramName = segment.slice(1);
            params[paramName] = [];
        }
        // Catch-all: * (often represented as "rest" or "slug")
        else if (segment === '*') {
            params['*'] = [];
        }
    }
    return params;
}
/**
 * Calculate route priority for sorting.
 * Static routes have higher priority than dynamic routes.
 */
function calculatePriority(path) {
    let priority = 0;
    const segments = path.split('/').filter(Boolean);
    for (const segment of segments) {
        if (segment === '*') {
            // Catch-all has lowest priority
            priority -= 1000;
        }
        else if (segment.startsWith(':')) {
            // Dynamic segments have medium priority
            priority += 10;
        }
        else {
            // Static segments have highest priority
            priority += 100;
        }
    }
    return priority;
}
/**
 * Try to extract metadata from a route file.
 * Looks for exported `meta` or `sitemapConfig` objects.
 */
async function extractMetadata(filePath, readFile) {
    try {
        const content = await readFile(filePath, 'utf-8');
        const metadata = {};
        // Look for changefreq
        const changefreqMatch = content.match(/changefreq\s*[:=]\s*['"]?(always|hourly|daily|weekly|monthly|yearly|never)['"]?/i);
        if (changefreqMatch) {
            metadata.changefreq = changefreqMatch[1]?.toLowerCase();
        }
        // Look for priority (0.0 to 1.0)
        const priorityMatch = content.match(/priority\s*[:=]\s*(0(\.\d+)?|1(\.0+)?)/);
        if (priorityMatch) {
            metadata.priority = parseFloat(priorityMatch[1]);
        }
        // Try to get last modified time from file stats
        try {
            const { stat: statFn } = await import('node:fs/promises');
            const stats = await statFn(filePath);
            metadata.lastmod = stats.mtime;
        }
        catch {
            // Ignore stat errors
        }
        return metadata;
    }
    catch {
        // File couldn't be read, return empty metadata
        return {};
    }
}
/**
 * Generate sitemap URLs from route information
 */
export function generateUrlsFromRoutes(routes, site) {
    const urls = [];
    for (const route of routes) {
        // Handle dynamic routes
        if (route.params && Object.keys(route.params).length > 0) {
            // Generate all combinations
            const paramKeys = Object.keys(route.params);
            const combinations = generateParamCombinations(route.params);
            for (const combo of combinations) {
                let path = route.path;
                for (const key of paramKeys) {
                    path = path.replace(`[${key}]`, combo[key]);
                }
                const entry = { loc: path };
                if (route.lastmod !== undefined)
                    entry.lastmod = route.lastmod;
                if (route.changefreq !== undefined)
                    entry.changefreq = route.changefreq;
                if (route.priority !== undefined)
                    entry.priority = route.priority;
                urls.push(entry);
            }
        }
        else {
            const entry = { loc: route.path };
            if (route.lastmod !== undefined)
                entry.lastmod = route.lastmod;
            if (route.changefreq !== undefined)
                entry.changefreq = route.changefreq;
            if (route.priority !== undefined)
                entry.priority = route.priority;
            urls.push(entry);
        }
    }
    return urls;
}
/**
 * Generate all combinations of route parameters
 */
function generateParamCombinations(params) {
    const keys = Object.keys(params);
    if (keys.length === 0)
        return [{}];
    const [firstKey, ...restKeys] = keys;
    if (firstKey === undefined)
        return [{}];
    const restParams = {};
    for (const k of restKeys) {
        restParams[k] = params[k];
    }
    const restCombinations = generateParamCombinations(restParams);
    const combinations = [];
    for (const value of params[firstKey]) {
        for (const restCombo of restCombinations) {
            combinations.push({ [firstKey]: value, ...restCombo });
        }
    }
    return combinations;
}
/**
 * Split large sitemap into multiple files
 */
export function splitSitemap(urls, maxUrls = 50000) {
    const chunks = [];
    for (let i = 0; i < urls.length; i += maxUrls) {
        chunks.push(urls.slice(i, i + maxUrls));
    }
    return chunks;
}
/**
 * Create robots.txt content with sitemap reference
 */
export function generateRobotsTxt(options) {
    const userAgent = options.userAgent || '*';
    let txt = `User-agent: ${userAgent}\n`;
    if (options.allow) {
        for (const path of options.allow) {
            txt += `Allow: ${path}\n`;
        }
    }
    if (options.disallow) {
        for (const path of options.disallow) {
            txt += `Disallow: ${path}\n`;
        }
    }
    if (options.crawlDelay) {
        txt += `Crawl-delay: ${options.crawlDelay}\n`;
    }
    txt += `\nSitemap: ${options.sitemapUrl}\n`;
    return txt;
}
/**
 * Normalize URL (make absolute if relative)
 */
function normalizeUrl(url, site) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Remove trailing slash from site
    const baseSite = site.replace(/\/$/, '');
    // Ensure URL starts with /
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseSite}${path}`;
}
/**
 * Escape XML special characters
 */
function escapeXML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
/**
 * Format date in W3C format (ISO 8601)
 */
function formatW3CDate(date) {
    return date.toISOString();
}
/**
 * Validate sitemap configuration
 */
export function validateSitemap(config) {
    const errors = [];
    if (!config.site || config.site.trim() === '') {
        errors.push('Site URL is required');
    }
    if (!Array.isArray(config.urls)) {
        errors.push('URLs must be an array');
    }
    else {
        if (config.urls.length === 0) {
            errors.push('At least one URL is required');
        }
        if (config.urls.length > 50000) {
            errors.push('Sitemap cannot contain more than 50,000 URLs');
        }
        config.urls.forEach((url, index) => {
            if (!url.loc || url.loc.trim() === '') {
                errors.push(`URL ${index + 1}: location is required`);
            }
            if (url.priority !== undefined && (url.priority < 0 || url.priority > 1)) {
                errors.push(`URL ${index + 1}: priority must be between 0.0 and 1.0`);
            }
            if (url.images && url.images.length > 1000) {
                errors.push(`URL ${index + 1}: cannot have more than 1000 images`);
            }
        });
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=sitemap.js.map