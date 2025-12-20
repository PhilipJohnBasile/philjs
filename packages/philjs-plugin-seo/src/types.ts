/**
 * PhilJS SEO Plugin Types
 */

/**
 * Basic meta tags
 */
export interface MetaTags {
  /** Page title */
  title?: string;
  /** Title template (e.g., "%s | My Site") */
  titleTemplate?: string;
  /** Meta description */
  description?: string;
  /** Meta keywords */
  keywords?: string | string[];
  /** Canonical URL */
  canonical?: string;
  /** Robots directives */
  robots?: string | RobotsDirectives;
  /** Author */
  author?: string;
  /** Language */
  lang?: string;
  /** Viewport */
  viewport?: string;
  /** Theme color */
  themeColor?: string;
  /** Additional meta tags */
  meta?: Array<{
    name?: string;
    property?: string;
    content: string;
    httpEquiv?: string;
  }>;
}

/**
 * Robots directives
 */
export interface RobotsDirectives {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  noimageindex?: boolean;
  notranslate?: boolean;
  maxSnippet?: number;
  maxImagePreview?: 'none' | 'standard' | 'large';
  maxVideoPreview?: number;
}

/**
 * OpenGraph tags
 */
export interface OpenGraphTags {
  /** OG title */
  title?: string;
  /** OG description */
  description?: string;
  /** OG type (website, article, product, etc.) */
  type?: 'website' | 'article' | 'book' | 'profile' | 'music.song' | 'music.album' | 'video.movie' | 'video.episode' | 'product' | string;
  /** OG URL */
  url?: string;
  /** OG image */
  image?: string | OpenGraphImage;
  /** OG images (multiple) */
  images?: OpenGraphImage[];
  /** Site name */
  siteName?: string;
  /** Locale */
  locale?: string;
  /** Alternate locales */
  alternateLocales?: string[];
  /** Article-specific */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    expirationTime?: string;
    author?: string | string[];
    section?: string;
    tag?: string[];
  };
  /** Product-specific */
  product?: {
    price?: {
      amount: number;
      currency: string;
    };
    availability?: 'instock' | 'outofstock' | 'preorder';
  };
}

/**
 * OpenGraph image
 */
export interface OpenGraphImage {
  url: string;
  secureUrl?: string;
  type?: string;
  width?: number;
  height?: number;
  alt?: string;
}

/**
 * Twitter Card tags
 */
export interface TwitterTags {
  /** Card type */
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  /** Twitter handle of content creator */
  creator?: string;
  /** Twitter handle of site */
  site?: string;
  /** Title */
  title?: string;
  /** Description */
  description?: string;
  /** Image */
  image?: string;
  /** Image alt text */
  imageAlt?: string;
}

/**
 * JSON-LD structured data types
 */
export type JsonLdType =
  | 'Organization'
  | 'Person'
  | 'WebSite'
  | 'WebPage'
  | 'Article'
  | 'NewsArticle'
  | 'BlogPosting'
  | 'Product'
  | 'BreadcrumbList'
  | 'FAQPage'
  | 'HowTo'
  | 'Recipe'
  | 'Event'
  | 'LocalBusiness'
  | 'Review'
  | 'VideoObject'
  | 'ImageObject'
  | 'SoftwareApplication'
  | 'Course'
  | 'JobPosting';

/**
 * JSON-LD base interface
 */
export interface JsonLdBase {
  '@context'?: string;
  '@type': JsonLdType | string;
  '@id'?: string;
}

/**
 * Organization JSON-LD
 */
export interface OrganizationJsonLd extends JsonLdBase {
  '@type': 'Organization';
  name: string;
  url?: string;
  logo?: string | { '@type': 'ImageObject'; url: string };
  sameAs?: string[];
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone?: string;
    contactType?: string;
    email?: string;
    areaServed?: string | string[];
    availableLanguage?: string | string[];
  };
}

/**
 * WebSite JSON-LD
 */
export interface WebSiteJsonLd extends JsonLdBase {
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string | { '@type': 'EntryPoint'; urlTemplate: string };
    'query-input'?: string;
  };
}

/**
 * Article JSON-LD
 */
