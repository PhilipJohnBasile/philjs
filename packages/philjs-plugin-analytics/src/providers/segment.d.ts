/**
 * Segment Analytics Provider
 */
import type { AnalyticsEvent, AnalyticsPluginConfig, EcommerceTransaction, IAnalyticsProvider, UserIdentification } from "../types.js";
declare global {
    interface Window {
        analytics: any;
    }
}
export declare class SegmentProvider implements IAnalyticsProvider {
    name: "segment";
    private config;
    private loaded;
    init(config: AnalyticsPluginConfig): void;
    trackEvent(event: AnalyticsEvent): void;
    trackPageView(url?: string, title?: string): void;
    identifyUser(identification: UserIdentification): void;
    setUserProperties(properties: Record<string, any>): void;
    trackTransaction(transaction: EcommerceTransaction): void;
    /**
     * Track group membership (companies, organizations)
     */
    group(groupId: string, traits?: Record<string, any>): void;
    /**
     * Create an alias for a user
     */
    alias(userId: string, previousId?: string): void;
    /**
     * Reset anonymous user data
     */
    reset(): void;
    isLoaded(): boolean;
    private loadScript;
    private isDNTEnabled;
}
//# sourceMappingURL=segment.d.ts.map