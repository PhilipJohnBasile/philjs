/**
 * PhilJS Analytics Plugin
 * Universal analytics integration for multiple providers
 */
import type { Plugin } from "@philjs/core/plugin-system";
/**
 * Analytics provider types
 */
export type AnalyticsProvider = "google-analytics" | "ga4" | "plausible" | "mixpanel" | "amplitude" | "segment" | "posthog" | "umami" | "fathom";
/**
 * Analytics event
 */
export interface AnalyticsEvent {
    name: string;
    properties?: Record<string, any>;
    timestamp?: number;
}
/**
 * Analytics plugin configuration
 */
export interface AnalyticsPluginConfig {
    /** Analytics provider */
    provider: AnalyticsProvider;
    /** Tracking ID or API key */
    trackingId: string;
    /** Additional provider-specific options */
    options?: Record<string, any>;
    /** Enable debug mode */
    debug?: boolean;
    /** Disable in development */
    disableInDev?: boolean;
    /** Privacy settings */
    privacy?: {
        /** Anonymize IP addresses */
        anonymizeIp?: boolean;
        /** Respect Do Not Track */
        respectDnt?: boolean;
        /** Cookie consent required */
        cookieConsent?: boolean;
    };
    /** Custom event tracking */
    customEvents?: {
        /** Track page views automatically */
        pageViews?: boolean;
        /** Track clicks automatically */
        clicks?: boolean;
        /** Track form submissions */
        forms?: boolean;
        /** Track errors */
        errors?: boolean;
    };
}
/**
 * Create Analytics plugin
 */
export declare function createAnalyticsPlugin(userConfig: AnalyticsPluginConfig): Plugin;
/**
 * Default export
 */
export default createAnalyticsPlugin;
/**
 * Analytics utility functions
 */
export declare const analyticsUtils: {
    /**
     * Check if user has DNT enabled
     */
    hasDNT(): boolean;
    /**
     * Generate a unique session ID
     */
    generateSessionId(): string;
    /**
     * Get user agent info
     */
    getUserAgent(): {
        userAgent?: never;
        language?: never;
        platform?: never;
        vendor?: never;
    } | {
        userAgent: string;
        language: string;
        platform: string;
        vendor: string;
    };
    /**
     * Get page metadata
     */
    getPageMetadata(): {
        url?: never;
        path?: never;
        search?: never;
        hash?: never;
        title?: never;
        referrer?: never;
    } | {
        url: string;
        path: string;
        search: string;
        hash: string;
        title: string;
        referrer: string;
    };
};
/**
 * Export types
 */
export type { UserIdentification, EcommerceItem, EcommerceTransaction, PrivacyOptions, CustomEventOptions, ProviderOptions, IAnalyticsProvider, AnalyticsContext, } from "./types.js";
//# sourceMappingURL=index.d.ts.map