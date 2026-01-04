/**
 * PhilJS Content - Sitemap Generation
 *
 * Comprehensive XML sitemap generation with support for images, videos,
 * multi-language sites, and auto-discovery from routes and content.
 */
import type { CollectionEntry } from './types.js';
/**
 * Sitemap configuration
 */
export interface SitemapConfig {
    /** Site base URL */
    site: string;
    /** Sitemap entries */
    urls: SitemapUrl[];
    /** Custom namespace declarations */
    customNamespaces?: Record<string, string>;
    /** Sitemap index (for multiple sitemaps) */
    sitemapIndex?: boolean;
}
/**
 * Sitemap URL entry
 */
export interface SitemapUrl {
    /** Page URL (relative or absolute) */
    loc: string;
    /** Last modification date */
    lastmod?: Date;
    /** Change frequency */
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    /** Priority (0.0 to 1.0) */
    priority?: number;
    /** Alternate language versions */
    alternates?: SitemapAlternate[];
    /** Images on this page */
    images?: SitemapImage[];
    /** Videos on this page */
    videos?: SitemapVideo[];
}
/**
 * Alternate language version
 */
export interface SitemapAlternate {
    /** Language code (e.g., 'en', 'fr', 'es') */
    lang: string;
    /** URL for this language */
    href: string;
}
/**
 * Image entry in sitemap
 */
export interface SitemapImage {
    /** Image URL */
    loc: string;
    /** Image caption */
    caption?: string;
    /** Geographic location of the image */
    geo_location?: string;
    /** Image title */
    title?: string;
    /** License URL */
    license?: string;
}
/**
 * Video entry in sitemap
 */
export interface SitemapVideo {
    /** Video thumbnail URL */
    thumbnail_loc: string;
    /** Video title */
    title: string;
    /** Video description */
    description: string;
    /** Video content URL */
    content_loc?: string;
    /** Video player URL */
    player_loc?: string;
    /** Video duration (seconds) */
    duration?: number;
    /** Expiration date */
    expiration_date?: Date;
    /** Rating (0.0 to 5.0) */
    rating?: number;
    /** View count */
    view_count?: number;
    /** Publication date */
    publication_date?: Date;
    /** Family friendly */
    family_friendly?: boolean;
    /** Tags */
    tags?: string[];
    /** Category */
    category?: string;
    /** Live video */
    live?: boolean;
    /** Requires subscription */
    requires_subscription?: boolean;
    /** Uploader */
    uploader?: {
        name: string;
        info?: string;
    };
}
/**
 * Sitemap index entry
 */
export interface SitemapIndexEntry {
    /** Sitemap URL */
    loc: string;
    /** Last modification date */
    lastmod?: Date;
}
/**
 * Options for generating sitemaps from collections
 */
export interface SitemapFromCollectionOptions {
    /** Collection entries */
    entries: CollectionEntry[];
    /** Site URL */
    site: string;
    /** Field mapping */
    mapping?: {
        loc?: string | ((entry: CollectionEntry) => string);
        lastmod?: string | ((entry: CollectionEntry) => Date | undefined);
        changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
        priority?: number | ((entry: CollectionEntry) => number | undefined);
    };
    /** Filter function */
    filter?: (entry: CollectionEntry) => boolean;
}
/**
 * Route information for auto-discovery
 */
export interface RouteInfo {
    /** Route path */
    path: string;
    /** Last modified date */
    lastmod?: Date;
    /** Change frequency */
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    /** Priority */
    priority?: number;
    /** Dynamic route params (for generating variants) */
    params?: Record<string, string[]>;
}
/**
 * Generate XML sitemap
 */
export declare function generateSitemap(config: SitemapConfig): string;
/**
 * Generate sitemap index (for multiple sitemaps)
 */
export declare function generateSitemapIndex(sitemaps: SitemapIndexEntry[]): string;
/**
 * Generate sitemap from content collection
 */
export declare function generateSitemapFromCollection(options: SitemapFromCollectionOptions): string;
/**
 * Auto-discover routes from file system
 */
export declare function discoverRoutes(routesDir: string): RouteInfo[];
/**
 * Generate sitemap URLs from route information
 */
export declare function generateUrlsFromRoutes(routes: RouteInfo[], site: string): SitemapUrl[];
/**
 * Split large sitemap into multiple files
 */
export declare function splitSitemap(urls: SitemapUrl[], maxUrls?: number): SitemapUrl[][];
/**
 * Create robots.txt content with sitemap reference
 */
export declare function generateRobotsTxt(options: {
    sitemapUrl: string;
    disallow?: string[];
    allow?: string[];
    crawlDelay?: number;
    userAgent?: string;
}): string;
/**
 * Validate sitemap configuration
 */
export declare function validateSitemap(config: SitemapConfig): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=sitemap.d.ts.map