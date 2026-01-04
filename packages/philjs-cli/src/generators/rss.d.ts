/**
 * PhilJS CLI - RSS Feed Generator
 *
 * Generates RSS/Atom/JSON feeds from content collections
 */
export interface RSSGeneratorOptions {
    /** Output file path */
    output?: string;
    /** Feed format: rss, atom, or json */
    format?: 'rss' | 'atom' | 'json';
    /** Collection name to generate feed from */
    collection?: string;
    /** Feed title */
    title?: string;
    /** Feed description */
    description?: string;
    /** Site URL */
    site?: string;
    /** Maximum number of items */
    limit?: number;
}
/**
 * Generate RSS feed
 */
export declare function generateRSS(options: RSSGeneratorOptions): Promise<void>;
//# sourceMappingURL=rss.d.ts.map