export interface ArticleJsonLd extends JsonLdBase {
  '@type': 'Article' | 'NewsArticle' | 'BlogPosting';
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  author?: { '@type': 'Person' | 'Organization'; name: string; url?: string } | Array<{ '@type': 'Person' | 'Organization'; name: string; url?: string }>;
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo?: { '@type': 'ImageObject'; url: string };
  };
  mainEntityOfPage?: string | { '@type': 'WebPage'; '@id': string };
}

/**
 * Product JSON-LD
 */
export interface ProductJsonLd extends JsonLdBase {
  '@type': 'Product';
  name: string;
  description?: string;
  image?: string | string[];
  brand?: { '@type': 'Brand'; name: string };
  sku?: string;
  gtin?: string;
  mpn?: string;
  offers?: {
    '@type': 'Offer' | 'AggregateOffer';
    price?: number;
    priceCurrency?: string;
    availability?: string;
    url?: string;
    priceValidUntil?: string;
    seller?: { '@type': 'Organization'; name: string };
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount?: number;
    bestRating?: number;
    worstRating?: number;
  };
  review?: Array<{
    '@type': 'Review';
    author: { '@type': 'Person'; name: string };
    reviewRating: { '@type': 'Rating'; ratingValue: number };
    reviewBody?: string;
    datePublished?: string;
  }>;
}

/**
 * BreadcrumbList JSON-LD
 */
export interface BreadcrumbJsonLd extends JsonLdBase {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
}

/**
 * FAQ JSON-LD
 */
export interface FAQJsonLd extends JsonLdBase {
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

/**
 * All JSON-LD types
 */
export type JsonLd =
  | OrganizationJsonLd
  | WebSiteJsonLd
  | ArticleJsonLd
  | ProductJsonLd
  | BreadcrumbJsonLd
  | FAQJsonLd
  | (JsonLdBase & Record<string, unknown>);

/**
 * Sitemap entry
 */
export interface SitemapEntry {
  /** URL */
  loc: string;
  /** Last modified date */
  lastmod?: string | Date;
  /** Change frequency */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /** Priority (0.0 - 1.0) */
  priority?: number;
  /** Alternate language versions */
  alternates?: Array<{
    hreflang: string;
    href: string;
  }>;
  /** Images */
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
}

/**
 * SEO plugin configuration
 */
export interface SEOPluginConfig {
  /** Default meta tags */
  defaults?: MetaTags;
  /** Default OpenGraph tags */
  openGraph?: OpenGraphTags;
  /** Default Twitter tags */
  twitter?: TwitterTags;
  /** Site-wide JSON-LD */
  jsonLd?: JsonLd | JsonLd[];
  /** Enable sitemap generation */
  sitemap?: boolean | SitemapConfig;
  /** Enable robots.txt generation */
  robots?: boolean | RobotsTxtConfig;
  /** Base URL for the site */
  baseUrl?: string;
  /** Enable trailing slashes */
  trailingSlash?: boolean;
}

/**
 * Sitemap configuration
 */
export interface SitemapConfig {
  /** Output path */
  output?: string;
  /** Routes to include */
  include?: string[];
  /** Routes to exclude */
  exclude?: string[];
  /** Default change frequency */
  defaultChangefreq?: SitemapEntry['changefreq'];
  /** Default priority */
  defaultPriority?: number;
  /** Custom entries */
  customEntries?: SitemapEntry[];
  /** Generate sitemap index for large sites */
  generateIndex?: boolean;
  /** Max entries per sitemap file */
  maxEntriesPerFile?: number;
}

/**
 * Robots.txt configuration
 */
export interface RobotsTxtConfig {
  /** Output path */
  output?: string;
  /** User agents */
  rules?: Array<{
    userAgent: string | string[];
    allow?: string | string[];
    disallow?: string | string[];
    crawlDelay?: number;
  }>;
  /** Sitemap URLs */
  sitemaps?: string[];
  /** Additional directives */
  additionalDirectives?: string[];
}

/**
 * SEO data for a page
 */
export interface PageSEO {
  meta?: MetaTags;
  openGraph?: OpenGraphTags;
  twitter?: TwitterTags;
  jsonLd?: JsonLd | JsonLd[];
  links?: Array<{
    rel: string;
    href: string;
    hreflang?: string;
    type?: string;
  }>;
}
