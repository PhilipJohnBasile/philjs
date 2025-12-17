/**
 * PhilJS Meta - Type Definitions
 */

export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
  key?: string;
}

export interface LinkTag {
  rel: string;
  href: string;
  as?: string;
  type?: string;
  sizes?: string;
  media?: string;
  crossOrigin?: string;
}

export interface MetaConfig {
  title?: string;
  titleTemplate?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  robots?: string;
  viewport?: string;
  themeColor?: string;
  colorScheme?: 'light' | 'dark' | 'light dark';
}

export interface OpenGraphConfig {
  type?: 'website' | 'article' | 'book' | 'profile' | 'music.song' | 'video.movie';
  title?: string;
  description?: string;
  url?: string;
  siteName?: string;
  image?: string | OpenGraphImage;
  images?: OpenGraphImage[];
  locale?: string;
  alternateLocales?: string[];

  // Article-specific
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };

  // Profile-specific
  profile?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    gender?: string;
  };
}

export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
  secureUrl?: string;
}

export interface TwitterConfig {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
}

export interface JSONLDConfig {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{
    lang: string;
    url: string;
  }>;
}

export interface RobotsConfig {
  userAgent?: string;
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
  sitemap?: string[];
}
