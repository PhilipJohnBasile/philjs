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
export function generateRSS(config: RSSFeedConfig): string {
  const now = new Date();
  const language = config.language || 'en';

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0"';

  // Add namespaces
  xml += ' xmlns:content="http://purl.org/rss/1.0/modules/content/"';
  xml += ' xmlns:atom="http://www.w3.org/2005/Atom"';

  if (config.customNamespaces) {
    for (const [prefix, uri] of Object.entries(config.customNamespaces)) {
      xml += ` xmlns:${prefix}="${escapeXML(uri)}"`;
    }
  }

  xml += '>\n';
  xml += '  <channel>\n';
  xml += `    <title>${escapeXML(config.title)}</title>\n`;
  xml += `    <description>${escapeXML(config.description)}</description>\n`;
  xml += `    <link>${escapeXML(config.site)}</link>\n`;
  xml += `    <language>${language}</language>\n`;
  xml += `    <lastBuildDate>${formatRFC822Date(now)}</lastBuildDate>\n`;

  if (config.copyright) {
    xml += `    <copyright>${escapeXML(config.copyright)}</copyright>\n`;
  }

  if (config.managingEditor) {
    xml += `    <managingEditor>${escapeXML(config.managingEditor)}</managingEditor>\n`;
  }

  if (config.webMaster) {
    xml += `    <webMaster>${escapeXML(config.webMaster)}</webMaster>\n`;
  }

  if (config.ttl) {
    xml += `    <ttl>${config.ttl}</ttl>\n`;
  }

  if (config.image) {
    xml += '    <image>\n';
    xml += `      <url>${escapeXML(config.image.url)}</url>\n`;
    xml += `      <title>${escapeXML(config.image.title)}</title>\n`;
    xml += `      <link>${escapeXML(config.image.link)}</link>\n`;
    if (config.image.width) {
      xml += `      <width>${config.image.width}</width>\n`;
    }
    if (config.image.height) {
      xml += `      <height>${config.image.height}</height>\n`;
    }
    xml += '    </image>\n';
  }

  if (config.categories) {
    for (const category of config.categories) {
      xml += `    <category>${escapeXML(category)}</category>\n`;
    }
  }

  if (config.customData) {
    xml += `    ${config.customData}\n`;
  }

  // Add items
  for (const item of config.items) {
    xml += '    <item>\n';
    xml += `      <title>${escapeXML(item.title)}</title>\n`;
    xml += `      <link>${escapeXML(item.link)}</link>\n`;
    xml += `      <description>${escapeXML(item.description)}</description>\n`;
    xml += `      <pubDate>${formatRFC822Date(item.pubDate)}</pubDate>\n`;

    const guid = item.guid || item.link;
    xml += `      <guid isPermaLink="${item.guid ? 'false' : 'true'}">${escapeXML(guid)}</guid>\n`;

    if (item.author) {
      xml += `      <author>${escapeXML(item.author)}</author>\n`;
    }

    if (item.categories) {
      for (const category of item.categories) {
        xml += `      <category>${escapeXML(category)}</category>\n`;
      }
    }

    if (item.content) {
      xml += `      <content:encoded><![CDATA[${item.content}]]></content:encoded>\n`;
    }

    if (item.enclosure) {
      xml += `      <enclosure url="${escapeXML(item.enclosure.url)}" `;
      xml += `length="${item.enclosure.length}" `;
      xml += `type="${escapeXML(item.enclosure.type)}" />\n`;
    }

    if (item.customData) {
      xml += `      ${item.customData}\n`;
    }

    xml += '    </item>\n';
  }

  xml += '  </channel>\n';
  xml += '</rss>';

  return xml;
}

/**
 * Generate Atom feed XML
 */
