/**
 * PhilJS SEO Plugin - Head Management
 *
 * Utilities for managing document head tags including meta, OpenGraph,
 * Twitter Cards, and JSON-LD structured data.
 */
import type { MetaTags, OpenGraphTags, TwitterTags, JsonLd, PageSEO, RobotsDirectives } from './types.js';
/**
 * Generate meta tag HTML
 */
export declare function generateMetaTag(attrs: Record<string, string | undefined>): string;
/**
 * Generate link tag HTML
 */
export declare function generateLinkTag(attrs: Record<string, string | undefined>): string;
/**
 * Generate robots meta content
 */
export declare function generateRobotsContent(robots: RobotsDirectives): string;
/**
 * Generate meta tags HTML
 */
export declare function generateMetaTags(meta: MetaTags): string[];
/**
 * Generate OpenGraph tags HTML
 */
export declare function generateOpenGraphTags(og: OpenGraphTags): string[];
/**
 * Generate Twitter Card tags HTML
 */
export declare function generateTwitterTags(twitter: TwitterTags): string[];
/**
 * Generate JSON-LD script tag
 */
export declare function generateJsonLd(data: JsonLd | JsonLd[]): string;
/**
 * Generate all SEO head tags
 */
export declare function generateSEOHead(seo: PageSEO): string;
/**
 * Merge SEO configurations (later configs override earlier ones)
 */
export declare function mergeSEO(...configs: (PageSEO | undefined)[]): PageSEO;
/**
 * Update document head with SEO tags (client-side)
 */
export declare function updateHead(seo: PageSEO): void;
/**
 * Create breadcrumb JSON-LD from path segments
 */
export declare function createBreadcrumbs(items: Array<{
    name: string;
    url?: string;
}>): JsonLd;
/**
 * Create FAQ JSON-LD from Q&A pairs
 */
export declare function createFAQ(questions: Array<{
    question: string;
    answer: string;
}>): JsonLd;
/**
 * Create Organization JSON-LD
 */
export declare function createOrganization(org: {
    name: string;
    url?: string;
    logo?: string;
    sameAs?: string[];
}): JsonLd;
/**
 * Create WebSite JSON-LD with search action
 */
export declare function createWebSite(site: {
    name: string;
    url: string;
    searchUrl?: string;
}): JsonLd;
//# sourceMappingURL=head.d.ts.map