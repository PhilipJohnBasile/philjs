/**
 * Type definitions for analytics plugin
 */
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
 * User identification
 */
export interface UserIdentification {
    userId: string;
    traits?: Record<string, any>;
}
/**
 * E-commerce item
 */
export interface EcommerceItem {
    item_id: string;
    item_name: string;
    price: number;
    quantity?: number;
    item_category?: string;
    item_variant?: string;
    item_brand?: string;
}
/**
 * E-commerce transaction
 */
export interface EcommerceTransaction {
    transaction_id: string;
    value: number;
    currency?: string;
    tax?: number;
    shipping?: number;
    items?: EcommerceItem[];
    coupon?: string;
}
/**
 * Privacy settings
 */
export interface PrivacyOptions {
    /** Anonymize IP addresses */
    anonymizeIp?: boolean;
    /** Respect Do Not Track */
    respectDnt?: boolean;
    /** Cookie consent required */
    cookieConsent?: boolean;
    /** GDPR mode */
    gdprMode?: boolean;
    /** Cookie domain */
    cookieDomain?: string;
    /** Cookie expiration in days */
    cookieExpires?: number;
}
/**
 * Custom event tracking options
 */
export interface CustomEventOptions {
    /** Track page views automatically */
    pageViews?: boolean;
    /** Track clicks automatically */
    clicks?: boolean;
    /** Track form submissions */
    forms?: boolean;
    /** Track errors */
    errors?: boolean;
    /** Track performance metrics */
    performance?: boolean;
    /** Track scroll depth */
    scrollDepth?: boolean;
    /** Track time on page */
    timeOnPage?: boolean;
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
    options?: ProviderOptions;
    /** Enable debug mode */
    debug?: boolean;
    /** Disable in development */
    disableInDev?: boolean;
    /** Privacy settings */
    privacy?: PrivacyOptions;
    /** Custom event tracking */
    customEvents?: CustomEventOptions;
}
/**
 * Provider-specific options
 */
export interface ProviderOptions {
    send_page_view?: boolean;
    anonymize_ip?: boolean;
    cookie_domain?: string;
    cookie_expires?: number;
    cookie_prefix?: string;
    cookie_update?: boolean;
    cookie_flags?: string;
    domain?: string;
    apiHost?: string;
    hashMode?: boolean;
    trackLocalhost?: boolean;
    mixpanel_api_host?: string;
    app_host?: string;
    cdn?: string;
    cross_subdomain_cookie?: boolean;
    persistence?: "localStorage" | "cookie";
    persistence_name?: string;
    loaded?: (mixpanel: any) => void;
    posthog_api_host?: string;
    ui_host?: string;
    autocapture?: boolean;
    capture_pageview?: boolean;
    disable_session_recording?: boolean;
    session_recording?: Record<string, any>;
    scriptUrl?: string;
    websiteId?: string;
    hostUrl?: string;
    autoTrack?: boolean;
    site?: string;
    spa?: "auto" | "history" | "hash";
    honorDNT?: boolean;
    canonical?: boolean;
    [key: string]: any;
}
/**
 * Analytics provider interface
 */
export interface IAnalyticsProvider {
    /** Provider name */
    name: AnalyticsProvider;
    /** Initialize the provider */
    init(config: AnalyticsPluginConfig): void;
    /** Track an event */
    trackEvent(event: AnalyticsEvent): void;
    /** Track a page view */
    trackPageView(url?: string, title?: string): void;
    /** Identify a user */
    identifyUser(identification: UserIdentification): void;
    /** Set user properties */
    setUserProperties(properties: Record<string, any>): void;
    /** Track e-commerce transaction */
    trackTransaction?(transaction: EcommerceTransaction): void;
    /** Check if provider is loaded */
    isLoaded(): boolean;
}
/**
 * Analytics context for tracking
 */
export interface AnalyticsContext {
    sessionId: string;
    pageLoadTime: number;
    referrer: string;
    userAgent: string;
    language: string;
    screenResolution: string;
    viewport: string;
}
//# sourceMappingURL=types.d.ts.map