/**
 * Client-side analytics runtime
 * This is the code that runs in the browser
 */
import type { AnalyticsEvent, AnalyticsPluginConfig, AnalyticsContext, EcommerceTransaction } from "./types.js";
/**
 * Analytics client singleton
 */
declare class AnalyticsClient {
    private provider;
    private config;
    private context;
    private initialized;
    private eventQueue;
    /**
     * Initialize analytics
     */
    init(config: AnalyticsPluginConfig): void;
    /**
     * Track custom event
     */
    trackEvent(name: string, properties?: Record<string, any>): void;
    /**
     * Track page view
     */
    trackPageView(url?: string, title?: string): void;
    /**
     * Identify user
     */
    identifyUser(userId: string, traits?: Record<string, any>): void;
    /**
     * Set user properties
     */
    setUserProperties(properties: Record<string, any>): void;
    /**
     * Track e-commerce transaction
     */
    trackTransaction(transaction: EcommerceTransaction): void;
    /**
     * Get analytics context
     */
    getContext(): AnalyticsContext | null;
    /**
     * Check if analytics is initialized
     */
    isInitialized(): boolean;
    /**
     * Setup automatic tracking
     */
    private setupAutoTracking;
    /**
     * Setup page view tracking for SPAs
     */
    private setupPageViewTracking;
    /**
     * Setup error tracking
     */
    private setupErrorTracking;
    /**
     * Setup click tracking
     */
    private setupClickTracking;
    /**
     * Setup form tracking
     */
    private setupFormTracking;
    /**
     * Setup performance tracking
     */
    private setupPerformanceTracking;
    /**
     * Process queued events
     */
    private processEventQueue;
    /**
     * Create analytics context
     */
    private createContext;
    /**
     * Get context properties to add to events
     */
    private getContextProperties;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Check if in development mode
     */
    private isDevelopment;
    /**
     * Check if DNT is enabled
     */
    private isDNTEnabled;
}
export declare const analytics: AnalyticsClient;
export declare const trackEvent: (name: string, properties?: Record<string, any>) => void;
export declare const trackPageView: (url?: string, title?: string) => void;
export declare const identifyUser: (userId: string, traits?: Record<string, any>) => void;
export declare const setUserProperties: (properties: Record<string, any>) => void;
export declare const trackTransaction: (transaction: EcommerceTransaction) => void;
export type { AnalyticsEvent, AnalyticsPluginConfig, EcommerceTransaction };
//# sourceMappingURL=client.d.ts.map