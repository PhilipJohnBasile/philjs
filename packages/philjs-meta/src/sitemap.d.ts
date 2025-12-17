/**
 * PhilJS Meta - Sitemap Generation
 */
import type { SitemapEntry } from './types';
/**
 * Generate XML sitemap
 */
export declare function generateSitemap(entries: SitemapEntry[]): string;
/**
 * Generate sitemap index
 */
export declare function generateSitemapIndex(sitemaps: Array<{
    loc: string;
    lastmod?: string;
}>): string;
/**
 * Generate robots.txt
 */
export declare function generateRobotsTxt(config: {
    rules: Array<{
        userAgent?: string;
        allow?: string[];
        disallow?: string[];
        crawlDelay?: number;
    }>;
    sitemaps?: string[];
    host?: string;
}): string;
/**
 * Create sitemap entry from route
 */
export declare function createSitemapEntry(path: string, options: {
    baseUrl: string;
    lastmod?: Date | string;
    changefreq?: SitemapEntry['changefreq'];
    priority?: number;
}): SitemapEntry;
/**
 * Split large sitemap into multiple files
 */
export declare function splitSitemap(entries: SitemapEntry[], maxUrls?: number): SitemapEntry[][];
/**
 * Generate sitemap from routes
 */
export declare function generateSitemapFromRoutes(routes: string[], baseUrl: string, options?: {
    exclude?: string[];
    priority?: Record<string, number>;
    changefreq?: Record<string, SitemapEntry['changefreq']>;
}): SitemapEntry[];
//# sourceMappingURL=sitemap.d.ts.map