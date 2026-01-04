/**
 * PhilJS SEO Plugin
 *
 * Comprehensive SEO plugin with meta tags, OpenGraph, Twitter Cards,
 * JSON-LD structured data, sitemap generation, and robots.txt support.
 */
import type { Plugin } from '@philjs/core/plugin-system';
import type { SEOPluginConfig } from './types.js';
/**
 * Create SEO plugin
 */
export declare function createSEOPlugin(userConfig?: SEOPluginConfig): Plugin;
/**
 * Default export
 */
export default createSEOPlugin;
/**
 * Re-export types
 */
export type { SEOPluginConfig, PageSEO, MetaTags, OpenGraphTags, TwitterTags, JsonLd, JsonLdType, SitemapEntry, SitemapConfig, RobotsTxtConfig, RobotsDirectives, OpenGraphImage, OrganizationJsonLd, WebSiteJsonLd, ArticleJsonLd, ProductJsonLd, BreadcrumbJsonLd, FAQJsonLd, } from './types.js';
/**
 * Re-export head utilities
 */
export { generateMetaTags, generateOpenGraphTags, generateTwitterTags, generateJsonLd, generateSEOHead, mergeSEO, updateHead, createBreadcrumbs, createFAQ, createOrganization, createWebSite, } from './head.js';
//# sourceMappingURL=index.d.ts.map