/**
 * PhilJS CLI - Sitemap Generator
 *
 * Generates XML sitemaps from content collections and routes
 */
export interface SitemapGeneratorOptions {
    /** Output file path */
    output?: string;
    /** Collection name to generate sitemap from */
    collection?: string;
    /** Site URL */
    site?: string;
    /** Change frequency */
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    /** Priority (0.0 to 1.0) */
    priority?: number;
    /** Include images */
    includeImages?: boolean;
}
/**
 * Generate sitemap
 */
export declare function generateSitemap(options: SitemapGeneratorOptions): Promise<void>;
//# sourceMappingURL=sitemap.d.ts.map