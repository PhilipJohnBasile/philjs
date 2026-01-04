/**
 * PhilJS Content - RSS Feed Generation
 *
 * Comprehensive RSS 2.0, Atom, and JSON feed generation with support
 * for auto-generation from content collections.
 */
import type { CollectionEntry } from './types.js';
/**
 * RSS feed configuration
 */
export interface RSSFeedConfig {
    /** Feed title */
    title: string;
    /** Feed description */
    description: string;
    /** Site URL (e.g., 'https://example.com') */
    site: string;
    /** Feed items */
    items: RSSFeedItem[];
    /** Feed language (default: 'en') */
    language?: string;
    /** Copyright notice */
    copyright?: string;
    /** Managing editor email */
    managingEditor?: string;
    /** Webmaster email */
    webMaster?: string;
    /** Feed image */
    image?: RSSFeedImage;
    /** Categories */
    categories?: string[];
    /** Custom namespace declarations */
    customNamespaces?: Record<string, string>;
    /** Custom elements to add to channel */
    customData?: string;
    /** Time to live (minutes) */
    ttl?: number;
}
/**
 * RSS feed item
 */
export interface RSSFeedItem {
    /** Item title */
    title: string;
    /** Item URL */
    link: string;
    /** Item description/content */
    description: string;
    /** Full content (optional, for content:encoded) */
    content?: string;
    /** Publication date */
    pubDate: Date;
    /** Author email (RFC 822 format) */
    author?: string;
    /** Categories/tags */
    categories?: string[];
    /** Globally unique identifier */
    guid?: string;
    /** Enclosure (for podcasts/media) */
    enclosure?: RSSEnclosure;
    /** Custom elements */
    customData?: string;
}
/**
 * RSS enclosure (for media)
 */
export interface RSSEnclosure {
    /** URL of the media file */
    url: string;
    /** Size in bytes */
    length: number;
    /** MIME type */
    type: string;
}
/**
 * RSS feed image
 */
export interface RSSFeedImage {
    /** Image URL */
    url: string;
    /** Image title (usually same as feed title) */
    title: string;
    /** Image link (usually site URL) */
    link: string;
    /** Image width (max 144, default 88) */
    width?: number;
    /** Image height (max 400, default 31) */
    height?: number;
}
/**
 * Atom feed configuration
 */
export interface AtomFeedConfig {
    /** Feed title */
    title: string;
    /** Feed subtitle */
    subtitle?: string;
    /** Site URL */
    site: string;
    /** Feed URL (self link) */
    feedUrl?: string;
    /** Feed items */
    items: AtomFeedItem[];
    /** Author information */
    author?: AtomAuthor;
    /** Feed language */
    language?: string;
    /** Feed updated date */
    updated?: Date;
    /** Feed icon */
    icon?: string;
    /** Feed logo */
    logo?: string;
    /** Categories */
    categories?: string[];
}
/**
 * Atom feed item
 */
export interface AtomFeedItem {
    /** Item title */
    title: string;
    /** Item URL */
    link: string;
    /** Item ID (usually the URL) */
    id?: string;
    /** Item summary */
    summary?: string;
    /** Full content */
    content?: string;
    /** Published date */
    published: Date;
    /** Updated date */
    updated?: Date;
    /** Author */
    author?: AtomAuthor;
    /** Categories */
    categories?: string[];
}
/**
 * Atom author
 */
export interface AtomAuthor {
    /** Author name */
    name: string;
    /** Author email */
    email?: string;
    /** Author URI */
    uri?: string;
}
/**
 * JSON Feed configuration
 */
export interface JSONFeedConfig {
    /** Feed title */
    title: string;
    /** Feed description */
    description?: string;
    /** Site URL */
    home_page_url: string;
    /** Feed URL */
    feed_url?: string;
    /** Feed items */
    items: JSONFeedItem[];
    /** Feed icon */
    icon?: string;
    /** Feed favicon */
    favicon?: string;
    /** Feed author */
    author?: {
        name?: string;
        url?: string;
        avatar?: string;
    };
    /** Feed language */
    language?: string;
    /** Expired flag */
    expired?: boolean;
    /** User comment */
    user_comment?: string;
}
/**
 * JSON Feed item
 */
export interface JSONFeedItem {
    /** Item ID (usually the URL) */
    id: string;
    /** Item URL */
    url?: string;
    /** External URL (for linked posts) */
    external_url?: string;
    /** Item title */
    title?: string;
    /** Item summary */
    summary?: string;
    /** Full content (HTML) */
    content_html?: string;
    /** Full content (text) */
    content_text?: string;
    /** Publication date */
    date_published?: string;
    /** Modified date */
    date_modified?: string;
    /** Author */
    author?: {
        name?: string;
        url?: string;
        avatar?: string;
    };
    /** Tags */
    tags?: string[];
    /** Language */
    language?: string;
    /** Attachments (for podcasts) */
    attachments?: JSONFeedAttachment[];
}
/**
 * JSON Feed attachment
 */
export interface JSONFeedAttachment {
    /** Attachment URL */
    url: string;
    /** MIME type */
    mime_type: string;
    /** Size in bytes */
    size_in_bytes?: number;
    /** Duration in seconds (for audio/video) */
    duration_in_seconds?: number;
    /** Title */
    title?: string;
}
/**
 * Options for generating feeds from collections
 */
export interface FeedFromCollectionOptions {
    /** Collection entries */
    entries: CollectionEntry[];
    /** Feed title */
    title: string;
    /** Feed description */
    description: string;
    /** Site URL */
    site: string;
    /** Feed URL (for self-referencing) */
    feedUrl?: string;
    /** Maximum number of items */
    limit?: number;
    /** Field mapping */
    mapping?: {
        title?: string | ((entry: CollectionEntry) => string);
        description?: string | ((entry: CollectionEntry) => string);
        link?: string | ((entry: CollectionEntry) => string);
        pubDate?: string | ((entry: CollectionEntry) => Date);
        author?: string | ((entry: CollectionEntry) => string | undefined);
        categories?: string | ((entry: CollectionEntry) => string[] | undefined);
        content?: string | ((entry: CollectionEntry) => string | undefined);
    };
}
/**
 * Generate RSS 2.0 feed XML
 */
export declare function generateRSS(config: RSSFeedConfig): string;
/**
 * Generate Atom feed XML
 */
export declare function generateAtom(config: AtomFeedConfig): string;
/**
 * Generate JSON Feed
 */
export declare function generateJSONFeed(config: JSONFeedConfig): string;
/**
 * Generate RSS feed from content collection
 */
export declare function generateRSSFromCollection(options: FeedFromCollectionOptions): string;
/**
 * Generate Atom feed from content collection
 */
export declare function generateAtomFromCollection(options: FeedFromCollectionOptions): string;
/**
 * Generate JSON Feed from content collection
 */
export declare function generateJSONFeedFromCollection(options: FeedFromCollectionOptions): string;
/**
 * Validate RSS feed
 */
export declare function validateRSSFeed(config: RSSFeedConfig): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=rss.d.ts.map