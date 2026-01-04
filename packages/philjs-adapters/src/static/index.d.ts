/**
 * PhilJS Static Adapter
 *
 * Generate a fully static site (SSG)
 */
import type { Adapter, AdapterConfig } from '../types.js';
export interface StaticConfig extends AdapterConfig {
    /** Pages to prerender */
    pages?: string[];
    /** Fallback behavior for dynamic routes */
    fallback?: 'index.html' | '404.html' | false;
    /** Generate sitemap.xml */
    sitemap?: {
        hostname: string;
        changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
        priority?: number;
    };
    /** Generate robots.txt */
    robots?: {
        allow?: string[];
        disallow?: string[];
        sitemap?: boolean;
    };
    /** Trailing slashes */
    trailingSlash?: boolean;
    /** Clean URLs (no .html extension) */
    cleanUrls?: boolean;
}
export declare function staticAdapter(config?: StaticConfig): Adapter;
export declare function prerender(routes: string[]): Promise<Map<string, string>>;
export declare function getStaticPaths<T extends Record<string, string>>(paths: T[]): {
    paths: T[];
    fallback: boolean;
};
export default staticAdapter;
//# sourceMappingURL=index.d.ts.map