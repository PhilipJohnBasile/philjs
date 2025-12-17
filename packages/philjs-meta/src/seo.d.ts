/**
 * PhilJS Meta - SEO Helpers
 *
 * OpenGraph, Twitter Cards, JSON-LD, and more
 */
import type { OpenGraphConfig, TwitterConfig, JSONLDConfig, MetaConfig } from './types';
/**
 * SEO Component - All-in-one SEO meta tags
 */
export declare function SEO(props: {
    config?: MetaConfig;
    openGraph?: OpenGraphConfig;
    twitter?: TwitterConfig;
    jsonLd?: JSONLDConfig | JSONLDConfig[];
}): import("philjs-core").JSXElement;
/**
 * Basic Meta Tags
 */
export declare function BasicMeta(props: {
    config: MetaConfig;
}): import("philjs-core").JSXElement;
/**
 * OpenGraph Meta Tags
 */
export declare function OpenGraph(props: {
    config: OpenGraphConfig;
}): import("philjs-core").JSXElement;
/**
 * Twitter Card Meta Tags
 */
export declare function TwitterCard(props: {
    config: TwitterConfig;
}): import("philjs-core").JSXElement;
/**
 * JSON-LD Structured Data
 */
export declare function JSONLD(props: {
    data: JSONLDConfig | JSONLDConfig[];
}): import("philjs-core").JSXElement;
/**
 * Favicon Links
 */
export declare function Favicons(props: {
    favicon?: string;
    apple?: string;
    manifest?: string;
}): import("philjs-core").JSXElement;
/**
 * Alternate Language Links
 */
export declare function AlternateLanguages(props: {
    languages: Array<{
        lang: string;
        url: string;
    }>;
    default?: string;
}): import("philjs-core").JSXElement;
/**
 * Preconnect Links
 */
export declare function Preconnect(props: {
    domains: string[];
    crossOrigin?: boolean;
}): import("philjs-core").JSXElement;
/**
 * DNS Prefetch Links
 */
export declare function DNSPrefetch(props: {
    domains: string[];
}): import("philjs-core").JSXElement;
//# sourceMappingURL=seo.d.ts.map