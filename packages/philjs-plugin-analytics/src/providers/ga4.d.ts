/**
 * Google Analytics 4 Provider
 */
import type { AnalyticsEvent, AnalyticsPluginConfig, EcommerceTransaction, IAnalyticsProvider, UserIdentification } from "../types.js";
declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}
export declare class GA4Provider implements IAnalyticsProvider {
    name: "ga4";
    private config;
    private loaded;
    init(config: AnalyticsPluginConfig): void;
    trackEvent(event: AnalyticsEvent): void;
    trackPageView(url?: string, title?: string): void;
    identifyUser(identification: UserIdentification): void;
    setUserProperties(properties: Record<string, any>): void;
    trackTransaction(transaction: EcommerceTransaction): void;
    isLoaded(): boolean;
    private loadScript;
    private isDNTEnabled;
}
//# sourceMappingURL=ga4.d.ts.map