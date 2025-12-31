/**
 * PhilJS Content - SEO Utilities
 *
 * Comprehensive SEO utilities including meta tags, Open Graph, Twitter Cards,
 * JSON-LD structured data, and a useSEO() hook for easy integration.
 */
import type { CollectionEntry } from './types.js';
/**
 * SEO configuration
 */
export interface SEOConfig {
    /** Page title */
    title?: string;
    /** Meta description */
    description?: string;
    /** Canonical URL */
    canonical?: string;
    /** Keywords (comma-separated or array) */
    keywords?: string | string[];
    /** Robots meta directives */
    robots?: RobotsDirective | RobotsDirective[];
    /** Language code */
    language?: string;
    /** Alternate language versions */
    alternates?: AlternateLanguage[];
    /** Open Graph tags */
    openGraph?: OpenGraphConfig;
    /** Twitter Card tags */
    twitter?: TwitterCardConfig;
    /** JSON-LD structured data */
    jsonLd?: JSONLDSchema | JSONLDSchema[];
    /** Additional meta tags */
    additionalMetaTags?: MetaTag[];
    /** Additional link tags */
    additionalLinkTags?: LinkTag[];
}
/**
 * Robots directive
 */
export type RobotsDirective = 'index' | 'noindex' | 'follow' | 'nofollow' | 'noarchive' | 'nosnippet' | 'noimageindex' | 'nocache' | 'notranslate';
/**
 * Alternate language version
 */
export interface AlternateLanguage {
    /** Language code */
    lang: string;
    /** URL for this language */
    href: string;
}
/**
 * Open Graph configuration
 */
export interface OpenGraphConfig {
    /** Page type */
    type?: 'website' | 'article' | 'profile' | 'book' | 'video.movie' | 'video.episode' | 'video.tv_show' | 'video.other' | 'music.song' | 'music.album' | 'music.playlist' | 'music.radio_station';
    /** Page title */
    title?: string;
    /** Page description */
    description?: string;
    /** Page URL */
    url?: string;
    /** Site name */
    siteName?: string;
    /** Locale */
    locale?: string;
    /** Alternate locales */
    alternateLocales?: string[];
    /** Images */
    images?: OpenGraphImage[];
    /** Videos */
    videos?: OpenGraphVideo[];
    /** Article-specific properties */
    article?: OpenGraphArticle;
    /** Profile-specific properties */
    profile?: OpenGraphProfile;
    /** Book-specific properties */
    book?: OpenGraphBook;
}
/**
 * Open Graph image
 */
export interface OpenGraphImage {
    /** Image URL */
    url: string;
    /** Secure URL (HTTPS) */
    secureUrl?: string;
    /** MIME type */
    type?: string;
    /** Image width */
    width?: number;
    /** Image height */
    height?: number;
    /** Alt text */
    alt?: string;
}
/**
 * Open Graph video
 */
export interface OpenGraphVideo {
    /** Video URL */
    url: string;
    /** Secure URL (HTTPS) */
    secureUrl?: string;
    /** MIME type */
    type?: string;
    /** Video width */
    width?: number;
    /** Video height */
    height?: number;
}
/**
 * Open Graph article properties
 */
export interface OpenGraphArticle {
    /** Published time */
    publishedTime?: Date;
    /** Modified time */
    modifiedTime?: Date;
    /** Expiration time */
    expirationTime?: Date;
    /** Authors */
    authors?: string[];
    /** Section */
    section?: string;
    /** Tags */
    tags?: string[];
}
/**
 * Open Graph profile properties
 */
export interface OpenGraphProfile {
    /** First name */
    firstName?: string;
    /** Last name */
    lastName?: string;
    /** Username */
    username?: string;
    /** Gender */
    gender?: string;
}
/**
 * Open Graph book properties
 */
export interface OpenGraphBook {
    /** Authors */
    authors?: string[];
    /** ISBN */
    isbn?: string;
    /** Release date */
    releaseDate?: Date;
    /** Tags */
    tags?: string[];
}
/**
 * Twitter Card configuration
 */
export interface TwitterCardConfig {
    /** Card type */
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    /** Twitter handle of site */
    site?: string;
    /** Twitter handle of creator */
    creator?: string;
    /** Page title */
    title?: string;
    /** Page description */
    description?: string;
    /** Image URL */
    image?: string;
    /** Image alt text */
    imageAlt?: string;
    /** App-specific properties */
    app?: TwitterApp;
    /** Player-specific properties */
    player?: TwitterPlayer;
}
/**
 * Twitter App properties
 */
export interface TwitterApp {
    /** App name */
    name?: string;
    /** App ID (iPhone) */
    idIphone?: string;
    /** App ID (iPad) */
    idIpad?: string;
    /** App ID (Google Play) */
    idGoogleplay?: string;
    /** App URL (iPhone) */
    urlIphone?: string;
    /** App URL (iPad) */
    urlIpad?: string;
    /** App URL (Google Play) */
    urlGoogleplay?: string;
}
/**
 * Twitter Player properties
 */