export function generateAtom(config: AtomFeedConfig): string {
  const updated = config.updated || new Date();
  const feedUrl = config.feedUrl || config.site;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<feed xmlns="http://www.w3.org/2005/Atom"';

  if (config.language) {
    xml += ` xml:lang="${config.language}"`;
  }

  xml += '>\n';
  xml += `  <title>${escapeXML(config.title)}</title>\n`;

  if (config.subtitle) {
    xml += `  <subtitle>${escapeXML(config.subtitle)}</subtitle>\n`;
  }

  xml += `  <link href="${escapeXML(config.site)}" />\n`;
  xml += `  <link href="${escapeXML(feedUrl)}" rel="self" type="application/atom+xml" />\n`;
  xml += `  <id>${escapeXML(config.site)}</id>\n`;
  xml += `  <updated>${formatISO8601Date(updated)}</updated>\n`;

  if (config.author) {
    xml += '  <author>\n';
    xml += `    <name>${escapeXML(config.author.name)}</name>\n`;
    if (config.author.email) {
      xml += `    <email>${escapeXML(config.author.email)}</email>\n`;
    }
    if (config.author.uri) {
      xml += `    <uri>${escapeXML(config.author.uri)}</uri>\n`;
    }
    xml += '  </author>\n';
  }

  if (config.icon) {
    xml += `  <icon>${escapeXML(config.icon)}</icon>\n`;
  }

  if (config.logo) {
    xml += `  <logo>${escapeXML(config.logo)}</logo>\n`;
  }

  if (config.categories) {
    for (const category of config.categories) {
      xml += `  <category term="${escapeXML(category)}" />\n`;
    }
  }

  // Add entries
  for (const item of config.items) {
    const itemId = item.id || item.link;
    const itemUpdated = item.updated || item.published;

    xml += '  <entry>\n';
    xml += `    <title>${escapeXML(item.title)}</title>\n`;
    xml += `    <link href="${escapeXML(item.link)}" />\n`;
    xml += `    <id>${escapeXML(itemId)}</id>\n`;
    xml += `    <published>${formatISO8601Date(item.published)}</published>\n`;
    xml += `    <updated>${formatISO8601Date(itemUpdated)}</updated>\n`;

    if (item.author) {
      xml += '    <author>\n';
      xml += `      <name>${escapeXML(item.author.name)}</name>\n`;
      if (item.author.email) {
        xml += `      <email>${escapeXML(item.author.email)}</email>\n`;
      }
      if (item.author.uri) {
        xml += `      <uri>${escapeXML(item.author.uri)}</uri>\n`;
      }
      xml += '    </author>\n';
    }

    if (item.summary) {
      xml += `    <summary>${escapeXML(item.summary)}</summary>\n`;
    }

    if (item.content) {
      xml += `    <content type="html"><![CDATA[${item.content}]]></content>\n`;
    }

    if (item.categories) {
      for (const category of item.categories) {
        xml += `    <category term="${escapeXML(category)}" />\n`;
      }
    }

    xml += '  </entry>\n';
  }

  xml += '</feed>';

  return xml;
}

/**
 * Generate JSON Feed
 */
export function generateJSONFeed(config: JSONFeedConfig): string {
  const feed: Record<string, unknown> = {
    version: 'https://jsonfeed.org/version/1.1',
    title: config.title,
    home_page_url: config.home_page_url,
  };

  if (config.description) feed.description = config.description;
  if (config.feed_url) feed.feed_url = config.feed_url;
  if (config.icon) feed.icon = config.icon;
  if (config.favicon) feed.favicon = config.favicon;
  if (config.author) feed.author = config.author;
  if (config.language) feed.language = config.language;
  if (config.expired) feed.expired = config.expired;
  if (config.user_comment) feed.user_comment = config.user_comment;

  feed.items = config.items;

  return JSON.stringify(feed, null, 2);
}

/**
 * Generate RSS feed from content collection
 */
export function generateRSSFromCollection(options: FeedFromCollectionOptions): string {
  const items = createFeedItems(options);

  return generateRSS({
    title: options.title,
    description: options.description,
    site: options.site,
    items: items.map(item => ({
      title: item.title,
      link: item.link,
      description: item.description,
      content: item.content,
      pubDate: item.pubDate,
      author: item.author,
      categories: item.categories,
    })),
  });
}

/**
 * Generate Atom feed from content collection
 */
export function generateAtomFromCollection(options: FeedFromCollectionOptions): string {
  const items = createFeedItems(options);

  return generateAtom({
    title: options.title,
    subtitle: options.description,
    site: options.site,
    feedUrl: options.feedUrl,
    items: items.map(item => ({
      title: item.title,
      link: item.link,
      summary: item.description,
      content: item.content,
      published: item.pubDate,
      categories: item.categories,
    })),
  });
}

