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
export function generateSitemap(config: SitemapConfig): string {
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
export function generateSitemapIndex(sitemaps: SitemapIndexEntry[]): string {
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
export function generateSitemapFromCollection(options: SitemapFromCollectionOptions): string {
  const { entries, site, mapping = {}, filter } = options;

  const filteredEntries = filter ? entries.filter(filter) : entries;

  const urls: SitemapUrl[] = filteredEntries.map(entry => {
    const data = entry.data as Record<string, unknown>;

    // Extract values using mapping or defaults
    const loc = typeof mapping.loc === 'function'
      ? mapping.loc(entry)
      : typeof mapping.loc === 'string'
      ? data[mapping.loc] as string
      : `/${'slug' in entry ? entry.slug : entry.id}`;

    const lastmod = typeof mapping.lastmod === 'function'
      ? mapping.lastmod(entry)
      : typeof mapping.lastmod === 'string'
      ? data[mapping.lastmod] as Date
      : entry.modifiedTime;

    const priority = typeof mapping.priority === 'function'
      ? mapping.priority(entry)
      : typeof mapping.priority === 'number'
      ? mapping.priority
      : undefined;

    const result: SitemapUrl = { loc };
    if (lastmod !== undefined) result.lastmod = lastmod;
    if (mapping.changefreq !== undefined) result.changefreq = mapping.changefreq;
    if (priority !== undefined) result.priority = priority;
    return result;
  });

  return generateSitemap({ site, urls });
}

/**
 * Auto-discover routes from file system
 */
export function discoverRoutes(routesDir: string): RouteInfo[] {
  // This would be implemented to scan route files
  // For now, return empty array - actual implementation would use fs
  return [];
}

/**
 * Generate sitemap URLs from route information
 */
export function generateUrlsFromRoutes(routes: RouteInfo[], site: string): SitemapUrl[] {
  const urls: SitemapUrl[] = [];

  for (const route of routes) {
    // Handle dynamic routes
    if (route.params && Object.keys(route.params).length > 0) {
      // Generate all combinations
      const paramKeys = Object.keys(route.params);
      const combinations = generateParamCombinations(route.params);

      for (const combo of combinations) {
        let path = route.path;
        for (const key of paramKeys) {
          path = path.replace(`[${key}]`, combo[key]!);
        }

        const entry: SitemapUrl = { loc: path };
        if (route.lastmod !== undefined) entry.lastmod = route.lastmod;
        if (route.changefreq !== undefined) entry.changefreq = route.changefreq;
        if (route.priority !== undefined) entry.priority = route.priority;
        urls.push(entry);
      }
    } else {
      const entry: SitemapUrl = { loc: route.path };
      if (route.lastmod !== undefined) entry.lastmod = route.lastmod;
      if (route.changefreq !== undefined) entry.changefreq = route.changefreq;
      if (route.priority !== undefined) entry.priority = route.priority;
      urls.push(entry);
    }
  }

  return urls;
}

/**
 * Generate all combinations of route parameters
 */
function generateParamCombinations(
  params: Record<string, string[]>
): Record<string, string>[] {
  const keys = Object.keys(params);
  if (keys.length === 0) return [{}];

  const [firstKey, ...restKeys] = keys;
  if (firstKey === undefined) return [{}];

  const restParams: Record<string, string[]> = {};
  for (const k of restKeys) {
    restParams[k] = params[k]!;
  }

  const restCombinations = generateParamCombinations(restParams);
  const combinations: Record<string, string>[] = [];

  for (const value of params[firstKey]!) {
    for (const restCombo of restCombinations) {
      combinations.push({ [firstKey]: value, ...restCombo });
    }
  }

  return combinations;
}

/**
 * Split large sitemap into multiple files
 */
export function splitSitemap(
  urls: SitemapUrl[],
  maxUrls: number = 50000
): SitemapUrl[][] {
  const chunks: SitemapUrl[][] = [];

  for (let i = 0; i < urls.length; i += maxUrls) {
    chunks.push(urls.slice(i, i + maxUrls));
  }

  return chunks;
}

/**
 * Create robots.txt content with sitemap reference
 */
export function generateRobotsTxt(options: {
  sitemapUrl: string;
  disallow?: string[];
  allow?: string[];
  crawlDelay?: number;
  userAgent?: string;
}): string {
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
function normalizeUrl(url: string, site: string): string {
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
function escapeXML(str: string): string {
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
function formatW3CDate(date: Date): string {
  return date.toISOString();
}

/**
 * Validate sitemap configuration
 */
export function validateSitemap(config: SitemapConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.site || config.site.trim() === '') {
    errors.push('Site URL is required');
  }

  if (!Array.isArray(config.urls)) {
    errors.push('URLs must be an array');
  } else {
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
