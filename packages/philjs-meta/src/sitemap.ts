/**
 * PhilJS Meta - Sitemap Generation
 */

import type { SitemapEntry } from './types';

/**
 * Generate XML sitemap
 */
export function generateSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map(entry => `
  <url>
    <loc>${escapeXml(entry.url)}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : ''}
    ${entry.alternates?.map(alt => `
    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${escapeXml(alt.url)}" />`).join('') || ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}
</urlset>`;
}

/**
 * Generate sitemap index
 */
export function generateSitemapIndex(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
  const entries = sitemaps.map(entry => `
  <sitemap>
    <loc>${escapeXml(entry.loc)}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
  </sitemap>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</sitemapindex>`;
}

/**
 * Generate robots.txt
 */
export function generateRobotsTxt(config: {
  rules: Array<{
    userAgent?: string;
    allow?: string[];
    disallow?: string[];
    crawlDelay?: number;
  }>;
  sitemaps?: string[];
  host?: string;
}): string {
  const { rules, sitemaps, host } = config;

  let content = '';

  rules.forEach(rule => {
    content += `User-agent: ${rule.userAgent || '*'}\n`;

    if (rule.allow) {
      rule.allow.forEach(path => {
        content += `Allow: ${path}\n`;
      });
    }

    if (rule.disallow) {
      rule.disallow.forEach(path => {
        content += `Disallow: ${path}\n`;
      });
    }

    if (rule.crawlDelay !== undefined) {
      content += `Crawl-delay: ${rule.crawlDelay}\n`;
    }

    content += '\n';
  });

  if (host) {
    content += `Host: ${host}\n\n`;
  }

  if (sitemaps) {
    sitemaps.forEach(sitemap => {
      content += `Sitemap: ${sitemap}\n`;
    });
  }

  return content;
}

/**
 * Create sitemap entry from route
 */
export function createSitemapEntry(
  path: string,
  options: {
    baseUrl: string;
    lastmod?: Date | string;
    changefreq?: SitemapEntry['changefreq'];
    priority?: number;
  }
): SitemapEntry {
  const url = new URL(path, options.baseUrl).toString();

  return {
    url,
    lastmod: options.lastmod
      ? options.lastmod instanceof Date
        ? options.lastmod.toISOString()
        : options.lastmod
      : undefined,
    changefreq: options.changefreq,
    priority: options.priority,
  };
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Split large sitemap into multiple files
 */
export function splitSitemap(entries: SitemapEntry[], maxUrls = 50000): SitemapEntry[][] {
  const chunks: SitemapEntry[][] = [];

  for (let i = 0; i < entries.length; i += maxUrls) {
    chunks.push(entries.slice(i, i + maxUrls));
  }

  return chunks;
}

/**
 * Generate sitemap from routes
 */
export function generateSitemapFromRoutes(
  routes: string[],
  baseUrl: string,
  options?: {
    exclude?: string[];
    priority?: Record<string, number>;
    changefreq?: Record<string, SitemapEntry['changefreq']>;
  }
): SitemapEntry[] {
  const { exclude = [], priority = {}, changefreq = {} } = options || {};

  return routes
    .filter(route => !exclude.some(pattern => new RegExp(pattern).test(route)))
    .map(route => ({
      url: new URL(route, baseUrl).toString(),
      priority: priority[route],
      changefreq: changefreq[route],
    }));
}