/**
 * Generate JSON Feed from content collection
 */
export function generateJSONFeedFromCollection(options: FeedFromCollectionOptions): string {
  const items = createFeedItems(options);

  return generateJSONFeed({
    title: options.title,
    description: options.description,
    home_page_url: options.site,
    feed_url: options.feedUrl,
    items: items.map(item => ({
      id: item.link,
      url: item.link,
      title: item.title,
      summary: item.description,
      content_html: item.content,
      date_published: item.pubDate.toISOString(),
      tags: item.categories,
    })),
  });
}

/**
 * Helper to create feed items from collection entries
 */
function createFeedItems(options: FeedFromCollectionOptions): Array<{
  title: string;
  link: string;
  description: string;
  content?: string;
  pubDate: Date;
  author?: string;
  categories?: string[];
}> {
  const { entries, site, mapping = {} } = options;
  const limit = options.limit || entries.length;

  return entries.slice(0, limit).map(entry => {
    const data = entry.data as Record<string, unknown>;

    // Extract values using mapping or defaults
    const slug = 'slug' in entry ? entry.slug : entry.id;
    const title = extractValue(mapping.title, entry, data, 'title', data.title as string || slug);
    const description = extractValue(mapping.description, entry, data, 'description', data.description as string || '');
    const link = extractValue(mapping.link, entry, data, 'slug', `${site}/${slug}`);
    const pubDate = extractValue(mapping.pubDate, entry, data, 'date', data.date as Date || entry.modifiedTime);
    const author = extractValue(mapping.author, entry, data, 'author', data.author as string | undefined);
    const categories = extractValue(mapping.categories, entry, data, 'tags', data.tags as string[] | undefined);
    const content = entry.type === 'content'
      ? extractValue(mapping.content, entry, data, 'body', entry.body)
      : undefined;

    return {
      title: String(title),
      link: String(link),
      description: String(description),
      content: content ? String(content) : undefined,
      pubDate: pubDate instanceof Date ? pubDate : new Date(pubDate),
      author: author ? String(author) : undefined,
      categories: Array.isArray(categories) ? categories.map(String) : undefined,
    };
  });
}

/**
 * Extract value from mapping or data
 */
function extractValue<T>(
  mapping: string | ((entry: CollectionEntry) => T) | undefined,
  entry: CollectionEntry,
  data: Record<string, unknown>,
  defaultField: string,
  fallback: T
): T {
  if (typeof mapping === 'function') {
    return mapping(entry);
  }
  if (typeof mapping === 'string') {
    return (data[mapping] as T) || fallback;
  }
  return (data[defaultField] as T) || fallback;
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date in RFC 822 format (for RSS)
 */
function formatRFC822Date(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const day = days[date.getUTCDay()];
  const d = String(date.getUTCDate()).padStart(2, '0');
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const h = String(date.getUTCHours()).padStart(2, '0');
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');

  return `${day}, ${d} ${month} ${year} ${h}:${m}:${s} GMT`;
}

/**
 * Format date in ISO 8601 format (for Atom)
 */
function formatISO8601Date(date: Date): string {
  return date.toISOString();
}

/**
 * Validate RSS feed
 */
export function validateRSSFeed(config: RSSFeedConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.title || config.title.trim() === '') {
    errors.push('Feed title is required');
  }

  if (!config.description || config.description.trim() === '') {
    errors.push('Feed description is required');
  }

  if (!config.site || config.site.trim() === '') {
    errors.push('Site URL is required');
  }

  if (!Array.isArray(config.items)) {
    errors.push('Feed items must be an array');
  } else {
    config.items.forEach((item, index) => {
      if (!item.title || item.title.trim() === '') {
        errors.push(`Item ${index + 1}: title is required`);
      }
      if (!item.link || item.link.trim() === '') {
        errors.push(`Item ${index + 1}: link is required`);
      }
      if (!item.description || item.description.trim() === '') {
        errors.push(`Item ${index + 1}: description is required`);
      }
      if (!(item.pubDate instanceof Date) || isNaN(item.pubDate.getTime())) {
        errors.push(`Item ${index + 1}: valid pubDate is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