export interface TwitterPlayer {
    /** Player URL */
    url: string;
    /** Player width */
    width: number;
    /** Player height */
    height: number;
    /** Stream URL */
    stream?: string;
}
/**
 * Generic meta tag
 */
export interface MetaTag {
    /** Tag name */
    name?: string;
    /** Tag property */
    property?: string;
    /** Tag content */
    content: string;
    /** HTTP-equiv */
    httpEquiv?: string;
}
/**
 * Generic link tag
 */
export interface LinkTag {
    /** Relationship */
    rel: string;
    /** URL */
    href: string;
    /** Type */
    type?: string;
    /** Sizes */
    sizes?: string;
    /** Media */
    media?: string;
    /** hreflang */
    hreflang?: string;
    /** Cross-origin */
    crossorigin?: string;
}
/**
 * JSON-LD schema types (common ones)
 */
export type JSONLDSchema = JSONLDArticle | JSONLDBreadcrumb | JSONLDOrganization | JSONLDPerson | JSONLDWebSite | JSONLDWebPage | JSONLDProduct | JSONLDEvent | Record<string, unknown>;
/**
 * JSON-LD Article
 */
export interface JSONLDArticle {
    '@context': 'https://schema.org';
    '@type': 'Article' | 'BlogPosting' | 'NewsArticle' | 'TechArticle';
    headline: string;
    description?: string;
    image?: string | string[];
    datePublished?: string;
    dateModified?: string;
    author?: JSONLDPerson | JSONLDPerson[];
    publisher?: JSONLDOrganization;
    mainEntityOfPage?: {
        '@type': 'WebPage';
        '@id': string;
    };
    keywords?: string | string[];
    articleSection?: string;
    wordCount?: number;
}
/**
 * JSON-LD Breadcrumb
 */
export interface JSONLDBreadcrumb {
    '@context': 'https://schema.org';
    '@type': 'BreadcrumbList';
    itemListElement: Array<{
        '@type': 'ListItem';
        position: number;
        name: string;
        item?: string;
    }>;
}
/**
 * JSON-LD Organization
 */
export interface JSONLDOrganization {
    '@context'?: 'https://schema.org';
    '@type': 'Organization';
    name: string;
    url?: string;
    logo?: string;
    sameAs?: string[];
    contactPoint?: Array<{
        '@type': 'ContactPoint';
        telephone?: string;
        contactType?: string;
        email?: string;
    }>;
}
/**
 * JSON-LD Person
 */
export interface JSONLDPerson {
    '@context'?: 'https://schema.org';
    '@type': 'Person';
    name: string;
    url?: string;
    image?: string;
    sameAs?: string[];
    jobTitle?: string;
    worksFor?: JSONLDOrganization;
}
/**
 * JSON-LD WebSite
 */
export interface JSONLDWebSite {
    '@context': 'https://schema.org';
    '@type': 'WebSite';
    name: string;
    url: string;
    description?: string;
    publisher?: JSONLDOrganization;
    potentialAction?: {
        '@type': 'SearchAction';
        target: string;
        'query-input': string;
    };
}
/**
 * JSON-LD WebPage
 */
export interface JSONLDWebPage {
    '@context': 'https://schema.org';
    '@type': 'WebPage';
    name: string;
    url: string;
    description?: string;
    breadcrumb?: JSONLDBreadcrumb;
    publisher?: JSONLDOrganization;
    inLanguage?: string;
}
/**
 * JSON-LD Product
 */
export interface JSONLDProduct {
    '@context': 'https://schema.org';
    '@type': 'Product';
    name: string;
    image?: string | string[];
    description?: string;
    brand?: string | JSONLDOrganization;
    offers?: {
        '@type': 'Offer';
        price: string;
        priceCurrency: string;
        availability?: string;
        url?: string;
    };
    aggregateRating?: {
        '@type': 'AggregateRating';
        ratingValue: number;
        reviewCount: number;
    };
}
/**
 * JSON-LD Event
 */
export interface JSONLDEvent {
    '@context': 'https://schema.org';
    '@type': 'Event';
    name: string;
    startDate: string;
    endDate?: string;
    location?: {
        '@type': 'Place';
        name: string;
        address?: string | {
            '@type': 'PostalAddress';
            streetAddress?: string;
            addressLocality?: string;
            addressRegion?: string;
            postalCode?: string;
            addressCountry?: string;
        };
    };
    description?: string;
    image?: string | string[];
    performer?: JSONLDPerson | JSONLDOrganization;
    organizer?: JSONLDOrganization;
    offers?: {
        '@type': 'Offer';
        price: string;
        priceCurrency: string;
        availability?: string;
        url?: string;
    };
}
/**
 * Generate HTML meta tags from SEO config
 */
export declare function generateMetaTags(config: SEOConfig): string;
/**
 * Generate SEO config from collection entry
 */
export declare function generateSEOFromEntry(entry: CollectionEntry, site: string, options?: {
    titleTemplate?: string;
    defaultImage?: string;
    siteName?: string;
    twitterHandle?: string;
}): SEOConfig;
/**
 * useSEO hook for PhilJS components
 */
export declare function useSEO(config: SEOConfig): {
    head: string;
};
//# sourceMappingURL=seo.d.ts.map